"""
Configuración central de la aplicación.
Lee variables de entorno desde .env o del sistema.
"""
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl
from typing import List
import secrets


class Settings(BaseSettings):
    # ── Aplicación ─────────────────────────────────────────────────────────
    APP_NAME: str = "AttendanceApp API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # ── Base de datos ───────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./attendance.db"

    # ── Seguridad / JWT ─────────────────────────────────────────────────────
    # Genera una clave segura con: python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str = secrets.token_hex(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480   # 8 horas para el profesor
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── CORS ─────────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",
    ]

    # ── Reglas de negocio ─────────────────────────────────────────────────
    ATTENDANCE_MINIMUM_PERCENT: float = 80.0   # % mínimo para aprobar
    SESSION_TOKEN_EXPIRE_HOURS: int = 4        # tiempo máximo de una sesión de clase

    # ── Configuración del archivo CSV/Excel ────────────────────────────────
    # Nombres de columnas esperados al importar lista de alumnos
    CSV_COLUMN_STUDENT_ID: str = "matricula"
    CSV_COLUMN_FIRST_NAME: str = "nombre"
    CSV_COLUMN_LAST_NAME: str = "apellidos"
    CSV_COLUMN_EMAIL: str = "email"
    CSV_COLUMN_SUBJECT: str = "materia"

    model_config = {"env_file": ".env", "case_sensitive": True}


settings = Settings()
