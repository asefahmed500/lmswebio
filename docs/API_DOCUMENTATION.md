# LMS API Documentation

Complete API reference for the Learning Management System.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

Most endpoints require authentication. Include your access token in HTTP-only cookies (automatically handled by the browser).

### Authentication Endpoints

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "STUDENT"
  }
}
```

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

**Response (201):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "STUDENT"
  }
}
```

#### POST /auth/logout
Logout and clear tokens.

**Response (200):**
```json
{
  "success": true
}
```

## Courses

### GET /courses
List all courses (filtered by user role).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `category` (optional): Filter by category
- `level` (optional): Filter by level (BEGINNER, INTERMEDIATE, ADVANCED)
- `search` (optional): Search in title/description
- `instructorId` (optional): Filter by instructor

**Response (200):**
```json
{
  "courses": [
    {
      "id": 1,
      "title": "Introduction to Web Development",
      "slug": "intro-to-web-dev",
      "description": "Learn HTML, CSS, and JavaScript",
      "level": "BEGINNER",
      "isPublished": true,
      "category": "Web Development",
      "tags": ["html", "css", "javascript"],
      "thumbnail": "/uploads/thumbnails/course1.jpg",
      "instructorId": 2,
      "instructor": {
        "id": 2,
        "fullName": "Jane Instructor",
        "avatarUrl": "/uploads/avatars/instructor1.jpg"
      },
      "_count": {
        "modules": 5,
        "enrolments": 150
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

### POST /courses
Create a new course (Admin/Instructor only).

**Request Body:**
```json
{
  "title": "Advanced React Patterns",
  "description": "Master advanced React concepts",
  "level": "ADVANCED",
  "category": "Web Development",
  "tags": ["react", "javascript"],
  "thumbnail": "/uploads/thumbnails/new-course.jpg"
}
```

**Response (201):**
```json
{
  "course": {
    "id": 2,
    "title": "Advanced React Patterns",
    "slug": "advanced-react-patterns",
    "instructorId": 2,
    ...
  }
}
```

### GET /courses/[id]
Get detailed course information including modules and lessons.

**Response (200):**
```json
{
  "course": {
    "id": 1,
    "title": "Introduction to Web Development",
    "modules": [
      {
        "id": 1,
        "title": "Getting Started",
        "order": 1,
        "lessons": [
          {
            "id": 1,
            "title": "Welcome",
            "contentType": "text",
            "order": 1,
            "duration": 5
          }
        ]
      }
    ]
  }
}
```

### PUT /courses/[id]
Update course details (Instructor of course/Admin only).

### PATCH /courses/[id]
Toggle publish status (Instructor of course/Admin only).

**Request Body:**
```json
{
  "isPublished": true
}
```

### DELETE /courses/[id]
Delete a course (Admin only).

## Modules

### GET /modules?courseId=X
List all modules for a course.

### POST /modules
Create a new module.

**Request Body:**
```json
{
  "title": "Advanced Concepts",
  "courseId": 1,
  "order": 2
}
```

### PUT /modules/[id]
Update a module.

### DELETE /modules/[id]
Delete a module.

### PUT /modules
Reorder modules.

**Request Body:**
```json
{
  "modules": [
    { "id": 1, "order": 1 },
    { "id": 2, "order": 2 }
  ]
}
```

## Lessons

### GET /lessons?moduleId=X
List all lessons for a module.

### POST /lessons
Create a new lesson.

**Request Body:**
```json
{
  "title": "Understanding Hooks",
  "moduleId": 1,
  "content": "<h1>React Hooks</h1><p>Learn about useState...</p>",
  "contentType": "text",
  "duration": 15,
  "order": 1
}
```

### PUT /lessons/[id]
Update a lesson.

### DELETE /lessons/[id]
Delete a lesson.

### POST /lessons/[id]/complete
Mark a lesson as complete (Student only).

## Enrollments

### GET /enrollments
List user's enrollments or course enrollments.

**Query Parameters:**
- `courseId`: Get enrollments for a specific course (Instructor)

### POST /enrollments
Enroll in a course (Student only).

**Request Body:**
```json
{
  "courseId": 1
}
```

### DELETE /enrollments/[id]
Drop/unenroll from a course.

## Progress

### GET /progress
Get progress data.

**Query Parameters:**
- `courseId`: Get progress for a specific course
- (no params): Get overall progress

**Response (200):**
```json
{
  "overallProgress": 65.5,
  "totalCompletedLessons": 13,
  "totalLessons": 20,
  "courseProgress": [
    {
      "courseId": 1,
      "courseName": "Intro to Web Dev",
      "progress": 75,
      "completedLessons": 6,
      "totalLessons": 8
    }
  ]
}
```

## Quizzes

### GET /quizzes
List quizzes.

**Query Parameters:**
- `courseId`: Filter by course

### POST /quizzes
Create a quiz.

**Request Body:**
```json
{
  "title": "React Basics Quiz",
  "description": "Test your React knowledge",
  "courseId": 1,
  "timeLimit": 30,
  "attemptsAllowed": 3
}
```

### GET /quizzes/[id]
Get quiz with questions ( Instructor/Admin) or without questions (Student).

### POST /quizzes/[id]/attempt
Start a quiz attempt (Student only).

**Response (201):**
```json
{
  "attempt": {
    "id": 1,
    "quizId": 1,
    "userId": 3,
    "score": null,
    "submittedAt": "2024-01-01T12:00:00Z",
    "answers": {}
  }
}
```

### PUT /attempts/[id]/answer
Submit an answer during quiz.

### POST /attempts/[id]/submit
Submit completed quiz for grading.

## Assignments

### GET /assignments
List assignments.

**Query Parameters:**
- `courseId`: Filter by course

### POST /assignments
Create an assignment.

**Request Body:**
```json
{
  "title": "Build a Todo App",
  "description": "Create a todo app using React",
  "dueDate": "2024-12-31T23:59:59Z",
  "maxPoints": 100,
  "courseId": 1
}
```

### POST /assignments/[id]/submit
Submit an assignment (Student only).

**Request Body (multipart/form-data):**
```
file: [file]
textAnswer: "Here is my submission..."
```

### PATCH /submissions/[id]
Grade a submission (Instructor only).

**Request Body:**
```json
{
  "grade": 95,
  "feedback": "Great work! Consider adding error handling."
}
```

## Analytics

### GET /analytics
Get analytics data.

**Query Parameters:**
- `type=platform`: Platform-wide stats (Admin only)
- `type=course&courseId=X`: Course stats (Instructor/Admin)
- `type=user&userId=X`: User stats (Admin/Self)

**Response (type=platform):**
```json
{
  "analytics": {
    "totalUsers": 150,
    "totalCourses": 25,
    "totalEnrollments": 500,
    "activeUsers": 75,
    "userGrowth": [...],
    "enrollmentGrowth": [...]
  }
}
```

## Search

### GET /search
Search across the platform.

**Query Parameters:**
- `q`: Search query (min 2 characters)
- `type`: "courses", "users", or "all"

**Response (200):**
```json
{
  "results": {
    "courses": [...],
    "users": [...]
  },
  "query": "react"
}
```

## Settings

### GET /settings
Get system settings (Admin only).

### PUT /settings
Update system settings (Admin only).

**Request Body:**
```json
{
  "siteName": "My LMS",
  "allowRegistration": true,
  "defaultRole": "STUDENT"
}
```

## File Upload

### POST /upload
Upload a file.

**Request (multipart/form-data):**
```
file: [file]
type: "avatar" | "course-thumbnail" | "lesson-video" | "assignment"
```

**Response (200):**
```json
{
  "url": "/uploads/avatar/abc123.jpg",
  "filename": "profile.jpg",
  "size": 102400,
  "type": "image/jpeg"
}
```

## Error Responses

All endpoints may return error responses:

### 400 Bad Request
```json
{
  "error": "Invalid input",
  "details": [
    {
      "code": "invalid_string",
      "message": "Email is required",
      "path": ["email"]
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests. Please try again later.",
  "remaining": 0
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

- **Login endpoint**: 5 requests per 15 minutes
- **Forgot password**: 3 requests per hour
- **Other endpoints**: No rate limiting (unless specified)

## Pagination

List endpoints support pagination:

```
?page=1&limit=20
```

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```
