'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteWordPressSite } from '@/hooks/use-wordpress-sites';
import { toast } from 'sonner';
import {
  MoreVertical,
  Globe,
  Calendar,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Trash2,
  Edit,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import type { WordPressSite, TranslationPlugin, SyncStatus } from '@/types/api';

interface WordPressSiteCardProps {
  site: WordPressSite;
  onEdit?: (site: WordPressSite) => void;
  onSync?: (site: WordPressSite) => void;
}

export function WordPressSiteCard({ site, onEdit, onSync }: WordPressSiteCardProps) {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [forceDelete, setForceDelete] = useState(false);
  const deleteSite = useDeleteWordPressSite();

  const hasTranslations = (site._count?.translations ?? 0) > 0;

  const handleDelete = async () => {
    try {
      await deleteSite.mutateAsync({ id: site.id, force: forceDelete });
      toast.success(t('wordpress.deleteSuccess'));
      setShowDeleteDialog(false);
      setForceDelete(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('wordpress.deleteError');
      toast.error(errorMessage);

      // If error mentions translations, keep dialog open and suggest force delete
      if (errorMessage.includes('translations') && !forceDelete) {
        toast.info(t('wordpress.forceDeleteHint'));
      }
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  <Link
                    href={`/${locale}/wordpress-sites/${site.id}`}
                    className="hover:underline"
                  >
                    {site.name}
                  </Link>
                </CardTitle>
              </div>
              <CardDescription className="flex items-center gap-2">
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-1"
                >
                  {site.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardDescription>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(site)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSync?.(site)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('wordpress.syncArticles')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {/* Active Status */}
            <Badge variant={site.isActive ? 'default' : 'secondary'}>
              {site.isActive ? t('wordpress.active') : t('wordpress.inactive')}
            </Badge>

            {/* Language */}
            <Badge variant="outline">
              {t(`languages.${site.language.toLowerCase()}`)}
            </Badge>

            {/* Plugin */}
            <PluginBadge plugin={site.translationPlugin} />

            {/* Sync Status */}
            {site.lastSyncStatus && (
              <SyncStatusBadge status={site.lastSyncStatus} />
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">{site.totalArticles}</p>
                <p className="text-muted-foreground">{t('wordpress.totalArticles')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">{site.syncedArticles}</p>
                <p className="text-muted-foreground">{t('wordpress.syncedArticles')}</p>
              </div>
            </div>
          </div>

          {/* Last Sync */}
          {site.lastSync && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
              <Calendar className="h-4 w-4" />
              <span>
                {t('wordpress.lastSync')}:{' '}
                {new Date(site.lastSync).toLocaleDateString('ar-SA', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}

          {/* Error Message */}
          {site.lastSyncError && (
            <div className="flex items-start gap-2 p-2 bg-destructive/10 text-destructive rounded text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="text-xs">{site.lastSyncError}</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-between">
          <span className="text-xs text-muted-foreground">
            {site._count?.translations || 0} {t('articles.translations')}
          </span>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/wordpress-sites/${site.id}`}>
              {t('common.details')} →
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('wordpress.deleteSite')}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  {t('wordpress.deleteConfirm')}
                  <br />
                  <strong className="text-foreground">{site.name}</strong>
                </p>

                {hasTranslations && (
                  <>
                    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-amber-800 dark:text-amber-200">
                          <p className="font-semibold mb-1">
                            {t('wordpress.hasTranslations')}
                          </p>
                          <p>
                            {t('wordpress.translationsWarning', {
                              count: site._count?.translations ?? 0,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={forceDelete}
                        onChange={(e) => setForceDelete(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-foreground">
                        {t('wordpress.forceDeleteOption')}
                      </span>
                    </label>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setForceDelete(false)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteSite.isPending}
            >
              {deleteSite.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PluginBadge({ plugin }: { plugin: TranslationPlugin }) {
  const t = useTranslations('wordpress.plugins');

  const pluginColors: Record<TranslationPlugin, string> = {
    NONE: 'bg-gray-100 text-gray-800',
    WPML: 'bg-blue-100 text-blue-800',
    POLYLANG: 'bg-purple-100 text-purple-800',
    TRANSLATEPRESS: 'bg-green-100 text-green-800',
    WEGLOT: 'bg-orange-100 text-orange-800',
    LOCO_TRANSLATE: 'bg-pink-100 text-pink-800',
    QTRANSLATE_XT: 'bg-indigo-100 text-indigo-800',
  };

  return (
    <Badge variant="outline" className={pluginColors[plugin]}>
      {t(plugin)}
    </Badge>
  );
}

function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const t = useTranslations('wordpress.syncStatus');

  const statusConfig: Record<
    SyncStatus,
    { icon: typeof CheckCircle2; className: string }
  > = {
    IDLE: { icon: Clock, className: 'bg-gray-100 text-gray-800' },
    SYNCING: { icon: Loader2, className: 'bg-blue-100 text-blue-800' },
    SUCCESS: { icon: CheckCircle2, className: 'bg-green-100 text-green-800' },
    FAILED: { icon: XCircle, className: 'bg-red-100 text-red-800' },
    PARTIAL: { icon: AlertCircle, className: 'bg-yellow-100 text-yellow-800' },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={config.className}>
      <Icon
        className={`h-3 w-3 mr-1 ${status === 'SYNCING' ? 'animate-spin' : ''}`}
      />
      {t(status)}
    </Badge>
  );
}
