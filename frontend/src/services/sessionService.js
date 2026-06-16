import api from './api'

export const sessionService = {
  listByGroup: async (groupId) => {
    const { data } = await api.get(`/sessions/group/${groupId}`)
    return data
  },
  open: async (groupId, topic) => {
    const { data } = await api.post('/sessions/', { group_id: groupId, topic })
    return data
  },
  close: async (sessionId) => {
    const { data } = await api.patch(`/sessions/${sessionId}/close`)
    return data
  },
}
