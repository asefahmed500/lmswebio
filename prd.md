# Product Requirements Document (PRD)
## LMSWebIO — Role-Based Learning Management Platform

> **Version:** 2.0 (as-built + gap register)  
> **Last updated:** 2026-11-27  
> **Source of truth:** the actual code in this repository (`app/`, `components/`, `features/`, `lib/`, `prisma/`).  
> **Previous version:** 1.0 was a greenfield specification. It described an **Express + PostgreSQL + React 18 / React Router** application with integer IDs and listed gamification, certificates and calendar as *future* work. That stack was never implemented. This document replaces those assumptions with the shipped architecture and feature set.

---

## 1. Executive Summary

LMSWebIO is a full-stack, role-based LMS built as a **Next.js 16 App Router** application. It supports three roles — **Admin**, **Instructor** and **Student** — across roughly 70 pages and 85 API routes. Content is organised into courses → modules → lessons; students enrol, consume lessons, complete quizzes and assignments, track progress, earn certificates and badges, follow learning paths, take notes, bookmark lessons, use a calendar with RSVP, and participate in discussions and course reviews. Instructors author and grade; admins manage users, courses, categories, settings and platform analytics.

The platform is delivered as a **single Next.js application** (UI + API route handlers), backed by **MongoDB through Prisma 6.19**, with **JWT access/refresh tokens in HTTP-only cookies**, **CSRF double-submit enforcement in the Edge middleware**, **Stripe Checkout + webhook payments**, **Nodemailer email** and **Zod validation**. Payments fall back to a demo auto-enrolment mode when `STRIPE_SECRET_KEY` is unset.

This document describes (a) what is built, (b) what is only partially built, and (c) the remaining work required for the product to be genuinely complete. Status markers are used throughout:

| Marker | Meaning |
|--------|---------|
| ✅ | Implemented and wired end-to-end |
| ⚠️ | Exists but partial / known defect |
| ❌ | Missing, stub, or dead code |

---

## 2. Product Scope & User Roles

### 2.1 Roles

| Role | Base route | What the role can do |
|------|-----------|----------------------|
| **ADMIN** | `/admin` | Full control: manage all users and roles, create/oversee courses, moderate pending courses, manage categories, manage quizzes/question bank, view platform and enrolment analytics, configure settings (general/email/integrations), view notifications and own profile. Can also access instructor and student areas. |
| **INSTRUCTOR** | `/instructor` | Create/edit/publish own courses, build modules and lessons, create quizzes and assignments, grade submissions, view course and student analytics, manage own profile and notifications. Can also access admin routes. |
| **STUDENT** | `/student` | Browse the public catalogue, enrol (free or paid), consume lessons, complete lessons and track progress, attempt quizzes, submit assignments, view grades, earn certificates and badges, follow learning paths, take notes, bookmark lessons, use the calendar and RSVP to events, post discussions and reviews, view notifications and profile. Can also access admin routes (per current middleware — see gap G-08). |

Role enforcement is implemented in `middleware.ts` (Edge, `jose` verification only) for page routes and in each API route handler via `getSession()` from `lib/auth/jwt.ts`. Resource-level guards live in `lib/authorization.ts` (`canAccessCourse`, `isEnrolledInCourse`, `canModifyCourse`, `canViewSubmissions`, `canGradeSubmission`).

### 2.2 Demo accounts (from `prisma/seed.ts`)

| Email | Password | Role |
|-------|----------|------|
| `admin@lms.com` | `Admin123!` | ADMIN |
| `instructor@lms.com` | `Instructor123!` | INSTRUCTOR |
| `student@lms.com` | `Student123!` | STUDENT |

---

## 3. Feature Modules (as built)

