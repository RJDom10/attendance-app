import RiskBadge from '../attendance/RiskBadge'
import { Users, AlertTriangle } from 'lucide-react'

export default function AttendanceReportTable({ report }) {
  const { students = [], total_sessions, minimum_percent } = report

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Matrícula</th>
            <th>Nombre completo</th>
            <th>Asistencias</th>
            <th>Progreso</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const pct = s.attendance_percent
            const progressVariant = s.at_risk
              ? 'danger'
              : pct >= minimum_percent
              ? 'success'
              : 'warning'
            return (
              <tr key={s.student_id}>
                <td>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {s.student_number}
                  </span>
                </td>
                <td className="td-name">{s.full_name}</td>
                <td>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {s.attended_sessions}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    &nbsp;/ {s.total_sessions}
                  </span>
                </td>
                <td style={{ minWidth: 160 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div
                        className={`progress-fill ${progressVariant}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      minWidth: 42,
                      color: s.at_risk ? 'var(--danger)' : 'var(--text-primary)',
                    }}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td>
                  <RiskBadge atRisk={s.at_risk} percent={pct} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
