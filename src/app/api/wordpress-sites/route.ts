import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/error-handler';
import { z } from 'zod';
import { encrypt } from '@/lib/encryption';
import { createPluginDetector } from '@/lib/wordpress-plugin-detector';
import { hasPermission } from '@/lib/rbac';
import { Language } from '@/types/api';

// Validation schema for creating WordPress site
const createSiteSchema = z.object({
  name: z.string().min(2, 'Site name must be at least 2 characters'),
  url: z.string().url('Invalid URL'),
  language: z.nativeEnum(Language),
  username: z.string().min(1, 'Username is required'),
  appPassword: z.string().min(1, 'App password is required'),
});

/**
 * GET /api/wordpress-sites
 * List all WordPress sites with pagination
 */
export const GET = asyncHandler(async (request: NextRequest) => {
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

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const isActive = searchParams.get('isActive');
  const language = searchParams.get('language');

  const where: any = {};

  if (isActive !== null && isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  if (language) {
    where.language = language;
  }

  const [sites, total] = await Promise.all([
    prisma.wordPressSite.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { translations: true },
        },
      },
    }),
    prisma.wordPressSite.count({ where }),
  ]);

  // Remove sensitive data from response
  const sanitizedSites = sites.map((site) => ({
    ...site,
    appPassword: undefined, // Don't send password to client
  }));

  return NextResponse.json({
    success: true,
    data: sanitizedSites,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * POST /api/wordpress-sites
 * Create a new WordPress site
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  console.log('🔵 [POST /api/wordpress-sites] Request received');
  console.log('📥 Request headers:', {
    'content-type': request.headers.get('content-type'),
    'user-agent': request.headers.get('user-agent'),
    'cookie': request.headers.get('cookie') ? `[PRESENT - Length: ${request.headers.get('cookie')?.length}]` : '[MISSING]',
  });

  const session = await getServerSession(authOptions);
  console.log('🔐 [POST /api/wordpress-sites] Session check:', {
    hasSession: !!session,
    userId: session?.user?.id,
    userEmail: session?.user?.email,
    userRole: session?.user?.role,
  });

  if (!session?.user) {
    console.log('❌ [POST /api/wordpress-sites] Unauthorized - No session');
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  console.log('👤 [POST /api/wordpress-sites] User:', {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
  });

  // Check permissions
  const hasCreatePermission = hasPermission(session.user.role, 'wordpress-sites', 'create');
  console.log('🔐 [POST /api/wordpress-sites] Permission check:', {
    role: session.user.role,
    resource: 'wordpress-sites',
    action: 'create',
    hasPermission: hasCreatePermission,
  });

  if (!hasCreatePermission) {
    console.log('❌ [POST /api/wordpress-sites] Forbidden - No permission');
    return NextResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  }

  const body = await request.json();
  console.log('📦 [POST /api/wordpress-sites] Request body:', {
    name: body.name,
    url: body.url,
    language: body.language,
    username: body.username,
    appPassword: body.appPassword ? `[HIDDEN - Length: ${body.appPassword.length}]` : undefined,
  });

  // Validate request body
  const validationResult = createSiteSchema.safeParse(body);

  if (!validationResult.success) {
    console.log('❌ [POST /api/wordpress-sites] Validation failed:', validationResult.error.issues);
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: validationResult.error.issues,
      },
      { status: 400 }
    );
  }

  const { name, url, language, username, appPassword } = validationResult.data;

  // Normalize URL (remove trailing slash)
  const normalizedUrl = url.replace(/\/$/, '');

  // Check if site already exists
  const existingSite = await prisma.wordPressSite.findUnique({
    where: { url: normalizedUrl },
  });

  if (existingSite) {
    console.log('❌ [POST /api/wordpress-sites] Site already exists:', normalizedUrl);
    return NextResponse.json(
      { success: false, error: 'Site with this URL already exists' },
      { status: 400 }
    );
  }

  console.log('🔍 [POST /api/wordpress-sites] Testing connection and detecting plugin...');

  // Encrypt the app password (using encryption, not hashing, so we can decrypt it later)
  const encryptedPassword = encrypt(appPassword);

  try {
    // Test connection and detect plugin before saving
    const detector = createPluginDetector(normalizedUrl, username, appPassword);
    const pluginInfo = await detector.detectPlugin();
    
    console.log('✅ [POST /api/wordpress-sites] Plugin detected:', {
      plugin: pluginInfo.plugin,
      version: pluginInfo.version,
      supportedLanguages: pluginInfo.supportedLanguages,
    });

    // Create the site
    const site = await prisma.wordPressSite.create({
      data: {
        name,
        url: normalizedUrl,
        language,
        username,
        appPassword: encryptedPassword,
        translationPlugin: pluginInfo.plugin,
        pluginVersion: pluginInfo.version,
        pluginSettings: pluginInfo.settings || {},
        supportedLanguages: pluginInfo.supportedLanguages || [],
        isActive: true,
      },
      include: {
        _count: {
          select: { translations: true },
        },
      },
    });

    console.log('✅ [POST /api/wordpress-sites] Site created successfully:', {
      id: site.id,
      name: site.name,
      url: site.url,
      language: site.language,
      plugin: site.translationPlugin,
    });

    // Remove sensitive data from response
    const sanitizedSite = {
      ...site,
      appPassword: undefined,
    };

    const response = {
      success: true,
      data: {
        site: sanitizedSite,
        message: 'WordPress site added successfully',
        pluginDetected: pluginInfo.plugin,
      },
    };

    console.log('📤 [POST /api/wordpress-sites] Response:', {
      success: response.success,
      siteId: sanitizedSite.id,
      siteName: sanitizedSite.name,
      pluginDetected: pluginInfo.plugin,
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('❌ [POST /api/wordpress-sites] Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to WordPress site. Please check your credentials.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
