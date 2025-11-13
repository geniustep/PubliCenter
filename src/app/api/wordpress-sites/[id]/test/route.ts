import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/error-handler';
import { hasPermission } from '@/lib/rbac';

/**
 * POST /api/wordpress-sites/[id]/test
 * Test connection to WordPress site
 */
export const POST = asyncHandler(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
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
      // Create WordPress client (note: we can't decrypt the password easily)
      // In a real scenario, we'd need to implement proper encryption/decryption
      // For now, we'll test using the stored credentials

      // This is a simplified approach - in production, you'd want to:
      // 1. Use proper encryption for passwords (not bcrypt, use crypto.encrypt/decrypt)
      // 2. Or require the user to provide credentials for testing

      const response = await fetch(`${site.url}/wp-json/wp/v2/users/me`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${site.username}:${site.appPassword}`).toString('base64')}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();

        return NextResponse.json({
          success: true,
          data: {
            message: 'Connection successful',
            siteInfo: {
              url: site.url,
              username: site.username,
              userRole: userData.roles?.[0] || 'unknown',
              capabilities: userData.capabilities || {},
            },
          },
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Connection failed',
            details: `HTTP ${response.status}: ${response.statusText}`,
          },
          { status: 500 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Connection failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
);
