import { useEffect } from 'react';
import type { QrItem, UrlItem } from '@/api/types';
import { fetchResources } from '@/store/resourcesSlice';
import { useAppDispatch, useAppSelector } from '@/store';

export type ResourceRow = {
  kind: 'url' | 'qrcode'; id: string; title: string; originalUrl: string; display: string; link: string
  count: number; createdAt: string; category: string | null; isSafe: boolean; aiEnabled: boolean; analyzed: boolean
  score: number | null; imageUrl: string | null
}

export const stripScheme = (u: string) => u.replace(/^https?:\/\//, '');

/** Short links and QR codes as one list, newest first (Home › Recent Activity, All Resources). */
export function toRows(urls: UrlItem[], qrs: QrItem[]): ResourceRow[] {
  const rows: ResourceRow[] = [
    ...urls.map((u) => ({
      kind: 'url' as const, id: u.short_code, title: u.title || stripScheme(u.original_url), originalUrl: u.original_url,
      display: stripScheme(u.short_url), link: u.short_url, count: u.clicks, createdAt: u.created_at, category: u.category,
      isSafe: u.is_safe, aiEnabled: u.ai_enabled, analyzed: !!u.ai_analysis, score: u.ai_analysis?.safety_score ?? null, imageUrl: null,
    })),
    ...qrs.map((q) => ({
      kind: 'qrcode' as const, id: q.qr_code_id, title: q.title || stripScheme(q.original_url), originalUrl: q.original_url,
      display: q.qr_code_id, link: q.qr_code_url, count: q.scans, createdAt: q.created_at, category: q.category,
      isSafe: q.is_safe, aiEnabled: q.ai_enabled, analyzed: !!q.ai_analysis, score: q.ai_analysis?.safety_score ?? null, imageUrl: q.image_url,
    })),
  ];
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const units: [number, string][] = [[60, 'minute'], [3600, 'hour'], [86400, 'day'], [604800, 'week'], [2592000, 'month'], [31536000, 'year']];
  let i = units.length - 1;
  while (i > 0 && s < units[i][0]) i--;
  const n = Math.floor(s / units[i][0]);
  return `${n} ${units[i][1]}${n === 1 ? '' : 's'} ago`;
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

/** Load the user's resources once per session (refresh after creating/deleting via the slice actions). */
export function useResources() {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.resources);
  useEffect(() => { if (!state.loaded) dispatch(fetchResources()); }, [state.loaded, dispatch]);
  return state;
}

export function analyticsPath(kind: 'url' | 'qrcode', id: string) {
  return `/analytics?type=${kind}&id=${encodeURIComponent(id)}`;
}
