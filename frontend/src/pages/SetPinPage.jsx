import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck, CheckCircle, AlertCircle, KeyRound } from 'lucide-react'
import { studentService } from '../services/studentService'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

const PIN_LENGTH = 6

export default function SetPinPage() {
  const [studentId, setStudentId] = useState('')
  const [pin, setPin] = useState(Array(PIN_LENGTH).fill(''))
  const [confirm, setConfirm] = useState(Array(PIN_LENGTH).fill(''))
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const pinRefs = useRef([])
  const confirmRefs = useRef([])

  const handleDigit = (arr, setArr, refs, i, val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 1)
    const next = [...arr]
    next[i] = cleaned
    setArr(next)
    if (cleaned && i < PIN_LENGTH - 1) refs.current[i + 1]?.focus()
  }

  const handleKey = (arr, setArr, refs, i, e) => {
    if (e.key === 'Backspace' && !arr[i] && i > 0) {
      const next = [...arr]
      next[i - 1] = ''
      setArr(next)
      refs.current[i - 1]?.focus()
    }
  }

  const pinStr     = pin.join('')
  const confirmStr = confirm.join('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!studentId.trim()) { setError('Ingresa tu número de matrícula'); return }
    if (pinStr.length < 6)  { setError('El PIN debe tener 6 dígitos'); return }
    if (pinStr !== confirmStr) { setError('Los PINs no coinciden'); return }

    setStatus('loading')
    try {
      await studentService.setPin(studentId.trim(), pinStr)
      setStatus('success')
    } catch (err) {
      setStatus('idle')
      setError(err.response?.data?.detail || 'Error al configurar el PIN')
    }
  }

  const PinInputs = ({ arr, setArr, refs, prefix }) => (
    <div className="pin-inputs">
      {arr.map((digit, i) => (
        <input
          key={i}
          ref={el => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          className={`pin-digit ${digit ? 'filled' : ''}`}
          value={digit}
          onChange={e => handleDigit(arr, setArr, refs, i, e.target.value)}
          onKeyDown={e => handleKey(arr, setArr, refs, i, e)}
          id={`${prefix}-${i}`}
          autoComplete="off"
        />
      ))}
    </div>
  )

  return (
    <div className="checkin-layout">
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 52, background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <ClipboardCheck size={16} style={{ color: 'var(--accent-hover)' }} />
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          AttendanceApp
        </span>
      </div>

      <div className="checkin-card" style={{ marginTop: '16px' }}>
        {status !== 'success' ? (
          <>
            <div className="checkin-header">
              <div className="checkin-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <KeyRound />
              </div>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Configurar PIN
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Elige un PIN de 6 dígitos para registrar tu asistencia en el futuro
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Input
                label="Número de matrícula"
                id="set-student-id"
                placeholder="ej. A00123456"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                autoComplete="off"
                required
              />

              <div className="form-group">
                <label className="form-label">Nuevo PIN</label>
                <PinInputs arr={pin} setArr={setPin} refs={pinRefs} prefix="pin" />
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar PIN</label>
                <PinInputs arr={confirm} setArr={setConfirm} refs={confirmRefs} prefix="confirm" />
              </div>

              {error && (
                <div className="alert alert-danger">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full btn-lg" loading={status === 'loading'}>
                Guardar PIN
              </Button>
            </form>
          </>
        ) : (
          <div className="checkin-success animate-fade">
            <div className="success-circle">
              <CheckCircle />
            </div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem' }}>¡PIN configurado!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Ya puedes usar tu matrícula y PIN para registrar asistencia.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
