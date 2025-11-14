/**
 * SEO Analyzer Utility
 * Provides various SEO analysis functions for content
 */

export interface SEOScore {
  overall: number; // 0-100
  titleScore: number;
  metaDescriptionScore: number;
  contentScore: number;
  keywordScore: number;
  readabilityScore: number;
  issues: string[];
  suggestions: string[];
}

export interface KeywordAnalysis {
  keyword: string;
  density: number;
  count: number;
  inTitle: boolean;
  inDescription: boolean;
  inHeadings: boolean;
}

export interface ReadabilityMetrics {
  averageWordLength: number;
  averageSentenceLength: number;
  fleschReadingEase: number; // 0-100 (higher is easier)
  readingLevel: string;
  estimatedReadingTime: number; // in minutes
}

/**
 * Calculate keyword density
 */
export function calculateKeywordDensity(content: string, keyword: string): number {
  const words = content.toLowerCase().split(/\s+/);
  const keywordLower = keyword.toLowerCase();
  const count = words.filter(word => word.includes(keywordLower)).length;
  return words.length > 0 ? (count / words.length) * 100 : 0;
}

/**
 * Extract keywords from content
 */
export function extractKeywords(content: string, limit = 10): string[] {
  // Simple keyword extraction (can be improved with NLP)
  const words = content
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, '') // Keep Arabic and English letters
    .split(/\s+/)
    .filter(word => word.length > 3); // Filter out short words

  // Count word frequency
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Sort by frequency and return top keywords
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * Analyze keywords in content
 */
export function analyzeKeywords(
  content: string,
  title: string,
  metaDescription: string,
  targetKeywords: string[]
): KeywordAnalysis[] {
  return targetKeywords.map(keyword => {
    const density = calculateKeywordDensity(content, keyword);
    const count = content.toLowerCase().split(keyword.toLowerCase()).length - 1;
    const inTitle = title.toLowerCase().includes(keyword.toLowerCase());
    const inDescription = metaDescription.toLowerCase().includes(keyword.toLowerCase());

    // Check in headings (h1-h6)
    const headingMatches = content.match(/<h[1-6][^>]*>([^<]*)<\/h[1-6]>/gi) || [];
    const inHeadings = headingMatches.some(heading =>
      heading.toLowerCase().includes(keyword.toLowerCase())
    );

    return {
      keyword,
      density,
      count,
      inTitle,
      inDescription,
      inHeadings,
    };
  });
}

/**
 * Calculate Flesch Reading Ease score
 */
