# AGENTS.md

## Commands

```bash
npm run dev           # next dev --turbopack
npm run build         # next build (standalone output)
npm run typecheck     # tsc --noEmit
npm run lint          # eslint (uses eslint-config-next)
npm run format        # prettier --write "**/*.{ts,tsx}"
npm run test          # vitest
npm run test:ui       # vitest --ui
npm run db:generate   # prisma generate
npm run db:push       # prisma db push (dev only — no migrations)
npm run db:seed       # tsx prisma/seed.ts
```

**Order matters:** format -> lint -> typecheck -> build. Typecheck must pass before considering a change done.

**Path alias:** `@/*` maps to the **project root** (no `src/` directory). Use `@/components/ui/button`, not `@/src/components/ui/button`.

## Architecture

| Layer | Details |
|-------|---------|
| Framework | Next.js 16 App Router. Route groups: `(auth)` (no sidebar), `(dashboard)` (sidebar layout). |
| Database | MongoDB Atlas via Prisma v6.19 (MongoDB not supported in Prisma v7). Schema in `prisma/schema.prisma`, CLI config in `prisma.config.ts`. All IDs are `String @db.ObjectId`. |
| Auth | JWT (access + refresh tokens in HTTP-only cookies) via `jose`. Edge middleware enforces role-based routing + CSRF. Client state via `useAuth()` from `components/auth-provider.tsx`. |
| UI | shadcn/ui v4 (radix-sera style). Tailwind CSS v4 via `@import "tailwindcss"` in `app/globals.css`. No `tailwind.config.ts`. |
| Forms | react-hook-form + Zod (schemas in `lib/validators/`). |
| Payments | Stripe v22. Client in `lib/stripe.ts`. Falls back to demo mode (auto-enroll) if `STRIPE_SECRET_KEY` unset. |
| Tests | Vitest + jsdom + @testing-library/react. Setup in `test/setup.ts`. Tests under `test/`. |

## Database

- MongoDB Atlas — connection string in `.env` as `DATABASE_URL`
- **Prisma v6.19** (v7 does not support MongoDB). No driver adapter needed — `lib/prisma.ts` uses `new PrismaClient()` directly.
- **All IDs are `String @db.ObjectId`** — never use `parseInt()` or `Number()` on route params or query params containing IDs. They're already strings.
- Schema uses `url = env("DATABASE_URL")` + `prisma.config.ts` with `dotenv/config` for CLI tools.
- After schema changes: `npx prisma db push` then `npx prisma generate`. No migrations for MongoDB.
- `prisma.config.ts` uses `engine: "classic"` (required for v6 config).

## Auth

**Demo accounts** (from seed, password uses `SEED_DEFAULT_PASSWORD` env var, default `Test123456!`):
- `admin@lms.com` / `Admin123!` (seed creates these with separate hashes: `Admin123!`, `Instructor123!`, `Student123!`)
- `instructor@lms.com` / `Instructor123!`
- `student@lms.com` / `Student123!`

- Login: `POST /api/auth/login` -> sets `access_token` + `refresh_token` HTTP-only cookies
- Session: `GET /api/auth/me` -> reads access token cookie
- Refresh: `POST /api/auth/refresh` -> rotates both tokens
- Client: `useAuth()` from `@/components/auth-provider`

**Middleware runs in Edge runtime.** Cannot use PrismaClient, bcrypt, or any Node.js APIs. Only `jose` for JWT verification.

## Roles & Routing

| Role | Base URL | Access |
|------|----------|--------|
| ADMIN | `/admin` | Full system control |
| INSTRUCTOR | `/instructor` | Admin + Instructor routes |
| STUDENT | `/student` | Admin + Student routes |

Role-based sidebar: `components/dashboard/layout/sidebar-nav.tsx`. Role enum: `types/index.ts`.

## API Development

