'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Globe, LogOut, Settings, User } from 'lucide-react';
import { i18n, localeNames } from '@/i18n-config';

export function Header() {
  const t = useTranslations();
  const params = useParams();
  const pathname = usePathname();
  const currentLocale = params.locale as string;

  const switchLocale = (newLocale: string) => {
    // Remove the current locale from pathname
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '');
    // Navigate to new locale
    window.location.href = `/${newLocale}${pathWithoutLocale}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        {/* Logo */}
        <Link
          href={`/${currentLocale}`}
          className="flex items-center space-x-2 rtl:space-x-reverse"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-xl font-bold">P</span>
          </div>
          <span className="hidden font-bold sm:inline-block">
            {t('common.appName')}
          </span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {i18n.locales.map((locale) => (
                <DropdownMenuItem
                  key={locale}
                  onClick={() => switchLocale(locale)}
                  className={currentLocale === locale ? 'bg-accent' : ''}
                >
                  {localeNames[locale]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatar.png" alt="User" />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/${currentLocale}/settings`}>
                  <Settings className="me-2 h-4 w-4" />
                  {t('nav.settings')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${currentLocale}/profile`}>
                  <User className="me-2 h-4 w-4" />
                  {t('nav.profile')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="me-2 h-4 w-4" />
                {t('auth.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