export function calculateFleschReadingEase(content: string): number {
  // Remove HTML tags
  const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = plainText.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((total, word) => total + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease formula
  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  return Math.max(0, Math.min(100, score));
}

/**
 * Count syllables in a word (simplified for multilingual support)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z\u0600-\u06FF]/g, '');

  // For Arabic text
  if (/[\u0600-\u06FF]/.test(word)) {
    return Math.ceil(word.length / 2); // Simplified for Arabic
  }

  // For English text
  const vowels = 'aeiouy';
  let count = 0;
  let prevWasVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !prevWasVowel) {
      count++;
    }
    prevWasVowel = isVowel;
  }

  // Handle silent 'e'
  if (word.endsWith('e')) {
    count--;
  }

  return Math.max(1, count);
}

/**
 * Get readability metrics
 */
export function getReadabilityMetrics(content: string): ReadabilityMetrics {
  const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = plainText.split(/\s+/).filter(w => w.length > 0);

  const averageWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length || 0;
  const averageSentenceLength = words.length / sentences.length || 0;
  const fleschReadingEase = calculateFleschReadingEase(content);

  // Estimate reading time (average reading speed: 200 words per minute)
  const estimatedReadingTime = Math.ceil(words.length / 200);

  // Determine reading level based on Flesch score
  let readingLevel = 'Very Difficult';
  if (fleschReadingEase >= 90) readingLevel = 'Very Easy';
  else if (fleschReadingEase >= 80) readingLevel = 'Easy';
  else if (fleschReadingEase >= 70) readingLevel = 'Fairly Easy';
  else if (fleschReadingEase >= 60) readingLevel = 'Standard';
  else if (fleschReadingEase >= 50) readingLevel = 'Fairly Difficult';
  else if (fleschReadingEase >= 30) readingLevel = 'Difficult';

  return {
    averageWordLength,
    averageSentenceLength,
    fleschReadingEase,
    readingLevel,
    estimatedReadingTime,
  };
}

/**
 * Analyze SEO score for content
 */
export function analyzeSEO(
  title: string,
  content: string,
  metaDescription: string,
  targetKeywords: string[] = []
): SEOScore {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let titleScore = 100;
  let metaDescriptionScore = 100;
  let contentScore = 100;
  let keywordScore = 100;
  let readabilityScore = 100;

  // Title analysis
  if (!title || title.length === 0) {
    titleScore = 0;
    issues.push('العنوان مفقود');
  } else if (title.length < 30) {
    titleScore = 60;
    suggestions.push('العنوان قصير جداً. يُفضل أن يكون بين 30-60 حرفاً');
  } else if (title.length > 60) {
    titleScore = 70;
    suggestions.push('العنوان طويل جداً. قد يتم قصه في نتائج البحث');
  }

  // Meta description analysis
  if (!metaDescription || metaDescription.length === 0) {
    metaDescriptionScore = 0;
    issues.push('الوصف التعريفي مفقود');
  } else if (metaDescription.length < 120) {
    metaDescriptionScore = 60;
    suggestions.push('الوصف التعريفي قصير جداً. يُفضل أن يكون بين 120-160 حرفاً');
  } else if (metaDescription.length > 160) {
    metaDescriptionScore = 70;
    suggestions.push('الوصف التعريفي طويل جداً. قد يتم قصه في نتائج البحث');
  }

  // Content analysis
  const words = content.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 300) {
    contentScore = 50;
    suggestions.push('المحتوى قصير جداً. يُفضل أن يكون على الأقل 300 كلمة');
  }

  // Check for headings
  const hasH1 = /<h1[^>]*>/.test(content);
  if (!hasH1) {
    contentScore -= 10;
    suggestions.push('أضف عنواناً رئيسياً (H1) للمحتوى');
  }

  // Keyword analysis
  if (targetKeywords.length > 0) {
    const keywordAnalysis = analyzeKeywords(content, title, metaDescription, targetKeywords);
    const keywordsInTitle = keywordAnalysis.filter(k => k.inTitle).length;
    const keywordsInDescription = keywordAnalysis.filter(k => k.inDescription).length;

    if (keywordsInTitle === 0) {
      keywordScore -= 30;
      suggestions.push('أضف الكلمات المفتاحية الأساسية في العنوان');
    }

    if (keywordsInDescription === 0) {
      keywordScore -= 20;
      suggestions.push('أضف الكلمات المفتاحية في الوصف التعريفي');
    }

    keywordAnalysis.forEach(k => {
      if (k.density < 0.5) {
        suggestions.push(`كثافة الكلمة المفتاحية "${k.keyword}" منخفضة جداً`);
      } else if (k.density > 3) {
        suggestions.push(`كثافة الكلمة المفتاحية "${k.keyword}" عالية جداً - قد يُعتبر spam`);
      }
    });
  }

  // Readability analysis
  const readability = getReadabilityMetrics(content);
  if (readability.fleschReadingEase < 30) {
    readabilityScore = 50;
    suggestions.push('المحتوى صعب القراءة. حاول استخدام جمل أقصر وكلمات أبسط');
  } else if (readability.fleschReadingEase < 50) {
    readabilityScore = 70;
    suggestions.push('المحتوى متوسط الصعوبة. يمكن تحسينه');
  }

  // Calculate overall score
  const overall = Math.round(
    (titleScore * 0.2 +
      metaDescriptionScore * 0.2 +
      contentScore * 0.25 +
      keywordScore * 0.2 +
      readabilityScore * 0.15)
  );

  return {
    overall,
    titleScore,
    metaDescriptionScore,
    contentScore,
    keywordScore,
    readabilityScore,
    issues,
    suggestions,
  };
}
