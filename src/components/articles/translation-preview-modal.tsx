'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QualityMetrics, QualityBadge } from './quality-metrics';
import type { EnhancedTranslation } from '@/types/api';
import { Language } from '@/types/api';
import {
  Eye,
  Edit,
  ExternalLink,
  Clock,
  FileText,
  Code,
  CheckCircle2,
  Copy,
  Download,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

interface TranslationPreviewModalProps {
  translation: EnhancedTranslation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (translation: EnhancedTranslation) => void;
  onPublish?: (translation: EnhancedTranslation) => void;
}

const LANGUAGE_FLAGS: Record<Language, string> = {
  [Language.AR]: '🇸🇦',
  [Language.EN]: '🇬🇧',
  [Language.FR]: '🇫🇷',
  [Language.ES]: '🇪🇸',
};

const LANGUAGE_NAMES: Record<Language, string> = {
  [Language.AR]: 'العربية',
  [Language.EN]: 'English',
  [Language.FR]: 'Français',
  [Language.ES]: 'Español',
};

export function TranslationPreviewModal({
  translation,
  open,
  onOpenChange,
  onEdit,
  onPublish,
}: TranslationPreviewModalProps) {
  const [activeTab, setActiveTab] = useState('preview');

  if (!translation) return null;

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(translation.content);
      toast.success('تم نسخ المحتوى');
    } catch (error) {
      toast.error('فشل نسخ المحتوى');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([translation.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${translation.slug}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('تم تحميل المحتوى');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="flex items-center gap-2 text-xl mb-2">
                <span className="text-2xl">
                  {LANGUAGE_FLAGS[translation.language]}
                </span>
                <span className="truncate">{translation.title}</span>
              </DialogTitle>
              <DialogDescription className="space-y-2">
                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <Badge variant="outline">
                    {LANGUAGE_NAMES[translation.language]}
                  </Badge>

                  {translation.qualityMetrics && (
                    <QualityBadge score={translation.qualityMetrics.overall} />
                  )}

                  {translation.status === 'PUBLISHED' && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      منشور
                    </Badge>
                  )}

                  {translation.isAutoTranslated && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      🤖 AI
                    </Badge>
                  )}

                  {translation.needsReview && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      ⚠️ يحتاج مراجعة
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  {translation.readingTime > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {translation.readingTime} دقائق قراءة
                    </span>
                  )}
                  {translation.wordCount > 0 && (
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {translation.wordCount} كلمة
                    </span>
                  )}
                  {translation.updatedAt && (
                    <span>آخر تحديث: {formatDate(translation.updatedAt)}</span>
                  )}
                  {translation.wordpressPostId && (
                    <span className="flex items-center gap-1">
                      WordPress #{translation.wordpressPostId}
                    </span>
                  )}
                </div>
              </DialogDescription>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(translation)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  تعديل
                </Button>
              )}
              {onPublish && translation.status !== 'PUBLISHED' && (
                <Button
                  size="sm"
                  onClick={() => onPublish(translation)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  نشر
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              معاينة
            </TabsTrigger>
            <TabsTrigger value="raw">
              <Code className="h-4 w-4 mr-2" />
              نص خام
            </TabsTrigger>
            <TabsTrigger value="metadata">
              <FileText className="h-4 w-4 mr-2" />
              البيانات الوصفية
            </TabsTrigger>
            {translation.qualityMetrics && (
              <TabsTrigger value="quality">
                📊 الجودة
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            {/* Preview Tab */}
            <TabsContent value="preview" className="mt-0 space-y-4">
              {/* Excerpt */}
              {translation.excerpt && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-semibold mb-2">المقتطف</p>
                  <p className="text-muted-foreground italic">
                    {translation.excerpt}
                  </p>
                </div>
              )}

              {/* Content */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div
                  dangerouslySetInnerHTML={{ __html: translation.content }}
                  className="text-foreground"
                />
              </div>
            </TabsContent>

            {/* Raw Text Tab */}
            <TabsContent value="raw" className="mt-0">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyContent}
                  className="absolute top-2 right-2 z-10"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  نسخ
                </Button>
                <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
                  {translation.content}
                </pre>
              </div>
            </TabsContent>

            {/* Metadata Tab */}
            <TabsContent value="metadata" className="mt-0 space-y-4">
              <div className="grid gap-4">
                {/* Meta Title */}
                {translation.metaTitle && (
                  <div>
                    <p className="text-sm font-semibold mb-1">عنوان SEO</p>
                    <p className="text-sm text-muted-foreground bg-muted rounded p-2">
                      {translation.metaTitle}
                    </p>
                  </div>
                )}

                {/* Meta Description */}
                {translation.metaDescription && (
                  <div>
                    <p className="text-sm font-semibold mb-1">وصف SEO</p>
                    <p className="text-sm text-muted-foreground bg-muted rounded p-2">
                      {translation.metaDescription}
                    </p>
                  </div>
                )}

                {/* Slug */}
                <div>
                  <p className="text-sm font-semibold mb-1">Slug</p>
                  <code className="text-sm bg-muted rounded px-2 py-1">
                    {translation.slug}
                  </code>
                </div>

                {/* WordPress Info */}
                {translation.wordpressPostId && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-semibold mb-2">معلومات WordPress</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Post ID:</span>
                        <span className="font-mono">{translation.wordpressPostId}</span>
                      </div>
                      {translation.wordpressUrl && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">URL:</span>
                          <a
                            href={translation.wordpressUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            فتح
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      {translation.publishedToWpAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">تاريخ النشر:</span>
                          <span>{formatDate(translation.publishedToWpAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold mb-2">التواريخ</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                      <span>{formatDate(translation.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">آخر تحديث:</span>
                      <span>{formatDate(translation.updatedAt)}</span>
                    </div>
                    {translation.translatedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">تاريخ الترجمة:</span>
                        <span>{formatDate(translation.translatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Quality Tab */}
            {translation.qualityMetrics && (
              <TabsContent value="quality" className="mt-0">
                <QualityMetrics
                  metrics={translation.qualityMetrics}
                  showSuggestions={true}
                />
              </TabsContent>
            )}
          </div>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyContent}>
              <Copy className="h-4 w-4 mr-2" />
              نسخ المحتوى
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              تحميل
            </Button>
          </div>

          {translation.wordpressUrl && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={translation.wordpressUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                فتح في WordPress
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
