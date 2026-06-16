import api from './api'

export const attendanceService = {
  // Público: el alumno marca su asistencia
  checkIn: async (sessionToken, studentId, pin) => {
    const { data } = await api.post('/attendance/check-in', {
      session_token: sessionToken,
      student_id: studentId,
      pin,
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
