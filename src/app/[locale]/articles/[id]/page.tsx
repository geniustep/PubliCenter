'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { TranslationProgressBar } from '@/components/articles/translation-progress-bar';
import { TranslationItem } from '@/components/articles/translation-item';
import { TranslationPreviewModal } from '@/components/articles/translation-preview-modal';
import { useArticle, useDeleteArticle, useGenerateTranslation } from '@/hooks/use-articles';
import type { EnhancedTranslation, Language } from '@/types/api';
import {
  ArrowRight,
  Edit,
  Trash2,
  Sparkles,
  Clock,
  User,
  Folder,
  Image as ImageIcon,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

const LANGUAGE_FLAGS: Record<Language, string> = {
  AR: '🇸🇦',
  EN: '🇬🇧',
  FR: '🇫🇷',
  ES: '🇪🇸',
};

function formatDate(date: Date | string) {
  const d = new Date(date);
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function formatTime(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `منذ ${days} يوم${days > 1 ? 'ين' : ''}`;
  if (hours > 0) return `منذ ${hours} ساعة${hours > 1 ? 'ات' : ''}`;
  if (minutes > 0) return `منذ ${minutes} دقيقة${minutes > 1 ? 'ات' : ''}`;
  return 'الآن';
}

export default function ArticleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const locale = params.locale as string;
  const articleId = parseInt(params.id as string);

  const { data: article, isLoading, error, refetch } = useArticle(isNaN(articleId) ? null : articleId);
  const deleteArticle = useDeleteArticle();
  const generateTranslation = useGenerateTranslation();

  const [previewTranslation, setPreviewTranslation] = useState<EnhancedTranslation | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const handleDelete = async () => {
    if (!article) return;
    if (!confirm(`هل أنت متأكد من حذف المقالة "${article.title}"؟`)) return;

    try {
      await deleteArticle.mutateAsync(article.id);
      toast.success('تم حذف المقالة');
      router.push(`/${locale}/articles`);
    } catch (error: any) {
      toast.error(error.message || 'فشل حذف المقالة');
    }
  };

  const handleGenerateTranslation = async (language: Language) => {
    if (!article) return;

    try {
      await generateTranslation.mutateAsync({
        articleId: article.id,
        targetLanguage: language,
      });
      toast.success(`تم توليد الترجمة إلى ${language}`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'فشل توليد الترجمة');
    }
  };

  const handleViewTranslation = (translation: EnhancedTranslation) => {
    setPreviewTranslation(translation);
    setPreviewModalOpen(true);
  };

  if (isNaN(articleId)) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto py-6 px-4">
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">معرف المقال غير صحيح</h3>
                <Button onClick={() => router.push(`/${locale}/articles`)}>
                  العودة إلى المقالات
                </Button>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto py-6 px-4 space-y-6">
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto py-6 px-4">
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {error instanceof Error ? error.message : 'المقالة غير موجودة'}
                </h3>
                <Button onClick={() => router.push(`/${locale}/articles`)}>
                  العودة إلى المقالات
                </Button>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto py-6 px-4 space-y-6">
            {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href={`/${locale}/articles`} className="hover:text-foreground">
                {t('nav.articles')}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{article.title || 'بدون عنوان'}</span>
            </div>

            {/* Header Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => router.push(`/${locale}/articles`)}>
                  <ArrowRight className="h-4 w-4 ml-2 rotate-180" />
                  العودة
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">
                  <Edit className="h-4 w-4 ml-2" />
                  {t('common.edit')}
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 ml-2" />
                  {t('common.delete')}
                </Button>
              </div>
            </div>

            {/* Article Content */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Article Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      {article.sourceLanguage && (
                        <span className="text-4xl">{LANGUAGE_FLAGS[article.sourceLanguage]}</span>
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-3xl mb-4">{article.title || 'بدون عنوان'}</CardTitle>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <Badge variant="outline">{article.status || 'DRAFT'}</Badge>
                          {article.category && (
                            <span className="flex items-center gap-1">
                              <Folder className="h-4 w-4" />
                              {article.category.name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(article.createdAt || new Date())}
                          </span>
                          {article.author && (
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {article.author.name || article.author.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Primary Image */}
                    {article.primaryImage ? (
                      <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
                        <Image
                          src={article.primaryImage.url}
                          alt={article.primaryImage.alt || article.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : article.images && article.images.length > 0 ? (
                      <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
                        <Image
                          src={article.images[0].url}
                          alt={article.images[0].alt || article.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : null}

                    {/* Excerpt */}
                    {article.excerpt && (
                      <div className="text-lg text-muted-foreground leading-relaxed">
                        {article.excerpt}
                      </div>
                    )}

                    <Separator />

                    {/* Content */}
                    {article.content && (
                      <div
                        className="prose prose-lg max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                      />
                    )}

                    {/* Images */}
                    {article.images && article.images.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <ImageIcon className="h-5 w-5" />
                          الصور ({article.images.length})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {article.images.map((img) => (
                            <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden">
                              <Image
                                src={img.url}
                                alt={img.alt || ''}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
                      {article.createdAt && (
                        <div className="flex items-center justify-between">
                          <span>تاريخ الإنشاء:</span>
                          <span>{formatDate(article.createdAt)}</span>
                        </div>
                      )}
                      {article.updatedAt && (
                        <div className="flex items-center justify-between">
                          <span>آخر تحديث:</span>
                          <span>{formatDate(article.updatedAt)}</span>
                        </div>
                      )}
                      {article.publishedAt && (
                        <div className="flex items-center justify-between">
                          <span>تاريخ النشر:</span>
                          <span>{formatDate(article.publishedAt)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Translation Progress */}
                {article.translationProgress && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">تقدم الترجمة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TranslationProgressBar
                        progress={article.translationProgress}
                        showDetails={true}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Translations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">الترجمات</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {article.enhancedTranslations && article.enhancedTranslations.length > 0 ? (
                      article.enhancedTranslations.map((translation) => (
                        <TranslationItem
                          key={translation.id}
                          translation={translation}
                          onPreview={() => handleViewTranslation(translation)}
                        />
                      ))
                    ) : article.translations && article.translations.length > 0 ? (
                      article.translations.map((translation) => (
                        <div key={translation.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{translation.language}</span>
                            <Badge variant="outline">{translation.status}</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        لا توجد ترجمات
                      </p>
                    )}

                    {/* Missing Languages */}
                    {article.translationProgress?.missingLanguages && article.translationProgress.missingLanguages.length > 0 && (
                      <div className="pt-4 border-t space-y-2">
                        <p className="text-sm font-medium">ترجمات مفقودة:</p>
                        {article.translationProgress.missingLanguages.map((lang) => (
                          <Button
                            key={lang}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => handleGenerateTranslation(lang)}
                          >
                            <Sparkles className="h-4 w-4 ml-2" />
                            توليد ترجمة إلى {LANGUAGE_FLAGS[lang]} {lang}
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Analytics */}
                {article.analytics && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">التحليلات</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">المشاهدات:</span>
                        <span className="font-medium">{article.analytics?.views || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">المشاركات:</span>
                        <span className="font-medium">{article.analytics?.shares || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">التعليقات:</span>
                        <span className="font-medium">{article.analytics?.comments || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">الإعجابات:</span>
                        <span className="font-medium">{article.analytics?.likes || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">وقت القراءة:</span>
                        <span className="font-medium">{article.analytics?.readingTime || 0} دقيقة</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Translation Preview Modal */}
      <TranslationPreviewModal
        translation={previewTranslation}
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
      />
    </div>
  );
}

