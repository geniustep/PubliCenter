import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/error-handler';
import { createPluginDetector } from '@/lib/wordpress-plugin-detector';
import { hasPermission } from '@/lib/rbac';
import { decrypt } from '@/lib/encryption';

/**
 * POST /api/wordpress-sites/[id]/detect-plugin
 * Detect translation plugin on WordPress site
 */
export const POST = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    console.log('🔵 [POST /api/wordpress-sites/[id]/detect-plugin] Request received');
    
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      console.log('❌ [POST /api/wordpress-sites/[id]/detect-plugin] Unauthorized - No session');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('👤 [POST /api/wordpress-sites/[id]/detect-plugin] User:', {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    // Check permissions
    if (!hasPermission(session.user.role, 'wordpress-sites', 'update')) {
      console.log('❌ [POST /api/wordpress-sites/[id]/detect-plugin] Forbidden - No permission');
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const siteId = parseInt(params.id);
    console.log('🔍 [POST /api/wordpress-sites/[id]/detect-plugin] Site ID:', siteId);

    const site = await prisma.wordPressSite.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      console.log('❌ [POST /api/wordpress-sites/[id]/detect-plugin] Site not found:', siteId);
      return NextResponse.json(
        { success: false, error: 'WordPress site not found' },
        { status: 404 }
      );
    }

    console.log('📋 [POST /api/wordpress-sites/[id]/detect-plugin] Site info:', {
      id: site.id,
      name: site.name,
      url: site.url,
      currentPlugin: site.translationPlugin,
    });

    try {
      // Get the plain password from request body, or use stored password
      const body = await request.json().catch(() => ({}));
      let appPassword = body.appPassword;

      // If no password provided, decrypt the stored password
      if (!appPassword) {
        console.log('🔐 [POST /api/wordpress-sites/[id]/detect-plugin] No password provided, using stored password');
        try {
          appPassword = decrypt(site.appPassword);
          console.log('✅ [POST /api/wordpress-sites/[id]/detect-plugin] Stored password decrypted successfully');
        } catch (decryptError) {
          console.error('❌ [POST /api/wordpress-sites/[id]/detect-plugin] Failed to decrypt stored password:', {
            error: decryptError instanceof Error ? decryptError.message : 'Unknown error',
          });
          return NextResponse.json(
            {
              success: false,
              error: 'App password required for detection',
              details: 'Please provide the app password to detect the translation plugin. The stored password could not be decrypted.',
            },
            { status: 400 }
          );
        }
      }

      if (!appPassword) {
        console.log('❌ [POST /api/wordpress-sites/[id]/detect-plugin] App password missing');
        return NextResponse.json(
          {
            success: false,
            error: 'App password required for detection',
            details: 'Please provide the app password to detect the translation plugin',
          },
          { status: 400 }
        );
      }

      console.log('🚀 [POST /api/wordpress-sites/[id]/detect-plugin] Starting plugin detection...');
      console.log('   Site URL:', site.url);
      console.log('   Username:', site.username);
      console.log('   App Password:', appPassword ? `[HIDDEN - Length: ${appPassword.length}]` : 'Not provided');
      console.log('   Password source:', body.appPassword ? 'Provided in request' : 'Decrypted from storage');

      const detector = createPluginDetector(site.url, site.username, appPassword);
      const pluginInfo = await detector.detectPlugin();

      console.log('✅ [POST /api/wordpress-sites/[id]/detect-plugin] Plugin detected:', {
        plugin: pluginInfo.plugin,
        version: pluginInfo.version,
        supportedLanguages: pluginInfo.supportedLanguages,
        languagesCount: pluginInfo.supportedLanguages?.length || 0,
      });

      // Update site with detected plugin info
      await prisma.wordPressSite.update({
        where: { id: siteId },
        data: {
          translationPlugin: pluginInfo.plugin,
          pluginVersion: pluginInfo.version,
          pluginSettings: pluginInfo.settings || {},
          supportedLanguages: pluginInfo.supportedLanguages || [],
          updatedAt: new Date(),
        },
      });

      console.log('💾 [POST /api/wordpress-sites/[id]/detect-plugin] Site updated in database');

      return NextResponse.json({
        success: true,
        data: {
          message: 'Plugin detection completed',
          plugin: pluginInfo.plugin,
          version: pluginInfo.version,
          supportedLanguages: pluginInfo.supportedLanguages,
          settings: pluginInfo.settings,
        },
      });
    } catch (error) {
      console.error('❌ [POST /api/wordpress-sites/[id]/detect-plugin] Plugin detection failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Plugin detection failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
);
