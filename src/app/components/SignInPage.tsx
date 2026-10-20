import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from './Button';
import type { PageType } from '../routes';
import { api } from '@/api/client';
import type { PublicConfig } from '@/api/types';
import { clearError, login, register } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store';

interface SignInPageProps {
  onNavigate?: (page: PageType) => void;
}

const inputClass = "w-full px-4 py-3 border border-[rgba(0,0,0,0.1)] rounded-lg font-['Inter',sans-serif] text-[16px] text-[#444653] focus:outline-none focus:ring-2 focus:ring-[#2E4BC8] focus:border-transparent";
const labelClass = "block font-['Inter',sans-serif] font-medium text-[14px] text-[#1a1b22] mb-2 uppercase tracking-wide";

export function SignInPage({ onNavigate }: SignInPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { status, error, loggedIn } = useAppSelector((s) => s.auth);
  const [mode, setMode] = useState<'signin' | 'signup'>(new URLSearchParams(location.search).get('mode') === 'signup' ? 'signup' : 'signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invite, setInvite] = useState('');
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const from = (location.state as { from?: string } | null)?.from ?? '/home';

  useEffect(() => { api.config().then(setConfig).catch(() => setConfig(null)); }, []);
  useEffect(() => { if (loggedIn) navigate(from, { replace: true }); }, [loggedIn, from, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') dispatch(login({ username, password }));
    else dispatch(register({ username, email, password, invite_code: invite || undefined }));
  };

  const tryDemo = () => {
    if (config?.demo_username && config.demo_password) dispatch(login({ username: config.demo_username, password: config.demo_password }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8EBFF] to-[#F0F2FF] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[460px]">
        {/* Back to Landing */}
        <button
          onClick={() => onNavigate && onNavigate('landing')}
          className="flex items-center gap-2 mb-6 text-[#717182] hover:text-[#2E4BC8] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 10H5M10 15l-5-5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-['Inter',sans-serif] text-[14px]">Back to Home</span>
        </button>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#2E4BC8] rounded-lg flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-['Manrope',sans-serif] font-extrabold text-[20px] text-[#1a1b22]">LinkMind</span>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="font-['Manrope',sans-serif] font-extrabold text-[28px] text-[#1a1b22] mb-2">
              {mode === 'signin' ? 'Welcome Back' : 'Create your account'}
            </h1>
            <p className="font-['Inter',sans-serif] text-[16px] text-[#444653]">
              Smart Link Management
            </p>
          </div>

          {/* Demo login (Google/GitHub sign-in is not built yet) */}
          {config?.demo_username && (
            <>
              <button
                type="button"
                onClick={tryDemo}
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-[rgba(0,0,0,0.1)] rounded-lg hover:bg-[#F8F9FC] transition-all mb-6"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="#2E4BC8" strokeWidth="2"/>
                  <path d="M8.5 7v6l5-3-5-3z" fill="#2E4BC8"/>
                </svg>
                <span className="font-['Inter',sans-serif] font-medium text-[14px] text-[#1a1b22]">Try the read-only demo</span>
              </button>
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[rgba(0,0,0,0.1)]"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 font-['Inter',sans-serif] text-[12px] text-[#717182] uppercase tracking-wide">
                    {mode === 'signin' ? 'Or sign in' : 'Or sign up'}
                  </span>
                </div>
              </div>
            </>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className={labelClass}>{mode === 'signin' ? 'Username or email' : 'Username'}</label>
              <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username"
                pattern={mode === 'signup' ? '[A-Za-z0-9_.\\-]{3,32}' : undefined}
                title={mode === 'signup' ? '3–32 letters, numbers, dots, dashes or underscores (no @)' : undefined}
                placeholder={mode === 'signin' ? 'johndoe or user@linkmind.com' : 'johndoe'} className={inputClass} />
              {mode === 'signup' && (
                <p className="mt-1 font-['Inter',sans-serif] text-[12px] text-[#717182]">3–32 letters, numbers, dots, dashes or underscores. Not your email.</p>
              )}
            </div>
            {mode === 'signup' && (
              <div>
                <label htmlFor="email" className={labelClass}>Email Address</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                  placeholder="user@linkmind.com" className={inputClass} />
              </div>
            )}
            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                minLength={mode === 'signup' ? 8 : undefined} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                placeholder="••••••••" className={inputClass} />
            </div>
            {mode === 'signup' && config?.registration_requires_invite && (
              <div>
                <label htmlFor="invite" className={labelClass}>Invite code</label>
                <input id="invite" value={invite} onChange={(e) => setInvite(e.target.value)} required className={inputClass} />
                <p className="mt-1 font-['Inter',sans-serif] text-[12px] text-[#717182]">
                  Sign-up is invite-only to keep the shortener from being used for spam. No code? Try the read-only demo above.
                </p>
              </div>
            )}
            {error && <p role="alert" className="font-['Inter',sans-serif] text-[14px] text-[#BA1A1A]">{error}</p>}
            <Button type="submit" variant="primary" disabled={status === 'loading'} className="w-full flex items-center justify-center gap-2 disabled:opacity-60">
              {status === 'loading' ? 'Please wait…' : mode === 'signin' ? 'Sign in to LinkMind' : 'Create account'}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 10h10M10 5l5 5-5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </form>

          <p className="text-center font-['Inter',sans-serif] text-[14px] text-[#444653] mt-6">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); dispatch(clearError()) }}
              className="text-[#2E4BC8] font-medium hover:underline"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
