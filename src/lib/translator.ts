import axios from 'axios';
import { cache } from './cache';
import { logger } from './logger';

export type SupportedLanguage = 'ar' | 'en' | 'fr' | 'es';

interface TranslateOptions {
  text: string;
  sourceLang: SupportedLanguage;
  targetLang: SupportedLanguage;
  useCache?: boolean;
}

interface TranslateResult {
  translatedText: string;
  detectedSourceLanguage?: string;
  fromCache: boolean;
}

/**
 * Translate text using Google Translate API
 */
export async function translateText(options: TranslateOptions): Promise<TranslateResult> {
  const { text, sourceLang, targetLang, useCache = true } = options;

  // If source and target are the same, return original text
  if (sourceLang === targetLang) {
    return {
      translatedText: text,
      fromCache: false,
    };
  }

  // Generate cache key
  const cacheKey = `translate:${sourceLang}:${targetLang}:${text.substring(0, 100)}`;

  // Check cache
  if (useCache) {
    const cached = cache.get<string>(cacheKey);
    if (cached) {
      logger.info('Translation cache hit', { cacheKey });
      return {
        translatedText: cached,
        fromCache: true,
      };
    }
  }

  try {
    // Call Google Translate API
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

    if (!apiKey) {
      throw new Error('GOOGLE_TRANSLATE_API_KEY is not configured');
    }

    const response = await axios.post(
      'https://translation.googleapis.com/language/translate/v2',
      {
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text',
      },
      {
        params: {
          key: apiKey,
        },
      }
    );

    const translatedText = response.data.data.translations[0].translatedText;
    const detectedSourceLanguage = response.data.data.translations[0].detectedSourceLanguage;

    // Cache the result
    if (useCache) {
      const ttl = parseInt(process.env.CACHE_TTL || '300') * 1000; // Convert to ms
      cache.set(cacheKey, translatedText, ttl);
      logger.info('Translation cached', { cacheKey, ttl });
    }

    logger.info('Translation successful', {
      sourceLang,
      targetLang,
      textLength: text.length,
      translatedLength: translatedText.length,
    });

    return {
      translatedText,
      detectedSourceLanguage,
      fromCache: false,
    };
  } catch (error) {
    logger.error('Translation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sourceLang,
      targetLang,
    });

    throw new Error('Translation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Translate multiple texts in batch
 */
export async function translateBatch(
  texts: string[],
  sourceLang: SupportedLanguage,
  targetLang: SupportedLanguage
): Promise<string[]> {
  const results = await Promise.all(
    texts.map((text) =>
      translateText({
        text,
        sourceLang,
        targetLang,
      })
    )
  );

  return results.map((r) => r.translatedText);
}

/**
 * Detect language of text
 */
export async function detectLanguage(text: string): Promise<string> {
  try {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

    if (!apiKey) {
      throw new Error('GOOGLE_TRANSLATE_API_KEY is not configured');
    }

    const response = await axios.post(
      'https://translation.googleapis.com/language/translate/v2/detect',
      {
        q: text,
      },
      {
        params: {
          key: apiKey,
        },
      }
    );

    return response.data.data.detections[0][0].language;
  } catch (error) {
    logger.error('Language detection failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw new Error('Language detection failed');
  }
}
