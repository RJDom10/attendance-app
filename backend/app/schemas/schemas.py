"""
Schemas Pydantic v2 para validación de entrada/salida de la API.

Convención de nombres:
    XxxBase     → campos comunes
    XxxCreate   → para crear (POST)
    XxxUpdate   → para actualizar (PATCH)
    XxxResponse → para devolver al cliente
    XxxDetail   → respuesta detallada con relaciones
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


# ══════════════════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════════════════

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int   # segundos


class RefreshRequest(BaseModel):
    refresh_token: str


# ══════════════════════════════════════════════════════════════════════════════
# PROFESSOR
# ══════════════════════════════════════════════════════════════════════════════

class ProfessorCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    password: str = Field(..., min_length=8)


class ProfessorResponse(BaseModel):
    id: str
    name: str
    email: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════════════════════════
# SUBJECT (Materia)
# ══════════════════════════════════════════════════════════════════════════════

class SubjectCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    code: str = Field(..., min_length=2, max_length=50)
    semester: str = Field(..., pattern=r"^\d{4}-[12]$")  # ej. "2025-1"


class SubjectResponse(BaseModel):
    id: str
    name: str
    code: str
    semester: str
    professor_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════════════════════════
# GROUP (Grupo)
# ══════════════════════════════════════════════════════════════════════════════

class GroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    subject_id: str
    schedule: Optional[str] = None


class GroupResponse(BaseModel):
    id: str
    name: str
    subject_id: str
    schedule: Optional[str]
    created_at: datetime
    total_students: Optional[int] = None

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════════════════════════
# STUDENT (Alumno)
# ══════════════════════════════════════════════════════════════════════════════

class StudentCreate(BaseModel):
    student_id: str = Field(..., min_length=5, max_length=50, description="Número de matrícula")
    first_name: str = Field(..., min_length=2, max_length=100)
    last_name: str = Field(..., min_length=2, max_length=150)
    email: Optional[EmailStr] = None


class StudentSetPIN(BaseModel):
    student_id: str
    pin: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")

    @field_validator("pin")
    @classmethod
    def pin_must_be_digits(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("El PIN debe contener solo dígitos")
        return v


class StudentResponse(BaseModel):
    id: str
    student_id: str
    first_name: str
    last_name: str
    email: Optional[str]
    is_active: bool

    model_config = {"from_attributes": True}


class StudentImportRow(BaseModel):
    """Formato de fila al importar CSV/Excel."""
    student_id: str
    first_name: str
    last_name: str
    email: Optional[str] = None


# ══════════════════════════════════════════════════════════════════════════════
# SESSION (Sesión de clase)
# ══════════════════════════════════════════════════════════════════════════════

class SessionCreate(BaseModel):
    group_id: str
    topic: Optional[str] = Field(None, max_length=300)


class SessionResponse(BaseModel):
    id: str
    group_id: str
    session_date: datetime
    topic: Optional[str]
    started_at: datetime
    closed_at: Optional[datetime]
    session_token: str
    is_open: bool
    attendance_count: Optional[int] = None

    model_config = {"from_attributes": True}


class SessionClose(BaseModel):
    session_id: str


# ══════════════════════════════════════════════════════════════════════════════
# ATTENDANCE (Asistencia)
# ══════════════════════════════════════════════════════════════════════════════

class AttendanceCheckIn(BaseModel):
    """Lo que envía el alumno para marcar su asistencia."""
    session_token: str
    student_id: str     # matrícula
    pin: str = Field(..., min_length=6, max_length=6)


class AttendanceManual(BaseModel):
    """El profesor marca manualmente a un alumno."""
    session_id: str
    student_id: str


class AttendanceResponse(BaseModel):
    id: str
    session_id: str
    student_id: str
    checked_in_at: datetime
    method: str

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════════════════════════
# REPORTS (Reportes)
# ══════════════════════════════════════════════════════════════════════════════

class StudentAttendanceReport(BaseModel):
    """Reporte de asistencia de un alumno en un grupo."""
    student_id: str
    full_name: str
    student_number: str       # matrícula
    attended_sessions: int
    total_sessions: int
    attendance_percent: float
    at_risk: bool             # True si < 80%


class GroupAttendanceReport(BaseModel):
    """Reporte completo de asistencia de un grupo."""
    group_id: str
    group_name: str
    subject_name: str
    subject_code: str
    semester: str
    total_sessions: int
    minimum_percent: float
    students: List[StudentAttendanceReport]
    generated_at: datetime
