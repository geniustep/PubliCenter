'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const callbackUrl = searchParams.get('callbackUrl') || '/ar/articles';

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.identifier) {
      newErrors.identifier = t('auth.validation.identifierRequired');
    }

    if (!formData.password) {
      newErrors.password = t('auth.validation.passwordRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        identifier: formData.identifier,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: t('common.error'),
          description: t('auth.invalidCredentials'),
          variant: 'destructive',
        });
      } else if (result?.ok) {
        toast({
          title: t('common.success'),
          description: t('auth.loginSuccess'),
          variant: 'default',
        });

        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: t('common.error'),
        description: t('auth.loginError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{t('auth.title')}</CardTitle>
          <CardDescription>{t('auth.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">{t('auth.identifier')}</Label>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                placeholder={t('auth.identifierPlaceholder')}
                value={formData.identifier}
                onChange={handleChange}
                className={errors.identifier ? 'border-destructive' : ''}
                disabled={isLoading}
              />
              {errors.identifier && (
                <p className="text-sm text-destructive">{errors.identifier}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={t('auth.passwordPlaceholder')}
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'border-destructive' : ''}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin me-2">⏳</span>
                  {t('auth.loggingIn')}
                </>
              ) : (
                <>
                  <LogIn className="me-2 h-4 w-4" />
                  {t('auth.loginButton')}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{t('auth.noAccount')} </span>
            <Link
              href="./register"
              className="font-medium text-primary hover:underline"
            >
              {t('auth.registerLink')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
