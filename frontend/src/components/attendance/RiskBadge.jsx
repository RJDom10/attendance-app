import { AlertTriangle, CheckCircle } from 'lucide-react'

export default function RiskBadge({ atRisk, percent }) {
  if (atRisk) {
    return (
      <span className="badge badge-danger">
        <AlertTriangle size={10} />
        En riesgo · {percent?.toFixed(1)}%
      </span>
    )
  }
  return (
    <span className="badge badge-success">
      <CheckCircle size={10} />
      OK · {percent?.toFixed(1)}%
    </span>
  )
}
