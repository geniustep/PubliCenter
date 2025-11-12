'use client';

import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Globe, FileText, Eye, Clock, Languages, Calendar } from 'lucide-react';

export default function AnalyticsPage() {
  const t = useTranslations();

  const stats = [
    {
      title: t('analytics.totalArticles'),
      value: '156',
      change: '+12%',
      changeType: 'positive' as const,
      icon: FileText,
      description: 'from last month',
    },
    {
      title: t('analytics.totalViews'),
      value: '24.5K',
      change: '+18%',
      changeType: 'positive' as const,
      icon: Eye,
      description: 'from last month',
    },
    {
      title: t('analytics.totalTranslations'),
      value: '468',
      change: '+24%',
      changeType: 'positive' as const,
      icon: Languages,
      description: 'across 4 languages',
    },
    {
      title: t('analytics.publishedToday'),
      value: '8',
      change: '+2',
      changeType: 'positive' as const,
      icon: Calendar,
      description: 'today',
    },
  ];

  const topArticles = [
    { title: 'Introduction to Machine Learning', views: 2400, language: 'English', status: 'published' },
    { title: 'مقدمة في تعلم الآلة', views: 1800, language: 'Arabic', status: 'published' },
    { title: 'Guide complet du Machine Learning', views: 1200, language: 'French', status: 'published' },
    { title: 'Guía completa de Machine Learning', views: 950, language: 'Spanish', status: 'published' },
  ];

  const languageStats = [
    { language: 'Arabic', articles: 45, views: '8.2K', percentage: 28 },
    { language: 'English', articles: 52, views: '10.5K', percentage: 35 },
    { language: 'French', articles: 31, views: '3.8K', percentage: 20 },
    { language: 'Spanish', articles: 28, views: '2.0K', percentage: 17 },
  ];

  const recentActivity = [
    { action: 'Published', title: 'New AI Trends 2024', time: '2 hours ago', user: 'Admin' },
    { action: 'Translated', title: 'AI Trends 2024', time: '3 hours ago', user: 'System' },
    { action: 'Draft Created', title: 'Future of Web Development', time: '5 hours ago', user: 'Admin' },
    { action: 'Published', title: 'React Best Practices', time: '1 day ago', user: 'Admin' },
  ];

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                {t('analytics.title')}
              </h1>
              <p className="text-muted-foreground">
                {t('analytics.overview')}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
                      <div className="flex items-center gap-2 text-xs">
                        <Badge
                          variant={stat.changeType === 'positive' ? 'default' : 'destructive'}
                          className="font-normal"
                        >
                          {stat.change}
                        </Badge>
                        <span className="text-muted-foreground">{stat.description}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-2 mb-8">
              {/* Top Articles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {t('analytics.topArticles')}
                  </CardTitle>
                  <CardDescription>Most viewed articles this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topArticles.map((article, index) => (
                      <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{article.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {article.language}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {article.views.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Language Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {t('analytics.viewsByLanguage')}
                  </CardTitle>
                  <CardDescription>Content distribution by language</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {languageStats.map((stat) => (
                      <div key={stat.language} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{stat.language}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{stat.articles} articles</span>
                            <span>•</span>
                            <span>{stat.views} views</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${stat.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t('analytics.recentActivity')}
                </CardTitle>
                <CardDescription>Latest updates and changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {activity.action}
                          </Badge>
                          <p className="font-medium text-sm">{activity.title}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{activity.user}</span>
                          <span>•</span>
                          <span>{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
