"""
Endpoints de reportes de asistencia.
"""
import csv
import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.schemas import GroupAttendanceReport
from app.services.attendance_service import AttendanceService, AttendanceError
from app.api.v1 import deps

router = APIRouter()


@router.get("/{group_id}", response_model=GroupAttendanceReport)
def get_report(
    group_id: str,
    db: Session = Depends(get_db),
    professor=Depends(deps.get_current_professor),
):
    """
    Reporte completo de asistencia de un grupo.

    Incluye por alumno:
    - Sesiones asistidas / total
    - Porcentaje de asistencia
    - Indicador `at_risk` si está por debajo del 80%
    """
    try:
        return AttendanceService.get_group_report(db, group_id)
    except AttendanceError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{group_id}/export/csv")
def export_csv(
    group_id: str,
    db: Session = Depends(get_db),
    professor=Depends(deps.get_current_professor),
):
    """
    Exporta el reporte de asistencia como archivo CSV.
    Listo para abrir en Excel o Google Sheets.
    """
    try:
        report = AttendanceService.get_group_report(db, group_id)
    except AttendanceError as e:
        raise HTTPException(status_code=404, detail=str(e))

    output = io.StringIO()
    writer = csv.writer(output)

    # Encabezado del reporte
    writer.writerow([f"Reporte de Asistencia — {report.subject_name} ({report.subject_code})"])
    writer.writerow([f"Grupo: {report.group_name}  |  Semestre: {report.semester}"])
    writer.writerow([f"Total de sesiones: {report.total_sessions}  |  Mínimo requerido: {report.minimum_percent}%"])
    writer.writerow([])

    # Columnas
    writer.writerow([
        "Matrícula",
        "Nombre completo",
        "Sesiones asistidas",
        "Total sesiones",
        "% Asistencia",
        "Estado",
    ])

    # Datos
    for student in report.students:
        writer.writerow([
            student.student_number,
            student.full_name,
            student.attended_sessions,
            student.total_sessions,
            f"{student.attendance_percent:.1f}%",
            "EN RIESGO" if student.at_risk else "OK",
        ])

    output.seek(0)
    filename = f"asistencia_{report.subject_code}_{report.semester}_{report.group_name}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8-sig",   # utf-8-sig para que Excel lo abra bien
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
