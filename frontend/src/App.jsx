import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'

// Auth pages (public)
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Student pages (public)
import CheckInPage  from './pages/CheckInPage'
import SetPinPage   from './pages/SetPinPage'

// Professor pages (protected)
import DashboardPage     from './pages/DashboardPage'
import SubjectsPage      from './pages/SubjectsPage'
import GroupsPage        from './pages/GroupsPage'
import GroupDetailPage   from './pages/GroupDetailPage'
import ActiveSessionPage from './pages/ActiveSessionPage'
import ReportPage        from './pages/ReportPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <Routes>
      {/* ── Guest routes ───────────────────────────── */}
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* ── Public student routes ───────────────────── */}
      <Route path="/checkin/:sessionToken" element={<CheckInPage />} />
      <Route path="/set-pin"              element={<SetPinPage />} />

      {/* ── Protected professor routes ──────────────── */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"                                    element={<DashboardPage />} />
        <Route path="/subjects"                                     element={<SubjectsPage />} />
        <Route path="/subjects/:subjectId/groups"                   element={<GroupsPage />} />
        <Route path="/groups/:groupId"                              element={<GroupDetailPage />} />
        <Route path="/groups/:groupId/session/:sessionToken"        element={<ActiveSessionPage />} />
        <Route path="/reports/:groupId"                             element={<ReportPage />} />
      </Route>

      {/* ── Catch-all ───────────────────────────────── */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
