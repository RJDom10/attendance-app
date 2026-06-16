"""
Modelos SQLAlchemy — definen las tablas de la base de datos.

Relaciones:
    Profesor → Materias → Grupos → (Alumnos via Enrollments)
                        → Sesiones → Asistencias
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey,
    Integer, String, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_uuid() -> str:
    return str(uuid.uuid4())


# ── Profesor ────────────────────────────────────────────────────────────────

class Professor(Base):
    __tablename__ = "professors"

    id = Column(String, primary_key=True, default=new_uuid)
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False, index=True)
    hashed_password = Column(String(200), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

    subjects = relationship("Subject", back_populates="professor", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Professor {self.email}>"


# ── Materia ─────────────────────────────────────────────────────────────────

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String, primary_key=True, default=new_uuid)
    name = Column(String(200), nullable=False)
    code = Column(String(50), nullable=False)       # ej. "LCDN6MOD10"
    semester = Column(String(20), nullable=False)   # ej. "2025-1"
    professor_id = Column(String, ForeignKey("professors.id"), nullable=False)
    created_at = Column(DateTime, default=utcnow)

    professor = relationship("Professor", back_populates="subjects")
    groups = relationship("Group", back_populates="subject", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("code", "semester", "professor_id", name="uq_subject_semester"),
    )


# ── Grupo ────────────────────────────────────────────────────────────────────

class Group(Base):
    """Un grupo es una sección del curso. Una materia puede tener varios grupos."""
    __tablename__ = "groups"

    id = Column(String, primary_key=True, default=new_uuid)
    name = Column(String(100), nullable=False)      # ej. "Grupo A", "Matutino"
    subject_id = Column(String, ForeignKey("subjects.id"), nullable=False)
    schedule = Column(Text, nullable=True)          # JSON como texto: días y horario
    created_at = Column(DateTime, default=utcnow)

    subject = relationship("Subject", back_populates="groups")
    enrollments = relationship("Enrollment", back_populates="group", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="group", cascade="all, delete-orphan")


# ── Alumno ────────────────────────────────────────────────────────────────────

class Student(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True, default=new_uuid)
    student_id = Column(String(50), unique=True, nullable=False, index=True)  # matrícula
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(150), nullable=False)
    email = Column(String(200), unique=True, nullable=True)
    pin_hash = Column(String(200), nullable=True)      # PIN de 6 dígitos hasheado
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

    enrollments = relationship("Enrollment", back_populates="student")
    attendances = relationship("Attendance", back_populates="student")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


# ── Inscripción (pivote alumno ↔ grupo) ──────────────────────────────────────

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(String, primary_key=True, default=new_uuid)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    group_id = Column(String, ForeignKey("groups.id"), nullable=False)
    enrolled_at = Column(DateTime, default=utcnow)

    student = relationship("Student", back_populates="enrollments")
    group = relationship("Group", back_populates="enrollments")

    __table_args__ = (
        UniqueConstraint("student_id", "group_id", name="uq_enrollment"),
    )


# ── Sesión de clase ──────────────────────────────────────────────────────────

class Session(Base):
    """Cada vez que el profesor abre 'pasar lista' se crea una sesión."""
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=new_uuid)
    group_id = Column(String, ForeignKey("groups.id"), nullable=False)
    session_date = Column(DateTime, nullable=False, default=utcnow)
    topic = Column(String(300), nullable=True)          # tema de la clase (opcional)
    started_at = Column(DateTime, default=utcnow)
    closed_at = Column(DateTime, nullable=True)         # NULL = sesión activa
    session_token = Column(String, unique=True, default=new_uuid, index=True)

    group = relationship("Group", back_populates="sessions")
    attendances = relationship("Attendance", back_populates="session", cascade="all, delete-orphan")

    @property
    def is_open(self) -> bool:
        return self.closed_at is None


# ── Asistencia ───────────────────────────────────────────────────────────────

class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(String, primary_key=True, default=new_uuid)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    checked_in_at = Column(DateTime, default=utcnow)
    method = Column(String(20), default="web")          # "web", "manual", "webauthn"
    ip_address = Column(String(45), nullable=True)      # IPv4 o IPv6

    session = relationship("Session", back_populates="attendances")
    student = relationship("Student", back_populates="attendances")

    __table_args__ = (
        # Un alumno no puede registrarse dos veces en la misma sesión
        UniqueConstraint("session_id", "student_id", name="uq_attendance"),
    )
