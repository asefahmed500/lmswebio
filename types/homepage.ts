export interface CoursePreview {
  id: string | number
  title: string
  slug?: string
  description?: string
  thumbnail?: string | null
  instructor: string
  instructorId?: string | number
  instructorAvatar?: string | null
  category?: string
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  price?: number | null
  moduleCount?: number
  studentCount?: number
  totalLessons?: number
  completedLessons?: number
  progress?: number
}

export interface HomepageStats {
  totalCourses: number
  totalStudents: number
  totalInstructors: number
}
