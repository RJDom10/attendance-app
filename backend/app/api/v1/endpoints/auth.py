"""
Endpoints de autenticación del profesor.
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import Professor
from app.core.security import (
    verify_password, create_access_token,
    create_refresh_token, decode_token
)
from app.core.config import settings
from app.schemas.schemas import LoginRequest, TokenResponse, RefreshRequest

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """
    Autentica al profesor y devuelve tokens JWT.

    - **email**: correo del profesor
    - **password**: contraseña
    """
    professor = db.query(Professor).filter(
        Professor.email == data.email,
        Professor.is_active == True
    ).first()

    if not professor or not verify_password(data.password, professor.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=professor.id)
    refresh_token = create_refresh_token(subject=professor.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    """Renueva el access token usando el refresh token."""
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido o expirado",
        )

    professor_id = payload.get("sub")
    professor = db.query(Professor).filter(
        Professor.id == professor_id,
        Professor.is_active == True
    ).first()

    if not professor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )

    access_token = create_access_token(subject=professor.id)
    new_refresh_token = create_refresh_token(subject=professor.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
