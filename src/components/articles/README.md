# 🎨 Article Components - مكونات المقالات الإبداعية

نظام شامل ومتكامل لعرض وإدارة المقالات مع ترجماتها بطريقة إبداعية وتفاعلية.

## 📦 المكونات المتاحة

### 1. **ArticleCard** - بطاقة المقالة الإبداعية

المكون الرئيسي لعرض المقالة مع جميع ترجماتها ومعلوماتها.

```tsx
import { ArticleCard } from '@/components/articles';

<ArticleCard
  article={enhancedArticle}
  displayOptions={{
    showAnalytics: true,
    showQualityMetrics: true,
    showTranslationProgress: true,
    showPrimaryImage: true,
  }}
  onEdit={(article) => console.log('Edit', article)}
  onDelete={(article) => console.log('Delete', article)}
  onGenerateTranslation={(article, lang) => console.log('Generate', lang)}
  compact={false}
/>
```

**المزايا:**
- ✅ عرض صورة المقالة الرئيسية
- ✅ عنوان بعلم اللغة الأساسية
- ✅ Translation Progress Bar
- ✅ قائمة الترجمات المكتملة مع حالة كل واحدة
- ✅ أزرار توليد ترجمة للغات المفقودة
- ✅ معاينة سريعة on hover
- ✅ إحصائيات (مشاهدات، تعليقات، مشاركات)
- ✅ Quick Actions Menu
- ✅ Compact & Expanded views

---

### 2. **TranslationProgressBar** - شريط تقدم الترجمة

عرض مرئي لتقدم الترجمة وجودتها.

```tsx
import { TranslationProgressBar } from '@/components/articles';

<TranslationProgressBar
  progress={translationProgress}
  showDetails={true}
  compact={false}
/>
```

**المزايا:**
- 📊 عرض النسبة المئوية للاكتمال
- ⭐ معدل الجودة (0-5)
- 🌍 تفصيل لكل لغة
- ✅ حالة كل ترجمة (مكتملة، تحتاج مراجعة، قديمة، مفقودة)
- ⚠️ تنبيهات للترجمات المفقودة

---

### 3. **TranslationItem** - عنصر الترجمة

عرض ترجمة فردية مع جميع تفاصيلها.

```tsx
import { TranslationItem } from '@/components/articles';

<TranslationItem
  translation={enhancedTranslation}
  onPreview={(trans) => console.log('Preview', trans)}
  onEdit={(trans) => console.log('Edit', trans)}
  onUpdate={(trans) => console.log('Update', trans)}
  compact={false}
/>
```

**المزايا:**
- 🇸🇦 علم اللغة
- 📊 Quality Score
- ⏱️ Reading Time
- 🤖 AI Translation Badge
- ⚠️ Status Badges (منشور، يحتاج مراجعة، يحتاج تحديث)
- 👁️ Quick Preview
- ✏️ Quick Edit
- 🔄 Quick Update

---

### 4. **ArticlesFilters** - فلاتر متقدمة

نظام فلترة شامل ومرن.

```tsx
import { ArticlesFilters } from '@/components/articles';

<ArticlesFilters
  filters={filters}
  onChange={(newFilters) => setFilters(newFilters)}
  onReset={() => setFilters({})}
/>
```

**المزايا:**
- 🔍 بحث نصي
- 🌍 فلترة حسب اللغات
- 📊 فلترة حسب حالة الترجمة
- ⭐ فلترة حسب نطاق الجودة
- 📅 فلترة حسب التاريخ
- 🔥 المقالات الرائجة فقط
- 🖼️ مع صور فقط
- 🔤 ترتيب متعدد الخيارات
- 🏷️ Active Filters Badges
- ♻️ إعادة تعيين سريعة

---

### 5. **BulkActions** - إجراءات جماعية

تنفيذ إجراءات على مقالات متعددة دفعة واحدة.

```tsx
import { BulkActions } from '@/components/articles';

<BulkActions
  selectedCount={selectedArticles.length}
  onAction={async (action, options) => {
    // Handle bulk action
  }}
  onClearSelection={() => setSelectedArticles([])}
/>
```

**المزايا:**
- ✨ ترجمة جماعية
- 🔄 تحديث الترجمات
- 📤 نشر جماعي
- 📥 إلغاء نشر جماعي
- ✅ فحص الجودة
- 📊 تصدير
- 🗑️ حذف جماعي
- 🏷️ تغيير التصنيف
- 📌 Fixed Bottom Bar (يظهر عند التحديد)
- ⚠️ تأكيد للإجراءات الخطيرة

---

## 🎯 أنواع البيانات (Types)

### EnhancedArticle
```typescript
interface EnhancedArticle extends Article {
  translationProgress: TranslationProgress;
  analytics: ArticleAnalytics;
  enhancedTranslations?: EnhancedTranslation[];
  primaryImage?: ArticleImage;
  tags?: string[];
  collaborators?: User[];
}
```

