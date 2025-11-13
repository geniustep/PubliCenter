import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/error-handler';
import { createPluginDetector } from '@/lib/wordpress-plugin-detector';
import { hasPermission } from '@/lib/rbac';

/**
 * POST /api/wordpress-sites/[id]/detect-plugin
 * Detect translation plugin on WordPress site
 */
export const POST = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions
    if (!hasPermission(session.user.role, 'wordpress-sites', 'update')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const siteId = parseInt(params.id);

    const site = await prisma.wordPressSite.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return NextResponse.json(
        { success: false, error: 'WordPress site not found' },
        { status: 404 }
      );
    }

    try {
      // Note: In production, you'd need to decrypt the password properly
      // For now, we'll assume the password is accessible (simplified)

      // Get the plain password from request body (temporary solution)
      const body = await request.json();
      const { appPassword } = body;

      if (!appPassword) {
        return NextResponse.json(
          {
            success: false,
            error: 'App password required for detection',
            details: 'Please provide the app password to detect the translation plugin',
          },
          { status: 400 }
        );
      }

      const detector = createPluginDetector(site.url, site.username, appPassword);
      const pluginInfo = await detector.detectPlugin();

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
