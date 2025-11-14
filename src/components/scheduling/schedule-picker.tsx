'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Send, Save } from 'lucide-react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { ar } from 'date-fns/locale';

interface SchedulePickerProps {
  onSchedule: (date: Date) => void;
  onPublishNow?: () => void;
  onSaveDraft?: () => void;
  defaultDate?: Date;
}

export function SchedulePicker({
  onSchedule,
  onPublishNow,
  onSaveDraft,
  defaultDate,
}: SchedulePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate || new Date());
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [quickOption, setQuickOption] = useState<string>('custom');

  const handleQuickSelect = (option: string) => {
    setQuickOption(option);
    const now = new Date();

    switch (option) {
      case 'now':
        setSelectedDate(now);
        setSelectedTime(format(now, 'HH:mm'));
        break;
      case 'tomorrow':
        setSelectedDate(addDays(now, 1));
        setSelectedTime('09:00');
        break;
      case 'next-week':
        setSelectedDate(addWeeks(now, 1));
        setSelectedTime('09:00');
        break;
      case 'next-month':
        setSelectedDate(addMonths(now, 1));
        setSelectedTime('09:00');
        break;
      default:
        // custom
        break;
    }
  };

  const handleSchedule = () => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledDate = new Date(selectedDate);
    scheduledDate.setHours(hours, minutes, 0, 0);
    onSchedule(scheduledDate);
  };

  const getFormattedDate = () => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const date = new Date(selectedDate);
    date.setHours(hours, minutes);
    return format(date, 'PPp', { locale: ar });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          جدولة النشر
        </CardTitle>
        <CardDescription>حدد متى تريد نشر هذا المحتوى</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Options */}
        <div className="space-y-2">
          <Label>خيارات سريعة</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={quickOption === 'now' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleQuickSelect('now')}
            >
              <Send className="h-4 w-4 mr-2" />
              الآن
            </Button>
            <Button
              variant={quickOption === 'tomorrow' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleQuickSelect('tomorrow')}
            >
              غداً
            </Button>
            <Button
              variant={quickOption === 'next-week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleQuickSelect('next-week')}
            >
              الأسبوع القادم
            </Button>
            <Button
              variant={quickOption === 'next-month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleQuickSelect('next-month')}
            >
              الشهر القادم
            </Button>
          </div>
        </div>

        {/* Custom Date/Time */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>التاريخ</Label>
            <Input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                setQuickOption('custom');
                setSelectedDate(new Date(e.target.value));
              }}
              min={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              الوقت
            </Label>
            <Input
              type="time"
              value={selectedTime}
              onChange={(e) => {
                setQuickOption('custom');
                setSelectedTime(e.target.value);
              }}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">سيتم النشر في:</p>
          <p className="font-medium">{getFormattedDate()}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button onClick={handleSchedule} className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            جدولة النشر
          </Button>

          {onPublishNow && (
            <Button variant="outline" onClick={onPublishNow} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              نشر الآن
            </Button>
          )}

          {onSaveDraft && (
            <Button variant="ghost" onClick={onSaveDraft} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              حفظ كمسودة
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
