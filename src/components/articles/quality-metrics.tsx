'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TranslationQualityMetrics } from '@/types/api';
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BookOpen,
  Search,
  Sparkles,
  Globe,
  Lightbulb
} from 'lucide-react';

interface QualityMetricsProps {
  metrics: TranslationQualityMetrics;
  compact?: boolean;
  showSuggestions?: boolean;
}

interface MetricConfig {
  key: keyof Omit<TranslationQualityMetrics, 'overall' | 'suggestions'>;
  label: string;
  icon: any;
  description: string;
}

const METRICS_CONFIG: MetricConfig[] = [
  {
    key: 'grammar',
    label: 'النحو والصرف',
    icon: CheckCircle2,
    description: 'دقة القواعد النحوية والإملائية'
  },
  {
    key: 'readability',
    label: 'سهولة القراءة',
    icon: BookOpen,
    description: 'وضوح النص وسهولة فهمه'
  },
  {
    key: 'seoScore',
    label: 'تحسين محركات البحث',
    icon: Search,
    description: 'جودة المحتوى لمحركات البحث'
  },
  {
    key: 'consistency',
    label: 'الاتساق',
    icon: Sparkles,
    description: 'الاتساق مع النص الأصلي'
  },
  {
    key: 'culturalFit',
    label: 'الملاءمة الثقافية',
    icon: Globe,
    description: 'مناسبة المحتوى للثقافة المستهدفة'
  }
];

export function QualityMetrics({
  metrics,
  compact = false,
  showSuggestions = true
}: QualityMetricsProps) {

  // حساب اللون بناءً على النسبة
  const getScoreColor = (score: number) => {
    if (score >= 90) return { bg: 'bg-green-500', text: 'text-green-600', label: 'ممتاز' };
    if (score >= 75) return { bg: 'bg-blue-500', text: 'text-blue-600', label: 'جيد جداً' };
    if (score >= 60) return { bg: 'bg-yellow-500', text: 'text-yellow-600', label: 'جيد' };
    if (score >= 40) return { bg: 'bg-orange-500', text: 'text-orange-600', label: 'مقبول' };
    return { bg: 'bg-red-500', text: 'text-red-600', label: 'ضعيف' };
  };

  const overallColor = getScoreColor(metrics.overall);

  // Compact View
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${overallColor.bg}`} />
          <span className="text-sm font-medium">{metrics.overall}%</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {overallColor.label}
        </Badge>
        {metrics.overall < 70 && (
          <AlertCircle className="h-4 w-4 text-amber-500" />
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            مقاييس الجودة
          </span>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-lg px-3 py-1 ${overallColor.text} border-current`}
            >
              {metrics.overall}%
            </Badge>
            <Badge variant="secondary">
              {overallColor.label}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Score Circle */}
        <div className="flex justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background Circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Progress Circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - metrics.overall / 100)}`}
                className={overallColor.text}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${overallColor.text}`}>
                {metrics.overall}%
              </span>
              <span className="text-xs text-muted-foreground">
                الجودة الإجمالية
              </span>
            </div>
          </div>
        </div>

        {/* Individual Metrics */}
        <div className="space-y-4">
          {METRICS_CONFIG.map((config) => {
            const score = metrics[config.key];
            const scoreColor = getScoreColor(score);
            const Icon = config.icon;

            return (
              <div key={config.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${scoreColor.text}`} />
                    <div>
                      <p className="text-sm font-medium">{config.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold w-12 text-right">
                      {score}%
                    </span>
                    {score < 70 && (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>

                <div className="relative">
                  <Progress value={score} className="h-2" />
                  <div
                    className={`absolute top-0 left-0 h-2 rounded-full transition-all ${scoreColor.bg}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Suggestions */}
        {showSuggestions && metrics.suggestions && metrics.suggestions.length > 0 && (
          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span>اقتراحات التحسين</span>
            </div>
            <ul className="space-y-2">
              {metrics.suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Low Score Warning */}
        {metrics.overall < 60 && (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-semibold mb-1">تنبيه: جودة منخفضة</p>
                <p>
                  هذه الترجمة تحتاج إلى مراجعة وتحسين. يُنصح بمراجعة يدوية قبل النشر.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Excellent Score Badge */}
        {metrics.overall >= 90 && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800 dark:text-green-200">
                <p className="font-semibold mb-1">🎉 جودة ممتازة!</p>
                <p>
                  هذه الترجمة ذات جودة عالية جداً وجاهزة للنشر.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact Quality Badge - شارة مصغرة للجودة
 */
export function QualityBadge({ score }: { score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 90) return 'bg-green-100 text-green-700 border-green-200';
    if (s >= 75) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (s >= 40) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <Badge variant="outline" className={`text-xs ${getScoreColor(score)}`}>
      📊 {score}%
    </Badge>
  );
}
