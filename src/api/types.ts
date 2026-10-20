export interface UserBrief { id: number; username: string; email: string }
export interface Profile extends UserBrief {
  created_at: string
  first_name: string | null
  last_name: string | null
  bio: string | null
  stats: { urls_created: number; qr_codes_created: number }
}
export interface AnalysisBrief { category: string | null; is_safe: boolean; safety_score: number | null; checked_at: string }
export interface UrlItem {
  original_url: string; short_code: string; short_url: string; title: string | null; clicks: number; is_safe: boolean
  user_id: number | null; ai_enabled: boolean; ai_analysis: AnalysisBrief | null; category: string | null; created_at: string
}
export interface QrItem {
  original_url: string; qr_code_id: string; qr_code_url: string; image_url: string; title: string | null; scans: number
  is_safe: boolean; user_id: number | null; ai_enabled: boolean; color: string; style: QrStyle
  ai_analysis: AnalysisBrief | null; category: string | null; created_at: string
}
export type QrStyle = 'square' | 'rounded' | 'dots'
export interface AnalysisDetail {
  status: 'pending' | 'done' | 'failed'; category: string | null; is_safe: boolean; safety_score: number | null
  threat_types: string[]; reasons: string[]; ai_provider: string | null
  google_safe_browsing: { is_safe: boolean | null; threat_types: string[] }; checked_at: string
}
export interface AnalysisOut { short_code?: string; qr_code_id?: string; original_url: string; analysis: AnalysisDetail | null }
export interface Breakdowns {
  granularity: 'day' | 'week' | 'month'
  daily: { date: string; clicks?: number; scans?: number }[]
  devices: { type: string; count: number }[]
  countries: { country: string; count: number }[]
  referrers: { referrer: string; count: number }[]
}
export interface ResourceAnalytics {
  original_url: string; title: string | null; created_at: string; short_code?: string; short_url?: string
  qr_code_id?: string; qr_code_url?: string; clicks?: number; scans?: number; click_data?: Breakdowns; scan_data?: Breakdowns
}
export interface Summary {
  period: string; start_date: string; end_date: string; total_urls: number; total_qrcodes: number
  total_clicks: number; total_qr_scans: number; daily_activity: { date: string; clicks: number; qr_scans: number }[]
  devices: { type: string; count: number }[]; countries: { country: string; count: number }[]
  top_urls: { short_code: string; original_url: string; title: string | null; clicks: number }[]
  top_qrcodes: { qr_code_id: string; original_url: string; title: string | null; scans: number }[]
}
export interface PublicConfig { registration_requires_invite: boolean; demo_username: string | null; demo_password: string | null }
