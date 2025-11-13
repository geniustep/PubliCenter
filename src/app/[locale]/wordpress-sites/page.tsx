'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { useWordPressSites } from '@/hooks/use-wordpress-sites';
import { WordPressSiteCard } from '@/components/wordpress/wordpress-site-card';
import { WordPressSiteDialog } from '@/components/wordpress/wordpress-site-dialog';
import { WordPressSyncDialog } from '@/components/wordpress/wordpress-sync-dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Filter, RefreshCw, Server } from 'lucide-react';
import type { WordPressSite, Language, TranslationPlugin } from '@/types/api';
import { Pagination } from '@/components/ui/pagination';

export default function WordPressSitesPage() {
  const t = useTranslations();

  // State
  const [page, setPage] = useState(1);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [languageFilter, setLanguageFilter] = useState<Language | undefined>(undefined);
  const [pluginFilter, setPluginFilter] = useState<TranslationPlugin | undefined>(undefined);

  // Dialogs
  const [showSiteDialog, setShowSiteDialog] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [selectedSite, setSelectedSite] = useState<WordPressSite | null>(null);

  // Fetch data
  const { data, isLoading, error, refetch } = useWordPressSites({
    page,
    limit: 12,
    isActive: isActiveFilter,
    language: languageFilter,
    translationPlugin: pluginFilter,
  });

  const handleAddSite = () => {
    setSelectedSite(null);
    setShowSiteDialog(true);
  };

  const handleEditSite = (site: WordPressSite) => {
    setSelectedSite(site);
    setShowSiteDialog(true);
  };

  const handleSyncSite = (site: WordPressSite) => {
    setSelectedSite(site);
    setShowSyncDialog(true);
  };

  const handleClearFilters = () => {
    setIsActiveFilter(undefined);
    setLanguageFilter(undefined);
    setPluginFilter(undefined);
    setPage(1);
  };

  const hasFilters = isActiveFilter !== undefined || languageFilter || pluginFilter;

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Server className="h-8 w-8 text-primary" />
                  {t('wordpress.title')}
                </h1>
                <p className="text-muted-foreground mt-2">
                  إدارة ومزامنة مواقع WordPress المتصلة
                </p>
              </div>
              <Button onClick={handleAddSite} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                {t('wordpress.addSite')}
              </Button>
            </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center p-6 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{t('articles.filters.filterBy')}:</span>
        </div>

        {/* Active Status */}
        <Select
          value={isActiveFilter === undefined ? 'all' : isActiveFilter.toString()}
          onValueChange={(value) => {
            setIsActiveFilter(value === 'all' ? undefined : value === 'true');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('articles.filters.all')}</SelectItem>
            <SelectItem value="true">{t('wordpress.active')}</SelectItem>
            <SelectItem value="false">{t('wordpress.inactive')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Language */}
        <Select
          value={languageFilter || 'all'}
          onValueChange={(value) => {
            setLanguageFilter(value === 'all' ? undefined : (value as Language));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('articles.filters.all')} - اللغات</SelectItem>
            <SelectItem value="AR">{t('languages.ar')}</SelectItem>
            <SelectItem value="EN">{t('languages.en')}</SelectItem>
            <SelectItem value="FR">{t('languages.fr')}</SelectItem>
            <SelectItem value="ES">{t('languages.es')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Plugin */}
        <Select
          value={pluginFilter || 'all'}
          onValueChange={(value) => {
            setPluginFilter(value === 'all' ? undefined : (value as TranslationPlugin));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('articles.filters.all')} - البلوجنات</SelectItem>
            <SelectItem value="WPML">WPML</SelectItem>
            <SelectItem value="POLYLANG">Polylang</SelectItem>
            <SelectItem value="TRANSLATEPRESS">TranslatePress</SelectItem>
            <SelectItem value="WEGLOT">Weglot</SelectItem>
            <SelectItem value="LOCO_TRANSLATE">Loco Translate</SelectItem>
            <SelectItem value="QTRANSLATE_XT">qTranslate-XT</SelectItem>
            <SelectItem value="NONE">{t('wordpress.plugins.NONE')}</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            مسح الفلاتر
          </Button>
        )}

        <div className="mr-auto">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[350px]" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">{error.message}</p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            حاول مرة أخرى
          </Button>
        </div>
      ) : data && data.data.length > 0 ? (
        <>
          {/* Results Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              عرض {((page - 1) * 12) + 1} - {Math.min(page * 12, data.pagination.total)} من {data.pagination.total} موقع
            </span>
            <span>
              الصفحة {page} من {data.pagination.pages}
            </span>
          </div>

          {/* Sites Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.data.map((site) => (
              <WordPressSiteCard
                key={site.id}
                site={site}
                onEdit={handleEditSite}
                onSync={handleSyncSite}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.pagination.pages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={data.pagination.pages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <Server className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('wordpress.noSites')}</h3>
          <p className="text-muted-foreground mb-6">
            {t('wordpress.addFirstSite')}
          </p>
          <Button onClick={handleAddSite} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            {t('wordpress.addSite')}
          </Button>
        </div>
      )}

            {/* Dialogs */}
            <WordPressSiteDialog
              open={showSiteDialog}
              onOpenChange={setShowSiteDialog}
              site={selectedSite}
            />

            <WordPressSyncDialog
              open={showSyncDialog}
              onOpenChange={setShowSyncDialog}
              site={selectedSite}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
