# Performance Audit Report

**Date:** June 2026
**Stack:** Next.js 16 / MongoDB Atlas / Prisma v6 / Vercel

---

## Executive Summary

**78 issues identified** across DB queries, API routes, and frontend bundle. The top 5 systemic problems are:

| # | Issue | Impact | Routes Affected |
|---|-------|--------|-----------------|
| 1 | `getSession()` hits DB on every authenticated request | +50-100ms latency per request | 65+ routes |
| 2 | Rate limiter does `deleteMany` on every rate-limited call | Full table scan + write per request | 8+ routes |
| 3 | Zero database indexes on 30+ frequently queried fields | Slow queries degrading with scale | All routes |
| 4 | ~480KB of unused/duplicate npm packages in bundle | Slower page loads for all users | Frontend |
| 5 | Zero dynamic imports — Chart.js, TipTap loaded eagerly | ~230KB wasted on pages that don't use them | 5+ pages |

**Estimated gains after fixes:**
- 40-60% reduction in average API response time
- ~480KB smaller JavaScript bundle
- 50-80% reduction in database queries per request
- Elimination of N+1 patterns in 6 endpoints

---

## Priority 1: CRITICAL (High Impact / Low Risk)

### 1.1 Cache `getSession()` — Eliminates 1 DB query per authenticated request

**File:** `lib/auth/jwt.ts:118-149`
**Current:** Every call does `prisma.user.findUnique()`
**Fix:** In-memory TTL cache (60s). JWT claims used for auth; DB re-check cached.

```
Impact: -50-100ms per request, -65% DB queries under load
Risk: LOW (cache TTL short; stale-at-max 60s)
```

### 1.2 Fix Rate Limiter — Remove per-request `deleteMany`

**File:** `lib/rate-limit.ts:16-20`
**Current:** `deleteMany` + `count` + `create` = 3 DB ops per request
**Fix:** Remove `deleteMany` from hot path; rely on periodic cleanup + MongoDB TTL index

```
Impact: -2 DB ops per rate-limited request, eliminates table scan
Risk: LOW (periodic cleanup already exists)
```

### 1.3 Add Missing Database Indexes (30+ fields)

**File:** `prisma/schema.prisma`
**Critical indexes needed:**
- `User.role`
- `Course.instructorId`, `Course.isPublished`, `Course.isPublished+category` (compound)
- `Module.courseId`
- `Lesson.moduleId`
- `Notification.userId+read` (compound)
- `RateLimitRecord.identifier+timestamp` (compound)
- `Enrolment.status`, `Enrolment.userId`, `Enrolment.courseId`
- `RefreshToken.userId`

```
Impact: Queries go from collection scans to indexed lookups
Risk: LOW (indexes only speed up reads; minor write overhead)
```

---

## Priority 2: HIGH (High Impact / Medium Risk)

### 2.1 Remove Unused Dependencies (~480KB bundle reduction)

| Package | Size | Status |
|---------|------|--------|
| `recharts` | ~200KB | Unused — not imported anywhere |
| `jspdf` | ~200KB | Unused — not imported anywhere |
| `embla-carousel-react` | ~10KB | Replaced by @blossom-carousel |
| `embla-carousel-autoplay` | ~5KB | Unused |
| `react-day-picker` | ~15KB | Unused |
| `dompurify` | ~20KB | Unused |
| `motion` | ~50KB | Duplicate of `framer-motion` |

**Fix:** Remove from `package.json`, consolidate `motion` → `framer-motion` imports

### 2.2 Dynamic Import Heavy Libraries (~230KB lazy-loaded)

| Library | Pages | Saved |
|---------|-------|-------|
| TipTap editor | Course create/edit | ~100KB |
| Chart.js + react-chartjs-2 | Admin/Instructor analytics | ~65KB |
| Blossom Carousel | Homepage only | ~15KB |
| QuizPlayer | Quiz pages | ~10KB |

### 2.3 Fix N+1 Query Patterns

| Endpoint | Current | Fix |
|----------|---------|-----|
| `lessons/route.ts` reorder | 2N queries | Batch with `findMany` + `$transaction` |
| `modules/route.ts` reorder | 2N queries | Same |
| Module delete cascade | N sequential updates | `$transaction` with `Promise.all` |
| Lesson creation | N sequential `create` | `createMany` bulk insert |

### 2.4 Parallelize Sequential Awaits (17 instances)

Most impactful:
- `admin/analytics` — 4 sequential queries → `Promise.all`
- `analytics` — 2 sequential table scans → `Promise.all`
- `courses/public` — 3 sequential count queries → `Promise.all`
- Auth login/register — sequential token signing → `Promise.all`

### 2.5 Replace Google Fonts `<link>` with `next/font`

**File:** `app/layout.tsx:19-29`
**Current:** Render-blocking external CSS for 3 font families (13 weight variants)
**Fix:** Use `next/font/google` — auto-subsets, inlines CSS, no render block

```
Impact: -100-200ms First Contentful Paint
Risk: LOW (Next.js built-in optimization)
```

---

## Priority 3: MEDIUM (Medium Impact / Low Risk)

### 3.1 Add Pagination to 14 Unpaginated Endpoints

Enrollments, quizzes, assignments, submissions, notes, bookmarks, calendar events, learning paths, notifications, analytics — all return unbounded results.

### 3.2 Reduce Response Payloads

- `enrollments/[id]` — includes full lesson `content` just to count
- `progress` — loads entire course trees for counts
- `courses/[id]` — returns all lesson content in single response
- `categories`/`tags` — fetches all courses for aggregation

### 3.3 Add HTTP Cache Headers

Static-ish endpoints (categories, tags, badges, settings, public courses) should set:
```
Cache-Control: public, s-maxage=300, stale-while-revalidate=600
```

### 3.4 Fix Discussion Vote Count

**Current:** `findMany` all votes → JS `reduce` sum
**Fix:** `prisma.discussionVote.aggregate({ _sum: { value: true } })`

### 3.5 Move Carousel CSS Out of Root Layout

`@blossom-carousel/core/style.css` loaded on every page including dashboards that never use it.

---

## Priority 4: LOW (Nice to Have)

### 4.1 Add Prisma Query Logging (dev only)
### 4.2 Extract static data from homepage-content.tsx (836 lines)
### 4.3 Add `loading.tsx` for nested route segments
### 4.4 Wrap auth-provider functions in `useCallback`
### 4.5 Replace `<img>` with `next/image` in 2 components

---

## Implementation Plan

| Phase | Fixes | Est. Time |
|-------|-------|-----------|
| Phase 3a | Remove unused deps, deduplicate motion, add indexes | 30 min |
| Phase 3b | Cache getSession, fix rate limiter, Promise.all, over-fetches | 45 min |
| Phase 3c | Dynamic imports, font optimization, move CSS | 30 min |
| Phase 4 | Build, test, deploy | 15 min |

**Total estimated improvement:**
- API p50 latency: **200ms → 80ms**
- Homepage bundle: **-480KB gzipped**
- DB queries per request: **-65%**
- Time to Interactive: **-30%**
