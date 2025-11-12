'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { i18n } from '@/i18n-config';

export default function PublishPage() {
  const t = useTranslations();
  const params = useParams();
  const { toast } = useToast();
  const currentLocale = params.locale as string;

  const [isPublishing, setIsPublishing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    sourceLanguage: currentLocale,
    targetLanguages: [] as string[],
    templateId: '',
    categoryId: '',
  });

  const toggleLanguage = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      targetLanguages: prev.targetLanguages.includes(lang)
        ? prev.targetLanguages.filter((l) => l !== lang)
        : [...prev.targetLanguages, lang],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.content) {
      toast({
        title: t('common.error'),
        description: t('publish.requiredField'),
        variant: 'destructive',
      });
      return;
    }

    if (formData.targetLanguages.length === 0) {
      toast({
        title: t('common.error'),
        description: t('publish.selectLanguages'),
        variant: 'destructive',
      });
      return;
    }

    setIsPublishing(true);

    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          authorId: 'temp-user-id', // TODO: Get from auth session
          templateId: Number(formData.templateId) || 1,
          categoryId: formData.categoryId
            ? Number(formData.categoryId)
            : undefined,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: t('common.success'),
          description: t('publish.publishSuccess'),
        });

        // Reset form
        setFormData({
          title: '',
          content: '',
          excerpt: '',
          sourceLanguage: currentLocale,
          targetLanguages: [],
          templateId: '',
          categoryId: '',
        });
      } else {
        throw new Error(result.message || 'Failed to publish');
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('publish.publishError'),
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-4xl py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                {t('publish.title')}
              </h1>
              <p className="text-muted-foreground">
                {t('publish.translating')}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>{t('publish.articleTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      {t('publish.articleTitle')} *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder={t('publish.articleTitle')}
                      required
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <Label htmlFor="content">
                      {t('publish.articleContent')} *
                    </Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }))
                      }
                      placeholder={t('publish.articleContent')}
                      rows={10}
                      required
                    />
                  </div>

                  {/* Excerpt */}
                  <div className="space-y-2">
                    <Label htmlFor="excerpt">
                      {t('publish.articleExcerpt')}
                    </Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          excerpt: e.target.value,
                        }))
                      }
                      placeholder={t('publish.articleExcerpt')}
                      rows={3}
                    />
                  </div>

                  {/* Source Language */}
                  <div className="space-y-2">
                    <Label htmlFor="sourceLanguage">
                      {t('publish.sourceLanguage')}
                    </Label>
                    <Select
                      value={formData.sourceLanguage}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          sourceLanguage: value,
                        }))
                      }
                    >
                      <SelectTrigger id="sourceLanguage">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {i18n.locales.map((locale) => (
                          <SelectItem key={locale} value={locale}>
                            {t(`languages.${locale}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Target Languages */}
                  <div className="space-y-2">
                    <Label>{t('publish.targetLanguages')} *</Label>
                    <div className="flex flex-wrap gap-2">
                      {i18n.locales
                        .filter((lang) => lang !== formData.sourceLanguage)
                        .map((lang) => (
                          <Badge
                            key={lang}
                            variant={
                              formData.targetLanguages.includes(lang)
                                ? 'default'
                                : 'outline'
                            }
                            className="cursor-pointer"
                            onClick={() => toggleLanguage(lang)}
                          >
                            {t(`languages.${lang}`)}
                          </Badge>
                        ))}
                    </div>
                  </div>

                  {/* Template (TODO: Load from API) */}
                  <div className="space-y-2">
                    <Label htmlFor="template">{t('publish.template')}</Label>
                    <Select
                      value={formData.templateId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          templateId: value,
                        }))
                      }
                    >
                      <SelectTrigger id="template">
                        <SelectValue
                          placeholder={t('publish.selectTemplate')}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">
                          {t('templates.news.name')}
                        </SelectItem>
                        <SelectItem value="2">
                          {t('templates.blog.name')}
                        </SelectItem>
                        <SelectItem value="3">
                          {t('templates.tech.name')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPublishing}
                    >
                      {t('publish.saveDraft')}
                    </Button>
                    <Button type="submit" disabled={isPublishing}>
                      {isPublishing ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          {t('publish.publishing')}
                        </>
                      ) : (
                        t('publish.publishButton')
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
