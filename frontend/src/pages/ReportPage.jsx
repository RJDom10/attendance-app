import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Download, AlertTriangle, BarChart2, Users, Calendar } from 'lucide-react'
import { reportService } from '../services/reportService'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import AttendanceReportTable from '../components/reports/AttendanceReportTable'
import Button from '../components/ui/Button'
import StatCard from '../components/ui/StatCard'
import { PageSpinner } from '../components/ui/Spinner'
import toast from 'react-hot-toast'

export default function ReportPage() {
  const { groupId } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await reportService.getGroupReport(groupId)
        setReport(data)
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Error al cargar el reporte')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [groupId])

  const handleExport = () => {
    setExporting(true)
    try {
      reportService.exportCSV(groupId)
      toast.success('Descargando CSV…')
    } finally {
      setTimeout(() => setExporting(false), 2000)
    }
  }

  if (loading) return <PageSpinner />
  if (!report) return null

  const atRiskCount  = report.students.filter((s) => s.at_risk).length
  const avgPct = report.students.length
    ? (report.students.reduce((a, b) => a + b.attendance_percent, 0) / report.students.length).toFixed(1)
    : 0

  const genDate = new Date(report.generated_at).toLocaleString('es-MX', {
    dateStyle: 'medium', timeStyle: 'short',
  })

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Reporte de asistencia</h1>
          <p>
            <strong style={{ color: 'var(--text-primary)' }}>{report.subject_name}</strong>
            &nbsp;·&nbsp;{report.subject_code}&nbsp;·&nbsp;{report.semester}
            &nbsp;·&nbsp;Grupo <strong style={{ color: 'var(--text-primary)' }}>{report.group_name}</strong>
          </p>
        </div>
        <div className="page-header-actions">
          <Button
            variant="secondary"
            icon={Download}
            loading={exporting}
            onClick={handleExport}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-stats" style={{ marginBottom: '24px' }}>
        <StatCard icon={Calendar}  value={report.total_sessions}  label="Sesiones impartidas" variant="accent" />
        <StatCard icon={Users}     value={report.students.length} label="Alumnos inscritos"   variant="info" />
        <StatCard icon={BarChart2} value={`${avgPct}%`}           label="Asistencia promedio" variant="success" />
        <StatCard icon={AlertTriangle} value={atRiskCount}        label="Alumnos en riesgo"  variant={atRiskCount > 0 ? 'danger' : 'success'} />
      </div>

      {/* Risk alert */}
      {atRiskCount > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '24px' }}>
          <AlertTriangle size={16} />
          <div>
            <strong>{atRiskCount} alumno{atRiskCount > 1 ? 's' : ''} está{atRiskCount > 1 ? 'n' : ''} por debajo del {report.minimum_percent}% mínimo requerido.</strong>
            {' '}Se recomienda notificarlos a la brevedad.
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <span className="card-title">
            <Users />
            Alumnos ({report.students.length})
          </span>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {report.students.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Users /></div>
              <h3>Sin alumnos en este grupo</h3>
            </div>
          ) : (
            <AttendanceReportTable report={report} />
          )}
        </CardBody>
      </Card>

      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '12px' }}>
        Generado el {genDate}
      </p>
    </div>
  )
}
