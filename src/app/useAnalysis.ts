import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import type { AnalysisDetail } from '@/api/types';

/** Poll a resource's analysis until the worker stores it (analysis is asynchronous, SmartUrl-api.md §2.1). */
export function useAnalysis(type: 'url' | 'qrcode', id: string | null, refreshKey = 0) {
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
  const [waiting, setWaiting] = useState(false);
  useEffect(() => {
    if (!id) { setAnalysis(null); return; }
    let stop = false;
    let tries = 0;
    setWaiting(true);
    const tick = async () => {
      try {
        const a = (await api.analysis(type, id)).analysis;
        if (stop) return;
        setAnalysis(a);
        if (a && a.status !== 'pending') { setWaiting(false); return; }
      } catch { /* keep polling a few times */ }
      if (++tries < 30 && !stop) setTimeout(tick, 1500);
      else setWaiting(false);
    };
    tick();
    return () => { stop = true; };
  }, [type, id, refreshKey]);
  return { analysis, waiting };
}

export function riskOf(a: AnalysisDetail | null): 'low' | 'medium' | 'high' | null {
  if (!a || a.status !== 'done' || a.safety_score == null) return null;
  if (!a.is_safe) return 'high';
  return a.safety_score < 0.8 ? 'medium' : 'low';
}

export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
