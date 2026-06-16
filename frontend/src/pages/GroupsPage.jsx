import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Users, Plus, ArrowRight, ChevronLeft, BookOpen } from 'lucide-react'
import { groupService } from '../services/groupService'
import { subjectService } from '../services/subjectService'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import { PageSpinner } from '../components/ui/Spinner'
import toast from 'react-hot-toast'

export default function GroupsPage() {
  const { subjectId } = useParams()
  const [subject, setSubject] = useState(null)
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', schedule: '' })
  const [errors, setErrors] = useState({})

  const load = async () => {
    try {
      const [sub, grps] = await Promise.all([
        subjectService.get(subjectId),
        groupService.listBySubject(subjectId),
      ])
      setSubject(sub)
      setGroups(grps)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [subjectId])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name) { setErrors({ name: 'El nombre es obligatorio' }); return }

    setSaving(true)
    try {
      await groupService.create({ name: form.name, subject_id: subjectId, schedule: form.schedule || null })
      toast.success('Grupo creado')
      setModalOpen(false)
      setForm({ name: '', schedule: '' })
      setErrors({})
      await load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear el grupo')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageSpinner />

  return (
    <div className="animate-fade">
      {/* Back link */}
      <Link to="/subjects" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px', transition: 'var(--transition-fast)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <ChevronLeft size={16} />
        Volver a materias
      </Link>

      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: 36, height: 36, background: 'var(--accent-subtle)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={16} style={{ color: 'var(--accent-hover)' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', marginBottom: '2px' }}>{subject?.name}</h1>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent-hover)' }}>
                {subject?.code} · {subject?.semester}
              </span>
            </div>
          </div>
          <p>Grupos de esta materia</p>
        </div>
        <div className="page-header-actions">
          <Button icon={Plus} onClick={() => setModalOpen(true)}>Nuevo grupo</Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Users /></div>
          <h3>Sin grupos</h3>
          <p>Crea un grupo y luego importa la lista de alumnos</p>
          <Button icon={Plus} onClick={() => setModalOpen(true)}>Crear primer grupo</Button>
        </div>
      ) : (
        <div className="grid-3">
          {groups.map((g) => (
            <div key={g.id} style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              transition: 'var(--transition)',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ color: 'var(--text-primary)' }}>{g.name}</h4>
                <span className="badge badge-muted">
                  <Users size={10} />
                  {g.total_students ?? 0} alumnos
                </span>
              </div>
              {g.schedule && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{g.schedule}</p>
              )}
              <Link to={`/groups/${g.id}`} style={{ marginTop: 'auto' }}>
                <Button variant="secondary" size="sm" className="w-full" iconRight={ArrowRight}>
                  Gestionar grupo
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setErrors({}) }}
        title="Nuevo grupo"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleCreate}>Crear grupo</Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="auth-form" noValidate>
          <Input
            label="Nombre del grupo"
            id="grp-name"
            placeholder="ej. Grupo A, Matutino, N1"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />
          <Input
            label="Horario (opcional)"
            id="grp-schedule"
            placeholder="ej. Lunes y Miércoles 10:00–12:00"
            value={form.schedule}
            onChange={(e) => setForm({ ...form, schedule: e.target.value })}
            hint="Se mostrará en la tarjeta del grupo"
          />
        </form>
      </Modal>
    </div>
  )
}
