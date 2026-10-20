import { useEffect, useState, type FormEvent } from 'react'
import { Link2, PlayCircle } from 'lucide-react'
import { api } from '@/api/client'
import type { PublicConfig } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { login, register } from '@/store/authSlice'
import { useAppDispatch, useAppSelector } from '@/store'

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [invite, setInvite] = useState('')
  const [config, setConfig] = useState<PublicConfig | null>(null)
  const { status, error } = useAppSelector((s) => s.auth)
  const dispatch = useAppDispatch()

  useEffect(() => {
    api.config().then((r) => setConfig(r.data)).catch(() => setConfig(null))
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    dispatch(mode === 'login' ? login({ email, password }) : register({ email, password, invite }))
  }

  const tryDemo = () => {
    if (config?.demo_email && config.demo_password) {
      dispatch(login({ email: config.demo_email, password: config.demo_password }))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <Link2 className="h-5 w-5 text-primary" /> LinkMind
          </div>
          <CardTitle>{mode === 'login' ? 'Sign in' : 'Create an account'}</CardTitle>
          <CardDescription>Short links with AI classification and malicious-URL detection.</CardDescription>
        </CardHeader>
        <CardContent>
          {config?.demo_email && (
            <>
              <Button variant="outline" className="w-full" onClick={tryDemo} disabled={status === 'loading'}>
                <PlayCircle className="h-4 w-4" /> Try the demo (no sign-up)
              </Button>
              <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}
          <form onSubmit={submit} className="flex flex-col gap-3">
            <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Password (8+ characters)" minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)} required />
            {mode === 'register' && config?.registration_requires_invite && (
              <Input placeholder="Invite code" value={invite} onChange={(e) => setInvite(e.target.value)} required />
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
          <button className="mt-4 text-sm text-primary hover:underline"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'No account? Create one' : 'Have an account? Sign in'}
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
