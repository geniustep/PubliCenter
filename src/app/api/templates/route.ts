import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { asyncHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/templates
 * Get all active templates
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  const templates = await prisma.template.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: 'asc',
    },
  });

  return NextResponse.json({
    success: true,
    data: templates,
    count: templates.length,
  });
});
