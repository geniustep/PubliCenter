'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type { BulkActionType, Language } from '@/types/api';
import {
  Sparkles,
  RefreshCw,
  Send,
  Trash2,
  Archive,
  FolderEdit,
  CheckSquare,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface BulkActionsProps {
  selectedCount: number;
  onAction: (action: BulkActionType, options?: any) => Promise<void>;
  onClearSelection: () => void;
  disabled?: boolean;
}

const BULK_ACTIONS: { value: BulkActionType; label: string; icon: any; color: string; requiresConfirm: boolean }[] = [
  { value: 'TRANSLATE', label: 'ترجمة', icon: Sparkles, color: 'text-purple-600', requiresConfirm: false },
  { value: 'UPDATE_TRANSLATIONS', label: 'تحديث الترجمات', icon: RefreshCw, color: 'text-blue-600', requiresConfirm: false },
  { value: 'PUBLISH', label: 'نشر', icon: Send, color: 'text-green-600', requiresConfirm: false },
  { value: 'UNPUBLISH', label: 'إلغاء النشر', icon: Archive, color: 'text-orange-600', requiresConfirm: true },
  { value: 'QUALITY_CHECK', label: 'فحص الجودة', icon: CheckSquare, color: 'text-indigo-600', requiresConfirm: false },
  { value: 'EXPORT', label: 'تصدير', icon: Download, color: 'text-cyan-600', requiresConfirm: false },
  { value: 'DELETE', label: 'حذف', icon: Trash2, color: 'text-red-600', requiresConfirm: true },
];

const LANGUAGE_OPTIONS: { value: Language; label: string; flag: string }[] = [
  { value: 'EN', label: 'English', flag: '🇬🇧' },
  { value: 'FR', label: 'Français', flag: '🇫🇷' },
  { value: 'ES', label: 'Español', flag: '🇪🇸' },
];

export function BulkActions({
  selectedCount,
  onAction,
  onClearSelection,
  disabled = false,
}: BulkActionsProps) {
  const t = useTranslations();
  const [selectedAction, setSelectedAction] = useState<BulkActionType | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [targetLanguages, setTargetLanguages] = useState<Language[]>([]);

  const handleActionSelect = (action: BulkActionType) => {
    setSelectedAction(action);

    const actionConfig = BULK_ACTIONS.find(a => a.value === action);

    // إذا كان الإجراء يحتاج خيارات (مثل الترجمة)
    if (action === 'TRANSLATE') {
      setShowOptions(true);
    }
    // إذا كان الإجراء يحتاج تأكيد
    else if (actionConfig?.requiresConfirm) {
      setShowConfirm(true);
    }
    // تنفيذ مباشر
    else {
      executeAction(action);
    }
  };

  const executeAction = async (action: BulkActionType, options?: any) => {
    setLoading(true);
    try {
      await onAction(action, options);
      setShowConfirm(false);
      setShowOptions(false);
      setSelectedAction(null);
      setTargetLanguages([]);
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = (lang: Language) => {
    setTargetLanguages(prev =>
      prev.includes(lang)
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  };

  if (selectedCount === 0) {
    return null;
  }

  const selectedActionConfig = selectedAction
    ? BULK_ACTIONS.find(a => a.value === selectedAction)
    : null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-background border rounded-lg shadow-xl p-4 min-w-[500px]">
          <div className="flex items-center justify-between gap-4">
            {/* Selection Info */}
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {selectedCount} مقالة محددة
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                disabled={disabled || loading}
              >
                إلغاء التحديد
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {BULK_ACTIONS.slice(0, 5).map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleActionSelect(action.value)}
                    disabled={disabled || loading}
                    className="gap-2"
                  >
                    <Icon className={`h-4 w-4 ${action.color}`} />
                    {action.label}
                  </Button>
                );
              })}

              {/* More Actions Dropdown */}
              <Select
                onValueChange={(value) => handleActionSelect(value as BulkActionType)}
                disabled={disabled || loading}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="المزيد..." />
                </SelectTrigger>
                <SelectContent>
                  {BULK_ACTIONS.slice(5).map((action) => {
                    const Icon = action.icon;
                    return (
                      <SelectItem key={action.value} value={action.value}>
                        <span className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${action.color}`} />
                          <span>{action.label}</span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>جاري تنفيذ الإجراء على {selectedCount} مقالة...</span>
            </div>
          )}
        </div>
      </div>

      {/* Translation Options Dialog */}
      <AlertDialog open={showOptions} onOpenChange={setShowOptions}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              ترجمة {selectedCount} مقالة
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-4">
                <p>اختر اللغات المراد الترجمة إليها:</p>

                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((lang) => {
                    const isSelected = targetLanguages.includes(lang.value);
                    return (
                      <Button
                        key={lang.value}
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => toggleLanguage(lang.value)}
                        className="gap-2"
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                        {isSelected && <CheckSquare className="h-4 w-4" />}
                      </Button>
                    );
                  })}
                </div>

                {targetLanguages.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      سيتم إنشاء {selectedCount × targetLanguages.length} ترجمة جديدة
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeAction('TRANSLATE', { targetLanguages })}
              disabled={targetLanguages.length === 0 || loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              بدء الترجمة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              تأكيد الإجراء
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  هل أنت متأكد من {selectedActionConfig?.label} {selectedCount} مقالة؟
                </p>

                {selectedAction === 'DELETE' && (
                  <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3">
                    <p className="text-sm text-red-800 dark:text-red-200 font-semibold">
                      ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAction && executeAction(selectedAction)}
              disabled={loading}
              className={selectedAction === 'DELETE' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
