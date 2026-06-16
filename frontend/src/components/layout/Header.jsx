import { useLocation } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'

const TITLES = {
  '/dashboard': 'Panel principal',
  '/subjects': 'Materias',
}

function getTitleFromPath(path) {
  if (TITLES[path]) return TITLES[path]
  if (path.includes('/groups/') && path.includes('/session')) return 'Sesión activa'
  if (path.includes('/groups/')) return 'Detalle del grupo'
  if (path.includes('/subjects/')) return 'Grupos'
  if (path.includes('/reports/')) return 'Reporte de asistencia'
  return 'AttendanceApp'
}

export default function Header() {
  const { pathname } = useLocation()
  const title = getTitleFromPath(pathname)

  return (
    <header className="header">
      <div className="header-title">{title}</div>
      <div className="header-actions">
        {/* Futura: búsqueda global */}
      </div>
    </header>
  )
}
