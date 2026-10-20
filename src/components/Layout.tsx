import { Link2, LogOut } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { logout } from '@/store/authSlice'
import { useAppDispatch, useAppSelector } from '@/store'

export function Layout() {
  const user = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Link2 className="h-5 w-5 text-primary" /> LinkMind
          </Link>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => dispatch(logout())}>
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
