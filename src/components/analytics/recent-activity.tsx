'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'article_created' | 'translation_completed' | 'translation_pending' | 'quality_check';
  title: string;
  description: string;
  timestamp: Date;
  language?: string;
  status?: 'success' | 'pending' | 'failed';
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'article_created':
        return <FileText className="h-4 w-4" />;
      case 'translation_completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'translation_pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'quality_check':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      success: 'default',
      pending: 'secondary',
      failed: 'destructive',
    };

    const labels: Record<string, string> = {
      success: 'مكتمل',
      pending: 'قيد الانتظار',
      failed: 'فشل',
    };

    return (
      <Badge variant={variants[status] || 'secondary'} className="text-xs">
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>النشاط الأخير</CardTitle>
        <CardDescription>آخر التحديثات على المقالات والترجمات</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا يوجد نشاط حديث</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-4 border-b last:border-0"
              >
                <div className="mt-0.5">{getIcon(activity.type)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-none">
                      {activity.title}
                    </p>
                    {activity.language && (
                      <Badge variant="outline" className="text-xs">
                        {activity.language}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.timestamp, {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </p>
                    {getStatusBadge(activity.status)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
