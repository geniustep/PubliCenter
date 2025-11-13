import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { asyncHandler } from '@/lib/error-handler';
import { UserRole } from '@/types/api';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(
        /^[a-zA-Z0-9._-]+$/,
        'Username can only contain letters, numbers, dots, underscores, and hyphens'
      ),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const POST = asyncHandler(async (request: NextRequest) => {
  const body = await request.json();

  // Validate request body
  const validationResult = registerSchema.safeParse(body);

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

  const { name, username, email, password } = validationResult.data;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return NextResponse.json(
      {
        success: false,
        error: 'EMAIL_TAKEN',
        errorCode: 'EMAIL_TAKEN',
      },
      { status: 400 }
    );
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username: normalizedUsername },
  });

  if (existingUsername) {
    return NextResponse.json(
      {
        success: false,
        error: 'USERNAME_TAKEN',
        errorCode: 'USERNAME_TAKEN',
      },
      { status: 400 }
    );
  }

  // Hash password
  const hashedPassword = await hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      username: normalizedUsername,
      password: hashedPassword,
      role: UserRole.AUTHOR, // Default role
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        user,
        message: 'Account created successfully. You can now sign in.',
      },
    },
    { status: 201 }
  );
});
