import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, Users, ClipboardList, AlertTriangle,
  ArrowRight, Plus, Activity,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { subjectService } from '../services/subjectService'
import { groupService } from '../services/groupService'
import { sessionService } from '../services/sessionService'
import StatCard from '../components/ui/StatCard'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { PageSpinner } from '../components/ui/Spinner'
import Button from '../components/ui/Button'

export default function DashboardPage() {
  const { professor } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [activeSessions, setActiveSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const subs = await subjectService.list()
        setSubjects(subs)

        // Cargar grupos y sesiones activas de todas las materias
        const allActive = []
        for (const sub of subs) {
          const groups = await groupService.listBySubject(sub.id)
          for (const g of groups) {
            const sessions = await sessionService.listByGroup(g.id)
            const active = sessions.find((s) => s.is_open)
            if (active) allActive.push({ ...active, groupName: g.name, subjectName: sub.name })
          }
        }
        setActiveSessions(allActive)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const displayName = professor?.name
    ? professor.name.split(' ')[0]
    : 'Profesor'

  if (loading) return <PageSpinner />

  return (
    <div className="animate-fade">
      {/* Greeting */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>{greeting()}, {displayName} 👋</h1>
          <p>Aquí tienes un resumen de tus clases de hoy.</p>
        </div>
        <div className="page-header-actions">
          <Link to="/subjects">
            <Button icon={Plus}>Nueva materia</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-stats">
        <StatCard
          icon={BookOpen}
          value={subjects.length}
          label="Materias activas"
          variant="accent"
        />
        <StatCard
          icon={Activity}
          value={activeSessions.length}
          label="Sesiones abiertas ahora"
          variant="success"
        />
        <StatCard
          icon={ClipboardList}
          value={subjects.length > 0 ? '80%' : '—'}
          label="Asistencia mínima requerida"
          variant="warning"
        />
      </div>

      {/* Active sessions alert */}
      {activeSessions.length > 0 && (
        <div className="alert alert-success" style={{ marginBottom: '24px' }}>
          <Activity size={16} />
          <div>
            <strong>Tienes {activeSessions.length} sesión{activeSessions.length > 1 ? 'es' : ''} abierta{activeSessions.length > 1 ? 's' : ''}.</strong>{' '}
            Los alumnos pueden registrar su asistencia ahora mismo.
          </div>
        </div>
      )}

      {/* Subjects quick access */}
      <Card>
        <CardHeader
          actions={
            <Link to="/subjects">
              <Button variant="ghost" size="sm" iconRight={ArrowRight}>Ver todo</Button>
            </Link>
          }
        >
          <span className="card-title">
            <BookOpen />
            Mis materias
          </span>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {subjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><BookOpen /></div>
              <h3>Sin materias aún</h3>
              <p>Crea tu primera materia para comenzar a registrar asistencias</p>
              <Link to="/subjects">
                <Button icon={Plus}>Crear materia</Button>
              </Link>
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Materia</th>
                    <th>Código</th>
                    <th>Semestre</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.slice(0, 5).map((s) => (
                    <tr key={s.id}>
                      <td className="td-name">{s.name}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {s.code}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-muted">{s.semester}</span>
                      </td>
                      <td>
                        <Link to={`/subjects/${s.id}/groups`}>
                          <Button variant="ghost" size="sm" iconRight={ArrowRight}>Ver grupos</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
