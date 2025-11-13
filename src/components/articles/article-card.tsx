'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TranslationProgressBar } from './translation-progress-bar';
import { TranslationItem } from './translation-item';
import type {
  EnhancedArticle,
  EnhancedTranslation,
  Language,
  ArticleCardDisplayOptions,
} from '@/types/api';
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Sparkles,
  TrendingUp,
  Clock,
  MessageSquare,
  Share2,
  Heart,
  FileText,
} from 'lucide-react';

interface ArticleCardProps {
  article: EnhancedArticle;
  displayOptions?: ArticleCardDisplayOptions;
  onEdit?: (article: EnhancedArticle) => void;
  onDelete?: (article: EnhancedArticle) => void;
  onPreview?: (article: EnhancedArticle) => void;
  onGenerateTranslation?: (article: EnhancedArticle, language: Language) => void;
  onViewTranslation?: (translation: EnhancedTranslation) => void;
  compact?: boolean;
}

const LANGUAGE_FLAGS: Record<Language, string> = {
  AR: '🇸🇦',
  EN: '🇬🇧',
  FR: '🇫🇷',
  ES: '🇪🇸',
};

const DEFAULT_OPTIONS: ArticleCardDisplayOptions = {
  showAnalytics: true,
  showQualityMetrics: true,
  showCollaboration: false,
  showTranslationProgress: true,
  showPrimaryImage: true,
  enableQuickActions: true,
  enablePreview: true,
  compactMode: false,
};

export function ArticleCard({
  article,
  displayOptions = DEFAULT_OPTIONS,
  onEdit,
  onDelete,
  onPreview,
  onGenerateTranslation,
  onViewTranslation,
  compact = false,
}: ArticleCardProps) {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const [showAllTranslations, setShowAllTranslations] = useState(false);

  const options = { ...DEFAULT_OPTIONS, ...displayOptions };

  // التصنيف حسب جودة الترجمة
  const sortedTranslations = article.enhancedTranslations?.sort((a, b) => {
    return (b.qualityMetrics?.overall || 0) - (a.qualityMetrics?.overall || 0);
  }) || [];

  // إيجاد اللغات المفقودة
  const existingLanguages = new Set(sortedTranslations.map(t => t.language));
  const missingLanguages = article.translationProgress.missingLanguages;

  // تنسيق الوقت
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'منذ دقائق';
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'منذ يوم';
    if (diffInDays < 7) return `منذ ${diffInDays} أيام`;
    return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
  };

  // Compact View
  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Thumbnail */}
            {options.showPrimaryImage && article.primaryImage && (
              <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                <Image
                  src={article.primaryImage.url}
                  alt={article.primaryImage.alt || article.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{LANGUAGE_FLAGS[article.sourceLanguage]}</span>
                    <Link
                      href={`/${locale}/articles/${article.id}`}
                      className="text-sm font-semibold hover:underline truncate"
                    >
                      {article.title}
                    </Link>
                  </div>

                  {/* Translation Status Compact */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {sortedTranslations.slice(0, 3).map((trans) => (
                      <span key={trans.id} title={trans.title}>
                        {trans.status === 'PUBLISHED' ? '✅' : trans.status === 'TRANSLATED' ? '⚠️' : '⏳'}
                        {LANGUAGE_FLAGS[trans.language]}
                      </span>
                    ))}
                    {missingLanguages.slice(0, 2).map((lang) => (
                      <span key={lang} title={`${lang} مفقود`}>
                        ❌{LANGUAGE_FLAGS[lang]}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Progress & Quality */}
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="text-xs">
                    📊 {article.translationProgress.overall}%
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    ⭐ {article.translationProgress.quality.toFixed(1)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onPreview && (
                  <DropdownMenuItem onClick={() => onPreview(article)}>
                    <Eye className="h-4 w-4 mr-2" />
                    {t('common.preview')}
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(article)}>
                    <Edit className="h-4 w-4 mr-2" />
                    {t('common.edit')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(article)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('common.delete')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Expanded View
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          {/* Primary Image */}
          {options.showPrimaryImage && article.primaryImage && (
            <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
              <Image
                src={article.primaryImage.url}
                alt={article.primaryImage.alt || article.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Header Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-2xl">{LANGUAGE_FLAGS[article.sourceLanguage]}</span>
                <Link
                  href={`/${locale}/articles/${article.id}`}
                  className="text-lg font-bold hover:underline truncate"
                >
                  {article.title}
                </Link>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {article.analytics.trending && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trending
                  </Badge>
                )}
                {options.showQualityMetrics && (
                  <Badge variant="outline" className="text-sm">
                    ⭐ {article.translationProgress.quality.toFixed(1)}/5
                  </Badge>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                {article.category?.name || t('articles.uncategorized')}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(article.createdAt)}
              </span>
              {article.author && (
                <>
                  <span>•</span>
                  <span>بواسطة {article.author.name}</span>
                </>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/articles/${article.id}`}>
                  <FileText className="h-4 w-4 mr-2" />
                  {t('common.details')}
                </Link>
              </DropdownMenuItem>
              {onPreview && (
                <DropdownMenuItem onClick={() => onPreview(article)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {t('common.preview')}
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(article)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('common.edit')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(article)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('common.delete')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Translation Progress */}
        {options.showTranslationProgress && (
          <div>
            <TranslationProgressBar
              progress={article.translationProgress}
              showDetails={true}
            />
          </div>
        )}

        {/* Translations List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">📝 الترجمات</h4>
            {sortedTranslations.length > 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllTranslations(!showAllTranslations)}
              >
                {showAllTranslations ? 'إخفاء' : `عرض الكل (${sortedTranslations.length})`}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {/* Existing Translations */}
            {(showAllTranslations ? sortedTranslations : sortedTranslations.slice(0, 2)).map(
              (translation) => (
                <TranslationItem
                  key={translation.id}
                  translation={translation}
                  onPreview={onViewTranslation}
                  compact={false}
                />
              )
            )}

            {/* Missing Translations */}
            {missingLanguages.map((lang) => (
              <div
                key={lang}
                className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50"
              >
                <span className="text-2xl opacity-50">{LANGUAGE_FLAGS[lang]}</span>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    لا توجد ترجمة {lang}
                  </p>
                </div>
                {onGenerateTranslation && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onGenerateTranslation(article, lang)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    توليد ترجمة
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Analytics */}
        {options.showAnalytics && article.analytics && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {article.analytics.views.toLocaleString('ar-SA')}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {article.analytics.comments}
              </span>
              <span className="flex items-center gap-1">
                <Share2 className="h-3 w-3" />
                {article.analytics.shares}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {article.analytics.likes}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.analytics.readingTime} دقائق
              </span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-between pt-0">
        <span className="text-xs text-muted-foreground">
          {article._count?.translations || 0} {t('articles.translations')}
        </span>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${locale}/articles/${article.id}`}>
            {t('common.details')} →
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
