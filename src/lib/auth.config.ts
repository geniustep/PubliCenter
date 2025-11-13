import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { UserRole } from '@/types/api';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier?.trim();
        const password = credentials?.password;

        if (!identifier || !password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: identifier, mode: 'insensitive' } },
              { username: { equals: identifier, mode: 'insensitive' } },
            ],
          },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        if (!user.isActive) {
          throw new Error('Account is deactivated');
        }

        const isPasswordValid = await compare(password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        const role = (user.role ?? UserRole.AUTHOR) as UserRole;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role,
          username: user.username ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        const userRole = user.role as UserRole;
        token.id = user.id;
        token.role = userRole;
        token.email = user.email;
        if ('username' in user) {
          token.username = ((user as any).username as string | null) ?? null;
        } else {
          token.username = null;
        }
      }

      // Update session
      if (trigger === 'update' && session) {
        token.name = session.name;
        token.email = session.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.email = token.email as string;
        session.user.username = (token.username as string | undefined) ?? null;
      }

      return session;
    },
  },
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token.email}`);
    },
  },
  debug: process.env.NODE_ENV === 'development',
};
