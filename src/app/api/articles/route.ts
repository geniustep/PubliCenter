import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { asyncHandler } from '@/lib/error-handler';
import { Prisma, ArticleStatus, Language } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/articles
 * Get all articles with advanced filtering
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const skip = (page - 1) * limit;

  // Filters
  const search = searchParams.get('search');
  const sourceLanguage = searchParams.get('sourceLanguage');
  const categoryId = searchParams.get('categoryId');
  const templateId = searchParams.get('templateId');
  const authorId = searchParams.get('authorId');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const hasImages = searchParams.get('hasImages');
  const sortBy = searchParams.get('sortBy') || 'DATE_DESC';
  const status = searchParams.get('status')?.split(',') as ArticleStatus[] | undefined;

  // Build where clause
  const where: Prisma.ArticleWhereInput = {};

  // Text search
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Status filter
  if (status && status.length > 0) {
    where.status = { in: status };
  }

  // Source language
  if (sourceLanguage) {
    where.sourceLanguage = sourceLanguage as Language;
  }

  // Category filter
  if (categoryId) {
    where.categoryId = parseInt(categoryId);
  }

  // Template filter
  if (templateId) {
    where.templateId = parseInt(templateId);
  }

  // Author filter
  if (authorId) {
    where.authorId = authorId;
  }

  // Date range
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  // Has images filter
  if (hasImages === 'true') {
    where.images = { some: {} };
  }

  // Build order by
  let orderBy: Prisma.ArticleOrderByWithRelationInput = { createdAt: 'desc' };

  switch (sortBy) {
    case 'DATE_ASC':
      orderBy = { createdAt: 'asc' };
      break;
    case 'TITLE_AZ':
      orderBy = { title: 'asc' };
      break;
    case 'TITLE_ZA':
      orderBy = { title: 'desc' };
      break;
    case 'DATE_DESC':
    default:
      orderBy = { createdAt: 'desc' };
      break;
  }

  // Fetch articles
  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          orderBy: { createdAt: 'asc' },
          take: 1,
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
    }),
    prisma.article.count({ where }),
  ]);

  // Transform to EnhancedArticle format
  const enhancedArticles = articles.map((article) => {
    // Calculate translation progress
    const allLanguages: Language[] = [Language.AR, Language.EN, Language.FR];
    const translatedLanguages = article.translations.map((t) => t.language);
    const missingLanguages = allLanguages.filter(
      (lang) => lang !== article.sourceLanguage && !translatedLanguages.includes(lang)
    );

    const completeness: Record<string, number> = {};
    allLanguages.forEach((lang) => {
      if (lang === article.sourceLanguage) {
        completeness[lang] = 100;
      } else {
        const translation = article.translations.find((t) => t.language === lang);
        completeness[lang] = translation ? 100 : 0;
      }
    });

    const totalLanguages = allLanguages.length;
    const completedLanguages = translatedLanguages.length + 1; // +1 for source
    const overallProgress = Math.round((completedLanguages / totalLanguages) * 100);

    // Mock analytics data (you can replace with real data)
    const analytics = {
      views: Math.floor(Math.random() * 1000),
      shares: Math.floor(Math.random() * 50),
      comments: Math.floor(Math.random() * 20),
      likes: Math.floor(Math.random() * 100),
      readingTime: Math.ceil((article.content?.length || 0) / 1000), // Rough estimate
      engagement: Math.floor(Math.random() * 100),
      viewsByLanguage: {
        AR: Math.floor(Math.random() * 300),
        EN: Math.floor(Math.random() * 400),
        FR: Math.floor(Math.random() * 300),
      },
      trending: false,
      trendingScore: 0,
    };

    // Enhanced translations
    const enhancedTranslations = article.translations.map((translation) => ({
      ...translation,
      needsReview: false,
      hasChanges: false,
      isAutoTranslated: false, // autoTranslated field removed from schema
      wordCount: translation.content ? translation.content.split(/\s+/).length : 0,
      characterCount: translation.content?.length || 0,
      readingTime: Math.ceil((translation.content?.length || 0) / 1000),
    }));

    return {
      ...article,
      translationProgress: {
        overall: overallProgress,
        quality: 85, // Mock quality score
        completeness,
        missingLanguages,
        needsReview: [],
        outOfSync: [],
      },
      analytics,
      enhancedTranslations,
      primaryImage: article.images[0] || null,
      tags: [], // Add tags when available
      collaborators: [], // Add collaborators when available
    };
  });

  return NextResponse.json({
    success: true,
    data: enhancedArticles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * POST /api/articles
 * Create a new article
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  const body = await request.json();

  const {
    title,
    content,
    excerpt,
    sourceLanguage,
    status = 'DRAFT',
    categoryId,
    templateId,
    authorId,
  } = body;

  // Validation
  if (!title || !sourceLanguage || !authorId) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing required fields: title, sourceLanguage, authorId',
      },
      { status: 400 }
    );
  }

  // Create article
  const article = await prisma.article.create({
    data: {
      title,
      content,
      excerpt,
      sourceLanguage,
      status,
      ...(categoryId && { categoryId: parseInt(categoryId) }),
      ...(templateId && { templateId: parseInt(templateId) }),
      authorId,
    },
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
  }, { status: 201 });
});
