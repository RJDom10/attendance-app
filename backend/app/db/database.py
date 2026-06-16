"""
Configuración de la sesión de base de datos.
Soporta SQLite (desarrollo) y PostgreSQL (producción)
mediante la misma variable DATABASE_URL.
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings
from app.models.models import Base

# En SQLite, habilitar foreign keys (desactivadas por defecto en SQLite)
# En PostgreSQL, esto no es necesario
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=settings.DEBUG,   # Imprime SQL queries en modo debug
)

# Habilitar FK enforcement en SQLite
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_tables() -> None:
    """Crea todas las tablas si no existen. Usar solo en desarrollo."""
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency de FastAPI para obtener una sesión de BD.

    Uso en endpoints:
        @router.get("/something")
        def my_endpoint(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
