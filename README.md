# LinkMind-UI

Web client for [LinkMindServices](https://github.com/YanooLi/LinkMindServices): shorten links, generate styled QR
codes, and see each resource's safety analysis (phishing heuristics, Google Safe Browsing, optional AI category)
and click/scan analytics (by day/week/month, device, country, referrer). The visual design comes from the
LinkMind Figma Make file; every page is wired to the real API.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Redux Toolkit · React Router · Axios

## Run
```bash
npm install
npm run dev          # http://localhost:5173 — expects the API on http://localhost:8000
npm run build        # type-check + production bundle in dist/
```
Start the backend first (see LinkMindServices). Set `VITE_API_URL` to the API's public URL when deploying
(`vercel.json` rewrites every path to `index.html` so client-side routes work on refresh).

## Pages
| Path | Page |
|---|---|
| `/` | Landing page — paste a URL to start |
| `/signin` | Sign in / sign up (invite code when the server requires one) and the read-only demo login |
| `/home` | Totals and recent activity |
| `/create` | Create a short link; shows the safety check as it completes |
| `/qr` | QR generator — square/rounded/dot styles, brand colour, PNG download |
| `/resources` | All links and QR codes: search, filter, sort, copy, download, delete |
| `/analytics` | Overview or `?type=url&id=…` for one resource; CSV export |
| `/settings` | Profile and account details, delete all links, delete account |

## Structure
```
src/api/          Axios client (JWT access + refresh-on-401) and response types
src/store/        Redux Toolkit: authSlice (login/register/profile), resourcesSlice (links + QR codes)
src/app/          App (routes, auth guard), routes.ts (page ↔ path), lib.ts, useAnalysis.ts (polls analysis)
src/app/components/  One component per Figma page, plus Header, Sidebar (drawer on phones), Button
src/assets/       Images exported from the Figma file (imported as figma:asset/<hash>.png)
```
