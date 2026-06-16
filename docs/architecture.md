# Arquitectura del sistema

## Visión general

AttendanceApp sigue una arquitectura cliente-servidor desacoplada con comunicación via REST API.

```
[Alumno - celular]          [Profesor - laptop/tablet]
       │                              │
       ▼                              ▼
  React SPA (Vite)  ←──────  React SPA (Vite)
       │                              │
       └──────────┬───────────────────┘
                  ▼
          FastAPI REST API
                  │
          SQLAlchemy ORM
                  │
         SQLite (dev) / PostgreSQL (prod)
```

## Flujo de un registro de asistencia

```
1. Profesor abre sesión en la app
   └─> POST /api/v1/auth/login  →  JWT token

2. Profesor crea una sesión de clase
   └─> POST /api/v1/sessions    →  session_id + código QR (futuro)

3. Alumno abre la URL de la sesión en su celular
   └─> GET /asistencia/{session_token}

4. Alumno se autentica con matrícula + PIN
   └─> POST /api/v1/attendance/check-in  →  registra presencia

5. Profesor cierra la sesión
   └─> PATCH /api/v1/sessions/{id}/close

6. Sistema calcula porcentajes
   └─> GET /api/v1/reports/{group_id}    →  JSON con % por alumno
```

## Modelo entidad-relación

```
professors
├── id (PK)
├── name
├── email (unique)
├── hashed_password
└── created_at

subjects
├── id (PK)
├── name
├── code          ← ej. "LCDN6MOD10"
├── semester      ← ej. "2025-1"
└── professor_id (FK)

groups
├── id (PK)
├── name          ← ej. "Grupo A"
├── subject_id (FK)
└── schedule      ← JSON con horario

students
├── id (PK)
├── student_id    ← número de matrícula (unique por escuela)
├── first_name
├── last_name
├── email
└── pin_hash      ← bcrypt del PIN de 6 dígitos

enrollments        ← tabla pivote alumno ↔ grupo
├── id (PK)
├── student_id (FK)
└── group_id (FK)

sessions           ← cada clase que se imparte
├── id (PK)
├── group_id (FK)
├── date
├── started_at
├── closed_at     ← NULL = sesión activa
└── session_token ← UUID para que alumnos accedan

attendances
├── id (PK)
├── session_id (FK)
├── student_id (FK)
├── checked_in_at
├── method        ← "web", "qr", "webauthn"
└── ip_address    ← para auditoría
```

## Regla del 80%

El reporte calcula:

```
porcentaje_asistencia = (sesiones_asistidas / total_sesiones_grupo) * 100
```

Un alumno está en riesgo si `porcentaje_asistencia < 80`.

La API devuelve un campo `at_risk: bool` por alumno en el endpoint de reportes.

## Seguridad

### Autenticación del profesor

- JWT con expiración de 8 horas
- Refresh token de 7 días almacenado en httpOnly cookie
- bcrypt con work factor 12 para contraseñas

### Autenticación del alumno (Fase 1)

- Matrícula + PIN de 6 dígitos
- El PIN se hashea con bcrypt antes de almacenarse
- El token de sesión (UUID v4) expira cuando el profesor cierra la sesión
- Un alumno solo puede registrarse una vez por sesión (idempotencia)

### Autenticación del alumno (Fase 2 - WebAuthn)

- El alumno registra su huella dactilar una sola vez vinculada a su cuenta
- La verificación la hace el sistema operativo del celular (Face ID, huella Android)
- El servidor solo recibe un `assertion` criptográfico firmado, nunca datos biométricos
- Librería recomendada: `py_webauthn` (Python)

## Variables de entorno

```env
# backend/.env
DATABASE_URL=sqlite:///./attendance.db    # dev
# DATABASE_URL=postgresql://user:pass@db:5432/attendance  # prod

SECRET_KEY=tu-clave-secreta-muy-larga-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

CORS_ORIGINS=["http://localhost:5173","https://tu-dominio.com"]
```

## Decisiones de diseño

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| FastAPI | Django REST | Menos boilerplate, tipado nativo, mejor para APIs puras |
| SQLAlchemy 2.0 | Tortoise ORM | Maduro, excelente con Alembic para migraciones |
| SQLite en dev | PostgreSQL desde el inicio | Cero configuración local, fácil migración con Alembic |
| Vite + React | Next.js | No necesitamos SSR, menor complejidad |
| JWT en header | Sesiones en BD | Stateless, escala horizontal sin cambios |
| PIN de 6 dígitos | Contraseña compleja | Alumnos lo usan en celular, UX más importante |
