# Deploying Status Daily CMS (Vercel + Neon + Cloudflare R2)

The code is **deploy-ready** (Postgres + R2, no secrets in repo). This is the
checklist for the account/secret steps only you can do. All are **free tier**.

> **Rule:** never paste secrets into chat or commit them. They live only in your
> local `.env` and the Vercel dashboard. The repo references env var *names* only.

---

## 0. What you need accounts for
- [Neon](https://neon.tech) — Postgres database
- [Cloudflare R2](https://dash.cloudflare.com) — media storage (images/video)
- [GitHub](https://github.com) — host the repo
- [Vercel](https://vercel.com) — host the app + API

---

## 1. Neon (database)
1. Create a Neon project (region closest to your users, e.g. Singapore/Mumbai).
2. Copy the **Pooled** connection string (the host contains `-pooler`). Use the
   pooled one — serverless functions exhaust direct connections.
3. It looks like: `postgresql://USER:PASSWORD@ep-xxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require`
4. Keep it for `DATABASE_URL` below.

## 2. Cloudflare R2 (media) — **required in production**
Vercel's filesystem is read-only, so the local `/public/uploads` fallback
**cannot** accept admin uploads there. R2 is mandatory for the CMS to store media.
1. Create an R2 bucket, e.g. `status-daily-media`.
2. Enable **public access** → you get a public `https://pub-xxxx.r2.dev` URL
   (or attach a custom domain). This is `R2_PUBLIC_URL` (no trailing slash).
3. Create an **R2 API token** (Object Read & Write) → gives Access Key ID + Secret.
4. Your Account ID is in the R2 dashboard URL / sidebar.

## 3. AUTH_SECRET
Generate a long random string (32+ chars), e.g. `openssl rand -base64 32`.

## 4. Push the repo to GitHub
```bash
cd d:/testing/status-daily-cms
git remote add origin https://github.com/<you>/status-daily-cms.git
git push -u origin main   # (or master — check `git branch`)
```

## 5. Deploy on Vercel
1. **Add New… → Project** → import the GitHub repo.
2. Framework preset: **Next.js** (auto). Leave build command default — the repo's
   `vercel-build` script runs `prisma generate && next build`. Migrations are NOT
   run during the build (Neon free-tier auto-suspends and can time out a build-time
   migration). Run migrations deliberately instead — see step 6.
3. Add **Environment Variables** (Production + Preview):

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | Neon **pooled** connection string (step 1) |
   | `AUTH_SECRET` | random 32+ char string (step 3) |
   | `R2_ACCOUNT_ID` | Cloudflare account id |
   | `R2_ACCESS_KEY_ID` | R2 token access key |
   | `R2_SECRET_ACCESS_KEY` | R2 token secret |
   | `R2_BUCKET` | bucket name, e.g. `status-daily-media` |
   | `R2_PUBLIC_URL` | `https://pub-xxxx.r2.dev` (no trailing slash) |

4. **Deploy.** (Tables are created by `npm run db:deploy`, step 6 — not the build.)

## 6. Seed the config (once)
The DB is empty after migration. Seed admin + 7 languages + 14 categories.
Run locally against Neon (nothing fake is created):
```bash
cd d:/testing/status-daily-cms
# put the SAME Neon DATABASE_URL in your local .env, then:
npm run db:seed
```
Admin login: **admin@statusdaily.app / admin123** — change the password after first login.

## 7. Verify the live site
- Open `https://<your-app>.vercel.app/login` → log in.
- Upload one test image in **Content** → it should store to R2 and render.
- Publish it → hit `https://<your-app>.vercel.app/api/app/feed` → JSON should include it.

## 8. Point the mobile app at the live CMS
In the app repo, edit `constants/content-api.ts`:
```ts
export const CONTENT_API_BASE_URL = 'https://<your-app>.vercel.app'
```
(That's the ONLY app change needed.) Then rebuild:
```bash
cd d:/testing/overlay-app
eas build -p android --profile preview   # or your usual profile
```
Now the installed APK loads the feed from anywhere, on Wi-Fi or mobile data.

---

### Notes
- Local dev now also needs Postgres — point local `.env` `DATABASE_URL` at Neon
  (or a Neon dev branch). The SQLite path is gone.
- Existing local `/public/uploads` media does **not** migrate automatically —
  re-upload through the CMS after deploy so files land in R2.
- Migrations are applied deliberately with `npm run db:deploy` (against Neon),
  NOT at build time. You never run `migrate dev` in production. Only re-run
  `db:deploy` when you add a new migration.
