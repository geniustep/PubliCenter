import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArticleStatus } from '@/types/api';

interface ArticleFiltersProps {
  currentStatus?: ArticleStatus;
  onStatusChange: (status?: ArticleStatus) => void;
}

export function ArticleFilters({
  currentStatus,
  onStatusChange,
}: ArticleFiltersProps) {
  const t = useTranslations();

  const statuses: { value: ArticleStatus | undefined; label: string }[] = [
    { value: undefined, label: t('articles.filters.all') },
    { value: ArticleStatus.PUBLISHED, label: t('articles.status.published') },
    { value: ArticleStatus.DRAFT, label: t('articles.status.draft') },
    { value: ArticleStatus.ARCHIVED, label: t('articles.status.archived') },
  ];

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        {t('articles.filters.filterBy')}:
      </span>
      {statuses.map((status) => (
        <Button
          key={status.value || 'all'}
          variant={currentStatus === status.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusChange(status.value)}
        >
          {status.label}
        </Button>
      ))}
    </div>
  );
}
