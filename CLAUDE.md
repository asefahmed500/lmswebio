# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Learning Management System (LMS)** – a role‑based modular platform built with Next.js 16, React 19, TypeScript, and shadcn/ui components. The platform supports three user roles (Admin, Instructor, Student) with a modular course structure, collapsible sidebar navigation, and a modern responsive UI.

## Development Commands

```bash
# Development
npm run dev                # Start dev server with Turbopack
npm run build              # Production build (standalone output for Docker)
npm run start              # Start production server
npm run lint               # Run ESLint
npm run typecheck          # TypeScript type checking
npm run format             # Format code with Prettier

# Database (Prisma + PostgreSQL)
npm run db:generate        # Generate Prisma client after schema changes
npm run db:push            # Push schema to database (dev, no migration file)
npm run db:migrate         # Create and run migration
npm run db:seed            # Seed database with sample data
npm run db:studio          # Open Prisma Studio browser
npm run db:reset           # Reset database (destructive)

# Testing (Vitest)
npm run test               # Run tests
npm run test:ui            # Run tests with UI
npm run test:coverage      # Generate coverage report

# Components
npx shadcn@latest add <component-name>  # Add shadcn/ui component
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 with App Router (RSC enabled, standalone output for Docker)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT (jose) with HTTP-only cookies + CSRF protection
- **UI Components**: shadcn/ui (Radix UI primitives + Tailwind CSS v4)
- **Styling**: Tailwind CSS v4 with OKLCH color space & CSS variables
- **Validation**: Zod schemas
- **Testing**: Vitest with jsdom environment
- **Icons**: Lucide React
- **Fonts**: Inter (primary), Geist Mono (code)
- **Charts**: Chart.js, Recharts

### Directory Structure
```
app/                    # Next.js App Router
  (auth)/              # Login, register, forgot-password routes
  (dashboard)/         # Role-based dashboards (admin/, instructor/, student/)
  api/                 # API routes (auth/, courses/, submissions/, etc.)
  globals.css          # Global styles with OKLCH theme variables
components/
  ui/                  # shadcn/ui components (40+ pre-built)
  auth-provider.tsx    # Auth context provider
  dashboard/           # Dashboard-specific components
lib/
  auth/                # JWT utilities (token generation, verification)
  validators/          # Zod schemas (auth, course, quiz, etc.)
  prisma.ts            # Prisma client singleton
  api-client.ts        # Typed API client
  csrf.ts              # CSRF token generation/validation
  rate-limit.ts        # Rate limiting utilities
  sanitize.ts          # Input sanitization (DOMPurify)
  utils.ts             # cn() utility for className merging
hooks/
  use-mobile.ts        # Mobile breakpoint detection (<768px)
prisma/
  schema.prisma        # Database schema (20+ models)
  seed.ts              # Database seeding script
types/                  # TypeScript type definitions
test/                   # Vitest tests
```

### Data Models

Core Prisma models include: `User`, `Course`, `Module`, `Lesson`, `Enrolment`, `Quiz`, `QuizAttempt`, `Assignment`, `AssignmentSubmission`, `RefreshToken`, `Certificate`, `Discussion`, `Comment`, `CourseReview`, `LearningPath`, `Badge`, `UserBadge`, `Note`, `Bookmark`, `CalendarEvent`, `Notification`, `InstructorProfile`, `Settings`, `RateLimitRecord`.

### Authentication & Security

- **JWT Auth**: Uses `jose` library with HTTP-only cookies (`access_token`, `refresh_token`)
- **CSRF Protection**: Middleware validates `x-csrf-token` header against cookie for state-changing requests
- **Rate Limiting**: `lib/rate-limit.ts` provides per-identifier rate limiting with Prisma backend
- **CSP Headers**: Strict Content Security Policy configured in `next.config.mjs`
- **Middleware**: Role-based route protection (`/admin`, `/instructor`, `/student`)

### Design System

The project uses **OKLCH color space** for theming with CSS variables in `app/globals.css`:

- **Primary**: Neutral grayscale (not purple-blue per PRD)
- **Radius**: `0.625rem` base radius with scale modifiers
- **Sidebar**: Dedicated color variables for sidebar states
- **Dark mode**: Toggle via `d` key or next-themes API

### Component Patterns

All shadcn/ui components follow this pattern:
```tsx
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
```

Use the `cn()` utility from `lib/utils.ts` for conditional className merging.

### Responsive Breakpoints

- **Desktop**: ≥1280px – Sidebar expanded (16rem)
- **Tablet**: 768px–1279px – Sidebar collapses to icon-only
- **Mobile**: <768px – Off-canvas sidebar overlay

Use the `useIsMobile()` hook from `hooks/use-mobile.ts` for responsive behavior.

## Key Features

1. **Course Manager** – Admin/Instructor course creation with modules/lessons
2. **Enrolment** – Student course catalogue and enrollment
3. **Content Delivery** – Video/text/PDF lesson viewer with progress tracking
4. **Assessment** – Quiz engine with auto-grading
5. **Assignments** – File upload, submission, and grading workflow
6. **Progress & Analytics** – Role-based dashboards with charts
7. **Communication** – Discussion forums, comments, announcements
8. **User Management** – Admin-only CRUD for users and roles
9. **Certificates** – Automatic PDF certificate generation
10. **Badges & Gamification** – Achievement system with badges
11. **Calendar** – Events, live sessions, deadlines
12. **Learning Paths** – Curated course sequences

## Role-Based Access Control

Each role sees a customized sidebar. The middleware enforces permissions:

| Role        | Core Capabilities |
|-------------|-------------------|
| **Admin**   | Full system control, user management, platform analytics, settings |
| **Instructor** | Create/edit own courses, grade submissions, course analytics, instructor profile |
| **Student** | Browse catalogue, enroll, complete lessons, submit work, earn certificates/badges |

## Development Notes

- Turbopack is enabled by default for faster dev builds
- All UI components are client-side (`"use client"`) due to Radix UI dependencies
- When adding API routes, add CSRF validation for POST/PUT/PATCH/DELETE (see `middleware.ts`)
- After Prisma schema changes: `npm run db:generate` → optionally `npm run db:push`
- Docker deployment uses standalone output (configured in `next.config.mjs`)
- For forms, use React Hook Form + Zod validators from `lib/validators/`
