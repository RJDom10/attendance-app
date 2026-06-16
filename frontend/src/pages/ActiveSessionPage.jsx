import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Square, Users, RefreshCw, UserPlus, QrCode, Clock,
} from 'lucide-react'
import { attendanceService } from '../services/attendanceService'
import { sessionService } from '../services/sessionService'
import { studentService } from '../services/studentService'
import AttendanceTable from '../components/attendance/AttendanceTable'
import QRCodeDisplay from '../components/attendance/QRCodeDisplay'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { PageSpinner } from '../components/ui/Spinner'
import toast from 'react-hot-toast'

const POLL_MS = 5000  // refresca cada 5 segundos

export default function ActiveSessionPage() {
  const { groupId, sessionToken } = useParams()
  const navigate = useNavigate()

  const [records, setRecords] = useState([])
  const [students, setStudents] = useState([])
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [manualModal, setManualModal] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [markingManual, setMarkingManual] = useState(false)

  const pollRef = useRef(null)

  const fetchAttendance = useCallback(async () => {
    try {
      const data = await attendanceService.getBySession(sessionToken)
      setRecords(data)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Poll error', err)
    }
  }, [sessionToken])

  useEffect(() => {
    async function init() {
      try {
        const [sts, records, sessions] = await Promise.all([
          studentService.listByGroup(groupId),
          attendanceService.getBySession(sessionToken),
          sessionService.listByGroup(groupId),
        ])
        setStudents(sts)
        setRecords(records)
        const sess = sessions.find((s) => s.session_token === sessionToken)
        setSession(sess || null)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [groupId, sessionToken])

  // Polling
  useEffect(() => {
    pollRef.current = setInterval(fetchAttendance, POLL_MS)
    return () => clearInterval(pollRef.current)
  }, [fetchAttendance])

  const handleClose = async () => {
    if (!session) return
    if (!confirm('¿Cerrar la sesión? Los alumnos ya no podrán registrar asistencia.')) return
    setClosing(true)
    try {
      await sessionService.close(session.id)
      toast.success('Sesión cerrada')
      navigate(`/groups/${groupId}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al cerrar sesión')
    } finally {
      setClosing(false)
    }
  }

  const handleMarkManual = async () => {
    if (!selectedStudentId || !session) return
    setMarkingManual(true)
    try {
      await attendanceService.markManual(session.id, selectedStudentId)
      toast.success('Asistencia marcada manualmente')
      setManualModal(false)
      setSelectedStudentId('')
      await fetchAttendance()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al marcar asistencia')
    } finally {
      setMarkingManual(false)
    }
  }

  const notPresent = students.filter(
    (s) => !records.some((r) => r.student_id === s.id)
  )

  const attendance_pct = students.length
    ? Math.round((records.length / students.length) * 100)
    : 0

  if (loading) return <PageSpinner />

  return (
    <div className="animate-fade">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="live-dot">Sesión en vivo</span>
          </div>
          <h1>Lista de asistencia</h1>
          <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}>
            <Clock size={13} />
            Última actualización: {lastUpdate.toLocaleTimeString('es-MX')}
            &nbsp;· Actualiza cada 5 seg
          </p>
        </div>
        <div className="page-header-actions">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={fetchAttendance}
          >
            Actualizar
          </Button>
          <Button
            variant="secondary"
            icon={UserPlus}
            onClick={() => setManualModal(true)}
          >
            Marcar manual
          </Button>
          <Button
            variant="danger"
            icon={Square}
            loading={closing}
            onClick={handleClose}
          >
            Cerrar lista
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
        {/* Left — attendance table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Progress bar */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {records.length} de {students.length} alumnos presentes
              </span>
              <span style={{ fontWeight: 700, color: attendance_pct >= 80 ? 'var(--success)' : 'var(--warning)', fontSize: '1.1rem' }}>
                {attendance_pct}%
              </span>
            </div>
            <div className="progress-bar">
              <div
                className={`progress-fill ${attendance_pct >= 80 ? 'success' : 'warning'}`}
                style={{ width: `${attendance_pct}%` }}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <span className="card-title">
                <Users />
                Alumnos presentes ({records.length})
              </span>
            </CardHeader>
            <CardBody style={{ padding: 0 }}>
              <AttendanceTable records={records} students={students} />
            </CardBody>
          </Card>
        </div>

        {/* Right — QR + info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '80px' }}>
          <Card>
            <CardHeader>
              <span className="card-title">
                <QrCode />
                Código QR
              </span>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <QRCodeDisplay sessionToken={sessionToken} />
            </CardBody>
          </Card>

          {/* Absent students */}
          {notPresent.length > 0 && (
            <Card>
              <CardHeader>
                <span className="card-title" style={{ color: 'var(--text-muted)' }}>
                  <Users />
                  Pendientes ({notPresent.length})
                </span>
              </CardHeader>
              <CardBody style={{ padding: '12px', maxHeight: '240px', overflowY: 'auto' }}>
                {notPresent.slice(0, 15).map((s) => (
                  <div key={s.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 8px', borderRadius: '6px', marginBottom: '4px',
                    fontSize: '0.8125rem', color: 'var(--text-muted)',
                  }}>
                    <span>{s.first_name} {s.last_name}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{s.student_id}</span>
                  </div>
                ))}
                {notPresent.length > 15 && (
                  <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    + {notPresent.length - 15} más
                  </p>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Manual mark modal */}
      <Modal
        open={manualModal}
        onClose={() => setManualModal(false)}
        title="Marcar asistencia manual"
        footer={
          <>
            <Button variant="secondary" onClick={() => setManualModal(false)}>Cancelar</Button>
            <Button
              loading={markingManual}
              disabled={!selectedStudentId}
              icon={UserPlus}
              onClick={handleMarkManual}
            >
              Marcar presente
            </Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Selecciona al alumno</label>
          <select
            className="form-input"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
          >
            <option value="">— Elige un alumno —</option>
            {notPresent.map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name} ({s.student_id})
              </option>
            ))}
          </select>
          {notPresent.length === 0 && (
            <p className="form-hint">Todos los alumnos ya registraron asistencia 🎉</p>
          )}
        </div>
      </Modal>
    </div>
  )
}
