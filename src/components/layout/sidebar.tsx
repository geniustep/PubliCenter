'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  FileText,
  FolderOpen,
  LayoutDashboard,
  PenSquare,
  Settings,
  Tags,
} from 'lucide-react';

const navItems = [
  {
    title: 'nav.dashboard',
    href: '',
    icon: LayoutDashboard,
  },
  {
    title: 'nav.publish',
    href: '/publish',
    icon: PenSquare,
  },
  {
    title: 'nav.articles',
    href: '/articles',
    icon: FileText,
  },
  {
    title: 'nav.templates',
    href: '/templates',
    icon: FolderOpen,
  },
  {
    title: 'nav.categories',
    href: '/categories',
    icon: Tags,
  },
  {
    title: 'nav.analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'nav.settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const t = useTranslations();
  const params = useParams();
  const pathname = usePathname();
  const currentLocale = params.locale as string;

  return (
    <aside className="hidden w-64 border-e bg-background md:block">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const href = `/${currentLocale}${item.href}`;
          const isActive = pathname === href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {t(item.title)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
