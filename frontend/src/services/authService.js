import api from './api'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },

  refresh: async (refreshToken) => {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    })
    return data
  },

  register: async (name, email, password) => {
    const { data } = await api.post('/professors/', { name, email, password })
    return data
  },
}
