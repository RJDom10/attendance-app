"""
AttendanceApp — API principal.
Punto de entrada de la aplicación FastAPI.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import create_tables
from app.api.v1.endpoints import auth, professors, subjects, groups, students, sessions, attendance, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicialización al arrancar la aplicación."""
    create_tables()   # Crea tablas en SQLite si no existen
    yield
    # Aquí iría limpieza al apagar (cerrar conexiones a Redis, etc.)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## AttendanceApp API

Sistema de registro de asistencia para cursos universitarios.

### Flujo típico del profesor
1. `POST /auth/login` → obtener token JWT
2. `POST /subjects` → crear materia del semestre
3. `POST /groups` → crear grupo
4. `POST /students/import` → importar lista CSV/Excel
5. `POST /sessions` → abrir sesión de clase (genera session_token)
6. `PATCH /sessions/{id}/close` → cerrar lista
7. `GET /reports/{group_id}` → ver porcentajes de asistencia

### Flujo del alumno
1. Abrir URL con el `session_token` proporcionado por el profesor
2. `POST /attendance/check-in` → registrar asistencia con matrícula + PIN
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
# Permitir que el frontend React acceda a la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
PREFIX = "/api/v1"

app.include_router(auth.router,        prefix=PREFIX + "/auth",        tags=["Autenticación"])
app.include_router(professors.router,  prefix=PREFIX + "/professors",  tags=["Profesores"])
app.include_router(subjects.router,    prefix=PREFIX + "/subjects",    tags=["Materias"])
app.include_router(groups.router,      prefix=PREFIX + "/groups",      tags=["Grupos"])
app.include_router(students.router,    prefix=PREFIX + "/students",    tags=["Alumnos"])
app.include_router(sessions.router,    prefix=PREFIX + "/sessions",    tags=["Sesiones de clase"])
app.include_router(attendance.router,  prefix=PREFIX + "/attendance",  tags=["Asistencia"])
app.include_router(reports.router,     prefix=PREFIX + "/reports",     tags=["Reportes"])


@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }
