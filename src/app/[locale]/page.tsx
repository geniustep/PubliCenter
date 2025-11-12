import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, FileText, Globe, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const t = useTranslations();

  const stats = [
    {
      title: t('analytics.totalArticles'),
      value: '0',
      icon: FileText,
      description: t('articles.noArticles'),
    },
    {
      title: t('analytics.totalViews'),
      value: '0',
      icon: TrendingUp,
      description: t('analytics.overview'),
    },
    {
      title: t('analytics.totalTranslations'),
      value: '0',
      icon: Globe,
      description: t('languages.ar') + ', ' + t('languages.en'),
    },
    {
      title: t('analytics.publishedToday'),
      value: '0',
      icon: BarChart3,
      description: t('articles.noArticles'),
    },
  ];

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container py-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                {t('common.welcome')}
              </h1>
              <p className="text-muted-foreground">
                {t('common.appName')} - Multi-language Content Publishing Platform
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">
                        {stat.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>{t('articles.createFirst')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {t('publish.title')}
                  </p>
                  <a
                    href="./publish"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {t('nav.publish')}
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
