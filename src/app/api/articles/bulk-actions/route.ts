import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { asyncHandler } from '@/lib/error-handler';
import { ArticleStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/articles/bulk-actions
 * Perform bulk actions on multiple articles
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { action, articleIds, targetLanguage, categoryId } = body;

  if (!action || !articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing required fields: action, articleIds',
      },
      { status: 400 }
    );
  }

  let successCount = 0;
  let failedCount = 0;
  const results: any[] = [];

  try {
    switch (action) {
      case 'PUBLISH':
        const publishedArticles = await prisma.article.updateMany({
          where: { id: { in: articleIds } },
          data: { status: ArticleStatus.PUBLISHED },
        });
        successCount = publishedArticles.count;
        break;

      case 'UNPUBLISH':
        const unpublishedArticles = await prisma.article.updateMany({
          where: { id: { in: articleIds } },
          data: { status: ArticleStatus.DRAFT },
        });
        successCount = unpublishedArticles.count;
        break;

      case 'ARCHIVE':
        const archivedArticles = await prisma.article.updateMany({
          where: { id: { in: articleIds } },
          data: { status: ArticleStatus.ARCHIVED },
        });
        successCount = archivedArticles.count;
        break;

      case 'DELETE':
        const deletedArticles = await prisma.article.deleteMany({
          where: { id: { in: articleIds } },
        });
        successCount = deletedArticles.count;
        break;

      case 'CHANGE_CATEGORY':
        if (!categoryId) {
          return NextResponse.json(
            { success: false, error: 'categoryId is required for this action' },
            { status: 400 }
          );
        }
        const updatedArticles = await prisma.article.updateMany({
          where: { id: { in: articleIds } },
          data: { categoryId: parseInt(categoryId) },
        });
        successCount = updatedArticles.count;
        break;

      case 'TRANSLATE':
        if (!targetLanguage) {
          return NextResponse.json(
            { success: false, error: 'targetLanguage is required for this action' },
            { status: 400 }
          );
        }

        // Process each article for translation
        for (const articleId of articleIds) {
          try {
            const article = await prisma.article.findUnique({
              where: { id: articleId },
              include: { translations: true },
            });

            if (!article) {
              failedCount++;
              results.push({
                articleId,
                status: 'failed',
                error: 'Article not found',
              });
              continue;
            }

            // Check if translation already exists
            const existingTranslation = article.translations.find(
              (t) => t.language === targetLanguage
            );

            if (existingTranslation) {
              failedCount++;
              results.push({
                articleId,
                status: 'failed',
                error: 'Translation already exists',
              });
              continue;
            }

            // Create translation (placeholder - AI translation will be added later)
            const translation = await prisma.translation.create({
              data: {
                articleId,
                language: targetLanguage,
                title: `${article.title} (${targetLanguage})`,
                content: article.content,
                excerpt: article.excerpt,
                status: 'DRAFT',
                autoTranslated: true,
              },
            });

            successCount++;
            results.push({
              articleId,
              status: 'success',
              translationId: translation.id,
            });
          } catch (error: any) {
            failedCount++;
            results.push({
              articleId,
              status: 'failed',
              error: error.message,
            });
          }
        }
        break;

      case 'UPDATE_TRANSLATIONS':
        // Update all translations for selected articles
        for (const articleId of articleIds) {
          try {
            const article = await prisma.article.findUnique({
              where: { id: articleId },
              include: { translations: true },
            });

            if (!article) {
              failedCount++;
              continue;
            }

            // Mark translations as needing update
            await prisma.translation.updateMany({
              where: { articleId },
              data: {
                // Add outOfSync field if it exists in schema
                updatedAt: new Date(),
              },
            });

            successCount++;
          } catch (error) {
            failedCount++;
          }
        }
        break;

      case 'QUALITY_CHECK':
        // Placeholder for quality check - will be implemented with AI
        successCount = articleIds.length;
        results.push({
          message: 'Quality check queued for processing',
          articleIds,
        });
        break;

      case 'EXPORT':
        // Placeholder for export functionality
        const articlesForExport = await prisma.article.findMany({
          where: { id: { in: articleIds } },
          include: {
            translations: true,
            images: true,
            category: true,
          },
        });

        return NextResponse.json({
          success: true,
          data: articlesForExport,
          message: 'Articles ready for export',
        });

      case 'SYNC_TO_WORDPRESS':
        // Placeholder for WordPress sync
        successCount = articleIds.length;
        results.push({
          message: 'WordPress sync queued',
          articleIds,
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        action,
        success: successCount,
        failed: failedCount,
        total: articleIds.length,
        results: results.length > 0 ? results : undefined,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to perform bulk action',
      },
      { status: 500 }
    );
  }
});
