import { useEffect, useState, type FormEvent } from 'react'
import { Check, Copy, ListPlus, Search, Trash2 } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import type { RiskLevel } from '@/api/types'
import { RiskBadge } from '@/components/RiskBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { createBatch, createLink, deleteLink, fetchLinks, refreshPending, setFilter } from '@/store/linksSlice'
import { useAppDispatch, useAppSelector } from '@/store'

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <Button variant="ghost" size="icon" title="Copy short link"
      onClick={() => navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1200) })}>
      {done ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
    </Button>
  )
}

export function DashboardPage() {
  const dispatch = useAppDispatch()
  const { items, nextCursor, loading, error, filter } = useAppSelector((s) => s.links)
  const [url, setUrl] = useState('')
  const [alias, setAlias] = useState('')
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchText, setBatchText] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [query, setQuery] = useState(filter.q)

  useEffect(() => { dispatch(fetchLinks(false)) }, [dispatch, filter])

  // Analysis runs in a background worker; poll only while something is still pending.
  const hasPending = items.some((l) => l.status === 'pending')
  useEffect(() => {
    if (!hasPending) return
    const t = setInterval(() => dispatch(refreshPending()), 2000)
    return () => clearInterval(t)
  }, [hasPending, dispatch])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const r = await dispatch(createLink({ url, alias }))
    if (createLink.rejected.match(r)) setFormError(r.payload as string)
    else { setUrl(''); setAlias('') }
  }

  const submitBatch = async () => {
    const urls = batchText.split(/\s+/).map((u) => u.trim()).filter(Boolean)
    if (!urls.length) return
    setFormError(null)
    const r = await dispatch(createBatch(urls))
    if (createBatch.rejected.match(r)) setFormError(r.payload as string)
    else { setBatchText(''); setBatchOpen(false) }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Shorten a link</CardTitle>
          <CardDescription>Every link is classified and checked for phishing/malware signals in the background.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
            <Input type="url" placeholder="https://example.com/very/long/url" value={url} onChange={(e) => setUrl(e.target.value)} required />
            <Input className="sm:w-44" placeholder="custom alias (optional)" value={alias} onChange={(e) => setAlias(e.target.value)} />
            <Button type="submit">Shorten</Button>
            <Button type="button" variant="outline" onClick={() => setBatchOpen(!batchOpen)}>
              <ListPlus className="h-4 w-4" /> Batch
            </Button>
          </form>
          {batchOpen && (
            <div className="flex flex-col gap-2">
              <Textarea placeholder="Paste up to 100 URLs, one per line" value={batchText} onChange={(e) => setBatchText(e.target.value)} />
              <Button className="self-end" onClick={submitBatch}>Import all</Button>
            </div>
          )}
          {formError && <p className="text-sm text-destructive">{formError}</p>}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Your links</h2>
        <div className="flex gap-2">
          <form className="relative" onSubmit={(e) => { e.preventDefault(); dispatch(setFilter({ q: query })) }}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="w-56 pl-8" placeholder="Search URL or title" value={query} onChange={(e) => setQuery(e.target.value)} />
          </form>
          <select className="h-9 rounded-md border border-border bg-card px-2 text-sm" value={filter.risk}
            onChange={(e) => dispatch(setFilter({ risk: e.target.value as RiskLevel | '' }))}>
            <option value="">All risk levels</option>
            <option value="safe">Safe</option>
            <option value="suspicious">Suspicious</option>
            <option value="malicious">Malicious</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Card className="divide-y divide-border">
        {items.length === 0 && !loading && <p className="p-6 text-center text-sm text-muted-foreground">No links yet.</p>}
        {items.map((l) => (
          <div key={l.id} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <RouterLink to={`/links/${l.id}`} className="font-medium text-primary hover:underline">/r/{l.short_code}</RouterLink>
                <RiskBadge risk={l.risk_level} status={l.status} />
                {l.category && <span className="hidden text-xs text-muted-foreground sm:inline">{l.category}</span>}
              </div>
              <p className="truncate text-sm text-muted-foreground" title={l.original_url}>{l.title || l.original_url}</p>
            </div>
            <span className="shrink-0 text-right text-sm tabular-nums text-muted-foreground">{l.click_count} clicks</span>
            <CopyButton text={l.short_url} />
            <Button variant="ghost" size="icon" title="Delete" onClick={() => dispatch(deleteLink(l.id))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </Card>
      {nextCursor && (
        <Button variant="outline" className="self-center" disabled={loading} onClick={() => dispatch(fetchLinks(true))}>
          {loading ? 'Loading…' : 'Load more'}
        </Button>
      )}
    </div>
  )
}
