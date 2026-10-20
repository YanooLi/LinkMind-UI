import { useEffect, useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Button } from './Button';
import { PageHeader } from './PageHeader';
import { API_URL, api, errorMessage } from '@/api/client';
import { logout, setProfile } from '@/store/authSlice';
import { clear, fetchResources } from '@/store/resourcesSlice';
import { useAppDispatch, useAppSelector } from '@/store';
import { formatDate } from '../lib';

type Tab = 'Profile' | 'Account';
const inputClass = "w-full px-4 py-3 border border-[rgba(0,0,0,0.1)] rounded-lg font-['Inter',sans-serif] text-[16px] text-[#444653] focus:outline-none focus:ring-2 focus:ring-[#2E4BC8] focus:border-transparent disabled:bg-[#F8F9FC]";
const labelClass = "block font-['Inter',sans-serif] font-semibold text-[14px] text-[#1a1b22] mb-2 uppercase tracking-wide";
const SOON = ['Security', 'Billing', 'API Keys', 'Integrations'];
const PREFERENCES = [
  ['Email Notifications', 'Receive email updates about your links and analytics'],
  ['Weekly Analytics Report', 'Receive a weekly summary of your link performance'],
  ['Link Health Alerts', 'Get notified when links are broken or underperforming'],
];

function Toggle({ label }: { label: string }) {
  return (
    <label className="relative inline-block w-14 h-7 opacity-50 cursor-not-allowed">
      <input type="checkbox" disabled aria-label={label} className="peer sr-only" />
      <div className="peer w-14 h-7 bg-[#C7D2FE] rounded-full peer-checked:bg-[#2E4BC8] transition-all"></div>
      <div className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all peer-checked:translate-x-7"></div>
    </label>
  );
}

function Soon() {
  return (
    <span className="px-2 py-0.5 bg-[#E8EBFF] text-[#2E4BC8] rounded-full font-['Inter',sans-serif] text-[11px] font-semibold uppercase tracking-wide">
      Coming soon
    </span>
  );
}

