import api from './api'

export const reportService = {
  getGroupReport: async (groupId) => {
    const { data } = await api.get(`/reports/${groupId}`)
    return data
  },

  exportCSV: (groupId) => {
    // Descarga directa aprovechando el streaming del backend
    const token = localStorage.getItem('access_token')
    const base = import.meta.env.VITE_API_URL || '/api/v1'
    const url = `${base}/reports/${groupId}/export/csv`
    const a = document.createElement('a')
    a.href = url
    // El backend envía el Authorization en header — usamos fetch con blob
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob)
        a.href = blobUrl
        a.download = `reporte_asistencia_${groupId}.csv`
        a.click()
        URL.revokeObjectURL(blobUrl)
      })
  },
}
