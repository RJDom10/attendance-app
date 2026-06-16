import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'
import { jwtDecode } from '../utils/jwtDecode'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [professor, setProfessor] = useState(() => {
    try {
      const stored = localStorage.getItem('professor')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  const isAuthenticated = Boolean(
    professor && localStorage.getItem('access_token')
  )

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const data = await authService.login(email, password)
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)

      // Decodificamos el token para obtener el sub (professor_id)
      const payload = jwtDecode(data.access_token)
      const prof = { id: payload.sub, email }
      localStorage.setItem('professor', JSON.stringify(prof))
      setProfessor(prof)
      return { success: true }
    } catch (err) {
      const msg =
        err.response?.data?.detail || 'Error al iniciar sesión'
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (name, email, password) => {
    setLoading(true)
    try {
      await authService.register(name, email, password)
      return { success: true }
    } catch (err) {
      const detail = err.response?.data?.detail
      const msg = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
        ? detail.map((d) => d.msg).join(', ')
        : 'Error al registrarse'
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('professor')
    setProfessor(null)
  }, [])

  // Actualizar nombre del profesor cuando lo cargamos desde el token
  const updateProfessor = useCallback((data) => {
    const updated = { ...professor, ...data }
    localStorage.setItem('professor', JSON.stringify(updated))
    setProfessor(updated)
  }, [professor])

  return (
    <AuthContext.Provider
      value={{ professor, isAuthenticated, loading, login, register, logout, updateProfessor }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
