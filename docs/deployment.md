# Guía de despliegue y desarrollo

## Requisitos

- Docker Desktop 4.x+
- Git
- Node.js 20+ (solo para desarrollo local sin Docker)
- Python 3.12+ (solo para desarrollo local sin Docker)

## Inicio rápido con Docker

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/attendance-app.git
cd attendance-app

# Levantar todos los servicios
docker-compose up --build

# En otra terminal, crear tu cuenta de profesor
curl -X POST http://localhost:8000/api/v1/professors/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Gio","email":"gio@universidad.edu","password":"tu-contraseña"}'
```

Servicios disponibles:
- Frontend: http://localhost:5173
- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs

## Desarrollo local sin Docker

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows

# Instalar dependencias
pip install -r requirements.txt

# Copiar configuración
cp .env.example .env            # edita SECRET_KEY

# Arrancar servidor con hot reload
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Arrancar servidor de desarrollo
npm run dev
```

## Variables de entorno

Crea `backend/.env` basado en este ejemplo:

```env
# Base de datos
DATABASE_URL=sqlite:///./attendance.db

# Seguridad — cambia esto en producción
# Genera con: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=cambia-esto-en-produccion

# JWT
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# CORS
CORS_ORIGINS=["http://localhost:5173"]

# Regla del 80%
ATTENDANCE_MINIMUM_PERCENT=80.0

# Debug
DEBUG=true
```

## Primer uso — paso a paso

### 1. Crear cuenta de profesor

```bash
curl -X POST http://localhost:8000/api/v1/professors/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tu Nombre",
    "email": "tu@email.com",
    "password": "tu-contraseña-segura"
  }'
```

### 2. Login y obtener token

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tu-contraseña-segura"}'
```

Guarda el `access_token`. En los siguientes pasos se usa como `$TOKEN`.

### 3. Crear materia

```bash
curl -X POST http://localhost:8000/api/v1/subjects/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Modelado y Simulación de Datos",
    "code": "LCDN6MOD10",
    "semester": "2025-1"
  }'
```

### 4. Crear grupo

```bash
curl -X POST http://localhost:8000/api/v1/groups/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Grupo A",
    "subject_id": "ID-DE-LA-MATERIA"
  }'
```

### 5. Importar lista de alumnos

Prepara un archivo `lista.csv`:

```csv
matricula,nombre,apellidos,email
2021001,Juan,García López,juan@universidad.edu
2021002,María,Hernández Ruiz,maria@universidad.edu
2021003,Carlos,Martínez Torres,
```

```bash
curl -X POST http://localhost:8000/api/v1/students/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "group_id=ID-DEL-GRUPO" \
  -F "file=@lista.csv"
```

Los alumnos recibirán un PIN inicial = últimos 4 dígitos de su matrícula + "00".
Por ejemplo: matrícula `2021003` → PIN inicial `100300`.

### 6. Abrir sesión de clase

```bash
curl -X POST http://localhost:8000/api/v1/sessions/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "group_id": "ID-DEL-GRUPO",
    "topic": "Clase 1: Introducción a la simulación"
  }'
```

Comparte el `session_token` con tus alumnos via:
- URL: `http://TU-IP:5173/asistencia/SESSION_TOKEN`
- QR (generado automáticamente en el frontend)
- Mensaje de WhatsApp / Google Classroom

### 7. El alumno marca su asistencia

El alumno abre la URL en su celular, ingresa su matrícula y PIN.

```bash
# Lo que hace el frontend automáticamente:
curl -X POST http://localhost:8000/api/v1/attendance/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "TOKEN-DE-LA-SESION",
    "student_id": "2021001",
    "pin": "100100"
  }'
```

### 8. Cerrar la lista

```bash
curl -X PATCH http://localhost:8000/api/v1/sessions/SESSION-ID/close \
  -H "Authorization: Bearer $TOKEN"
```

### 9. Ver reporte de asistencia

```bash
curl http://localhost:8000/api/v1/reports/ID-DEL-GRUPO \
  -H "Authorization: Bearer $TOKEN"
```

### 10. Exportar a CSV

```bash
curl http://localhost:8000/api/v1/reports/ID-DEL-GRUPO/export/csv \
  -H "Authorization: Bearer $TOKEN" \
  -o asistencia.csv
```

## Migraciones de base de datos con Alembic

```bash
cd backend

# Inicializar Alembic (solo la primera vez)
alembic init alembic

# Crear una migración
alembic revision --autogenerate -m "Descripción del cambio"

# Aplicar migraciones
alembic upgrade head

# Ver historial
alembic history
```

## Estructura del proyecto en GitHub

```
Repositorio: attendance-app
├── main        ← código estable
├── develop     ← integración
└── feature/*   ← nuevas funcionalidades
```

### Convención de commits

```
feat: agregar exportación a PDF
fix: corregir cálculo de porcentaje cuando no hay sesiones
docs: actualizar README con instrucciones de WebAuthn
refactor: separar lógica de importación CSV al service
test: agregar tests para AttendanceService
```

## Producción

Para desplegar en un VPS o servidor universitario:

```bash
# 1. Cambiar SQLite por PostgreSQL en docker-compose.yml
# 2. Configurar SECRET_KEY segura en .env
# 3. Levantar con perfil de producción
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 4. Configurar HTTPS con nginx + Let's Encrypt (ver docs/nginx.md)
```
