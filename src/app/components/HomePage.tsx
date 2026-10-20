import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';
import type { PageType } from '../routes';
import { analyticsPath, timeAgo, toRows, useResources } from '../lib';

interface HomePageProps {
  onNavigate?: (page: PageType) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const navigate = useNavigate();
  const { urls, qrs, totalUrls, totalQrs, loaded, error } = useResources();
  const rows = toRows(urls, qrs);
  const aiEnhanced = rows.filter((r) => r.aiEnabled).length;

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex flex-col">
      <Header onNavigate={onNavigate} />
      <div className="flex flex-1">
        <Sidebar activeItem="home" onNavigate={onNavigate} />
        <main className="flex-1 p-4 md:p-8 min-w-0">
          <div className="max-w-[1400px] mx-auto">
            {/* Welcome Section */}
            <div className="bg-gradient-to-br from-[#2E4BC8] to-[#5865F2] rounded-lg p-12 mb-8 text-white">
              <div className="max-w-[800px]">
                <h1 className="font-['Manrope',sans-serif] font-extrabold text-[40px] leading-[48px] mb-4">
                  Welcome to LinkMind
                </h1>
                <p className="font-['Inter',sans-serif] text-[18px] leading-[28px] text-white/90 mb-8">
                  Transform your URLs into intelligent, trackable assets. Create short links, generate QR codes with optional AI-powered insights.
                </p>
                <div className="flex gap-4">
                  <Button 
                    variant="primary" 
                    className="bg-white !text-[#2E4BC8] hover:!bg-[#F0F2FF] border-0"
                    onClick={() => onNavigate && onNavigate('create-link')}
                  >
                    Create Short Link
                  </Button>
                  <Button
                    variant="outline"
                    className="!border-white !text-white hover:!bg-white/10"
                    onClick={() => onNavigate && onNavigate('all-resources')}
                  >
                    View All Resources
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8">
              <div 
                className="bg-white rounded-lg p-6 border border-[rgba(0,0,0,0.1)] hover:border-[#2E4BC8] transition-all cursor-pointer group"
                onClick={() => onNavigate && onNavigate('create-link')}
              >
                <div className="w-12 h-12 bg-[#E8EBFF] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#2E4BC8] transition-all">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                      stroke="#2E4BC8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="group-hover:stroke-white"
                    />
                    <path
                      d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                      stroke="#2E4BC8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="group-hover:stroke-white"
                    />
                  </svg>
                </div>
                <h3 className="font-['Manrope',sans-serif] font-bold text-[18px] text-[#1a1b22] mb-2">
                  Create Short Link
                </h3>
                <p className="font-['Inter',sans-serif] text-[14px] text-[#717182] leading-relaxed">
                  Transform long URLs into clean, trackable short links with optional AI analysis.
                </p>
              </div>

              <div
                className="bg-white rounded-lg p-6 border border-[rgba(0,0,0,0.1)] hover:border-[#2E4BC8] transition-all cursor-pointer group"
                onClick={() => onNavigate && onNavigate('qr')}
              >
                <div className="w-12 h-12 bg-[#E8EBFF] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#2E4BC8] transition-all">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="7" height="7" stroke="#2E4BC8" strokeWidth="2" className="group-hover:stroke-white" />
                    <rect x="14" y="3" width="7" height="7" stroke="#2E4BC8" strokeWidth="2" className="group-hover:stroke-white" />
                    <rect x="3" y="14" width="7" height="7" stroke="#2E4BC8" strokeWidth="2" className="group-hover:stroke-white" />
                    <rect x="5" y="5" width="3" height="3" fill="#2E4BC8" className="group-hover:fill-white" />
                    <rect x="16" y="5" width="3" height="3" fill="#2E4BC8" className="group-hover:fill-white" />
                    <rect x="5" y="16" width="3" height="3" fill="#2E4BC8" className="group-hover:fill-white" />
                  </svg>
                </div>
                <h3 className="font-['Manrope',sans-serif] font-bold text-[18px] text-[#1a1b22] mb-2">
                  Generate QR Code
                </h3>
                <p className="font-['Inter',sans-serif] text-[14px] text-[#717182] leading-relaxed">
                  Create branded, scannable QR codes for your marketing campaigns.
                </p>
              </div>
            </div>

