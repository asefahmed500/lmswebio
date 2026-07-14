# AGENTS.md

## Commands

```bash
npm run dev           # next dev --turbopack
npm run build         # next build (standalone output for Docker)
npm run typecheck     # tsc --noEmit
npm run lint          # eslint (flat config: core-web-vitals + typescript)
npm run format        # prettier --write "**/*.{ts,tsx}"
npm run test          # vitest (watch mode by default)
npm run test:coverage # vitest --coverage
npm run audit         # lint + typecheck + test --run (pre-commit gate)
npm run db:generate   # prisma generate
npm run db:push       # prisma db push (MongoDB — no migration files)
npm run db:seed       # tsx prisma/seed.ts
npm run db:studio     # prisma studio
npm run db:reset      # prisma migrate reset (destructive)
```

**Run order:** `format → lint → typecheck → test --run` or `audit`. Build only for deploy.

**Path alias:** `@/*` → project root (`@/components/ui/button`).

## Architecture

| Layer | Details |
|-------|---------|
| Framework | Next.js 16 App Router. Route groups: `(auth)` (no sidebar), `(dashboard)` (sidebar layout). |
| Database | **MongoDB** via Prisma v6.19 (v7 dropped MongoDB). All IDs are `String @db.ObjectId`. Never use `parseInt()`/`Number()` on route params. |
| Auth | JWT (access 1h + refresh 30d) in HTTP-only cookies via `jose`. Edge middleware enforces role routing + CSRF. Client state: `useAuth()` from `@/components/auth-provider`. |
| UI | shadcn/ui v4 (radix-sera style). Tailwind CSS v4 via `@import "tailwindcss"` in `app/globals.css`. No `tailwind.config.ts`. |
| Forms | react-hook-form + Zod v4 (`lib/validators/`). |
| Payments | Stripe v22 via `lib/stripe.ts`. Falls back to demo mode (auto-enroll) if `STRIPE_SECRET_KEY` unset. |
| Tests | Vitest + jsdom + @testing-library/react. Setup mocks `next/navigation` + `next/headers`. `vitest.config.ts` runs `pool: "threads"`, `maxWorkers: 1`, `isolate: false` (single-threaded, shared module cache). |

## Database

- MongoDB — `DATABASE_URL` in `.env`. **Prisma v6.19 only** (v7 dropped MongoDB support).
- `lib/prisma.ts` — singleton pattern (no driver adapter).
- Schema changes: `npx prisma db push` → auto `prisma generate` (postinstall hook). No migration files for MongoDB.
- `prisma.config.ts` uses `engine: "classic"` for CLI tools.
- CI spins up a `mongo:7` service container — integration/API tests require a live MongoDB connection. Component tests with mocks run without one.
- **British/American spelling inconsistency**: Prisma model is `Enrolment` (British), but the API route at `app/api/enrolments/my/route.ts` uses British spelling while most frontend code references `enrollment` (American). Be consistent when adding new code.

## Auth

**Demo accounts** (hardcoded in `prisma/seed.ts`):
| Email | Password | Role |
|-------|----------|------|
| admin@lms.com | Admin123! | ADMIN |
| instructor@lms.com | Instructor123! | INSTRUCTOR |
| student@lms.com | Student123! | STUDENT |

- Login: `POST /api/auth/login` → sets `access_token` + `refresh_token` cookies.
- Server session: `getSession()` from `@/lib/auth/jwt` (not `getServerSession`). Has a 60s in-memory cache.
- **Middleware runs in Edge runtime** — no PrismaClient, bcrypt, or Node APIs. Only `jose` for JWT verify.
- Two separate JWT secrets required: `JWT_SECRET` + `JWT_REFRESH_SECRET` (each min 32 chars).

## Roles & Routing

| Role | Base URL | Access |
|------|----------|--------|
| ADMIN | `/admin` | Full system control |
| INSTRUCTOR | `/instructor` | Instructor + Admin routes |
| STUDENT | `/student` | Student + Admin routes |

Role-based sidebar: `@/components/dashboard/layout/sidebar-nav.tsx`. Role type in `types/index.ts`.

## API Conventions

