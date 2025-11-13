'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { useWordPressSite } from '@/hooks/use-wordpress-sites';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import {
  ArrowLeft,
  Globe,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Server,
  Plug,
  ExternalLink,
  Edit,
  Trash2,
  TestTube,
} from 'lucide-react';
import { format } from 'date-fns';
import { WordPressSiteDialog } from '@/components/wordpress/wordpress-site-dialog';
import { WordPressSyncDialog } from '@/components/wordpress/wordpress-sync-dialog';
import { useState } from 'react';
import { useDeleteWordPressSite, useTestWordPressSiteConnection, useDetectWordPressPlugin } from '@/hooks/use-wordpress-sites';
import { toast } from 'sonner';
import { TranslationPlugin, SyncStatus } from '@/types/api';

export default function WordPressSiteDetailPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const siteId = parseInt(params.id as string);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);

  const { data: site, isLoading, error, refetch } = useWordPressSite(siteId);
  const deleteSite = useDeleteWordPressSite();
  const testConnection = useTestWordPressSiteConnection();
  const detectPlugin = useDetectWordPressPlugin();

  const handleDelete = async () => {
    if (!site) return;
    
    if (!confirm(t('wordpress.deleteConfirm'))) {
      return;
    }

    try {
      await deleteSite.mutateAsync(site.id);
      toast.success(t('wordpress.deleteSuccess'));
      router.push('/wordpress-sites');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('wordpress.deleteError'));
    }
  };

  const handleTestConnection = async () => {
    if (!site) return;

    try {
      await testConnection.mutateAsync({
        id: site.id,
        appPassword: '', // Will use stored password
      });
      toast.success(t('wordpress.testSuccess'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('wordpress.testError'));
    }
  };

  const handleDetectPlugin = async () => {
    if (!site) return;

    try {
      await detectPlugin.mutateAsync({
        id: site.id,
        appPassword: '', // Will use stored password
      });
      toast.success(t('wordpress.pluginDetected'));
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('wordpress.pluginDetectionError'));
    }
  };

  const getStatusBadge = (status: SyncStatus | null) => {
    switch (status) {
      case SyncStatus.SUCCESS:
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t('wordpress.syncStatus.success')}
          </Badge>
        );
      case SyncStatus.FAILED:
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            {t('wordpress.syncStatus.failed')}
          </Badge>
        );
      case SyncStatus.SYNCING:
        return (
          <Badge variant="secondary">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            {t('wordpress.syncStatus.inProgress')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {t('wordpress.syncStatus.never')}
          </Badge>
        );
    }
  };

  const getPluginBadge = (plugin: TranslationPlugin) => {
    const pluginColors: Record<TranslationPlugin, string> = {
      NONE: 'bg-gray-100 text-gray-800',
      WPML: 'bg-blue-100 text-blue-800',
      POLYLANG: 'bg-purple-100 text-purple-800',
      TRANSLATEPRESS: 'bg-green-100 text-green-800',
      WEGLOT: 'bg-orange-100 text-orange-800',
      LOCO_TRANSLATE: 'bg-pink-100 text-pink-800',
      QTRANSLATE_XT: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <Badge className={pluginColors[plugin] || pluginColors.NONE}>
        <Plug className="h-3 w-3 mr-1" />
        {t(`wordpress.plugins.${plugin}`)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="container py-8">
              <Skeleton className="h-8 w-64 mb-4" />
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="container py-8">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                  <p className="text-destructive mb-4">
                    {error?.message || t('wordpress.siteNotFound')}
                  </p>
                  <Button onClick={() => router.push('/wordpress-sites')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('common.back')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/wordpress-sites')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('common.back')}
                </Button>
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Server className="h-8 w-8 text-primary" />
                    {site.name}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {site.url}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t('common.edit')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSyncDialog(true)}
                  disabled={!site.isActive}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('wordpress.sync')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteSite.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('common.delete')}
                </Button>
              </div>
            </div>

            {/* Main Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Site Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {t('wordpress.status')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t('wordpress.active')}
                      </span>
                      {site.isActive ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {t('common.yes')}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          {t('common.no')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t('wordpress.language')}
                      </span>
                      <Badge variant="outline">
                        {t(`languages.${site.language.toLowerCase()}`)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plugin Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plug className="h-5 w-5" />
                    {t('wordpress.plugin')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getPluginBadge(site.translationPlugin)}
                    {site.pluginVersion && (
                      <div className="text-sm text-muted-foreground">
                        {t('wordpress.version')}: {site.pluginVersion}
                      </div>
                    )}
                    {site.supportedLanguages && site.supportedLanguages.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {site.supportedLanguages.map((lang) => (
                          <Badge key={lang} variant="outline" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Sync Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    {t('wordpress.syncStatus.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {getStatusBadge(site.lastSyncStatus)}
                    {site.lastSync && (
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(site.lastSync), 'PPpp')}
                      </div>
                    )}
                    {site.lastSyncError && (
                      <div className="text-sm text-destructive flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        {site.lastSyncError}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('wordpress.statistics')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{site.totalArticles || 0}</div>
                    <div className="text-sm text-muted-foreground">
                      {t('wordpress.totalArticles')}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{site.syncedArticles || 0}</div>
                    <div className="text-sm text-muted-foreground">
                      {t('wordpress.syncedArticles')}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{site._count?.translations || 0}</div>
                    <div className="text-sm text-muted-foreground">
                      {t('articles.translations')}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {site.supportedLanguages?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('wordpress.supportedLanguages')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('wordpress.actions')}</CardTitle>
                <CardDescription>{t('wordpress.actionsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testConnection.isPending}
                  >
                    {testConnection.isPending ? (
                      <Spinner size="sm" className="mr-2" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    {t('wordpress.testConnection')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDetectPlugin}
                    disabled={detectPlugin.isPending}
                  >
                    {detectPlugin.isPending ? (
                      <Spinner size="sm" className="mr-2" />
                    ) : (
                      <Plug className="h-4 w-4 mr-2" />
                    )}
                    {t('wordpress.detectPlugin')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(site.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('wordpress.visitSite')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Site Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('wordpress.details')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-1">
                        {t('wordpress.siteName')}
                      </div>
                      <div className="text-sm text-muted-foreground">{site.name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">
                        {t('wordpress.siteUrl')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <a
                          href={site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-1"
                        >
                          {site.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">
                        {t('wordpress.username')}
                      </div>
                      <div className="text-sm text-muted-foreground">{site.username}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">
                        {t('wordpress.createdAt')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(site.createdAt), 'PPpp')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">
                        {t('wordpress.updatedAt')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(site.updatedAt), 'PPpp')}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <WordPressSiteDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        site={site}
      />

      <WordPressSyncDialog
        open={showSyncDialog}
        onOpenChange={setShowSyncDialog}
        site={site}
      />
    </div>
  );
}

