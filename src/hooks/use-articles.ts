import { useQuery } from '@tanstack/react-query';
import { ArticlesResponse, ArticleFilters } from '@/types/api';

const fetchArticles = async (filters: ArticleFilters = {}): Promise<ArticlesResponse> => {
  const params = new URLSearchParams();

  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
  if (filters.authorId) params.append('authorId', filters.authorId);
  if (filters.search) params.append('search', filters.search);

  const response = await fetch(`/api/articles?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch articles');
  }

  return response.json();
};

export const useArticles = (filters: ArticleFilters = {}) => {
  return useQuery({
    queryKey: ['articles', filters],
    queryFn: () => fetchArticles(filters),
    select: (data) => ({
      articles: data.data,
      pagination: data.pagination,
    }),
  });
};
