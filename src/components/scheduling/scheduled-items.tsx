'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar, Clock, Edit, Trash2, CheckCircle } from 'lucide-react';

export interface ScheduledItem {
  id: number;
  title: string;
  scheduledAt: Date;
  type: 'article' | 'translation';
  status: 'scheduled' | 'published' | 'failed';
  language?: string;
  author?: string;
}

interface ScheduledItemsProps {
  items: ScheduledItem[];
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onPublishNow?: (id: number) => void;
}

export function ScheduledItems({
  items,
  onEdit,
  onDelete,
  onPublishNow,
}: ScheduledItemsProps) {
  const getStatusBadge = (item: ScheduledItem) => {
    if (item.status === 'published') {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          منشور
        </Badge>
      );
    }

    if (item.status === 'failed') {
      return <Badge variant="destructive">فشل</Badge>;
    }

    if (isPast(item.scheduledAt)) {
      return <Badge variant="secondary">قيد النشر</Badge>;
    }

    return <Badge variant="outline">مجدول</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return type === 'article' ? (
      <Badge variant="outline">مقالة</Badge>
    ) : (
      <Badge variant="outline">ترجمة</Badge>
    );
  };

  const sortedItems = [...items].sort(
    (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()
  );

  const upcomingItems = sortedItems.filter(
    (item) => item.status === 'scheduled' && isFuture(item.scheduledAt)
  );
  const pastItems = sortedItems.filter(
    (item) => item.status !== 'scheduled' || isPast(item.scheduledAt)
  );

  return (
    <div className="space-y-6">
      {/* Upcoming */}
      {upcomingItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              منشورات مجدولة ({upcomingItems.length})
            </CardTitle>
            <CardDescription>المحتوى المجدول للنشر قريباً</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onPublishNow={onPublishNow}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past/Published */}
      {pastItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>السجل</CardTitle>
            <CardDescription>المنشورات السابقة والمجدولة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastItems.slice(0, 10).map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  compact
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد منشورات مجدولة</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ItemCard({
  item,
  onEdit,
  onDelete,
  onPublishNow,
  compact = false,
}: {
  item: ScheduledItem;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onPublishNow?: (id: number) => void;
  compact?: boolean;
}) {
  const getStatusBadge = () => {
    if (item.status === 'published') {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          منشور
        </Badge>
      );
    }

    if (item.status === 'failed') {
      return <Badge variant="destructive">فشل</Badge>;
    }

    if (isPast(item.scheduledAt)) {
      return <Badge variant="secondary">قيد النشر</Badge>;
    }

    return <Badge variant="outline">مجدول</Badge>;
  };

  return (
    <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm leading-tight line-clamp-2">{item.title}</h4>
          {getStatusBadge()}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{format(item.scheduledAt, 'PPp', { locale: ar })}</span>
          </div>
          <span>•</span>
          <span>
            {isFuture(item.scheduledAt)
              ? formatDistanceToNow(item.scheduledAt, { addSuffix: true, locale: ar })
              : formatDistanceToNow(item.scheduledAt, { locale: ar })}
          </span>
          {item.language && (
            <>
              <span>•</span>
              <Badge variant="outline" className="text-xs">
                {item.language}
              </Badge>
            </>
          )}
          {item.author && (
            <>
              <span>•</span>
              <span>{item.author}</span>
            </>
          )}
        </div>
      </div>

      {!compact && item.status === 'scheduled' && isFuture(item.scheduledAt) && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {onPublishNow && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPublishNow(item.id)}
              className="h-8 px-2"
            >
              نشر الآن
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(item.id)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item.id)}
              className="h-8 w-8 p-0 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
