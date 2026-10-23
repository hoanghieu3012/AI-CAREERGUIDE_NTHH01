from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.identity import User
from app.schemas.recommender import RecommendationRequest, RecommendationResponse
from app.services.recommender import service

router = APIRouter(prefix="/recommender", tags=["Deterministic Explainable Recommender"])


@router.post("/recommend", response_model=RecommendationResponse, status_code=status.HTTP_200_OK)
async def get_major_recommendations(
    payload: RecommendationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Computes deterministic 3-pillar major compatibility scores:
    1. Cosine similarity on 6-dimensional RIASEC vectors
    2. National Z-score CDF normalization for admission subject blocks
    3. Rule-based cognitive preference mapping
    
    GUARDRAIL: 100% deterministic mathematical ranking. LLMs are strictly forbidden from altering scores.
    """
    return await service.calculate_3pillar_recommendations(db, current_user.id, payload)
