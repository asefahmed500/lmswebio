# Product Requirements Document (PRD)  
## Learning Management System (LMS) – Role‑Based Modular Platform  
### Web‑Based | Backend: Node.js + Prisma | Frontend: Responsive UI (Tailwind + React)

> **Version**: 1.0  
> **Purpose**: A complete specification for building a **full‑featured LMS** with three user roles (Admin, Instructor, Student), a modular course structure, intuitive sidebar navigation, and a modern, accessible UI. The backend will use Node.js, Express, and Prisma ORM; the frontend will follow the provided design system (OKLCH colors, dropdown sidebar, responsive layout).

---

## 1. Executive Summary

Build a web‑based Learning Management System that enables **instructors** to create and manage courses, **students** to enrol, learn, and track progress, and **admins** to oversee the entire platform (users, courses, system settings). The platform follows a **modular approach** – each major feature (courses, assessments, assignments, analytics) is a separate module. The UI features a **collapsible sidebar with dropdown links** for each module, fully responsive for desktop, tablet, and mobile. The backend uses Node.js + Prisma (PostgreSQL/MySQL) with JWT authentication and role‑based access control.

---

## 2. User Roles & Permissions (Detailed)

| Role        | Core Permissions                                                                                                                                                         |
|-------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Admin**   | Full system control: manage users (all roles), create/delete courses (any instructor), manage categories, view platform analytics, configure system settings, handle global announcements. |
| **Instructor** | Create, edit, publish/unpublish own courses. Add/update modules, lessons, quizzes, assignments. Grade student submissions. View course analytics (enrolment, completion). Communicate with students via course announcements. |
| **Student** | Browse course catalogue, enrol in courses, consume lessons (text/video), submit assignments, take quizzes, view grades, track personal progress, participate in discussions (optional). |

Each role sees a **customised sidebar** (only relevant modules/links). The authentication middleware will enforce permissions on both API and UI routes.

---

## 3. Modular Architecture

The LMS is divided into the following **modules** – each can be developed independently and plugged into the main dashboard.

| Module Name        | Description                                                                                 | Accessible by                     |
|--------------------|---------------------------------------------------------------------------------------------|-----------------------------------|
| **Course Manager** | Create, edit, organise courses into modules/lessons.                                       | Admin, Instructor                 |
| **Enrolment**      | Student enrolment, course catalogue, enrolment requests, payment (optional future).        | Admin, Student                    |
| **Content Delivery** | Lesson viewer (video, text, PDF), completion tracking, bookmarks.                        | Student, Instructor (preview)     |
| **Assessment**     | Quizzes (multiple choice, true/false, essay), automated scoring, quiz builder.             | Admin, Instructor (create), Student (take) |
| **Assignments**    | Upload/submit files, instructor grading, rubric, feedback.                                 | Instructor, Student               |
| **Progress & Analytics** | Student progress per course (%, completion), gradebook, course‑level analytics.        | Student (own), Instructor (course), Admin (global) |
| **Communication**  | Course announcements, direct messaging (optional), forum/discussion threads.               | All roles                          |
| **User Management**| CRUD users, assign roles, view profiles. (Admin only)                                     | Admin                              |
| **Settings**       | System name, logo, default timezone, email notifications, theme preferences.              | Admin                              |

Each module will have its own **sidebar dropdown** (e.g., “Courses” dropdown contains sub‑links: My Courses, All Courses, Create Course (instructor), Course Catalogue (student)). The sidebar is built dynamically based on role.

---

## 4. Sidebar Navigation & UI/UX Specifications

### 4.1 Sidebar Structure (Desktop & Mobile)

**For Admin:**
- Dashboard (overview KPI)
- 👩‍🏫 **Users** (dropdown) → All Users, Instructors, Students, Add User
- 📚 **Courses** (dropdown) → All Courses, Pending Approval, Categories, Add Course
- 📝 **Assessments** (dropdown) → All Quizzes, Question Bank
- 📊 **Analytics** (dropdown) → Platform Reports, Revenue (if paid)
- ⚙️ **Settings** (dropdown) → General, Email, Integrations

