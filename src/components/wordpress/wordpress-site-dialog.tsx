'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateWordPressSite, useUpdateWordPressSite } from '@/hooks/use-wordpress-sites';
import { toast } from 'sonner';
import { Loader2, Info } from 'lucide-react';
import { Language, type WordPressSite } from '@/types/api';

interface WordPressSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site?: WordPressSite | null;
}

export function WordPressSiteDialog({ open, onOpenChange, site }: WordPressSiteDialogProps) {
  const t = useTranslations();
  const { data: session, status } = useSession();
  const isEdit = !!site;
  const createSite = useCreateWordPressSite();
  const updateSite = useUpdateWordPressSite();

  const formSchema = z.object({
    name: z.string().min(2, t('wordpress.validation.nameMin')),
    url: z.string().url(t('wordpress.validation.urlInvalid')),
    language: z.nativeEnum(Language),
    username: z.string().min(1, t('wordpress.validation.usernameRequired')),
    appPassword: isEdit
      ? z.string().optional()
      : z.string().min(1, t('wordpress.validation.appPasswordRequired')),
    isActive: z.boolean(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: site?.name || '',
      url: site?.url || '',
      language: site?.language || Language.AR,
      username: site?.username || '',
      appPassword: '',
      isActive: site?.isActive ?? true,
    },
  });

  // Reset form when site changes
  useEffect(() => {
    if (site) {
      form.reset({
        name: site.name,
        url: site.url,
        language: site.language,
        username: site.username,
        appPassword: '',
        isActive: site.isActive,
      });
    } else {
      form.reset({
        name: '',
        url: '',
        language: Language.AR,
        username: '',
        appPassword: '',
        isActive: true,
      });
    }
  }, [site, form]);

  const onSubmit = async (data: FormValues) => {
    console.log('🖱️ [Frontend] Submit button clicked');
    console.log('🔐 [Frontend] Session status:', {
      status,
      isAuthenticated: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
    });
    console.log('📝 [Frontend] Form data:', {
      isEdit,
      name: data.name,
      url: data.url,
      language: data.language,
      username: data.username,
      appPassword: data.appPassword ? `[HIDDEN - Length: ${data.appPassword.length}]` : undefined,
      isActive: data.isActive,
    });

    try {
      if (isEdit && site) {
        console.log('✏️ [Frontend] Updating existing site:', site.id);
        const updateData: any = {
          name: data.name,
          url: data.url,
          language: data.language,
          username: data.username,
          isActive: data.isActive,
        };

        // Only include password if provided
        if (data.appPassword) {
          updateData.appPassword = data.appPassword;
        }

        await updateSite.mutateAsync({ id: site.id, data: updateData });
        toast.success(t('wordpress.updateSuccess'));
      } else {
        console.log('➕ [Frontend] Creating new WordPress site');
        const createData = {
          name: data.name,
          url: data.url,
          language: data.language,
          username: data.username,
          appPassword: data.appPassword!,
        };
        
        console.log('📤 [Frontend] Calling createSite.mutateAsync with:', {
          ...createData,
          appPassword: '[HIDDEN]',
        });

        await createSite.mutateAsync(createData);
        console.log('✅ [Frontend] Site created successfully');
        toast.success(t('wordpress.createSuccess'));
      }

      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('❌ [Frontend] Error in onSubmit:', error);
      toast.error(error instanceof Error ? error.message : t('wordpress.createError'));
    }
  };

  const isPending = createSite.isPending || updateSite.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('wordpress.editSite') : t('wordpress.addSite')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'قم بتحديث معلومات الموقع'
              : 'أضف موقع WordPress جديد للمزامنة'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Site Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('wordpress.siteName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="المدونة الرئيسية"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Site URL */}
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('wordpress.siteUrl')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{t('wordpress.help.url')}</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Language */}
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('wordpress.siteLanguage')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('publish.selectLanguages')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={Language.AR}>
                        {t('languages.ar')}
                      </SelectItem>
                      <SelectItem value={Language.EN}>
                        {t('languages.en')}
                      </SelectItem>
                      <SelectItem value={Language.FR}>
                        {t('languages.fr')}
                      </SelectItem>
                      <SelectItem value={Language.ES}>
                        {t('languages.es')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Username */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('wordpress.username')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="admin"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* App Password */}
            <FormField
              control={form.control}
              name="appPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('wordpress.appPassword')}
                    {isEdit && ' (اختياري)'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="xxxx xxxx xxxx xxxx"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{t('wordpress.help.appPassword')}</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Is Active */}
            {isEdit && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t('wordpress.status')}
                      </FormLabel>
                      <FormDescription>
                        {field.value ? t('wordpress.active') : t('wordpress.inactive')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEdit ? t('common.save') : t('wordpress.addSite')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
