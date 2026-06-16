import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ClipboardCheck, CheckCircle, AlertCircle } from 'lucide-react'
import { attendanceService } from '../services/attendanceService'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const PIN_LENGTH = 6

export default function CheckInPage() {
  const { sessionToken } = useParams()
  const [studentId, setStudentId] = useState('')
  const [pin, setPin] = useState(Array(PIN_LENGTH).fill(''))
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const [studentError, setStudentError] = useState('')
  const digitRefs = useRef([])

  // Focus first PIN digit when student_id is filled
  useEffect(() => {
    if (studentId.length >= 5) {
      digitRefs.current[0]?.focus()
    }
  }, [studentId])

  const pinStr = pin.join('')

  const handleDigit = (i, val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 1)
    const next = [...pin]
    next[i] = cleaned
    setPin(next)
    if (cleaned && i < PIN_LENGTH - 1) {
      digitRefs.current[i + 1]?.focus()
    }
  }

  const handleDigitKey = (i, e) => {
    if (e.key === 'Backspace' && !pin[i] && i > 0) {
      const next = [...pin]
      next[i - 1] = ''
      setPin(next)
      digitRefs.current[i - 1]?.focus()
    }
    if (e.key === 'Enter' && pinStr.length === PIN_LENGTH && studentId) {
      handleSubmit()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH)
    const next = Array(PIN_LENGTH).fill('')
    text.split('').forEach((ch, i) => { next[i] = ch })
    setPin(next)
    const lastFilled = Math.min(text.length, PIN_LENGTH - 1)
    digitRefs.current[lastFilled]?.focus()
  }

  const handleSubmit = async () => {
    setStudentError('')
    setErrorMsg('')

    if (!studentId.trim()) {
      setStudentError('Ingresa tu número de matrícula')
      return
    }
    if (pinStr.length < PIN_LENGTH) {
      setErrorMsg('Ingresa tu PIN de 6 dígitos completo')
      return
    }

    setStatus('loading')
    try {
      await attendanceService.checkIn(sessionToken, studentId.trim(), pinStr)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.response?.data?.detail || 'Error al registrar asistencia')
    }
  }

  const reset = () => {
    setStatus('idle')
    setPin(Array(PIN_LENGTH).fill(''))
    setStudentId('')
    setErrorMsg('')
    setStudentError('')
  }

  return (
    <div className="checkin-layout">
      {/* Header bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 52, background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8,
      }}>
        <ClipboardCheck size={16} style={{ color: 'var(--accent-hover)' }} />
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          AttendanceApp
        </span>
      </div>

      <div className="checkin-card" style={{ marginTop: '16px' }}>
        {/* ─── Idle / Form ─── */}
        {(status === 'idle' || status === 'loading' || status === 'error') && (
          <>
            <div className="checkin-header">
              <div className="checkin-icon">
                <ClipboardCheck />
              </div>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Registro de asistencia
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Ingresa tu matrícula y PIN para confirmar tu presencia
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Input
                label="Número de matrícula"
                id="student-id"
                placeholder="ej. A00123456"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                error={studentError}
                autoComplete="off"
                autoCapitalize="none"
                inputMode="text"
              />

              {/* PIN boxes */}
              <div className="form-group">
                <label className="form-label">PIN de 6 dígitos</label>
                <div className="pin-inputs" onPaste={handlePaste}>
                  {pin.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (digitRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      className={`pin-digit ${digit ? 'filled' : ''}`}
                      value={digit}
                      onChange={(e) => handleDigit(i, e.target.value)}
                      onKeyDown={(e) => handleDigitKey(i, e)}
                      autoComplete="off"
                      id={`pin-${i}`}
                    />
                  ))}
                </div>
              </div>

              {status === 'error' && (
                <div className="alert alert-danger">
                  <AlertCircle size={16} />
                  {errorMsg}
                </div>
              )}

              <Button
                className="w-full btn-lg"
                loading={status === 'loading'}
                disabled={!studentId || pinStr.length < PIN_LENGTH}
                onClick={handleSubmit}
              >
                Registrar asistencia
              </Button>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                ¿No tienes PIN? Tu PIN inicial son los últimos 4 dígitos de tu matrícula + <code style={{ color: 'var(--accent-hover)' }}>00</code>.
                Ej. matrícula <code>A00<strong>1234</strong></code> → PIN <code>123400</code>
              </p>
            </div>
          </>
        )}

        {/* ─── Success ─── */}
        {status === 'success' && (
          <div className="checkin-success animate-fade">
            <div className="success-circle">
              <CheckCircle />
            </div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem' }}>
              ¡Asistencia registrada!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Tu presencia ha sido confirmada exitosamente.
            </p>
            <div style={{
              background: 'var(--success-subtle)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: '10px',
              padding: '12px 18px',
              fontSize: '0.8125rem',
              color: 'var(--success)',
              fontWeight: 600,
            }}>
              Matrícula: {studentId}
            </div>
            <button
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                fontSize: '0.8125rem', cursor: 'pointer', marginTop: '8px',
              }}
              onClick={reset}
            >
              Registrar otra cuenta
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
