/**
 * NextAuth.js Configuration
 * Phase 6.86 - Enterprise Authentication
 */

import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { z } from 'zod';

// Credential validation schema
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const authOptions: NextAuthOptions = {
  // Configure authentication providers
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, _req) {
        try {
          // Validate credentials
          const validatedCreds = credentialsSchema.parse(credentials);
          
          // In production, verify against database
          // For now, accept any valid email/password format for testing
          // TODO: Replace with actual database verification
          
          // Mock user for development
          if (validatedCreds.email && validatedCreds.password) {
            return {
              id: '1',
              email: validatedCreds.email,
              name: validatedCreds.email.split('@')[0] || null,
              role: 'researcher'
            } as any;
          }
          
          return null;
        } catch (error: any) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  
  // Session configuration
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.NEXTAUTH_SECRET || 'default-secret-for-development-only',
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
        token.id = user.id;
        token.email = user.email || null;
        token.role = (user as any).role;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  
  // Security options
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: string;
    }
  }
  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    role?: string;
  }
}