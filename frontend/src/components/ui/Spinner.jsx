export default function Spinner({ size = 'md', color }) {
  const cls = { sm: 'sm', md: '', lg: 'lg' }[size] ?? ''
  const colorCls = color === 'white' ? 'white' : ''
  return <div className={`spinner ${cls} ${colorCls}`} role="status" aria-label="Cargando…" />
}

export function PageSpinner() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <div className="spinner lg" />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cargando…</span>
    </div>
  )
}
