'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Pagination } from '@/components/ui/pagination';
import { ArticleFilters } from '@/components/articles/article-filters';
import { FileText, Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useArticles } from '@/hooks/use-articles';
import { ArticleStatus } from '@/types/api';

export default function ArticlesPage() {
  const t = useTranslations();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | undefined>();

  const { data, isLoading, error } = useArticles({
    page: currentPage,
    limit: 10,
    status: statusFilter,
  });

  const articles = data?.articles || [];
  const pagination = data?.pagination;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="default">{t('articles.status.published')}</Badge>;
      case 'DRAFT':
        return <Badge variant="secondary">{t('articles.status.draft')}</Badge>;
      case 'ARCHIVED':
        return <Badge variant="outline">{t('articles.status.archived')}</Badge>;
      case 'FAILED':
        return (
          <Badge variant="destructive">{t('articles.status.failed')}</Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleStatusChange = (status?: ArticleStatus) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when filter changes
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
                {t('articles.title')}
              </h1>
              <p className="text-muted-foreground">{t('articles.myArticles')}</p>
            </div>

            <ArticleFilters
              currentStatus={statusFilter}
              onStatusChange={handleStatusChange}
            />

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : error ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-destructive">
                    {t('errors.serverError')}
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    {t('errors.tryAgain')}
                  </Button>
                </CardContent>
              </Card>
            ) : articles.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">
                    {t('articles.noArticles')}
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {t('articles.createFirst')}
                  </p>
                  <Button asChild>
                    <a href="./publish">{t('nav.publish')}</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4">
                  {articles.map((article) => (
                    <Card key={article.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="mb-2">{article.title}</CardTitle>
                            {article.excerpt && (
                              <p className="text-sm text-muted-foreground">
                                {article.excerpt}
                              </p>
                            )}
                          </div>
                          {getStatusBadge(article.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(article.createdAt), 'PP')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {article._count?.translations || 0} {t('articles.translations')}
                          </div>
                          <Badge variant="outline">
                            {t(`languages.${article.sourceLanguage.toLowerCase()}`)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {pagination && pagination.pages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={pagination.pages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
