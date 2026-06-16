"""
Endpoints de gestión de alumnos.
Incluye importación masiva desde CSV/Excel.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
import pandas as pd
import io

from app.db.database import get_db
from app.models.models import Student, Enrollment
from app.core.security import hash_password
from app.schemas.schemas import StudentCreate, StudentSetPIN, StudentResponse
from app.api.v1 import deps
from app.core.config import settings

router = APIRouter()


@router.post("/", response_model=StudentResponse, status_code=201)
def create_student(
    data: StudentCreate,
    db: Session = Depends(get_db),
    professor=Depends(deps.get_current_professor),
):
    """Crea un alumno individualmente y opcionalmente lo inscribe a un grupo."""
    student = db.query(Student).filter(Student.student_id == data.student_id).first()
    
    if student:
        # Si no nos pasaron group_id, y ya existe, marcamos error
        if not data.group_id:
            raise HTTPException(status_code=409, detail="Ya existe un alumno con esa matrícula")
        
        # Si sí nos pasaron group_id, checamos si ya está inscrito
        existing_enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == student.id,
            Enrollment.group_id == data.group_id,
        ).first()
        
        if existing_enrollment:
             raise HTTPException(status_code=409, detail="El alumno ya está inscrito en este grupo")
    else:
        # Crear alumno nuevo
        default_pin = (data.student_id[-4:] + "00").zfill(6)[:6]
        student_data = data.model_dump(exclude={"group_id"})
        student_data["pin_hash"] = hash_password(default_pin)
        student = Student(**student_data)
        db.add(student)
        db.flush()

    if data.group_id:
        enrollment = Enrollment(student_id=student.id, group_id=data.group_id)
        db.add(enrollment)

    db.commit()
    db.refresh(student)
    return student


@router.post("/import", status_code=201)
def import_students(
    group_id: str = Form(...),
    file: UploadFile = File(..., description="CSV o Excel con columnas: matricula, nombre, apellidos, email"),
    db: Session = Depends(get_db),
    professor=Depends(deps.get_current_professor),
):
    """
    Importa lista de alumnos desde CSV o Excel.

    El archivo debe tener columnas (configurables en .env):
    - `matricula` → número de matrícula
    - `nombre`    → primer nombre
    - `apellidos` → apellidos
    - `email`     → correo (opcional)

    Los alumnos que ya existen en BD se inscriben al grupo sin duplicarse.
    Los alumnos nuevos se crean con PIN inicial = últimos 4 dígitos de la matrícula.
    """
    content = file.file.read()

    try:
        if file.filename.endswith(".xlsx") or file.filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(content))
        else:
            df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al leer el archivo: {e}")

    # Normalizar nombres de columnas (quitar espacios, a minúsculas)
    df.columns = df.columns.str.strip().str.lower()

    required = [
        settings.CSV_COLUMN_STUDENT_ID,
        settings.CSV_COLUMN_FIRST_NAME,
        settings.CSV_COLUMN_LAST_NAME,
    ]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Columnas faltantes en el archivo: {', '.join(missing)}"
        )

    created = 0
    enrolled = 0
    errors = []

    for idx, row in df.iterrows():
        student_id_val = str(row[settings.CSV_COLUMN_STUDENT_ID]).strip()
        first_name = str(row[settings.CSV_COLUMN_FIRST_NAME]).strip().title()
        last_name = str(row[settings.CSV_COLUMN_LAST_NAME]).strip().title()
        email = str(row.get(settings.CSV_COLUMN_EMAIL, "")).strip() or None
        if email == "nan":
            email = None

        try:
            # Buscar o crear alumno
            student = db.query(Student).filter(Student.student_id == student_id_val).first()
            if not student:
                # PIN inicial = últimos 4 dígitos de la matrícula + "00"
                default_pin = (student_id_val[-4:] + "00").zfill(6)[:6]
                student = Student(
                    student_id=student_id_val,
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    pin_hash=hash_password(default_pin),
                )
                db.add(student)
                db.flush()   # para obtener el ID sin hacer commit todavía
                created += 1

            # Inscribir al grupo si no está ya inscrito
            existing_enrollment = db.query(Enrollment).filter(
                Enrollment.student_id == student.id,
                Enrollment.group_id == group_id,
            ).first()
            if not existing_enrollment:
                enrollment = Enrollment(student_id=student.id, group_id=group_id)
                db.add(enrollment)
                enrolled += 1

        except Exception as e:
            errors.append(f"Fila {idx + 2}: {e}")

    db.commit()

    return {
        "message": "Importación completada",
        "students_created": created,
        "students_enrolled": enrolled,
        "errors": errors,
        "note": "PIN inicial = últimos 4 dígitos de matrícula + '00'. El alumno puede cambiarlo.",
    }


@router.post("/set-pin", status_code=200)
def set_pin(data: StudentSetPIN, db: Session = Depends(get_db)):
    """
    El alumno configura su PIN de 6 dígitos.
    Este endpoint es público — lo llama el alumno la primera vez.
    """
    student = db.query(Student).filter(Student.student_id == data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Matrícula no encontrada")

    student.pin_hash = hash_password(data.pin)
    db.commit()
    return {"message": "PIN actualizado correctamente"}


@router.get("/group/{group_id}", response_model=list[StudentResponse])
def list_students_in_group(
    group_id: str,
    db: Session = Depends(get_db),
    professor=Depends(deps.get_current_professor),
):
    """Lista todos los alumnos inscritos en un grupo."""
    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.group_id == group_id)
        .all()
    )
    return [e.student for e in enrollments]


@router.delete("/group/{group_id}/student/{student_id}", status_code=204)
def unenroll_student(
    group_id: str,
    student_id: str,
    db: Session = Depends(get_db),
    professor=Depends(deps.get_current_professor),
):
    """
    Desinscribe a un alumno de un grupo.
    Elimina la relación Enrollment y también borra su asistencia previa en sesiones de ese grupo.
    """
    from app.models.models import Attendance, Session as ClassSession
    
    enrollment = db.query(Enrollment).filter(
        Enrollment.group_id == group_id,
        Enrollment.student_id == student_id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="El alumno no está inscrito en este grupo")
    
    # 1. Eliminar asistencias del alumno en las sesiones de este grupo
    db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.session_id.in_(
            db.query(ClassSession.id).filter(ClassSession.group_id == group_id)
        )
    ).delete(synchronize_session=False)
    
    # 2. Eliminar inscripción
    db.delete(enrollment)
    db.commit()
    return None
