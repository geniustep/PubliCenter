import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ArticleFilters,
  EnhancedArticle,
  EnhancedArticlesResponse,
  BulkActionRequest,
  BulkActionResponseType,
  TranslationGenerationOptions,
  ArticleImportOptions,
} from '@/types/api';

/**
 * Hook للحصول على قائمة المقالات المحسّنة
 */
export function useArticles(filters?: ArticleFilters) {
  return useQuery({
    queryKey: ['articles', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.sourceLanguage) params.append('sourceLanguage', filters.sourceLanguage);
      if (filters?.translationStatus) params.append('translationStatus', filters.translationStatus);
      if (filters?.languages?.length) params.append('languages', filters.languages.join(','));
      if (filters?.qualityMin) params.append('qualityMin', filters.qualityMin.toString());
      if (filters?.qualityMax) params.append('qualityMax', filters.qualityMax.toString());
      if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);
      if (filters?.trending !== undefined) params.append('trending', filters.trending.toString());
      if (filters?.hasImages !== undefined) params.append('hasImages', filters.hasImages.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);

      const response = await fetch(`/api/articles?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch articles');
      }

      return response.json() as Promise<EnhancedArticlesResponse>;
    },
  });
}

/**
 * Hook للحصول على مقالة محددة
 */
export function useArticle(id: number | null) {
  return useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      if (!id) throw new Error('Article ID is required');

      const response = await fetch(`/api/articles/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch article');
      }

      const result = await response.json();
      return result.data as EnhancedArticle;
    },
    enabled: !!id,
  });
}

/**
 * Hook لتوليد ترجمة جديدة
 */
export function useGenerateTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: TranslationGenerationOptions) => {
      const response = await fetch('/api/translations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate translation');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['article', variables.articleId] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

/**
 * Hook لتحديث ترجمة موجودة
 */
export function useUpdateTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, articleId, ...data }: any) => {
      const response = await fetch(`/api/translations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update translation');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      if (variables.articleId) {
        queryClient.invalidateQueries({ queryKey: ['article', variables.articleId] });
      }
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

/**
 * Hook لحذف مقالة
 */
export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete article');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

/**
 * Hook للإجراءات الجماعية على المقالات
 */
export function useBulkActions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: BulkActionRequest) => {
      const response = await fetch('/api/articles/bulk-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Bulk action failed');
      }

      return response.json() as Promise<BulkActionResponseType>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

/**
 * Hook لمعاينة استيراد من WordPress
 */
export function useImportPreview(wpSiteId: number | null) {
  return useQuery({
    queryKey: ['import-preview', wpSiteId],
    queryFn: async () => {
      if (!wpSiteId) throw new Error('WordPress site ID is required');

      const response = await fetch(`/api/wordpress-sites/${wpSiteId}/preview-import`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch import preview');
      }

      return response.json();
    },
    enabled: !!wpSiteId,
  });
}

/**
 * Hook لاستيراد مقالات من WordPress
 */
export function useImportArticles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: ArticleImportOptions) => {
      const { wpSiteId, ...importOptions } = options;

      const response = await fetch(`/api/wordpress-sites/${wpSiteId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(importOptions),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['wordpress-sites'] });
    },
  });
}

/**
 * Hook للحصول على جودة الترجمة
 */
export function useTranslationQuality(translationId: number | null) {
  return useQuery({
    queryKey: ['translation-quality', translationId],
    queryFn: async () => {
      if (!translationId) throw new Error('Translation ID is required');

      const response = await fetch(`/api/translations/${translationId}/quality`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch translation quality');
      }

      return response.json();
    },
    enabled: !!translationId,
  });
}
