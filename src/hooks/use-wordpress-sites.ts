import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateWordPressSiteRequest,
  UpdateWordPressSiteRequest,
  WordPressSiteFilters,
  WordPressSitesResponse,
  WordPressSiteResponse,
  WordPressSyncResponse,
} from '@/types/api';

/**
 * Hook للحصول على قائمة مواقع WordPress
 */
export function useWordPressSites(filters?: WordPressSiteFilters) {
  return useQuery({
    queryKey: ['wordpress-sites', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters?.language) params.append('language', filters.language);
      if (filters?.translationPlugin) params.append('translationPlugin', filters.translationPlugin);

      const response = await fetch(`/api/wordpress-sites?${params}`, {
        credentials: 'include', // Include cookies for authentication
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch WordPress sites');
      }
      return response.json() as Promise<WordPressSitesResponse>;
    },
  });
}

/**
 * Hook للحصول على موقع WordPress محدد
 */
export function useWordPressSite(id: number | null) {
  return useQuery({
    queryKey: ['wordpress-site', id],
    queryFn: async () => {
      if (!id) throw new Error('Site ID is required');
      const response = await fetch(`/api/wordpress-sites/${id}`, {
        credentials: 'include', // Include cookies for authentication
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch WordPress site');
      }
      const result = await response.json() as WordPressSiteResponse;
      return result.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook لإضافة موقع WordPress جديد
 */
export function useCreateWordPressSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWordPressSiteRequest) => {
      console.log('🟢 [Frontend] Sending POST request to /api/wordpress-sites');
      console.log('📤 [Frontend] Request payload:', {
        name: data.name,
        url: data.url,
        language: data.language,
        username: data.username,
        appPassword: data.appPassword ? `[HIDDEN - Length: ${data.appPassword.length}]` : undefined,
      });

      const response = await fetch('/api/wordpress-sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(data),
      });

      console.log('📥 [Frontend] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ [Frontend] Error response:', error);
        throw new Error(error.error || 'Failed to create WordPress site');
      }

      const result = await response.json();
      console.log('✅ [Frontend] Success response:', {
        success: result.success,
        siteId: result.data?.site?.id,
        siteName: result.data?.site?.name,
        pluginDetected: result.data?.pluginDetected,
        message: result.data?.message,
      });

      return result as WordPressSiteResponse;
    },
    onSuccess: () => {
      console.log('🔄 [Frontend] Invalidating wordpress-sites query cache');
      queryClient.invalidateQueries({ queryKey: ['wordpress-sites'] });
    },
  });
}

/**
 * Hook لتحديث موقع WordPress
 */
export function useUpdateWordPressSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateWordPressSiteRequest }) => {
      const response = await fetch(`/api/wordpress-sites/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update WordPress site');
      }

      return response.json() as Promise<WordPressSiteResponse>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wordpress-sites'] });
      queryClient.invalidateQueries({ queryKey: ['wordpress-site', variables.id] });
    },
  });
}

/**
 * Hook لحذف موقع WordPress
 */
export function useDeleteWordPressSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/wordpress-sites/${id}`, {
        method: 'DELETE',
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.details || 'Failed to delete WordPress site');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wordpress-sites'] });
    },
  });
}

/**
 * Hook لاختبار اتصال موقع WordPress
 */
export function useTestWordPressSiteConnection() {
  return useMutation({
    mutationFn: async ({ id, appPassword }: { id: number; appPassword: string }) => {
      const response = await fetch(`/api/wordpress-sites/${id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ appPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Connection test failed');
      }

      return response.json();
    },
  });
}

/**
 * Hook لكشف بلوجن الترجمة
 */
export function useDetectWordPressPlugin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, appPassword }: { id: number; appPassword: string }) => {
      const response = await fetch(`/api/wordpress-sites/${id}/detect-plugin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ appPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Plugin detection failed');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wordpress-site', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['wordpress-sites'] });
    },
  });
}

/**
 * Hook لمزامنة مقالات WordPress
 */
export function useSyncWordPressSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      appPassword,
      syncMode = 'incremental',
      languages = [],
    }: {
      id: number;
      appPassword?: string;
      syncMode?: 'full' | 'incremental';
      languages?: string[];
    }) => {
      const response = await fetch(`/api/wordpress-sites/${id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ appPassword, syncMode, languages }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }

      return response.json() as Promise<WordPressSyncResponse>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wordpress-site', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['wordpress-sites'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}
