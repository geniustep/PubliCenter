import { NextRequest, NextResponse } from 'next/server';
import { translateText, type SupportedLanguage } from '@/lib/translator';
import { translateRateLimit } from '@/lib/rate-limiter';
import { asyncHandler, ValidationError } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

/**
 * POST /api/translate
 * Translate text from one language to another
 *
 * Body:
 * {
 *   text: string;
 *   sourceLang: 'ar' | 'en' | 'fr' | 'es';
 *   targetLang: 'ar' | 'en' | 'fr' | 'es';
 *   useCache?: boolean;
 * }
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  // Apply rate limiting
  const rateLimitResponse = await translateRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Parse request body
  const body = await request.json();

  // Validate request
  if (!body.text || typeof body.text !== 'string') {
    throw new ValidationError('Text is required');
  }

  if (!body.sourceLang || !['ar', 'en', 'fr', 'es'].includes(body.sourceLang)) {
    throw new ValidationError('Valid source language is required (ar, en, fr, es)');
  }

  if (!body.targetLang || !['ar', 'en', 'fr', 'es'].includes(body.targetLang)) {
    throw new ValidationError('Valid target language is required (ar, en, fr, es)');
  }

  // Translate text
  const result = await translateText({
    text: body.text,
    sourceLang: body.sourceLang as SupportedLanguage,
    targetLang: body.targetLang as SupportedLanguage,
    useCache: body.useCache !== false,
  });

  return NextResponse.json({
    success: true,
    data: {
      translatedText: result.translatedText,
      detectedSourceLanguage: result.detectedSourceLanguage,
      fromCache: result.fromCache,
      sourceLang: body.sourceLang,
      targetLang: body.targetLang,
    },
  });
});
