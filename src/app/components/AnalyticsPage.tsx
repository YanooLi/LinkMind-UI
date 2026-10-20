import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Button } from './Button';
import { PageHeader } from './PageHeader';
import { api, errorMessage } from '@/api/client';
import type { ResourceAnalytics, Summary } from '@/api/types';
import { analyticsPath, compact, stripScheme, toRows, useResources } from '../lib';
import { copyText, riskOf, useAnalysis } from '../useAnalysis';

type Granularity = 'day' | 'week' | 'month';
type Point = { label: string; value: number };
type Slice = { name: string; count: number };

const TABS: [string, Granularity][] = [['Daily', 'day'], ['Weekly', 'week'], ['Monthly', 'month']];
const DEVICE_COLORS: Record<string, string> = { mobile: '#2E4BC8', desktop: '#7B92E8', tablet: '#C7D2FE', unknown: '#E8EBFF' };
const REF_STYLES = ['bg-blue-100 text-[#2E4BC8]', 'bg-red-100 text-[#C62828]', 'bg-green-100 text-[#2E7D32]', 'bg-[#F8F9FC] text-[#717182]'];

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);
const axisLabel = (d: string, g: Granularity) =>
  g === 'month' ? new Date(`${d}-01T12:00:00`).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }).toUpperCase()
    : new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: '2-digit' }).toUpperCase();

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function AnalyticsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const type = (params.get('type') === 'qrcode' ? 'qrcode' : params.get('type') === 'url' ? 'url' : null) as 'url' | 'qrcode' | null;
  const id = params.get('id');
  const single = !!(type && id);
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [data, setData] = useState<ResourceAnalytics | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAllRefs, setShowAllRefs] = useState(false);
  const [insightHidden, setInsightHidden] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [analysisKey, setAnalysisKey] = useState(0);
  const { urls, qrs } = useResources();
  const { analysis } = useAnalysis(type ?? 'url', single ? id : null, analysisKey);
  const risk = riskOf(analysis);

  useEffect(() => {
    setError(null);
    if (single) api.analytics(type!, id!, granularity).then(setData).catch((e) => setError(errorMessage(e)));
    else api.summary('month').then(setSummary).catch((e) => setError(errorMessage(e)));
  }, [single, type, id, granularity]);

  // ----- normalize single-resource and account-overview data into one shape -----
  const view = useMemo(() => {
    if (single && data) {
      const b = (data.click_data ?? data.scan_data)!;
      const key = data.click_data ? 'clicks' : 'scans';
      return {
        title: data.title || stripScheme(data.original_url),
        url: data.short_url ?? data.qr_code_url ?? '',
        destination: data.original_url,
        metric: key === 'clicks' ? 'Clicks' : 'Scans',
        total: (data.clicks ?? data.scans ?? 0) as number,
        series: b.daily.map((d) => ({ label: d.date, value: (d[key as 'clicks'] ?? 0) as number })) as Point[],
        devices: b.devices.map((d) => ({ name: d.type, count: d.count })) as Slice[],
        countries: b.countries.map((c) => ({ name: c.country, count: c.count })) as Slice[],
        referrers: b.referrers.map((r) => ({ name: r.referrer, count: r.count })) as Slice[],
      };
    }
    if (!single && summary) {
      return {
        title: 'All resources', url: '', destination: '', metric: 'Clicks & scans',
        total: summary.total_clicks + summary.total_qr_scans,
        series: summary.daily_activity.map((d) => ({ label: d.date, value: d.clicks + d.qr_scans })),
        devices: summary.devices.map((d) => ({ name: d.type, count: d.count })),
        countries: summary.countries.map((c) => ({ name: c.country, count: c.count })),
        referrers: [] as Slice[],
      };
    }
    return null;
  }, [single, data, summary]);

  const g: Granularity = single ? granularity : 'day';
  const max = Math.max(1, ...(view?.series.map((p) => p.value) ?? [1]));
  const peakIndex = view ? view.series.findIndex((p) => p.value === max && max > 0) : -1;
  const deviceTotal = view?.devices.reduce((s, d) => s + d.count, 0) ?? 0;
  const countryTotal = view?.countries.reduce((s, c) => s + c.count, 0) ?? 0;
  const refTotal = view?.referrers.reduce((s, r) => s + r.count, 0) ?? 0;

  // Week-over-week change, only when the daily series covers two full weeks.
  const change = useMemo(() => {
    if (!view || g !== 'day' || view.series.length < 14) return null;
    const last = view.series.slice(-7).reduce((s, p) => s + p.value, 0);
    const prev = view.series.slice(-14, -7).reduce((s, p) => s + p.value, 0);
    return { last, prev, pct: prev ? Math.round(((last - prev) / prev) * 100) : null };
  }, [view, g]);

  // Donut segments (circumference 2πr ≈ 502 for r = 80).
  const C = 2 * Math.PI * 80;
  let offsetAcc = 0;
  const segments = (view?.devices ?? []).map((d) => {
    const len = deviceTotal ? (d.count / deviceTotal) * C : 0;
    const seg = { color: DEVICE_COLORS[d.name] ?? '#E8EBFF', dash: `${len} ${C - len}`, offset: -offsetAcc };
    offsetAcc += len;
    return seg;
  });
  const topDevice = view?.devices[0];

  // Plain observations from the data (no model involved).
  const insights = useMemo(() => {
    if (!view || view.total === 0) return [];
    const out: string[] = [];
    if (topDevice && deviceTotal) out.push(`${pct(topDevice.count, deviceTotal)}% of visits come from ${topDevice.name} devices.`);
    if (view.referrers[0]) out.push(`${view.referrers[0].name === 'Direct' ? 'Direct visits (no referrer)' : view.referrers[0].name} brings the most traffic (${pct(view.referrers[0].count, refTotal)}%).`);
    if (view.countries[0] && view.countries[0].name !== 'Unknown') out.push(`${view.countries[0].name} is the top location (${pct(view.countries[0].count, countryTotal)}%).`);
    if (peakIndex >= 0) out.push(`The busiest ${g === 'day' ? 'day' : g} was ${axisLabel(view.series[peakIndex].label, g)} with ${view.series[peakIndex].value} ${view.metric.toLowerCase()}.`);
    return out;
  }, [view, topDevice, deviceTotal, refTotal, countryTotal, peakIndex, g]);

  const exportCsv = () => {
    if (!view) return;
    downloadCsv(`linkmind-${single ? id : 'overview'}-analytics.csv`, [
      ['section', 'name', 'value'],
      ...view.series.map((p) => ['activity', p.label, p.value]),
      ...view.devices.map((d) => ['device', d.name, d.count]),
      ...view.countries.map((c) => ['country', c.name, c.count]),
      ...view.referrers.map((r) => ['referrer', r.name, r.count]),
    ]);
  };

  const share = async () => {
    if (view?.url && (await copyText(view.url))) { setCopied(true); setTimeout(() => setCopied(false), 1500); }
  };

  const reanalyze = async () => {
    if (!single) return;
    setReanalyzing(true);
    try { await api.reanalyze(type!, id!); setAnalysisKey((k) => k + 1); } finally { setReanalyzing(false); }
  };

  const resourceOptions = toRows(urls, qrs);
  const topLinks = (summary?.top_urls ?? []).filter((u) => u.clicks > 0);

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar activeItem="analytics" />
        <main className="flex-1 p-4 md:p-8 min-w-0">
          <div className="max-w-[1400px] mx-auto">
            {/* Breadcrumb + resource picker */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 text-[#717182] font-['Inter',sans-serif] text-[14px]">
                <button className="hover:text-[#2E4BC8]" onClick={() => navigate('/resources')}>Resources</button>
                <span>/</span>
                <span className="text-[#1a1b22]">{view?.title ?? 'Analytics'}</span>
              </div>
              <select
                aria-label="Choose a link or QR code"
                value={single ? `${type}:${id}` : ''}
                onChange={(e) => {
                  const [k, v] = e.target.value.split(/:(.*)/s);
                  navigate(v ? analyticsPath(k as 'url' | 'qrcode', v) : '/analytics');
                }}
                className="max-w-full px-4 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg font-['Inter',sans-serif] text-[14px] text-[#444653]"
              >
                <option value="">All resources (overview)</option>
                {resourceOptions.map((r) => (
                  <option key={`${r.kind}:${r.id}`} value={`${r.kind}:${r.id}`}>
                    {r.kind === 'url' ? 'Link' : 'QR'} · {r.title.slice(0, 60)}
                  </option>
                ))}
              </select>
            </div>

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
              <div className="flex-1 min-w-0">
                {single && view && (
                  <div className="flex items-center gap-3 mb-3 min-w-0">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
                      <path d="M8 11a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="#2E4BC8" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M12 9a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="#2E4BC8" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <a href={view.destination} target="_blank" rel="noopener noreferrer" className="font-['Inter',sans-serif] text-[14px] text-[#717182] truncate hover:text-[#2E4BC8]">
                      {view.destination}
                    </a>
                  </div>
                )}
                <PageHeader
                  title={view?.title ?? 'Analytics'}
                  subtitle={single ? `${stripScheme(view?.url ?? '')} · performance and safety` : 'Clicks and scans across all your links and QR codes, last 30 days'}
                />
                {single && analysis?.status === 'done' && (
                  <div className="-mt-4 mb-2 flex flex-wrap items-center gap-3 font-['Inter',sans-serif] text-[14px] text-[#444653]">
                    <span>Category: <span className="font-semibold capitalize">{analysis.category ?? 'AI off'}</span></span>
                    <span>·</span>
                    <span>Safety score: <span className="font-semibold">{analysis.safety_score?.toFixed(2)}</span></span>
                    {risk && (
                      <span className={`px-2 py-0.5 rounded-full text-[12px] font-semibold capitalize ${risk === 'low' ? 'bg-[#E8F5E9] text-[#2E7D32]' : risk === 'medium' ? 'bg-[#FFF4E6] text-[#E65100]' : 'bg-[#FFEBEE] text-[#C62828]'}`}>
                        {risk} risk{!analysis.is_safe && ' · blocked'}
                      </span>
                    )}
                    <button onClick={reanalyze} disabled={reanalyzing} className="text-[#2E4BC8] font-medium hover:underline disabled:opacity-60">
                      {reanalyzing ? 'Queued…' : 'Re-analyze'}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                {single && (
                  <Button variant="outline" onClick={share} className="flex items-center">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
                      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                      <path d="M10 1v2m0 14v2m9-7h-2m-14 0H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {copied ? 'Link copied' : 'Share'}
                  </Button>
                )}
                <Button variant="primary" onClick={exportCsv} disabled={!view} className="flex items-center disabled:opacity-60">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
                    <path d="M17 12v5H3v-5M5 8l5-5 5 5M10 3v9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Export Data
                </Button>
              </div>
            </div>

            {error && <p role="alert" className="mb-6 font-['Inter',sans-serif] text-[14px] text-[#BA1A1A]">{error}</p>}
            {!view && !error && <p className="font-['Inter',sans-serif] text-[14px] text-[#717182]">Loading analytics…</p>}

            {view && (
              <>
                {/* Activity Insight */}
                <div className="bg-white rounded-lg p-8 border border-[rgba(0,0,0,0.1)] mb-8">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="font-['Manrope',sans-serif] font-bold text-[20px] text-[#1a1b22] mb-1">
                        Activity Insight
                      </h2>
                      <p className="font-['Inter',sans-serif] text-[14px] text-[#717182]">
                        {view.metric} over {g === 'day' ? 'the last 30 days' : g === 'week' ? 'the last 12 weeks' : 'the last 12 months'}
                      </p>
                    </div>
                    {single && (
                      <div className="flex gap-2">
                        {TABS.map(([tab, value]) => (
                          <button
                            key={tab}
                            onClick={() => setGranularity(value)}
                            className={`px-4 py-2 rounded-lg font-['Inter',sans-serif] font-medium text-[14px] transition-all ${
                              granularity === value ? 'bg-[#2E4BC8] text-white' : 'text-[#717182] hover:bg-[#F8F9FC]'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Total Card */}
                  <div className="bg-gradient-to-br from-[#E8EBFF] to-[#F0F2FF] rounded-lg p-6 mb-8 inline-block">
                    <div className="flex items-center gap-3 mb-2">
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <circle cx="14" cy="14" r="11" stroke="#2E4BC8" strokeWidth="3"/>
                        <circle cx="14" cy="14" r="5" fill="#2E4BC8"/>
                      </svg>
                      <span className="font-['Inter',sans-serif] text-[14px] text-[#717182] uppercase tracking-wide">
                        Total {view.metric}
                      </span>
                    </div>
                    <p className="font-['Manrope',sans-serif] font-extrabold text-[48px] text-[#1a1b22] mb-1">
                      {view.total.toLocaleString()}
                    </p>
                    {change && (
                      <p className={`font-['Inter',sans-serif] text-[14px] font-semibold ${change.pct == null ? 'text-[#717182]' : change.pct >= 0 ? 'text-green-600' : 'text-[#C62828]'}`}>
                        {change.pct == null ? `${change.last} in the last 7 days` : `${change.pct >= 0 ? '+' : ''}${change.pct}% from last week`}
                      </p>
                    )}
                  </div>

                  {/* Chart */}
                  {view.total === 0 ? (
                    <div className="h-64 flex items-center justify-center rounded-lg bg-[#F8F9FC]">
                      <p className="font-['Inter',sans-serif] text-[14px] text-[#717182] text-center px-4">
                        No {view.metric.toLowerCase()} yet. Share {single ? 'this link' : 'your links'} and visits will show up here.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-end gap-1 sm:gap-3 h-64" role="img" aria-label={`${view.metric} chart`}>
                      {view.series.map((p, i) => (
                        <div key={p.label} className="flex-1 h-full flex flex-col justify-end group" title={`${axisLabel(p.label, g)}: ${p.value}`}>
                          <div
                            className={`${i === peakIndex ? 'bg-[#2E4BC8]' : 'bg-[#C7D2FE]'} rounded-t transition-all group-hover:bg-[#2E4BC8] cursor-pointer relative`}
                            style={{ height: `${Math.max(p.value ? 2 : 0, (p.value / max) * 100)}%` }}
                          >
                            {i === peakIndex && (
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1a1b22] text-white px-3 py-2 rounded text-xs font-semibold whitespace-nowrap">
                                Peak: {compact(p.value)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between mt-4 px-2">
                    {[0, Math.floor((view.series.length - 1) / 2), view.series.length - 1].map((i) => (
                      <span key={i} className="font-['Inter',sans-serif] text-[12px] text-[#717182]">
                        {view.series[i] ? axisLabel(view.series[i].label, g) : ''}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  {/* Top Referrers (single resource) / Top Links (overview) */}
                  <div className="bg-white rounded-lg p-6 border border-[rgba(0,0,0,0.1)]">
                    <h2 className="font-['Manrope',sans-serif] font-bold text-[20px] text-[#1a1b22] mb-6">
                      {single ? 'Top Referrers' : 'Top Links'}
                    </h2>
                    <div className="space-y-4">
                      {single && view.referrers.length === 0 && (
                        <p className="font-['Inter',sans-serif] text-[14px] text-[#717182]">No visits yet.</p>
                      )}
                      {single && (showAllRefs ? view.referrers : view.referrers.slice(0, 3)).map((referrer, i) => (
                        <div key={referrer.name} className="flex items-center gap-4 p-4 bg-[#F8F9FC] rounded-lg">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${REF_STYLES[Math.min(i, 3)]}`}>
                            {referrer.name === 'Direct' ? '→' : referrer.name[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-['Inter',sans-serif] font-semibold text-[16px] text-[#1a1b22] truncate">{referrer.name}</p>
                            <p className="font-['Inter',sans-serif] text-[12px] text-[#717182] uppercase tracking-wide">
                              {referrer.name === 'Direct' ? 'No referrer' : 'Referring site'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-['Manrope',sans-serif] font-bold text-[18px] text-[#1a1b22]">{compact(referrer.count)}</p>
                            <p className="font-['Inter',sans-serif] text-[12px] text-[#717182]">{pct(referrer.count, refTotal)}%</p>
                          </div>
                        </div>
                      ))}
                      {!single && topLinks.length === 0 && (
                        <p className="font-['Inter',sans-serif] text-[14px] text-[#717182]">No clicks yet.</p>
                      )}
                      {!single && topLinks.slice(0, 3).map((u, i) => (
                        <button key={u.short_code} onClick={() => navigate(analyticsPath('url', u.short_code))}
                          className="w-full text-left flex items-center gap-4 p-4 bg-[#F8F9FC] rounded-lg hover:bg-[#E8EBFF] transition-all">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${REF_STYLES[i]}`}>{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-['Inter',sans-serif] font-semibold text-[16px] text-[#1a1b22] truncate">{u.title || stripScheme(u.original_url)}</p>
                            <p className="font-['Inter',sans-serif] text-[12px] text-[#717182] tracking-wide">/{u.short_code}</p>
                          </div>
                          <p className="font-['Manrope',sans-serif] font-bold text-[18px] text-[#1a1b22]">{compact(u.clicks)}</p>
                        </button>
                      ))}
                    </div>
                    {single && view.referrers.length > 3 && (
                      <button onClick={() => setShowAllRefs(!showAllRefs)} className="w-full mt-4 font-['Inter',sans-serif] text-[14px] text-[#2E4BC8] font-semibold hover:underline">
                        {showAllRefs ? 'Show Top 3' : 'View All Sources'}
                      </button>
                    )}
                  </div>

                  {/* Device Breakdown */}
                  <div className="bg-white rounded-lg p-6 border border-[rgba(0,0,0,0.1)]">
                    <h2 className="font-['Manrope',sans-serif] font-bold text-[20px] text-[#1a1b22] mb-6">
                      Device Breakdown
                    </h2>
                    <div className="flex items-center justify-center mb-8">
                      <div className="relative w-48 h-48">
                        <svg className="transform -rotate-90" width="192" height="192" aria-hidden="true">
                          <circle cx="96" cy="96" r="80" fill="none" stroke="#E8EBFF" strokeWidth="24"/>
                          {segments.map((sgm, i) => (
                            <circle key={i} cx="96" cy="96" r="80" fill="none" stroke={sgm.color} strokeWidth="24" strokeDasharray={sgm.dash} strokeDashoffset={sgm.offset}/>
                          ))}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="font-['Manrope',sans-serif] font-extrabold text-[36px] text-[#1a1b22]">
                            {topDevice ? `${pct(topDevice.count, deviceTotal)}%` : '—'}
                          </p>
                          <p className="font-['Inter',sans-serif] text-[14px] text-[#717182] uppercase tracking-wide">{topDevice?.name ?? 'No data'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {view.devices.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: DEVICE_COLORS[item.name] ?? '#E8EBFF' }}></div>
                            <span className="font-['Inter',sans-serif] font-medium text-[16px] text-[#1a1b22] uppercase tracking-wide">{item.name}</span>
                          </div>
                          <span className="font-['Manrope',sans-serif] font-bold text-[18px] text-[#1a1b22]">{pct(item.count, deviceTotal)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Locations */}
                  <div className="bg-white rounded-lg p-6 border border-[rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-['Manrope',sans-serif] font-bold text-[20px] text-[#1a1b22]">Top Locations</h2>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" stroke="#2E4BC8" strokeWidth="2"/>
                        <path d="M2 12h20M12 2c2.5 2.5 4 6.5 4 10s-1.5 7.5-4 10M12 2C9.5 4.5 8 8.5 8 12s1.5 7.5 4 10" stroke="#2E4BC8" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="bg-[#F8F9FC] rounded-lg h-40 mb-6 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20">
                        <svg viewBox="0 0 400 200" className="w-full h-full" aria-hidden="true">
                          <ellipse cx="200" cy="100" rx="150" ry="75" fill="none" stroke="#2E4BC8" strokeWidth="1"/>
                          <ellipse cx="200" cy="100" rx="100" ry="75" fill="none" stroke="#2E4BC8" strokeWidth="1"/>
                          <line x1="50" y1="100" x2="350" y2="100" stroke="#2E4BC8" strokeWidth="1"/>
                          <line x1="200" y1="25" x2="200" y2="175" stroke="#2E4BC8" strokeWidth="1"/>
                        </svg>
                      </div>
                      <div className="relative space-y-2">
                        {view.countries.length === 0 && <span className="font-['Inter',sans-serif] text-[12px] text-[#717182]">No locations yet</span>}
                        {view.countries.slice(0, 3).map((c, i) => (
                          <div key={c.name} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full animate-pulse ${['bg-[#2E4BC8]', 'bg-[#7B92E8]', 'bg-[#C7D2FE]'][i]}`}></div>
                            <span className="font-['Inter',sans-serif] text-[12px] text-[#1a1b22]">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {view.countries.slice(0, 5).map((location) => (
                        <div key={location.name}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-['Inter',sans-serif] font-medium text-[16px] text-[#1a1b22]">{location.name}</span>
                            <span className="font-['Manrope',sans-serif] font-bold text-[16px] text-[#1a1b22]">{pct(location.count, countryTotal)}%</span>
                          </div>
                          <div className="h-2 bg-[#E8EBFF] rounded-full overflow-hidden">
                            <div className="h-full bg-[#2E4BC8] rounded-full transition-all" style={{ width: `${pct(location.count, countryTotal)}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Data insights (computed from the numbers above) */}
                {!insightHidden && insights.length > 0 && (
                  <div className="bg-gradient-to-br from-[#E8EBFF] to-[#F0F2FF] rounded-lg p-8 border border-[rgba(46,75,200,0.2)]">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 bg-[#2E4BC8] rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                          <path d="M16 4L20 13L29 14L22.5 20.5L24.5 29L16 24.5L7.5 29L9.5 20.5L3 14L12 13L16 4Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-3 py-1 bg-[#2E4BC8] text-white rounded-full font-['Inter',sans-serif] text-[11px] font-semibold uppercase tracking-wide">
                            Data Insights
                          </span>
                        </div>
                        <h3 className="font-['Manrope',sans-serif] font-bold text-[24px] text-[#1a1b22] mb-3">What your traffic shows</h3>
                        <ul className="list-disc pl-5 space-y-1 mb-6">
                          {insights.map((t) => (
                            <li key={t} className="font-['Inter',sans-serif] text-[16px] text-[#444653] leading-relaxed">{t}</li>
                          ))}
                        </ul>
                        <Button variant="outline" onClick={() => setInsightHidden(true)}>Dismiss</Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
