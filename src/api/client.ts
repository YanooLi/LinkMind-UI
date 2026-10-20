import axios, { AxiosError } from 'axios'
import type { Link, LinkPage, LinkStats, PublicConfig, RiskLevel, User } from './types'

const TOKEN_KEY = 'linkmind.token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export const http = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '' })

http.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/** Turn FastAPI error bodies ({detail: string | [{msg}]}) into one readable message. */
export function errorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const detail = err.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail[0]?.msg) return detail.map((d: { msg: string }) => d.msg).join('; ')
    if (err.response?.status === 429) return 'Too many requests, please wait a minute.'
    return err.message
  }
  return String(err)
}

export const api = {
  config: () => http.get<PublicConfig>('/api/auth/config'),
  register: (email: string, password: string, invite_code?: string) =>
    http.post<User>('/api/auth/register', { email, password, invite_code: invite_code || undefined }),
  login: (email: string, password: string) =>
    http.post<{ access_token: string }>('/api/auth/token', new URLSearchParams({ username: email, password })),
  me: () => http.get<User>('/api/auth/me'),

  listLinks: (params: { cursor?: number | null; risk?: RiskLevel | ''; q?: string; limit?: number }) =>
    http.get<LinkPage>('/api/links', {
      params: { limit: params.limit ?? 20, cursor: params.cursor ?? undefined, risk: params.risk || undefined, q: params.q || undefined },
    }),
  getLink: (id: number) => http.get<Link>(`/api/links/${id}`),
  createLink: (url: string, alias?: string) => http.post<Link>('/api/links', { url, alias: alias || undefined }),
  createBatch: (urls: string[]) =>
    http.post<{ created: Link[]; queued_for_analysis: number }>('/api/links/batch', { urls }),
  deleteLink: (id: number) => http.delete(`/api/links/${id}`),
  reanalyze: (id: number) => http.post<Link>(`/api/links/${id}/reanalyze`),
  stats: (id: number) => http.get<LinkStats>(`/api/links/${id}/stats`),
}
