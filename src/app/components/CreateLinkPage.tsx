import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Button } from './Button';
import { PageHeader } from './PageHeader';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_URL, api, errorMessage } from '@/api/client';
import type { UrlItem } from '@/api/types';
import { addUrl } from '@/store/resourcesSlice';
import { useAppDispatch } from '@/store';
import { analyticsPath, formatDate, stripScheme } from '../lib';
import { copyText, riskOf, useAnalysis } from '../useAnalysis';

const ALIAS = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,30}[A-Za-z0-9])?$/;
const SHORT_HOST = new URL(API_URL).host;

export function CreateLinkPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [destinationUrl, setDestinationUrl] = useState(params.get('url') ?? '');
  const [title, setTitle] = useState('');
  const [alias, setAlias] = useState('');
  const aliasOk = !alias || ALIAS.test(alias);
  const [enableAI, setEnableAI] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<UrlItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { analysis, waiting } = useAnalysis('url', generatedLink?.short_code ?? null);

  // The worker may fill in the page title while analyzing; pick it up once the analysis lands.
  useEffect(() => {
    if (generatedLink && analysis?.status === 'done' && !generatedLink.title) {
      api.getUrl(generatedLink.short_code).then(setGeneratedLink).catch(() => {});
    }
  }, [analysis?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateLink = async () => {
    if (!destinationUrl.trim() || isGenerating || !aliasOk) return;
    setIsGenerating(true);
    setError(null);
    try {
      const created = await api.shorten({ target_url: destinationUrl.trim(), title: title.trim() || undefined, ai_enabled: enableAI, custom_alias: alias.trim() || undefined });
      dispatch(addUrl(created));
      setGeneratedLink(created);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (generatedLink && (await copyText(generatedLink.short_url))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleReset = () => {
    setDestinationUrl('');
    setTitle('');
    setAlias('');
    setGeneratedLink(null);
    setError(null);
  };

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return { bg: 'bg-[#E8F5E9]', text: 'text-[#2E7D32]', border: 'border-[#81C784]' };
      case 'medium':
        return { bg: 'bg-[#FFF4E6]', text: 'text-[#E65100]', border: 'border-[#FFB74D]' };
      case 'high':
        return { bg: 'bg-[#FFEBEE]', text: 'text-[#C62828]', border: 'border-[#E57373]' };
    }
  };
  const risk = riskOf(analysis);

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar activeItem="create-link" />
        <main className="flex-1 p-4 md:p-8 min-w-0">
          <div className="max-w-[900px] mx-auto">
            <PageHeader
              title="Create Short Link"
              subtitle="Transform long URLs into short, shareable links with tracking."
            />

            {/* Main Creation Card */}
            <div className="bg-white rounded-lg border border-[rgba(0,0,0,0.1)] p-8 mb-6">
              <div className="space-y-6">
                {/* Destination URL Input */}
                <div>
                  <label className="block font-['Inter',sans-serif] font-semibold text-[14px] text-[#1a1b22] mb-3">
                    Destination URL
                  </label>
                  <div className="flex items-center gap-3 bg-[#F8F9FC] border border-[rgba(0,0,0,0.1)] rounded-lg px-4 py-4 focus-within:border-[#2E4BC8] focus-within:bg-white transition-all">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                        stroke="#717182"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                        stroke="#717182"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      type="url"
                      placeholder="https://example.com/your-long-url"
                      value={destinationUrl}
                      onChange={(e) => setDestinationUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateLink();
                        }
                      }}
                      className="flex-1 bg-transparent outline-none font-['Inter',sans-serif] text-[16px] text-[#444653] placeholder:text-[#717182]"
                    />
                  </div>
                  <p className="font-['Inter',sans-serif] text-[12px] text-[#717182] mt-2">
                    Enter the full URL you want to shorten, including https://
                  </p>
                </div>

                {/* Title Input */}
                <div>
                  <label className="block font-['Inter',sans-serif] font-semibold text-[14px] text-[#1a1b22] mb-3">
                    Title <span className="font-normal text-[#717182]">(Optional)</span>
                  </label>
                  <div className="flex items-center gap-3 bg-[#F8F9FC] border border-[rgba(0,0,0,0.1)] rounded-lg px-4 py-4 focus-within:border-[#2E4BC8] focus-within:bg-white transition-all">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 7h16M4 12h10M4 17h16"
                        stroke="#717182"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="My Campaign Link"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateLink();
                        }
                      }}
                      className="flex-1 bg-transparent outline-none font-['Inter',sans-serif] text-[16px] text-[#444653] placeholder:text-[#717182]"
                    />
                  </div>
                  <p className="font-['Inter',sans-serif] text-[12px] text-[#717182] mt-2">
                    A private label so you can find this link in All Resources and Analytics. It doesn't change the short URL. Leave it empty to use the page's own title.
                  </p>
                </div>

                {/* Custom back-half */}
                <div>
                  <label htmlFor="alias" className="block font-['Inter',sans-serif] font-semibold text-[14px] text-[#1a1b22] mb-3">
                    Custom back-half <span className="font-normal text-[#717182]">(Optional)</span>
                  </label>
                  <div className={`flex items-center bg-[#F8F9FC] border rounded-lg px-4 py-4 focus-within:bg-white transition-all ${aliasOk ? 'border-[rgba(0,0,0,0.1)] focus-within:border-[#2E4BC8]' : 'border-[#BA1A1A]'}`}>
                    <span className="font-['Inter',sans-serif] text-[16px] text-[#717182] whitespace-nowrap">{SHORT_HOST}/</span>
                    <input
                      id="alias"
                      type="text"
                      placeholder="my-link"
                      value={alias}
                      maxLength={32}
                      onChange={(e) => setAlias(e.target.value.trim())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateLink();
                        }
                      }}
                      className="flex-1 min-w-0 bg-transparent outline-none font-['Inter',sans-serif] text-[16px] text-[#444653] placeholder:text-[#717182]"
                    />
                  </div>
                  <p className={`font-['Inter',sans-serif] text-[12px] mt-2 ${aliasOk ? 'text-[#717182]' : 'text-[#BA1A1A]'}`}>
                    {aliasOk
                      ? 'Choose your own ending instead of a random code. Letters, numbers and dashes, up to 32 characters.'
                      : 'Use only letters, numbers and dashes, and start and end with a letter or number.'}
                  </p>
                </div>

                {/* Optional AI Analysis Toggle */}
                <div className="bg-[#F8F9FC] rounded-lg p-4 border border-[rgba(0,0,0,0.1)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-[rgba(0,0,0,0.1)]">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path
                            d="M10 2L12.5 7L18 7.8L14 11.8L15 17.5L10 14.8L5 17.5L6 11.8L2 7.8L7.5 7L10 2Z"
                            stroke="#2E4BC8"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-['Inter',sans-serif] font-semibold text-[14px] text-[#1a1b22]">
                            Enable AI Analysis
                          </span>
                          <span className="px-2 py-0.5 bg-[#E8EBFF] text-[#2E4BC8] rounded-full font-['Inter',sans-serif] text-[10px] font-semibold uppercase tracking-wide">
                            Optional
                          </span>
                        </div>
                        <p className="font-['Inter',sans-serif] text-[12px] text-[#717182] mt-1">
                          Analyze destination category, summary, and risk assessment
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableAI}
                        onChange={(e) => setEnableAI(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#ECECF0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E4BC8]"></div>
                    </label>
                  </div>
                </div>

                {/* Create Button */}
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={handleCreateLink}
                    disabled={!destinationUrl.trim() || isGenerating || !aliasOk}
                    className="flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <svg
                          className="animate-spin"
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                        >
                          <path
                            d="M10 2a8 8 0 0 1 8 8"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        {enableAI ? 'Generating & Analyzing...' : 'Generating...'}
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path
                            d="M10 4v12M4 10h12"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        Create Short Link
                      </>
                    )}
                  </Button>

                  {generatedLink && (
                    <Button variant="outline" onClick={handleReset}>
                      Create Another
                    </Button>
                  )}
                </div>
                {error && <p role="alert" className="font-['Inter',sans-serif] text-[14px] text-[#BA1A1A]">{error}</p>}
              </div>
            </div>

            {/* Generated Link Result */}
            {generatedLink && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-[#E8EBFF] to-[#F0F2FF] rounded-lg border border-[rgba(46,75,200,0.2)] p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-[#2E4BC8] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <polyline
                          points="22 4 12 14.01 9 11.01"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-[#2E4BC8] text-white rounded-full font-['Inter',sans-serif] text-[11px] font-semibold uppercase tracking-wide">
                          Success
                        </span>
                        <span className="font-['Inter',sans-serif] text-[12px] text-[#717182]">
                          Created {formatDate(generatedLink.created_at)}
                        </span>
                      </div>
                      <h3 className="font-['Manrope',sans-serif] font-bold text-[24px] text-[#1a1b22] mb-1">
                        Your short link is ready!
                      </h3>
                      <p className="font-['Inter',sans-serif] text-[14px] text-[#444653]">
                        {generatedLink.title || (waiting ? 'Fetching the page title…' : stripScheme(generatedLink.original_url))}
                      </p>
                    </div>
                  </div>

                  {/* Short URL Display */}
                  <div className="bg-white rounded-lg p-6 border border-[rgba(0,0,0,0.1)] mb-6">
                    <label className="block font-['Inter',sans-serif] font-semibold text-[12px] text-[#717182] uppercase tracking-wide mb-3">
                      Short Link
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <a
                          href={generatedLink.short_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-['Manrope',sans-serif] font-bold text-[24px] text-[#2E4BC8] hover:underline"
                        >
                          {stripScheme(generatedLink.short_url)}
                        </a>
                      </div>
                      <button
                        onClick={handleCopyLink}
                        className="px-6 py-3 bg-[#2E4BC8] text-white rounded-lg font-['Inter',sans-serif] font-medium text-[14px] flex items-center gap-2 hover:bg-[#243D9F] transition-all"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <rect
                            x="5"
                            y="5"
                            width="9"
                            height="9"
                            rx="1"
                            stroke="white"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M3 11V3a1 1 0 0 1 1-1h8"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                        {copied ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  </div>

                  {/* Original URL */}
                  <div className="bg-white/50 rounded-lg p-4 border border-[rgba(0,0,0,0.05)]">
                    <label className="block font-['Inter',sans-serif] font-semibold text-[11px] text-[#717182] uppercase tracking-wide mb-2">
                      Original URL
                    </label>
                    <p className="font-['Inter',sans-serif] text-[14px] text-[#444653] break-all">
                      {generatedLink.original_url}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => navigate(analyticsPath('url', generatedLink.short_code))}
                      className="flex-1 px-4 py-3 bg-white border border-[rgba(0,0,0,0.1)] text-[#444653] rounded-lg font-['Inter',sans-serif] font-medium text-[14px] hover:bg-[#F8F9FC] transition-all flex items-center justify-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M2 13V7M8 13V3M14 13v-4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      View Analytics
                    </button>
                    <a
                      href={generatedLink.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-3 bg-white border border-[rgba(0,0,0,0.1)] text-[#444653] rounded-lg font-['Inter',sans-serif] font-medium text-[14px] hover:bg-[#F8F9FC] transition-all flex items-center justify-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M12 4L14 4L14 6M14 4L8 10M6 2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      Open Destination
                    </a>
                  </div>
                </div>

                {/* AI Insights Card: safety analysis always runs; the category only when AI analysis is on */}
                <div className="bg-white rounded-lg border border-[rgba(0,0,0,0.1)] p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#E8EBFF] to-[#F0F2FF] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M10 2L12.5 7L18 7.8L14 11.8L15 17.5L10 14.8L5 17.5L6 11.8L2 7.8L7.5 7L10 2Z"
                          fill="#2E4BC8"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-['Manrope',sans-serif] font-bold text-[18px] text-[#1a1b22]">
                          {generatedLink.ai_enabled ? 'AI Insights' : 'Safety Check'}
                        </h4>
                        {analysis?.safety_score != null && (
                          <span className="px-2 py-0.5 bg-[#F8F9FC] text-[#717182] rounded-full font-['Inter',sans-serif] text-[11px] font-medium">
                            safety score {analysis.safety_score.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <p className="font-['Inter',sans-serif] text-[13px] text-[#717182]">
                        {waiting && analysis?.status !== 'done' ? 'Analyzing the destination…' : 'Automatic analysis of the destination URL'}
                      </p>
                    </div>
                  </div>

                  {analysis?.status === 'failed' && (
                    <p className="font-['Inter',sans-serif] text-[14px] text-[#BA1A1A]">The analysis failed. Re-run it from Analytics.</p>
                  )}

                  {analysis?.status === 'done' && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Category */}
                        <div className="bg-[#F8F9FC] rounded-lg p-4">
                          <label className="block font-['Inter',sans-serif] font-semibold text-[11px] text-[#717182] uppercase tracking-wide mb-2">
                            Category
                          </label>
                          <p className="font-['Inter',sans-serif] font-semibold text-[15px] text-[#1a1b22] capitalize">
                            {analysis.category ?? 'AI analysis off'}
                          </p>
                          {analysis.ai_provider && (
                            <p className="font-['Inter',sans-serif] text-[12px] text-[#717182] mt-1">via {analysis.ai_provider}</p>
                          )}
                        </div>

                        {/* Risk Level */}
                        <div className="bg-[#F8F9FC] rounded-lg p-4">
                          <label className="block font-['Inter',sans-serif] font-semibold text-[11px] text-[#717182] uppercase tracking-wide mb-2">
                            Risk Assessment
                          </label>
                          {risk && (
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-3 py-1 rounded-full font-['Inter',sans-serif] text-[12px] font-semibold capitalize ${getRiskColor(risk).bg} ${getRiskColor(risk).text}`}
                              >
                                {risk} Risk
                              </span>
                              {!analysis.is_safe && (
                                <span className="font-['Inter',sans-serif] text-[12px] text-[#C62828]">redirect blocked</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Why */}
                      <div className="mt-4 bg-[#F8F9FC] rounded-lg p-4">
                        <label className="block font-['Inter',sans-serif] font-semibold text-[11px] text-[#717182] uppercase tracking-wide mb-2">
                          Findings
                        </label>
                        {analysis.reasons.length ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {analysis.reasons.map((r) => (
                              <li key={r} className="font-['Inter',sans-serif] text-[14px] text-[#444653] leading-relaxed">{r}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="font-['Inter',sans-serif] text-[14px] text-[#444653]">No risk signals found.</p>
                        )}
                      </div>

                      {/* Tags */}
                      {analysis.threat_types.length > 0 && (
                        <div className="mt-4 flex items-center gap-2 flex-wrap">
                          <label className="font-['Inter',sans-serif] font-semibold text-[11px] text-[#717182] uppercase tracking-wide">
                            Threat tags:
                          </label>
                          {analysis.threat_types.map((tag) => (
                            <span key={tag} className="px-3 py-1 bg-[#FFEBEE] text-[#C62828] rounded-full font-['Inter',sans-serif] text-[12px] font-medium">
                              {tag.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Info Cards */}
            {!generatedLink && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 border border-[rgba(0,0,0,0.1)]">
                  <div className="w-10 h-10 bg-[#E8EBFF] rounded-lg flex items-center justify-center mb-4">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M17 10v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7M14 6l-4-4-4 4M10 2v12"
                        stroke="#2E4BC8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h4 className="font-['Manrope',sans-serif] font-bold text-[16px] text-[#1a1b22] mb-2">
                    Easy Sharing
                  </h4>
                  <p className="font-['Inter',sans-serif] text-[13px] text-[#717182] leading-relaxed">
                    Share clean, professional links across all your channels.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-6 border border-[rgba(0,0,0,0.1)]">
                  <div className="w-10 h-10 bg-[#E8EBFF] rounded-lg flex items-center justify-center mb-4">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M3 17V9M10 17V3M17 17v-6"
                        stroke="#2E4BC8"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <h4 className="font-['Manrope',sans-serif] font-bold text-[16px] text-[#1a1b22] mb-2">
                    Track Performance
                  </h4>
                  <p className="font-['Inter',sans-serif] text-[13px] text-[#717182] leading-relaxed">
                    Monitor clicks, locations, and engagement in real-time.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-6 border border-[rgba(0,0,0,0.1)]">
                  <div className="w-10 h-10 bg-[#E8EBFF] rounded-lg flex items-center justify-center mb-4">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M10 2L12.5 7L18 7.8L14 11.8L15 17.5L10 14.8L5 17.5L6 11.8L2 7.8L7.5 7L10 2Z"
                        stroke="#2E4BC8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h4 className="font-['Manrope',sans-serif] font-bold text-[16px] text-[#1a1b22] mb-2">
                    AI Analysis
                  </h4>
                  <p className="font-['Inter',sans-serif] text-[13px] text-[#717182] leading-relaxed">
                    Optional AI insights for category detection and risk assessment.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}