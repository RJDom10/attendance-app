"""
Tests básicos de la API de asistencia.

Ejecutar con:
    pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.database import get_db, Base
from app.models.models import Professor, Student, Subject, Group, Enrollment, Session as ClassSession
from app.core.security import hash_password

# ── Base de datos en memoria para tests ─────────────────────────────────────

SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    db = TestingSessionLocal(bind=connection)
    try:
        yield db
    finally:
        db.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── Fixtures de datos ────────────────────────────────────────────────────────

@pytest.fixture
def professor(db):
    prof = Professor(
        name="Gio",
        email="gio@test.com",
        hashed_password=hash_password("password123"),
    )
    db.add(prof)
    db.commit()
    db.refresh(prof)
    return prof


@pytest.fixture
def auth_token(client, professor):
    response = client.post("/api/v1/auth/login", json={
        "email": "gio@test.com",
        "password": "password123",
    })
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def student_with_session(db, professor):
    """Crea un alumno, materia, grupo, sesión activa y lo inscribe."""
    subject = Subject(name="Test Subject", code="TEST01", semester="2025-1", professor_id=professor.id)
    db.add(subject)
    db.flush()

    group = Group(name="Grupo A", subject_id=subject.id)
    db.add(group)
    db.flush()

    student = Student(
        student_id="2021001",
        first_name="Juan",
        last_name="García",
        pin_hash=hash_password("123456"),
    )
    db.add(student)
    db.flush()

    enrollment = Enrollment(student_id=student.id, group_id=group.id)
    db.add(enrollment)
    db.flush()

    session = ClassSession(group_id=group.id, topic="Clase 1")
    db.add(session)
    db.commit()

    return {"student": student, "session": session, "group": group}


# ── Tests ────────────────────────────────────────────────────────────────────

class TestAuth:
    def test_login_success(self, client, professor):
        r = client.post("/api/v1/auth/login", json={
            "email": "gio@test.com",
            "password": "password123",
        })
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, professor):
        r = client.post("/api/v1/auth/login", json={
            "email": "gio@test.com",
            "password": "wrong",
        })
        assert r.status_code == 401

    def test_login_unknown_email(self, client, professor):
        r = client.post("/api/v1/auth/login", json={
            "email": "noexiste@test.com",
            "password": "password123",
        })
        assert r.status_code == 401


class TestAttendance:
    def test_check_in_success(self, client, student_with_session):
        data = student_with_session
        r = client.post("/api/v1/attendance/check-in", json={
            "session_token": data["session"].session_token,
            "student_id": "2021001",
            "pin": "123456",
        })
        assert r.status_code == 201
        assert r.json()["method"] == "web"

    def test_check_in_wrong_pin(self, client, student_with_session):
        data = student_with_session
        r = client.post("/api/v1/attendance/check-in", json={
            "session_token": data["session"].session_token,
            "student_id": "2021001",
            "pin": "000000",
        })
        assert r.status_code == 400
        assert "PIN" in r.json()["detail"]

    def test_check_in_duplicate(self, client, student_with_session):
        """No se puede registrar dos veces en la misma sesión."""
        data = student_with_session
        payload = {
            "session_token": data["session"].session_token,
            "student_id": "2021001",
            "pin": "123456",
        }
        r1 = client.post("/api/v1/attendance/check-in", json=payload)
        assert r1.status_code == 201
        r2 = client.post("/api/v1/attendance/check-in", json=payload)
        assert r2.status_code == 400
        assert "ya registraste" in r2.json()["detail"].lower()

    def test_check_in_invalid_token(self, client, professor):
        r = client.post("/api/v1/attendance/check-in", json={
            "session_token": "token-que-no-existe",
            "student_id": "2021001",
            "pin": "123456",
        })
        assert r.status_code == 400


class TestSessions:
    def test_open_and_close_session(self, client, auth_token, db, professor):
        subject = Subject(name="S", code="S01", semester="2025-1", professor_id=professor.id)
        db.add(subject)
        db.flush()
        group = Group(name="G", subject_id=subject.id)
        db.add(group)
        db.commit()

        headers = {"Authorization": f"Bearer {auth_token}"}

        r = client.post("/api/v1/sessions/", json={"group_id": group.id}, headers=headers)
        assert r.status_code == 201
        session_id = r.json()["id"]
        assert r.json()["is_open"] is True

        r2 = client.patch(f"/api/v1/sessions/{session_id}/close", headers=headers)
        assert r2.status_code == 200
        assert r2.json()["is_open"] is False
