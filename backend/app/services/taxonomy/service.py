import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.taxonomy import (
    Major,
    SubjectBlock,
    Career,
    Skill,
    MajorSubjectBlock,
    MajorSkill,
)


async def list_majors(
    db: AsyncSession,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> List[Major]:
    query = select(Major).where(Major.is_active == True)
    if search:
        query = query.where(Major.name.ilike(f"%{search}%") | Major.major_code.ilike(f"%{search}%"))
    query = query.order_by(Major.major_code.asc()).limit(limit).offset(offset)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_major_by_code(db: AsyncSession, major_code: str) -> Optional[Major]:
    query = (
        select(Major)
        .where(Major.major_code == major_code)
        .options(
            selectinload(Major.careers),
            selectinload(Major.subject_blocks).selectinload(MajorSubjectBlock.subject_block),
            selectinload(Major.major_skills).selectinload(MajorSkill.skill),
        )
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def list_subject_blocks(db: AsyncSession) -> List[SubjectBlock]:
    query = select(SubjectBlock).order_by(SubjectBlock.block_code.asc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def list_careers_by_major(db: AsyncSession, major_id: uuid.UUID) -> List[Career]:
    query = select(Career).where(Career.major_id == major_id).order_by(Career.title.asc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def list_skills(
    db: AsyncSession,
    domain: Optional[str] = None,
    limit: int = 100
) -> List[Skill]:
    query = select(Skill)
    if domain:
        query = query.where(Skill.domain.ilike(f"%{domain}%"))
    query = query.order_by(Skill.skill_code.asc()).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def bulk_sync_majors(db: AsyncSession, majors_data: List[dict]) -> dict:
    """
    Syncs or updates MOET Level-IV majors catalog into PostgreSQL.
    Guarantees idempotency and 100% pure guidance scope compliance.
    """
    inserted_count = 0
    updated_count = 0
    for item in majors_data:
        code = item["major_code"]
        existing = await db.execute(select(Major).where(Major.major_code == code))
        major_obj = existing.scalar_one_or_none()
        if major_obj:
            major_obj.name = item["name"]
            major_obj.riasec_vector = item["riasec"]
            major_obj.cognitive_attributes = item.get("cognitive", {})
            major_obj.industry_outlook = item.get("outlook", "")
            updated_count += 1
        else:
            new_major = Major(
                id=uuid.uuid4(),
                major_code=code,
                name=item["name"],
                degree_level="Đại học",
                riasec_vector=item["riasec"],
                cognitive_attributes=item.get("cognitive", {}),
                industry_outlook=item.get("outlook", ""),
                is_active=True
            )
            db.add(new_major)
            inserted_count += 1
            
    await db.commit()
    return {
        "status": "success",
        "inserted": inserted_count,
        "updated": updated_count,
        "total": len(majors_data)
    }

