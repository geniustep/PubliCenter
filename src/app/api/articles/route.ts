import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { asyncHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/articles
 * Get all articles with pagination
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const status = searchParams.get('status') || undefined;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
    where.status = status;
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
        template: true,
        images: true,
        translations: true,
        _count: {
          select: {
            translations: true,
          },
        },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: articles,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});
