import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import type { PageType } from '../routes';
import { API_URL } from '@/api/client';
import { useAppSelector } from '@/store';

interface LandingPageProps {
  onNavigate?: (page: PageType) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const navigate = useNavigate();
  const loggedIn = useAppSelector((s) => s.auth.loggedIn);
  const [url, setUrl] = useState('');

  // Shorten from the hero: signed-in users go straight to Create Link with the URL filled in; others sign up first.
  const start = (e: React.FormEvent) => {
    e.preventDefault();
    const target = `/create?url=${encodeURIComponent(url.trim())}`;
    if (loggedIn) navigate(target);
    else navigate('/signin?mode=signup', { state: { from: target } });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <header className="flex items-center justify-between px-4 sm:px-12 py-6">
        <div className="flex items-center gap-2">
          <span className="font-['Manrope',sans-serif] font-extrabold text-[24px] text-[#1a1b22]">LinkMind</span>
        </div>
        <div className="flex items-center gap-3">
          {loggedIn ? (
            <Button variant="primary" className="px-6 py-2" onClick={() => onNavigate && onNavigate('home')}>
              Go to dashboard
            </Button>
          ) : (
            <>
              <button
                className="px-5 py-2 font-['Inter',sans-serif] font-medium text-[14px] text-[#444653] hover:text-[#2E4BC8] transition-colors"
                onClick={() => onNavigate && onNavigate('signin')}
              >
                Login
              </button>
              <Button
                variant="primary"
                className="px-6 py-2"
                onClick={() => navigate('/signin?mode=signup')}
              >
                Sign Up Free
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 sm:px-12 py-20 text-center">
        <div className="max-w-[800px]">
          <h1 className="font-['Manrope',sans-serif] font-extrabold text-[36px] leading-[44px] sm:text-[48px] sm:leading-[56px] text-[#1a1b22] mb-6">
            Smart Links with<br />
            <span className="text-[#2E4BC8]">Built-In Intelligence</span>
          </h1>
          <p className="font-['Inter',sans-serif] text-[18px] leading-[28px] text-[#444653] mb-8 max-w-[600px] mx-auto">
            Turn any URL into a short link or QR code that is checked for phishing and malware, labeled by AI, and tracked by device, country and referrer.
          </p>
          <form onSubmit={start} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-center">
            <div className="flex items-center gap-3 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg px-6 py-3 w-full sm:w-auto sm:min-w-[400px]">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M8 11a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="#717182" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 9a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="#717182" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                aria-label="Destination URL"
                placeholder="Paste your destination URL here..."
                className="flex-1 min-w-0 outline-none font-['Inter',sans-serif] text-[16px] text-[#444653]"
              />
            </div>
            <Button type="submit" variant="primary" className="flex items-center justify-center gap-2">
              Shorten & Analyze
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 10h10M10 5l5 5-5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </form>
          <p className="font-['Inter',sans-serif] text-[12px] text-[#717182] mt-4">
            Free to use. No credit card required.
          </p>
        </div>
      </section>

      {/* Intelligence Layer Section */}
      <section className="flex flex-col items-center px-4 sm:px-12 py-20 bg-[#F8F9FC]">
        <div className="max-w-[1200px] w-full">
          <div className="text-center mb-12">
            <h2 className="font-['Manrope',sans-serif] font-extrabold text-[36px] leading-[40px] text-[#1a1b22] mb-4">
              The Intelligence Layer
            </h2>
            <p className="font-['Inter',sans-serif] text-[18px] leading-[28px] text-[#444653] max-w-[600px] mx-auto">
              Every link is analyzed in the background: a safety score from Google Safe Browsing and phishing heuristics, plus an optional AI category.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature Cards */}
            <div className="bg-white rounded-lg p-8 border border-[rgba(0,0,0,0.1)]">
              <div className="w-12 h-12 bg-[#E8EBFF] rounded-lg flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#2E4BC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#2E4BC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-['Manrope',sans-serif] font-bold text-[20px] text-[#1a1b22] mb-2">
                AI Categorization
              </h3>
              <p className="font-['Inter',sans-serif] text-[14px] leading-[22px] text-[#444653] mb-4">
                Each destination is labeled with a topic such as news, developer or shopping, using OpenAI or a Hugging Face model when enabled.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 font-['Inter',sans-serif] text-[14px] text-[#444653]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13 4L6 11 3 8" stroke="#2E4BC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Topic labels for every link
                </li>
                <li className="flex items-center gap-2 font-['Inter',sans-serif] text-[14px] text-[#444653]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13 4L6 11 3 8" stroke="#2E4BC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  On or off per link
                </li>
                <li className="flex items-center gap-2 font-['Inter',sans-serif] text-[14px] text-[#444653]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13 4L6 11 3 8" stroke="#2E4BC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Filter resources by category
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-8 border border-[rgba(0,0,0,0.1)]">
              <div className="w-12 h-12 bg-[#E8EBFF] rounded-lg flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="#2E4BC8" strokeWidth="2"/>
                  <path d="M12 1v6m0 6v6m11-11h-6m-6 0H1" stroke="#2E4BC8" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="font-['Manrope',sans-serif] font-bold text-[20px] text-[#1a1b22] mb-2">
                Real-time Risk Matrix
              </h3>
              <p className="font-['Inter',sans-serif] text-[14px] leading-[22px] text-[#444653] mb-4">
                A 0–1 safety score from Google Safe Browsing and phishing patterns such as raw IPs, look-alike domains and brand impersonation.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 font-['Inter',sans-serif] text-[14px] text-[#444653]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13 4L6 11 3 8" stroke="#2E4BC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Phishing pattern detection
                </li>
                <li className="flex items-center gap-2 font-['Inter',sans-serif] text-[14px] text-[#444653]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13 4L6 11 3 8" stroke="#2E4BC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Unsafe links blocked on redirect
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-8 border border-[rgba(0,0,0,0.1)]">
              <div className="w-12 h-12 bg-[#E8EBFF] rounded-lg flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="#2E4BC8" strokeWidth="2"/>
                  <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="#2E4BC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-['Manrope',sans-serif] font-bold text-[20px] text-[#1a1b22] mb-2">
                Actionable Insights
              </h3>
              <p className="font-['Inter',sans-serif] text-[14px] leading-[22px] text-[#444653] mb-4">
                See how each link and QR code performs over time, and where the visits come from.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 font-['Inter',sans-serif] text-[14px] text-[#444653]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13 4L6 11 3 8" stroke="#2E4BC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Clicks and scans by day, week or month
                </li>
                <li className="flex items-center gap-2 font-['Inter',sans-serif] text-[14px] text-[#444653]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13 4L6 11 3 8" stroke="#2E4BC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Devices, countries and referrers
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-12 py-12 bg-white border-t border-[rgba(0,0,0,0.1)]">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row gap-10 justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-['Manrope',sans-serif] font-extrabold text-[18px] text-[#1a1b22]">LinkMind</span>
            </div>
            <p className="font-['Inter',sans-serif] text-[14px] text-[#717182] max-w-[300px]">
              The intelligent layer for modern link management and analytics. Transform your URLs into smart, trackable assets.
            </p>
            <p className="font-['Inter',sans-serif] text-[12px] text-[#717182] mt-4">
              © 2026 LinkMind · a project by Sui Yeung Li
            </p>
          </div>
          <div className="flex gap-16">
            <div>
              <h4 className="font-['Inter',sans-serif] font-semibold text-[14px] text-[#1a1b22] mb-4">Product</h4>
              <ul className="space-y-2">
                <li><button onClick={() => onNavigate && onNavigate('create-link')} className="font-['Inter',sans-serif] text-[14px] text-[#717182] hover:text-[#2E4BC8]">Short links</button></li>
                <li><button onClick={() => onNavigate && onNavigate('qr')} className="font-['Inter',sans-serif] text-[14px] text-[#717182] hover:text-[#2E4BC8]">QR codes</button></li>
                <li><button onClick={() => onNavigate && onNavigate('analytics')} className="font-['Inter',sans-serif] text-[14px] text-[#717182] hover:text-[#2E4BC8]">Analytics</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-['Inter',sans-serif] font-semibold text-[14px] text-[#1a1b22] mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href={`${API_URL}/docs`} target="_blank" rel="noreferrer" className="font-['Inter',sans-serif] text-[14px] text-[#717182] hover:text-[#2E4BC8]">API Documentation</a></li>
                <li><a href="https://github.com/YanooLi/LinkMindServices" target="_blank" rel="noreferrer" className="font-['Inter',sans-serif] text-[14px] text-[#717182] hover:text-[#2E4BC8]">Backend source</a></li>
                <li><a href="https://github.com/YanooLi/LinkMind-UI" target="_blank" rel="noreferrer" className="font-['Inter',sans-serif] text-[14px] text-[#717182] hover:text-[#2E4BC8]">Frontend source</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}