# Deploying the Quiz Platform (free tier)

Recommended free stack:

| Piece    | Service                       | Notes                                                       |
| -------- | ----------------------------- | ----------------------------------------------------------- |
| Database | **Neon**                      | Serverless Postgres, persistent free tier                   |
| Backend  | **Render** (Free Web Service) | Sleeps after ~15 min idle → first request is slow (~30–50s) |
| Frontend | **Vercel** (Hobby)            | Instant static hosting for the Vite SPA                     |

> Railway is **not** free anymore (trial credit then paid), so it's skipped here.

Push this repo to GitHub first — all three services deploy from a Git
--- repo.

---

## 1. Database — Neon

1. Sign up at https://neon.tech → **Create project** (pick a region near your users).
2. In the project dashboard, copy the **connection string** (use the _Pooled_ connection).
   It looks like:
   `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require`
3. Keep it handy — it's the `DATABASE_URL` for Render.

## 2. Backend — Render

1. https://render.com → **New → Web Service** → connect your GitHub repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:**
     ```
     npm install --include=dev && npx prisma generate && npm run build && npx prisma migrate deploy
     ```
   - **Start Command:**
     ```
     npm start
     ```
   - **Instance Type:** Free
3. **Environment variables** (Environment tab):
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | your Neon pooled connection string |
   | `JWT_SECRET` | a long random string — generate with `openssl rand -base64 48` |
   | `JWT_EXPIRES_IN` | `7d` |
   | `ADMIN_USERNAME` | your admin username |
   | `ADMIN_PASSWORD` | your admin password |
   | `CORS_ORIGIN` | your Vercel URL (add after step 3), e.g. `https://your-app.vercel.app` |
   | `NODE_ENV` | `production` |
4. Deploy. The build runs the migration automatically (`prisma migrate deploy`).
5. **Seed the admin user once** — open the Render **Shell** tab and run:
   ```
   npm run db:seed:prod
   ```
   (This runs the compiled `dist/seed.js`; it upserts the admin and adds demo quizzes
   only if the DB is empty. Safe to run more than once.)
6. Copy your backend URL, e.g. `https://quiz-platform-api.onrender.com`.

> **Note:** `prisma` and `typescript` are dev dependencies, so the build uses
> `--include=dev`. Migrations run at build time (DB is reachable then), and the
> runtime only needs the compiled `dist/` + `@prisma/client`, so the Start Command
> stays lean.

---

## 3. Frontend — Vercel

1. https://vercel.com → **Add New → Project** → import your GitHub repo.
2. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (auto-detected)
   - Build Command `npm run build`, Output Directory `dist` (defaults are fine)
3. **Environment variable:**
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://<your-render-app>.onrender.com/api` |
   (Note the trailing `/api`.)
4. Deploy. `frontend/vercel.json` already adds the SPA rewrite so deep links like
   `/admin/login` don't 404 on refresh.
5. Copy your Vercel URL and set it as `CORS_ORIGIN` back on Render (step 2.3), then
   trigger a Render redeploy so the API accepts requests from your frontend.

---

## 4. Verify

- Open the Vercel URL → the quiz list loads (data comes from Render → Neon).
- `https://<render-app>.onrender.com/health` returns `{"status":"ok"}`.
- Admin login at `/admin/login` with the credentials you set.

## Gotchas checklist

- [ ] `VITE_API_URL` ends in `/api`.
- [ ] `CORS_ORIGIN` on Render exactly matches the Vercel origin (no trailing slash).
- [ ] `JWT_SECRET` is a real random value in production, not the dev placeholder.
- [ ] First request after idle is slow on Render Free — that's the cold start, not a bug.
- [ ] Multiple `CORS_ORIGIN` values (e.g. preview + prod) can be comma-separated.
