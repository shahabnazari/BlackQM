/**
 * NextAuth.js Configuration Options
 * Shared configuration for authentication
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { z } from 'zod';

// Credential validation schema
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authOptions: NextAuthOptions = {
  // Configure authentication providers
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, _req) {
        try {
          // Validate credentials
          const validatedCreds = credentialsSchema.parse(credentials);

          // Call backend authentication API
          const response = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: validatedCreds.email,
              password: validatedCreds.password,
            }),
          });

          if (!response.ok) {
            console.error('Authentication failed:', response.status);
            return null;
          }

          const data = await response.json();

          if (data.user && data.accessToken) {
            return {
              id: data.user['id'],
              email: data.user.email,
              name: data.user.name || null,
              role: data.user['role'] || 'researcher',
              accessToken: data.accessToken,
            } as any;
          }

          return null;
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],

  // Session configuration
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  // JWT configuration
  jwt: {
    secret:
      process.env.NEXTAUTH_SECRET || 'default-secret-for-development-only',
  },

  // Pages configuration
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },

  // Callbacks
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token['id'] = user['id'];
        token.email = user.email || null;
        token['role'] = (user as any)['role'];
        token['accessToken'] = (user as any)['accessToken'];
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any)['id'] = token['id'];
        (session.user as any)['role'] = token['role'];
        (session as any)['accessToken'] = token['accessToken'];
      }
      return session;
    },
  },

  // Security options
  debug: process.env.NODE_ENV === 'development',
};