| Module | Capabilities | Status |
|--------|--------------|--------|
| **Course Manager** | Course CRUD (title, slug, description, thumbnail, category, tags, level, price, Stripe price id), draft/publish toggle, soft delete, modules and lessons with ordering and duration, module-level REST endpoints. | ✅ |
| **Catalogue & Enrolment** | Public catalogue (`/courses`, `/api/courses/public`), filtered course listing, course detail with slug or ObjectId, free self-enrolment, paid checkout, enrolment listing, "my enrolments", completion percentage, last-accessed timestamp. | ✅ |
| **Content Delivery** | Lesson viewer with rich text (`content` + `contentType`), manual "mark complete", derived progress, bookmarks, notes with video timestamps. | ⚠️ Single `content` field rather than separate video URL/PDF attachment; completion is manual (no watch-threshold). |
| **Assessment — Quizzes** | Quiz CRUD, 4 question types (`MC_SINGLE`, `MC_MULTI`, `TEXT`, `TRUE_FALSE`), points, time limit, attempts allowed, rate-limited attempt submission, auto-grading, attempt history. | ⚠️ Objective grading works; `TEXT` answers score 0 (no manual grading). Seeded quizzes use an incompatible answer format. |
| **Assessment — Assignments** | Assignment CRUD, due date, max points, text submission (API also accepts `fileUrl`), instructor grading with feedback and `gradedAt`. | ⚠️ No upload UI is wired; no rubric or late policy. |
| **Progress & Analytics** | Per-enrolment progress = `round(completedLessons / totalLessons × 100)`, auto-complete enrolment at 100%, student progress endpoint, instructor dashboard/analytics, admin platform analytics and enrolment trends, Chart.js/recharts visualisations. | ✅ core; ⚠️ no chart PNG/PDF export, no time-spent analytics. |
| **Communication** | Course announcements, discussions with comments (including threaded replies via `parentId`) and votes, course reviews with helpful votes. | ⚠️ No discussion detail/thread UI, no direct messaging. |
| **Certificates** | `Certificate` model with unique verification id, issuance endpoint, public verification endpoint, student certificate gallery and viewer. | ⚠️ `certificateUrl` points at a PDF that is never generated. |
| **Badges & Achievements** | Badge definitions with JSON criteria and points, manual awarding, student badge display. | ⚠️ No automatic criteria evaluator. |
| **Learning Paths** | Paths with ordered mandatory courses, enrol/unenrol, progress field, card UI. | ⚠️ Path progress is never advanced by lesson completion. |
| **Learning Tools** | Notes (per lesson, private, timestamped), bookmarks, calendar events with attendees and RSVP. | ⚠️ Recurrence fields exist but are not expanded. |
| **Payments** | Stripe Checkout session creation, webhook handling, `Payment` records, demo auto-enrolment fallback, checkout page. | ⚠️ Webhook does not persist the real payment intent id. |
| **Notifications** | Notification centre per role, unread counts, mark-as-read. | ⚠️ Reusable `lib/notification-service.ts` exists but has no callers, so business events do not create notifications. |
| **User Management** | Admin user list/detail/create, role and active status, change password, instructor profile with bio/social links and aggregate stats. | ✅ |
| **Settings** | Singleton settings document, general settings page, email settings page. | ⚠️ SMTP fields are not persisted; `/api/settings/test-email` does not exist. Integrations page is an explicit placeholder. |
| **Platform Services** | CSRF tokens, rate limiting (memory + Mongo), sanitisation of user content, audit-log model, file upload endpoint, full-text-ish search, health check, Docker/CI, dark mode, command palette, privacy/terms pages. | ⚠️ `audit-logger.ts` is not wired into routes; upload UI is missing. |

---

## 4. Information Architecture & Navigation

Navigation is data-driven from `features/dashboard/nav/config.ts` and role-filtered in `features/dashboard/layout/sidebar-nav.tsx`. Each role has a primary Dashboard item, collapsible sections, and pinned Notifications / Profile items. A command palette (`⌘K`) flattens the same config for quick navigation.

