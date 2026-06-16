"""Endpoints de grupos."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import Group, Enrollment
from app.schemas.schemas import GroupCreate, GroupResponse
from app.api.v1 import deps

router = APIRouter()


@router.post("/", response_model=GroupResponse, status_code=201)
def create_group(
    data: GroupCreate,
    db: Session = Depends(get_db),
    professor=Depends(deps.get_current_professor),
):
    group = Group(**data.model_dump())
    db.add(group)
    db.commit()
    db.refresh(group)

    count = db.query(Enrollment).filter(Enrollment.group_id == group.id).count()
    response = GroupResponse.model_validate(group)
    response.total_students = count
    return response


@router.get("/subject/{subject_id}", response_model=list[GroupResponse])
def list_groups(
    subject_id: str,
    db: Session = Depends(get_db),
    professor=Depends(deps.get_current_professor),
):
    groups = db.query(Group).filter(Group.subject_id == subject_id).all()
    result = []
    for g in groups:
        count = db.query(Enrollment).filter(Enrollment.group_id == g.id).count()
        r = GroupResponse.model_validate(g)
        r.total_students = count
        result.append(r)
    return result


@router.delete("/{group_id}", status_code=204)
def delete_group(
    group_id: str,
    db: Session = Depends(get_db),
    professor=Depends(deps.get_current_professor),
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    
    # Check if the professor owns the subject of this group
    if group.subject.professor_id != professor.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este grupo")

    db.delete(group)
    db.commit()
    return None