**For Instructor:**
- Dashboard (own stats)
- 📚 **Courses** (dropdown) → My Courses, Create New Course, Drafts
- ✍️ **Assignments** (dropdown) → To Grade, Submissions, Rubrics
- 🧪 **Quizzes** (dropdown) → Manage Quizzes, Results
- 📈 **Analytics** (dropdown) → Course Progress, Student Performance

**For Student:**
- Dashboard (enrolled courses, upcoming deadlines)
- 📚 **My Learning** (dropdown) → Enrolled Courses, Course Catalogue, Continue Learning
- 📝 **Assignments** (dropdown) → Pending, Submitted, Graded
- 🧪 **Quizzes** (dropdown) → Upcoming, Completed
- 🏆 **Achievements** (dropdown) → Certificates, Badges, Progress

### 4.2 UI Design Tokens (from existing system)

- Use the provided CSS variables: `--background`, `--foreground`, `--primary` (purple‑blue `oklch(0.5772 0.2129 274)`), `--sidebar` background, `--radius: 0.75rem`.  
- Dark mode support via `.dark` class toggle.  
- Font: `'Google Sans Flex', 'Inter', sans‑serif`.  
- Subtle shadows (`--shadow-sm`).  

### 4.3 Responsive Behaviour

- **Desktop (≥1280px)**: Sidebar expanded (280px), main content area fluid.  
- **Tablet (768px–1279px)**: Sidebar collapses to icon‑only by default, expandable via hamburger.  
- **Mobile (<768px)**: Sidebar becomes off‑canvas overlay; all dropdowns become accordion‑style inside the sidebar. Main content uses full width, forms stack vertically.

---

## 5. Core Feature Specifications

### 5.1 Course Management (Modular)

- **Course object**: Title, description, category, thumbnail image, price (optional), level (Beginner/Intermediate/Advanced), tags.  
- **Modules & Lessons**: Each course can have multiple modules. Each module contains lessons (title, content type: video URL, text, PDF attachment, or SCORM).  
- **Instructor actions**: Reorder modules/lessons via drag‑and‑drop (frontend). Draft/publish toggle.  
- **Student view**: Lessons marked as “completed” manually or automatically after watching video (completion threshold). Progress bar at course level.  
- **API endpoints** (protected by role):  
  - `GET /api/courses` (filtered by role – instructors see own, students see published, admin sees all)  
  - `POST /api/courses` (instructor/admin)  
  - `PUT /api/courses/:id`  
  - `DELETE /api/courses/:id` (admin only)  
  - `GET /api/courses/:id/lessons` (with completion flags for student)

### 5.2 Enrolment & Access Control

- **Enrolment methods**: Self‑enrolment (open), instructor approval, admin enrolment, or via code.  
- **Student dashboard**: Lists enrolled courses with progress percentage and “Continue” button.  
- **Database model**: `Enrolment` (userId, courseId, enrolledAt, status: active/completed/dropped, completionPercent).  

### 5.3 Assessment & Quizzes

- **Quiz builder**: Instructor can add questions (type: multiple choice single/multi, text, true/false). Points per question. Time limit (optional).  
- **Student attempt**: One or multiple attempts allowed (configurable). Immediate feedback or after due date.  
- **Auto‑grading**: For objective questions; essay questions manual grading by instructor.  
- **Gradebook**: Aggregated scores for each student per course. Export to CSV.  

### 5.4 Assignments

- **Assignment object**: Title, description, due date, max points, file attachments allowed (size limit).  
- **Student submission**: Upload file, add comments. Submission timestamp recorded.  
- **Instructor grading**: Grade, feedback, optional rubric. Grades appear in student gradebook.  
- **Notifications**: Email/UI notification when graded.

### 5.5 Progress & Analytics Module

