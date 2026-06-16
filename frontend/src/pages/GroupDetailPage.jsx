import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Users, Upload, Play, BarChart2, ChevronLeft,
  Clock, CheckCircle, FileText, Plus, Trash2
} from 'lucide-react'
import { studentService } from '../services/studentService'
import { sessionService } from '../services/sessionService'
import { groupService } from '../services/groupService'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import { PageSpinner } from '../components/ui/Spinner'
import toast from 'react-hot-toast'

function SessionRow({ session, groupId }) {
  const navigate = useNavigate()
  const dateStr = new Date(session.session_date).toLocaleDateString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short',
  })

  return (
    <tr>
      <td className="td-name">{dateStr}</td>
      <td>{session.topic || <span style={{ color: 'var(--text-muted)' }}>Sin tema</span>}</td>
      <td>
        <span className="badge badge-muted">
          <CheckCircle size={10} />
          {session.attendance_count ?? 0} presentes
        </span>
      </td>
      <td>
        {session.is_open ? (
          <span className="badge badge-active">Activa</span>
        ) : (
          <span className="badge badge-muted">Cerrada</span>
        )}
      </td>
      <td>
        {session.is_open && (
          <Button
            variant="success"
            size="sm"
            onClick={() => navigate(`/groups/${groupId}/session/${session.session_token}`)}
          >
            Abrir lista
          </Button>
        )}
      </td>
    </tr>
  )
}

