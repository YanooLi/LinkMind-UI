import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { api, errorMessage } from '@/api/client'
import type { Link, LinkStats } from '@/api/types'
import { RiskBadge } from '@/components/RiskBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { upsert } from '@/store/linksSlice'
import { useAppDispatch } from '@/store'

export function LinkDetailPage() {
  const id = Number(useParams().id)
  const dispatch = useAppDispatch()
  const [link, setLink] = useState<Link | null>(null)
  const [stats, setStats] = useState<LinkStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [l, s] = await Promise.all([api.getLink(id), api.stats(id)])
      setLink(l.data)
      setStats(s.data)
      dispatch(upsert(l.data))
    } catch (e) {
      setError(errorMessage(e))
    }
  }, [id, dispatch])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (link?.status !== 'pending') return
    const t = setTimeout(load, 2000)
    return () => clearTimeout(t)
  }, [link, load])

  if (error) return <p className="text-destructive">{error}</p>
  if (!link) return <p className="text-muted-foreground">Loading…</p>
  const max = Math.max(1, ...(stats?.daily.map((d) => d.clicks) ?? [1]))

  return (
    <div className="flex flex-col gap-4">
      <RouterLink to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All links
      </RouterLink>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>/r/{link.short_code}</CardTitle>
            <RiskBadge risk={link.risk_level} status={link.status} />
          </div>
          <a href={link.original_url} target="_blank" rel="noreferrer noopener"
            className="flex items-center gap-1 break-all text-sm text-primary hover:underline">
            {link.original_url} <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
          {link.title && <p className="text-sm text-muted-foreground">{link.title}</p>}
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div><p className="text-xs text-muted-foreground">Total clicks</p><p className="text-2xl font-semibold">{link.click_count}</p></div>
          <div><p className="text-xs text-muted-foreground">Category</p><p className="font-medium">{link.category ?? '—'}</p>
            {link.category_source && <p className="text-xs text-muted-foreground">via {link.category_source}</p>}</div>
          <div><p className="text-xs text-muted-foreground">Created</p><p className="font-medium">{new Date(link.created_at).toLocaleString()}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Security analysis</CardTitle>
          <Button variant="outline" size="sm" onClick={async () => { await api.reanalyze(id); load() }}>
            <RefreshCw className="h-4 w-4" /> Re-analyze
          </Button>
        </CardHeader>
        <CardContent>
          {link.risk_reasons.length === 0 ? (
            <p className="text-sm text-muted-foreground">{link.status === 'pending' ? 'Analysis in progress…' : 'No risk signals found.'}</p>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm">{link.risk_reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Clicks, last 14 days</CardTitle></CardHeader>
        <CardContent>
          {!stats?.daily.length ? <p className="text-sm text-muted-foreground">No clicks yet.</p> : (
            <div className="flex h-36 items-end gap-2">
              {stats.daily.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1" title={`${d.day}: ${d.clicks}`}>
                  <span className="text-xs tabular-nums text-muted-foreground">{d.clicks}</span>
                  <div className="w-full rounded-t bg-primary/80" style={{ height: `${(d.clicks / max) * 100}px` }} />
                  <span className="text-[10px] text-muted-foreground">{d.day.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
          {!!stats?.top_referrers.length && (
            <div className="mt-4">
              <p className="mb-1 text-xs text-muted-foreground">Top referrers</p>
              {stats.top_referrers.map((r) => (
                <div key={r.referrer} className="flex justify-between text-sm"><span className="truncate">{r.referrer}</span><span className="tabular-nums">{r.clicks}</span></div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
