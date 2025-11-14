'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Eye, TrendingUp, MessageSquare, Share2 } from 'lucide-react';

export interface TopArticle {
  id: number;
  title: string;
  views: number;
  engagement: number;
  comments: number;
  shares: number;
  language: string;
  trending: boolean;
}

interface TopArticlesProps {
  articles: TopArticle[];
}

export function TopArticles({ articles }: TopArticlesProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>المقالات الأكثر أداءً</CardTitle>
        <CardDescription>المقالات التي حققت أعلى تفاعل</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {articles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد مقالات بعد</p>
            </div>
          ) : (
            articles.map((article, index) => (
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                className="block group"
              >
                <div className="flex items-start gap-3 pb-4 border-b last:border-0 hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                  {/* Rank */}
                  <div
                    className={`
                      flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                      ${
                        index === 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : index === 1
                          ? 'bg-gray-100 text-gray-800'
                          : index === 2
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    {index + 1}
                  </div>

                  {/* Article Info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h4>
                      {article.trending && (
                        <Badge variant="default" className="flex-shrink-0">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          رائج
                        </Badge>
                      )}
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{formatNumber(article.views)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{formatNumber(article.comments)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 className="h-3 w-3" />
                        <span>{formatNumber(article.shares)}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {article.language}
                      </Badge>
                    </div>

                    {/* Engagement Bar */}
                    <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
                        style={{ width: `${Math.min(article.engagement, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
