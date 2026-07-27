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
     npm install --include=dev && npm run render-build
     ```
     (`render-build` = prisma generate → compile → `migrate deploy` → seed. It runs
     migrations **and** seeds the DB, so no Shell access is needed — handy on the free
     plan where Shell is locked.)
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
4. Deploy. The build automatically runs migrations **and** seeds the database
   (admin user + demo quizzes) via `render-build` — no Shell needed. The seed is
   idempotent: it upserts the admin and only adds demo quizzes when the DB is empty,
   so it's safe to run on every deploy.
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

---

## Maintenance

### Rotate the Neon database password

Resetting the password **invalidates the old connection string**, so the live site
loses its database until Render is updated. Do steps 1–3 back-to-back.

1. **Neon** (https://console.neon.tech) → your project → **Roles** → role
   `neondb_owner` → **⋯ → Reset password**. Copy the new password (shown once).
2. Project **Dashboard → Connect** → **Pooled connection** (host contains `-pooler`),
   toggle **Show password** → copy the full new connection string.
3. **Render** → service → **Environment** → edit `DATABASE_URL` → paste the new
   string → **Save Changes** (Render auto-redeploys).
4. Verify: `https://<render-app>.onrender.com/api/quizzes` returns quiz JSON.

### Change the admin password

The seed never updates an existing admin's password, so use the reset script. It
runs against whatever `DATABASE_URL` you give it, so you can target Neon from your
own machine (no Render Shell needed).

```bash
cd backend
# Local dev DB (uses backend/.env):
npm run admin:reset -- <username> '<newPassword>'

# Production (Neon) — paste the current connection string inline:
DATABASE_URL="postgresql://neondb_owner:PASSWORD@ep-xxx-pooler.<region>.aws.neon.tech/neondb?sslmode=require" \
  npm run admin:reset -- <username> '<newPassword>'
```

- Use the **existing** admin username (matches by username: existing → password
  updated; a new username → a second admin is created).
- Keep the whole `DATABASE_URL="..."` on one line; quote the password.
- This changes only the database; Render's `ADMIN_PASSWORD` var is used only when the
  seed first creates the admin.
