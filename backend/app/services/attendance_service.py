"""
Servicio de asistencia — lógica de negocio principal.
Separa la lógica de los endpoints para mantener los routers limpios.
"""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session as DBSession
from sqlalchemy import func

from app.models.models import (
    Student, Session, Attendance, Enrollment, Group
)
from app.core.security import verify_password, hash_password
from app.core.config import settings
from app.schemas.schemas import (
    AttendanceCheckIn, StudentAttendanceReport, GroupAttendanceReport
)


class AttendanceError(Exception):
    """Error de negocio en el registro de asistencia."""
    pass


class AttendanceService:

    # ── Check-in del alumno ──────────────────────────────────────────────────

    @staticmethod
    def check_in(db: DBSession, data: AttendanceCheckIn, session_token: str, ip_address: Optional[str] = None) -> Attendance:
        """
        Registra la asistencia de un alumno.

        Valida:
        1. Que la sesión exista y esté activa
        2. Que el alumno exista y esté inscrito en el grupo
        3. Que el PIN sea correcto
        4. Que el alumno no haya registrado ya asistencia en esta sesión

        Returns:
            Objeto Attendance creado

        Raises:
            AttendanceError: Si alguna validación falla
        """
        # 1. Buscar sesión activa
        session = (
            db.query(Session)
            .filter(Session.session_token == session_token)
            .first()
        )
        if not session:
            raise AttendanceError("La sesión no existe")
        if not session.is_open:
            raise AttendanceError("El profesor ya cerró la lista de asistencia")

        # 2. Buscar alumno por matrícula
        student = (
            db.query(Student)
            .filter(Student.student_id == data.student_id, Student.is_active == True)
            .first()
        )
        if not student:
            raise AttendanceError("Número de matrícula no encontrado")

        # 3. Verificar PIN
        if not student.pin_hash:
            raise AttendanceError("El alumno no tiene PIN configurado. Contacta al profesor.")
        if not verify_password(data.pin, student.pin_hash):
            raise AttendanceError("PIN incorrecto")

        # 4. Verificar que está inscrito en el grupo de esta sesión
        enrollment = (
            db.query(Enrollment)
            .filter(
                Enrollment.student_id == student.id,
                Enrollment.group_id == session.group_id
            )
            .first()
        )
        if not enrollment:
            raise AttendanceError("No estás inscrito en este grupo")

        # 5. Verificar que no haya registrado antes
        existing = (
            db.query(Attendance)
            .filter(
                Attendance.session_id == session.id,
                Attendance.student_id == student.id
            )
            .first()
        )
        if existing:
            raise AttendanceError("Ya registraste tu asistencia en esta sesión")

        # 6. Registrar asistencia
        attendance = Attendance(
            session_id=session.id,
            student_id=student.id,
            method="web",
            ip_address=ip_address,
        )
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        return attendance

    # ── Registro manual por el profesor ────────────────────────────────────

    @staticmethod
    def mark_manually(
        db: DBSession,
        session_id: str,
        student_id: str,
    ) -> Attendance:
        """El profesor marca manualmente a un alumno como presente."""
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise AttendanceError("Alumno no encontrado")

        session = db.query(Session).filter(Session.id == session_id).first()
        if not session:
            raise AttendanceError("Sesión no encontrada")

        existing = (
            db.query(Attendance)
            .filter(
                Attendance.session_id == session_id,
                Attendance.student_id == student_id
            )
            .first()
        )
        if existing:
            return existing   # Ya estaba, no hacer nada

        attendance = Attendance(
            session_id=session_id,
            student_id=student_id,
            method="manual",
        )
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        return attendance

    # ── Reportes ────────────────────────────────────────────────────────────

    @staticmethod
    def get_group_report(db: DBSession, group_id: str, min_percent: Optional[float] = None) -> GroupAttendanceReport:
        """
        Genera el reporte de asistencia de todos los alumnos de un grupo.
        Calcula el porcentaje y marca quiénes están en riesgo.
        """
        from app.models.models import Subject

        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            raise AttendanceError("Grupo no encontrado")

        subject = db.query(Subject).filter(Subject.id == group.subject_id).first()

        # Total de sesiones del grupo (contamos solo las cerradas + la activa)
        total_sessions = (
            db.query(func.count(Session.id))
            .filter(Session.group_id == group_id)
            .scalar()
        ) or 0

        # Alumnos inscritos
        enrollments = (
            db.query(Enrollment)
            .filter(Enrollment.group_id == group_id)
            .all()
        )

        effective_min_percent = min_percent if min_percent is not None else settings.ATTENDANCE_MINIMUM_PERCENT

        student_reports = []
        for enrollment in enrollments:
            student = enrollment.student

            # Contar asistencias de este alumno en este grupo
            attended = (
                db.query(func.count(Attendance.id))
                .join(Session, Attendance.session_id == Session.id)
                .filter(
                    Attendance.student_id == student.id,
                    Session.group_id == group_id,
                )
                .scalar()
            ) or 0

            percent = (attended / total_sessions * 100) if total_sessions > 0 else 0.0

            student_reports.append(StudentAttendanceReport(
                student_id=student.id,
                full_name=student.full_name,
                student_number=student.student_id,
                attended_sessions=attended,
                total_sessions=total_sessions,
                attendance_percent=round(percent, 1),
                at_risk=percent < effective_min_percent,
            ))

        # Ordenar: primero los que están en riesgo, luego por nombre
        student_reports.sort(key=lambda r: (not r.at_risk, r.full_name))

        return GroupAttendanceReport(
            group_id=group.id,
            group_name=group.name,
            subject_name=subject.name if subject else "",
            subject_code=subject.code if subject else "",
            semester=subject.semester if subject else "",
            total_sessions=total_sessions,
            minimum_percent=effective_min_percent,
            students=student_reports,
            generated_at=datetime.now(timezone.utc),
        )
