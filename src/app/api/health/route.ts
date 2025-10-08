import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // Simple connectivity check
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}