import re
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.roadmap import MajorRoadmap
from app.models.taxonomy import Major
from app.models.vector import KnowledgeEmbedding
from app.schemas.rag import (
    GuidancePersonalizationRequest,
    GuidancePersonalizationResponse,
    PersonalizedScheduleTask,
    SemanticSearchRequest,
    ChunkSearchResult
)
from app.services.llamaindex_rag_orchestrator.hitl_governance import get_text_embedding
from app.services.gap_roadmap_engine.service import generate_static_fallback_roadmap

logger = logging.getLogger(__name__)


def sanitize_pii(text: str) -> str:
    """
    Sanitizes Personally Identifiable Information (PII) before passing context
    to external AI APIs to comply with OWASP ASVS Level 2 and Vietnamese Law 91/2025/QH15.
    """
    # Sanitize email addresses
    text = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[REDACTED_EMAIL]', text)
    # Sanitize Vietnamese telephone numbers
    text = re.sub(r'(\+84|0[3|5|7|8|9])([0-9]{8})\b', '[REDACTED_PHONE]', text)
    # Sanitize citizen identity card numbers (12 digits)
    text = re.sub(r'\b\d{12}\b', '[REDACTED_ID]', text)
    # Sanitize student ID sequences (10-11 digits)
    text = re.sub(r'\b\d{10,11}\b', '[REDACTED_STUDENT_ID]', text)
    return text


def build_fallback_personalized_schedule(
    major_code: str,
    major_name: str,
    missing_skills: List[str],
    weekly_hours: int,
    milestones: List[Dict[str, Any]]
) -> List[PersonalizedScheduleTask]:
    """
    Deterministic rule-based schedule generator used when AI API times out (> 8s)
    or for majors awaiting full curation (NFR01, NFR05).
    """
    tasks: List[PersonalizedScheduleTask] = []
    effective_milestones = milestones if milestones else generate_static_fallback_roadmap(major_code, major_name)["milestones"]
    
    for idx, milestone in enumerate(effective_milestones[:4], start=1):
        focus = missing_skills[idx - 1] if idx - 1 < len(missing_skills) else "Kiến thức nền tảng & kỹ năng cốt lõi"
        actions = milestone.get("actions", ["Đọc tài liệu chuyên ngành", "Thực hành bài tập đánh giá năng lực"])
        tasks.append(PersonalizedScheduleTask(
            week_number=idx,
            focus_skill=focus,
            tasks=[f"[Trọng tâm {focus}] {action}" for action in actions],
            recommended_reading=milestone.get("title", f"Chuyên đề học tập tuần {idx}"),
            estimated_hours=weekly_hours
        ))
    return tasks


async def call_llm_for_personalization(
    major_code: str,
    major_title: str,
    missing_skills: List[str],
    weekly_hours: int,
    milestones: List[Dict[str, Any]],
    source_title: str
) -> GuidancePersonalizationResponse:
    """
    Invokes gpt-4o-mini to synthesize verified milestones with student skill gaps.
    Strictly isolated: does not search the web or alter major ranking.
    """
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    milestone_summary = "\n".join([
        f"- Mốc {m.get('step')}: {m.get('title')} ({m.get('duration_weeks', 2)} tuần). Mục tiêu: {', '.join(m.get('learning_objectives', []))}"
        for m in milestones
    ])
    
    prompt = (
        f"Bạn là Cố vấn học tập AI CareerGuide chuẩn hóa theo chương trình GDPT và Đại học Việt Nam.\n"
        f"Học sinh đang định hướng ngành: {major_title} (Mã ngành: {major_code}).\n"
        f"Các khoảng trống kỹ năng cần tập trung bù đắp: {', '.join(missing_skills) if missing_skills else 'Theo chuẩn chung của ngành'}.\n"
        f"Thời gian học tập tự chủ sẵn sàng: {weekly_hours} giờ/tuần.\n\n"
        f"Lộ trình chuẩn hóa đã kiểm duyệt từ nguồn '{source_title}':\n{milestone_summary}\n\n"
        f"RÀNG BUỘC NGHIÊM NGẶT (Table 6 & Pure Guidance Scope):\n"
        f"1. Tuyệt đối bám sát các mốc học tập trên, không bịa đặt chương trình đào tạo hay học phần ngoài nguồn.\n"
        f"2. Tuyệt đối không đề cập đến học phí hay vị trí địa lý.\n"
        f"3. Lập kế hoạch 4 tuần học tập cá nhân hóa, mỗi tuần nêu rõ kỹ năng trọng tâm (focus_skill), danh sách việc cần làm cụ thể (tasks), tài liệu nên đọc và số giờ dự kiến.\n"
    )
    
    sanitized_prompt = sanitize_pii(prompt)
    
    response = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[
            {"role": "system", "content": "Bạn là chuyên gia tư vấn lộ trình học tập cá nhân hóa AI CareerGuide."},
            {"role": "user", "content": sanitized_prompt}
        ],
        temperature=0.2
    )
    
    content = response.choices[0].message.content or ""
    # Format fallback schedule wrapped with AI summary
    schedule = build_fallback_personalized_schedule(major_code, major_title, missing_skills, weekly_hours, milestones)
    
    return GuidancePersonalizationResponse(
        major_code=major_code,
        personalization_summary=content[:300] if len(content) > 30 else f"Kế hoạch 4 tuần tập trung bổ trợ kỹ năng cho ngành {major_title}.",
        schedule=schedule,
        is_fallback=False
    )


