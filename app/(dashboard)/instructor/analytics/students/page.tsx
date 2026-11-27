"use client"

import * as React from "react"
import { Search, Users, BookOpen, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LoadingCard } from "@/components/loading-skeleton"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageHeader } from "@/features/dashboard/components/page-header"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/components/auth-provider"
import { apiGet } from "@/lib/api-client"

interface StudentAnalytics {
  userId: string
  fullName: string
  email: string
  avatarUrl?: string | null
  enrolledCount: number
  avgProgress: number
  completedCount: number
  lastAccessedAt?: string | null
  courses: Array<{
    courseId: string
    courseTitle: string
    progress: number
    status: string
  }>
}

interface AnalyticsApiResponse {
  students?: StudentAnalytics[]
  users?: StudentAnalytics[]
}

export default function StudentPerformancePage() {
  const { user } = useAuth()
  const [students, setStudents] = React.useState<StudentAnalytics[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedStudent, setSelectedStudent] =
    React.useState<StudentAnalytics | null>(null)

  React.useEffect(() => {
    async function loadData() {
      if (!user) return
      setIsLoading(true)
      try {
        const result = await apiGet<AnalyticsApiResponse>(
          "/instructors/students"
        )
        if (result.error) throw new Error(result.error)
        setStudents(result.data?.students ?? [])
      } catch (error) {
        console.error("Failed to load student analytics:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [user])

  const filteredStudents = React.useMemo(() => {
    if (!searchQuery) return students
    const q = searchQuery.toLowerCase()
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    )
  }, [students, searchQuery])

  const totalStudents = students.length
  const avgProgressAll =
    totalStudents > 0
      ? Math.round(
          students.reduce((sum, s) => sum + s.avgProgress, 0) / totalStudents
        )
      : 0

  const header = (
    <PageHeader
      title="Student Performance"
      description="View enrollment and progress data for students in your courses"
    />
  )

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        {header}
        <div className="grid gap-4 md:grid-cols-3">
          <LoadingCard count={3} />
        </div>
        <LoadingCard />
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {header}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <div className="text-2xl font-semibold">{totalStudents}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="size-5 text-info" />
              <div className="text-2xl font-semibold">
                {totalStudents > 0
                  ? (
                      students.reduce((sum, s) => sum + s.enrolledCount, 0) /
                      totalStudents
                    ).toFixed(1)
                  : "0"}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-success" />
              <div className="text-2xl font-semibold">{avgProgressAll}%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <InputGroup className="h-9 max-w-sm min-w-0 flex-1">
            <InputGroupInput
              type="search"
              placeholder="Search students by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </CardHeader>
        <CardContent>
          {filteredStudents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Enrolled Courses</TableHead>
                  <TableHead>Avg Progress</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow
                    key={student.userId}
                    className="cursor-pointer"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs">
                            {student.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {student.fullName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{student.enrolledCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={student.avgProgress}
                          className="h-2 w-16"
                        />
                        <span className="text-sm">{student.avgProgress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {student.completedCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedStudent(student)
                        }}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>
                  {searchQuery
                    ? "No students found"
                    : "No student data available"}
                </EmptyTitle>
                <EmptyDescription>
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "Students will appear here once they enroll in your courses."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={selectedStudent !== null}
        onOpenChange={(open) => !open && setSelectedStudent(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="size-8">
                <AvatarFallback>
                  {selectedStudent?.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p>{selectedStudent?.fullName}</p>
                <p className="text-sm font-normal text-muted-foreground">
                  {selectedStudent?.email}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Enrolled
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-semibold">
                    {selectedStudent?.enrolledCount}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Avg Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-semibold">
                    {selectedStudent?.avgProgress}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-semibold">
                    {selectedStudent?.completedCount}
                  </div>
                </CardContent>
              </Card>
            </div>
            {(selectedStudent?.courses?.length ?? 0) > 0 ? (
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-medium">Course Progress</h4>
                {selectedStudent?.courses.map((course) => (
                  <div
                    key={course.courseId}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {course.courseTitle}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Progress
                          value={course.progress}
                          className="h-2 w-24"
                        />
                        <span className="text-xs text-muted-foreground">
                          {course.progress}%
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-3 shrink-0">
                      {course.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Not enrolled in any courses.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
