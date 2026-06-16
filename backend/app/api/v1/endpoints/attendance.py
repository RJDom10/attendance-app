"""
Endpoints de asistencia.
Punto de entrada para que los alumnos marquen su presencia.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import create_qr_token, create_form_token, decode_token
from app.schemas.schemas import AttendanceCheckIn, AttendanceManual, AttendanceResponse, QRTokenResponse, VerifyQRRequest, VerifyQRResponse
from app.services.attendance_service import AttendanceService, AttendanceError
from app.api.v1 import deps

router = APIRouter()

@router.get("/qr-token", response_model=QRTokenResponse)
def get_qr_token(session_token: str, current_professor=Depends(deps.get_current_professor)):
    """Genera un token corto de 15 segundos para el QR dinámico."""
    qr_token = create_qr_token(session_token)
    return {"qr_token": qr_token}


@router.post("/verify-qr", response_model=VerifyQRResponse)
def verify_qr(data: VerifyQRRequest):
    """Valida el QR token corto y devuelve un token de formulario válido por 3 min."""
    payload = decode_token(data.qr_token)
    if not payload or payload.get("type") != "qr":
        raise HTTPException(status_code=400, detail="Código QR expirado o inválido")
    
    session_token = payload.get("sub")
    form_token = create_form_token(session_token)
    return {"form_token": form_token, "session_token": session_token}


@router.post("/check-in", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def check_in(
    data: AttendanceCheckIn,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    El alumno marca su asistencia.
    """
    ip = request.client.host if request.client else None

    # Validar token del formulario
    payload = decode_token(data.form_token)
    if not payload or payload.get("type") != "form":
        raise HTTPException(status_code=400, detail="Sesión de registro expirada. Vuelve a escanear el QR.")
    
    session_token = payload.get("sub")

    try:
        attendance = AttendanceService.check_in(db, data, session_token, ip_address=ip)
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
