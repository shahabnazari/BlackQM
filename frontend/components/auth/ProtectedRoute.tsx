'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/auth/useAuth';
import { canAccessRoute } from '@/lib/auth/utils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  fallbackPath?: string;
  requireEmailVerified?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles = [],
  fallbackPath = '/auth/login',
  requireEmailVerified = false,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      const redirectUrl = `${fallbackPath}?redirect=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl);
      return;
    }

    // Check email verification requirement
    if (requireEmailVerified && user && !user.emailVerified) {
      router.push('/auth/verify-email');
      return;
    }

    // Check role-based access
    if (allowedRoles.length > 0 && !canAccessRoute(user, allowedRoles)) {
      router.push('/unauthorized');
      return;
    }
  }, [
    user,
    isLoading,
    isAuthenticated,
    allowedRoles,
    requireEmailVerified,
    pathname,
    router,
    fallbackPath,
  ]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated or authorized
  if (
    !isAuthenticated ||
    (allowedRoles.length > 0 && !canAccessRoute(user, allowedRoles))
  ) {
    return null;
  }

  return <>{children}</>;
}
