# Fase 2 — Autenticación biométrica con WebAuthn

## ¿Qué es WebAuthn?

WebAuthn (Web Authentication API) es un estándar W3C que permite a las aplicaciones web usar autenticadores de hardware o biometría del dispositivo (huella dactilar, Face ID, Windows Hello) para autenticar usuarios.

**La clave**: los datos biométricos nunca salen del dispositivo del alumno. El servidor solo recibe una firma criptográfica que prueba que el alumno pasó la verificación biométrica localmente.

## Por qué es mejor que un sensor USB

| Criterio | Sensor USB externo | WebAuthn (celular) |
|---|---|---|
| Costo | ~$15–80 USD por sensor | $0 (celular del alumno) |
| Instalación | Requiere driver, cable | Nada, es estándar web |
| Privacidad | Tus servidores almacenan templates | Biometría nunca sale del celular |
| Seguridad | Puede clonarse con ataques físicos | Clave privada en Secure Enclave del chip |
| Soporte | Solo donde pones el sensor | Cualquier celular desde 2018 |
| Falsificación | Difícil pero posible (dedo de gelatina) | Casi imposible (clave criptográfica en hardware) |

## Flujo técnico (simplificado)

### Registro (una sola vez por alumno)

```
Frontend                    Backend                  Celular del alumno
   │                           │                           │
   │── POST /webauthn/register ─▶                           │
   │                           │── genera challenge ──────▶│
   │                           │                           │ usuario pone dedo
   │                           │                           │ TPM crea par de llaves
   │◀── challenge + opciones ──│                           │
   │                           │                     ◀─────│ credential (public key)
   │── POST /webauthn/register/verify ──────────────────────▶
                               │ verifica y guarda public key
                               │ (NUNCA la huella, solo la llave pública)
```

### Verificación (cada sesión de clase)

```
Frontend                    Backend                  Celular del alumno
   │                           │                           │
   │── POST /webauthn/login ───▶                           │
   │                           │── genera challenge ──────▶│
   │◀── challenge ─────────────│                           │
   │                                                       │ usuario pone dedo
   │                                                       │ TPM firma el challenge
   │── POST /webauthn/login/verify ◀────────────────────── │
   │                           │ verifica firma con public key guardada
   │◀── attendance confirmed ──│
```

## Implementación en Python

### Instalación

```bash
pip install py-webauthn
```

### Registro — generar opciones

```python
# backend/app/api/v1/endpoints/webauthn.py
import webauthn
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    ResidentKeyRequirement,
)

@router.post("/webauthn/register")
async def webauthn_register_begin(
    student_id: str,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.student_id == student_id).first()

    options = webauthn.generate_registration_options(
        rp_id="tu-dominio.com",          # o "localhost" en dev
        rp_name="AttendanceApp",
        user_id=student.id.bytes,
        user_name=student.student_id,
        user_display_name=f"{student.first_name} {student.last_name}",
        authenticator_selection=AuthenticatorSelectionCriteria(
            user_verification=UserVerificationRequirement.REQUIRED,  # exige biometría
            resident_key=ResidentKeyRequirement.PREFERRED,
        ),
    )

    # Guardar challenge en sesión o Redis (expira en 60s)
    await redis.setex(f"challenge:{student_id}", 60, options.challenge)

    return webauthn.options_to_json(options)
```

### Verificación — comprobar assertion

```python
@router.post("/webauthn/login/verify")
async def webauthn_login_verify(
    credential: dict,
    session_token: str,
    db: Session = Depends(get_db)
):
    # Recuperar challenge y credencial guardada del alumno
    challenge = await redis.get(f"challenge:{credential['user_id']}")
    stored_credential = db.query(WebAuthnCredential).filter(...).first()

    verification = webauthn.verify_authentication_response(
        credential=credential,
        expected_challenge=challenge,
        expected_rp_id="tu-dominio.com",
        expected_origin="https://tu-dominio.com",
        credential_public_key=stored_credential.public_key,
        credential_current_sign_count=stored_credential.sign_count,
        require_user_verification=True,  # OBLIGATORIO para biometría
    )

    # Registrar asistencia
    attendance = Attendance(
        session_id=session_token,
        student_id=stored_credential.student_id,
        method="webauthn",
    )
    db.add(attendance)
    db.commit()

    return {"status": "present"}
```

### Tabla adicional para credenciales WebAuthn

```sql
webauthn_credentials
├── id (PK)
├── student_id (FK)
├── credential_id     ← ID único devuelto por el autenticador
├── public_key        ← llave pública del alumno (CBOR encoded)
├── sign_count        ← contador para detectar clonación
├── created_at
└── device_type       ← "platform" (celular) o "cross-platform" (llave física)
```

## Implementación en JavaScript (Frontend)

```javascript
// src/services/webauthn.js

// Registro de huella
export async function registerFingerprint(studentId) {
  // 1. Pedir opciones al servidor
  const optionsRes = await api.post('/webauthn/register', { student_id: studentId });
  const options = optionsRes.data;

  // 2. Crear credencial en el dispositivo (abre el diálogo de huella/Face ID)
  const credential = await navigator.credentials.create({
    publicKey: parseCreationOptions(options)  // convierte base64url a ArrayBuffer
  });

  // 3. Enviar credencial al servidor
  await api.post('/webauthn/register/verify', serializeCredential(credential));
}

// Verificación de huella al pasar lista
export async function verifyAttendance(sessionToken) {
  // 1. Pedir challenge
  const challengeRes = await api.post('/webauthn/login', { session_token: sessionToken });

  // 2. El celular verifica la huella y firma el challenge
  const assertion = await navigator.credentials.get({
    publicKey: parseRequestOptions(challengeRes.data)
  });

  // 3. Enviar firma al servidor
  await api.post('/webauthn/login/verify', {
    credential: serializeAssertion(assertion),
    session_token: sessionToken,
  });
}
```

## Compatibilidad

WebAuthn funciona en:

- iOS Safari 14+ (Face ID / Touch ID)
- Android Chrome 70+ (huella dactilar del dispositivo)
- Chrome, Firefox, Edge en desktop (Windows Hello, Touch ID en Mac)

Prácticamente todos los celulares de tus alumnos lo soportan.

## Consideraciones legales (México)

Bajo la **Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)**, los datos biométricos son datos personales sensibles. Con WebAuthn, la institución **no almacena datos biométricos** — solo llaves públicas criptográficas — lo que simplifica enormemente el cumplimiento normativo. Documenta esto en tu aviso de privacidad.

## Hoja de ruta de implementación

1. ✅ Fase 1 completa (matrícula + PIN)
2. Agregar Redis para almacenamiento de challenges (o usar la BD con expiración)
3. Instalar `py-webauthn` en el backend
4. Crear endpoint `/webauthn/register` y `/webauthn/login`
5. En el frontend, implementar `navigator.credentials.create()` y `.get()`
6. Agregar tabla `webauthn_credentials` via migración Alembic
7. Pruebas con celulares reales en el salón
