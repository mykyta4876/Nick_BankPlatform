import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  register: (data: { email: string; password: string; full_name: string; role?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

// Wallet
export const walletApi = {
  getMe: () => api.get('/wallets/me'),
  deposit: (data: { amount: number; description?: string }) =>
    api.post('/wallets/deposit', data),
  withdraw: (data: { amount: number; description?: string }) =>
    api.post('/wallets/withdraw', data),
}

// Credit
export const creditApi = {
  getMe: () => api.get('/credit/me'),
  draw: (data: { amount: number; description?: string }) =>
    api.post('/credit/draw', data),
}

// Transactions
export const transactionsApi = {
  getMe: (params?: { limit?: number; offset?: number }) =>
    api.get('/transactions/me', { params }),
}
