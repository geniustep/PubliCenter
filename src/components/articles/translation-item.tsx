'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { EnhancedTranslation } from '@/types/api';
import { Language } from '@/types/api';
import {
  Eye,
  Edit,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  FileText,
} from 'lucide-react';

interface TranslationItemProps {
  translation: EnhancedTranslation;
  onPreview?: (translation: EnhancedTranslation) => void;
  onEdit?: (translation: EnhancedTranslation) => void;
  onUpdate?: (translation: EnhancedTranslation) => void;
  compact?: boolean;
}

const LANGUAGE_FLAGS: Record<Language, string> = {
  [Language.AR]: '🇸🇦',
  [Language.EN]: '🇬🇧',
  [Language.FR]: '🇫🇷',
  [Language.ES]: '🇪🇸',
};

export function TranslationItem({
  translation,
  onPreview,
  onEdit,
  onUpdate,
  compact = false,
}: TranslationItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  // حساب اللون بناءً على الحالة
  const getStatusColor = () => {
    if (translation.status === 'PUBLISHED') return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
    if (translation.status === 'TRANSLATED') return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
    if (translation.status === 'TRANSLATING') return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800';
    if (translation.status === 'FAILED') return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
    return 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800';
  };

  // حساب أيقونة الحالة
  const getStatusIcon = () => {
    if (translation.status === 'PUBLISHED') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (translation.status === 'TRANSLATED') return <FileText className="h-4 w-4 text-blue-600" />;
    if (translation.status === 'TRANSLATING') return <Clock className="h-4 w-4 text-yellow-600 animate-pulse" />;
    if (translation.status === 'FAILED') return <AlertCircle className="h-4 w-4 text-red-600" />;
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const qualityScore = translation.qualityMetrics?.overall || 0;
  const readingTime = translation.readingTime || 0;

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'منذ دقائق';
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'منذ يوم';
    if (diffInDays < 7) return `منذ ${diffInDays} أيام`;
    if (diffInDays < 30) return `منذ ${Math.floor(diffInDays / 7)} أسبوع`;
    return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 p-2 rounded-md border ${getStatusColor()} transition-all`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className="text-xl">{LANGUAGE_FLAGS[translation.language]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{translation.title}</p>
        </div>
        {qualityScore > 0 && (
          <Badge variant="outline" className="text-xs">
            📊 {qualityScore}%
          </Badge>
        )}
        {getStatusIcon()}
        {isHovered && (
          <div className="flex gap-1">
            {onPreview && (
              <Button size="sm" variant="ghost" onClick={() => onPreview(translation)}>
                <Eye className="h-3 w-3" />
              </Button>
            )}
            {onEdit && (
              <Button size="sm" variant="ghost" onClick={() => onEdit(translation)}>
                <Edit className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`p-3 rounded-lg border ${getStatusColor()} transition-all hover:shadow-md`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-2xl">{LANGUAGE_FLAGS[translation.language]}</span>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold truncate mb-1">{translation.title}</h4>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
              {/* Quality Score */}
              {qualityScore > 0 && (
                <Badge variant="outline" className="text-xs">
                  📊 {qualityScore}%
                </Badge>
              )}

              {/* Reading Time */}
              {readingTime > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {readingTime} دقيقة
                </span>
              )}

              {/* Last Updated */}
              {translation.updatedAt && (
                <span>• {formatDate(translation.updatedAt)}</span>
              )}

              {/* Auto Translated Badge */}
              {translation.isAutoTranslated && (
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI
                </Badge>
              )}
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-1.5">
              {getStatusIcon()}

              {translation.needsReview && (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                  ⚠️ يحتاج مراجعة
                </Badge>
              )}

              {translation.hasChanges && (
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                  🔄 يحتاج تحديث
                </Badge>
              )}

              {translation.wordpressPostId && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  WordPress #{translation.wordpressPostId}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={`flex gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {onPreview && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onPreview(translation)}
              title="معاينة"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}

          {onUpdate && translation.hasChanges && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onUpdate(translation)}
              title="تحديث الترجمة"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}

          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(translation)}
              title="تعديل"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Excerpt Preview */}
      {translation.excerpt && !compact && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {translation.excerpt}
        </p>
      )}
    </div>
  );
}
