import io
import re
import hashlib
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.staging import StagingRecord, StagingStreamType, StagingStatus
from app.schemas.staging import StreamAIngestResponse


def compute_bytes_sha256(content: bytes) -> str:
    """Computes SHA-256 checksum for binary file uploads to guarantee deduplication."""
    return hashlib.sha256(content).hexdigest()


def extract_majors_from_text(raw_text: str, default_page: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Parses Vietnamese MOET circular text (e.g. Thông tư 09/2022/TT-BGDĐT) using
    regular expressions designed for Vietnamese educational nomenclatures.
    Handles column shifts, page breaks, and whitespace abnormalities.
    """
    results: List[Dict[str, Any]] = []
    
    # Matches Level-IV MOET major codes: 7 digits starting with 7 (e.g. 7480201)
    # Followed by Vietnamese major name and optional admission block codes (e.g. A00, A01, D01)
    major_pattern = re.compile(
        r'(?P<code>7\d{6})\s+(?P<name>[A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ][^\n\r0-9]{3,80})',
        re.UNICODE
    )
    
    # Standard admission blocks in Vietnam: A00, A01, B00, C00, D01, D07, etc.
    block_pattern = re.compile(r'\b([A-D]\d{2})\b')

    lines = raw_text.splitlines()
    for line in lines:
        match = major_pattern.search(line)
        if match:
            code = match.group("code").strip()
            name = match.group("name").strip()
            # Clean trailing punctuation or trailing block letters if matched
            name = re.sub(r'[\t\s]+', ' ', name).strip(" ,.-;")
            
            blocks = block_pattern.findall(line)
            if not blocks:
                # Default standard admission blocks for general higher education if unlisted on line
                blocks = ["A00", "A01", "D01"]
            
            results.append({
                "major_code": code,
                "major_name": name,
                "admission_blocks": list(set(blocks)),
                "source_page": default_page or "Phụ lục II"
            })
            
    return results


def parse_pdf_stream(pdf_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Extracts structured major profiles from official MOET PDF circulars.
    Uses pypdf for deterministic multi-page extraction.
    """
    import pypdf
    extracted_majors: List[Dict[str, Any]] = []
    seen_codes = set()
    
    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    for page_num, page in enumerate(reader.pages, start=1):
        page_text = page.extract_text() or ""
        majors_on_page = extract_majors_from_text(page_text, default_page=f"Trang {page_num}")
        for item in majors_on_page:
            if item["major_code"] not in seen_codes:
                seen_codes.add(item["major_code"])
                extracted_majors.append(item)
                
    return extracted_majors


def parse_excel_stream(excel_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Parses official MOET Excel workbooks, accurately handling merged cells,
    header variations, and column offsets.
    """
    import openpyxl
    
    wb = openpyxl.load_workbook(io.BytesIO(excel_bytes), data_only=True)
    extracted_majors: List[Dict[str, Any]] = []
    seen_codes = set()
    
    for sheet_name in wb.sheetnames:
        sheet = wb[sheet_name]
        
        # Scan all rows looking for 7-digit major codes
        for row in sheet.iter_rows(values_only=True):
            if not row:
                continue
            
            row_str = " ".join([str(cell) for cell in row if cell is not None])
            
            # Check for 7-digit Level-IV major code
            code_match = re.search(r'\b(7\d{6})\b', row_str)
            if code_match:
                code = code_match.group(1)
                if code in seen_codes:
                    continue
                
                # Extract major name from row cells
                cells = [str(c).strip() for c in row if c is not None and str(c).strip()]
                name = ""
                for c in cells:
                    # Filter out purely numeric or short codes
                    if c != code and not re.match(r'^\d+$', c) and len(c) > 3 and not re.match(r'^[A-D]\d{2}$', c):
                        name = c
                        break
                
                if not name:
                    name = f"Ngành đào tạo chuẩn {code}"
                    
                # Extract subject combinations
                block_matches = re.findall(r'\b([A-D]\d{2})\b', row_str)
                blocks = list(set(block_matches)) if block_matches else ["A00", "A01", "D01"]
                
                seen_codes.add(code)
                extracted_majors.append({
                    "major_code": code,
                    "major_name": name,
                    "admission_blocks": blocks,
                    "source_page": f"Sheet: {sheet_name}"
                })
                
    return extracted_majors


async def ingest_moet_circular(
    db: AsyncSession,
    file_bytes: bytes,
    file_name: str,
    source_title: str = "Thông tư 09/2022/TT-BGDĐT",
    source_url: str = "https://moet.gov.vn"
) -> StreamAIngestResponse:
    """
    Stream A Ingestion Workflow:
    1. Checks SHA-256 content_hash for deduplication (OWASP / Proposal NFR05).
    2. Parses PDF or Excel content to extract official MOET Level-IV majors and admission blocks.
    3. Staged into PostgreSQL staging_records (status = PENDING) for Admin review.
    """
    file_hash = compute_bytes_sha256(file_bytes)
    
    # Check deduplication on file-level hash
    existing_check = await db.execute(
        select(StagingRecord).where(StagingRecord.content_hash == file_hash)
    )
    if existing_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Duplicate document detected. File with SHA-256 hash {file_hash[:12]}... is already staged."
        )

    # Parse by extension
    lower_name = file_name.lower()
    if lower_name.endswith(".pdf"):
        parsed_items = parse_pdf_stream(file_bytes)
    elif lower_name.endswith(".xlsx") or lower_name.endswith(".xls"):
        parsed_items = parse_excel_stream(file_bytes)
    else:
        # Fallback to plain text search
        try:
            text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text = file_bytes.decode("latin-1", errors="ignore")
        parsed_items = extract_majors_from_text(text)

    if not parsed_items:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No valid Level-IV MOET major codes (7xxxxxx) could be extracted from the uploaded document."
        )

    staged_record_ids: List[uuid.UUID] = []
    
    # Save individual staging records per major profile for granular Human-in-the-Loop review
    for item in parsed_items:
        code = item["major_code"]
        # Generate deterministic child hash combining file hash and major code
        item_hash = hashlib.sha256(f"{file_hash}:{code}".encode("utf-8")).hexdigest()
        
        # Check if this specific item hash exists
        item_existing = await db.execute(
            select(StagingRecord).where(StagingRecord.content_hash == item_hash)
        )
        if item_existing.scalar_one_or_none():
            continue

        record = StagingRecord(
            id=uuid.uuid4(),
            stream_type=StagingStreamType.STREAM_A_MOET,
            status=StagingStatus.PENDING,
            major_code=code,
            content_hash=item_hash,
            raw_content=f"{code} - {item['major_name']} | Tổ hợp: {', '.join(item['admission_blocks'])}",
            extracted_payload={
                "major_code": code,
                "major_name": item["major_name"],
                "admission_blocks": item["admission_blocks"],
                "file_origin": file_name,
                "source_title": source_title
            },
            source_title=source_title,
            source_url=source_url,
            source_page=item.get("source_page", "Phụ lục chuẩn"),
            retrieved_at=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc)
        )
        db.add(record)
        staged_record_ids.append(record.id)

    # Also store the master record with the exact file_hash so re-uploading the file triggers 409 Conflict
    master_record = StagingRecord(
        id=uuid.uuid4(),
        stream_type=StagingStreamType.STREAM_A_MOET,
        status=StagingStatus.PENDING,
        major_code=None,
        content_hash=file_hash,
        raw_content=f"Upload file {file_name}: {len(parsed_items)} majors extracted",
        extracted_payload={
            "file_name": file_name,
            "total_extracted": len(parsed_items),
            "majors_summary": [f"{item['major_code']}: {item['major_name']}" for item in parsed_items[:10]],
            "source_title": source_title
        },
        source_title=source_title,
        source_url=source_url,
        source_page=f"Tài liệu {file_name}",
        retrieved_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc)
    )
    db.add(master_record)
    staged_record_ids.append(master_record.id)

    await db.commit()

    return StreamAIngestResponse(
        total_parsed=len(parsed_items),
        records_staged=len(staged_record_ids),
        content_hash=file_hash,
        staged_record_ids=staged_record_ids,
        summary=f"Trích xuất thành công {len(parsed_items)} ngành cấp IV từ {file_name}. Đã lưu vào staging_records chờ duyệt."
    )
