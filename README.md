# 📋 AttendanceApp — Sistema de Asistencia para Ciencia de Datos

Sistema web para registro de asistencia en cursos universitarios, con soporte futuro para autenticación biométrica vía WebAuthn.

## ✨ Características

- Importación de lista de alumnos por materia y semestre (CSV/Excel)
- Registro de asistencia por sesión (el alumno marca desde su celular)
- Cálculo automático de porcentaje de asistencia
- Alerta cuando un alumno baja del **80%** reglamentario
- Exportación de reportes (CSV / PDF)
- Autenticación JWT para el profesor
- Arquitectura preparada para biometría WebAuthn (Fase 2)

## 🗂 Estructura del proyecto

```
attendance-app/
├── backend/                # API REST con FastAPI
│   ├── app/
│   │   ├── api/v1/         # Endpoints REST
│   │   ├── core/           # Config, seguridad, JWT
│   │   ├── db/             # Sesión de base de datos
│   │   ├── models/         # Modelos SQLAlchemy (tablas)
│   │   ├── schemas/        # Schemas Pydantic (validación)
│   │   └── services/       # Lógica de negocio
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Vistas principales
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # Llamadas a la API
│   │   └── context/        # Estado global (AuthContext)
│   ├── package.json
│   └── Dockerfile
├── docs/                   # Documentación detallada
│   ├── architecture.md
│   ├── api-reference.md
│   ├── deployment.md
│   └── phase2-webauthn.md
├── docker-compose.yml      # Levanta todo con un comando
└── README.md               # Este archivo
```

## 🚀 Inicio rápido

### Prerrequisitos

- Docker Desktop instalado
- Git

### Clonar y levantar

```bash
git clone https://github.com/TU_USUARIO/attendance-app.git
cd attendance-app
docker-compose up --build
```

Servicios disponibles:

| Servicio | URL |
|---|---|
| Frontend (React) | http://localhost:5173 |
| Backend (FastAPI) | http://localhost:8000 |
| Docs API (Swagger) | http://localhost:8000/docs |

## 📊 Modelo de datos (resumen)

```
Profesor → Materias → Grupos → Alumnos
                    ↓
                Sesiones → Asistencias
```

## 🗓 Fases de desarrollo

| Fase | Descripción | Estado |
|---|---|---|
| **1** | App web con autenticación por matrícula + PIN | 🔨 En desarrollo |
| **2** | Autenticación biométrica WebAuthn (huella en celular) | 📋 Planeada |
| **3** | Integración con sistema escolar (SIAE / REST) | 📋 Futura |

## 🔐 Seguridad

- Contraseñas hasheadas con **bcrypt**
- Autenticación del profesor mediante **JWT** (expiración configurable)
- Registro de asistencia solo cuando el profesor tiene una **sesión activa abierta**
- En Fase 2, biometría gestionada por el SO del alumno vía **WebAuthn / FIDO2**

## 📚 Tecnologías

**Backend:** Python 3.12 · FastAPI · SQLAlchemy · SQLite (dev) / PostgreSQL (prod) · Alembic · Pydantic v2 · JWT

**Frontend:** React 18 · Vite · React Router · Axios · Tailwind CSS

**Infraestructura:** Docker · Docker Compose · GitHub Actions (CI)

## 👨‍💻 Desarrollo

Ver [`docs/deployment.md`](docs/deployment.md) para instrucciones detalladas.

---

Desarrollado por **Jorge Domínguez** · Licenciatura en Ciencia de Datos para Negocios  
Licencia MIT
