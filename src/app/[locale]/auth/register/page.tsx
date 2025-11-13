'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = t('auth.validation.nameRequired');
    } else if (formData.name.length < 2) {
      newErrors.name = t('auth.validation.nameMin');
    }

    if (!formData.username) {
      newErrors.username = t('auth.validation.usernameRequired');
    } else if (formData.username.length < 3) {
      newErrors.username = t('auth.validation.usernameMin');
    } else if (formData.username.length > 30) {
      newErrors.username = t('auth.validation.usernameMax');
    } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.username)) {
      newErrors.username = t('auth.validation.usernameInvalid');
    }

    if (!formData.email) {
      newErrors.email = t('auth.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('auth.validation.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('auth.validation.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('auth.validation.passwordMin');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.validation.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.validation.passwordsNotMatch');
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: t('common.success'),
          description: t('auth.registerSuccess'),
          variant: 'default',
        });

        // Redirect to login page
        router.push('./login');
      } else {
        const errorKey =
          result?.error === 'EMAIL_TAKEN' || result?.errorCode === 'EMAIL_TAKEN'
            ? 'auth.emailTaken'
            : result?.error === 'USERNAME_TAKEN' || result?.errorCode === 'USERNAME_TAKEN'
              ? 'auth.usernameTaken'
              : null;

        const description = errorKey ? t(errorKey) : result?.error || t('auth.registerError');

        toast({
          title: t('common.error'),
          description,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Register error:', error);
      toast({
        title: t('common.error'),
        description: t('auth.registerError'),
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
          <CardTitle className="text-2xl font-bold">{t('auth.registerTitle')}</CardTitle>
          <CardDescription>{t('auth.registerSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('auth.name')}</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder={t('auth.namePlaceholder')}
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'border-destructive' : ''}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">{t('auth.username')}</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder={t('auth.usernamePlaceholder')}
                value={formData.username}
                onChange={handleChange}
                className={errors.username ? 'border-destructive' : ''}
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'border-destructive' : ''}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder={t('auth.confirmPasswordPlaceholder')}
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'border-destructive' : ''}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
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
                  {t('auth.registering')}
                </>
              ) : (
                <>
                  <UserPlus className="me-2 h-4 w-4" />
                  {t('auth.registerButton')}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{t('auth.hasAccount')} </span>
            <Link
              href="./login"
              className="font-medium text-primary hover:underline"
            >
              {t('auth.loginLink')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
