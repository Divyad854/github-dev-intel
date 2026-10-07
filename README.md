# 🐙 GitHub Developer Intelligence Platform

Enter a GitHub profile URL → the app fetches public data from the GitHub REST API → analyzes the developer → stores everything in MongoDB → shows a dashboard with scores, skills, recommendations, history and comparisons.

**Stack:** Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Redux Toolkit · MongoDB (Mongoose) · GitHub REST API · JWT in HTTP-only cookies

## Quick start

```bash
npm install
cp .env.example .env.local      # then edit the values
npm run dev                     # http://localhost:3000
```

Requirements: Node 18.17+ and a MongoDB instance (local, Docker `docker run -p 27017:27017 mongo`, or MongoDB Atlas).

### Environment variables (`.env.local`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes (prod) | Secret for signing JWTs (`openssl rand -hex 32`) |
| `GITHUB_TOKEN` | recommended | Raises GitHub API limit from 60 to 5000 req/hour. No scopes needed. |
| `ADMIN_EMAIL` | optional | This email becomes admin on registration |

The **first user who registers becomes admin** automatically and can open `/admin`.

## Features

| Area | What it does |
| --- | --- |
| Auth | Register, login, logout, JWT in HTTP-only cookie, `middleware.ts` protects all dashboard routes, `/admin` is admin-only |
| Analyze | Accepts `https://github.com/user`, `github.com/user/repo` or a bare username |
| Repositories | Name, description, language, stars, forks, topics, created / updated dates; search, language filter, sort, include/exclude forks |
| Technology | Language % across repos, repos per language, most-used language, diversity score |
| Intelligence score | Frontend, Backend, Open Source, Activity, Project quality (calculated here, not by GitHub) |
| Activity | Recently created / updated repos, 12-month creation trend, stars/forks, public events (30 days), contributions outside own repos |
| Recommendations | Rule-based (no paid AI): e.g. JavaScript without TypeScript → TypeScript, React without Next.js → Next.js, no tests → Testing |
| Compare | Two profiles side by side, winner per category |
| History | Every analysis is a stored snapshot; reopen old reports, see score changes vs the previous run, delete reports |
| Saved profiles | Save developers, select two and jump to compare |
| Admin | Total users, total analyses, most analyzed developers, recent users and analyses |
| Caching | Analyses newer than 10 minutes are served from MongoDB; tick "force fresh" to re-fetch |

## MongoDB collections

`users`, `githubprofiles`, `repositories`, `analysishistories`, `savedprofiles` (Mongoose models in `src/models`).

## Project structure

```
src/
├── middleware.ts                 route protection (JWT check)
├── app/
│   ├── (auth)/login, register
│   ├── (app)/                    protected pages inside AppShell
│   │   ├── dashboard, analyze, history, saved, compare,
│   │   │   repositories, settings, admin
│   │   └── profile/[username]
│   └── api/
│       ├── auth/{register,login,logout,me}
│       ├── github/{analyze,repositories,profile/[username]}
│       ├── history, history/[id]
│       ├── saved
│       ├── compare
│       └── admin/stats
├── lib/
│   ├── github.ts                 GitHub REST client
│   ├── analysis.ts               scoring + recommendation engine  ← the core business logic
│   ├── service.ts                fetch → analyze → store in MongoDB (+ caching)
│   ├── compare.ts, jwt.ts, auth.ts, http.ts, db.ts, api.ts, types.ts
├── models/                       Mongoose schemas
├── store/                        Redux Toolkit: authSlice, githubSlice,
│                                 comparisonSlice, savedProfilesSlice
└── components/                   AppShell, ReportView, ui
```

## How the scores work (`src/lib/analysis.ts`)

All scores are 0–100 and use diminishing returns (`1 - e^(-x/k)`) so one huge number can't dominate.

- **Frontend / Backend**: share and count of the user's own repos whose language, topics or name match frontend (React, Vue, CSS, Tailwind…) or backend (Node, Python, Go, Mongo, Docker, APIs…) keywords.
- **Open Source**: stars, forks received, license usage, contributions to repos the user doesn't own (from public events) and followers.
- **Activity**: repos pushed in the last 90 days, public events in the last 30 days, and how recent the last push is.
- **Project quality**: share of repos with description, topics, homepage and license, average stars, and number of active repos.
- **Diversity**: number of languages combined with how evenly they are used (Shannon entropy).

Tweak the keyword lists and weights at the top of that file to change the behaviour.

## Notes & limits

- The GitHub API returns up to 300 repositories per user here (3 pages of 100) and about 100 recent public events, so activity reflects roughly the last 90 days.
- Only public data is read. Without `GITHUB_TOKEN` you are limited to 60 requests/hour per IP; each analysis uses about 3–5 requests.
- Production: set `JWT_SECRET` (the app refuses to sign tokens without it), serve over HTTPS (cookies become `Secure` automatically), then `npm run build && npm start`.
