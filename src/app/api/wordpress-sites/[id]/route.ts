import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/error-handler';
import { z } from 'zod';
import { encrypt } from '@/lib/encryption';
import { hasPermission } from '@/lib/rbac';
import { Language } from '@/types/api';

// Validation schema for updating WordPress site
const updateSiteSchema = z.object({
  name: z.string().min(2).optional(),
  url: z.string().url().optional(),
  language: z.nativeEnum(Language).optional(),
  username: z.string().min(1).optional(),
  appPassword: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/wordpress-sites/[id]
 * Get a specific WordPress site
 */
export const GET = asyncHandler(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions
    if (!hasPermission(session.user.role, 'wordpress-sites', 'read')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const siteId = parseInt(params.id);

    const site = await prisma.wordPressSite.findUnique({
      where: { id: siteId },
      include: {
        _count: {
          select: { translations: true },
        },
      },
    });

    if (!site) {
      return NextResponse.json(
        { success: false, error: 'WordPress site not found' },
        { status: 404 }
      );
    }

    // Remove sensitive data
    const sanitizedSite = {
      ...site,
      appPassword: undefined,
    };

    return NextResponse.json({
      success: true,
      data: sanitizedSite,
    });
  }
);

/**
 * PUT /api/wordpress-sites/[id]
 * Update a WordPress site
 */
export const PUT = asyncHandler(
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
    const body = await request.json();

    // Validate request body
    const validationResult = updateSiteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const updateData: any = { ...validationResult.data };

    // If URL is being updated, normalize it
    if (updateData.url) {
      updateData.url = updateData.url.replace(/\/$/, '');

      // Check if new URL conflicts with another site
      const existingSite = await prisma.wordPressSite.findFirst({
        where: {
          url: updateData.url,
          NOT: { id: siteId },
        },
      });

      if (existingSite) {
        return NextResponse.json(
          { success: false, error: 'Site with this URL already exists' },
          { status: 400 }
        );
      }
    }

    // If password is being updated, hash it
    if (updateData.appPassword) {
      updateData.appPassword = encrypt(updateData.appPassword);
    }

    const site = await prisma.wordPressSite.update({
      where: { id: siteId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: { translations: true },
        },
      },
    });

    // Remove sensitive data
    const sanitizedSite = {
      ...site,
      appPassword: undefined,
    };

    return NextResponse.json({
      success: true,
      data: {
        site: sanitizedSite,
        message: 'WordPress site updated successfully',
      },
    });
  }
);

/**
 * DELETE /api/wordpress-sites/[id]
 * Delete a WordPress site
 */
export const DELETE = asyncHandler(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions
    const hasDeletePermission = hasPermission(session.user.role, 'wordpress-sites', 'delete');
    console.log('🔐 [DELETE /api/wordpress-sites/[id]] Permission check:', {
      role: session.user.role,
      resource: 'wordpress-sites',
      action: 'delete',
      hasPermission: hasDeletePermission,
    });

    if (!hasDeletePermission) {
      console.log('❌ [DELETE /api/wordpress-sites/[id]] Forbidden - No permission');
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const siteId = parseInt(params.id);

    // Check if site exists
    const site = await prisma.wordPressSite.findUnique({
      where: { id: siteId },
      include: {
        _count: {
          select: { translations: true },
        },
      },
    });

    if (!site) {
      return NextResponse.json(
        { success: false, error: 'WordPress site not found' },
        { status: 404 }
      );
    }

    // Check if site has translations
    console.log('🔍 [DELETE /api/wordpress-sites/[id]] Checking translations:', {
      siteId,
      translationsCount: site._count.translations,
    });

    if (site._count.translations > 0) {
      console.log('❌ [DELETE /api/wordpress-sites/[id]] Cannot delete - has translations');
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete site with existing translations',
          details: `This site has ${site._count.translations} translations. Please remove them first.`,
        },
        { status: 400 }
      );
    }

    console.log('🗑️ [DELETE /api/wordpress-sites/[id]] Deleting site:', siteId);
    await prisma.wordPressSite.delete({
      where: { id: siteId },
    });
    console.log('✅ [DELETE /api/wordpress-sites/[id]] Site deleted successfully');

    return NextResponse.json({
      success: true,
      data: {
        message: 'WordPress site deleted successfully',
      },
    });
  }
);
