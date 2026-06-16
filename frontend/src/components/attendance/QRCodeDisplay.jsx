import { QRCodeSVG } from 'qrcode.react'
import { Copy, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

export default function QRCodeDisplay({ sessionToken }) {
  const checkInUrl = `${window.location.origin}/checkin/${sessionToken}`

  const copyUrl = () => {
    navigator.clipboard.writeText(checkInUrl)
    toast.success('Enlace copiado al portapapeles')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div className="qr-container">
        <QRCodeSVG
          value={checkInUrl}
          size={200}
          level="M"
          includeMargin={false}
        />
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '240px' }}>
        Los alumnos escanean este código para registrar su asistencia
      </p>
      <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '300px' }}>
        <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={copyUrl}>
          <Copy size={14} />
          Copiar enlace
        </button>
        <a
          href={checkInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-sm"
        >
          <ExternalLink size={14} />
        </a>
      </div>
      <div style={{
        background: 'var(--bg-elevated)',
        borderRadius: '8px',
        padding: '8px 14px',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        wordBreak: 'break-all',
        textAlign: 'center',
        border: '1px solid var(--border)',
        maxWidth: '300px',
      }}>
        {checkInUrl}
      </div>
    </div>
  )
}
