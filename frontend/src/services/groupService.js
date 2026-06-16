import api from './api'

export const groupService = {
  listBySubject: async (subjectId) => {
    const { data } = await api.get(`/groups/subject/${subjectId}`)
    return data
  },
  create: async (payload) => {
    const { data } = await api.post('/groups/', payload)
    return data
  },
}
