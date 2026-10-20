export type RiskLevel = 'unknown' | 'safe' | 'suspicious' | 'malicious'
export type AnalysisStatus = 'pending' | 'done' | 'failed'

export interface User {
  id: number
  email: string
  created_at: string
}

export interface Link {
  id: number
  short_code: string
  short_url: string
  original_url: string
  title: string | null
  created_at: string
  click_count: number
  status: AnalysisStatus
  risk_level: RiskLevel
  risk_reasons: string[]
  category: string | null
  category_source: string | null
  analyzed_at: string | null
}

export interface LinkPage {
  items: Link[]
  next_cursor: number | null
}

export interface LinkStats {
  link_id: number
  total_clicks: number
  daily: { day: string; clicks: number }[]
  top_referrers: { referrer: string; clicks: number }[]
}
