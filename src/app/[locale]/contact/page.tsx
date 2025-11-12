'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export default function ContactPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (formData.name.length < 2) {
      newErrors.name = t('contact.validation.nameMin');
    } else if (formData.name.length > 100) {
      newErrors.name = t('contact.validation.nameMax');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = t('contact.validation.emailInvalid');
    }

    if (formData.subject.length < 5) {
      newErrors.subject = t('contact.validation.subjectMin');
    } else if (formData.subject.length > 200) {
      newErrors.subject = t('contact.validation.subjectMax');
    }

    if (formData.message.length < 10) {
      newErrors.message = t('contact.validation.messageMin');
    } else if (formData.message.length > 2000) {
      newErrors.message = t('contact.validation.messageMax');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
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
          description: t('contact.success'),
          variant: 'default',
        });

        // Reset form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });
        setErrors({});
      } else {
        toast({
          title: t('common.error'),
          description: t('contact.error'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        title: t('common.error'),
        description: t('contact.error'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                {t('contact.title')}
              </h1>
              <p className="text-muted-foreground">{t('contact.subtitle')}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Contact Form */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{t('contact.send')}</CardTitle>
                  <CardDescription>
                    {t('contact.subtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t('contact.name')}</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder={t('contact.namePlaceholder')}
                          value={formData.name}
                          onChange={handleChange}
                          className={errors.name ? 'border-destructive' : ''}
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive">{errors.name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">{t('contact.email')}</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder={t('contact.emailPlaceholder')}
                          value={formData.email}
                          onChange={handleChange}
                          className={errors.email ? 'border-destructive' : ''}
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">{t('contact.subject')}</Label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        placeholder={t('contact.subjectPlaceholder')}
                        value={formData.subject}
                        onChange={handleChange}
                        className={errors.subject ? 'border-destructive' : ''}
                      />
                      {errors.subject && (
                        <p className="text-sm text-destructive">{errors.subject}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">{t('contact.message')}</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder={t('contact.messagePlaceholder')}
                        value={formData.message}
                        onChange={handleChange}
                        rows={6}
                        className={errors.message ? 'border-destructive' : ''}
                      />
                      {errors.message && (
                        <p className="text-sm text-destructive">{errors.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full sm:w-auto"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin me-2">⏳</span>
                          {t('contact.sending')}
                        </>
                      ) : (
                        <>
                          <Send className="me-2 h-4 w-4" />
                          {t('contact.send')}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {t('contact.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="mt-1 h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {t('contact.email')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('contact.info.email')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="mt-1 h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {t('common.search')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('contact.info.phone')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="mt-1 h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {t('common.search')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('contact.info.address')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5">
                  <CardContent className="pt-6">
                    <h3 className="mb-2 font-semibold">
                      {t('common.appName')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      نظام متقدم لنشر المحتوى متعدد اللغات مع التكامل مع WordPress
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
