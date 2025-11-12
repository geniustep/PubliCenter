import { NextRequest, NextResponse } from 'next/server';
import { asyncHandler } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

export const POST = asyncHandler(async (request: NextRequest) => {
  const body = await request.json();

  // Validate request body
  const validationResult = contactSchema.safeParse(body);

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

  const { name, email, subject, message } = validationResult.data;

  // Log the contact form submission
  logger.info('Contact form submission received', {
    name,
    email,
    subject,
    messageLength: message.length,
  });

  // TODO: In production, you would:
  // 1. Save to database (Contact model in Prisma)
  // 2. Send email notification to admin
  // 3. Send auto-reply to user
  // 4. Integrate with CRM or support system

  // For now, we'll just log it and return success
  // You can add email sending functionality here using services like:
  // - Resend
  // - SendGrid
  // - AWS SES
  // - Nodemailer with SMTP

  return NextResponse.json(
    {
      success: true,
      data: {
        message: 'Thank you for contacting us! We will get back to you soon.',
      },
    },
    { status: 200 }
  );
});
