# Status Daily — Master CMS + Backend

Admin CMS and REST backend for the **Status Daily** app (Expo/React Native WhatsApp-status maker for Tier 2/3 India). Built from the Product Requirements & Functional Blueprint (v1).

This single Next.js app provides **both**:
- the **CMS admin dashboard** (categories, content, languages, users, analytics, moderation), and
- the **REST API** consumed by the mobile app (categories, randomized feed, share/like/report, user upsert).

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | CMS UI + API routes in one app |
| ORM | Prisma 7 (driver adapters) | |
| Database | **SQLite now → Postgres later** | Schema is Postgres-portable; see [Migrating to Postgres](#migrating-to-postgres) |
| Auth | JWT session cookie (`jose`) + bcrypt | admin login only |
| Media | Local disk (`/public/uploads`) → S3/R2 later | |
| Styling | Tailwind CSS 4 | |

## Getting started

```bash
npm install
cp .env.example .env        # adjust AUTH_SECRET for non-dev
npm run db:migrate          # create the SQLite schema
npm run db:seed             # load demo data (admin, languages, categories, content, users)
npm run dev                 # http://localhost:3000
```

**Demo admin login:** `admin@statusdaily.app` / `admin123`

## CMS features (blueprint §14–28)

- **Dashboard** (§17.1) — total/premium/active users, shares, categories, content, top category & language
- **Content** (§21–24) — image/video upload, draft→publish workflow, filters (category/language/type/status/year), clone/reuse, trending toggle, bulk publish/unpublish/delete/reuse
- **Categories** (§18–19) — CRUD, publish/unpublish, language mapping
- **Languages** (§3) — add languages dynamically, activate/deactivate
- **Users** (§26) — searchable user table with share counts & premium status
- **Analytics** (§27) — DAU/MAU, retention, 7-day share trend, platform breakdown, top categories, most active users, most shared content
- **Moderation** (§28) — report queue with remove / block / ignore actions

## App-facing API (consumed by the mobile app)

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/app/categories?lang=hi` | published categories for a language |
| GET | `/api/app/feed?lang=hi&category=love&seed=…&page=1` | randomized published feed (§6, §25) |
| POST | `/api/app/content/:id/share` | record share, increment count |
| POST | `/api/app/content/:id/like` | toggle like |
| POST | `/api/app/content/:id/report` | report content |
| POST | `/api/app/users` | register/upsert app user after OTP |

Admin routes live under `/api/admin/*` and require the session cookie.

## Migrating to Postgres

The schema avoids SQLite-only limitations (no Prisma enums or scalar lists), so the move is mechanical:

1. In `prisma/schema.prisma`, change `datasource.provider` to `"postgresql"`.
2. Set `DATABASE_URL` to your Postgres connection string.
3. Swap the driver adapter in `lib/db.ts` for `@prisma/adapter-pg`.
4. `npm run db:migrate && npm run db:seed`.

Media: replace `saveMediaFile` in `lib/storage.ts` with an S3/R2 putObject — callers only depend on the returned public URL.

## Project layout

```
app/
  (admin)/          guarded CMS pages (dashboard, content, categories, …)
  api/admin/*       CMS API (auth-guarded)
  api/app/*         mobile-app-facing API
  api/auth/*        admin login/logout/me
  login/            sign-in page
lib/                db, auth, storage, constants, formatting, api helpers
prisma/             schema, migrations, seed
components/         sidebar + UI kit
```
