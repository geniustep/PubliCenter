'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  FileText,
  Hash,
  BookOpen,
  Lightbulb,
} from 'lucide-react';
import {
  analyzeSEO,
  getReadabilityMetrics,
  analyzeKeywords,
  extractKeywords,
  type SEOScore,
} from '@/lib/seo/analyzer';

interface SEOAnalyzerProps {
  title: string;
  content: string;
  metaDescription: string;
  targetKeywords?: string[];
  onUpdate?: (data: {
    title?: string;
    content?: string;
    metaDescription?: string;
  }) => void;
}

export function SEOAnalyzer({
  title,
  content,
  metaDescription,
  targetKeywords = [],
  onUpdate,
}: SEOAnalyzerProps) {
  const [seoScore, setSEOScore] = useState<SEOScore | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    if (title || content || metaDescription) {
      const score = analyzeSEO(title, content, metaDescription, targetKeywords);
      setSEOScore(score);
    }
  }, [title, content, metaDescription, targetKeywords]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'ممتاز', variant: 'default' as const };
    if (score >= 60) return { label: 'جيد', variant: 'secondary' as const };
    return { label: 'يحتاج تحسين', variant: 'destructive' as const };
  };

  if (!seoScore) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>ابدأ بكتابة المحتوى للحصول على تحليل SEO</p>
        </CardContent>
      </Card>
    );
  }

  const scoreBadge = getScoreBadge(seoScore.overall);
  const readability = getReadabilityMetrics(content);
  const keywords = analyzeKeywords(content, title, metaDescription, targetKeywords);
  const autoKeywords = extractKeywords(content, 5);

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                تحليل SEO
              </CardTitle>
              <CardDescription>النتيجة الإجمالية والتوصيات</CardDescription>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(seoScore.overall)}`}>
                {seoScore.overall}
              </div>
              <Badge variant={scoreBadge.variant} className="mt-2">
                {scoreBadge.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Score Breakdown */}
          <div className="space-y-3">
            <ScoreItem
              label="العنوان"
              score={seoScore.titleScore}
              icon={<FileText className="h-4 w-4" />}
            />
            <ScoreItem
              label="الوصف التعريفي"
              score={seoScore.metaDescriptionScore}
              icon={<FileText className="h-4 w-4" />}
            />
            <ScoreItem
              label="المحتوى"
              score={seoScore.contentScore}
              icon={<FileText className="h-4 w-4" />}
            />
            <ScoreItem
              label="الكلمات المفتاحية"
              score={seoScore.keywordScore}
              icon={<Hash className="h-4 w-4" />}
            />
            <ScoreItem
              label="القراءة"
              score={seoScore.readabilityScore}
              icon={<BookOpen className="h-4 w-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Issues and Suggestions */}
      {(seoScore.issues.length > 0 || seoScore.suggestions.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              المشاكل والاقتراحات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {seoScore.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-red-600 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  مشاكل يجب إصلاحها
                </h4>
                <ul className="space-y-1">
                  {seoScore.issues.map((issue, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {seoScore.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-yellow-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  اقتراحات للتحسين
                </h4>
                <ul className="space-y-1">
                  {seoScore.suggestions.map((suggestion, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-yellow-600 mt-1">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Readability Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            مقاييس القراءة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm text-muted-foreground">سهولة القراءة</Label>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={readability.fleschReadingEase} className="flex-1" />
                <span className="text-sm font-medium min-w-[3ch]">
                  {Math.round(readability.fleschReadingEase)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{readability.readingLevel}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">وقت القراءة المقدر</Label>
              <p className="text-2xl font-bold mt-1">{readability.estimatedReadingTime} دقيقة</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">متوسط طول الكلمة</Label>
              <p className="text-2xl font-bold mt-1">
                {readability.averageWordLength.toFixed(1)} حرف
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">متوسط طول الجملة</Label>
              <p className="text-2xl font-bold mt-1">
                {readability.averageSentenceLength.toFixed(1)} كلمة
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keyword Analysis */}
      {keywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              تحليل الكلمات المفتاحية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {keywords.map((kw, i) => (
                <div key={i} className="flex items-center justify-between pb-3 border-b last:border-0">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{kw.keyword}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        الكثافة: {kw.density.toFixed(2)}%
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        العدد: {kw.count}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {kw.inTitle && (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        العنوان
                      </Badge>
                    )}
                    {kw.inDescription && (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        الوصف
                      </Badge>
                    )}
                    {kw.inHeadings && (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        العناوين
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-extracted Keywords */}
      {autoKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">كلمات مفتاحية مقترحة</CardTitle>
            <CardDescription className="text-xs">
              تم استخراجها تلقائياً من المحتوى
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {autoKeywords.map((keyword, i) => (
                <Badge key={i} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ScoreItem({
  label,
  score,
  icon,
}: {
  label: string;
  score: number;
  icon: React.ReactNode;
}) {
  const getColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <Progress value={score} className="w-24" />
        <span className="text-sm font-medium min-w-[3ch] text-right">{score}</span>
      </div>
    </div>
  );
}
