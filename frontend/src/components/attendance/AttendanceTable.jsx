import { CheckCircle, UserCheck, Clock } from 'lucide-react'

function fmt(dt) {
  return new Date(dt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

export default function AttendanceTable({ records, students = [] }) {
  // Creamos un mapa de student_id → datos del alumno
  const studentMap = {}
  students.forEach((s) => { studentMap[s.id] = s })

  if (!records.length) {
    return (
      <div className="empty-state" style={{ padding: '40px 0' }}>
        <div className="empty-icon"><UserCheck /></div>
        <h3>Sin registros aún</h3>
        <p>Cuando los alumnos marquen asistencia aparecerán aquí</p>
      </div>
    )
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre completo</th>
            <th>Matrícula</th>
            <th>Hora</th>
            <th>Método</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => {
            const s = studentMap[r.student_id]
            const name = s ? `${s.first_name} ${s.last_name}` : r.student_id
            const studentNumber = s?.student_id ?? '—'
            return (
              <tr key={r.id} className="attendance-row-new">
                <td style={{ color: 'var(--text-muted)', width: 40 }}>{i + 1}</td>
                <td className="td-name">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: 28, height: 28,
                      borderRadius: '50%',
                      background: 'var(--accent-subtle)',
                      color: 'var(--accent-hover)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                    }}>
                      {name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    {name}
                  </div>
                </td>
                <td>{studentNumber}</td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                    <Clock size={12} />
                    {fmt(r.checked_in_at)}
                  </span>
                </td>
                <td>
                  <span className={`badge ${r.method === 'manual' ? 'badge-warning' : 'badge-success'}`}>
                    <CheckCircle size={10} />
                    {r.method === 'manual' ? 'Manual' : 'Web'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