- **Student progress**: Calculated as (completed lessons / total lessons) * 100. Quiz/assignment scores separate.  
- **Instructor analytics**: Average course completion, grade distribution, most difficult lessons (by time spent).  
- **Admin analytics**: Total users, active courses, revenue (if paid), engagement metrics.  
- **Charts**: Use Chart.js to display trends (line, bar). Provide export PNG/PDF.

### 5.6 Communication Module

- **Announcements**: Instructors/Admin can post to a course feed. Students see announcements on course homepage.  
- **Direct messaging** (optional future): One‑to‑one chat between student and instructor.  
- **Discussion forums**: Per course or per lesson – threaded comments.

---

## 6. Backend Architecture (Node.js + Prisma)

### 6.1 Tech Stack

- **Runtime**: Node.js (v18+), Express 4.x.  
- **ORM**: Prisma (schema‑first).  
- **Database**: PostgreSQL (recommended) or MySQL.  
- **Authentication**: JWT (access/refresh tokens, HTTP‑only cookies).  
- **Validation**: Zod schemas.  
- **File storage**: Multer + local storage or S3 for lesson attachments/assignment submissions.  
- **Email**: Nodemailer (for notifications, password reset).  

### 6.2 Database Schema (Prisma – core models)

```prisma
model User {
  id            Int       @id @default(autoincrement())
  email         String    @unique
  passwordHash  String
  fullName      String
  role          Role      @default(STUDENT)
  avatarUrl     String?
  createdAt     DateTime  @default(now())
  courses       Course[]  @relation("InstructorCourses") // for instructor
  enrolledCourses Enrolment[]
  assignments   AssignmentSubmission[]
  quizAttempts  QuizAttempt[]
}

enum Role {
  ADMIN
  INSTRUCTOR
  STUDENT
}

model Course {
  id          Int       @id @default(autoincrement())
  title       String
  slug        String    @unique
  description String?
  thumbnail   String?
  level       Level     @default(BEGINNER)
  isPublished Boolean   @default(false)
  instructorId Int
  instructor  User      @relation("InstructorCourses", fields: [instructorId], references: [id])
  modules     Module[]
  enrolments  Enrolment[]
  assignments Assignment[]
  quizzes     Quiz[]
  createdAt   DateTime  @default(now())
}

enum Level { BEGINNER INTERMEDIATE ADVANCED }

model Module {
  id          Int    @id @default(autoincrement())
  title       String
  order       Int
  courseId    Int
  course      Course @relation(fields: [courseId], references: [id])
  lessons     Lesson[]
}

model Lesson {
  id          Int      @id @default(autoincrement())
  title       String
  content     String?  // text/html or video URL
  contentType String   // "video", "text", "pdf"
  order       Int
  moduleId    Int
  module      Module   @relation(fields: [moduleId], references: [id])
  completions LessonCompletion[]
}

model LessonCompletion {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  lessonId  Int
  lesson    Lesson   @relation(fields: [lessonId], references: [id])
  completedAt DateTime @default(now())
  @@unique([userId, lessonId])
}

model Enrolment {
  id           Int      @id @default(autoincrement())
  userId       Int
  user         User     @relation(fields: [userId], references: [id])
  courseId     Int
  course       Course   @relation(fields: [courseId], references: [id])
  enrolledAt   DateTime @default(now())
  status       EnrolmentStatus @default(ACTIVE)
  progress     Float    @default(0) // 0-100
}

enum EnrolmentStatus { ACTIVE COMPLETED DROPPED }

model Quiz {
  id          Int       @id @default(autoincrement())
  title       String
  description String?
  courseId    Int
  course      Course    @relation(fields: [courseId], references: [id])
  timeLimit   Int?      // minutes
  attemptsAllowed Int   @default(1)
  questions   QuizQuestion[]
  attempts    QuizAttempt[]
}

model QuizQuestion {
  id          Int    @id @default(autoincrement())
  quizId      Int
  quiz        Quiz   @relation(fields: [quizId], references: [id])
  text        String
  type        QuestionType // MC_SINGLE, MC_MULTI, TEXT, TRUE_FALSE
  points      Int
  options     Json?   // for MC questions: { "A": "text", "B": "text" }
  correctAnswer Json?  // e.g., ["A"] or text answer
}

model QuizAttempt {
  id          Int      @id @default(autoincrement())
  quizId      Int
  quiz        Quiz     @relation(fields: [quizId], references: [id])
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  score       Float?
  submittedAt DateTime @default(now())
  answers     Json     // stores user answers
}

model Assignment {
  id          Int       @id @default(autoincrement())
  title       String
  description String?
  dueDate     DateTime?
  maxPoints   Float
  courseId    Int
  course      Course    @relation(fields: [courseId], references: [id])
  submissions AssignmentSubmission[]
}

model AssignmentSubmission {
  id           Int       @id @default(autoincrement())
  assignmentId Int
  assignment   Assignment @relation(fields: [assignmentId], references: [id])
  userId       Int
  user         User      @relation(fields: [userId], references: [id])
  fileUrl      String?
  textAnswer   String?
  grade        Float?
  feedback     String?
  submittedAt  DateTime  @default(now())
}
```