export default function GroupDetailPage() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [students, setStudents] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [openingSession, setOpeningSession] = useState(false)
  const [sessionModal, setSessionModal] = useState(false)
  const [topic, setTopic] = useState('')
  const [studentModal, setStudentModal] = useState(false)
  const [newStudent, setNewStudent] = useState({ student_id: '', first_name: '', last_name: '', email: '' })
  const [addingStudent, setAddingStudent] = useState(false)
  const [deletingGroup, setDeletingGroup] = useState(false)

  const load = async () => {
    try {
      const [sts, sess] = await Promise.all([
        studentService.listByGroup(groupId),
        sessionService.listByGroup(groupId),
      ])
      setStudents(sts)
      setSessions(sess)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [groupId])

  const activeSession = sessions.find((s) => s.is_open)

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const result = await studentService.importCSV(groupId, file)
      toast.success(
        `✅ ${result.students_created} creados, ${result.students_enrolled} inscritos`
      )
      if (result.errors?.length) {
        result.errors.forEach((err) => toast.error(err, { duration: 5000 }))
      }
      await load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al importar')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const handleOpenSession = async () => {
    if (activeSession) {
      navigate(`/groups/${groupId}/session/${activeSession.session_token}`)
      return
    }
    setOpeningSession(true)
    try {
      const session = await sessionService.open(groupId, topic || null)
      toast.success('Sesión abierta. ¡Comparte el QR con tus alumnos!')
      setSessionModal(false)
      setTopic('')
      navigate(`/groups/${groupId}/session/${session.session_token}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al abrir sesión')
    } finally {
      setOpeningSession(false)
    }
  }

  const handleAddStudent = async (e) => {
    e.preventDefault()
    if (!newStudent.student_id || !newStudent.first_name || !newStudent.last_name) {
      toast.error('Matrícula, nombre y apellidos son obligatorios')
      return
    }
    setAddingStudent(true)
    try {
      await studentService.create({ ...newStudent, email: newStudent.email || undefined, group_id: groupId })
      toast.success('Alumno agregado')
      setStudentModal(false)
      setNewStudent({ student_id: '', first_name: '', last_name: '', email: '' })
      await load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear alumno')
    } finally {
      setAddingStudent(false)
    }
  }

  const handleDeleteGroup = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este grupo? Se perderán todas las sesiones y asistencias asociadas. Esta acción no se puede deshacer.')) {
      return
    }
    setDeletingGroup(true)
    try {
      await groupService.delete(groupId)
      toast.success('Grupo eliminado')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al eliminar grupo')
      setDeletingGroup(false)
    }
  }

  const handleUnenrollStudent = async (student) => {
    if (!window.confirm(`¿Seguro que deseas eliminar a ${student.first_name} ${student.last_name} de este grupo? Se perderán sus asistencias en estas sesiones.`)) {
      return
    }
    try {
      await studentService.unenroll(groupId, student.id)
      toast.success('Alumno desinscrito correctamente')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al desinscribir alumno')
    }
  }

  if (loading) return <PageSpinner />

  return (
    <div className="animate-fade">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Detalle del grupo</h1>
          <p>
            {students.length} alumnos inscritos ·{' '}
            {sessions.length} sesiones registradas
          </p>
        </div>
        <div className="page-header-actions">
          {activeSession ? (
            <Button
              variant="success"
              icon={Play}
              onClick={() => navigate(`/groups/${groupId}/session/${activeSession.session_token}`)}
            >
              Sesión activa — Abrir lista
            </Button>
          ) : (
            <Button icon={Play} onClick={() => setSessionModal(true)}>
              Iniciar clase
            </Button>
          )}
          <Link to={`/reports/${groupId}`}>
            <Button variant="secondary" icon={BarChart2}>Reporte</Button>
          </Link>
          <Button 
            variant="danger" 
            style={{ backgroundColor: 'var(--error)' }}
            icon={Trash2} 
            loading={deletingGroup}
            onClick={handleDeleteGroup}
          >
            Eliminar
          </Button>
        </div>
      </div>

      {/* Students card */}
      <Card style={{ marginBottom: '24px' }}>
        <CardHeader
          actions={
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleImport}
              />
              <Button
                variant="secondary"
                size="sm"
                icon={Upload}
                loading={importing}
                onClick={() => fileRef.current.click()}
              >
                Importar CSV/Excel
              </Button>
              <Button
                size="sm"
                icon={Plus}
                onClick={() => setStudentModal(true)}
              >
                Agregar alumno
              </Button>
            </div>
          }
        >
          <span className="card-title">
            <Users />
            Alumnos ({students.length})
          </span>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {students.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Users /></div>
              <h3>Sin alumnos inscritos</h3>
              <p>Importa un CSV o agrega alumnos individualmente</p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Matrícula</th>
                    <th>Nombre</th>
                    <th>Apellidos</th>
                    <th>Correo</th>
                    <th>Estado</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {s.student_id}
                        </span>
                      </td>
                      <td className="td-name">{s.first_name}</td>
                      <td>{s.last_name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        {s.email || '—'}
                      </td>
                      <td>
                        <span className={`badge ${s.is_active ? 'badge-success' : 'badge-muted'}`}>
                          {s.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleUnenrollStudent(s)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          title="Eliminar del grupo"
                          onMouseOver={(e) => e.currentTarget.style.color = 'var(--error)'}
                          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Sessions card */}
      <Card>
        <CardHeader>
          <span className="card-title">
            <Clock />
            Historial de sesiones ({sessions.length})
          </span>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {sessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><FileText /></div>
              <h3>Sin sesiones aún</h3>
              <p>Inicia una clase para registrar asistencias</p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tema</th>
                    <th>Asistencias</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <SessionRow key={s.id} session={s} groupId={groupId} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Open session modal */}
      <Modal
        open={sessionModal}
        onClose={() => setSessionModal(false)}
        title="Iniciar nueva clase"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSessionModal(false)}>Cancelar</Button>
            <Button loading={openingSession} icon={Play} onClick={handleOpenSession}>
              Abrir lista de asistencia
            </Button>
          </>
        }
      >
        <div className="auth-form">
          <Input
            label="Tema de la clase (opcional)"
            id="topic"
            placeholder="ej. Regresión lineal múltiple"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            hint="Aparecerá en el historial y en los reportes"
          />
          <div className="alert alert-info">
            <Play size={16} />
            Se generará un código QR único que los alumnos escanearán para registrar su asistencia.
          </div>
        </div>
      </Modal>

      {/* Add student modal */}
      <Modal
        open={studentModal}
        onClose={() => setStudentModal(false)}
        title="Agregar alumno"
        footer={
          <>
            <Button variant="secondary" onClick={() => setStudentModal(false)}>Cancelar</Button>
            <Button loading={addingStudent} onClick={handleAddStudent}>Guardar alumno</Button>
          </>
        }
      >
        <form onSubmit={handleAddStudent} className="auth-form" noValidate>
          <Input
            label="Matrícula"
            id="st-id"
            placeholder="ej. A00123456"
            required
            value={newStudent.student_id}
            onChange={(e) => setNewStudent({ ...newStudent, student_id: e.target.value })}
          />
          <div className="grid-2">
            <Input
              label="Nombre(s)"
              id="st-fn"
              placeholder="Juan"
              required
              value={newStudent.first_name}
              onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
            />
            <Input
              label="Apellidos"
              id="st-ln"
              placeholder="García Pérez"
              required
              value={newStudent.last_name}
              onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
            />
          </div>
          <Input
            label="Correo (opcional)"
            type="email"
            id="st-email"
            placeholder="alumno@universidad.edu"
            value={newStudent.email}
            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  )
}
