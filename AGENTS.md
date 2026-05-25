# AGENTS.md

## Commands

```bash
npm run dev         # next dev --turbopack (Turbopack is default)
npm run build       # next build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run format      # prettier --write "**/*.{ts,tsx}"
npx shadcn@latest add <component>  # add shadcn/ui v4 component
npx prisma generate                 # regenerate Prisma client after schema changes
npx prisma db push                  # push schema to PostgreSQL (dev only)
npx tsx prisma/seed.ts              # seed database with demo data
```

**Order matters:** format → lint → typecheck → build. Run typecheck before considering a change done.

## Architecture

- **Next.js 16** App Router. Route groups: `(auth)` (login/register, no sidebar), `(dashboard)` (role pages, sidebar layout).
- **Backend:** PostgreSQL + Prisma v7 (with `@prisma/adapter-pg`), JWT auth via `jose`, bcryptjs for passwords.
- **No `src/` directory.** All code at project root. Path alias `@/*` maps to `.` (root), NOT `src/`.
- **Auth:** JWT access + refresh tokens in HTTP-only cookies. Middleware at root `middleware.ts` verifies tokens and enforces role-based routing. Auth state in React Context (`AuthProvider`).

## Database

| What | Details |
|------|---------|
| Provider | PostgreSQL (localhost:5432, user `postgres`, pass `asef`, db `lmsioweb`) |
| ORM | Prisma v7.0 (adapter-based, NOT `datasourceUrl`) |
| Client setup | `lib/prisma.ts` — uses `PrismaPg` adapter with `pg.Pool` |
| Schema | `prisma/schema.prisma` — no `url` in datasource (v7 config) |
| Config | `prisma.config.ts` — connection URL for CLI |
| Seed | `prisma/seed.ts` — demo accounts (all passwords: `password123`) |

## Auth (JWT + HTTP-only cookies)

- **Demo accounts:** `admin@lms.com`, `instructor@lms.com`, `student@lms.com` — all password `password123`
- Login: POST `/api/auth/login` returns user, sets `access_token` + `refresh_token` cookies
- Session: GET `/api/auth/me` reads access token from cookie, returns user
- Token refresh: POST `/api/auth/refresh` rotates both tokens
- **Middleware** (`middleware.ts`) protects `/admin/*`, `/instructor/*`, `/student/*` — verifies JWT and role match, runs in Edge runtime. (Next.js 16 may warn about "middleware" being deprecated in favor of "proxy" — the file still works.)
- Use `useAuth()` from `@/components/auth-provider` for user state (provides `user`, `isAuthenticated`, `isLoading`, `login`, `register`, `logout`)

## Stack & Conventions

| What | Which |
|------|-------|
| UI | shadcn/ui v4 (`"style": "radix-sera"`, RSC-mode config) |
| CSS | Tailwind CSS v4 via `@import "tailwindcss"` in `app/globals.css` (NOT `@tailwind` directives) |
| Icons | Lucide React |
| Forms | react-hook-form + Zod (schemas in `lib/validators/`) |
| Charts | Chart.js + react-chartjs-2 |
| Rich text | TipTap |
| Dark mode | next-themes, toggle with `d` key (disabled in inputs) |
| Fonts | Inter (sans), Geist Mono (mono) |

## API Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login, returns user + sets JWT cookies |
| POST | `/api/auth/register` | Public | Register as STUDENT, auto-login |
| POST | `/api/auth/logout` | Any | Clear tokens |
| POST | `/api/auth/refresh` | Any | Rotate access + refresh tokens |
| GET | `/api/auth/me` | Any | Get current session |
| GET | `/api/courses` | Any | List courses (role-filtered) |
| POST | `/api/courses` | INSTRUCTOR, ADMIN | Create course |
| GET | `/api/courses/[id]` | Any | Get course with modules/lessons |
| PUT | `/api/courses/[id]` | INSTRUCTOR (owner), ADMIN | Update course |
| DELETE | `/api/courses/[id]` | ADMIN | Delete course |

## Key Files

| Purpose | Path |
|---------|------|
| Auth context + API calls | `components/auth-provider.tsx` |
| JWT logic (sign, verify, cookies) | `lib/auth/jwt.ts` |
| Prisma client singleton | `lib/prisma.ts` |
| Prisma schema | `prisma/schema.prisma` |
| Prisma v7 config | `prisma.config.ts` |
| Database seed | `prisma/seed.ts` |
| Edge middleware (auth guard) | `middleware.ts` |
| Sidebar nav (role-based) | `components/dashboard/layout/sidebar-nav.tsx` |
| Dashboard shell (sidebar + header) | `components/dashboard/layout/dashboard-layout.tsx` |
| Theme provider + `d` key hotkey | `components/theme-provider.tsx` |
| Mock data loader (legacy, async fns) | `lib/mock-data.ts` |
| Mock JSON datasets | `data/mock/*.json` |
| Types (models, enums, forms) | `types/index.ts` |
| cn() utility | `lib/utils.ts` |
| Zod validators | `lib/validators/*.ts` |
| shadcn config | `components.json` |
| Home/landing page | `app/page.tsx` |
| PRD (full spec) | `prd.nd` |
| Legacy CLAUDE.md | `CLAUDE.md` |

## Role System (3 roles)

- **ADMIN** → `/admin` (user mgmt, courses, analytics, settings)
- **INSTRUCTOR** → `/instructor` (own courses, grading, quizzes)
- **STUDENT** → `/student` (enrolment, course player, progress)

Role-based sidebar defined in `sidebar-nav.tsx`. Role enum in `types/index.ts`.

## Gotchas

- **Tailwind v4:** Uses CSS-first config (`@import "tailwindcss"`, `@theme inline`, `@custom-variant`). No `tailwind.config.ts` file.
- **`@/*` = root**, not `src/`. Import like `@/components/ui/button`, NOT `@/src/components/ui/button`.
- **All page components are `"use client"`.** Treat them as such — no async components.
- **Middleware is Edge runtime.** Cannot use PrismaClient, bcrypt, pg, or any Node.js APIs. Only `jose` for JWT verification.
- **Prisma v7 requires adapter.** Client setup in `lib/prisma.ts` uses `PrismaPg` adapter. Do NOT pass `datasourceUrl` to constructor.
- **Schema has no `url` in datasource.** Connection URL is in `prisma.config.ts` for CLI tools.
- **Pages handle loading state inline** with `isLoading` + spinner. No `loading.tsx` files.
- **`shadcn/ui` adds components to `components/ui/`** via CLI, not manual copy.
- **`components.json` has `"rsc": true`** even though pages are client components.
- **Environment:** `.env` contains `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`.
