'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Settings2, Globe, Key, Bell } from 'lucide-react';

export default function SettingsPage() {
  const t = useTranslations();
  const { toast } = useToast();

  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'PubliCenter',
    siteUrl: 'https://publicenter.geniura.com',
    language: 'ar',
    timezone: 'Africa/Cairo',
  });

  const [wordpressSettings, setWordpressSettings] = useState({
    url: process.env.NEXT_PUBLIC_WORDPRESS_URL || '',
    username: '',
    password: '',
  });

  const [translatorSettings, setTranslatorSettings] = useState({
    apiKey: '',
    autoTranslate: true,
    cacheTranslations: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    publishNotifications: true,
    errorNotifications: true,
  });

  const handleSaveGeneral = () => {
    toast({
      title: t('common.success'),
      description: t('settings.saveSuccess'),
    });
  };

  const handleSaveWordPress = () => {
    toast({
      title: t('common.success'),
      description: t('settings.saveSuccess'),
    });
  };

  const handleSaveTranslator = () => {
    toast({
      title: t('common.success'),
      description: t('settings.saveSuccess'),
    });
  };

  const handleTestConnection = async () => {
    toast({
      title: 'Testing connection...',
      description: 'Please wait...',
    });

    try {
      const response = await fetch('/api/health');
      const result = await response.json();

      if (response.ok && result.wordpress === 'healthy') {
        toast({
          title: t('common.success'),
          description: t('settings.connectionSuccess'),
        });
      } else {
        toast({
          title: t('common.error'),
          description: t('settings.connectionError'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('settings.connectionError'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-5xl py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                {t('settings.title')}
              </h1>
              <p className="text-muted-foreground">
                Manage your application settings and preferences
              </p>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  {t('settings.general')}
                </TabsTrigger>
                <TabsTrigger value="wordpress" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  WordPress
                </TabsTrigger>
                <TabsTrigger value="translator" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  {t('settings.translator')}
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
              </TabsList>

              {/* General Settings */}
              <TabsContent value="general" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>
                      Basic application settings and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="site-name">Site Name</Label>
                      <Input
                        id="site-name"
                        value={generalSettings.siteName}
                        onChange={(e) =>
                          setGeneralSettings({ ...generalSettings, siteName: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="site-url">Site URL</Label>
                      <Input
                        id="site-url"
                        type="url"
                        value={generalSettings.siteUrl}
                        onChange={(e) =>
                          setGeneralSettings({ ...generalSettings, siteUrl: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input
                        id="timezone"
                        value={generalSettings.timezone}
                        onChange={(e) =>
                          setGeneralSettings({ ...generalSettings, timezone: e.target.value })
                        }
                      />
                    </div>

                    <Separator />

                    <Button onClick={handleSaveGeneral}>
                      {t('common.save')} {t('settings.general')}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* WordPress Settings */}
              <TabsContent value="wordpress" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>WordPress Connection</CardTitle>
                    <CardDescription>
                      Configure your WordPress site connection
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="wp-url">{t('settings.wordpressUrl')}</Label>
                      <Input
                        id="wp-url"
                        type="url"
                        value={wordpressSettings.url}
                        onChange={(e) =>
                          setWordpressSettings({ ...wordpressSettings, url: e.target.value })
                        }
                        placeholder="https://your-wordpress-site.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wp-username">{t('settings.wordpressUsername')}</Label>
                      <Input
                        id="wp-username"
                        value={wordpressSettings.username}
                        onChange={(e) =>
                          setWordpressSettings({ ...wordpressSettings, username: e.target.value })
                        }
                        placeholder="admin"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wp-password">Application Password</Label>
                      <Input
                        id="wp-password"
                        type="password"
                        value={wordpressSettings.password}
                        onChange={(e) =>
                          setWordpressSettings({ ...wordpressSettings, password: e.target.value })
                        }
                        placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                      />
                      <p className="text-xs text-muted-foreground">
                        Generate an application password from WordPress Users → Application Passwords
                      </p>
                    </div>

                    <Separator />

                    <div className="flex gap-2">
                      <Button onClick={handleSaveWordPress}>
                        {t('common.save')} Settings
                      </Button>
                      <Button variant="outline" onClick={handleTestConnection}>
                        {t('settings.testConnection')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Translator Settings */}
              <TabsContent value="translator" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Translation Settings</CardTitle>
                    <CardDescription>
                      Configure Google Translate API and translation options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="translate-key">{t('settings.googleTranslateKey')}</Label>
                      <Input
                        id="translate-key"
                        type="password"
                        value={translatorSettings.apiKey}
                        onChange={(e) =>
                          setTranslatorSettings({ ...translatorSettings, apiKey: e.target.value })
                        }
                        placeholder="AIza..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Get your API key from Google Cloud Console
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Auto-translate</Label>
                          <p className="text-xs text-muted-foreground">
                            Automatically translate content on publish
                          </p>
                        </div>
                        <Switch
                          checked={translatorSettings.autoTranslate}
                          onCheckedChange={(checked) =>
                            setTranslatorSettings({ ...translatorSettings, autoTranslate: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Cache translations</Label>
                          <p className="text-xs text-muted-foreground">
                            Cache translations to reduce API calls
                          </p>
                        </div>
                        <Switch
                          checked={translatorSettings.cacheTranslations}
                          onCheckedChange={(checked) =>
                            setTranslatorSettings({ ...translatorSettings, cacheTranslations: checked })
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <Button onClick={handleSaveTranslator}>
                      {t('common.save')} Settings
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Settings */}
              <TabsContent value="notifications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Choose what notifications you want to receive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Email notifications</Label>
                          <p className="text-xs text-muted-foreground">
                            Receive email notifications for important events
                          </p>
                        </div>
                        <Switch
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Publish notifications</Label>
                          <p className="text-xs text-muted-foreground">
                            Get notified when articles are published
                          </p>
                        </div>
                        <Switch
                          checked={notificationSettings.publishNotifications}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({ ...notificationSettings, publishNotifications: checked })
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Error notifications</Label>
                          <p className="text-xs text-muted-foreground">
                            Receive alerts for errors and failures
                          </p>
                        </div>
                        <Switch
                          checked={notificationSettings.errorNotifications}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({ ...notificationSettings, errorNotifications: checked })
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <Button>
                      {t('common.save')} Preferences
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
