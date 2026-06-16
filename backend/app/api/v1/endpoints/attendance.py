"""
Endpoints de asistencia.
Punto de entrada para que los alumnos marquen su presencia.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.schemas import AttendanceCheckIn, AttendanceManual, AttendanceResponse
from app.services.attendance_service import AttendanceService, AttendanceError
from app.api.v1 import deps

router = APIRouter()


@router.post("/check-in", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def check_in(
    data: AttendanceCheckIn,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    El alumno marca su asistencia.

    Este endpoint es **público** (no requiere JWT del profesor),
    ya que es el alumno quien lo llama desde su celular.

    La seguridad se garantiza por:
    - El `session_token` (UUID) que solo existe mientras el profesor tiene la lista abierta
    - El PIN del alumno hasheado con bcrypt
    - Idempotencia: el mismo alumno no puede registrarse dos veces

    Body:
    - **session_token**: token UUID que proporciona el profesor (en el QR o URL)
    - **student_id**: número de matrícula del alumno
    - **pin**: PIN de 6 dígitos del alumno
    """
    ip = request.client.host if request.client else None

    try:
        attendance = AttendanceService.check_in(db, data, ip_address=ip)
    except AttendanceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return attendance


@router.post("/manual", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def mark_manual(
    data: AttendanceManual,
    db: Session = Depends(get_db),
    current_professor=Depends(deps.get_current_professor),
):
    """
    El profesor marca manualmente a un alumno como presente.
    Requiere autenticación JWT del profesor.
    """
    try:
        attendance = AttendanceService.mark_manually(
            db, session_id=data.session_id, student_id=data.student_id
        )
    except AttendanceError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return attendance


@router.get("/session/{session_token}", response_model=list[AttendanceResponse])
def get_session_attendances(
    session_token: str,
    db: Session = Depends(get_db),
    current_professor=Depends(deps.get_current_professor),
):
    """
    Lista todos los registros de asistencia de una sesión activa.
    El profesor puede ver en tiempo real quién ya pasó lista.
    """
    from app.models.models import Session as ClassSession, Attendance
    session = db.query(ClassSession).filter(
        ClassSession.session_token == session_token
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")

    return db.query(Attendance).filter(Attendance.session_id == session.id).all()
