export default function StatCard({ icon: Icon, value, label, variant = 'accent', delta, deltaLabel }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${variant}`}>
        <Icon />
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {delta !== undefined && (
          <div className={`stat-delta ${delta >= 0 ? 'up' : 'down'}`}>
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}% {deltaLabel}
          </div>
        )}
      </div>
    </div>
  )
}
