'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMemo } from 'react';

interface LanguageData {
  language: string;
  label: string;
  total: number;
  translated: number;
  pending: number;
}

interface TranslationProgressChartProps {
  data: LanguageData[];
}

export function TranslationProgressChart({ data }: TranslationProgressChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      percentage: item.total > 0 ? Math.round((item.translated / item.total) * 100) : 0,
    }));
  }, [data]);

  const getColor = (language: string) => {
    const colors: Record<string, string> = {
      AR: 'bg-blue-500',
      EN: 'bg-green-500',
      FR: 'bg-purple-500',
    };
    return colors[language] || 'bg-gray-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>تقدم الترجمة حسب اللغة</CardTitle>
        <CardDescription>
          نسبة المقالات المترجمة لكل لغة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {chartData.map((item) => (
          <div key={item.language} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getColor(item.language)}`} />
                <span className="font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {item.translated} / {item.total}
                </span>
                <span className="font-bold min-w-[3ch] text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 ${getColor(item.language)} transition-all duration-500`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>قيد الانتظار: {item.pending}</span>
              <span>
                متبقي: {item.total - item.translated}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
