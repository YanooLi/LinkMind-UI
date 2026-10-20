import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { PageType } from '../routes';
import { pageForPath, usePageNav } from '../routes';
import { logout } from '@/store/authSlice';
import { useAppDispatch } from '@/store';

interface SidebarProps {
  activeItem?: string;
  onNavigate?: (page: PageType) => void;
}

export function Sidebar(_props: SidebarProps) {
  const onNavigate = usePageNav();
  const { pathname } = useLocation();
  const activeItem = pageForPath(pathname);
  // On phones the sidebar is a drawer opened from the header's menu button.
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const toggle = () => setOpen((o) => !o);
    window.addEventListener('linkmind:menu', toggle);
    return () => window.removeEventListener('linkmind:menu', toggle);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  const dispatch = useAppDispatch();
  const signOut = () => { dispatch(logout()); window.location.assign('/'); };
  const mainItems = [
    { id: 'home' as PageType, label: 'Home', icon: 'home' },
    { id: 'all-resources' as PageType, label: 'All Resources', icon: 'folder' },
  ];

  const createItems = [
    { id: 'create-link' as PageType, label: 'Create Link', icon: 'link' },
    { id: 'qr' as PageType, label: 'QR Generator', icon: 'qr' },
  ];

  const analyticsItems = [
    { id: 'analytics' as PageType, label: 'Analytics', icon: 'chart' },
  ];

  const otherItems = [
    { id: 'settings' as PageType, label: 'Settings', icon: 'settings' },
  ];

  const renderIcon = (icon: string) => {
    const iconMap: Record<string, React.JSX.Element> = {
      home: (
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M3 10l7-7 7 7M4 9v9a1 1 0 0 0 1 1h3v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4h3a1 1 0 0 0 1-1v-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      dashboard: (
        <svg viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="6" height="6" stroke="currentColor" strokeWidth="2"/>
          <rect x="11" y="3" width="6" height="6" stroke="currentColor" strokeWidth="2"/>
          <rect x="3" y="11" width="6" height="6" stroke="currentColor" strokeWidth="2"/>
          <rect x="11" y="11" width="6" height="6" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      folder: (
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M2 5a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      link: (
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M8 11a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 9a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      chart: (
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M3 17V9M10 17V3M17 17v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      qr: (
        <svg viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
          <rect x="11" y="2" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
          <rect x="2" y="11" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
          <rect x="4" y="4" width="3" height="3" fill="currentColor"/>
          <rect x="13" y="4" width="3" height="3" fill="currentColor"/>
          <rect x="4" y="13" width="3" height="3" fill="currentColor"/>
        </svg>
      ),
      settings: (
        <svg viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
          <path d="M10 1v2m0 14v2M18.66 5l-1.73 1M3.07 14l-1.73 1M19 10h-2M3 10H1m16.66 5l-1.73-1M3.07 6l-1.73-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    };
    return iconMap[icon] || null;
  };

  const renderMenuSection = (items: typeof mainItems, title?: string) => (
    <div>
      {title && (
        <h3 className="px-4 mb-2 font-['Inter',sans-serif] font-semibold text-[11px] text-[#717182] uppercase tracking-wide">
          {title}
        </h3>
      )}
      {items.map((item) => (
        <button
          key={item.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full ${
            activeItem === item.id
              ? 'bg-[#E8EBFF] text-[#2E4BC8]'
              : 'text-[#444653] hover:bg-[#ECECF0]'
          }`}
          onClick={() => onNavigate(item.id)}
        >
          <div className="w-5 h-5">
            {renderIcon(item.icon)}
          </div>
          <span className="font-['Inter',sans-serif] font-medium text-[14px]">{item.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <>
    {open && <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setOpen(false)} />}
    <aside className={`w-[240px] flex-shrink-0 bg-[#F8F9FC] border-r border-[rgba(0,0,0,0.1)] flex-col gap-6 py-6 px-4 ${
      open ? 'flex fixed inset-y-0 left-0 z-50 overflow-y-auto shadow-xl' : 'hidden md:flex'
    }`}>
      {renderMenuSection(mainItems, 'Main')}
      {renderMenuSection(createItems, 'Create')}
      {renderMenuSection(analyticsItems, 'Analytics')}
      {renderMenuSection(otherItems, 'Other')}

      <div className="mt-auto space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-[#444653] hover:bg-[#ECECF0] rounded-lg" onClick={signOut}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M8 17H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M13 14l4-4-4-4M17 10H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-['Inter',sans-serif] font-medium text-[14px]">Log out</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-[#444653] hover:bg-[#ECECF0] rounded-lg" onClick={() => onNavigate('settings')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 17v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span className="font-['Inter',sans-serif] font-medium text-[14px]">Account</span>
        </button>
      </div>
    </aside>
    </>
  );
}