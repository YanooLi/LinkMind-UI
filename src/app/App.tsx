import { useEffect, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { SignInPage } from './components/SignInPage';
import { HomePage } from './components/HomePage';
import { AllResourcesPage } from './components/AllResourcesPage';
import { CreateLinkPage } from './components/CreateLinkPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { SettingsPage } from './components/SettingsPage';
import { QRGeneratorPage } from './components/QRGeneratorPage';
import { usePageNav } from './routes';
import { loadProfile, logout } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store';

function RequireAuth({ children }: { children: ReactNode }) {
  const loggedIn = useAppSelector((s) => s.auth.loggedIn);
  const location = useLocation();
  if (!loggedIn) return <Navigate to="/signin" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}

function Routed() {
  const nav = usePageNav();
  const dispatch = useAppDispatch();
  const loggedIn = useAppSelector((s) => s.auth.loggedIn);

  useEffect(() => { if (loggedIn) dispatch(loadProfile()); }, [loggedIn, dispatch]);
  useEffect(() => {
    // the API client fires this when a refresh token has expired too
    const out = () => dispatch(logout());
    window.addEventListener('linkmind:logout', out);
    return () => window.removeEventListener('linkmind:logout', out);
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage onNavigate={nav} />} />
      <Route path="/signin" element={<SignInPage onNavigate={nav} />} />
      <Route path="/home" element={<RequireAuth><HomePage onNavigate={nav} /></RequireAuth>} />
      <Route path="/resources" element={<RequireAuth><AllResourcesPage onNavigate={nav} /></RequireAuth>} />
      <Route path="/create" element={<RequireAuth><CreateLinkPage /></RequireAuth>} />
      <Route path="/qr" element={<RequireAuth><QRGeneratorPage /></RequireAuth>} />
      <Route path="/analytics" element={<RequireAuth><AnalyticsPage /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <div className="size-full">
      <BrowserRouter>
        <Routed />
      </BrowserRouter>
    </div>
  );
}
