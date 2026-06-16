"""Endpoints de materias."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import Subject
from app.schemas.schemas import SubjectCreate, SubjectResponse
from app.api.v1 import deps

router = APIRouter()


@router.post("/", response_model=SubjectResponse, status_code=201)
def create_subject(
    data: SubjectCreate,
    db: Session = Depends(get_db),
    professor=Depends(deps.get_current_professor),
):
    subject = Subject(**data.model_dump(), professor_id=professor.id)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.get("/", response_model=list[SubjectResponse])
def list_subjects(
    db: Session = Depends(get_db),
    professor=Depends(deps.get_current_professor),
):
    return db.query(Subject).filter(Subject.professor_id == professor.id).all()


@router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject(
    subject_id: str,
    db: Session = Depends(get_db),
    professor=Depends(deps.get_current_professor),
):
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.professor_id == professor.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Materia no encontrada")
    return subject

@router.delete("/{subject_id}", status_code=204)
def delete_subject(
    subject_id: str,
    db: Session = Depends(get_db),
    professor=Depends(deps.get_current_professor),
):
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.professor_id == professor.id
    ).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Materia no encontrada o sin permisos")
    
    db.delete(subject)
    db.commit()
    return None
