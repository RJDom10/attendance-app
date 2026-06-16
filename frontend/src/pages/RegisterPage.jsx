import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, ClipboardCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name || form.name.length < 2) e.name = 'El nombre debe tener al menos 2 caracteres'
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Correo no válido'
    if (!form.password || form.password.length < 8) e.password = 'La contraseña debe tener al menos 8 caracteres'
    if (form.password !== form.confirm) e.confirm = 'Las contraseñas no coinciden'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    const result = await register(form.name, form.email, form.password)
    if (result.success) {
      toast.success('Cuenta creada. ¡Ahora inicia sesión!')
      navigate('/login')
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
      {/* Left decorative panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand-icon">
            <ClipboardCheck />
          </div>
          <h1>Crea tu cuenta</h1>
          <p>Registra tu perfil de profesor para empezar a gestionar la asistencia de tus grupos en segundos.</p>
        </div>
      </div>

      {/* Right — register form */}
      <div className="auth-right">
        <div className="auth-form-box animate-fade">
          <h2 className="auth-form-title">Registro de profesor</h2>
          <p className="auth-form-subtitle">Completa los datos para crear tu cuenta</p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <Input
              label="Nombre completo"
              id="name"
              placeholder="Dr. Juan García Pérez"
              iconLeft={User}
              required
              value={form.name}
              onChange={set('name')}
              error={errors.name}
              autoComplete="name"
            />
            <Input
              label="Correo electrónico"
              type="email"
              id="reg-email"
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
              id="reg-password"
              placeholder="Mínimo 8 caracteres"
              iconLeft={Lock}
              required
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              hint="Usa letras, números y símbolos para mayor seguridad"
              autoComplete="new-password"
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              id="reg-confirm"
              placeholder="Repite la contraseña"
              iconLeft={Lock}
              required
              value={form.confirm}
              onChange={set('confirm')}
              error={errors.confirm}
              autoComplete="new-password"
            />
            <Button type="submit" loading={loading} className="w-full btn-lg" style={{ marginTop: '4px' }}>
              Crear cuenta
            </Button>
          </form>

          <p className="auth-form-footer">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
