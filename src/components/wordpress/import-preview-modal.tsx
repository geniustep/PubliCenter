'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ArticleImportPreview, ArticleImportOptions } from '@/types/api';
import { Language } from '@/types/api';
import {
  FileText,
  Tag,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BarChart3,
} from 'lucide-react';
import Image from 'next/image';

interface ImportPreviewModalProps {
  preview: ArticleImportPreview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (options: ArticleImportOptions) => Promise<void>;
  wpSiteId: number;
}

const LANGUAGE_FLAGS: Record<Language, string> = {
  [Language.AR]: '🇸🇦',
  [Language.EN]: '🇬🇧',
  [Language.FR]: '🇫🇷',
  [Language.ES]: '🇪🇸',
};

export function ImportPreviewModal({
  preview,
  open,
  onOpenChange,
  onImport,
  wpSiteId,
}: ImportPreviewModalProps) {
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
  const [importOptions, setImportOptions] = useState<Partial<ArticleImportOptions>>({
    includeImages: true,
    includeCategories: true,
    includeTags: true,
    autoPublish: false,
  });
  const [isImporting, setIsImporting] = useState(false);

  if (!preview) return null;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedArticles(preview.articles.map(a => a.wpPostId));
    } else {
      setSelectedArticles([]);
    }
  };

  const handleSelectArticle = (wpPostId: number, checked: boolean) => {
    if (checked) {
      setSelectedArticles([...selectedArticles, wpPostId]);
    } else {
      setSelectedArticles(selectedArticles.filter(id => id !== wpPostId));
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      await onImport({
        wpSiteId,
        articleIds: selectedArticles.length > 0 ? selectedArticles : undefined,
        ...importOptions,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const filteredArticles = preview.articles.filter(a => !a.alreadyImported);
  const alreadyImportedCount = preview.articles.length - filteredArticles.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            معاينة استيراد المقالات
          </DialogTitle>
          <DialogDescription>
            تم العثور على {preview.total} مقالة في WordPress
            {alreadyImportedCount > 0 && (
              <span className="text-amber-600">
                {' '}({alreadyImportedCount} مستوردة مسبقاً)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="articles" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="articles">
              <FileText className="h-4 w-4 mr-2" />
              المقالات ({filteredArticles.length})
            </TabsTrigger>
            <TabsTrigger value="statistics">
              <BarChart3 className="h-4 w-4 mr-2" />
              الإحصائيات
            </TabsTrigger>
          </TabsList>

          {/* Articles List */}
          <TabsContent value="articles" className="flex-1 flex flex-col min-h-0 mt-4">
            {/* Select All */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedArticles.length === filteredArticles.length}
                  onCheckedChange={handleSelectAll}
                  id="select-all"
                />
                <Label htmlFor="select-all" className="cursor-pointer">
                  تحديد الكل ({selectedArticles.length} من {filteredArticles.length})
                </Label>
              </div>

              <Badge variant="secondary">
                {selectedArticles.length} محدد
              </Badge>
            </div>

            {/* Articles Grid */}
            <ScrollArea className="flex-1">
              <div className="grid gap-3 pr-4">
                {filteredArticles.map((article) => {
                  const isSelected = selectedArticles.includes(article.wpPostId);

                  return (
                    <div
                      key={article.wpPostId}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelectArticle(article.wpPostId, checked as boolean)
                        }
                        id={`article-${article.wpPostId}`}
                      />

                      {article.featured_image && (
                        <div className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden">
                          <Image
                            src={article.featured_image}
                            alt={article.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={`article-${article.wpPostId}`}
                          className="text-sm font-semibold cursor-pointer hover:underline line-clamp-2"
                        >
                          {article.title}
                        </Label>

                        {article.excerpt && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {article.excerpt}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {LANGUAGE_FLAGS[article.language]} {article.language}
                          </Badge>

                          {article.category && (
                            <Badge variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {article.category}
                            </Badge>
                          )}

                          <span className="text-xs text-muted-foreground">
                            {new Date(article.publishedAt).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>

                          {article.featured_image && (
                            <ImageIcon className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="mt-4 space-y-4">
            {/* By Language */}
            <div>
              <h3 className="text-sm font-semibold mb-3">حسب اللغة</h3>
              <div className="grid gap-2">
                {Object.entries(preview.statistics.byLanguage).map(([lang, count]) => (
                  <div
                    key={lang}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <span className="text-sm flex items-center gap-2">
                      {LANGUAGE_FLAGS[lang as Language]} {lang}
                    </span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* By Category */}
            <div>
              <h3 className="text-sm font-semibold mb-3">حسب التصنيف</h3>
              <div className="grid gap-2">
                {Object.entries(preview.statistics.byCategory)
                  .slice(0, 10)
                  .map(([category, count]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="text-sm">{category}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
              </div>
            </div>

            {/* By Month */}
            <div>
              <h3 className="text-sm font-semibold mb-3">حسب الشهر</h3>
              <div className="grid gap-2">
                {Object.entries(preview.statistics.byMonth)
                  .slice(0, 6)
                  .map(([month, count]) => (
                    <div
                      key={month}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="text-sm">{month}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Import Options */}
        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-semibold">خيارات الاستيراد</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={importOptions.includeImages}
                onCheckedChange={(checked) =>
                  setImportOptions({ ...importOptions, includeImages: checked as boolean })
                }
                id="include-images"
              />
              <Label htmlFor="include-images" className="cursor-pointer text-sm">
                <ImageIcon className="h-3 w-3 inline mr-1" />
                استيراد الصور
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={importOptions.includeCategories}
                onCheckedChange={(checked) =>
                  setImportOptions({ ...importOptions, includeCategories: checked as boolean })
                }
                id="include-categories"
              />
              <Label htmlFor="include-categories" className="cursor-pointer text-sm">
                <Tag className="h-3 w-3 inline mr-1" />
                استيراد التصنيفات
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={importOptions.includeTags}
                onCheckedChange={(checked) =>
                  setImportOptions({ ...importOptions, includeTags: checked as boolean })
                }
                id="include-tags"
              />
              <Label htmlFor="include-tags" className="cursor-pointer text-sm">
                <Tag className="h-3 w-3 inline mr-1" />
                استيراد الوسوم
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={importOptions.autoPublish}
                onCheckedChange={(checked) =>
                  setImportOptions({ ...importOptions, autoPublish: checked as boolean })
                }
                id="auto-publish"
              />
              <Label htmlFor="auto-publish" className="cursor-pointer text-sm">
                <CheckCircle2 className="h-3 w-3 inline mr-1" />
                نشر تلقائي
              </Label>
            </div>
          </div>

          {importOptions.autoPublish && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  سيتم نشر المقالات تلقائياً بعد الاستيراد. يُنصح بمراجعتها قبل النشر.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            إلغاء
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedArticles.length === 0 || isImporting}
          >
            {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            استيراد {selectedArticles.length > 0 && `(${selectedArticles.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