### 6.3 API Endpoints (Core)

| Method | Endpoint                                   | Description                     | Allowed Roles                  |
|--------|--------------------------------------------|---------------------------------|--------------------------------|
| POST   | `/api/auth/login`                          | Login → JWT                     | Public                         |
| POST   | `/api/auth/register`                       | Student registration            | Public (admin via admin panel) |
| GET    | `/api/courses`                             | List courses (filtered by role) | All authenticated              |
| POST   | `/api/courses`                             | Create course                   | Admin, Instructor              |
| PUT    | `/api/courses/:id`                         | Update course                   | Instructor (owner), Admin      |
| POST   | `/api/courses/:id/enrol`                   | Enrol in course                 | Student                        |
| GET    | `/api/courses/:id/progress`                | Student progress for course     | Student (self), Instructor     |
| POST   | `/api/lessons/:id/complete`                | Mark lesson complete            | Student                        |
| CRUD   | `/api/quizzes`                             | Quiz management                 | Admin/Instructor               |
| POST   | `/api/quizzes/:id/attempt`                 | Submit quiz attempt             | Student                        |
| CRUD   | `/api/assignments`                         | Assignment management           | Admin/Instructor               |
| POST   | `/api/assignments/:id/submit`              | Submit assignment               | Student                        |
| PUT    | `/api/assignments/submissions/:id/grade`   | Grade submission                | Instructor                     |
| GET    | `/api/admin/users`                         | Manage users                    | Admin only                     |
| GET    | `/api/admin/analytics`                     | Platform analytics              | Admin only                     |

All endpoints use role middleware (`authorize([...roles])`) and ownership checks for instructors.

---

## 7. Frontend Implementation Details

### 7.1 Framework & Libraries

- **React 18** with TypeScript (recommended).  
- **React Router v6** – protected routes.  
- **Zustand** or Context API for auth state.  
- **React Hook Form** + Zod for forms (course creation, quiz builder).  
- **Tailwind CSS** with provided design tokens.  
- **React Query** (TanStack Query) for data fetching and caching.  
- **Video.js** or **React Player** for video lessons.  
- **React Beautiful DnD** for module/lesson reordering.  

### 7.2 Sidebar Dropdown Implementation

- Use a recursive component for sidebar links.  
- Each dropdown is a `<div>` that toggles `open` class on parent click (or hover for desktop).  
- Icons from Font Awesome 6.  
- On mobile, sidebar is an off‑canvas panel with a close button; dropdowns expand inline.  

### 7.3 Course Builder Page (Instructor)

- Split view: left panel shows modules/lessons tree (drag‑drop sortable), right panel shows content editor (title, content type, video URL, PDF upload).  
- Publish/draft toggle.  
- Autosave via debounced API calls.  

### 7.4 Student Learning Interface

