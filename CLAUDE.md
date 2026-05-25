# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Learning Management System (LMS)** – a role‑based modular platform built with Next.js 16, React 19, TypeScript, and shadcn/ui components. The platform supports three user roles (Admin, Instructor, Student) with a modular course structure, collapsible sidebar navigation, and a modern responsive UI.

## Development Commands

```bash
# Start development server (with Turbopack for faster builds)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format

# Add shadcn/ui components
npx shadcn@latest add <component-name>
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 with App Router (RSC enabled)
- **UI Components**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Icons**: Lucide React
- **Fonts**: Inter (primary), Geist Mono (code)
- **Theme Provider**: next-themes with dark mode support
- **TypeScript**: Strict mode enabled with path aliases (`@/*` → root)

### Directory Structure
```
app/               # Next.js App Router (layouts, pages, routes)
components/
  ui/              # shadcn/ui components (40+ pre-built)
  theme-provider.tsx  # Dark mode toggle with 'd' hotkey
lib/
  utils.ts         # cn() utility for className merging
hooks/
  use-mobile.ts    # Mobile breakpoint detection (<768px)
```

### Design System

The project uses **OKLCH color space** for theming with CSS variables defined in [app/globals.css](app/globals.css). Key design tokens:

- **Primary**: Neutral grayscale (not purple-blue per PRD – current implementation uses neutral)
- **Radius**: `0.625rem` base radius with scale modifiers
- **Sidebar**: Dedicated color variables for sidebar states
- **Dark mode**: Toggle via `d` key or next-themes API

### Component Patterns

All shadcn/ui components follow this pattern:
```tsx
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar" // Example compound component
```

Use the `cn()` utility from `lib/utils.ts` for conditional className merging.

### Responsive Breakpoints

- **Desktop**: ≥1280px – Sidebar expanded (16rem)
- **Tablet**: 768px–1279px – Sidebar collapses to icon-only
- **Mobile**: <768px – Off-canvas sidebar overlay

Use the `useIsMobile()` hook from `hooks/use-mobile.ts` for responsive behavior.

## Key Features (Per PRD)

The LMS is divided into modules, each with its own sidebar dropdown:

1. **Course Manager** – Admin/Instructor course creation with modules/lessons
2. **Enrolment** – Student course catalogue and enrollment
3. **Content Delivery** – Video/text/PDF lesson viewer with progress tracking
4. **Assessment** – Quiz engine with auto-grading
5. **Assignments** – File upload, submission, and grading workflow
6. **Progress & Analytics** – Role-based dashboards with charts
7. **Communication** – Course announcements and discussions
8. **User Management** – Admin-only CRUD for users and roles
9. **Settings** – System configuration (Admin only)

## Backend Architecture (Planned)

The PRD specifies:
- **Runtime**: Node.js + Express
- **ORM**: Prisma with PostgreSQL/MySQL
- **Auth**: JWT with HTTP-only cookies
- **Validation**: Zod schemas
- **File Storage**: Multer + local/S3

Key models: `User`, `Course`, `Module`, `Lesson`, `Enrolment`, `Quiz`, `Assignment`, plus junction tables for completions and submissions.

## Role-Based Access Control

Each role sees a customized sidebar. The authentication middleware enforces permissions on API routes:

| Role        | Core Capabilities |
|-------------|-------------------|
| **Admin**   | Full system control, user management, platform analytics |
| **Instructor** | Create/edit own courses, grade submissions, course analytics |
| **Student** | Browse catalogue, enroll, complete lessons, submit work |

## Development Notes

- The project uses Turbopack (`npm run dev --turbopack`) for faster dev builds
- All UI components are client-side (`"use client"` directive) due to Radix UI dependencies
- The layout uses Geist Mono and Inter fonts with CSS variable injection
- When adding new pages, follow the App Router convention: `app/route/page.tsx`
- For forms, consider React Hook Form + Zod (per PRD recommendations)
