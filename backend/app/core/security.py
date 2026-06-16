"""
Utilidades de seguridad: hashing de contraseñas/PINs y generación de JWT.
"""
from datetime import datetime, timedelta, timezone
from typing import Any
import bcrypt

from jose import JWTError, jwt

from app.core.config import settings


# ── Contraseñas y PINs ──────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hashea una contraseña o PIN con bcrypt."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si una contraseña/PIN coincide con su hash."""
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


# ── JWT ─────────────────────────────────────────────────────────────────────

def create_access_token(subject: Any, expires_delta: timedelta | None = None) -> str:
    """
    Crea un JWT de acceso.

    Args:
        subject: Identificador del usuario (normalmente el ID del profesor)
        expires_delta: Duración del token. Usa el valor de settings si no se especifica.

    Returns:
        Token JWT como string
    """
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: Any) -> str:
    """Crea un JWT de refresco con vida más larga."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict | None:
    """
    Decodifica y valida un JWT.

    Returns:
        Payload del token, o None si es inválido/expirado
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
