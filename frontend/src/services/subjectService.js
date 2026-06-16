import api from './api'

export const subjectService = {
  list: async () => {
    const { data } = await api.get('/subjects/')
    return data
  },
  get: async (id) => {
    const { data } = await api.get(`/subjects/${id}`)
    return data
  },
  create: async (payload) => {
    const { data } = await api.post('/subjects/', payload)
    return data
  },
}
