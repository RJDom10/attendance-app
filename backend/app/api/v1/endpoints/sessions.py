"""
Endpoints para gestionar sesiones de clase.
Una sesión = una clase = una lista de asistencia.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import Session as ClassSession, Group
from app.schemas.schemas import SessionCreate, SessionResponse
from app.api.v1 import deps

router = APIRouter()


def session_to_response(session: ClassSession, db: Session) -> SessionResponse:
    from app.models.models import Attendance
    count = db.query(Attendance).filter(Attendance.session_id == session.id).count()
    return SessionResponse(
        id=session.id,
        group_id=session.group_id,
        session_date=session.session_date,
        topic=session.topic,
        started_at=session.started_at,
        closed_at=session.closed_at,
        session_token=session.session_token,
        is_open=session.is_open,
        attendance_count=count,
    )


@router.post("/", response_model=SessionResponse, status_code=201)
def open_session(
    data: SessionCreate,
    db: Session = Depends(get_db),
    professor=Depends(deps.get_current_professor),
):
    """
    Abre una nueva sesión de clase (activa el registro de asistencia).

    El `session_token` del response es el que hay que compartir con los alumnos
    (via QR, URL proyectada, o enlace en WhatsApp/Classroom).
    """
    group = db.query(Group).filter(Group.id == data.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    # Verificar que no haya sesión activa para este grupo
    active = db.query(ClassSession).filter(
        ClassSession.group_id == data.group_id,
        ClassSession.closed_at == None  # noqa: E711
    ).first()
    if active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya hay una sesión activa para este grupo. Ciérrala primero.",
        )

    session = ClassSession(group_id=data.group_id, topic=data.topic)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session_to_response(session, db)


@router.patch("/{session_id}/close", response_model=SessionResponse)
def close_session(
    session_id: str,
    db: Session = Depends(get_db),
    professor=Depends(deps.get_current_professor),
):
    """Cierra la sesión activa. Los alumnos ya no podrán marcar asistencia."""
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    if not session.is_open:
        raise HTTPException(status_code=400, detail="La sesión ya estaba cerrada")

    session.closed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)
    return session_to_response(session, db)


@router.get("/group/{group_id}", response_model=list[SessionResponse])
def list_sessions(
    group_id: str,
    db: Session = Depends(get_db),
    professor=Depends(deps.get_current_professor),
):
    """Lista todas las sesiones de un grupo, de más reciente a más antigua."""
    sessions = (
        db.query(ClassSession)
        .filter(ClassSession.group_id == group_id)
        .order_by(ClassSession.started_at.desc())
        .all()
    )
    return [session_to_response(s, db) for s in sessions]
