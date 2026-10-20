import type { PageType } from '../routes';
import { usePageNav } from '../routes';

interface HeaderProps {
  showUpgrade?: boolean;
  onNavigate?: (page: PageType) => void;
}

export function Header({ showUpgrade = false }: HeaderProps) {
  const onNavigate = usePageNav();
  return (
    <header className="flex items-center justify-between gap-2 px-4 md:px-8 py-4 bg-white border-b border-[rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-2 min-w-0">
      <button
        className="md:hidden w-8 h-8 flex items-center justify-center"
        aria-label="Open menu"
        onClick={() => window.dispatchEvent(new Event('linkmind:menu'))}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="#1a1b22" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
      <button 
        className="flex items-center gap-2 min-w-0"
        onClick={() => onNavigate && onNavigate('home')}
      >
        <div className="w-10 h-10 flex-shrink-0 bg-[#2E4BC8] rounded-lg flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="font-['Manrope',sans-serif] font-extrabold text-[18px] text-[#1a1b22]">LinkMind</span>
        <span className="font-['Inter',sans-serif] text-[12px] text-[#717182] uppercase tracking-wide hidden sm:inline">SMART LINK MANAGEMENT</span>
      </button>
      </div>
      <div className="flex items-center gap-4">
        {showUpgrade && (
          <button className="px-4 py-2 bg-[#2E4BC8] text-white rounded-lg font-['Inter',sans-serif] font-medium text-[14px]">
            Pro Plan
          </button>
        )}
        <button 
          className="w-8 h-8 flex items-center justify-center"
          onClick={() => onNavigate && onNavigate('create-link')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 5v10M5 10h10" stroke="#1a1b22" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <button 
          className="w-8 h-8 flex items-center justify-center"
          onClick={() => onNavigate && onNavigate('settings')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 17v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" stroke="#1a1b22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="9" cy="7" r="4" stroke="#1a1b22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </header>
  );
}