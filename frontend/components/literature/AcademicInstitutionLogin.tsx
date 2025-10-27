/**
 * Academic Institution Login Component
 * Phase 9 Day 27 + Phase 10 Day 1 Step 3: ORCID OAuth 2.0 Authentication
 *
 * Provides secure researcher authentication through ORCID OAuth 2.0
 * ORCID is the standard for researcher identification with 16M+ researchers
 *
 * ✅ WHAT ORCID PROVIDES:
 * - Persistent digital researcher identity (ORCID iD)
 * - Authentication and profile linking
 * - Research contribution tracking
 * - Cross-platform identity management
 *
 * ❌ WHAT ORCID DOES NOT PROVIDE:
 * - Database access (use institutional login separately)
 * - Full-text article access
 * - Paywall bypass
 *
 * ⚠️ AUTHENTICATION FLOW:
 * 1. User clicks "Sign in with ORCID"
 * 2. Redirects to backend OAuth endpoint with returnUrl
 * 3. Backend initiates ORCID OAuth flow
 * 4. User authenticates with ORCID
 * 5. Callback returns tokens and user data
 * 6. Frontend stores tokens and redirects back to literature page
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  CheckCircle2,
  LogOut,
  Shield,
  ExternalLink,
  AlertCircle,
  Loader2,
  Globe2,
  User,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Institution } from '@/lib/services/institution.service';

interface InstitutionAuthState {
  isAuthenticated: boolean;
  institution: Institution | null;
  authMethod: 'shibboleth' | 'openathens' | 'orcid' | null;
  userName?: string;
  freeAccess: boolean;
  accessibleDatabases: string[];
}

interface OrcidUser {
  id: string;
  email: string;
  name: string;
  orcidId: string;
}

interface AcademicInstitutionLoginProps {
  onAuthChange: (authState: InstitutionAuthState) => void;
  currentAuth: InstitutionAuthState;
}

export function AcademicInstitutionLogin({
  onAuthChange,
  currentAuth,
}: AcademicInstitutionLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [orcidUser, setOrcidUser] = useState<OrcidUser | null>(null);
  const [isOrcidAuthenticated, setIsOrcidAuthenticated] = useState(false);

  // Check ORCID authentication status on mount
  useEffect(() => {
    const checkOrcidAuth = () => {
      try {
        const token = localStorage.getItem('access_token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
          const user = JSON.parse(userStr) as OrcidUser;
          setOrcidUser(user);
          setIsOrcidAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking ORCID auth:', error);
      }
    };

    checkOrcidAuth();

    // Re-check on storage change (for multi-tab sync)
    const handleStorageChange = () => checkOrcidAuth();
    window.addEventListener('storage', handleStorageChange);

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handle ORCID SSO Login
  const handleOrcidLogin = useCallback(() => {
    setIsLoading(true);
    // Redirect to backend ORCID OAuth endpoint with returnUrl
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const returnUrl = encodeURIComponent('/discover/literature');
    window.location.href = `${backendUrl}/auth/orcid?returnUrl=${returnUrl}`;
  }, []);

  // Handle ORCID logout
  const handleOrcidLogout = useCallback(() => {
    // Clear tokens and user data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    setOrcidUser(null);
    setIsOrcidAuthenticated(false);

    toast.success('Logged out successfully');
  }, []);

  // Handle institutional logout
  const handleInstitutionalLogout = useCallback(() => {
    onAuthChange({
      isAuthenticated: false,
      institution: null,
      authMethod: null,
      freeAccess: false,
      accessibleDatabases: [],
    });
    toast.info('Logged out from institutional access');
  }, [onAuthChange]);

  // If ORCID authenticated, show ORCID status
  if (isOrcidAuthenticated && orcidUser) {
    return (
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600 rounded-full">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    ✓ ORCID Authenticated
                  </p>
                  <Badge className="bg-green-600 text-white text-xs">
                    Verified Researcher
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-3 h-3 text-green-700" />
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                    {orcidUser.name}
                  </p>
                  <span className="text-xs text-green-600">•</span>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    ORCID: {orcidUser.orcidId}
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleOrcidLogout}
              variant="outline"
              size="sm"
              className="border-green-300 hover:bg-green-100"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* ORCID Benefits */}
          <div className="mt-3 pt-3 border-t border-green-200">
            <p className="text-xs text-green-700 dark:text-green-300 mb-2">
              ✅ ORCID Benefits:
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs bg-white dark:bg-gray-800 border-green-200">
                Persistent Identity
              </Badge>
              <Badge variant="outline" className="text-xs bg-white dark:bg-gray-800 border-green-200">
                Research Tracking
              </Badge>
              <Badge variant="outline" className="text-xs bg-white dark:bg-gray-800 border-green-200">
                Profile Linking
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If institutional authenticated, show institution status
  if (currentAuth.isAuthenticated && currentAuth.institution) {
    return (
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-full">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    {currentAuth.institution.name}
                  </p>
                  <Badge className="bg-blue-600 text-white text-xs">
                    Database Access
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Globe2 className="w-3 h-3 text-blue-700" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {currentAuth.institution.city}, {currentAuth.institution.country}
                  </p>
                  <span className="text-xs text-blue-600">•</span>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {currentAuth.accessibleDatabases.length} databases available
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleInstitutionalLogout}
              variant="outline"
              size="sm"
              className="border-blue-300 hover:bg-blue-100"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Show accessible databases */}
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
              ✅ Free access to premium databases:
            </p>
            <div className="flex flex-wrap gap-1">
              {currentAuth.accessibleDatabases.slice(0, 6).map(db => (
                <Badge
                  key={db}
                  variant="outline"
                  className="text-xs bg-white dark:bg-gray-800 border-blue-200"
                >
                  {db.toUpperCase()}
                </Badge>
              ))}
              {currentAuth.accessibleDatabases.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{currentAuth.accessibleDatabases.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not authenticated - show login form
  return (
    <Card className="border-2 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Institution Access
            </h3>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
            Free for members
          </Badge>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Login with ORCID for persistent researcher identity and research tracking
        </p>

        {/* ORCID Login Button */}
        <Button
          onClick={handleOrcidLogin}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Redirecting to ORCID...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Sign in with ORCID
            </>
          )}
        </Button>

        {/* Info about ORCID (clarified) */}
        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
            <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
              <p className="font-medium">✅ What ORCID Provides:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                <li>Persistent digital researcher identity (ORCID iD)</li>
                <li>Secure OAuth 2.0 authentication</li>
                <li>Research contribution tracking and linking</li>
                <li>Cross-platform profile management</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <p className="font-medium">ℹ️ Important Note:</p>
              <p>
                <strong>ORCID does NOT provide access to premium databases or paywalled content.</strong>
                For institutional database access, contact your library separately.
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            <a
              href="https://orcid.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-800"
            >
              Learn more about ORCID (16M+ researchers)
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
