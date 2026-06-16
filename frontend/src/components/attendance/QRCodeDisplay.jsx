import { QRCodeSVG } from 'qrcode.react'
import { Copy, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { attendanceService } from '../../services/attendanceService'

export default function QRCodeDisplay({ sessionToken }) {
  const [qrToken, setQrToken] = useState('')

  useEffect(() => {
    let mounted = true
    const fetchToken = async () => {
      try {
        const { qr_token } = await attendanceService.getQrToken(sessionToken)
        if (mounted) setQrToken(qr_token)
      } catch (err) {
        console.error('Error fetching QR token', err)
      }
    }

    fetchToken()
    const interval = setInterval(fetchToken, 15000) // Refresh every 15s
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [sessionToken])

  // Construct URL with the short-lived token
  const checkInUrl = qrToken 
    ? `${window.location.origin}/checkin/${sessionToken}?t=${qrToken}`
    : `${window.location.origin}/checkin/${sessionToken}`

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
