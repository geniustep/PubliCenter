import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { translateText, type SupportedLanguage } from '@/lib/translator';
import { createWordPressClient } from '@/lib/wordpress';
import { publishRateLimit } from '@/lib/rate-limiter';
import { asyncHandler, ValidationError, NotFoundError } from '@/lib/error-handler';
import { sanitizeHtml } from '@/lib/sanitize';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface PublishRequestBody {
  sourceLanguage: SupportedLanguage;
  targetLanguages: SupportedLanguage[];
  title: string;
  content: string;
  excerpt?: string;
  templateId: number;
  categoryId?: number;
  images?: {
    url: string;
    alt?: string;
    caption?: string;
  }[];
  authorId: string;
}

/**
 * POST /api/publish
 * Publish article in multiple languages to WordPress
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  // Apply rate limiting
  const rateLimitResponse = await publishRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Parse request body
  const body: PublishRequestBody = await request.json();

  // Validate request
  if (!body.title || !body.content) {
    throw new ValidationError('Title and content are required');
  }

  if (!body.sourceLanguage || !['ar', 'en', 'fr', 'es'].includes(body.sourceLanguage)) {
    throw new ValidationError('Valid source language is required');
  }

  if (!body.targetLanguages || !Array.isArray(body.targetLanguages) || body.targetLanguages.length === 0) {
    throw new ValidationError('At least one target language is required');
  }

  if (!body.templateId) {
    throw new ValidationError('Template ID is required');
  }

  if (!body.authorId) {
    throw new ValidationError('Author ID is required');
  }

  // Verify template exists
  const template = await prisma.template.findUnique({
    where: { id: body.templateId },
  });

  if (!template) {
    throw new NotFoundError('Template not found');
  }

  // Sanitize content
  const sanitizedContent = sanitizeHtml(body.content);

  // Create article
  const article = await prisma.article.create({
    data: {
      title: body.title,
      content: sanitizedContent,
      excerpt: body.excerpt,
      sourceLanguage: body.sourceLanguage.toUpperCase() as any,
      status: 'DRAFT',
      authorId: body.authorId,
      templateId: body.templateId,
      categoryId: body.categoryId,
      images: {
        create: body.images?.map((img, index) => ({
          url: img.url,
          alt: img.alt,
          caption: img.caption,
          sortOrder: index,
        })) || [],
      },
    },
    include: {
      images: true,
      template: true,
      category: true,
    },
  });

  logger.info('Article created', { articleId: article.id, title: article.title });

  // Translate and publish to each target language
  const translations = [];
  const wpClient = createWordPressClient();

  for (const targetLang of body.targetLanguages) {
    try {
      // Translate title
      const translatedTitle = await translateText({
        text: body.title,
        sourceLang: body.sourceLanguage,
        targetLang,
      });

      // Translate content
      const translatedContent = await translateText({
        text: sanitizedContent,
        sourceLang: body.sourceLanguage,
        targetLang,
      });

      // Translate excerpt if provided
      let translatedExcerpt = undefined;
      if (body.excerpt) {
        const excerptResult = await translateText({
          text: body.excerpt,
          sourceLang: body.sourceLanguage,
          targetLang,
        });
        translatedExcerpt = excerptResult.translatedText;
      }

      // Create translation record
      const translation = await prisma.translation.create({
        data: {
          articleId: article.id,
          language: targetLang.toUpperCase() as any,
          title: translatedTitle.translatedText,
          content: translatedContent.translatedText,
          excerpt: translatedExcerpt,
          slug: `${article.id}-${targetLang}`,
          status: 'TRANSLATING',
        },
      });

      logger.info('Translation created', {
        articleId: article.id,
        language: targetLang,
        translationId: translation.id,
      });

      // Publish to WordPress
      try {
        const wpPost = await wpClient.createPost({
          title: translatedTitle.translatedText,
          content: translatedContent.translatedText,
          excerpt: translatedExcerpt,
          status: 'publish',
          lang: targetLang,
        });

        // Update translation with WordPress data
        await prisma.translation.update({
          where: { id: translation.id },
          data: {
            wordpressPostId: wpPost.id,
            wordpressUrl: wpPost.link,
            publishedToWp: true,
            publishedToWpAt: new Date(),
            status: 'PUBLISHED',
            translatedAt: new Date(),
          },
        });

        logger.info('Published to WordPress', {
          articleId: article.id,
          language: targetLang,
          wordpressPostId: wpPost.id,
        });

        translations.push({
          language: targetLang,
          translationId: translation.id,
          wordpressPostId: wpPost.id,
          wordpressUrl: wpPost.link,
          status: 'PUBLISHED',
        });
      } catch (wpError) {
        // Update translation status to failed
        await prisma.translation.update({
          where: { id: translation.id },
          data: {
            status: 'FAILED',
          },
        });

        logger.error('Failed to publish to WordPress', {
          articleId: article.id,
          language: targetLang,
          error: wpError instanceof Error ? wpError.message : 'Unknown error',
        });

        translations.push({
          language: targetLang,
          translationId: translation.id,
          status: 'FAILED',
          error: wpError instanceof Error ? wpError.message : 'Failed to publish',
        });
      }
    } catch (error) {
      logger.error('Translation failed', {
        articleId: article.id,
        language: targetLang,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      translations.push({
        language: targetLang,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Translation failed',
      });
    }
  }

  // Update article status to PUBLISHED if at least one translation succeeded
  const hasSuccessfulTranslation = translations.some((t) => t.status === 'PUBLISHED');
  if (hasSuccessfulTranslation) {
    await prisma.article.update({
      where: { id: article.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      articleId: article.id,
      title: article.title,
      sourceLanguage: body.sourceLanguage,
      translations,
      status: hasSuccessfulTranslation ? 'PUBLISHED' : 'FAILED',
    },
  });
});
