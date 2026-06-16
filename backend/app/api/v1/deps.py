"""
Dependencias compartidas de FastAPI.
Principalmente el guard de autenticación para el profesor.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.database import get_db
from app.models.models import Professor

bearer_scheme = HTTPBearer()


def get_current_professor(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Professor:
    """
    Dependencia que extrae y valida el JWT del profesor.

    Uso en endpoints:
        @router.get("/protected")
        def endpoint(professor = Depends(get_current_professor)):
            ...
    """
    token = credentials.credentials
    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    professor_id = payload.get("sub")
    professor = db.query(Professor).filter(
        Professor.id == professor_id,
        Professor.is_active == True
    ).first()

    if not professor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )

    return professor
