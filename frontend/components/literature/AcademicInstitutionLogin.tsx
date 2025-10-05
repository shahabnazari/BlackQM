/**
 * Academic Institution Login Component
 * Phase 9 Day 25.2: Production-grade institutional authentication with ROR API
 *
 * Uses Research Organization Registry (ROR) API for dynamic institution search
 * ROR is the industry standard with 100,000+ research organizations worldwide
 *
 * ⚠️ AUTHENTICATION FLOW:
 * - Institution search: REAL (uses ROR API)
 * - SSO redirect: SIMULATED (shows intended flow)
 *
 * For production SSO, see: frontend/lib/services/institution.service.ts
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  CheckCircle2,
  LogOut,
  Shield,
  Search,
  ExternalLink,
  AlertCircle,
  Loader2,
  Globe2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { InstitutionService, type Institution } from '@/lib/services/institution.service';

interface InstitutionAuthState {
  isAuthenticated: boolean;
  institution: Institution | null;
  authMethod: 'shibboleth' | 'openathens' | 'orcid' | null;
  userName?: string;
  freeAccess: boolean;
  accessibleDatabases: string[];
}

interface AcademicInstitutionLoginProps {
  onAuthChange: (authState: InstitutionAuthState) => void;
  currentAuth: InstitutionAuthState;
}

export function AcademicInstitutionLogin({
  onAuthChange,
  currentAuth,
}: AcademicInstitutionLoginProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showInstitutionList, setShowInstitutionList] = useState(false);

  // Load popular institutions on mount
  useEffect(() => {
    const popular = InstitutionService.getPopularInstitutions();
    setInstitutions(popular);
  }, []);

  // Search institutions using ROR API
  const handleSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      const popular = InstitutionService.getPopularInstitutions();
      setInstitutions(popular);
      return;
    }

    setIsSearching(true);
    try {
      const results = await InstitutionService.searchInstitutions({
        query,
        limit: 50,
        types: ['Education'], // Only educational institutions
      });

      setInstitutions(results);
      setShowInstitutionList(true);
    } catch (error) {
      console.error('Institution search failed:', error);
      toast.error('Failed to search institutions');
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Handle institution selection and SSO
  const handleInstitutionSelect = useCallback(async (institution: Institution) => {
    setShowInstitutionList(false);
    setIsLoading(true);

    try {
      // Initiate SSO authentication
      const ssoResult = await InstitutionService.initiateSSO(institution);

      if (ssoResult.success) {
        // In production, this would redirect to SSO login
        // For demo, simulate successful authentication
        console.log(`[Demo] Would redirect to: ${ssoResult.redirectUrl}`);

        // Simulate SSO delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update auth state
        onAuthChange({
          isAuthenticated: true,
          institution,
          authMethod: institution.authMethod,
          userName: 'Demo User', // Would come from SAML assertion
          freeAccess: true,
          accessibleDatabases: [
            'pubmed', 'semantic_scholar', 'crossref', 'arxiv',
            'ieee', 'springer', 'nature', 'elsevier', 'jstor', 'wiley'
          ],
        });

        toast.success(`Successfully authenticated with ${institution.name}`);
      } else {
        toast.error(ssoResult.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('SSO failed:', error);
      toast.error('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [onAuthChange]);

  // Handle logout
  const handleLogout = useCallback(() => {
    onAuthChange({
      isAuthenticated: false,
      institution: null,
      authMethod: null,
      freeAccess: false,
      accessibleDatabases: [],
    });
    setSearchQuery('');
    toast.info('Logged out successfully');
  }, [onAuthChange]);

  // If authenticated, show status
  if (currentAuth.isAuthenticated && currentAuth.institution) {
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
                    {currentAuth.institution.name}
                  </p>
                  <Badge className="bg-green-600 text-white text-xs">
                    Free Access
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Globe2 className="w-3 h-3 text-green-700" />
                  <p className="text-xs text-green-700 dark:text-green-300">
                    {currentAuth.institution.city}, {currentAuth.institution.country}
                  </p>
                  <span className="text-xs text-green-600">•</span>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    {currentAuth.accessibleDatabases.length} databases available
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="border-green-300 hover:bg-green-100"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Show accessible databases */}
          <div className="mt-3 pt-3 border-t border-green-200">
            <p className="text-xs text-green-700 dark:text-green-300 mb-2">
              ✅ Free access to premium databases:
            </p>
            <div className="flex flex-wrap gap-1">
              {currentAuth.accessibleDatabases.slice(0, 6).map(db => (
                <Badge
                  key={db}
                  variant="outline"
                  className="text-xs bg-white dark:bg-gray-800 border-green-200"
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

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Login with your university or research institution to get free access to premium databases
        </p>

        {/* Institution search */}
        <div className="space-y-2 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search your institution (e.g., Stanford, Oxford)..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowInstitutionList(true);
              }}
              onFocus={() => setShowInstitutionList(true)}
              className="pl-10 pr-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-600 animate-spin" />
            )}
          </div>

          {/* Institution dropdown */}
          <AnimatePresence>
            {showInstitutionList && institutions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border-2 border-blue-300 rounded-lg shadow-xl max-h-96 overflow-y-auto"
              >
                <div className="sticky top-0 bg-blue-50 dark:bg-blue-950 px-4 py-2 border-b text-xs text-blue-700 dark:text-blue-300 font-medium">
                  {institutions.length} institution{institutions.length !== 1 ? 's' : ''} found · Powered by ROR API
                </div>
                {institutions.map(institution => (
                  <button
                    key={institution.id}
                    onClick={() => handleInstitutionSelect(institution)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b last:border-b-0 transition-colors"
                    disabled={isLoading}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {institution.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Globe2 className="w-3 h-3 text-gray-500" />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {institution.city && `${institution.city}, `}{institution.country}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant="outline"
                          className={
                            institution.authMethod === 'openathens'
                              ? 'bg-purple-50 text-purple-700 border-purple-300 text-xs'
                              : 'bg-blue-50 text-blue-700 border-blue-300 text-xs'
                          }
                        >
                          {institution.authMethod === 'openathens' ? 'OpenAthens' : 'Shibboleth'}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info about authentication */}
        <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <p className="font-medium">About Institutional Access:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              <li>Institution search uses ROR API (100,000+ organizations)</li>
              <li>Authentication via Shibboleth or OpenAthens SSO</li>
              <li>Free access to licensed databases for verified members</li>
            </ul>
            <p className="text-xs text-blue-600 mt-1">
              <ExternalLink className="w-3 h-3 inline mr-1" />
              <a
                href="https://ror.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-800"
              >
                Learn more about ROR
              </a>
            </p>
          </div>
        </div>

        {/* Alternative auth methods */}
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Or authenticate with:
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => toast.info('ORCID authentication coming soon')}
            >
              <Shield className="w-3 h-3 mr-1" />
              ORCID
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => toast.info('OpenAthens authentication coming soon')}
            >
              <Building2 className="w-3 h-3 mr-1" />
              OpenAthens
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
