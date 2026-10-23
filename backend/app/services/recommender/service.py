import time
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.taxonomy import Major, MajorSubjectBlock, MajorSkill, Skill, SkillPrerequisite
from app.models.assessment import StudentAssessment, StudentGrade, StudentDiagnosticTest
from app.models.recommender import RecommendationHistory
from app.core.config import settings
from app.schemas.recommender import (
    RecommendationRequest,
    MajorRecommendationItem,
    RecommendationResponse,
)
from app.services.recommender.engine import (
    calculate_riasec_cosine_similarity,
    evaluate_academic_readiness_for_major,
    calculate_cognitive_preference_match,
    calculate_3pillar_hybrid_score,
    generate_xai_top_supporting_factors,
)

# Backwards compatibility aliases
compute_cosine_similarity = calculate_riasec_cosine_similarity
compute_cognitive_match = calculate_cognitive_preference_match
from app.services.gap_roadmap_engine.gap_engine import (
    infer_mastered_skills_from_grades,
    infer_mastered_skills_from_diagnostic_tests,
    analyze_competency_gaps,
)


async def calculate_3pillar_recommendations(
    db: AsyncSession,
    user_id: uuid.UUID,
    payload: RecommendationRequest
) -> RecommendationResponse:
    """
    Executes the deterministic 3-Pillar Holistic Hybrid Recommendation Engine (NFR04, FR04).
    Guarantees performance <= 2 seconds across 80+ Level-IV MOET majors (NFR01).
    Pure Guidance Scope: strictly excludes tuition and geographic factors (NFR02).
    """
    start_time = time.perf_counter()

    # 1. Fetch Student Assessment Profile
    assess_res = await db.execute(
        select(StudentAssessment).where(StudentAssessment.user_id == user_id)
    )
    assessment = assess_res.scalar_one_or_none()

    # 2. Fetch Student Grades & Normalized Z-Scores
    grade_res = await db.execute(
        select(StudentGrade).where(StudentGrade.user_id == user_id).order_by(StudentGrade.created_at.desc())
    )
    grade = grade_res.scalar_one_or_none()

    # 3. Fetch Optional Diagnostic Skill Checks
    diag_res = await db.execute(
        select(StudentDiagnosticTest).where(StudentDiagnosticTest.user_id == user_id)
    )
    diagnostic_tests = list(diag_res.scalars().all())

    # Extract vectors & traits safely
    student_riasec = assessment.riasec_scores if assessment and assessment.riasec_scores else {
        "R": 0.5, "I": 0.5, "A": 0.5, "S": 0.5, "E": 0.5, "C": 0.5
    }
    student_pref = assessment.cognitive_preferences if assessment and assessment.cognitive_preferences else {}
    student_zscores = grade.computed_block_zscores if grade and grade.computed_block_zscores else {}
    raw_grades = grade.grades_by_subject if grade and grade.grades_by_subject else {}

    # Infer mastered skills from both grades and diagnostic tests
    mastered_skills = infer_mastered_skills_from_grades(raw_grades)
    diag_mastered = infer_mastered_skills_from_diagnostic_tests([
        {"skill_code": d.skill_code, "score": d.score, "is_passed": d.is_passed}
        for d in diagnostic_tests
    ])
    mastered_skills.update(diag_mastered)

    # 4. Resolve Weights (3-Pillar Hybrid Model)
    w_riasec = settings.WEIGHT_RIASEC
    w_academic = settings.WEIGHT_ACADEMIC
    w_pref = settings.WEIGHT_PREFERENCE
    if payload.custom_weights:
        w_riasec = float(payload.custom_weights.get("w_riasec", w_riasec))
        w_academic = float(payload.custom_weights.get("w_academic", w_academic))
        w_pref = float(payload.custom_weights.get("w_preference", w_pref))

    # 5. Fetch Skill Prerequisites Hierarchy Map
    prereq_res = await db.execute(
        select(SkillPrerequisite).options(
            selectinload(SkillPrerequisite.skill),
            selectinload(SkillPrerequisite.prerequisite_skill)
        )
    )
    all_prereqs = list(prereq_res.scalars().all())
    prereq_map: Dict[str, List[str]] = {}
    for p in all_prereqs:
        target_c = p.skill.skill_code if p.skill else ""
        source_c = p.prerequisite_skill.skill_code if p.prerequisite_skill else ""
        if target_c and source_c:
            prereq_map.setdefault(target_c, []).append(source_c)

    # 6. Retrieve all Active Majors with Admitted Subject Blocks and Required Skills
    majors_query = select(Major).where(Major.is_active == True).options(
        selectinload(Major.subject_blocks).selectinload(MajorSubjectBlock.subject_block),
        selectinload(Major.major_skills).selectinload(MajorSkill.skill)
    )
    majors_res = await db.execute(majors_query)
    majors: List[Major] = list(majors_res.scalars().all())

    scored_items: List[MajorRecommendationItem] = []

    for major in majors:
        # --- PILLAR 1: Holland RIASEC via Cosine Similarity ---
        score_riasec = calculate_riasec_cosine_similarity(student_riasec, major.riasec_vector)

        # --- PILLAR 2: Academic Readiness via Z-Score Normalization ---
        admitted_codes = [
            msb.subject_block.block_code for msb in major.subject_blocks if msb.subject_block
        ]
        score_academic, best_block, block_breakdown = evaluate_academic_readiness_for_major(
            admitted_codes, student_zscores
        )

        # --- PILLAR 3: Cognitive Preferences via Rule-Based Matching ---
        score_pref = calculate_cognitive_preference_match(student_pref, major.cognitive_attributes)

        # --- HOLISTIC 3-PILLAR SCORE ---
        overall_score, weights_dict = calculate_3pillar_hybrid_score(
            score_riasec=score_riasec,
            score_academic=score_academic,
            score_preference=score_pref,
            w_riasec=w_riasec,
            w_academic=w_academic,
            w_preference=w_pref
        )

        # --- COMPETENCY GAP ANALYSIS ---
        major_skills_list = [
            {
                "skill_code": ms.skill.skill_code,
                "name": ms.skill.name,
                "skill_type": ms.skill.skill_type.value if hasattr(ms.skill.skill_type, "value") else str(ms.skill.skill_type),
                "importance": ms.importance_level
            }
            for ms in major.major_skills if ms.skill
        ]
        overall_gaps, missing_pre, missing_tar = analyze_competency_gaps(
            required_major_skills=major_skills_list,
            skill_prerequisites_map=prereq_map,
            mastered_skill_codes=mastered_skills
        )

        # --- DETERMINISTIC XAI EXPLANATIONS ---
        top_factors, summary_expl = generate_xai_top_supporting_factors(
            major_name=major.name,
            score_riasec=score_riasec,
            student_riasec=student_riasec,
            major_riasec=major.riasec_vector,
            score_academic=score_academic,
            best_block=best_block,
            score_pref=score_pref,
            student_pref=student_pref,
            major_attr=major.cognitive_attributes
        )

        scored_items.append(MajorRecommendationItem(
            rank=0,
            major_id=major.id,
            major_code=major.major_code,
            major_name=major.name,
            overall_score=overall_score,
            score_riasec=score_riasec,
            score_academic=score_academic,
            score_preference=score_pref,
            best_matching_block=best_block,
            score_breakdown={
                "weights": weights_dict,
                "score_riasec": score_riasec,
                "score_academic": score_academic,
                "score_preference": score_pref,
                "admitted_blocks_evaluated": block_breakdown
            },
            top_supporting_factors=top_factors,
            competency_gaps=overall_gaps[:5],
            missing_prerequisites=missing_pre[:3],
            missing_target_skills=missing_tar[:3],
            explanation=summary_expl
        ))

    # Deterministic Sort: primary key overall_score descending, secondary key score_academic descending
    scored_items.sort(
        key=lambda item: (item.overall_score, item.score_academic, item.score_riasec),
        reverse=True
    )

    # Assign 1-based ranks and slice top_k
    top_results: List[MajorRecommendationItem] = []
    for idx, item in enumerate(scored_items[:payload.top_k], start=1):
        item.rank = idx
        top_results.append(item)

    # Persist execution history for auditability
    history = RecommendationHistory(
        user_id=user_id,
        weights_applied=weights_dict,
        ranked_results=[it.model_dump() for it in top_results],
        generated_at=datetime.now(timezone.utc)
    )
    db.add(history)
    await db.commit()

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
    print(f"3-Pillar Recommendation Engine evaluated {len(majors)} majors in {elapsed_ms:.2f}ms.")

    return RecommendationResponse(
        user_id=user_id,
        generated_at=history.generated_at,
        weights_applied=weights_dict,
        total_majors_evaluated=len(majors),
        recommendations=top_results
    )
