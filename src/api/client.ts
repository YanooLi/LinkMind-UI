import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type {
  AnalysisOut, Profile, PublicConfig, QrItem, QrStyle, ResourceAnalytics, Summary, UrlItem, UserBrief,
} from './types'

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'
const ACCESS = 'linkmind.access'
const REFRESH = 'linkmind.refresh'

const safe = {
  get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* storage unavailable */ } },
  del: (k: string) => { try { localStorage.removeItem(k) } catch { /* storage unavailable */ } },
}
export const tokens = {
  access: () => safe.get(ACCESS),
  save: (access: string, refresh?: string) => { safe.set(ACCESS, access); if (refresh) safe.set(REFRESH, refresh) },
  clear: () => { safe.del(ACCESS); safe.del(REFRESH) },
}

export const http = axios.create({ baseURL: API_URL })
http.interceptors.request.use((config) => {
  const t = tokens.access()
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

// Access tokens live 1 hour (SmartUrl-api.md §1.3). On a 401, trade the refresh token for a new access token once and
// retry; concurrent 401s share one refresh call.
let refreshing: Promise<string | null> | null = null
http.interceptors.response.use(undefined, async (error: AxiosError) => {
  const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
  const refresh = safe.get(REFRESH)
  if (error.response?.status !== 401 || !original || original._retried || !refresh || original.url?.startsWith('/auth/')) {
    throw error
  }
  original._retried = true
  refreshing ??= axios.post(`${API_URL}/auth/refresh`, { refresh_token: refresh })
    .then((r) => { tokens.save(r.data.access_token); return r.data.access_token as string })
    .catch(() => { tokens.clear(); window.dispatchEvent(new Event('linkmind:logout')); return null })
    .finally(() => { refreshing = null })
  const fresh = await refreshing
  if (!fresh) throw error
  original.headers.Authorization = `Bearer ${fresh}`
  return http(original)
})

/** FastAPI errors ({detail: string | [{msg}]}) as one readable sentence. */
export function errorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const detail = err.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail[0]?.msg) return detail.map((d: { msg: string }) => d.msg.replace(/^Value error, /, '')).join('; ')
    if (err.response?.status === 429) return 'Too many requests. Wait a minute and try again.'
    if (!err.response) return 'Cannot reach the LinkMind server. Check that the backend is running.'
    return err.message
  }
  return String(err)
}

export const api = {
  config: () => http.get<PublicConfig>('/auth/config').then((r) => r.data),
  register: (body: { username: string; email: string; password: string; invite_code?: string }) =>
    http.post<UserBrief>('/auth/register', body).then((r) => r.data),
  login: (username: string, password: string) =>
    http.post<{ access_token: string; refresh_token: string; user: UserBrief }>('/auth/login', { username, password }).then((r) => r.data),
  me: () => http.get<Profile>('/users/me').then((r) => r.data),
  updateMe: (patch: Partial<Pick<Profile, 'username' | 'email' | 'first_name' | 'last_name' | 'bio'>>) =>
    http.patch<Profile>('/users/me', patch).then((r) => r.data),
  deleteMe: () => http.delete('/users/me'),
  deleteAllResources: () => http.delete('/users/me/resources'),

  shorten: (body: { target_url: string; title?: string; ai_enabled: boolean; custom_alias?: string }) => http.post<UrlItem>('/shorten/', body).then((r) => r.data),
  urlHistory: (p: { page?: number; limit?: number; sort?: 'created_at' | 'clicks'; order?: 'asc' | 'desc'; q?: string }) =>
    http.get<{ page: number; limit: number; total: number; urls: UrlItem[] }>('/urls/history', { params: p }).then((r) => r.data),
  getUrl: (code: string) => http.get<UrlItem>(`/urls/${code}`).then((r) => r.data),
  deleteUrl: (code: string) => http.delete(`/urls/${code}`),

  createQr: (body: { target_url: string; title?: string; ai_enabled: boolean; color: string; style: QrStyle }) =>
    http.post<QrItem>('/qrcode/', body).then((r) => r.data),
  qrHistory: (p: { page?: number; limit?: number; sort?: 'created_at' | 'scans'; order?: 'asc' | 'desc'; q?: string }) =>
    http.get<{ page: number; limit: number; total: number; qrcodes: QrItem[] }>('/qrcodes/history', { params: p }).then((r) => r.data),
  deleteQr: (id: string) => http.delete(`/qrcode/${id}`),
  qrPreview: (p: { target_url: string; color: string; style: QrStyle }) =>
    http.get<Blob>('/qrcode/preview', { params: p, responseType: 'blob' }).then((r) => r.data),

  analysis: (type: 'url' | 'qrcode', id: string) => http.get<AnalysisOut>(`/ai/analysis/${type}/${id}`).then((r) => r.data),
  reanalyze: (type: 'url' | 'qrcode', id: string) => http.post(`/ai/reanalyze/${type}/${id}`),
  analytics: (type: 'url' | 'qrcode', id: string, granularity: 'day' | 'week' | 'month') =>
    http.get<ResourceAnalytics>(`/analytics/${type}/${id}`, { params: { granularity } }).then((r) => r.data),
  summary: (period: 'day' | 'week' | 'month' | 'year' = 'month') =>
    http.get<Summary>('/analytics/summary', { params: { period } }).then((r) => r.data),
}