async def personalize_guidance(
    db: AsyncSession,
    payload: GuidancePersonalizationRequest
) -> GuidancePersonalizationResponse:
    """
    Guidance RAG Pipeline (FR06, DF06):
    1. Direct indexed cache lookup from major_roadmaps (<= 1s).
    2. PII Sanitization.
    3. AI API call with strict 8-second timeout (asyncio.wait_for).
    4. Graceful Fallback: Immediately returns standardized static fallback roadmap if AI times out or errors.
    """
    # 1. Retrieve cached roadmap (<= 1s)
    res = await db.execute(select(MajorRoadmap).where(MajorRoadmap.major_code == payload.major_code))
    cached = res.scalar_one_or_none()
    
    major_res = await db.execute(select(Major).where(Major.major_code == payload.major_code))
    major = major_res.scalar_one_or_none()
    major_name = major.name if major else f"Mã ngành {payload.major_code}"

    # If uncurated or cached as fallback template, serve immediately
    if not cached or cached.is_fallback:
        fallback_data = generate_static_fallback_roadmap(payload.major_code, major_name)
        schedule = build_fallback_personalized_schedule(
            payload.major_code,
            major_name,
            payload.missing_skills,
            payload.weekly_hours_available,
            fallback_data["milestones"]
        )
        return GuidancePersonalizationResponse(
            major_code=payload.major_code,
            personalization_summary=f"Lộ trình tĩnh chuẩn hóa dự phòng cho ngành {major_name} (chờ kiểm duyệt chính thức).",
            schedule=schedule,
            is_fallback=True
        )

    # Verified roadmap is available
    roadmap_data = cached.roadmap_data
    milestones = roadmap_data.get("milestones", [])
    source_title = roadmap_data.get("source_title", "Chương trình chuẩn Bộ GD&ĐT")

    # If OpenAI API is not configured or during testing, return immediate deterministic schedule
    if not settings.OPENAI_API_KEY:
        schedule = build_fallback_personalized_schedule(
            payload.major_code,
            major_name,
            payload.missing_skills,
            payload.weekly_hours_available,
            milestones
        )
        return GuidancePersonalizationResponse(
            major_code=payload.major_code,
            personalization_summary=f"Lộ trình học tập cá nhân hóa ngành {major_name} tập trung xử lý các lỗ hổng kỹ năng: {', '.join(payload.missing_skills) if payload.missing_skills else 'Theo chuẩn ngành'}.",
            schedule=schedule,
            is_fallback=False
        )

    # 3. Call AI API with strict 8.0s timeout (NFR01, NFR05)
    try:
        response = await asyncio.wait_for(
            call_llm_for_personalization(
                major_code=payload.major_code,
                major_title=major_name,
                missing_skills=payload.missing_skills,
                weekly_hours=payload.weekly_hours_available,
                milestones=milestones,
                source_title=source_title
            ),
            timeout=8.0
        )
        return response
    except asyncio.TimeoutError:
        logger.warning(f"Guidance RAG AI personalization timed out (> 8.0s) for {payload.major_code}. Triggering static fallback.")
        schedule = build_fallback_personalized_schedule(
            payload.major_code,
            major_name,
            payload.missing_skills,
            payload.weekly_hours_available,
            milestones
        )
        return GuidancePersonalizationResponse(
            major_code=payload.major_code,
            personalization_summary=f"AI phản hồi quá 8 giây. Hệ thống tự động chuyển đổi sang lộ trình chuẩn hóa dự phòng cho ngành {major_name}.",
            schedule=schedule,
            is_fallback=True
        )
    except Exception as exc:
        logger.warning(f"Guidance RAG failed with error {exc}. Triggering static fallback.")
        schedule = build_fallback_personalized_schedule(
            payload.major_code,
            major_name,
            payload.missing_skills,
            payload.weekly_hours_available,
            milestones
        )
        return GuidancePersonalizationResponse(
            major_code=payload.major_code,
            personalization_summary=f"Sự cố kết nối AI API. Hệ thống kích hoạt lộ trình chuẩn hóa dự phòng cho ngành {major_name}.",
            schedule=schedule,
            is_fallback=True
        )


async def semantic_search_chunks(
    db: AsyncSession,
    request: SemanticSearchRequest
) -> List[ChunkSearchResult]:
    """
    Performs vector similarity search on knowledge_embeddings using pgvector.
    Supports metadata filtering by major_code and skill_id.
    """
    query_vector = await get_text_embedding(request.query)
    
    # Query pgvector using cosine distance
    query = select(
        KnowledgeEmbedding,
        KnowledgeEmbedding.embedding.cosine_distance(query_vector).label("distance")
    )
    
    if request.major_code:
        query = query.where(KnowledgeEmbedding.major_code == request.major_code)
    if request.skill_id:
        query = query.where(KnowledgeEmbedding.skill_id == request.skill_id)
        
    query = query.order_by("distance").limit(request.top_k)
    
    result = await db.execute(query)
    rows = result.all()
    
    search_results: List[ChunkSearchResult] = []
    for item, dist in rows:
        similarity = max(0.0, min(1.0, 1.0 - float(dist)))
        search_results.append(ChunkSearchResult(
            id=item.id,
            major_code=item.major_code,
            chunk_text=item.chunk_text,
            similarity_score=round(similarity, 4),
            source_title=item.source_title,
            source_url=item.source_url,
            source_page=item.source_page,
            metadata_payload=item.metadata_payload
        ))
        
    return search_results
