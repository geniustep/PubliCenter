'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useSyncWordPressSite } from '@/hooks/use-wordpress-sites';
import { toast } from 'sonner';
import { Loader2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { WordPressSite } from '@/types/api';

interface WordPressSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site: WordPressSite | null;
}

export function WordPressSyncDialog({ open, onOpenChange, site }: WordPressSyncDialogProps) {
  const t = useTranslations();
  const syncSite = useSyncWordPressSite();

  const [appPassword, setAppPassword] = useState('');
  const [syncMode, setSyncMode] = useState<'full' | 'incremental'>('incremental');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [syncResult, setSyncResult] = useState<any>(null);

  const allLanguages = ['AR', 'EN', 'FR', 'ES'];

  const handleSync = async () => {
    if (!site) return;

    try {
      // appPassword is optional - if not provided, server will use stored password
      const result = await syncSite.mutateAsync({
        id: site.id,
        appPassword: appPassword || '', // Empty string means use stored password
        syncMode,
        languages: selectedLanguages.length > 0 ? selectedLanguages : [],
      });

      setSyncResult(result.data);
      toast.success(t('wordpress.syncSuccess'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('wordpress.syncError'));
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setAppPassword('');
    setSyncMode('incremental');
    setSelectedLanguages([]);
    setSyncResult(null);
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  if (!site) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {t('wordpress.syncArticles')}
          </DialogTitle>
          <DialogDescription>
            مزامنة المقالات من <strong>{site.name}</strong>
          </DialogDescription>
        </DialogHeader>

        {!syncResult ? (
          <div className="space-y-6 py-4">
            {/* App Password - Optional if already stored */}
            <div className="space-y-2">
              <Label htmlFor="appPassword">
                {t('wordpress.appPassword')} <span className="text-muted-foreground text-xs">(اختياري)</span>
              </Label>
              <Input
                id="appPassword"
                type="password"
                placeholder="اتركه فارغاً لاستخدام كلمة المرور المحفوظة"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                disabled={syncSite.isPending}
              />
              <p className="text-sm text-muted-foreground">
                {appPassword 
                  ? t('wordpress.appPasswordHelp')
                  : 'سيتم استخدام كلمة المرور المحفوظة. أدخل كلمة مرور جديدة فقط إذا تغيرت.'}
              </p>
            </div>

            {/* Sync Mode */}
            <div className="space-y-3">
              <Label>{t('wordpress.syncMode')}</Label>
              <RadioGroup value={syncMode} onValueChange={(v: any) => setSyncMode(v)}>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="incremental" id="incremental" />
                  <Label htmlFor="incremental" className="font-normal cursor-pointer">
                    <div>
                      <p className="font-medium">{t('wordpress.syncIncremental')}</p>
                      <p className="text-sm text-muted-foreground">
                        جلب المقالات الجديدة فقط (أسرع)
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="font-normal cursor-pointer">
                    <div>
                      <p className="font-medium">{t('wordpress.syncFull')}</p>
                      <p className="text-sm text-muted-foreground">
                        جلب جميع المقالات وتحديثها (أبطأ)
                      </p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{t('wordpress.help.sync')}</span>
              </p>
            </div>

            {/* Languages */}
            <div className="space-y-3">
              <Label>{t('wordpress.selectLanguages')}</Label>
              <div className="grid grid-cols-2 gap-3">
                {allLanguages.map((lang) => (
                  <div key={lang} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={lang}
                      checked={selectedLanguages.includes(lang)}
                      onCheckedChange={() => toggleLanguage(lang)}
                    />
                    <Label
                      htmlFor={lang}
                      className="font-normal cursor-pointer"
                    >
                      {t(`languages.${lang.toLowerCase()}`)}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedLanguages.length === 0
                  ? t('wordpress.allLanguages')
                  : `${selectedLanguages.length} لغات محددة`}
              </p>
            </div>

            {/* Site Info */}
            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('wordpress.plugin')}:</span>
                <span className="font-medium">
                  {t(`wordpress.plugins.${site.translationPlugin}`)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t('wordpress.supportedLanguages')}:
                </span>
                <span className="font-medium">
                  {Array.isArray(site.supportedLanguages)
                    ? site.supportedLanguages.join(', ')
                    : '-'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          // Sync Result
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center py-6">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {syncResult.articlesFound}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('wordpress.articlesFound')}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {syncResult.articlesSynced}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('wordpress.articlesSynced')}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">
                  {syncResult.articlesSkipped}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('wordpress.articlesSkipped')}
                </p>
              </div>
            </div>

            {syncResult.errors && syncResult.errors.length > 0 && (
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="font-medium text-red-800 mb-2">
                  {t('wordpress.syncErrors')}:
                </p>
                <ul className="text-sm text-red-600 space-y-1">
                  {syncResult.errors.slice(0, 5).map((error: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                  {syncResult.errors.length > 5 && (
                    <li className="text-red-500">
                      +{syncResult.errors.length - 5} أخطاء أخرى
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {syncResult ? t('common.close') : t('common.cancel')}
          </Button>
          {!syncResult && (
            <Button onClick={handleSync} disabled={syncSite.isPending}>
              {syncSite.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {syncSite.isPending ? t('wordpress.syncing') : t('wordpress.syncArticles')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
