'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArticleCard,
  ArticlesFilters,
  BulkActions,
  TranslationPreviewModal,
} from '@/components/articles';
import {
  useArticles,
  useDeleteArticle,
  useGenerateTranslation,
  useBulkActions,
} from '@/hooks/use-articles';
import type {
  ArticleFilters,
  ArticleViewMode,
  EnhancedArticle,
  EnhancedTranslation,
  Language,
  BulkActionType,
} from '@/types/api';
import {
  LayoutGrid,
  List,
  Maximize2,
  Minimize2,
  Plus,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ArticlesPage() {
  const t = useTranslations();

  // State Management
  const [filters, setFilters] = useState<ArticleFilters>({
    page: 1,
    limit: 12,
  });
  const [viewMode, setViewMode] = useState<ArticleViewMode>('GRID' as ArticleViewMode);
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
  const [previewTranslation, setPreviewTranslation] = useState<EnhancedTranslation | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Queries and Mutations
  const { data, isLoading, error, refetch } = useArticles(filters);
  const deleteArticle = useDeleteArticle();
  const generateTranslation = useGenerateTranslation();
  const bulkActions = useBulkActions();

  // Handlers
  const handleFilterChange = (newFilters: ArticleFilters) => {
    setFilters({ ...newFilters, page: 1 });
    setSelectedArticles([]);
  };

  const handleResetFilters = () => {
    setFilters({ page: 1, limit: filters.limit });
    setSelectedArticles([]);
  };

  const handleToggleSelection = (articleId: number) => {
    setSelectedArticles((prev) =>
      prev.includes(articleId)
        ? prev.filter((id) => id !== articleId)
        : [...prev, articleId]
    );
  };

  const handleSelectAll = () => {
    if (!data?.data) return;

    if (selectedArticles.length === data.data.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(data.data.map((a) => a.id));
    }
  };

  const handleGenerateTranslation = async (article: EnhancedArticle, language: Language) => {
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

  const handleDeleteArticle = async (article: EnhancedArticle) => {
    if (!confirm(`هل أنت متأكد من حذف المقالة "${article.title}"؟`)) return;

    try {
      await deleteArticle.mutateAsync(article.id);
      toast.success('تم حذف المقالة');
      setSelectedArticles((prev) => prev.filter((id) => id !== article.id));
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'فشل حذف المقالة');
    }
  };

  const handleViewTranslation = (translation: EnhancedTranslation) => {
    setPreviewTranslation(translation);
    setPreviewModalOpen(true);
  };

  const handleBulkAction = async (
    action: BulkActionType,
    options?: { targetLanguage?: Language; categoryId?: number }
  ) => {
    if (selectedArticles.length === 0) {
      toast.error('لم يتم تحديد أي مقالات');
      return;
    }

    try {
      const result = await bulkActions.mutateAsync({
        action,
        articleIds: selectedArticles,
        ...options,
      });

      const responseData = result.data || result;
      toast.success(
        `تم تنفيذ الإجراء على ${responseData.succeeded || responseData.processed || 0} مقالة${
          responseData.failed > 0 ? ` (فشل ${responseData.failed})` : ''
        }`
      );

      setSelectedArticles([]);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'فشل تنفيذ الإجراء');
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Computed Values
  const isCompact = viewMode === 'COMPACT';
  const isGrid = viewMode === 'GRID';
  const totalPages = data?.pagination?.pages || 1;
  const currentPage = filters.page || 1;

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">📝 {t('common.articles')}</h1>
          <p className="text-muted-foreground mt-1">
            {data?.pagination?.total || 0} {t('common.article')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'COMPACT' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('COMPACT' as ArticleViewMode)}
              className="h-8 px-2"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'LIST' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('LIST' as ArticleViewMode)}
              className="h-8 px-2"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'GRID' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('GRID' as ArticleViewMode)}
              className="h-8 px-2"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'EXPANDED' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('EXPANDED' as ArticleViewMode)}
              className="h-8 px-2"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* New Article Button */}
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t('common.new')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ArticlesFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Select All */}
      {data && data.data.length > 0 && (
        <div className="flex items-center gap-3 px-2">
          <input
            type="checkbox"
            checked={
              selectedArticles.length === data.data.length &&
              data.data.length > 0
            }
            onChange={handleSelectAll}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm text-muted-foreground">
            {selectedArticles.length > 0
              ? `تم تحديد ${selectedArticles.length} من ${data.data.length}`
              : 'تحديد الكل'}
          </span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className={isGrid ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-48 w-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('common.error')}</h3>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'حدث خطأ أثناء تحميل المقالات'}
          </p>
          <Button onClick={() => refetch()}>{t('common.retry')}</Button>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && data?.data.length === 0 && (
        <Card className="p-12 text-center">
          <Inbox className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">لا توجد مقالات</h3>
          <p className="text-muted-foreground mb-6">
            {Object.keys(filters).length > 2
              ? 'جرب تغيير الفلاتر للعثور على مقالات'
              : 'ابدأ بإنشاء مقالتك الأولى'}
          </p>
          {Object.keys(filters).length > 2 ? (
            <Button variant="outline" onClick={handleResetFilters}>
              إعادة تعيين الفلاتر
            </Button>
          ) : (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              مقالة جديدة
            </Button>
          )}
        </Card>
      )}

      {/* Articles Grid/List */}
      {!isLoading && !error && data && data.data.length > 0 && (
        <div
          className={
            isGrid
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {data.data.map((article) => (
            <div key={article.id} className="flex items-start gap-3">
              {/* Selection Checkbox */}
              <input
                type="checkbox"
                checked={selectedArticles.includes(article.id)}
                onChange={() => handleToggleSelection(article.id)}
                className="mt-4 h-4 w-4 rounded border-gray-300 flex-shrink-0"
              />

              {/* Article Card */}
              <div className="flex-1 min-w-0">
                <ArticleCard
                  article={article}
                  compact={isCompact}
                  onGenerateTranslation={handleGenerateTranslation}
                  onDelete={handleDeleteArticle}
                  onViewTranslation={handleViewTranslation}
                  displayOptions={{
                    showAnalytics: !isCompact,
                    showQualityMetrics: !isCompact,
                    showTranslationProgress: true,
                    showPrimaryImage: !isCompact,
                    enableQuickActions: true,
                    enablePreview: true,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && data && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            السابق
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {currentPage > 2 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                >
                  1
                </Button>
                {currentPage > 3 && <span className="px-2">...</span>}
              </>
            )}

            {currentPage > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
              >
                {currentPage - 1}
              </Button>
            )}

            <Button variant="default" size="sm">
              {currentPage}
            </Button>

            {currentPage < totalPages && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
              >
                {currentPage + 1}
              </Button>
            )}

            {currentPage < totalPages - 1 && (
              <>
                {currentPage < totalPages - 2 && <span className="px-2">...</span>}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            التالي
          </Button>
        </div>
      )}

      {/* Bulk Actions Bar */}
      <BulkActions
        selectedCount={selectedArticles.length}
        onAction={handleBulkAction}
        onClearSelection={() => setSelectedArticles([])}
      />

      {/* Translation Preview Modal */}
      <TranslationPreviewModal
        translation={previewTranslation}
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
      />
    </div>
  );
}
