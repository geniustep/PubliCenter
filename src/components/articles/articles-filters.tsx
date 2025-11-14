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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type {
  ArticleFilters,
} from '@/types/api';
import { Language, TranslationFilterStatus, ArticleSortBy } from '@/types/api';
import {
  X,
  Search,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';

interface ArticlesFiltersProps {
  filters: ArticleFilters;
  onChange: (filters: ArticleFilters) => void;
  onReset?: () => void;
}

const LANGUAGE_OPTIONS: { value: Language; label: string; flag: string }[] = [
  { value: Language.AR, label: 'العربية', flag: '🇸🇦' },
  { value: Language.EN, label: 'English', flag: '🇬🇧' },
  { value: Language.FR, label: 'Français', flag: '🇫🇷' },
  { value: Language.ES, label: 'Español', flag: '🇪🇸' },
];

const TRANSLATION_STATUS_OPTIONS: { value: TranslationFilterStatus; label: string; icon: string }[] = [
  { value: TranslationFilterStatus.ALL, label: 'الكل', icon: '🔄' },
  { value: TranslationFilterStatus.COMPLETE, label: 'مكتملة', icon: '✅' },
  { value: TranslationFilterStatus.PARTIAL, label: 'جزئية', icon: '⚠️' },
  { value: TranslationFilterStatus.MISSING, label: 'مفقودة', icon: '❌' },
  { value: TranslationFilterStatus.NEEDS_REVIEW, label: 'تحتاج مراجعة', icon: '👁️' },
];

const SORT_OPTIONS: { value: ArticleSortBy; label: string; icon: string }[] = [
  { value: ArticleSortBy.DATE_DESC, label: 'الأحدث', icon: '📅' },
  { value: ArticleSortBy.DATE_ASC, label: 'الأقدم', icon: '📅' },
  { value: ArticleSortBy.TITLE_AZ, label: 'أبجدياً (أ-ي)', icon: '🔤' },
  { value: ArticleSortBy.VIEWS, label: 'الأكثر مشاهدة', icon: '👁️' },
  { value: ArticleSortBy.QUALITY, label: 'الأعلى جودة', icon: '⭐' },
  { value: ArticleSortBy.TRENDING, label: 'الرائجة', icon: '🔥' },
];

export function ArticlesFilters({ filters, onChange, onReset }: ArticlesFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof ArticleFilters, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleLanguage = (lang: Language) => {
    const current = filters.languages || [];
    const updated = current.includes(lang)
      ? current.filter(l => l !== lang)
      : [...current, lang];
    updateFilter('languages', updated.length > 0 ? updated : undefined);
  };

  // عدد الفلاتر النشطة
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'page' || key === 'limit') return false;
    if (value === undefined || value === null) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }).length;

  return (
    <div className="space-y-4">
      {/* Quick Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="بحث في المقالات..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value || undefined)}
            className="pl-9"
          />
        </div>

        {/* Translation Status */}
        <Select
          value={filters.translationStatus || 'ALL'}
          onValueChange={(value) => updateFilter('translationStatus', value as TranslationFilterStatus)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRANSLATION_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex items-center gap-2">
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={filters.sortBy || 'DATE_DESC'}
          onValueChange={(value) => updateFilter('sortBy', value as ArticleSortBy)}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex items-center gap-2">
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              فلاتر متقدمة
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">الفلاتر المتقدمة</h4>
                {onReset && activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={onReset}>
                    <X className="h-4 w-4 mr-1" />
                    إعادة تعيين
                  </Button>
                )}
              </div>

              {/* Languages Filter */}
              <div className="space-y-2">
                <Label>اللغات</Label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((lang) => {
                    const isSelected = filters.languages?.includes(lang.value);
                    return (
                      <Button
                        key={lang.value}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleLanguage(lang.value)}
                        className="gap-1"
                      >
                        {lang.flag} {lang.label}
                        {isSelected && <CheckCircle2 className="h-3 w-3 ml-1" />}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Quality Range */}
              <div className="space-y-2">
                <Label>جودة الترجمة</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="من"
                    value={filters.qualityMin || ''}
                    onChange={(e) => updateFilter('qualityMin', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-20"
                  />
                  <span>-</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="إلى"
                    value={filters.qualityMax || ''}
                    onChange={(e) => updateFilter('qualityMax', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-20"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
                  />
                  <span>-</span>
                  <Input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
                  />
                </div>
              </div>

              {/* Trending */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="trending"
                  checked={filters.trending || false}
                  onChange={(e) => updateFilter('trending', e.target.checked ? true : undefined)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="trending" className="cursor-pointer">
                  🔥 المقالات الرائجة فقط
                </Label>
              </div>

              {/* Has Images */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasImages"
                  checked={filters.hasImages || false}
                  onChange={(e) => updateFilter('hasImages', e.target.checked ? true : undefined)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="hasImages" className="cursor-pointer">
                  🖼️ مع صور فقط
                </Label>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Reset Button */}
        {onReset && activeFiltersCount > 0 && (
          <Button variant="ghost" onClick={onReset}>
            <X className="h-4 w-4 mr-1" />
            مسح الفلاتر
          </Button>
        )}
      </div>

      {/* Active Filters Badges */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">الفلاتر النشطة:</span>

          {filters.languages && filters.languages.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              {filters.languages.map(lang => {
                const opt = LANGUAGE_OPTIONS.find(l => l.value === lang);
                return opt?.flag;
              }).join(' ')}
              <button
                onClick={() => updateFilter('languages', undefined)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.translationStatus && filters.translationStatus !== 'ALL' && (
            <Badge variant="secondary" className="gap-1">
              {TRANSLATION_STATUS_OPTIONS.find(o => o.value === filters.translationStatus)?.label}
              <button
                onClick={() => updateFilter('translationStatus', undefined)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.trending && (
            <Badge variant="secondary" className="gap-1">
              🔥 رائجة
              <button
                onClick={() => updateFilter('trending', undefined)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {(filters.qualityMin || filters.qualityMax) && (
            <Badge variant="secondary" className="gap-1">
              ⭐ جودة {filters.qualityMin || 0}-{filters.qualityMax || 100}
              <button
                onClick={() => {
                  updateFilter('qualityMin', undefined);
                  updateFilter('qualityMax', undefined);
                }}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
