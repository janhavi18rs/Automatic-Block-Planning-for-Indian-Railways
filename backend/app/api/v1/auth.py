import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash, get_current_user
from app.models.models import User
from app.schemas.schemas import (
    LoginRequest, TokenResponse, UserSchema, StandardResponse,
    SignupRequest, SignupResponse
)

router = APIRouter(prefix="/auth", tags=["Auth"])

ALLOWED_ROLES = {"admin", "control_office", "field_crew"}

@router.post("/register", response_model=StandardResponse[SignupResponse], status_code=201)
async def register(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    """
    Register a new CorridorOps user.
    Roles: admin | control_office | field_crew
    Password is bcrypt-hashed. Plain-text passwords are never stored.
    """
    # Validate role
    if body.role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid role '{body.role}'. Allowed roles: {sorted(ALLOWED_ROLES)}"
        )

    # Validate password strength
    if len(body.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 6 characters long."
        )

    # Check for duplicate email
    res = await db.execute(select(User).filter_by(email=body.email))
    existing = res.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An account with email '{body.email}' already exists. Please login."
        )

    # Create user with hashed password
    new_user = User(
        email=body.email,
        hashed_password=get_password_hash(body.password),
        role=body.role,
        full_name=body.full_name,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return StandardResponse(
        data=SignupResponse(
            user_id=new_user.id,
            email=new_user.email,
            full_name=new_user.full_name,
            role=new_user.role,
            message="Account created successfully. You can now login."
        ),
        meta={"created_at": datetime.datetime.utcnow().isoformat()}
    )


@router.post("/login", response_model=StandardResponse[TokenResponse])
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).filter_by(email=body.email))
    user = res.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Only admin users are allowed to log in
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only administrators are permitted to log in."
        )

    token = create_access_token(subject=user.email, role=user.role)
    token_resp = TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name
    )
    return StandardResponse(data=token_resp, meta={"status": "authenticated"})


@router.get("/me", response_model=StandardResponse[UserSchema])
async def get_me(current_user: User = Depends(get_current_user)):
    return StandardResponse(data=UserSchema.model_validate(current_user))