            {/* Simple Stats Overview - High Level Only */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 border border-[rgba(0,0,0,0.1)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-['Inter',sans-serif] text-[13px] text-[#717182] uppercase tracking-wide font-semibold">
                    Total Resources
                  </span>
                  <div className="w-8 h-8 shrink-0 bg-[#E8EBFF] rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M1.5 4a1 1 0 0 1 1-1h3l1.5 1.5h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1V4z"
                        stroke="#2E4BC8"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
                <div className="font-['Manrope',sans-serif] font-extrabold text-[32px] text-[#1a1b22]">
                  {loaded ? totalUrls + totalQrs : '—'}
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-[rgba(0,0,0,0.1)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-['Inter',sans-serif] text-[13px] text-[#717182] uppercase tracking-wide font-semibold">
                    QR Codes
                  </span>
                  <div className="w-8 h-8 shrink-0 bg-[#E8EBFF] rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="2" width="5" height="5" stroke="#2E4BC8" strokeWidth="1.5" />
                      <rect x="9" y="2" width="5" height="5" stroke="#2E4BC8" strokeWidth="1.5" />
                      <rect x="2" y="9" width="5" height="5" stroke="#2E4BC8" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>
                <div className="font-['Manrope',sans-serif] font-extrabold text-[32px] text-[#1a1b22]">
                  {loaded ? totalQrs : '—'}
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-[rgba(0,0,0,0.1)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-['Inter',sans-serif] text-[13px] text-[#717182] uppercase tracking-wide font-semibold">
                    AI Enhanced
                  </span>
                  <div className="w-8 h-8 shrink-0 bg-[#E8EBFF] rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 2L10 6L14 6.5L11 9.5L12 14L8 11.8L4 14L5 9.5L2 6.5L6 6L8 2Z"
                        fill="#2E4BC8"
                      />
                    </svg>
                  </div>
                </div>
                <div className="font-['Manrope',sans-serif] font-extrabold text-[32px] text-[#1a1b22]">
                  {loaded ? aiEnhanced : '—'}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-[rgba(0,0,0,0.1)]">
              <div className="p-6 border-b border-[rgba(0,0,0,0.1)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-['Manrope',sans-serif] font-bold text-[20px] text-[#1a1b22]">
                      Recent Activity
                    </h2>
                    <p className="font-['Inter',sans-serif] text-[14px] text-[#717182] mt-1">
                      Your latest created resources
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => onNavigate && onNavigate('all-resources')}>View All</Button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {error && <p className="font-['Inter',sans-serif] text-[14px] text-[#BA1A1A]">{error}</p>}
                {loaded && !error && rows.length === 0 && (
                  <p className="font-['Inter',sans-serif] text-[14px] text-[#717182] text-center py-6">
                    No links or QR codes yet. Create your first short link to see it here.
                  </p>
                )}
                {rows.slice(0, 5).map((r) => ({
                  title: r.title, type: r.kind === 'url' ? 'Link' : 'QR Code', shortCode: r.display, time: timeAgo(r.createdAt),
                  path: analyticsPath(r.kind, r.id),
                })).map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3 p-4 bg-[#F8F9FC] rounded-lg hover:bg-[#ECECF0] transition-colors cursor-pointer"
                    onClick={() => navigate(item.path)}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 shrink-0 bg-white rounded-lg flex items-center justify-center border border-[rgba(0,0,0,0.1)]">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path
                            d="M8 10a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                            stroke="#2E4BC8"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M12 10a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                            stroke="#2E4BC8"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-['Inter',sans-serif] font-semibold text-[14px] text-[#1a1b22] truncate">
                            {item.title}
                          </span>
                          <span className="shrink-0 px-2 py-0.5 bg-[#E8EBFF] text-[#2E4BC8] rounded-full font-['Inter',sans-serif] text-[11px] font-semibold whitespace-nowrap">
                            {item.type}
                          </span>
                        </div>
                        <span className="block truncate font-['Inter',sans-serif] text-[13px] text-[#717182]">
                          {item.shortCode}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 hidden sm:inline font-['Inter',sans-serif] text-[13px] text-[#717182] whitespace-nowrap">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}