export function SettingsPage() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((s) => s.auth.profile);
  const [tab, setTab] = useState<Tab>('Profile');
  const [form, setForm] = useState({ first_name: '', last_name: '', bio: '', username: '', email: '' });
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');

  const reset = () => {
    if (profile) setForm({ first_name: profile.first_name ?? '', last_name: profile.last_name ?? '', bio: profile.bio ?? '', username: profile.username, email: profile.email });
  };
  useEffect(reset, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (fields: (keyof typeof form)[]) => {
    setSaving(true);
    setStatus(null);
    try {
      const patch = Object.fromEntries(fields.map((f) => [f, form[f]]));
      dispatch(setProfile(await api.updateMe(patch)));
      setStatus({ kind: 'ok', text: 'Saved.' });
    } catch (e) {
      setStatus({ kind: 'error', text: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  const deleteLinks = async () => {
    if (!window.confirm('Delete every short link and QR code you created? Their links will stop working.')) return;
    try {
      await api.deleteAllResources();
      dispatch(clear());
      dispatch(fetchResources());
      dispatch(setProfile(await api.me()));
      setStatus({ kind: 'ok', text: 'All links and QR codes were deleted.' });
    } catch (e) {
      setStatus({ kind: 'error', text: errorMessage(e) });
    }
  };

  const deleteAccount = async () => {
    try {
      await api.deleteMe();
      dispatch(logout());
      window.location.assign('/'); // full load, so RequireAuth doesn't bounce to /signin first
    } catch (e) {
      setStatus({ kind: 'error', text: errorMessage(e) });
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  const initials = ((profile?.first_name?.[0] ?? '') + (profile?.last_name?.[0] ?? '') || profile?.username?.[0] || '?').toUpperCase();
  const shortDomain = new URL(API_URL).host;

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar activeItem="settings" />
        <main className="flex-1 p-4 md:p-8 min-w-0">
          <div className="max-w-[1000px] mx-auto">
            <PageHeader
              title="Settings"
              subtitle="Manage your account preferences and application configuration."
            />

            {/* Settings Tabs */}
            <div role="tablist" className="flex gap-2 mb-8 border-b border-[rgba(0,0,0,0.1)] overflow-x-auto">
              {(['Profile', 'Account'] as Tab[]).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => { setTab(t); setStatus(null); }}
                  className={`px-6 py-3 font-['Inter',sans-serif] font-semibold text-[16px] transition-all whitespace-nowrap ${
                    tab === t ? 'text-[#2E4BC8] border-b-2 border-[#2E4BC8]' : 'text-[#717182] hover:text-[#1a1b22]'
                  }`}
                >
                  {t}
                </button>
              ))}
              {SOON.map((t) => (
                <span key={t} title="Coming soon" className="px-6 py-3 font-['Inter',sans-serif] font-semibold text-[16px] text-[#C4C6D0] whitespace-nowrap cursor-not-allowed">
                  {t}
                </span>
              ))}
            </div>

            {status && (
              <p role="status" className={`mb-6 font-['Inter',sans-serif] text-[14px] ${status.kind === 'ok' ? 'text-[#2E7D32]' : 'text-[#BA1A1A]'}`}>
                {status.text}
              </p>
            )}

            <div className="space-y-6">
              {tab === 'Profile' && (
                <>
                  {/* Profile Information */}
                  <div className="bg-white rounded-lg p-8 border border-[rgba(0,0,0,0.1)]">
                    <h2 className="font-['Manrope',sans-serif] font-bold text-[24px] text-[#1a1b22] mb-6">Profile Information</h2>
                    <div className="flex flex-col sm:flex-row items-start gap-8 mb-8">
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 rounded-full border-4 border-[#2E4BC8] bg-[#E8EBFF] flex items-center justify-center font-['Manrope',sans-serif] font-extrabold text-[32px] text-[#2E4BC8]">
                          {initials}
                        </div>
                      </div>
                      <div className="flex-1 w-full space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="first_name" className={labelClass}>First Name</label>
                            <input id="first_name" value={form.first_name} onChange={set('first_name')} className={inputClass} />
                          </div>
                          <div>
                            <label htmlFor="last_name" className={labelClass}>Last Name</label>
                            <input id="last_name" value={form.last_name} onChange={set('last_name')} className={inputClass} />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="bio" className={labelClass}>Bio</label>
                          <textarea id="bio" rows={4} maxLength={500} value={form.bio} onChange={set('bio')} className={`${inputClass} resize-none`} />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={reset}>Cancel</Button>
                      <Button variant="primary" disabled={saving} onClick={() => save(['first_name', 'last_name', 'bio'])}>
                        {saving ? 'Saving…' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>

                  {/* Preferences (not built yet) */}
                  <div className="bg-white rounded-lg p-8 border border-[rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-3 mb-6">
                      <h2 className="font-['Manrope',sans-serif] font-bold text-[24px] text-[#1a1b22]">Preferences</h2>
                      <Soon />
                    </div>
                    <div className="space-y-6">
                      {PREFERENCES.map(([title, text]) => (
                        <div key={title} className="flex items-center justify-between gap-4 p-4 bg-[#F8F9FC] rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-['Inter',sans-serif] font-semibold text-[16px] text-[#1a1b22] mb-1">{title}</h3>
                            <p className="font-['Inter',sans-serif] text-[14px] text-[#717182]">{text}</p>
                          </div>
                          <Toggle label={title} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Link Defaults */}
                  <div className="bg-white rounded-lg p-8 border border-[rgba(0,0,0,0.1)]">
                    <h2 className="font-['Manrope',sans-serif] font-bold text-[24px] text-[#1a1b22] mb-6">Link Defaults</h2>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="domain" className={labelClass}>Default Domain</label>
                        <input id="domain" value={shortDomain} disabled className={inputClass} />
                        <p className="mt-2 font-['Inter',sans-serif] text-[13px] text-[#717182]">Short links look like {shortDomain}/abc1234. Custom domains are coming soon.</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={labelClass.replace('mb-2', 'mb-0')}>Link Expiration</span>
                          <Soon />
                        </div>
                        <input aria-label="Link expiration" value="Never expire" disabled className={inputClass} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={labelClass.replace('mb-2', 'mb-0')}>URL Slug Style</span>
                          <Soon />
                        </div>
                        <input aria-label="URL slug style" value="Random (abc1234)" disabled className={inputClass} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {tab === 'Account' && profile && (
                <>
                  <div className="bg-white rounded-lg p-8 border border-[rgba(0,0,0,0.1)]">
                    <h2 className="font-['Manrope',sans-serif] font-bold text-[24px] text-[#1a1b22] mb-2">Account</h2>
                    <p className="font-['Inter',sans-serif] text-[14px] text-[#717182] mb-6">
                      Member since {formatDate(profile.created_at)} · {profile.stats.urls_created} short links · {profile.stats.qr_codes_created} QR codes
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                      <div>
                        <label htmlFor="username" className={labelClass}>Username</label>
                        <input id="username" value={form.username} onChange={set('username')} className={inputClass} />
                      </div>
                      <div>
                        <label htmlFor="email" className={labelClass}>Email Address</label>
                        <input id="email" type="email" value={form.email} onChange={set('email')} className={inputClass} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={reset}>Cancel</Button>
                      <Button variant="primary" disabled={saving} onClick={() => save(['username', 'email'])}>
                        {saving ? 'Saving…' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-white rounded-lg p-8 border-2 border-red-200">
                    <h2 className="font-['Manrope',sans-serif] font-bold text-[24px] text-red-600 mb-6">Danger Zone</h2>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-red-50 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-['Inter',sans-serif] font-semibold text-[16px] text-[#1a1b22] mb-1">Delete All Links</h3>
                          <p className="font-['Inter',sans-serif] text-[14px] text-[#717182]">Permanently delete all your shortened links and QR codes</p>
                        </div>
                        <button onClick={deleteLinks} className="px-6 py-3 bg-white border-2 border-red-600 text-red-600 rounded-lg font-['Inter',sans-serif] font-semibold text-[16px] hover:bg-red-50 transition-all">
                          Delete Links
                        </button>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-['Inter',sans-serif] font-semibold text-[16px] text-[#1a1b22] mb-1">Delete Account</h3>
                            <p className="font-['Inter',sans-serif] text-[14px] text-[#717182]">
                              Permanently delete your account. Links you created keep working but are no longer tied to you.
                            </p>
                          </div>
                          <button
                            onClick={deleteAccount}
                            disabled={confirmDelete !== profile.username}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg font-['Inter',sans-serif] font-semibold text-[16px] hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Delete Account
                          </button>
                        </div>
                        <label htmlFor="confirm-delete" className="block mt-4 font-['Inter',sans-serif] text-[13px] text-[#717182]">
                          Type your username <span className="font-semibold text-[#1a1b22]">{profile.username}</span> to confirm
                        </label>
                        <input id="confirm-delete" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} className={`${inputClass} mt-2 bg-white`} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
