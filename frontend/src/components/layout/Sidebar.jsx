import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Users, ClipboardCheck,
  BarChart2, LogOut, ClipboardList, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Panel principal' },
  { to: '/subjects', icon: BookOpen, label: 'Materias' },
]

export default function Sidebar() {
  const { professor, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = professor?.name
    ? professor.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : professor?.email?.slice(0, 2).toUpperCase() ?? 'PR'

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ClipboardCheck size={18} color="white" />
        </div>
        <div>
          <div className="sidebar-logo-text">AttendanceApp</div>
          <div className="sidebar-logo-sub">Control de asistencia</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navegación</div>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer / User info */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              {professor?.name || professor?.email || 'Profesor'}
            </div>
            <div className="sidebar-user-role">Profesor</div>
          </div>
          <button
            className="btn-logout"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
