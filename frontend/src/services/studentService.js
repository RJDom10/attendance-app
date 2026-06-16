import api from './api'

export const studentService = {
  listByGroup: async (groupId) => {
    const { data } = await api.get(`/students/group/${groupId}`)
    return data
  },
  create: async (payload) => {
    const { data } = await api.post('/students/', payload)
    return data
  },
  importCSV: async (groupId, file) => {
    const form = new FormData()
    form.append('group_id', groupId)
    form.append('file', file)
    const { data } = await api.post('/students/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
  setPin: async (studentId, pin) => {
    const { data } = await api.post('/students/set-pin', {
      student_id: studentId,
      pin,
    })
    return data
  },
}
