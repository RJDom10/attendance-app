"""Endpoints de profesores."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import Professor
from app.core.security import hash_password
from app.schemas.schemas import ProfessorCreate, ProfessorResponse
from app.api.v1 import deps

router = APIRouter()


@router.post("/", response_model=ProfessorResponse, status_code=201)
def create_professor(data: ProfessorCreate, db: Session = Depends(get_db)):
    """
    Crea una cuenta de profesor.
    En producción este endpoint debería estar protegido o limitado a admins.
    """
    existing = db.query(Professor).filter(Professor.email == data.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Ya existe un profesor con ese correo")

    professor = Professor(
        name=data.name,
        email=data.email,
        hashed_password=hash_password(data.password),
    )
    db.add(professor)
    db.commit()
    db.refresh(professor)
    return professor


@router.get("/me", response_model=ProfessorResponse)
def get_me(professor=Depends(deps.get_current_professor)):
    """Devuelve los datos del profesor autenticado."""
    return professor
