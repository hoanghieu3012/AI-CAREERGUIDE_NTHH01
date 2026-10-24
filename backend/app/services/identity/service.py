import uuid
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.identity import User, UserConsent, UserRole
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.identity import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserConsentCreate
)


async def register_user(db: AsyncSession, payload: UserRegisterRequest) -> User:
    # Explicitly forbid registering ADMIN accounts via public registration
    if payload.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không được phép tạo tài khoản Quản trị viên (ADMIN) qua cổng đăng ký công khai."
        )

    # Check duplicate email
    query = select(User).where(User.email == payload.email)
    result = await db.execute(query)
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists."
        )

    # Hash password with Argon2id (OWASP ASVS Level 2)
    hashed_pwd = get_password_hash(payload.password)

    user = User(
        email=payload.email,
        hashed_password=hashed_pwd,
        full_name=payload.full_name,
        role=UserRole.STUDENT,
        is_active=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Automatically record initial privacy consent under Law 91/2025/QH15
    initial_consent = UserConsent(
        user_id=user.id,
        consent_type="INITIAL_ONBOARDING_TERMS_LAW91_2025",
        policy_version="v1.0-Law91/2025/QH15",
        is_granted=True,
        granted_at=datetime.now(timezone.utc)
    )
    db.add(initial_consent)
    await db.commit()

    return user


async def authenticate_user(db: AsyncSession, payload: UserLoginRequest) -> TokenResponse:
    query = select(User).where(User.email == payload.email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )

    token = create_access_token(subject=str(user.id), role=user.role.value)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        expires_in_minutes=1440
    )


async def record_user_consent(
    db: AsyncSession,
    user_id: uuid.UUID,
    payload: UserConsentCreate,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> UserConsent:
    consent = UserConsent(
        user_id=user_id,
        consent_type=payload.consent_type,
        policy_version=payload.policy_version,
        is_granted=payload.is_granted,
        ip_address=ip_address,
        user_agent=user_agent,
        granted_at=datetime.now(timezone.utc)
    )
    db.add(consent)
    await db.commit()
    await db.refresh(consent)
    return consent


async def get_user_consents(db: AsyncSession, user_id: uuid.UUID) -> List[UserConsent]:
    query = select(UserConsent).where(UserConsent.user_id == user_id).order_by(UserConsent.granted_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())
