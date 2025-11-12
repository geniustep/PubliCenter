'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Eye } from 'lucide-react';

interface Template {
  id: number;
  name: string;
  description: string;
  structure: string;
  active: boolean;
  usageCount: number;
}

export default function TemplatesPage() {
  const t = useTranslations();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const result = await response.json();

      if (response.ok && result.success) {
        setTemplates(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openPreview = (template: Template) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  const getTemplateIcon = (name: string) => {
    const iconMap: Record<string, string> = {
      'News Template': '📰',
      'Blog Template': '✍️',
      'Tech Template': '💻',
      'Business Template': '💼',
      'Sports Template': '⚽',
      'Entertainment Template': '🎬',
      'Health Template': '🏥',
      'Travel Template': '✈️',
    };
    return iconMap[name] || '📄';
  };

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                {t('templates.title')}
              </h1>
              <p className="text-muted-foreground">
                {t('templates.selectTemplate')}
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : templates.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">
                    {t('templates.noTemplates')}
                  </h3>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{getTemplateIcon(template.name)}</span>
                          <div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <Badge variant={template.active ? 'default' : 'secondary'} className="mt-1">
                              {template.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <CardDescription className="mt-2">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <span>Used {template.usageCount} times</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPreview(template)}
                          className="flex-1"
                        >
                          <Eye className="me-2 h-4 w-4" />
                          {t('templates.preview')}
                        </Button>
                        <Button
                          size="sm"
                          disabled={!template.active}
                          className="flex-1"
                        >
                          {t('templates.use')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-3xl">{selectedTemplate && getTemplateIcon(selectedTemplate.name)}</span>
              {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <h4 className="mb-2 font-semibold">Template Structure:</h4>
            <div className="rounded-lg border bg-muted p-4">
              <pre className="whitespace-pre-wrap text-sm">
                {selectedTemplate?.structure}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
