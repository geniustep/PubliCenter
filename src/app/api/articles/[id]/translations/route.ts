import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { asyncHandler } from '@/lib/error-handler';
import { TranslationStatus } from '@/types/api';

export const dynamic = 'force-dynamic';

// Initialize Anthropic client (optional - only if package is installed)
// Note: @anthropic-ai/sdk is optional. If not installed, AI translation will be disabled.
// AI translation code is currently commented out until the package is installed

/**
 * POST /api/articles/[id]/translations
 * Generate a new translation using AI
 */
export const POST = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const articleId = parseInt(params.id);

    if (isNaN(articleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid article ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { targetLanguage, useAI = true } = body;

    if (!targetLanguage) {
      return NextResponse.json(
        { success: false, error: 'targetLanguage is required' },
        { status: 400 }
      );
    }

    // Fetch the article
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        translations: true,
        category: {
          select: {
            name: true,
            slug: true,
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

    // Check if translation already exists
    const existingTranslation = article.translations.find(
      (t) => t.language === targetLanguage
    );

    if (existingTranslation) {
      return NextResponse.json(
        {
          success: false,
          error: `Translation to ${targetLanguage} already exists`,
        },
        { status: 409 }
      );
    }

    let translatedTitle = article.title;
    let translatedContent = article.content || '';
    let translatedExcerpt = article.excerpt || '';

    // Use AI translation if enabled and API key is available
    // Note: AI translation requires @anthropic-ai/sdk package to be installed
    if (useAI) {
      // For now, AI translation is disabled until @anthropic-ai/sdk is installed
      // TODO: Install @anthropic-ai/sdk and uncomment the AI translation code
      console.warn('AI translation is currently disabled. Install @anthropic-ai/sdk to enable.');
    }

    // AI translation code (commented out until package is installed)
    /*
    if (useAI && process.env.ANTHROPIC_API_KEY) {
      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      } catch (error) {
        console.warn('@anthropic-ai/sdk not installed, AI translation disabled');
      }
    }

    if (useAI && anthropic) {
      try {
        const languageNames: Record<string, string> = {
          AR: 'Arabic',
          EN: 'English',
          FR: 'French',
        };

        const targetLangName = languageNames[targetLanguage] || targetLanguage;
        const sourceLangName = languageNames[article.sourceLanguage] || article.sourceLanguage;

        // Create translation prompt
        const prompt = `You are a professional translator specializing in ${targetLangName} translations.

Translate the following article from ${sourceLangName} to ${targetLangName}.
Maintain the tone, style, and cultural nuances. The translation should be natural and engaging for native ${targetLangName} speakers.

Article Title: ${article.title}

Article Content:
${article.content || ''}

${article.excerpt ? `Excerpt: ${article.excerpt}` : ''}

Category: ${article.category?.name || 'General'}

Please provide:
1. Translated title
2. Translated content (preserve any HTML tags and formatting)
3. Translated excerpt
4. SEO-optimized meta description (max 160 characters)
5. 5-10 relevant keywords in ${targetLangName}

Format your response as JSON with the following structure:
{
  "title": "translated title",
  "content": "translated content",
  "excerpt": "translated excerpt",
  "metaDescription": "SEO meta description",
  "keywords": ["keyword1", "keyword2", ...]
}`;

        const message = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        // Parse AI response
        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const translationData = JSON.parse(jsonMatch[0]);
          translatedTitle = translationData.title || article.title;
          translatedContent = translationData.content || article.content || '';
          translatedExcerpt = translationData.excerpt || article.excerpt || '';
          seoMetadata = {
            metaDescription: translationData.metaDescription,
            keywords: translationData.keywords,
          };
        }
      } catch (aiError: any) {
        console.error('AI Translation Error:', aiError);
        // Fall back to simple copy if AI fails
        // Don't return error, just proceed with non-AI translation
      }
    }
    */

    // Create the translation
    const translation = await prisma.translation.create({
      data: {
        articleId,
        language: targetLanguage,
        title: translatedTitle,
        content: translatedContent,
        excerpt: translatedExcerpt,
        slug: `${articleId}-${targetLanguage.toLowerCase()}-${Date.now()}`,
        status: TranslationStatus.PENDING,
      },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            sourceLanguage: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: translation,
      message: useAI
        ? 'Translation generated successfully using AI'
        : 'Translation created successfully',
    }, { status: 201 });
  }
);

/**
 * GET /api/articles/[id]/translations
 * Get all translations for an article
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

    const translations = await prisma.translation.findMany({
      where: { articleId },
      include: {
        wordPressSite: {
          select: {
            id: true,
            name: true,
            url: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: translations,
    });
  }
);