- **CSRF:** All POST/PUT/PATCH/DELETE must include `X-CSRF-Token` header. Use `apiPost`/`apiPut`/`apiPatch`/`apiDelete` from `@/lib/api-client` (auto-injects CSRF). Exempt paths: `/api/auth/`, `/api/csrf-token`, `/api/payments/webhook`.
- **Never use raw `fetch()` for mutations** — it bypasses CSRF and will 403. Many pages still use raw fetch; always use `apiGet`/`apiPost`/etc.
- **Two course detail endpoints:** `/api/courses/[id]` is auth-gated via `canAccessCourse()` (students must be enrolled). `/api/courses/public/[id]` requires no auth, accepts slug OR ObjectId, requires only `isPublished`. Use the public endpoint for un-enrolled views (checkout, browse, catalogue).
- **Authorization:** `@/lib/authorization` for IDOR guards.
- **Error responses:** `@/lib/api-response` for consistent formatting (though most routes don't use it yet).
- **Rate limiting:** `@/lib/rate-limit` — dual memory + Prisma backend. Only login and forgot-password are currently rate-limited.
- **Publish/unpublish courses:** Uses PATCH (not PUT).

## Known Gotchas

### MongoDB unique constraint on nullable fields (CRITICAL)
Unlike Postgres, MongoDB's unique index treats `null` as a value — **only one document can have `null`** for a `@unique` field. Prisma schema fields like `Payment.stripePaymentIntentId` and `Payment.stripeSessionId` are `@unique` + optional. If you create a record without setting them (e.g. demo-mode payments), the second insert crashes with `P2002`. Always assign a unique placeholder (e.g. `"demo_" + uuid`) when the real value isn't available.

### Next.js 16 quirks
- **`middleware.ts` is the file** (not `proxy.ts` yet). Next.js 17 renames it to `proxy.ts`; on 16 the old name works but may log a deprecation warning.
- **`poweredBy` is not a valid config key** in Next.js 16 — already removed; never re-add it or dev server crashes. Unknown config keys are rejected, so don't copy config from older Next versions blindly.
- **First compilation is slow** (60-75s). API routes compile lazily on first request.

### middleware.ts corruption (CRITICAL)
If `middleware.ts` gets a BOM, wrong encoding, or line-ending corruption, **all `/api/auth/*` routes silently return 404** while other API routes work. Fix: delete and recreate the file.

### Session expiry in dev (Edge runtime)
The Edge middleware may fail to read `process.env.JWT_SECRET` in dev. After ~3-5 page navigations in `next dev`, you may get unexpectedly redirected to `/login`. The session token is likely still valid — restart the browser session.

### CourseCard ignores progress prop
`components/course/course-card.tsx:33` destructures `{ course, enrolled }` but ignores `progress` and `showProgress`. Progress bars never render. If adding progress UI, this is where to fix.

### Enrolment API returns wrong user's completions
`app/api/enrollments/[id]/route.ts:87-96` uses `session.user.id` (viewer) instead of `enrollment.userId` (enrollment owner). ADMIN or INSTRUCTOR viewing a student's progress see their own data.

### `text-success` / `text-warning` / `text-info` (NOT missing)
These classes ARE defined in `app/globals.css` under `@theme inline` (`--color-success` / `--color-warning` / `--color-info`). They work correctly. The old gotcha about them being missing was stale.

### `"use client"` required
All page components in route groups (`(auth)/`, `(dashboard)/`) need `"use client"`. Exceptions: `app/page.tsx`, `app/layout.tsx`, `loading.tsx`, `error.tsx`.

### Misc
- **Prettier:** no semicolons, double quotes, trailing commas (es5). `prettier-plugin-tailwindcss` sorts classes.
- **Tailwind v4:** `@import "tailwindcss"` (not `@tailwind`). PostCSS plugin: `@tailwindcss/postcss`. Dark mode via `@custom-variant dark (&:is(.dark *))`.
- **File uploads:** `POST /api/upload` → `public/uploads/` (local filesystem, max 20MB). No cloud storage.
- **Rich text (TipTap):** No image/media upload. Content images must be external URLs.
- **Types:** `types/index.ts` uses TypeScript value/type double declarations (`export type Role` + `export const Role`). Import as `import type { Role }` for type usage.
- **N+1 queries** are common on assignments, quizzes, and learning-paths pages (individual API calls per item). Batch endpoints are preferred.

## Key Files

| Purpose | Path |
|---------|------|
| Edge auth middleware | `middleware.ts` (`proxy.ts` in Next.js 17) |
| Next.js config | `next.config.mjs` (standalone output + CSP headers) |
| Auth context + hooks | `components/auth-provider.tsx` |
| JWT sign/verify/session | `lib/auth/jwt.ts` |
| Prisma schema (MongoDB) | `prisma/schema.prisma` |
| Prisma client singleton | `lib/prisma.ts` |
| API client (fetch + CSRF) | `lib/api-client.ts` |
| Authorization (IDOR) | `lib/authorization.ts` |
| CSRF generation/validation | `lib/csrf.ts` |
| Error response helpers | `lib/api-response.ts` |
| Rate limiting | `lib/rate-limit.ts` |
| Zod validators | `lib/validators/*.ts` |
| Dashboard layout | `components/dashboard/layout/dashboard-layout.tsx` |
| Sidebar nav | `components/dashboard/layout/sidebar-nav.tsx` |
| Dashboard header | `components/dashboard/layout/dashboard-header.tsx` |
| CI pipeline | `.github/workflows/ci.yml` |
| Test setup (mocks) | `test/setup.ts` |
| Globals + theme vars | `app/globals.css` |

## Environment

`.env` requires: `DATABASE_URL`, `JWT_SECRET` (min 32 chars), `JWT_REFRESH_SECRET` (min 32 chars). Optional: `NEXT_PUBLIC_APP_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `EMAIL_HOST`/`PORT`/`USER`/`PASS`/`FROM`, `SEED_DEFAULT_PASSWORD`.
