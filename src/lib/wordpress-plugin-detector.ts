import axios, { AxiosInstance } from 'axios';
import { TranslationPlugin } from '@/types/api';
import { logger } from './logger';

interface PluginDetectionResult {
  plugin: TranslationPlugin;
  version: string | null;
  supportedLanguages: string[];
  settings: any;
}

/**
 * WordPress Translation Plugin Detector
 * يكتشف نوع بلوجن الترجمة المستخدم في موقع ووردبريس
 */
export class WordPressPluginDetector {
  private client: AxiosInstance;
  private siteUrl: string;

  constructor(siteUrl: string, username: string, appPassword: string) {
    this.siteUrl = siteUrl;
    this.client = axios.create({
      baseURL: `${siteUrl}/wp-json`,
      auth: {
        username,
        password: appPassword,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  /**
   * Detect which translation plugin is installed and active
   */
  async detectPlugin(): Promise<PluginDetectionResult> {
    try {
      logger.info('Starting plugin detection', { siteUrl: this.siteUrl });

      // Check for WPML first (most popular)
      const wpmlResult = await this.detectWPML();
      if (wpmlResult) return wpmlResult;

      // Check for Polylang
      const polylangResult = await this.detectPolylang();
      if (polylangResult) return polylangResult;

      // Check for TranslatePress
      const translatePressResult = await this.detectTranslatePress();
      if (translatePressResult) return translatePressResult;

      // Check for Weglot
      const weglotResult = await this.detectWeglot();
      if (weglotResult) return weglotResult;

      // Check for Loco Translate
      const locoResult = await this.detectLocoTranslate();
      if (locoResult) return locoResult;

      // Check for qTranslate-XT
      const qtranslateResult = await this.detectQTranslateXT();
      if (qtranslateResult) return qtranslateResult;

      logger.info('No translation plugin detected', { siteUrl: this.siteUrl });

      return {
        plugin: TranslationPlugin.NONE,
        version: null,
        supportedLanguages: [],
        settings: {},
      };
    } catch (error) {
      logger.error('Plugin detection failed', {
        siteUrl: this.siteUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        plugin: TranslationPlugin.NONE,
        version: null,
        supportedLanguages: [],
        settings: {},
      };
    }
  }

  /**
   * Detect WPML (WPML Multilingual CMS)
   * API: /wpml/v1/languages
   */
  private async detectWPML(): Promise<PluginDetectionResult | null> {
    try {
      // Try WPML REST API endpoint
      const response = await this.client.get('/wpml/v1/languages');

      if (response.status === 200 && response.data) {
        const languages = Array.isArray(response.data)
          ? response.data.map((lang: any) => lang.code || lang.locale)
          : [];

        logger.info('WPML detected', { siteUrl: this.siteUrl, languages });

        return {
          plugin: TranslationPlugin.WPML,
          version: response.headers['x-wpml-version'] || null,
          supportedLanguages: languages,
          settings: {
            defaultLanguage: response.data.find((l: any) => l.default)?.code,
            languages: response.data,
          },
        };
      }
    } catch (error) {
      // WPML not found or not accessible
      logger.debug('WPML not detected', { siteUrl: this.siteUrl });
    }

    return null;
  }

  /**
   * Detect Polylang
   * API: Check for polylang parameter support in posts
   * Enhanced detection with multiple methods
   */
  private async detectPolylang(): Promise<PluginDetectionResult | null> {
    console.log('🔍 [Plugin Detector] Starting Polylang detection...');
    try {
      logger.debug('Attempting Polylang detection', { siteUrl: this.siteUrl });

      // Method 1: Check installed plugins list
      console.log('🔍 [Plugin Detector] Method 1: Checking plugins list via /wp/v2/plugins');
      try {
        const pluginsResponse = await this.client.get('/wp/v2/plugins');
        if (pluginsResponse.data && Array.isArray(pluginsResponse.data)) {
          const polylangPlugin = pluginsResponse.data.find((plugin: any) =>
            plugin.plugin?.includes('polylang') ||
            plugin.name?.toLowerCase().includes('polylang') ||
            plugin.textdomain === 'polylang'
          );

          if (polylangPlugin && polylangPlugin.status === 'active') {
            logger.info('Polylang detected via plugins list', {
              siteUrl: this.siteUrl,
              version: polylangPlugin.version
            });

            const languages = await this.getPolylangLanguages();
            return {
              plugin: TranslationPlugin.POLYLANG,
              version: polylangPlugin.version || null,
              supportedLanguages: languages,
              settings: {
                languageParameter: 'lang',
                detectionMethod: 'plugins-api',
              },
            };
          }
        }
      } catch (error) {
        logger.debug('Plugins API check failed', { error });
      }

      // Method 2: Check for language taxonomy
      console.log('🔍 [Plugin Detector] Method 2: Checking taxonomies via /wp/v2/taxonomies');
      try {
        const taxonomiesResponse = await this.client.get('/wp/v2/taxonomies');
        if (taxonomiesResponse.data &&
            (taxonomiesResponse.data.language || taxonomiesResponse.data.term_language)) {
          console.log('✅ [Plugin Detector] Polylang detected via taxonomies!');
          logger.info('Polylang detected via taxonomies', { siteUrl: this.siteUrl });

          const languages = await this.getPolylangLanguages();
          console.log('🌐 [Plugin Detector] Polylang languages found:', languages);
          return {
            plugin: TranslationPlugin.POLYLANG,
            version: null,
            supportedLanguages: languages,
            settings: {
              languageParameter: 'lang',
              detectionMethod: 'taxonomies',
            },
          };
        } else {
          console.log('❌ [Plugin Detector] Polylang taxonomies not found');
        }
      } catch (error) {
        console.log('❌ [Plugin Detector] Method 2 failed:', error instanceof Error ? error.message : 'Unknown error');
        logger.debug('Taxonomies check failed', { error });
      }

      // Method 3: Check posts with lang parameter
      console.log('🔍 [Plugin Detector] Method 3: Checking posts API with lang parameter');
      try {
        const response = await this.client.get('/wp/v2/posts', {
          params: { per_page: 1, lang: 'all' },
        });

        // Check if response headers contain polylang info or if lang parameter was accepted
        if (response.headers['x-polylang-version'] ||
            response.status === 200) {
          console.log('✅ [Plugin Detector] Posts API accepted lang parameter');

          const languages = await this.getPolylangLanguages();

          // If we got languages, Polylang is likely active
          if (languages.length > 0) {
            console.log('✅ [Plugin Detector] Polylang detected via posts API!', {
              languages,
              version: response.headers['x-polylang-version'] || null,
            });
            logger.info('Polylang detected via posts API', {
              siteUrl: this.siteUrl,
              languages
            });

            return {
              plugin: TranslationPlugin.POLYLANG,
              version: response.headers['x-polylang-version'] || null,
              supportedLanguages: languages,
              settings: {
                languageParameter: 'lang',
                detectionMethod: 'posts-api',
              },
            };
          } else {
            console.log('❌ [Plugin Detector] No languages found from posts API');
          }
        }
      } catch (error) {
        console.log('❌ [Plugin Detector] Method 3 failed:', error instanceof Error ? error.message : 'Unknown error');
        logger.debug('Posts API check failed', { error });
      }

      // Method 4: Check for Polylang REST API endpoints
      console.log('🔍 [Plugin Detector] Method 4: Checking Polylang REST API /pll/v1/languages');
      try {
        const polylangApiResponse = await this.client.get('/pll/v1/languages');
        if (polylangApiResponse.status === 200 && polylangApiResponse.data) {
          const languages = Array.isArray(polylangApiResponse.data)
            ? polylangApiResponse.data.map((lang: any) => lang.slug || lang.locale)
            : [];

          console.log('✅ [Plugin Detector] Polylang detected via Polylang API!', {
            languages,
            version: polylangApiResponse.headers['x-polylang-version'] || null,
          });
          logger.info('Polylang detected via Polylang API', {
            siteUrl: this.siteUrl,
            languages
          });

          return {
            plugin: TranslationPlugin.POLYLANG,
            version: polylangApiResponse.headers['x-polylang-version'] || null,
            supportedLanguages: languages,
            settings: {
              languageParameter: 'lang',
              detectionMethod: 'polylang-api',
            },
          };
        } else {
          console.log('❌ [Plugin Detector] Polylang API returned status:', polylangApiResponse.status);
        }
      } catch (error) {
        console.log('❌ [Plugin Detector] Method 4 failed:', error instanceof Error ? error.message : 'Unknown error');
        logger.debug('Polylang API check failed', { error });
      }

      console.log('❌ [Plugin Detector] Polylang not detected after all 4 methods');
      logger.debug('Polylang not detected after all methods', { siteUrl: this.siteUrl });
    } catch (error) {
      logger.debug('Polylang detection failed', {
        siteUrl: this.siteUrl,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return null;
  }

  /**
   * Get languages configured in Polylang
   */
  private async getPolylangLanguages(): Promise<string[]> {
    const languages: string[] = [];

    try {
      // Try Polylang REST API first
      try {
        const langResponse = await this.client.get('/pll/v1/languages');
        if (langResponse.data && Array.isArray(langResponse.data)) {
          return langResponse.data.map((lang: any) => lang.slug || lang.locale);
        }
      } catch {}

      // Try WordPress languages endpoint
      try {
        const langResponse = await this.client.get('/wp/v2/languages');
        if (langResponse.data && Array.isArray(langResponse.data)) {
          return langResponse.data.map((lang: any) => lang.slug || lang.locale);
        }
      } catch {}

      // Try getting from language taxonomy terms
      try {
        const termsResponse = await this.client.get('/wp/v2/language', {
          params: { per_page: 100 }
        });
        if (termsResponse.data && Array.isArray(termsResponse.data)) {
          return termsResponse.data.map((term: any) => term.slug);
        }
      } catch {}

      // Fallback: extract from posts
      try {
        const postsResponse = await this.client.get('/wp/v2/posts', {
          params: { per_page: 10, lang: 'all' }
        });
        if (postsResponse.data && Array.isArray(postsResponse.data)) {
          return this.extractLanguagesFromPosts(postsResponse.data);
        }
      } catch {}
    } catch (error) {
      logger.debug('Failed to get Polylang languages', { error });
    }

    return languages;
  }

  /**
   * Detect TranslatePress
   * API: Check for trp-language parameter
   */
  private async detectTranslatePress(): Promise<PluginDetectionResult | null> {
    try {
      // TranslatePress uses trp-language parameter
      const response = await this.client.get('/wp/v2/posts', {
        params: { per_page: 1, 'trp-language': 'en_US' },
      });

      if (response.headers['x-translatepress-version']) {
        const languages = this.extractLanguagesFromSettings();

        logger.info('TranslatePress detected', { siteUrl: this.siteUrl, languages });

        return {
          plugin: TranslationPlugin.TRANSLATEPRESS,
          version: response.headers['x-translatepress-version'] || null,
          supportedLanguages: languages,
          settings: {
            languageParameter: 'trp-language',
          },
        };
      }
    } catch (error) {
      logger.debug('TranslatePress not detected', { siteUrl: this.siteUrl });
    }

    return null;
  }

  /**
   * Detect Weglot
   * API: Check for weglot API endpoint
   */
  private async detectWeglot(): Promise<PluginDetectionResult | null> {
    try {
      // Weglot has its own API endpoint
      const response = await this.client.get('/weglot/v1/languages');

      if (response.status === 200 && response.data) {
        const languages = response.data.languages || [];

        logger.info('Weglot detected', { siteUrl: this.siteUrl, languages });

        return {
          plugin: TranslationPlugin.WEGLOT,
          version: response.headers['x-weglot-version'] || null,
          supportedLanguages: languages,
          settings: {
            apiKey: response.data.api_key ? '***' : null,
            originalLanguage: response.data.original_language,
          },
        };
      }
    } catch (error) {
      logger.debug('Weglot not detected', { siteUrl: this.siteUrl });
    }

    return null;
  }

  /**
   * Detect Loco Translate
   * Note: Loco Translate is for theme/plugin translation, not multilingual content
   */
  private async detectLocoTranslate(): Promise<PluginDetectionResult | null> {
    try {
      // Check if Loco Translate API is available
      const response = await this.client.get('/loco/v1/locales');

      if (response.status === 200 && response.data) {
        const languages = Array.isArray(response.data)
          ? response.data.map((locale: any) => locale.code)
          : [];

        logger.info('Loco Translate detected', { siteUrl: this.siteUrl, languages });

        return {
          plugin: TranslationPlugin.LOCO_TRANSLATE,
          version: response.headers['x-loco-version'] || null,
          supportedLanguages: languages,
          settings: {
            note: 'Loco Translate is for theme/plugin translation',
          },
        };
      }
    } catch (error) {
      logger.debug('Loco Translate not detected', { siteUrl: this.siteUrl });
    }

    return null;
  }

  /**
   * Detect qTranslate-XT
   * API: Check for qtranslate parameter
   */
  private async detectQTranslateXT(): Promise<PluginDetectionResult | null> {
    try {
      // qTranslate-XT uses 'lang' parameter
      const response = await this.client.get('/wp/v2/posts', {
        params: { per_page: 1, lang: 'en' },
      });

      if (response.headers['x-qtranslate-version']) {
        const languages = this.extractLanguagesFromPosts(response.data);

        logger.info('qTranslate-XT detected', { siteUrl: this.siteUrl, languages });

        return {
          plugin: TranslationPlugin.QTRANSLATE_XT,
          version: response.headers['x-qtranslate-version'] || null,
          supportedLanguages: languages,
          settings: {
            languageParameter: 'lang',
          },
        };
      }
    } catch (error) {
      logger.debug('qTranslate-XT not detected', { siteUrl: this.siteUrl });
    }

    return null;
  }

  /**
   * Extract languages from post data (fallback method)
   */
  private extractLanguagesFromPosts(posts: any[]): string[] {
    if (!Array.isArray(posts) || posts.length === 0) {
      return [];
    }

    const languages = new Set<string>();

    posts.forEach((post) => {
      // Check for language info in various fields
      if (post.lang) languages.add(post.lang);
      if (post.language) languages.add(post.language);
      if (post.locale) languages.add(post.locale);
      if (post._links?.['wp:term']?.[0]?.href) {
        // Extract language from taxonomy links
        const match = post._links['wp:term'][0].href.match(/language=([a-z_]+)/i);
        if (match) languages.add(match[1]);
      }
    });

    return Array.from(languages);
  }

  /**
   * Extract languages from site settings (fallback method)
   */
  private extractLanguagesFromSettings(): string[] {
    // Default fallback - would need to be enhanced based on actual site inspection
    return ['en_US', 'ar', 'fr_FR', 'es_ES'];
  }

  /**
   * Get posts in a specific language
   */
  async getPostsByLanguage(
    plugin: TranslationPlugin,
    language: string,
    page: number = 1,
    perPage: number = 10
  ): Promise<any[]> {
    try {
      // Order by date descending (newest first)
      let params: any = { 
        page, 
        per_page: perPage,
        orderby: 'date',
        order: 'desc'
      };

      switch (plugin) {
        case TranslationPlugin.WPML:
          params.wpml_language = language;
          break;
        case TranslationPlugin.POLYLANG:
          params.lang = language;
          break;
        case TranslationPlugin.TRANSLATEPRESS:
          params['trp-language'] = language;
          break;
        case TranslationPlugin.WEGLOT:
          // Weglot handles this differently, may need special handling
          params.lang = language;
          break;
        case TranslationPlugin.QTRANSLATE_XT:
          params.lang = language;
          break;
        default:
          break;
      }

      const response = await this.client.get('/wp/v2/posts', { params });
      const posts = response.data || [];
      
      // Additional sorting by date to ensure newest first (in case API doesn't respect order)
      return posts.sort((a: any, b: any) => {
        const dateA = new Date(a.date || a.modified || 0).getTime();
        const dateB = new Date(b.date || b.modified || 0).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
    } catch (error) {
      logger.error('Failed to get posts by language', {
        plugin,
        language,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Get translation connections for a post
   */
  async getPostTranslations(postId: number, plugin: TranslationPlugin): Promise<any> {
    try {
      switch (plugin) {
        case TranslationPlugin.WPML:
          // WPML stores translations in post meta
          const wpmlResponse = await this.client.get(`/wpml/v1/posts/${postId}/translations`);
          return wpmlResponse.data;

        case TranslationPlugin.POLYLANG:
          // Polylang uses taxonomy to link translations
          const polylangResponse = await this.client.get(`/wp/v2/posts/${postId}`);
          return polylangResponse.data.translations || {};

        default:
          return {};
      }
    } catch (error) {
      logger.error('Failed to get post translations', {
        postId,
        plugin,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {};
    }
  }
}

/**
 * Factory function to create plugin detector
 */
export function createPluginDetector(
  siteUrl: string,
  username: string,
  appPassword: string
): WordPressPluginDetector {
  return new WordPressPluginDetector(siteUrl, username, appPassword);
}