### TranslationProgress
```typescript
interface TranslationProgress {
  overall: number;              // 85%
  quality: number;              // 4.5/5
  completeness: Record<Language, number>;
  missingLanguages: Language[];
  needsReview: Language[];
  outOfSync: Language[];
}
```

### ArticleFilters
```typescript
interface ArticleFilters {
  status?: ArticleStatus[];
  sourceLanguage?: Language;
  translationStatus?: TranslationFilterStatus;
  languages?: Language[];
  qualityMin?: number;
  qualityMax?: number;
  categoryId?: number;
  dateFrom?: string;
  dateTo?: string;
  trending?: boolean;
  search?: string;
  sortBy?: ArticleSortBy;
}
```

---

## 🎨 مثال كامل - Articles List Page

```tsx
'use client';

import { useState } from 'react';
import {
  ArticleCard,
  ArticlesFilters,
  BulkActions
} from '@/components/articles';
import type { EnhancedArticle, ArticleFilters } from '@/types/api';

export default function ArticlesPage() {
  const [filters, setFilters] = useState<ArticleFilters>({});
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('expanded');

  // Fetch articles based on filters
  const { data, isLoading } = useArticles(filters);

  const handleBulkAction = async (action, options) => {
    // Implement bulk action
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📝 المقالات</h1>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'compact' ? 'default' : 'outline'}
            onClick={() => setViewMode('compact')}
          >
            Compact
          </Button>
          <Button
            variant={viewMode === 'expanded' ? 'default' : 'outline'}
            onClick={() => setViewMode('expanded')}
          >
            Expanded
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ArticlesFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters({})}
      />

      {/* Articles Grid/List */}
      <div className="mt-6 grid gap-6">
        {data?.articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            compact={viewMode === 'compact'}
            onGenerateTranslation={(article, lang) => {
              // Generate translation
            }}
          />
        ))}
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedArticles.length}
        onAction={handleBulkAction}
        onClearSelection={() => setSelectedArticles([])}
      />
    </div>
  );
}
```

---

## 🎯 الميزات الرئيسية

### 1. **عرض تفاعلي مبتكر**
- بطاقات جميلة مع صور
- أعلام اللغات
- مؤشرات الحالة الملونة
- Hover effects

### 2. **معلومات شاملة**
- تقدم الترجمة المرئي
- جودة الترجمات
- إحصائيات المشاهدات والمشاركات
- وقت القراءة

### 3. **إدارة قوية**
- فلاتر متقدمة
- ترتيب مرن
- بحث ذكي
- إجراءات جماعية

### 4. **تجربة مستخدم ممتازة**
- معاينة سريعة
- أزرار توليد ذكية
- تنبيهات واضحة
- تأكيد للإجراءات الخطيرة

---

## 📱 Responsive Design

جميع المكونات responsive وتعمل بشكل ممتاز على:
- 💻 Desktop
- 📱 Mobile
- 📱 Tablet

---

## 🌍 الترجمة (i18n)

جميع النصوص مترجمة باستخدام `next-intl`:
```typescript
import { useTranslations } from 'next-intl';

const t = useTranslations('articleCard');
t('generateTranslation') // "توليد ترجمة"
```

---

## 🎨 التخصيص

### Tailwind CSS Classes
جميع المكونات تستخدم Tailwind CSS ويمكن تخصيصها بسهولة.

### Display Options
```typescript
const displayOptions: ArticleCardDisplayOptions = {
  showAnalytics: true,
  showQualityMetrics: true,
  showCollaboration: false,
  showTranslationProgress: true,
  showPrimaryImage: true,
  enableQuickActions: true,
  enablePreview: true,
  compactMode: false,
};
```

---

## 🚀 الاستخدام المتقدم

### مثال: إضافة Checkbox للتحديد الجماعي

```tsx
<div className="flex items-center gap-3">
  <input
    type="checkbox"
    checked={selectedArticles.includes(article.id)}
    onChange={(e) => {
      if (e.target.checked) {
        setSelectedArticles([...selectedArticles, article.id]);
      } else {
        setSelectedArticles(selectedArticles.filter(id => id !== article.id));
      }
    }}
  />

  <ArticleCard article={article} />
</div>
```

---

## 📚 المراجع

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [next-intl](https://next-intl-docs.vercel.app/)

---

## 🎉 ملخص

نظام شامل ومتكامل يوفر:
- ✅ عرض إبداعي للمقالات
- ✅ إدارة ترجمات قوية
- ✅ فلاتر وبحث متقدم
- ✅ إجراءات جماعية
- ✅ تجربة مستخدم ممتازة
- ✅ responsive design
- ✅ i18n support

**جاهز للاستخدام في الإنتاج! 🚀**
