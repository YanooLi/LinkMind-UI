import { useNavigate } from 'react-router-dom'

// The Figma design navigated between screens with a PageType state; each one is now a real URL.
export type PageType = 'landing' | 'signin' | 'home' | 'all-resources' | 'create-link' | 'analytics' | 'settings' | 'qr'

export const PATHS: Record<PageType, string> = {
  landing: '/', signin: '/signin', home: '/home', 'all-resources': '/resources', 'create-link': '/create',
  qr: '/qr', analytics: '/analytics', settings: '/settings',
}

export function pageForPath(pathname: string): PageType {
  const hit = (Object.entries(PATHS) as [PageType, string][]).find(([, p]) => p !== '/' && pathname.startsWith(p))
  return hit ? hit[0] : 'landing'
}

export function usePageNav() {
  const navigate = useNavigate()
  return (page: PageType) => navigate(PATHS[page])
}
