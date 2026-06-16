import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Plus, ArrowRight, Calendar } from 'lucide-react'
import { subjectService } from '../services/subjectService'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import { PageSpinner } from '../components/ui/Spinner'
import toast from 'react-hot-toast'

function SubjectCard({ subject }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      transition: 'var(--transition)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {subject.name}
          </h4>
          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent-hover)' }}>
            {subject.code}
          </span>
        </div>
        <span className="badge badge-muted">
          <Calendar size={10} />
          {subject.semester}
        </span>
      </div>
      <Link to={`/subjects/${subject.id}/groups`} style={{ marginTop: 'auto' }}>
        <Button variant="secondary" size="sm" className="w-full" iconRight={ArrowRight}>
          Ver grupos
        </Button>
      </Link>
    </div>
  )
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', semester: '' })
  const [errors, setErrors] = useState({})

  const load = async () => {
    try {
      const data = await subjectService.list()
      setSubjects(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const validate = () => {
    const e = {}
    if (!form.name) e.name = 'El nombre es obligatorio'
    if (!form.code) e.code = 'El código es obligatorio'
    if (!form.semester || !/^\d{4}-[12]$/.test(form.semester))
      e.semester = 'Formato: 2025-1 o 2025-2'
    return e
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      await subjectService.create(form)
      toast.success('Materia creada correctamente')
      setModalOpen(false)
      setForm({ name: '', code: '', semester: '' })
      setErrors({})
      await load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear la materia')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageSpinner />

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Mis materias</h1>
          <p>Organiza tus materias por semestre y gestiona sus grupos.</p>
        </div>
        <div className="page-header-actions">
          <Button icon={Plus} onClick={() => setModalOpen(true)}>
            Nueva materia
          </Button>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><BookOpen /></div>
          <h3>Sin materias</h3>
          <p>Crea tu primera materia para empezar a gestionar grupos y asistencias</p>
          <Button icon={Plus} onClick={() => setModalOpen(true)}>Crear materia</Button>
        </div>
      ) : (
        <div className="grid-3">
          {subjects.map((s) => <SubjectCard key={s.id} subject={s} />)}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setErrors({}) }}
        title="Nueva materia"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleCreate}>Crear materia</Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="auth-form" noValidate>
          <Input
            label="Nombre de la materia"
            id="sub-name"
            placeholder="ej. Estadística Aplicada"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />
          <div className="grid-2">
            <Input
              label="Código"
              id="sub-code"
              placeholder="ej. LCDN6MOD10"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              error={errors.code}
            />
            <Input
              label="Semestre"
              id="sub-semester"
              placeholder="ej. 2025-1"
              required
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              error={errors.semester}
              hint="Formato: YYYY-1 o YYYY-2"
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
