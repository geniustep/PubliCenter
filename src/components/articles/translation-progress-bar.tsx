'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { TranslationProgress, Language } from '@/types/api';
import { CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';

interface TranslationProgressBarProps {
  progress: TranslationProgress;
  showDetails?: boolean;
  compact?: boolean;
}

const LANGUAGE_FLAGS: Record<Language, string> = {
  AR: '🇸🇦',
  EN: '🇬🇧',
  FR: '🇫🇷',
  ES: '🇪🇸',
};

const LANGUAGE_NAMES: Record<Language, string> = {
  AR: 'العربية',
  EN: 'English',
  FR: 'Français',
  ES: 'Español',
};

export function TranslationProgressBar({
  progress,
  showDetails = false,
  compact = false,
}: TranslationProgressBarProps) {
  // حساب اللون بناءً على النسبة
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage > 0) return 'bg-orange-500';
    return 'bg-gray-300';
  };

  // حساب أيقونة الحالة
  const getStatusIcon = (percentage: number) => {
    if (percentage === 100) return <CheckCircle2 className="h-3 w-3 text-green-600" />;
    if (percentage >= 70) return <Clock className="h-3 w-3 text-blue-600" />;
    if (percentage > 0) return <AlertCircle className="h-3 w-3 text-yellow-600" />;
    return <XCircle className="h-3 w-3 text-gray-400" />;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Progress value={progress.overall} className="h-2 w-24" />
        <span className="text-xs font-medium text-muted-foreground">
          {progress.overall}%
        </span>
        <Badge variant="outline" className="text-xs">
          ⭐ {progress.quality.toFixed(1)}/5
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">اكتمال الترجمة</span>
            {getStatusIcon(progress.overall)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{progress.overall}%</span>
            <Badge variant="outline" className="text-xs">
              ⭐ {progress.quality.toFixed(1)}/5
            </Badge>
          </div>
        </div>
        <Progress value={progress.overall} className="h-2" />
      </div>

      {/* Language Details */}
      {showDetails && (
        <div className="space-y-1.5">
          {(Object.entries(progress.completeness) as [Language, number][]).map(
            ([lang, percentage]) => (
              <div key={lang} className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 w-24">
                  <span>{LANGUAGE_FLAGS[lang]}</span>
                  <span className="text-muted-foreground">{LANGUAGE_NAMES[lang]}</span>
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getProgressColor(percentage)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-10 text-right">
                    {percentage}%
                  </span>
                </div>
                {/* Status Badges */}
                <div className="flex gap-1">
                  {percentage === 100 && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      ✅
                    </Badge>
                  )}
                  {progress.needsReview.includes(lang) && (
                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                      ⚠️
                    </Badge>
                  )}
                  {progress.outOfSync.includes(lang) && (
                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                      🔄
                    </Badge>
                  )}
                  {percentage === 0 && (
                    <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                      ❌
                    </Badge>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Missing Languages Warning */}
      {progress.missingLanguages.length > 0 && (
        <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          <span>
            ترجمات مفقودة: {progress.missingLanguages.map(lang => LANGUAGE_FLAGS[lang]).join(' ')}
          </span>
        </div>
      )}
    </div>
  );
}
