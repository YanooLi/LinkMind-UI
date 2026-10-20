import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Button } from './Button';
import { PageHeader } from './PageHeader';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage } from '@/api/client';
import type { QrItem, QrStyle } from '@/api/types';
import { addQr } from '@/store/resourcesSlice';
import { useAppDispatch } from '@/store';
import { analyticsPath } from '../lib';
import { copyText, riskOf, useAnalysis } from '../useAnalysis';

const SWATCHES = ['#2E4BC8', '#5865F2', '#8B4513', '#1a1b22', '#DC2626'];
const STYLES: QrStyle[] = ['square', 'rounded', 'dots'];

const isUrl = (u: string) => { try { return /^https?:$/.test(new URL(u).protocol); } catch { return false; } };

export function QRGeneratorPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [enableAI, setEnableAI] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState<QrStyle>('square');
  const [color, setColor] = useState('#2E4BC8');
  const [preview, setPreview] = useState<string | null>(null);
  const [created, setCreated] = useState<QrItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { analysis, waiting } = useAnalysis('qrcode', created?.qr_code_id ?? null);
  const risk = riskOf(analysis);

  // Live preview of the destination in the chosen style and color, refreshed after typing pauses.
  useEffect(() => {
    if (created || !isUrl(url)) { setPreview(null); return; }
    let objectUrl: string | null = null;
    const t = setTimeout(() => {
      api.qrPreview({ target_url: url, color, style })
        .then((blob) => { objectUrl = URL.createObjectURL(blob); setPreview(objectUrl); })
        .catch(() => setPreview(null));
    }, 400);
    return () => { clearTimeout(t); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url, color, style, created]);

  const generate = async () => {
    if (!isUrl(url) || busy) return;
    setBusy(true);
    setError(null);
    try {
      const qr = await api.createQr({ target_url: url, title: title.trim() || undefined, ai_enabled: enableAI, color, style });
      dispatch(addQr(qr));
      setCreated(qr);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    if (!created) return;
    const blob = await fetch(`${created.image_url}?size=16`).then((r) => r.blob());
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `linkmind-${created.qr_code_id}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyLink = async () => {
    if (created && (await copyText(created.qr_code_url))) { setCopied(true); setTimeout(() => setCopied(false), 1500); }
  };

  const reset = () => { setCreated(null); setUrl(''); setTitle(''); setError(null); };

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar activeItem="qr" />
        <main className="flex-1 p-4 md:p-8 min-w-0">
          <div className="max-w-[1400px] mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-[#717182] font-['Inter',sans-serif] text-[14px] mb-4">
                <span>Tools</span>
                <span>/</span>
                <span className="text-[#1a1b22]">QR Generator</span>
              </div>
              <PageHeader
                title="QR Code Generator"
                subtitle="Create dynamic, branded QR codes with advanced tracking capabilities."
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Configuration Panel */}
              <div className="bg-white rounded-lg p-8 border border-[rgba(0,0,0,0.1)]">
                <div className="space-y-6">
                  {/* Destination URL */}
                  <div>
                    <label className="block font-['Inter',sans-serif] font-semibold text-[14px] text-[#1a1b22] mb-2 uppercase tracking-wide">
                      Destination URL
                    </label>
                    <div className="flex items-center gap-3 bg-[#F8F9FC] border border-[rgba(0,0,0,0.1)] rounded-lg px-4 py-3">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M8 11a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="#717182" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M12 9a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="#717182" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <input
                        type="url"
                        aria-label="Destination URL"
                        value={url}
                        disabled={!!created}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://your-brand-website.com/campaign"
                        className="flex-1 min-w-0 bg-transparent outline-none font-['Inter',sans-serif] text-[16px] text-[#444653]"
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block font-['Inter',sans-serif] font-semibold text-[14px] text-[#1a1b22] mb-2 uppercase tracking-wide">
                      Title <span className="normal-case font-normal text-[#717182]">(optional)</span>
                    </label>
                    <input
                      aria-label="Title"
                      value={title}
                      disabled={!!created}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Spring campaign poster"
                      className="w-full bg-[#F8F9FC] border border-[rgba(0,0,0,0.1)] rounded-lg px-4 py-3 outline-none font-['Inter',sans-serif] text-[16px] text-[#444653]"
                    />
                  </div>

                  {/* QR Style */}
                  <div>
                    <label className="block font-['Inter',sans-serif] font-semibold text-[14px] text-[#1a1b22] mb-3 uppercase tracking-wide">
                      QR Style
                    </label>
                    <div className="flex gap-3">
                      {STYLES.map((st) => (
                      <button
                        key={st}
                        title={st}
                        aria-pressed={style === st}
                        disabled={!!created}
                        onClick={() => setStyle(st)}
                        className={`w-16 h-16 rounded-lg flex items-center justify-center ${style === st ? 'border-2 border-[#2E4BC8] bg-[#E8EBFF]' : 'border border-[rgba(0,0,0,0.1)] hover:border-[#2E4BC8]'}`}
                      >
                        {st === 'square' && <div className="w-12 h-12 bg-black rounded"></div>}
                        {st === 'rounded' && (
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                          <rect x="4" y="4" width="6" height="6" fill="#1a1b22"/>
                          <rect x="12" y="4" width="6" height="6" fill="#1a1b22"/>
                          <rect x="4" y="12" width="6" height="6" fill="#1a1b22"/>
                        </svg>
                        )}
                        {st === 'dots' && (
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                          <circle cx="8" cy="8" r="3" fill="#1a1b22"/>
                          <circle cx="20" cy="8" r="3" fill="#1a1b22"/>
                          <circle cx="8" cy="20" r="3" fill="#1a1b22"/>
                        </svg>
                        )}
                      </button>
                      ))}
                    </div>
                  </div>

                  {/* Brand Color */}
                  <div>
                    <label className="block font-['Inter',sans-serif] font-semibold text-[14px] text-[#1a1b22] mb-3 uppercase tracking-wide">
                      Brand Color
                    </label>
                    <div className="flex gap-2">
                      {SWATCHES.map((c) => (
                        <button
                          key={c}
                          title={c}
                          aria-pressed={color.toLowerCase() === c.toLowerCase()}
                          disabled={!!created}
                          onClick={() => setColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-10 h-10 rounded-full border-2 ${color.toLowerCase() === c.toLowerCase() ? (c === '#1a1b22' ? 'border-[#717182]' : 'border-[#1a1b22]') : 'border-transparent hover:border-[#1a1b22]'}`}
                        ></button>
                      ))}
                      <label
                        title="Custom color"
                        className="relative w-10 h-10 rounded-full border-2 border-[rgba(0,0,0,0.1)] hover:border-[#1a1b22] flex items-center justify-center cursor-pointer"
                        style={SWATCHES.some((c) => c.toLowerCase() === color.toLowerCase()) ? undefined : { backgroundColor: color, borderColor: '#1a1b22' }}
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M10 4v12M4 10h12" stroke="#717182" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <input type="color" aria-label="Custom color" value={color} disabled={!!created} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </label>
                    </div>
                  </div>

                  {/* Add Brand Logo */}
                  <div>
                    <div className="flex items-center gap-3 p-4 border border-dashed border-[rgba(0,0,0,0.2)] rounded-lg opacity-60">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#717182" strokeWidth="2"/>
                        <path d="M9 9h.01M21 15l-5-5L5 21" stroke="#717182" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div>
                        <p className="font-['Inter',sans-serif] font-semibold text-[14px] text-[#1a1b22]">
                          Add Brand Logo
                        </p>
                        <p className="font-['Inter',sans-serif] text-[12px] text-[#717182]">
                          Overlay your logo in the center
                        </p>
                      </div>
                      <span className="ml-auto px-3 py-1 bg-[#F8F9FC] text-[#717182] rounded-full font-['Inter',sans-serif] text-[12px] font-medium">
                        Coming soon
                      </span>
                    </div>
                  </div>

                  {/* Optional AI Analysis Toggle */}
                  <div className="bg-[#F8F9FC] rounded-lg p-4 border border-[rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded flex items-center justify-center border border-[rgba(0,0,0,0.1)]">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M8 1.5L10 5.5L14.5 6L11 9.5L12 14L8 11.8L4 14L5 9.5L1.5 6L6 5.5L8 1.5Z"
                              stroke="#2E4BC8"
                              strokeWidth="1.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-['Inter',sans-serif] font-semibold text-[13px] text-[#1a1b22]">
                              Analyze Destination
                            </span>
                            <span className="px-2 py-0.5 bg-[#E8EBFF] text-[#2E4BC8] rounded-full font-['Inter',sans-serif] text-[9px] font-semibold uppercase tracking-wide">
                              Optional
                            </span>
                          </div>
                          <p className="font-['Inter',sans-serif] text-[11px] text-[#717182] mt-0.5">
                            Get AI insights about the destination URL
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableAI}
                          disabled={!!created}
                          aria-label="Analyze destination with AI"
                          onChange={(e) => setEnableAI(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#ECECF0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2E4BC8]"></div>
                      </label>
                    </div>
                  </div>

                  {/* Generate */}
                  <div className="flex gap-3">
                    {!created ? (
                      <Button variant="primary" onClick={generate} disabled={!isUrl(url) || busy} className="disabled:opacity-60">
                        {busy ? 'Generating…' : 'Generate QR Code'}
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={reset}>Create Another</Button>
                    )}
                  </div>
                  {error && <p role="alert" className="font-['Inter',sans-serif] text-[14px] text-[#BA1A1A]">{error}</p>}
                </div>
              </div>

              {/* Preview Panel */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-[#2E4BC8] to-[#5865F2] rounded-lg p-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-['Inter',sans-serif] text-[12px] text-white/80 uppercase tracking-wide">
                      {created ? 'Your QR code' : 'Live Preview'}
                    </span>
                    {created && <span className="font-['Inter',sans-serif] text-[12px] text-white/80">{created.qr_code_id}</span>}
                  </div>
                  <div className="bg-white rounded-lg p-8 flex items-center justify-center aspect-square mb-6">
                    {created ? (
                      <img src={created.image_url} alt="Generated QR code" className="w-full max-w-[320px] h-auto" />
                    ) : preview ? (
                      <img src={preview} alt="QR code preview" className="w-full max-w-[320px] h-auto" />
                    ) : (
                      <p className="font-['Inter',sans-serif] text-[14px] text-[#717182] text-center">Enter a destination URL to see a preview.</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Button variant="primary" onClick={download} disabled={!created} className="w-full bg-white !text-[#2E4BC8] hover:!bg-[#F0F2FF] flex items-center justify-center disabled:opacity-60">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
                        <path d="M17 12v5H3v-5M5 8l5-5 5 5M10 3v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Download QR
                    </Button>
                    <Button variant="outline" onClick={copyLink} disabled={!created} className="w-full bg-transparent !border-white !text-white hover:!bg-white/10 flex items-center justify-center disabled:opacity-60">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
                        <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M7 10h6M10 7v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      {copied ? 'Copied!' : 'Copy Link'}
                    </Button>
                  </div>
                </div>

                {/* Tracking Status */}
                <div className="bg-white rounded-lg p-6 border border-[rgba(0,0,0,0.1)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="#2E4BC8" strokeWidth="2"/>
                      </svg>
                      <div>
                        <p className="font-['Inter',sans-serif] font-semibold text-[14px] text-[#1a1b22] uppercase tracking-wide">
                          Dynamic Tracking
                        </p>
                        <p className="font-['Inter',sans-serif] text-[14px] text-[#444653]">
                          Enabled
                        </p>
                      </div>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>

                {/* Analysis of the destination (after the code is created) */}
                {created && (
                  <button
                    onClick={() => navigate(analyticsPath('qrcode', created.qr_code_id))}
                    className="w-full text-left font-['Inter',sans-serif] text-[14px] text-[#2E4BC8] hover:underline"
                  >
                    View scan analytics →
                  </button>
                )}
                {created && (analysis?.status === 'done' || waiting) && (
                  <div className="bg-white rounded-lg p-5 border border-[rgba(0,0,0,0.1)]">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#E8EBFF] to-[#F0F2FF] rounded flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M8 1.5L10 5.5L14.5 6L11 9.5L12 14L8 11.8L4 14L5 9.5L1.5 6L6 5.5L8 1.5Z"
                            fill="#2E4BC8"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-['Manrope',sans-serif] font-bold text-[15px] text-[#1a1b22]">
                            {created.ai_enabled ? 'AI Insights' : 'Safety Check'}
                          </h4>
                          {analysis?.safety_score != null && (
                            <span className="px-2 py-0.5 bg-[#F8F9FC] text-[#717182] rounded-full font-['Inter',sans-serif] text-[10px] font-medium">
                              safety score {analysis.safety_score.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="font-['Inter',sans-serif] text-[11px] text-[#717182]">
                          {analysis?.status === 'done' ? 'Destination analysis' : 'Analyzing the destination…'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-[#F8F9FC] rounded p-3">
                        <label className="block font-['Inter',sans-serif] font-semibold text-[10px] text-[#717182] uppercase tracking-wide mb-1">
                          Category
                        </label>
                        <p className="font-['Inter',sans-serif] font-semibold text-[13px] text-[#1a1b22] capitalize">
                          {analysis?.category ?? (created.ai_enabled ? '—' : 'AI analysis off')}
                        </p>
                      </div>

                      <div className="bg-[#F8F9FC] rounded p-3">
                        <label className="block font-['Inter',sans-serif] font-semibold text-[10px] text-[#717182] uppercase tracking-wide mb-1">
                          Risk Level
                        </label>
                        {risk && (
                          <span className={`px-2 py-1 rounded-full font-['Inter',sans-serif] text-[11px] font-semibold capitalize ${risk === 'low' ? 'bg-[#E8F5E9] text-[#2E7D32]' : risk === 'medium' ? 'bg-[#FFF4E6] text-[#E65100]' : 'bg-[#FFEBEE] text-[#C62828]'}`}>
                            {risk} Risk
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-[#E8EBFF] rounded-lg p-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mb-3">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#2E4BC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#2E4BC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3 className="font-['Manrope',sans-serif] font-bold text-[16px] text-[#1a1b22] mb-1">
                  Print-ready PNG
                </h3>
                <p className="font-['Inter',sans-serif] text-[14px] text-[#444653]">
                  Download a high-resolution PNG in your brand color for posters and flyers.
                </p>
              </div>

              <div className="bg-[#E8EBFF] rounded-lg p-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mb-3">
                  <path d="M3 17V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="#2E4BC8" strokeWidth="2"/>
                  <path d="M8 12h.01M12 12h.01M16 12h.01" stroke="#2E4BC8" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <h3 className="font-['Manrope',sans-serif] font-bold text-[16px] text-[#1a1b22] mb-1">
                  Real-time Analytics
                </h3>
                <p className="font-['Inter',sans-serif] text-[14px] text-[#444653]">
                  Track scans, location data, and device types instantly.
                </p>
              </div>

              <div className="bg-[#E8EBFF] rounded-lg p-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mb-3">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#2E4BC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3 className="font-['Manrope',sans-serif] font-bold text-[16px] text-[#1a1b22] mb-1">
                  Safe Scanning
                </h3>
                <p className="font-['Inter',sans-serif] text-[14px] text-[#444653]">
                  Every destination is checked by Google Safe Browsing and phishing heuristics.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}