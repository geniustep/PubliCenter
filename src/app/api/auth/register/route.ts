import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { asyncHandler } from '@/lib/error-handler';
import { UserRole } from '@/types/api';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
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

  const { name, email, password } = validationResult.data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json(
      {
        success: false,
        error: 'User with this email already exists',
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
      email,
      password: hashedPassword,
      role: UserRole.AUTHOR, // Default role
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
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