- **CSRF:** All POST/PUT/PATCH/DELETE must include `X-CSRF-Token` header. Use `apiPost`, `apiPut`, `apiPatch`, `apiDelete` from `lib/api-client.ts` (auto-injects CSRF). Exempt paths: `/api/auth/`, `/api/csrf-token`, `/api/payments/webhook`.
- **IDs are strings (ObjectId).** Never use `parseInt()` or `Number()` on `params.id` or any ID field from request. They're already strings.
- **Session:** Use `getSession()` from `lib/auth/jwt.ts`, not `getServerSession()`.
- **Authorization:** `lib/authorization.ts` for IDOR guards (`canAccessCourse`, `canModifyCourse`, `isEnrolledInCourse`).
- **Error responses:** Use `lib/api-response.ts` helpers for consistent formatting.
- **Rate limiting:** `lib/rate-limit.ts` — per-identifier with Prisma backend.
- **Publish/unpublish:** Uses PATCH (not PUT). The PATCH handler toggles `isPublished`; PUT Zod schema excludes it.

## Gotchas

- **All page components are `"use client"`** except `app/page.tsx` (landing page) and `app/layout.tsx` which are server components.
- **No `loading.tsx` files.** Pages handle loading inline with `isLoading` + spinner.
- **Prettier:** No semicolons, double quotes, trailing commas (es5). Uses `prettier-plugin-tailwindcss` for class sorting with `app/globals.css` as stylesheet reference.
- **CSP in `next.config.mjs`:** `frame-src 'self' https:` required for embedded YouTube/Vimeo. `X-Frame-Options: SAMEORIGIN` on pages, `DENY` on API routes only.
- **Tailwind v4:** `@import "tailwindcss"` in globals.css, NOT `@tailwind` directives. Dark mode via `@custom-variant dark (&:is(.dark *))`.
- **Paid courses:** `POST /api/courses/[id]/enrol` returns 402 if price > 0. Use `POST /api/payments/checkout` for Stripe flow.
- **Lesson sequential locking:** Lessons locked until previous in same module completed. First lesson per module always unlocked.
- **File uploads:** `POST /api/upload` -> `public/uploads/` (local filesystem, max 20MB). No cloud storage.
- **Mock data is legacy.** Most pages use live API. Only homepage (`app/page.tsx`) uses `lib/homepage-data.ts`.
- **PDF lesson type & certificates** are placeholders — no viewer/generation wired up.
- **Rich text editor (TipTap):** No image/media upload in current config. Content images must be external URLs.

## Key Files

| Purpose | Path |
|---------|------|
| Prisma client | `lib/prisma.ts` |
| Prisma schema | `prisma/schema.prisma` |
| Prisma CLI config | `prisma.config.ts` |
| Auth context + hooks | `components/auth-provider.tsx` |
| JWT utilities | `lib/auth/jwt.ts` |
| Session management | `lib/auth/session.ts` |
| Edge auth middleware | `middleware.ts` |
| Authorization (IDOR) | `lib/authorization.ts` |
| CSRF | `lib/csrf.ts` |
| API client (fetch wrappers) | `lib/api-client.ts` |
| API error responses | `lib/api-response.ts` |
| Rate limiting | `lib/rate-limit.ts` |
| Stripe client | `lib/stripe.ts` |
| Email (Nodemailer) | `lib/email.ts` |
| XSS sanitization | `lib/sanitize.ts` |
| Zod validators | `lib/validators/*.ts` |
| Types | `types/index.ts`, `types/api.ts` |
| Dashboard layout | `components/dashboard/layout/dashboard-layout.tsx` |
| Sidebar nav | `components/dashboard/layout/sidebar-nav.tsx` |
| shadcn config | `components.json` |

## Environment

`.env` requires: `DATABASE_URL`, `JWT_SECRET` (min 32 chars), `JWT_REFRESH_SECRET` (min 32 chars), `NEXT_PUBLIC_API_URL`. Optional: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `EMAIL_HOST/PORT/USER/PASS/FROM`, `SEED_DEFAULT_PASSWORD`.
