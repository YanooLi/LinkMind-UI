# LinkMind-UI

Web client for [LinkMindServices](https://github.com/YanooLi/LinkMindServices): shorten links, batch-import up to
100 URLs, and see each link's AI category, security analysis (phishing/malware signals, Google Safe Browsing) and
click analytics.

**Stack:** React 19 · TypeScript · Vite · Redux Toolkit (async thunks) · React Router · Axios · Tailwind CSS v4 ·
shadcn/ui-style components (Radix Slot + class-variance-authority) · lucide-react

## Run
```bash
npm install
npm run dev          # http://localhost:5173 — proxies /api and /r to the API on :8000
npm run build        # type-check + production bundle in dist/
```
Start the backend first (see LinkMindServices). Set `VITE_API_URL` to call a non-proxied API in production.

## Structure
```
src/api/        Axios client (JWT interceptor, FastAPI error parsing) + response types
src/store/      Redux Toolkit: authSlice (login/register/me), linksSlice (cursor pagination,
                filters, create/batch/delete, polling of links whose analysis is still pending)
src/components/ ui/ (button, input, card, badge — shadcn/ui pattern), Layout, RiskBadge
src/pages/      LoginPage, DashboardPage, LinkDetailPage (risk reasons, 14-day click chart, referrers)
```
