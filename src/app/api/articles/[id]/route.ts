import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { asyncHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/articles/[id]
 * Get a single article by ID
 */
export const GET = asyncHandler(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    const articleId = parseInt(params.id);

    if (isNaN(articleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid article ID' },
        { status: 400 }
      );
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        category: true,
        template: true,
        images: {
          orderBy: { createdAt: 'asc' },
        },
        translations: {
          include: {
            wordPressSite: {
              select: {
                id: true,
                name: true,
                url: true,
              },
            },
          },
        },
        _count: {
          select: {
            translations: true,
            images: true,
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: article,
    });
  }
);

/**
 * PUT /api/articles/[id]
 * Update an article
 */
export const PUT = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const articleId = parseInt(params.id);

    if (isNaN(articleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid article ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, content, excerpt, status, categoryId, templateId } = body;

    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // Update article
    const article = await prisma.article.update({
      where: { id: articleId },
      data: {
        ...(title && { title }),
        ...(content !== undefined && { content }),
        ...(excerpt !== undefined && { excerpt }),
        ...(status && { status }),
        ...(categoryId !== undefined && {
          categoryId: categoryId ? parseInt(categoryId) : null
        }),
        ...(templateId !== undefined && {
          templateId: templateId ? parseInt(templateId) : null
        }),
        updatedAt: new Date(),
      },
      include: {
        author: true,
        category: true,
        template: true,
        images: true,
        translations: true,
        _count: {
          select: {
            translations: true,
            images: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: article,
    });
  }
);

/**
 * DELETE /api/articles/[id]
 * Delete an article
 */
export const DELETE = asyncHandler(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    const articleId = parseInt(params.id);

    if (isNaN(articleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid article ID' },
        { status: 400 }
      );
    }

    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        _count: {
          select: {
            translations: true,
            images: true,
          },
        },
      },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // Delete article (cascade will delete related translations and images)
    await prisma.article.delete({
      where: { id: articleId },
    });

    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully',
      data: {
        id: articleId,
        deletedTranslations: existingArticle._count.translations,
        deletedImages: existingArticle._count.images,
      },
    });
  }
);
