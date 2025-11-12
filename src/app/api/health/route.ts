import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { testConnection as testWordPress } from '@/lib/wordpress';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Health check endpoint
 */
export async function GET() {
  const checks = {
    database: 'unknown',
    wordpress: 'unknown',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  };

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'connected';
  } catch (error) {
    checks.database = 'disconnected';
  }

  // Check WordPress connection
  try {
    const wpConnected = await testWordPress();
    checks.wordpress = wpConnected ? 'reachable' : 'unreachable';
  } catch (error) {
    checks.wordpress = 'unreachable';
  }

  // Determine overall status
  const allHealthy = checks.database === 'connected' && checks.wordpress === 'reachable';

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