**Admin:** Dashboard · People (All Users, Instructors, Students, Add User) · Catalogue (All Courses, Pending Approval, Categories, Add Course) · Assessments (All Quizzes, Question Bank) · Insights (Platform Reports, Enrollment Trends) · Configuration (General, Email, Integrations) · Notifications · Profile.

**Instructor:** Dashboard · My Courses (My Courses, Create New, Drafts) · Grading (To Grade, All Submissions, Create Assignment) · Quizzes (Manage Quizzes, Create Quiz, Results) · Insights (Course Progress, Student Performance) · Notifications · Profile.

**Student:** Dashboard · My Learning (Enrolled Courses, Course Catalogue, Continue Learning) · Assignments (Pending, Submitted, Graded) · Quizzes (Upcoming, Completed) · Achievements (Certificates, Badges, Progress) · Community (Discussions, Learning Paths) · Tools (Notes, Calendar) · Notifications · Profile.

Public routes: `/`, `/courses`, `/courses/[id]`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/privacy`, `/terms`.

Responsive behaviour: expanded sidebar on desktop, icon/collapsible on tablet, off-canvas overlay with accordion sections on mobile. Dark mode via `next-themes`.

---

## 5. Technical Architecture (as built)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16.1.7, App Router, React 19.2, TypeScript 5.9 (strict), Turbopack |
| Routing | Route groups `(auth)` and `(dashboard)`; API route handlers under `app/api/` |
| Database | MongoDB, Prisma 6.19 (v7 dropped MongoDB), `String @db.ObjectId` ids, singleton client in `lib/prisma.ts`, `engine: "classic"` for CLI |
| Auth | `jose` HS256 access (1h) + refresh (30d) tokens in HTTP-only cookies; bcryptjs password hashing; refresh rotation with `RefreshToken` records; 60s in-memory session cache |
| Edge middleware | `middleware.ts` — role routing + CSRF double-submit validation; exempt: `/api/auth/*`, `/api/csrf-token`, `/api/payments/webhook` |
| UI | shadcn/ui v4 (radix-sera style), Tailwind CSS v4 (`@import "tailwindcss"`, OKLCH tokens, no `tailwind.config.ts`), lucide-react icons, sonner toasts |
| Forms | react-hook-form + Zod v4 schemas in `lib/validators/` |
| Rich text | TipTap 3 (`@tiptap/react`, `@tiptap/starter-kit`) — no in-editor media upload |
| Charts | Chart.js / react-chartjs-2 and Recharts |
| Payments | Stripe v22 (`lib/stripe.ts`), demo fallback when key absent |
| Email | Nodemailer (`lib/email.ts`), SMTP via env vars |
| Validation/sanitisation | Zod + `sanitize-html` (`lib/sanitize.ts`) |
| Tests | Vitest 4 + jsdom + Testing Library; 6 files / 34 passing tests |
| Quality | ESLint 9 (core-web-vitals + TS), Prettier (no semicolons, double quotes), `npm run audit` gate |
| Deployment | Multi-stage Dockerfile, docker-compose, standalone Next output, GitHub Actions CI with `mongo:7` service |

---

## 6. Data Model

All ids are MongoDB ObjectIds represented as `String`. Enums: `Role`, `Level`, `EnrolmentStatus`, `QuestionType`. There are **38 models**:

| Domain | Models |
|--------|--------|
| Identity & sessions | `User`, `RefreshToken` |
| Content | `Course`, `Module`, `Lesson` |
| Learning & progress | `Enrolment`, `LessonCompletion` |
| Assessment | `Quiz`, `QuizQuestion`, `QuizAttempt`, `Assignment`, `AssignmentSubmission` |
| Payments & credentials | `Payment`, `Certificate` |
| Community | `Discussion`, `Comment`, `DiscussionVote`, `CourseReview`, `ReviewHelpfulVote`, `Announcement`, `InstructorProfile` |
| Gamification | `LearningPath`, `LearningPathCourse`, `LearningPathEnrollment`, `Badge`, `UserBadge` |
| Learning tools | `Note`, `Bookmark`, `CalendarEvent`, `CalendarEventAttendee` |
| System | `Notification`, `Settings` (singleton), `RateLimitRecord`, `AuditLog` |

Notable constraints and behaviour:

- `User.email`, `Course.slug`, `LearningPath.slug`, `Badge.slug`, `RefreshToken.token`, `Certificate.verificationId` and `InstructorProfile.userId` are unique.
- `@@unique([userId, courseId])` on `Enrolment`, `[userId, lessonId]` on `LessonCompletion`, `[courseId, userId]` on `CourseReview`, `[userId, badgeId]` on `UserBadge`, etc.
- `Module`/`Lesson`/`QuizQuestion`/`Discussion`/`Comment`/`Note`/`Bookmark` cascade on parent delete; most other models use soft deletion via `deletedAt`.
- **MongoDB nullable-unique gotcha:** `Payment.stripePaymentIntentId` and `Payment.stripeSessionId` are `@unique` but optional — both must always be populated with a unique placeholder (current code uses `demo_<uuid>` / `pending_<uuid>`).
- `Settings` is a fixed `"singleton"` document with 7 fields (site name/description, registration toggle, default role, maintenance mode, max upload size, email notifications).

Schema gaps are recorded in §8 (G-06).

---

## 7. API Surface

All mutations require an `X-CSRF-Token` header (auto-injected by `lib/api-client.ts` helpers). Authentication is via the HTTP-only access-token cookie.

| Domain | Endpoints |
|--------|-----------|
| Auth | `POST /api/auth/login`, `register`, `logout`, `refresh`, `forgot-password`, `reset-password`, `verify-email`; `GET /api/auth/me`; `POST /api/reset-password/confirm` |
| CSRF | `GET /api/csrf-token` |
| Courses | `GET/POST /api/courses`, `GET/PUT/DELETE /api/courses/[id]`, `POST /api/courses/[id]/enrol`, `GET/POST /api/courses/[id]/modules`, `PUT/DELETE /api/courses/[id]/modules/[moduleId]`, `GET /api/courses/public`, `GET /api/courses/public/[id]` |
| Modules & lessons | `GET/POST /api/modules`, `PUT/DELETE /api/modules/[id]`, `GET/POST /api/lessons`, `PUT/DELETE /api/lessons/[id]`, `POST /api/lessons/[id]/complete` |
| Enrolments | `GET/POST /api/enrollments`, `GET/DELETE /api/enrollments/[id]`, `GET /api/enrollments/[id]/progress`, `GET /api/enrolments/my` |
| Quizzes & questions | `GET/POST /api/quizzes`, `GET/PUT/DELETE /api/quizzes/[id]`, `POST /api/quizzes/[id]/attempt`, `GET /api/quizzes/[id]/attempt`, `GET /api/quizzes/my-attempts`, `POST /api/questions`, `PUT /api/questions/[id]` |
| Assignments & submissions | `GET/POST /api/assignments`, `GET/PUT/DELETE /api/assignments/[id]`, `POST /api/assignments/[id]/submit`, `GET /api/assignments/my-submissions`, `POST /api/assignments/submissions/[id]/grade`, `GET /api/submissions`, `GET /api/submissions/[id]` |
| Progress & analytics | `GET /api/progress`, `GET /api/analytics`, `GET /api/admin/analytics`, `GET /api/instructors/analytics`, `GET /api/instructors/dashboard` |
| Community | `GET/POST /api/announcements`, `GET/PUT/DELETE /api/announcements/[id]`, `GET/POST /api/discussions`, `GET/PATCH/DELETE /api/discussions/[id]`, `POST /api/discussions/[id]/vote`, `POST /api/comments`, `GET/POST /api/reviews`, `POST /api/reviews/[id]/helpful` |
| Gamification | `GET/POST /api/badges`, `GET/POST /api/user-badges`, `GET/POST /api/learning-paths`, `GET/POST/DELETE /api/learning-paths/[id]/enroll`, `GET /api/learning-paths/enrolled` |
| Learning tools | `GET/POST /api/notes`, `GET/PATCH/DELETE /api/notes/[id]`, `GET/POST /api/bookmarks`, `DELETE /api/bookmarks/[id]`, `GET/POST /api/calendar/events`, `POST /api/calendar/events/[id]/rsvp` |
| Credentials & payments | `GET/POST /api/certificates`, `GET /api/certificates/verify`, `GET/POST /api/payments`, `POST /api/payments/checkout`, `POST /api/payments/webhook` |
| Admin & users | `GET /api/users`, `POST /api/users/change-password`, `GET/POST /api/admin/users`, `GET/PUT/DELETE /api/admin/users/[id]`, `GET/PATCH /api/instructors/[id]` |
| Utility | `GET /api/categories`, `GET /api/tags`, `GET /api/search`, `GET/PATCH /api/notifications`, `GET/PUT /api/settings`, `POST /api/upload`, `GET /api/health` |

---

## 8. Core Business Logic (as implemented)

### 8.1 Authentication & CSRF
- Access token (1h) and refresh token (30d) are HS256-signed with separate secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`, each ≥32 chars) and stored in HTTP-only cookies with `SameSite=lax` and `secure` in production.
- Refresh rotation stores hashed tokens in `RefreshToken` and revokes the previous one.
- `middleware.ts` rejects any state-changing request without a header/cookie CSRF token match; public auth endpoints, the CSRF issuer and the Stripe webhook are exempt.

### 8.2 Enrolment & progress
- `POST /api/courses/[id]/enrol` creates an `Enrolment` (`status: ACTIVE`, `progress: 0`) after auth/enrolment checks; paid courses route through checkout.
- `POST /api/lessons/[id]/complete` verifies the lesson and the caller's active enrolment, upserts a `LessonCompletion`, counts completed lessons for that course, computes `progress = round(completed / total × 100)`, updates `lastAccessedAt`, and sets `status = COMPLETED` + `completedAt` when progress reaches 100.

### 8.3 Quiz grading
- Objective types: `MC_SINGLE` and `TRUE_FALSE` award full points on exact match; `MC_MULTI` awards pro-rata points for matched correct options.
- `TEXT` questions currently award 0 points (manual grading is not implemented).
- Score = `round((earned / total) × 100, 2)`. Attempts are rate-limited to 10/minute and capped by `Quiz.attemptsAllowed`; enrollment in the course is required.

### 8.4 Assignment grading
- Students submit text and/or a `fileUrl`; instructors apply a grade (≤ `maxPoints`) and feedback; `gradedAt` is stamped.

### 8.5 Payments
- Free courses/demo mode: enrol directly with a unique `demo_<uuid>` payment placeholder.
- Live mode: create a Stripe Checkout session with inline `price_data`, record `Payment` with `pending_<uuid>` placeholders, and finalise via webhook.

### 8.6 Notifications, audit, rate limiting
- Rate limiting uses an in-memory map plus persistent `RateLimitRecord` documents; applied to login, registration, forgot-password, courses, enrolment, upload, quiz attempts and assignment submissions.
- `lib/sanitize.ts` sanitises discussion/comment/lesson content.
- `lib/notification-service.ts` and `lib/audit-logger.ts` are implemented but currently unused (see G-02).

---

## 9. Gap Register — Remaining Work

These are the concrete blockers to "fully functional with real business logic", ordered by priority. They are also the acceptance criteria for v2.1.

| ID | Severity | Gap | Location / evidence |
|----|----------|-----|---------------------|
| G-01 | Critical | Quiz pipeline is inconsistent: seeded questions use array options and `{correct: 0}` answers while the UI and grader expect `Record<string,string>`; `GET /api/quizzes/[id]` wraps the quiz and strips answers; `TEXT` is never graded. | `prisma/seed.ts:1494-1543`, `app/api/quizzes/[id]/route.ts:56-75`, `attempt/route.ts:86-106`, `student/quizzes/[id]/page.tsx:594-610` |
| G-02 | High | `lib/notification-service.ts` and `lib/audit-logger.ts` have zero call sites — enrolment, completion, grading, publishing and role changes produce no notifications or audit entries. Whole modules are dead code. | `lib/notification-service.ts`, `lib/audit-logger.ts` (no imports) |
| G-03 | High | Admin Settings → Email reads non-existent `smtp*` fields and posts to `/api/settings/test-email`, which does not exist. `sendVerificationEmail()` is never called, so `/api/auth/verify-email` is unreachable. | `admin/settings/email/page.tsx:69-74,101`, `lib/email.ts:63-82` |
| G-04 | High | Integrations settings page is an explicit "coming soon" placeholder with local-only toggles. | `admin/settings/integrations/page.tsx:178-181` |
| G-05 | High | Certificates record a URL to a PDF that is never generated; there is no `public/` directory. Badge icons point to missing `/badges/*.svg`; no automatic badge awarding from `Badge.criteria`. | `api/certificates/route.ts:127-128`, `prisma/seed.ts:1626-1652` |
| G-06 | High | Schema/index gaps: no `Category` model; `CourseReview` lacks a `userId` index; course approval workflow has no status fields; no email-verification token fields, quiz due date/result-release, assignment rubric/late policy, lesson media URLs, or time-spent tracking. | `prisma/schema.prisma`, `api/categories/route.ts:59-64` |
| G-07 | High | Seed data is incomplete/inconsistent: cleanup only covers 7 models; progress is random <100 so no completed enrolments; no completions, attempts, submissions, reviews, discussions or certificates; quiz format broken; notification duplicates on re-run. | `prisma/seed.ts:24-30,1451-1617` |
| G-08 | High | Authorization defects: middleware lets STUDENT and INSTRUCTOR reach `/admin/**`; `getSession()` ignores `isActive`/`deletedAt`; `enrollments/[id]/route.ts` returns the viewer's completions instead of the enrolment owner's; access-token cookie maxAge (7d) disagrees with token lifetime (1h). | `middleware.ts:12-16`, `lib/auth/jwt.ts:90,155-167`, `api/enrollments/[id]/route.ts:87-96` |
| G-09 | Medium | Payments: webhook never replaces `pending_<uuid>` with the real `payment_intent`; no refund/dispute/expiry reconciliation. | `api/payments/webhook/route.ts:41-55` |
| G-10 | Medium | Dead or inert UI: `ModuleLessonTree`, `CourseList`, `CourseReviews` are unimported; `CourseCard` ignores `progress`; no assignment file-upload UI although `/api/upload` exists; no discussion detail/thread view; no chart export. | `features/courses/*`, `features/community/course-reviews.tsx`, `student/assignments/pending/page.tsx` |
| G-11 | Medium | Learning paths never advance; calendar recurrence fields are unused; question bank is a count-only view. | `LearningPathEnrollment.progress`, `calendar-view.tsx:84-89`, `admin/quizzes/question-bank/page.tsx` |
| G-12 | Medium | Test coverage is thin: 34 tests, no API/integration/E2E suites, and `@vitest/coverage-v8` is missing so `npm run test:coverage` fails. | `test/`, `package.json` devDependencies |
| G-13 | Low | `data/mock/*.json` are unused, stale leftovers with integer ids; several docs (README, AUDIT_REPORT, verification checklists) contradict the code. | `data/mock/`, `README.md:22,32` |

### Remediation roadmap

1. **Sprint 1 — correctness:** G-01, G-08, G-07.
2. **Sprint 2 — real workflows:** G-02, G-03, G-04, G-05, G-09.
3. **Sprint 3 — model & UI completeness:** G-06, G-10, G-11.
4. **Sprint 4 — quality:** G-12, G-13, accessibility pass, performance pass.

---

## 10. Non-Functional Requirements

| Area | Requirement | Status |
|------|-------------|--------|
| Security | HTTP-only JWT cookies, refresh rotation, Edge CSRF, bcrypt, Zod validation, sanitised rich text, CSP and security headers in `next.config.mjs`, Stripe signature verification. | ✅ |
| Rate limiting | Login/forgot-password plus mutation endpoints; 10 quiz attempts/minute. | ⚠️ Fails open when the DB lookup errors (`lib/rate-limit.ts:76-79`). |
| Authorisation | Role routing in middleware; ownership guards in `getSession()` callers and `lib/authorization.ts`. | ⚠️ See G-08. |
| Performance | Indexed hot columns, `select`-based queries in several endpoints, standalone build, Turbopack. | ⚠️ N+1 patterns remain on assignments/quizzes/learning-path pages. |
| Accessibility | shadcn/ui Radix primitives, semantic HTML, keyboard-operable dropdowns and command palette, responsive breakpoints. | ⚠️ Full WCAG 2.1 AA audit not done. |
| Observability | `/api/health`, CI pipeline, structured console errors, `AuditLog` model. | ⚠️ APM/error tracking and audit wiring missing. |
| Deployment | Dockerfile + compose, standalone output, `.env` required. | ✅ |

### Environment variables

Required: `DATABASE_URL`, `JWT_SECRET` (≥32 chars), `JWT_REFRESH_SECRET` (≥32 chars). Optional: `NEXT_PUBLIC_APP_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `SEED_DEFAULT_PASSWORD`.

### Key scripts

`npm run dev`, `build`, `start`, `lint`, `typecheck`, `format`, `test`, `test:coverage`, `audit`, `db:generate`, `db:push`, `db:seed`, `db:studio`. Quality gate: `npm run audit` (lint → typecheck → tests). Build/deploy only after the gate passes.

---

## 11. Acceptance Criteria

Baseline criteria from v1.0, re-stated with their current status:

- [x] Student can browse the catalogue, enrol, consume a lesson, mark it complete and see progress update.
- [x] Instructor can create a course with modules/lessons and publish it; students can then see the content.
- [~] Instructor creates a quiz with 5 MC questions; student takes it and receives an auto-score — **works for instructor-created MC quizzes; seeded quizzes and essay questions are broken** (G-01).
- [x] Admin can list users, change roles and view platform analytics.
- [x] Sidebar collapses on tablet and becomes off-canvas on mobile; command palette works.
- [x] Dark mode toggles without breaking layout.
- [~] APIs reject unauthorised access — role/ownership checks exist but several authorisation defects remain (G-08).
- [x] Payments via Stripe Checkout with demo fallback.
- [~] Certificates and badges are viewable — issuance exists but artefacts/auto-award are missing (G-05).
- [~] Notifications and audit trails — UI exists, event wiring does not (G-02).

Additional v2.1 exit criteria: close every gap in §9, raise automated test coverage above 70% with API and integration suites, and produce an updated deployment/ops guide.

---

## 12. Future Enhancements (revised)

Items that moved from *future* to *shipped* in v2.0: certificates, badges/gamification, learning paths, calendar, discussion forums, announcements, Stripe payments, notifications, dark mode, Docker/CI.

Still open: SCORM 1.2/2004 import/export; live classes (Zoom/WebRTC); direct messaging; automated badge/criteria engine (see G-05 — partially designed already); bulk email campaigns; native mobile app; chart export; advanced analytics with time-on-task; full-text search via a dedicated engine; Sentry/APM; cookie-consent banner.

---

**This PRD is the single source of truth for the current product. Any discrepancy between this document and the code must be resolved by updating this document — not by relying on the older audit/verification markdown files, which describe a different, earlier design.**
