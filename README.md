# Quiz Platform

A full-stack quiz platform with an **Admin** area (manage quizzes, questions, view stats & leaderboards) and a **Player/Guest** experience (no login — just a nickname).

- **Frontend:** React + Vite + TypeScript + Tailwind + React Router + TanStack Query + React Hook Form + Zod + Axios + Recharts
- **Backend:** Node + Express + TypeScript + Prisma + PostgreSQL + JWT (admin only) + bcrypt

```
quiz_app/
├── backend/    # Express API + Prisma
└── frontend/   # React SPA
```

## 1. Database

You need a PostgreSQL database. Any of these works — put the connection string in `backend/.env` as `DATABASE_URL`.

**Option A — Docker (local):**

```bash
docker run -d --name quiz_platform_db \
  -e POSTGRES_USER=quiz -e POSTGRES_PASSWORD=quiz -e POSTGRES_DB=quiz_platform \
  -p 5432:5432 postgres:16-alpine
# DATABASE_URL="postgresql://quiz:quiz@localhost:5432/quiz_platform?schema=public"
```

(A `docker-compose.yml` is also provided: `docker compose up -d` if you have the compose plugin.)

**Option B — Neon / Supabase (cloud):** create a database and copy the connection string into `backend/.env`.

## 2. Backend

```bash
cd backend
npm install
cp .env.example .env      # then edit DATABASE_URL, JWT_SECRET, ADMIN_*
npx prisma migrate dev --name init   # create tables
npm run db:seed           # create admin + demo quizzes
npm run dev               # http://localhost:4000
```

Default seeded admin (change in `.env`): **admin / admin123**

## 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:4000/api
npm run dev               # http://localhost:5173
```

## API

### Public

| Method | Path                       | Description                                                          |
| ------ | -------------------------- | -------------------------------------------------------------------- |
| GET    | `/api/quizzes`             | List published quizzes (filters: `category`, `difficulty`, `search`) |
| GET    | `/api/quizzes/:id`         | Get a published quiz with questions (correct answers hidden)         |
| POST   | `/api/attempt`             | Submit an attempt; server grades and stores it                       |
| GET    | `/api/attempt/:id`         | Fetch an attempt result                                              |
| GET    | `/api/leaderboard/:quizId` | Leaderboard (score ↓, time ↑, submittedAt ↑)                         |

### Admin (JWT — `Authorization: Bearer <token>`)

| Method | Path                             | Description                      |
| ------ | -------------------------------- | -------------------------------- |
| POST   | `/api/admin/login`               | Login, returns JWT               |
| GET    | `/api/admin/dashboard`           | Aggregate stats                  |
| GET    | `/api/admin/quizzes`             | List all quizzes                 |
| GET    | `/api/admin/quizzes/:id`         | Full quiz (with correct answers) |
| POST   | `/api/admin/quizzes`             | Create quiz                      |
| PUT    | `/api/admin/quizzes/:id`         | Update quiz                      |
| PATCH  | `/api/admin/quizzes/:id/publish` | Publish / unpublish              |
| DELETE | `/api/admin/quizzes/:id`         | Delete quiz                      |
| POST   | `/api/admin/questions`           | Create question (+choices)       |
| PUT    | `/api/admin/questions/:id`       | Update question (+choices)       |
| DELETE | `/api/admin/questions/:id`       | Delete question                  |

> **Anti-cheat:** the public quiz endpoint never returns `isCorrect`. Grading happens
> entirely on the server in `POST /api/attempt`.

> **Note on routing:** admin endpoints are namespaced under `/api/admin/*` (rather than
> sharing `/api/quizzes` with the public API) so the public read routes and the
> authenticated write routes don't collide.

## Deploy

Free-tier stack: **Vercel** (frontend) + **Render** (backend) + **Neon** (database).
Step-by-step instructions with exact build commands and env vars are in
[DEPLOY.md](DEPLOY.md).

Quick summary:

- **Frontend → Vercel:** root `frontend`, set `VITE_API_URL` to `<api-url>/api`.
  `frontend/vercel.json` handles SPA routing.
- **Backend → Render:** root `backend`, build runs `prisma migrate deploy`; seed once
  in the Render shell with `npm run db:seed:prod`.
- **Database → Neon** (persistent free tier) or Supabase.

> Railway no longer has a free tier, so it's omitted from the free stack.
