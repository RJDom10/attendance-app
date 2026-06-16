import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ClipboardCheck, BarChart2, Users, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

const FEATURES = [
  { icon: Users,       text: 'Importa listas de alumnos desde CSV o Excel' },
  { icon: BarChart2,   text: 'Reportes de asistencia con alertas al 80%' },
  { icon: Shield,      text: 'Registro seguro con PIN de 6 dígitos' },
]

export default function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'El correo es obligatorio'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Correo no válido'
    if (!form.password) e.password = 'La contraseña es obligatoria'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    const result = await login(form.email, form.password)
    if (result.success) {
      toast.success('Bienvenido de vuelta')
      navigate('/dashboard')
    } else {
      toast.error(result.error)
    }
  }

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="auth-layout">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand-icon">
            <ClipboardCheck />
          </div>
          <h1>AttendanceApp</h1>
          <p>Sistema de control de asistencia para cursos universitarios. Rápido, seguro y sin papel.</p>

          <div className="auth-features">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div className="auth-feature" key={text}>
                <div className="auth-feature-dot"><Icon /></div>
                <span className="auth-feature-text">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-right">
        <div className="auth-form-box animate-fade">
          <h2 className="auth-form-title">Iniciar sesión</h2>
          <p className="auth-form-subtitle">Accede con tu cuenta de profesor</p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <Input
              label="Correo electrónico"
              type="email"
              id="email"
              placeholder="profesor@universidad.edu"
              iconLeft={Mail}
              required
              value={form.email}
              onChange={set('email')}
              error={errors.email}
              autoComplete="email"
            />
            <Input
              label="Contraseña"
              type="password"
              id="password"
              placeholder="••••••••"
              iconLeft={Lock}
              required
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              autoComplete="current-password"
            />
            <Button type="submit" loading={loading} className="w-full btn-lg" style={{ marginTop: '4px' }}>
              Entrar
            </Button>
          </form>

          <p className="auth-form-footer">
            ¿Aún no tienes cuenta?{' '}
            <Link to="/register">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
