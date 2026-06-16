import api from './api'

export const attendanceService = {
  // Público: el alumno marca su asistencia
  checkIn: async (formToken, studentId, pin) => {
    const { data } = await api.post('/attendance/check-in', {
      form_token: formToken,
      student_id: studentId,
      pin,
    })
    return data
  },

  getQrToken: async (sessionToken) => {
    const { data } = await api.get(`/attendance/qr-token?session_token=${sessionToken}`)
    return data
  },

  verifyQrToken: async (qrToken) => {
    const { data } = await api.post('/attendance/verify-qr', {
      qr_token: qrToken
    })
    return data
  },

  // Profesor: marca manualmente a un alumno
  markManual: async (sessionId, studentId) => {
    const { data } = await api.post('/attendance/manual', {
      session_id: sessionId,
      student_id: studentId,
    })
    return data
  },

  // Profesor: lista asistencias de la sesión activa
  getBySession: async (sessionToken) => {
    const { data } = await api.get(`/attendance/session/${sessionToken}`)
    return data
  },
}
