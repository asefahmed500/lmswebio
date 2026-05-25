import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  version: string
  checks: {
    database: {
      status: 'pass' | 'fail'
      latency?: number
    }
    memory: {
      status: 'pass' | 'warn' | 'fail'
      used: number
      total: number
      percentage: number
    }
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const checks: HealthStatus['checks'] = {
    database: { status: 'pass' },
    memory: {
      status: 'pass',
      used: 0,
      total: 0,
      percentage: 0,
    },
  }

  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'

  // Check database connection
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - dbStart
    checks.database = {
      status: 'pass',
      latency: dbLatency,
    }

    if (dbLatency > 1000) {
      overallStatus = 'degraded'
    }
  } catch (error) {
    checks.database = { status: 'fail' }
    overallStatus = 'unhealthy'
  }

  // Check memory usage
  const memUsage = process.memoryUsage()
  const totalMem = memUsage.heapTotal
  const usedMem = memUsage.heapUsed
  const memPercentage = (usedMem / totalMem) * 100

  checks.memory = {
    status: memPercentage > 90 ? 'fail' : memPercentage > 75 ? 'warn' : 'pass',
    used: usedMem,
    total: totalMem,
    percentage: Math.round(memPercentage * 100) / 100,
  }

  if (checks.memory.status === 'fail') {
    overallStatus = 'unhealthy'
  } else if (checks.memory.status === 'warn' && overallStatus === 'healthy') {
    overallStatus = 'degraded'
  }

  const response: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '0.0.1',
    checks,
  }

  const statusCode = overallStatus === 'unhealthy' ? 503 : overallStatus === 'degraded' ? 200 : 200

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
