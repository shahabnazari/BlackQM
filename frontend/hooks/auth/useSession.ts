import { useAuth } from './useAuth';
import { Session } from '@/lib/auth/types';
import { tokenStorage } from '@/lib/auth/utils';

export function useSession() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Create a session object from the auth context
  const session: Session = {
    user,
    accessToken:
      typeof window !== 'undefined'
        ? tokenStorage.getAccessToken() || null
        : null,
    refreshToken:
      typeof window !== 'undefined'
        ? tokenStorage.getRefreshToken() || null
        : null,
    expiresAt: null, // You may want to store this in localStorage/context
    isLoading,
    isAuthenticated,
  };

  return {
    session,
    isAuthenticated,
    refreshToken: async () => {
      // Implement token refresh logic if needed
      console.log('Token refresh requested');
    },
    isExpired: session.expiresAt ? Date.now() > session.expiresAt : false,
  };
}
