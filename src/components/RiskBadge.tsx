import type { AnalysisStatus, RiskLevel } from '@/api/types'
import { Badge } from '@/components/ui/badge'

export function RiskBadge({ risk, status }: { risk: RiskLevel; status: AnalysisStatus }) {
  if (status === 'pending') return <Badge variant="unknown">analyzing…</Badge>
  if (status === 'failed') return <Badge variant="unknown">analysis failed</Badge>
  return <Badge variant={risk}>{risk}</Badge>
}