- Course player: sidebar with lesson list (with completion checkmarks), main area displays lesson content.  
- “Mark Complete” button at bottom of each lesson.  
- Next/previous lesson navigation.  
- Quiz/assignment links integrated.  

### 7.5 Dashboard Components

- **Admin dashboard**: Cards for total users, courses, active students; line chart of weekly enrolments.  
- **Instructor dashboard**: Top courses by completion, pending grading queue.  
- **Student dashboard**: “Continue where you left off”, upcoming deadlines, recommended courses.  

---

## 8. Security & Non‑Functional Requirements

| Category           | Requirement                                                                                                                                 |
|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| Authentication     | JWT stored in HTTP‑only secure cookie (or localStorage with refresh rotation). Password reset with email token.                           |
| Authorization      | Middleware checks `req.user.role` and resource ownership (instructor can only edit own courses).                                           |
| Input validation   | Zod schemas on both frontend and backend.                                                                                                  |
| File uploads       | Limit size (20MB for videos, 5MB for PDFs). Scan for malware if using S3.                                                                 |
| Rate limiting      | `express-rate-limit` – 50 requests/min for quiz submissions.                                                                               |
| Database indexing  | Indexes on `Course.instructorId`, `Enrolment.userId+courseId`, `LessonCompletion.userId+lessonId`.                                         |
| Privacy            | Student progress visible only to student and instructor of that course. Admin sees anonymised aggregates.                                  |
| Responsiveness     | Tested on Chrome, Safari, Firefox; mobile breakpoints 375px, 768px, 1280px.                                                                |
| Accessibility      | WCAG 2.1 AA: keyboard navigable sidebar, focus outlines, alt texts for thumbnails, ARIA expanded states for dropdowns.                    |

---

## 9. Development Phases (Agile Sprints)

| Sprint | Focus                                                                                 |
|--------|---------------------------------------------------------------------------------------|
| 1      | Database schema, Prisma models, authentication API (register/login, JWT).           |
| 2      | Course CRUD, module/lesson management (backend + basic instructor UI).              |
| 3      | Student enrolment, lesson viewer, completion tracking (progress calculation).       |
| 4      | Quiz engine (create, take, auto‑grade) + assignment submission & grading.           |
| 5      | Dashboard analytics (charts, KPI cards) and role‑based sidebar with dropdowns.      |
| 6      | Communication module (announcements), notifications, polish UI responsiveness.      |
| 7      | Admin user management, system settings, dark mode toggle.                           |
| 8      | Testing (unit, integration, e2e with Cypress), performance optimisation, deployment.|

---

## 10. Success Criteria (Acceptance Tests)

- [ ] **Student** can browse course catalogue, enrol, watch a video lesson, mark it complete, and see progress update to 100% after finishing all lessons.  
- [ ] **Instructor** can create a course with 2 modules, add 3 lessons (video, text, PDF), and publish. The student can then see the course content.  
- [ ] **Instructor** can create a quiz with 5 MC questions; student takes it and receives auto‑score; instructor can override grade.  
- [ ] **Admin** can view list of all users, change a student to instructor role, and see platform‑wide analytics (total courses, enrolments).  
- [ ] **Sidebar** collapses on tablet and becomes off‑canvas on mobile; all dropdowns work with touch/click.  
- [ ] **Dark mode** toggles without breaking colour contrast on any page.  
- [ ] **API endpoints** reject unauthorised access (e.g., student trying to edit a course returns 403).  

---

## 11. Future Enhancements (Optional)

- SCORM 1.2/2004 support (import/export).  
- Live classes integration (Zoom/WebRTC).  
- Gamification: badges, leaderboards, XP points.  
- Bulk email notifications to course students.  
- Mobile app (React Native) wrapper for the same API.  

---

**This PRD provides a complete roadmap for building a role‑based, modular LMS with a rich UI/UX (sidebar dropdowns, responsive design) and a robust Node.js + Prisma backend. Use it as the single source of truth for development.** 