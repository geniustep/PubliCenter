import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { uploadRateLimit } from '@/lib/rate-limiter';
import { asyncHandler, ValidationError } from '@/lib/error-handler';
import { validateFileType, validateFileSize, sanitizeFilename } from '@/lib/sanitize';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/upload
 * Upload image file
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  // Apply rate limiting
  const rateLimitResponse = await uploadRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Parse form data
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    throw new ValidationError('No file provided');
  }

  // Validate file type
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  if (!validateFileType(file.type, allowedTypes)) {
    throw new ValidationError('Invalid file type. Allowed types: ' + allowedTypes.join(', '));
  }

  // Validate file size
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB default
  if (!validateFileSize(file.size, maxSize)) {
    throw new ValidationError(`File size exceeds maximum allowed size of ${maxSize} bytes`);
  }

  // Generate unique filename
  const timestamp = Date.now();
  const originalName = file.name;
  const sanitized = sanitizeFilename(originalName);
  const filename = `${timestamp}-${sanitized}`;

  // Ensure uploads directory exists
  const uploadsDir = join(process.cwd(), 'public', 'uploads');
  try {
    await mkdir(uploadsDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  // Save file
  const buffer = Buffer.from(await file.arrayBuffer());
  const filepath = join(uploadsDir, filename);

  try {
    await writeFile(filepath, buffer);

    logger.info('File uploaded', {
      filename,
      size: file.size,
      type: file.type,
    });

    // Return file info
    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        url: fileUrl,
        filename,
        originalName,
        size: file.size,
        mimeType: file.type,
      },
    });
  } catch (error) {
    logger.error('Failed to save file', {
      error: error instanceof Error ? error.message : 'Unknown error',
      filename,
    });

    throw new Error('Failed to save file');
  }
});
