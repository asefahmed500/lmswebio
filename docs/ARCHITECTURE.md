# LMS Architecture Documentation

## System Architecture Overview

The LMS is built as a monolithic Next.js application with a PostgreSQL database. The architecture follows the Next.js App Router pattern with server and client components.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Browser (React 19 + Next.js 16)                           │
│  - Server Components (RSC) for initial render               │
│  - Client Components for interactivity                      │
│  - shadcn/ui components (Radix UI primitives)               │
└────────────┬────────────────────────────────────────────────┘
             │
             │ HTTP/HTTPS
             ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  Route Handlers (/api/*)                                   │
│  - Authentication middleware                                 │
│  - Role-based access control                                │
│  - Input validation (Zod)                                   │
│  - Prisma ORM for database access                           │
└────────────┬────────────────────────────────────────────────┘
             │
             │ PostgreSQL Protocol
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (PostgreSQL)                   │
├─────────────────────────────────────────────────────────────┤
│  Tables: User, Course, Module, Lesson, Enrollment,         │
│          Quiz, QuizQuestion, QuizAttempt,                  │
│          Assignment, AssignmentSubmission                   │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Server Components (RSC)
- Used for initial page rendering
- Direct database access via Prisma
- Reduced client-side JavaScript
- Better SEO

### Client Components
- Marked with `"use client"` directive
- Used for interactivity (forms, modals, etc.)
- State management with useState/useReducer
- Event handlers and browser APIs

### API Routes
- Server-side endpoints
- JWT authentication
- Role-based authorization
- Input validation with Zod
- Error handling and logging

## Data Flow

### Authentication Flow

```
1. Login Request
   User → POST /api/auth/login
   ↓
2. Server validates credentials
   Database query for user
   ↓
3. Generate JWT tokens
   Access token (15min) + Refresh token (7d)
   ↓
4. Set HTTP-only cookies
   Return user data
   ↓
5. Client stores session
   AuthProvider context
```

### Course Enrollment Flow

```
1. Student browses courses
   GET /api/courses (isPublished=true)
   ↓
2. Student enrolls in course
   POST /api/enrollments
   ↓
3. Create enrollment record
   status=ACTIVE, progress=0
   ↓
4. Student can access content
   Check enrollment before access
   ↓
5. Progress tracking
   Update on lesson completion
```

### Quiz Taking Flow

```
1. Student starts quiz
   POST /api/quizzes/[id]/attempt
   ↓
2. Server checks enrollment and attempts
   Validate attempt count
   ↓
3. Student submits answers
   PUT /api/attempts/[id]/answer
   ↓
4. Auto-grade objective questions
   Calculate score
   ↓
5. Return results
   Store attempt record
```

## Security Architecture

### Authentication
- **JWT Tokens**: Access tokens (15min) + Refresh tokens (7d)
- **HTTP-only Cookies**: Prevents XSS attacks
- **Secure Flag**: HTTPS-only in production
- **SameSite**: CSRF protection

### Authorization
- **Role-based middleware**: Checks user role on protected routes
- **Resource ownership**: Instructors can only edit their own courses
- **Route protection**: Middleware redirects unauthenticated users

### Input Validation
- **Zod schemas**: Validate all user inputs
- **Type safety**: TypeScript prevents type errors
- **SQL injection prevention**: Prisma parameterized queries

## Performance Optimization

### Database
- **Connection pooling**: Prisma manages connections efficiently
- **Query optimization**: Select only needed fields
- **Indexing**: Proper indexes on foreign keys and unique fields

### Frontend
- **Code splitting**: Automatic with Next.js App Router
- **Lazy loading**: Components loaded on demand
- **Image optimization**: Next.js Image component
- **Font optimization**: Next.js font optimization

### Caching Strategy
- **Static Generation**: Where possible for public pages
- **Client-side caching**: React Query for data fetching
- **CDN**: For static assets

## Error Handling Strategy

### API Errors
- **Validation Errors**: 400 with details
- **Authentication Errors**: 401 with redirect
- **Authorization Errors**: 403 with message
- **Not Found**: 404 with resource
- **Server Errors**: 500 with generic message

### Client Errors
- **Error Boundaries**: Catch React errors
- **Loading States**: Show skeleton during fetch
- **Retry Logic**: Allow users to retry failed operations

## Scalability Considerations

### Current Architecture Supports
- **10,000+ concurrent users** with proper database sizing
- **100,000+ courses** with pagination
- **1,000,000+ enrollments** with proper indexing

### Future Scaling Options
- **Database Read Replicas**: For read-heavy workloads
- **CDN**: For static content delivery
- **Microservices**: For specific features (e.g., video streaming)
- **Message Queue**: For background jobs (email, notifications)
