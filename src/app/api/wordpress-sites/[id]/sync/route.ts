import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/error-handler';
import { createPluginDetector } from '@/lib/wordpress-plugin-detector';
import { hasPermission } from '@/lib/rbac';
import { Language, SyncStatus, TranslationPlugin } from '@/types/api';
import { logger } from '@/lib/logger';
import { decrypt } from '@/lib/encryption';

/**
 * POST /api/wordpress-sites/[id]/sync
 * Sync articles from WordPress site
 */
export const POST = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions
    if (!hasPermission(session.user.role, 'articles', 'create')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const siteId = parseInt(params.id);
    const body = await request.json();
    const { appPassword: providedPassword, syncMode = 'incremental', languages = [] } = body;

    const site = await prisma.wordPressSite.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return NextResponse.json(
        { success: false, error: 'WordPress site not found' },
        { status: 404 }
      );
    }

    // Use provided password or decrypt stored password
    let appPassword: string;
    if (providedPassword && providedPassword.trim() !== '') {
      appPassword = providedPassword;
    } else if (site.appPassword) {
      try {
        appPassword = decrypt(site.appPassword);
      } catch (error) {
        // If decryption fails, it might be an old hashed password
        // In that case, require the user to provide the password
        return NextResponse.json(
          {
            success: false,
            error: 'App password required',
            details: 'Please provide the app password. The stored password cannot be used.',
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'App password required',
          details: 'No app password stored. Please provide the app password.',
        },
        { status: 400 }
      );
    }

    // Update sync status to SYNCING
    await prisma.wordPressSite.update({
      where: { id: siteId },
      data: {
        lastSyncStatus: SyncStatus.SYNCING,
        lastSyncError: null,
      },
    });

    try {
      const detector = createPluginDetector(site.url, site.username, appPassword);

      let articlesFound = 0;
      let articlesSynced = 0;
      let articlesSkipped = 0;
      const errors: string[] = [];

      // Determine which languages to sync
      const languagesToSync =
        languages.length > 0 ? languages : (site.supportedLanguages as string[]) || [];

      logger.info('Starting WordPress sync', {
        siteId,
        siteName: site.name,
        syncMode,
        languages: languagesToSync,
      });

      // Sync for each language
      for (const lang of languagesToSync) {
        try {
          // Get posts for this language
          const posts = await detector.getPostsByLanguage(
            site.translationPlugin as TranslationPlugin,
            lang,
            1,
            100 // Get first 100 posts
          );

          articlesFound += posts.length;

          for (const post of posts) {
            try {
              // Check if this post was already synced
              const existingTranslation = await prisma.translation.findFirst({
                where: {
                  wordPressSiteId: siteId,
                  wordpressPostId: post.id,
                },
              });

              if (existingTranslation && syncMode === 'incremental') {
                // Skip if already synced in incremental mode
                articlesSkipped++;
                continue;
              }

              // Map WordPress language code to our Language enum
              const mappedLanguage = mapWordPressLanguageToEnum(lang);
              if (!mappedLanguage) {
                errors.push(`Unknown language code: ${lang}`);
                continue;
              }

              if (existingTranslation) {
                // Update existing translation
                await prisma.translation.update({
                  where: { id: existingTranslation.id },
                  data: {
                    title: post.title.rendered || post.title,
                    content: post.content.rendered || post.content,
                    excerpt: post.excerpt?.rendered || post.excerpt || null,
                    slug: post.slug,
                    wordpressUrl: post.link,
                    syncedFromWp: true,
                    syncedFromWpAt: new Date(),
                    updatedAt: new Date(),
                  },
                });
                articlesSynced++;
              } else {
                // Create new article and translation
                // First, try to find the source article or create one
                let article;

                // Try to find existing article by WordPress post ID
                const existingArticle = await prisma.article.findFirst({
                  where: {
                    translations: {
                      some: {
                        wordpressPostId: post.id,
                      },
                    },
                  },
                });

                if (existingArticle) {
                  article = existingArticle;
                } else {
                  // Get or create default template
                  let defaultTemplate = await prisma.template.findFirst({
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                  });

                  if (!defaultTemplate) {
                    // Create a default template if none exists
                    defaultTemplate = await prisma.template.create({
                      data: {
                        name: 'Default Template',
                        nameAr: 'قالب افتراضي',
                        nameEn: 'Default Template',
                        nameFr: 'Modèle par défaut',
                        nameEs: 'Plantilla predeterminada',
                        slug: 'default-template',
                        description: 'Default template for synced WordPress articles',
                        descriptionAr: 'قالب افتراضي للمقالات المزامنة من WordPress',
                        descriptionEn: 'Default template for synced WordPress articles',
                        descriptionFr: 'Modèle par défaut pour les articles synchronisés depuis WordPress',
                        descriptionEs: 'Plantilla predeterminada para artículos sincronizados de WordPress',
                        layoutType: 'SINGLE_COLUMN',
                        isActive: true,
                        sortOrder: 0,
                      },
                    });
                  }

                  // Create new article
                  article = await prisma.article.create({
                    data: {
                      title: post.title.rendered || post.title,
                      content: post.content.rendered || post.content,
                      excerpt: post.excerpt?.rendered || post.excerpt || null,
                      sourceLanguage: mappedLanguage,
                      status: post.status === 'publish' ? 'PUBLISHED' : 'DRAFT',
                      authorId: session.user.id,
                      templateId: defaultTemplate.id,
                      publishedAt: post.status === 'publish' ? new Date() : null,
                    },
                  });
                }

                // Create translation
                await prisma.translation.create({
                  data: {
                    articleId: article.id,
                    language: mappedLanguage,
                    title: post.title.rendered || post.title,
                    content: post.content.rendered || post.content,
                    excerpt: post.excerpt?.rendered || post.excerpt || null,
                    slug: post.slug,
                    wordPressSiteId: siteId,
                    wordpressPostId: post.id,
                    wordpressUrl: post.link,
                    syncedFromWp: true,
                    syncedFromWpAt: new Date(),
                    status: 'PUBLISHED',
                  },
                });

                articlesSynced++;
              }
            } catch (postError) {
              logger.error('Failed to sync post', {
                postId: post.id,
                error: postError instanceof Error ? postError.message : 'Unknown error',
              });
              errors.push(
                `Post ${post.id}: ${postError instanceof Error ? postError.message : 'Unknown error'}`
              );
            }
          }
        } catch (langError) {
          logger.error('Failed to sync language', {
            language: lang,
            error: langError instanceof Error ? langError.message : 'Unknown error',
          });
          errors.push(
            `Language ${lang}: ${langError instanceof Error ? langError.message : 'Unknown error'}`
          );
        }
      }

      // Update site with sync results
      const syncStatus =
        errors.length === 0
          ? SyncStatus.SUCCESS
          : articlesSynced > 0
            ? SyncStatus.PARTIAL
            : SyncStatus.FAILED;

      const updatedSite = await prisma.wordPressSite.update({
        where: { id: siteId },
        data: {
          lastSync: new Date(),
          lastSyncStatus: syncStatus,
          lastSyncError: errors.length > 0 ? errors.join('; ') : null,
          totalArticles: articlesFound,
          syncedArticles: articlesSynced,
        },
        include: {
          _count: {
            select: { translations: true },
          },
        },
      });

      logger.info('WordPress sync completed', {
        siteId,
        articlesFound,
        articlesSynced,
        articlesSkipped,
        errorsCount: errors.length,
      });

      return NextResponse.json({
        success: true,
        data: {
          site: {
            ...updatedSite,
            appPassword: undefined,
          },
          articlesFound,
          articlesSynced,
          articlesSkipped,
          errors,
          message: `Sync completed: ${articlesSynced} articles synced, ${articlesSkipped} skipped`,
        },
      });
    } catch (error) {
      logger.error('WordPress sync failed', {
        siteId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Update site with failure status
      await prisma.wordPressSite.update({
        where: { id: siteId },
        data: {
          lastSync: new Date(),
          lastSyncStatus: SyncStatus.FAILED,
          lastSyncError: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Sync failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
);

/**
 * Map WordPress language code to our Language enum
 */
function mapWordPressLanguageToEnum(wpLang: string): Language | null {
  // Normalize the language code (lowercase and handle common variations)
  const normalized = wpLang.toLowerCase().trim();
  
  const mapping: Record<string, Language> = {
    // Arabic variations
    ar: Language.AR,
    'ar_ar': Language.AR,
    'ar-sa': Language.AR,
    'ar_SA': Language.AR,
    // English variations
    en: Language.EN,
    'en_us': Language.EN,
    'en_gb': Language.EN,
    'en-gb': Language.EN,
    // French variations
    fr: Language.FR,
    'fr_fr': Language.FR,
    'fr-FR': Language.FR,
    // Spanish variations
    es: Language.ES,
    'es_es': Language.ES,
    'es-ES': Language.ES,
  };

  // Try exact match first
  if (mapping[normalized]) {
    return mapping[normalized];
  }

  // Try matching first 2 characters (e.g., 'ar' from 'ar_AR' or 'AR')
  const twoChar = normalized.substring(0, 2);
  if (mapping[twoChar]) {
    return mapping[twoChar];
  }

  // Try uppercase version (in case it's already uppercase like 'AR')
  const upperNormalized = wpLang.toUpperCase().trim();
  if (upperNormalized === 'AR') return Language.AR;
  if (upperNormalized === 'EN') return Language.EN;
  if (upperNormalized === 'FR') return Language.FR;
  if (upperNormalized === 'ES') return Language.ES;

  return null;
}
