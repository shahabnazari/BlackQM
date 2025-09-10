# VQMethod - Development Implementation Guide (Part 5 of 5)

⚠️ **DOCUMENT SIZE LIMIT:** This document follows the 22,000 token limit policy for Claude compatibility.
**Current Size:** ~17,390 tokens (Check: `wc -c Development_Implementation_Guide_Part5.md | awk '{print int($1/4)}'`)
**Part:** 5 of 5
**Previous Part:** [Part 4 - Security & Excellence](./Development_Implementation_Guide_Part4.md)

## Authentication State Management & UI Implementation

This is Part 3 of the Development Implementation Guide, focusing on authentication UI, state management, and production-grade interface implementation.

**⚠️ CRITICAL UPDATE - Phase 6.7 Required:**
The authentication UI and state management code in this guide is **NOT CONNECTED** to the backend. While the UI is complete and the backend endpoints exist, they are not integrated. See [PHASE_6.7_BACKEND_INTEGRATION.md](../PHASE_6.7_BACKEND_INTEGRATION.md) for the urgent integration plan.

**Previous Parts:**

- Part 1: Foundation & Apple Design System (Updated with Phase 6.7)
- Part 2: Backend Implementation & Q-Analytics (Updated with Phase 6.7)
- Part 3: Authentication UI & User Experience (This file - awaiting Phase 6.7 integration)

---

## 4. Enterprise SSO Implementation (Phase 7 Enhanced)

### 4.1 SAML SSO Frontend Integration

```typescript
// lib/services/sso-service.ts
import { ApiClient } from './api-client'; // ⚠️ NOTE: ApiClient not implemented - Phase 6.7 required

// PHASE 6.7 TODO: Create ApiClient with axios:
// - Base URL configuration (http://localhost:3001/api)
// - Auth token interceptors
// - Error handling
// - Request/response logging
// See PHASE_6.7_BACKEND_INTEGRATION.md for implementation

export class SSOService {
  // Detect academic institution from email domain
  static async detectInstitution(email: string): Promise<{
    isAcademic: boolean;
    institution?: string;
    ssoProvider?: string;
  }> {
    const domain = email.split('@')[1];

    // Check known academic domains
    const academicDomains = [
      { domain: '.edu', provider: 'shibboleth' },
      { domain: '.ac.uk', provider: 'shibboleth' },
      { domain: '.edu.au', provider: 'shibboleth' },
      { domain: '.ac.jp', provider: 'shibboleth' },
    ];

    const isAcademic = academicDomains.some(ad => domain.endsWith(ad.domain));

    if (isAcademic) {
      // Check if institution has SSO configured
      const response = await ApiClient.get(`/auth/sso/check-domain/${domain}`);
      return response.data;
    }

    return { isAcademic: false };
  }

  // Initiate SAML SSO flow
  static async initiateSAMLLogin(
    provider: string,
    email?: string
  ): Promise<void> {
    const response = await ApiClient.post('/auth/saml/initiate', {
      provider,
      email,
      returnUrl: window.location.origin + '/auth/callback',
    });

    // Redirect to IdP login page
    window.location.href = response.data.redirectUrl;
  }

  // Handle SAML callback
  static async handleSAMLCallback(samlResponse: string): Promise<{
    user: any;
    accessToken: string;
    refreshToken: string;
  }> {
    const response = await ApiClient.post('/auth/saml/callback', {
      SAMLResponse: samlResponse,
    });

    return response.data;
  }
}
```

### 4.2 Enterprise Login Component with SSO

```tsx
// components/auth/enterprise-login.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, TextField } from '@/components/apple-ui';
import { SSOService } from '@/lib/services/sso-service';
import {
  AcademicCapIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

export function EnterpriseLogin() {
  const [email, setEmail] = useState('');
  const [institutionDetected, setInstitutionDetected] = useState(false);
  const [ssoProvider, setSsoProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-detect institution from email
  useEffect(() => {
    const detectSSO = async () => {
      if (email.includes('@')) {
        const result = await SSOService.detectInstitution(email);
        setInstitutionDetected(result.isAcademic);
        setSsoProvider(result.ssoProvider || null);
      }
    };

    const timer = setTimeout(detectSSO, 500);
    return () => clearTimeout(timer);
  }, [email]);

  const handleSSOLogin = async (provider: string) => {
    setLoading(true);
    try {
      await SSOService.initiateSAMLLogin(provider, email);
    } catch (error) {
      console.error('SSO login failed:', error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="text-center mb-8">
        <ShieldCheckIcon className="w-16 h-16 mx-auto mb-4 text-system-blue" />
        <h1 className="text-3xl font-bold mb-2">Enterprise Sign In</h1>
        <p className="text-secondary-label">
          Access with your institutional credentials
        </p>
      </div>

      {/* Email Detection */}
      <TextField
        label="Work or School Email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@university.edu"
        className="mb-4"
      />

      {/* Institution Detection Alert */}
      <AnimatePresence>
        {institutionDetected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-system-blue/10 rounded-lg border border-system-blue/20"
          >
            <div className="flex items-center gap-2">
              <AcademicCapIcon className="w-5 h-5 text-system-blue" />
              <span className="text-sm font-medium">
                Academic institution detected
              </span>
            </div>
            <p className="text-xs text-secondary-label mt-1">
              Sign in with your university credentials
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SSO Options */}
      <div className="space-y-3 mb-6">
        {/* University SSO (Shibboleth) */}
        {institutionDetected && (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => handleSSOLogin('shibboleth')}
            disabled={loading}
          >
            <AcademicCapIcon className="w-5 h-5 mr-2" />
            Sign in with University SSO
          </Button>
        )}

        {/* Microsoft Azure AD */}
        <Button
          variant="ghost"
          size="lg"
          className="w-full"
          onClick={() => handleSSOLogin('azure')}
          disabled={loading}
        >
          <BuildingOfficeIcon className="w-5 h-5 mr-2" />
          Sign in with Microsoft (Azure AD)
        </Button>

        {/* Okta */}
        <Button
          variant="ghost"
          size="lg"
          className="w-full"
          onClick={() => handleSSOLogin('okta')}
          disabled={loading}
        >
          <KeyIcon className="w-5 h-5 mr-2" />
          Sign in with Okta
        </Button>
      </div>

      {/* Compliance Badges */}
      <div className="border-t pt-4">
        <div className="flex justify-center gap-4 text-xs text-tertiary-label">
          <span className="flex items-center gap-1">
            <ShieldCheckIcon className="w-4 h-4" />
            GDPR
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheckIcon className="w-4 h-4" />
            HIPAA
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheckIcon className="w-4 h-4" />
            FERPA
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheckIcon className="w-4 h-4" />
            SOC2
          </span>
        </div>
      </div>
    </div>
  );
}
```

### 4.3 SAML Callback Handler

```tsx
// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { SSOService } from '@/lib/services/sso-service';
import { LoadingSpinner } from '@/components/apple-ui';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore(state => state.setUser);

  useEffect(() => {
    const handleCallback = async () => {
      const samlResponse = searchParams.get('SAMLResponse');

      if (samlResponse) {
        try {
          const { user, accessToken, refreshToken } =
            await SSOService.handleSAMLCallback(samlResponse);

          // Store tokens
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          // Update auth store
          setUser(user);

          // Redirect to dashboard
          router.push('/dashboard');
        } catch (error) {
          console.error('SSO callback failed:', error);
          router.push('/auth/login?error=sso_failed');
        }
      }
    };

    handleCallback();
  }, [searchParams, router, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-secondary-label">Completing sign in...</p>
      </div>
    </div>
  );
}
```

---

## 5. Authentication State Management (Zustand)

### 5.1 Global Authentication Store

```typescript
// lib/stores/auth-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthService } from '@/lib/services/auth-service';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'researcher' | 'participant' | 'admin';
  institution?: string;
  avatar?: string;
  preferences?: UserPreferences;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  collaborationOpen: boolean;
}

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpiry: Date | null;

  // Actions
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<void>;
  loginWithProvider: (
    provider: 'google' | 'microsoft' | 'orcid'
  ) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  checkBiometric: () => Promise<boolean>;

  // Session management
  checkSession: () => void;
  extendSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionExpiry: null,

      login: async (email, password, rememberMe = false) => {
        set({ isLoading: true });
        try {
          const response = await AuthService.login(email, password);
          const { user, accessToken, refreshToken, expiresIn } = response;

          // Store tokens securely
          if (rememberMe) {
            localStorage.setItem('refreshToken', refreshToken);
          } else {
            sessionStorage.setItem('refreshToken', refreshToken);
          }

          // Calculate session expiry
          const expiry = new Date(Date.now() + expiresIn * 1000);

          set({
            user,
            isAuthenticated: true,
            sessionExpiry: expiry,
            isLoading: false,
          });

          // Start session monitoring
          get().checkSession();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithProvider: async provider => {
        set({ isLoading: true });
        try {
          // Initiate OAuth flow (including SAML SSO)
          const authUrl = await AuthService.getOAuthUrl(provider);
          window.location.href = authUrl;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await AuthService.logout();
        } finally {
          // Clear all auth data
          set({
            user: null,
            isAuthenticated: false,
            sessionExpiry: null,
          });
          localStorage.removeItem('refreshToken');
          sessionStorage.removeItem('refreshToken');
        }
      },

      register: async data => {
        set({ isLoading: true });
        try {
          await AuthService.register(data);
          // Registration successful - redirect to verification
          window.location.href = '/auth/verify-email';
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      refreshSession: async () => {
        const refreshToken =
          localStorage.getItem('refreshToken') ||
          sessionStorage.getItem('refreshToken');

        if (!refreshToken) {
          get().logout();
          return;
        }

        try {
          const response = await AuthService.refreshToken(refreshToken);
          const { user, accessToken, expiresIn } = response;

          const expiry = new Date(Date.now() + expiresIn * 1000);

          set({
            user,
            isAuthenticated: true,
            sessionExpiry: expiry,
          });
        } catch (error) {
          get().logout();
          throw error;
        }
      },

      updateProfile: async updates => {
        set({ isLoading: true });
        try {
          const updatedUser = await AuthService.updateProfile(updates);
          set({ user: updatedUser, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      checkBiometric: async () => {
        // Check for WebAuthn support
        if (window.PublicKeyCredential) {
          const available =
            await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          return available;
        }
        return false;
      },

      checkSession: () => {
        const interval = setInterval(() => {
          const { sessionExpiry, isAuthenticated } = get();

          if (!isAuthenticated) {
            clearInterval(interval);
            return;
          }

          if (sessionExpiry) {
            const now = new Date();
            const timeLeft = sessionExpiry.getTime() - now.getTime();

            // Show warning 5 minutes before expiry
            if (timeLeft < 5 * 60 * 1000 && timeLeft > 4 * 60 * 1000) {
              // Show session expiry warning
              console.log('Session expiring soon');
            }

            // Auto refresh 1 minute before expiry
            if (timeLeft < 60 * 1000 && timeLeft > 0) {
              get().refreshSession();
            }

            // Session expired
            if (timeLeft <= 0) {
              get().logout();
              clearInterval(interval);
            }
          }
        }, 10000); // Check every 10 seconds
      },

      extendSession: () => {
        const { sessionExpiry } = get();
        if (sessionExpiry) {
          // Extend by 30 minutes
          const newExpiry = new Date(sessionExpiry.getTime() + 30 * 60 * 1000);
          set({ sessionExpiry: newExpiry });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

---

## 5.5 Study Builder State Management (Phase 6.85)

### ⚠️ CRITICAL GAPS IDENTIFIED (December 2024)

**Status:** Backend infrastructure and integration required before implementation

**Missing Infrastructure:**
- ❌ No backend API endpoints for grid/stimuli operations
- ❌ No WebSocket server implementation for real-time sync
- ❌ No file storage configuration (S3/local)
- ❌ No database models for GridConfiguration/Stimulus

**Missing Implementation:**
- ❌ Zustand stores defined but not implemented
- ❌ No persistence layer actually configured
- ❌ No error recovery mechanisms in place
- ❌ WebSocket sync not connected to backend

### Enhanced State Management Architecture

```typescript
// types/store.types.ts
interface StudyBuilderStore {
  // Grid Configuration
  grid: {
    range: { min: number; max: number };
    columns: GridColumn[];
    symmetry: boolean;
    distribution: 'bell' | 'flat' | 'forced' | 'custom';
    instructions: string;
    validation: {
      totalCells: number;
      minPerColumn: number;
      maxPerColumn: number;
      symmetryRequired: boolean;
    };
  };
  
  // Stimuli Management
  stimuli: {
    items: Stimulus[];
    uploadProgress: number;
    uploadErrors: UploadError[];
    validationState: ValidationState;
    chunkedUploads: Map<string, ChunkProgress>;
  };
  
  // Preview State
  preview: {
    device: 'mobile' | 'tablet' | 'desktop' | 'wide';
    zoom: number;
    isFullscreen: boolean;
    syncScroll: boolean;
    breakpoint: DeviceBreakpoint;
  };
  
  // Persistence
  draft: {
    lastSaved: Date;
    autoSaveEnabled: boolean;
    recoveryData: RecoveryData;
    version: string;
  };
}

// Persistence Strategy Configuration
const PERSISTENCE_CONFIG = {
  localStorage: ['grid', 'stimuli'],      // Persistent across sessions
  sessionStorage: ['preview', 'draft'],   // Current session only
  indexedDB: ['uploadedFiles'],          // Large binary data
  autoSaveInterval: 30000,               // 30 seconds
  maxRecoveryAge: 86400000,              // 24 hours
  conflictResolution: 'last-write-wins'
};
```

### Study Builder Store with Advanced Features

```typescript
// lib/stores/study-builder-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface GridColumn {
  value: number;
  label: string;
  customLabel?: string;
  cells: number;
  color?: string;
}

interface Stimulus {
  id: string;
  type: 'image' | 'video' | 'audio' | 'text';
  content: string | File;
  thumbnail?: string;
  position?: number;
  uploadProgress?: number;
  error?: string;
}

interface PreviewSettings {
  device: 'desktop' | 'tablet' | 'mobile' | 'wide';
  zoom: number;
  showGrid: boolean;
  breakpoint: { width: number; height: number; scale: number };
}

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface StudyBuilderState {
  // Study Configuration
  studyId: string | null;
  studyTitle: string;
  studyDescription: string;
  
  // Grid Configuration
  gridConfiguration: GridConfig;
  
  // Stimuli Management
  stimuli: Stimulus[];
  uploadProgress: number;
  
  // Preview Settings
  previewSettings: PreviewSettings;
  
  // UI State
  autoSaveStatus: AutoSaveStatus;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  errors: string[];
  
  // Actions
  setStudyId: (id: string) => void;
  updateStudyDetails: (title: string, description: string) => void;
  updateGrid: (config: GridConfig) => void;
  addStimulus: (stimulus: Stimulus) => void;
  removeStimulus: (id: string) => void;
  reorderStimuli: (fromIndex: number, toIndex: number) => void;
  updatePreviewSettings: (settings: Partial<PreviewSettings>) => void;
  setAutoSaveStatus: (status: AutoSaveStatus) => void;
  addError: (error: string) => void;
  clearErrors: () => void;
  saveStudy: () => Promise<void>;
  loadStudy: (id: string) => Promise<void>;
  resetBuilder: () => void;
}

const defaultGridConfig: GridConfig = {
  columns: [
    { value: -3, label: 'Most Disagree', cells: 1 },
    { value: -2, label: 'Disagree', cells: 2 },
    { value: -1, label: 'Slightly Disagree', cells: 3 },
    { value: 0, label: 'Neutral', cells: 4 },
    { value: 1, label: 'Slightly Agree', cells: 3 },
    { value: 2, label: 'Agree', cells: 2 },
    { value: 3, label: 'Most Agree', cells: 1 }
  ],
  range: { min: -3, max: 3 },
  symmetry: true,
  totalCells: 16,
  instructions: 'Please sort the statements according to your level of agreement.'
};

export const useStudyBuilderStore = create<StudyBuilderState>()(
  persist(
    (set, get) => ({
      // Initial state
      studyId: null,
      studyTitle: '',
      studyDescription: '',
      gridConfiguration: defaultGridConfig,
      stimuli: [],
      uploadProgress: 0,
      previewSettings: {
        device: 'desktop',
        zoom: 1,
        showGrid: true
      },
      autoSaveStatus: 'idle',
      lastSaved: null,
      hasUnsavedChanges: false,
      errors: [],
      
      // Actions
      setStudyId: (id) => set({ studyId: id }),
      
      updateStudyDetails: (title, description) => set({
        studyTitle: title,
        studyDescription: description,
        hasUnsavedChanges: true
      }),
      
      updateGrid: (config) => set({
        gridConfiguration: config,
        hasUnsavedChanges: true
      }),
      
      addStimulus: (stimulus) => set((state) => ({
        stimuli: [...state.stimuli, stimulus],
        uploadProgress: ((state.stimuli.length + 1) / state.gridConfiguration.totalCells) * 100,
        hasUnsavedChanges: true
      })),
      
      removeStimulus: (id) => set((state) => ({
        stimuli: state.stimuli.filter(s => s.id !== id),
        uploadProgress: ((state.stimuli.length - 1) / state.gridConfiguration.totalCells) * 100,
        hasUnsavedChanges: true
      })),
      
      reorderStimuli: (fromIndex, toIndex) => set((state) => {
        const newStimuli = [...state.stimuli];
        const [removed] = newStimuli.splice(fromIndex, 1);
        newStimuli.splice(toIndex, 0, removed);
        return {
          stimuli: newStimuli,
          hasUnsavedChanges: true
        };
      }),
      
      updatePreviewSettings: (settings) => set((state) => ({
        previewSettings: { ...state.previewSettings, ...settings }
      })),
      
      setAutoSaveStatus: (status) => set({ autoSaveStatus: status }),
      
      addError: (error) => set((state) => ({
        errors: [...state.errors, error]
      })),
      
      clearErrors: () => set({ errors: [] }),
      
      saveStudy: async () => {
        const state = get();
        set({ autoSaveStatus: 'saving' });
        
        try {
          // API call to save study
          const response = await fetch(`/api/studies/${state.studyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: state.studyTitle,
              description: state.studyDescription,
              gridConfiguration: state.gridConfiguration,
              stimuli: state.stimuli
            })
          });
          
          if (!response.ok) throw new Error('Failed to save study');
          
          set({
            autoSaveStatus: 'saved',
            lastSaved: new Date(),
            hasUnsavedChanges: false
          });
          
          // Reset status after 3 seconds
          setTimeout(() => {
            if (get().autoSaveStatus === 'saved') {
              set({ autoSaveStatus: 'idle' });
            }
          }, 3000);
        } catch (error) {
          set({
            autoSaveStatus: 'error',
            errors: [`Save failed: ${error.message}`]
          });
        }
      },
      
      loadStudy: async (id) => {
        try {
          const response = await fetch(`/api/studies/${id}`);
          if (!response.ok) throw new Error('Failed to load study');
          
          const study = await response.json();
          set({
            studyId: study.id,
            studyTitle: study.title,
            studyDescription: study.description,
            gridConfiguration: study.gridConfiguration || defaultGridConfig,
            stimuli: study.stimuli || [],
            hasUnsavedChanges: false,
            lastSaved: study.updatedAt ? new Date(study.updatedAt) : null
          });
        } catch (error) {
          set({
            errors: [`Failed to load study: ${error.message}`]
          });
        }
      },
      
      resetBuilder: () => set({
        studyId: null,
        studyTitle: '',
        studyDescription: '',
        gridConfiguration: defaultGridConfig,
        stimuli: [],
        uploadProgress: 0,
        previewSettings: {
          device: 'desktop',
          zoom: 1,
          showGrid: true
        },
        autoSaveStatus: 'idle',
        lastSaved: null,
        hasUnsavedChanges: false,
        errors: []
      })
    }),
    {
      name: 'study-builder-storage',
      partialize: (state) => ({
        studyId: state.studyId,
        studyTitle: state.studyTitle,
        studyDescription: state.studyDescription,
        gridConfiguration: state.gridConfiguration,
        stimuli: state.stimuli,
        previewSettings: state.previewSettings
      })
    }
  )
);

// Auto-save hook with conflict resolution
export const useAutoSave = () => {
  const { hasUnsavedChanges, saveStudy, studyId } = useStudyBuilderStore();
  const [conflictDetected, setConflictDetected] = useState(false);
  
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const timer = setTimeout(async () => {
      try {
        // Check for conflicts before saving
        const serverVersion = await checkServerVersion(studyId);
        const localVersion = localStorage.getItem(`study-version-${studyId}`);
        
        if (serverVersion !== localVersion) {
          setConflictDetected(true);
          // Handle conflict based on strategy
          if (PERSISTENCE_CONFIG.conflictResolution === 'last-write-wins') {
            await saveStudy();
          } else {
            // Show conflict resolution UI
            showConflictDialog();
          }
        } else {
          await saveStudy();
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, PERSISTENCE_CONFIG.autoSaveInterval);
    
    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, saveStudy, studyId]);
  
  return { conflictDetected };
};
```

### State Synchronization Service

```typescript
// services/state-sync.service.ts
import { wsService } from './websocket.service';

const SYNC_CONFIG = {
  events: [
    'grid:update',
    'stimuli:add',
    'stimuli:remove',
    'preview:change'
  ],
  debounceMs: 500,
  retryAttempts: 3,
  conflictResolution: 'last-write-wins'
};

class StateSyncService {
  private syncQueue: Map<string, any> = new Map();
  private retryCount: Map<string, number> = new Map();
  
  async syncState(event: string, data: any) {
    // Debounce similar events
    if (this.syncQueue.has(event)) {
      clearTimeout(this.syncQueue.get(event).timer);
    }
    
    const timer = setTimeout(() => {
      this.performSync(event, data);
    }, SYNC_CONFIG.debounceMs);
    
    this.syncQueue.set(event, { data, timer });
  }
  
  private async performSync(event: string, data: any) {
    try {
      await wsService.emit(event, data);
      this.retryCount.delete(event);
    } catch (error) {
      const retries = this.retryCount.get(event) || 0;
      
      if (retries < SYNC_CONFIG.retryAttempts) {
        this.retryCount.set(event, retries + 1);
        // Exponential backoff
        setTimeout(() => {
          this.performSync(event, data);
        }, Math.pow(2, retries) * 1000);
      } else {
        // Store for offline sync
        this.storeOfflineSync(event, data);
      }
    }
  }
  
  private storeOfflineSync(event: string, data: any) {
    const offlineQueue = JSON.parse(
      localStorage.getItem('offline-sync-queue') || '[]'
    );
    offlineQueue.push({ event, data, timestamp: Date.now() });
    localStorage.setItem('offline-sync-queue', JSON.stringify(offlineQueue));
  }
}

export const stateSyncService = new StateSyncService();
```

### Enhanced Error Recovery System

```typescript
// lib/stores/error-recovery-store.ts
import { create } from 'zustand';

interface ErrorRecovery {
  strategies: {
    network: 'retry' | 'queue' | 'offline-mode';
    validation: 'highlight' | 'block' | 'auto-correct';
    upload: 'resume' | 'restart' | 'skip';
  };
  maxRetries: 3;
  backoffMs: [1000, 2000, 4000];
  fallbackUI: boolean;
}

interface ErrorRecoveryState {
  failedUploads: Map<string, { file: File; attempts: number; lastError: string }>;
  networkErrors: Array<{ error: string; timestamp: Date; resolved: boolean }>;
  validationErrors: Map<string, { error: string; severity: 'error' | 'warning' }>;
  recoveryStrategies: ErrorRecovery;
  
  addFailedUpload: (id: string, file: File, error: string) => void;
  retryUpload: (id: string) => Promise<void>;
  addNetworkError: (error: string) => void;
  addValidationError: (field: string, error: string, severity?: 'error' | 'warning') => void;
  clearValidationError: (field: string) => void;
  clearAllErrors: () => void;
  setRecoveryStrategy: (type: keyof ErrorRecovery['strategies'], strategy: string) => void;
}

export const useErrorRecoveryStore = create<ErrorRecoveryState>((set, get) => ({
  failedUploads: new Map(),
  networkErrors: [],
  validationErrors: new Map(),
  
  addFailedUpload: (id, file) => set((state) => {
    const newMap = new Map(state.failedUploads);
    newMap.set(id, file);
    return { failedUploads: newMap };
  }),
  
  retryUpload: async (id) => {
    const file = get().failedUploads.get(id);
    if (!file) return;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload/stimulus', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      // Remove from failed uploads on success
      set((state) => {
        const newMap = new Map(state.failedUploads);
        newMap.delete(id);
        return { failedUploads: newMap };
      });
    } catch (error) {
      console.error('Retry failed:', error);
    }
  },
  
  addNetworkError: (error) => set((state) => ({
    networkErrors: [...state.networkErrors, error]
  })),
  
  addValidationError: (field, error) => set((state) => {
    const newMap = new Map(state.validationErrors);
    newMap.set(field, error);
    return { validationErrors: newMap };
  }),
  
  clearValidationError: (field) => set((state) => {
    const newMap = new Map(state.validationErrors);
    newMap.delete(field);
    return { validationErrors: newMap };
  }),
  
  clearAllErrors: () => set({
    failedUploads: new Map(),
    networkErrors: [],
    validationErrors: new Map()
  })
}));
```

---

## 6. Protected Routes Implementation

### 6.1 Route Protection Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const publicRoutes = [
  '/',
  '/about',
  '/privacy',
  '/terms',
  '/contact',
  '/help',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
];

const roleBasedRoutes = {
  researcher: ['/researcher', '/api/researcher'],
  participant: ['/participant', '/api/participant'],
  admin: ['/admin', '/api/admin'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for authentication token
  const token = request.cookies.get('access-token')?.value;

  if (!token) {
    // Redirect to login with return URL
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    // Check role-based access
    const userRole = payload.role as string;

    // Check if user has access to the requested route
    for (const [role, routes] of Object.entries(roleBasedRoutes)) {
      if (routes.some(route => pathname.startsWith(route))) {
        if (userRole !== role && userRole !== 'admin') {
          // User doesn't have permission
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }
    }

    // Add user info to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.sub as string);
    requestHeaders.set('x-user-role', userRole);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    // Invalid token - redirect to login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 7. Essential Pages Implementation

### 7.1 About Page with Interactive Q-Methodology Explanation

```typescript
// app/about/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/apple-ui';
import { PlayCircleIcon, AcademicCapIcon, ChartBarIcon, UsersIcon } from '@heroicons/react/24/outline';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-system-background to-secondary-background">
      {/* Hero Section with Video Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        >
          <source src="/videos/research-background.mp4" type="video/mp4" />
        </video>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-system-blue to-system-purple bg-clip-text text-transparent"
          >
            Research Reimagined
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-secondary-label mb-8"
          >
            VQMethod brings Q-methodology into the digital age with world-class tools
            inspired by industry leaders
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex gap-4 justify-center"
          >
            <Button variant="primary" size="lg">
              Start Free Trial
            </Button>
            <Button variant="ghost" size="lg">
              <PlayCircleIcon className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Interactive Q-Methodology Explanation */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            What is Q-Methodology?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: AcademicCapIcon,
                title: 'Scientific Rigor',
                description: 'Combines qualitative insights with quantitative analysis for robust research outcomes'
              },
              {
                icon: ChartBarIcon,
                title: 'Pattern Discovery',
                description: 'Reveals hidden patterns in subjective viewpoints through factor analysis'
              },
              {
                icon: UsersIcon,
                title: 'Human-Centered',
                description: 'Captures authentic human perspectives on complex topics'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-system-blue/10 rounded-2xl flex items-center justify-center">
                  <feature.icon className="w-10 h-10 text-system-blue" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-secondary-label">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Animated Statistics */}
      <section className="py-20 px-4 bg-quaternary-fill/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10,000+', label: 'Researchers' },
              { value: '50,000+', label: 'Studies Completed' },
              { value: '1M+', label: 'Q-Sorts Analyzed' },
              { value: '99.9%', label: 'Uptime' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-4xl font-bold text-system-blue mb-2">
                  {stat.value}
                </div>
                <div className="text-secondary-label">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
```

---

## 8. Navigation Enhancement with Role-Based Access

### 8.1 Global Navigation Component

```typescript
// components/navigation/GlobalNav.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/apple-ui';
import {
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export function GlobalNav() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Intelligent navigation based on user role
  const getNavigationItems = () => {
    if (!isAuthenticated) {
      return [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'About', href: '/about' },
        { label: 'Help', href: '/help' }
      ];
    }

    switch (user?.role) {
      case 'researcher':
        return [
          { label: 'Dashboard', href: '/dashboard' },  // Note: Route groups (researcher) don't appear in URLs
          { label: 'Studies', href: '/studies' },
          { label: 'Analytics', href: '/analytics' },
          { label: 'Collaborate', href: '/collaborate' }
        ];
      case 'participant':
        return [
          { label: 'Active Studies', href: '/participant/active' },
          { label: 'Browse', href: '/participant/browse' },
          { label: 'History', href: '/participant/history' },
          { label: 'Rewards', href: '/participant/rewards' }
        ];
      case 'admin':
        return [
          { label: 'Admin Dashboard', href: '/admin' },
          { label: 'Users', href: '/admin/users' },
          { label: 'Studies', href: '/admin/studies' },
          { label: 'Reports', href: '/admin/reports' }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavigationItems();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-quaternary-fill">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <a href="/" className="text-2xl font-bold bg-gradient-to-r from-system-blue to-system-purple bg-clip-text text-transparent">
              VQMethod
            </a>

            {/* Main Navigation */}
            <div className="hidden md:flex space-x-6">
              {navItems.map(item => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'text-system-blue'
                      : 'text-secondary-label hover:text-label'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Search (Tableau-style) */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:bg-quaternary-fill rounded-lg transition-colors"
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="w-5 h-5 text-secondary-label" />
            </button>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <button
                  className="p-2 hover:bg-quaternary-fill rounded-lg transition-colors relative"
                  aria-label="Notifications"
                >
                  <BellIcon className="w-5 h-5 text-secondary-label" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-system-red rounded-full" />
                </button>

                {/* Profile Menu */}
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center space-x-2 p-2 hover:bg-quaternary-fill rounded-lg transition-colors"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.firstName}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <UserCircleIcon className="w-8 h-8 text-secondary-label" />
                    )}
                    <span className="text-sm font-medium text-label hidden lg:block">
                      {user?.firstName}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-64 bg-white dark:bg-black rounded-xl shadow-xl border border-quaternary-fill overflow-hidden"
                      >
                        <div className="p-4 border-b border-quaternary-fill">
                          <div className="font-medium text-label">{user?.firstName} {user?.lastName}</div>
                          <div className="text-sm text-secondary-label">{user?.email}</div>
                        </div>

                        <div className="p-2">
                          <a
                            href={`/${user?.role}/settings`}
                            className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-quaternary-fill transition-colors"
                          >
                            <Cog6ToothIcon className="w-5 h-5 text-secondary-label" />
                            <span className="text-sm">Settings</span>
                          </a>

                          <button
                            onClick={logout}
                            className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-quaternary-fill transition-colors w-full text-left"
                          >
                            <ArrowRightOnRectangleIcon className="w-5 h-5 text-secondary-label" />
                            <span className="text-sm">Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/auth/login'}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.location.href = '/auth/register'}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Overlay (Tableau-style) */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-quaternary-fill bg-white/95 dark:bg-black/95 backdrop-blur-xl"
          >
            <div className="max-w-3xl mx-auto p-4">
              <input
                type="search"
                placeholder="Search studies, researchers, or help articles..."
                className="w-full px-4 py-3 bg-quaternary-fill/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-system-blue"
                autoFocus
              />

              {/* Quick Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs text-secondary-label">Quick actions:</span>
                <button className="px-3 py-1 text-xs bg-quaternary-fill rounded-full hover:bg-tertiary-fill">
                  Create Study
                </button>
                <button className="px-3 py-1 text-xs bg-quaternary-fill rounded-full hover:bg-tertiary-fill">
                  View Analytics
                </button>
                <button className="px-3 py-1 text-xs bg-quaternary-fill rounded-full hover:bg-tertiary-fill">
                  Browse Help
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
```

---

## 9. CSS Enhancements for Production-Grade UI

### 9.1 Glass Morphism and Advanced Styles

```css
/* styles/auth.css - Production-grade authentication styles */

/* Glass morphism containers */
.auth-container {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow:
    0 0.5px 0 1px rgba(255, 255, 255, 0.23) inset,
    0 1px 0 0 rgba(255, 255, 255, 0.66) inset,
    0 8px 32px rgba(31, 38, 135, 0.15);
}

@media (prefers-color-scheme: dark) {
  .auth-container {
    background: rgba(0, 0, 0, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow:
      0 0.5px 0 1px rgba(0, 0, 0, 0.23) inset,
      0 1px 0 0 rgba(0, 0, 0, 0.66) inset,
      0 8px 32px rgba(0, 0, 0, 0.35);
  }
}

/* Gradient backgrounds */
.gradient-mesh {
  background-image:
    radial-gradient(at 40% 20%, hsla(210, 100%, 56%, 0.3) 0px, transparent 50%),
    radial-gradient(at 80% 0%, hsla(280, 100%, 60%, 0.2) 0px, transparent 50%),
    radial-gradient(at 0% 50%, hsla(355, 100%, 60%, 0.2) 0px, transparent 50%),
    radial-gradient(at 80% 50%, hsla(340, 100%, 60%, 0.2) 0px, transparent 50%),
    radial-gradient(at 0% 100%, hsla(240, 100%, 60%, 0.2) 0px, transparent 50%),
    radial-gradient(at 80% 100%, hsla(180, 100%, 60%, 0.2) 0px, transparent 50%);
}

/* Loading animations */
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.loading-shimmer {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}

/* Form field animations */
.form-field-float {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-field-float:focus-within label {
  transform: translateY(-1.5rem) scale(0.85);
  color: var(--color-system-blue);
}

/* Button hover effects (Netflix-style) */
.button-scale {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.button-scale:hover {
  transform: scale(1.05);
}

.button-scale:active {
  transform: scale(0.95);
}

/* Password strength indicator */
.password-strength-bar {
  position: relative;
  overflow: hidden;
}

.password-strength-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shimmer 2s infinite;
}

/* Success animations */
@keyframes success-bounce {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.success-animation {
  animation: success-bounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

---

## 10. Testing Requirements for Phase 5.5

### 10.1 Authentication UI Testing

```typescript
// __tests__/auth/login.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/auth/login/page';

describe('Login Page', () => {
  it('should render all authentication options', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Sign in with SSO')).toBeInTheDocument();
  });

  it('should detect academic domain and suggest SSO', async () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText('Email');

    fireEvent.change(emailInput, { target: { value: 'user@university.edu' } });

    await waitFor(() => {
      expect(screen.getByText('Detected: Academic Institution')).toBeInTheDocument();
      expect(screen.getByText('Sign in with SSO')).toBeInTheDocument();
    });
  });

  it('should show password strength indicator', () => {
    render(<LoginPage />);
    const passwordInput = screen.getByLabelText('Password');

    fireEvent.change(passwordInput, { target: { value: 'weakpass' } });
    expect(screen.getByText('25%')).toBeInTheDocument();

    fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123!' } });
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
```

### 10.2 Navigation Testing

```typescript
// __tests__/navigation/global-nav.test.tsx
import { render, screen } from '@testing-library/react';
import { GlobalNav } from '@/components/navigation/GlobalNav';
import { useAuthStore } from '@/lib/stores/auth-store';

jest.mock('@/lib/stores/auth-store');

describe('Global Navigation', () => {
  it('should show public navigation when not authenticated', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    render(<GlobalNav />);

    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('should show researcher navigation when authenticated as researcher', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { role: 'researcher', firstName: 'John' },
    });

    render(<GlobalNav />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Studies')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('should show participant navigation when authenticated as participant', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { role: 'participant', firstName: 'Jane' },
    });

    render(<GlobalNav />);

    expect(screen.getByText('Active Studies')).toBeInTheDocument();
    expect(screen.getByText('Browse')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Rewards')).toBeInTheDocument();
  });
});
```

---

## Implementation Checklist for Part 3

### Authentication & State Management

- [ ] Implement Zustand authentication store
- [ ] Configure JWT token management
- [ ] Setup refresh token rotation
- [ ] Implement biometric authentication support
- [ ] Add session monitoring and auto-refresh

### Protected Routes

- [ ] Configure Next.js middleware for route protection
- [ ] Implement role-based access control
- [ ] Setup redirect logic for unauthorized access
- [ ] Add return URL handling after login

### UI Components

- [ ] Complete login page with all authentication methods
- [ ] Implement multi-step registration flow
- [ ] Add password strength indicator
- [ ] Create SSO detection and suggestion
- [ ] Build profile dropdown menu

### Navigation

- [ ] Implement role-based navigation items
- [ ] Add search overlay functionality
- [ ] Create notification badge system
- [ ] Setup profile menu with user actions

### Testing

- [ ] Write authentication flow tests
- [ ] Test protected route behavior
- [ ] Validate role-based navigation
- [ ] Test session management
- [ ] Verify SSO integration

### CSS & Styling

- [ ] Apply glass morphism effects
- [ ] Implement loading animations
- [ ] Add form field animations
- [ ] Create success/error animations
- [ ] Ensure dark mode compatibility

---

## Next Steps

After completing Part 3 implementation:

1. **Integration Testing**: Test the complete authentication flow from registration to protected route access
2. **Performance Optimization**: Implement code splitting for authentication components
3. **Security Audit**: Review all authentication endpoints and token handling
4. **Accessibility**: Ensure WCAG AA compliance for all authentication UI
5. **Documentation**: Create user guides for authentication features

Continue with Part 2 (Backend Implementation) for Q-Analytics Engine and advanced backend features.

---

## Summary

Part 3 focuses on creating a production-grade authentication system with:

- Industry-leading UI/UX patterns from Tableau, Qualtrics, Apple, and Netflix
- Comprehensive state management with Zustand
- Robust route protection and role-based access
- Beautiful, accessible authentication interfaces
- Complete testing coverage

This completes the authentication and user experience implementation for VQMethod.

---

# PHASE 6.5: FRONTEND SEPARATION & Q-ANALYTICS UI

## 🚨 CRITICAL: Architectural Separation Required

The current monolithic architecture must be separated into distinct frontend and backend applications. This section covers the frontend implementation requirements for Phase 6.5.

---

## 10. Frontend Application Setup (Phase 6.5)

### 10.1 Create Separate Next.js Application

```bash
# Create new frontend application
npx create-next-app@latest vqmethod-frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd vqmethod-frontend

# Install critical dependencies for Phase 6.5
npm install zustand axios socket.io-client
npm install three @react-three/fiber @react-three/drei
npm install d3 recharts react-grid-layout
npm install framer-motion clsx tailwind-merge
npm install @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
```

### 10.2 Project Structure for Separated Frontend

```
vqmethod-frontend/
├── src/
│   ├── app/                        # Next.js 14 App Router
│   │   ├── (researcher)/           # Researcher interface
│   │   │   ├── dashboard/
│   │   │   ├── studies/
│   │   │   ├── analysis/          # Q-Analytics UI
│   │   │   └── settings/
│   │   ├── (participant)/          # Participant interface
│   │   │   ├── join/
│   │   │   └── study/[token]/
│   │   ├── auth/                   # Authentication pages
│   │   └── api/                    # API route handlers
│   ├── components/
│   │   ├── apple-ui/              # Apple design components
│   │   ├── q-analysis/            # Q-Analytics components
│   │   ├── auth/                  # Auth components
│   │   └── shared/                # Shared components
│   ├── lib/
│   │   ├── api/                   # Backend API client
│   │   ├── stores/                # Zustand stores
│   │   ├── hooks/                 # Custom hooks
│   │   └── utils/                 # Utilities
│   └── styles/
│       └── globals.css
```

---

## 11. Q-Analytics State Management

### 11.1 Q-Analysis Store (Zustand)

```typescript
// lib/stores/q-analysis-store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { QAnalysisAPI } from '@/lib/api/q-analysis';

interface FactorRotation {
  factor1: number;
  factor2: number;
  angle: number;
  timestamp: Date;
}

interface AnalysisState {
  // Current Analysis
  studyId: string | null;
  analysisId: string | null;
  sessionId: string | null;

  // Configuration
  extractionMethod: 'pca' | 'centroid' | 'ml';
  rotationMethod: 'varimax' | 'quartimax' | 'promax' | 'oblimin' | 'none';
  numberOfFactors: number | null;
  bootstrapIterations: number;

  // Results
  correlationMatrix: number[][] | null;
  factorLoadings: number[][] | null;
  factorArrays: any[] | null;
  eigenvalues: number[] | null;
  distinguishingStatements: any[] | null;
  consensusStatements: any[] | null;

  // Interactive Session
  isInteractive: boolean;
  rotationHistory: FactorRotation[];
  currentRotation: number[][];
  preview: any | null;

  // UI State
  isAnalyzing: boolean;
  isRotating: boolean;
  error: string | null;
  progress: number;

  // Actions
  setStudy: (studyId: string) => void;
  configureAnalysis: (config: Partial<AnalysisState>) => void;
  performAnalysis: () => Promise<void>;
  startInteractiveSession: () => Promise<void>;
  applyRotation: (rotation: FactorRotation) => Promise<void>;
  undoRotation: () => Promise<void>;
  redoRotation: () => Promise<void>;
  saveAnalysis: () => Promise<void>;
  exportAnalysis: (
    format: 'pqmethod' | 'spss' | 'excel' | 'pdf'
  ) => Promise<void>;
  reset: () => void;
}

export const useQAnalysisStore = create<AnalysisState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        studyId: null,
        analysisId: null,
        sessionId: null,
        extractionMethod: 'pca',
        rotationMethod: 'varimax',
        numberOfFactors: null,
        bootstrapIterations: 1000,
        correlationMatrix: null,
        factorLoadings: null,
        factorArrays: null,
        eigenvalues: null,
        distinguishingStatements: null,
        consensusStatements: null,
        isInteractive: false,
        rotationHistory: [],
        currentRotation: [],
        preview: null,
        isAnalyzing: false,
        isRotating: false,
        error: null,
        progress: 0,

        // Actions
        setStudy: studyId => set({ studyId }),

        configureAnalysis: config => set(config),

        performAnalysis: async () => {
          const state = get();
          set({ isAnalyzing: true, error: null, progress: 0 });

          try {
            const result = await QAnalysisAPI.perform(state.studyId!, {
              extractionMethod: state.extractionMethod,
              rotationMethod: state.rotationMethod,
              numberOfFactors: state.numberOfFactors,
              bootstrapIterations: state.bootstrapIterations,
            });

            set({
              analysisId: result.analysisId,
              correlationMatrix: result.correlationMatrix,
              factorLoadings: result.rotation.rotatedLoadings,
              factorArrays: result.factorArrays,
              eigenvalues: result.extraction.eigenvalues,
              distinguishingStatements: result.distinguishingStatements,
              consensusStatements: result.consensusStatements,
              isAnalyzing: false,
              progress: 100,
            });
          } catch (error: any) {
            set({ error: error.message, isAnalyzing: false });
          }
        },

        startInteractiveSession: async () => {
          const { studyId } = get();
          set({ isAnalyzing: true });

          try {
            const session = await QAnalysisAPI.interactive.start(studyId!);
            set({
              sessionId: session.id,
              isInteractive: true,
              isAnalyzing: false,
            });
          } catch (error: any) {
            set({ error: error.message, isAnalyzing: false });
          }
        },

        applyRotation: async rotation => {
          const { sessionId, rotationHistory } = get();
          set({ isRotating: true });

          try {
            const preview = await QAnalysisAPI.interactive.rotate(
              sessionId!,
              rotation
            );

            set({
              preview,
              rotationHistory: [...rotationHistory, rotation],
              currentRotation: preview.rotatedLoadings,
              isRotating: false,
            });
          } catch (error: any) {
            set({ error: error.message, isRotating: false });
          }
        },

        undoRotation: async () => {
          const { sessionId, rotationHistory } = get();
          if (rotationHistory.length === 0) return;

          const newHistory = rotationHistory.slice(0, -1);
          const lastRotation = newHistory[newHistory.length - 1];

          if (lastRotation) {
            await get().applyRotation(lastRotation);
          }

          set({ rotationHistory: newHistory });
        },

        redoRotation: async () => {
          // Implementation for redo functionality
        },

        saveAnalysis: async () => {
          const { sessionId } = get();
          try {
            const saved = await QAnalysisAPI.interactive.save(sessionId!);
            set({ analysisId: saved.analysisId });
          } catch (error: any) {
            set({ error: error.message });
          }
        },

        exportAnalysis: async format => {
          const { analysisId } = get();
          try {
            const file = await QAnalysisAPI.export[format](analysisId!);
            // Trigger download
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analysis.${format}`;
            a.click();
          } catch (error: any) {
            set({ error: error.message });
          }
        },

        reset: () =>
          set({
            studyId: null,
            analysisId: null,
            sessionId: null,
            correlationMatrix: null,
            factorLoadings: null,
            factorArrays: null,
            eigenvalues: null,
            distinguishingStatements: null,
            consensusStatements: null,
            isInteractive: false,
            rotationHistory: [],
            currentRotation: [],
            preview: null,
            error: null,
            progress: 0,
          }),
      }),
      {
        name: 'q-analysis-storage',
      }
    )
  )
);
```

### 11.2 WebSocket Store for Real-time Updates

```typescript
// lib/stores/websocket-store.ts
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface WebSocketState {
  socket: Socket | null;
  isConnected: boolean;
  connectionId: string | null;
  subscriptions: Map<string, (data: any) => void>;

  // Actions
  connect: () => void;
  disconnect: () => void;
  subscribe: (event: string, callback: (data: any) => void) => void;
  unsubscribe: (event: string) => void;
  emit: (event: string, data: any) => void;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  connectionId: null,
  subscriptions: new Map(),

  connect: () => {
    const socket = io(
      process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
      {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      }
    );

    socket.on('connect', () => {
      set({
        socket,
        isConnected: true,
        connectionId: socket.id,
      });

      // Re-subscribe to events
      const { subscriptions } = get();
      subscriptions.forEach((callback, event) => {
        socket.on(event, callback);
      });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false, connectionId: null });
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, connectionId: null });
    }
  },

  subscribe: (event, callback) => {
    const { socket, subscriptions } = get();

    subscriptions.set(event, callback);

    if (socket && socket.connected) {
      socket.on(event, callback);
    }

    set({ subscriptions: new Map(subscriptions) });
  },

  unsubscribe: event => {
    const { socket, subscriptions } = get();

    if (socket) {
      socket.off(event);
    }

    subscriptions.delete(event);
    set({ subscriptions: new Map(subscriptions) });
  },

  emit: (event, data) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit(event, data);
    }
  },
}));
```

---

## 12. Q-Analytics UI Components

### 12.1 Q-Analysis Dashboard Component

```typescript
// components/q-analysis/QAnalysisDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { useQAnalysisStore } from '@/lib/stores/q-analysis-store';
import { AnalysisConfiguration } from './AnalysisConfiguration';
import { FactorExtractionPanel } from './FactorExtractionPanel';
import { RotationInterface } from './RotationInterface';
import { Factor3DSpace } from './Factor3DSpace';
import { ResultsDisplay } from './ResultsDisplay';
import { ExportPanel } from './ExportPanel';
import { Card } from '@/components/apple-ui/Card';
import { Tabs } from '@/components/apple-ui/Tabs';

export function QAnalysisDashboard({ studyId }: { studyId: string }) {
  const [activeTab, setActiveTab] = useState('configure');
  const {
    setStudy,
    performAnalysis,
    startInteractiveSession,
    isAnalyzing,
    isInteractive,
    factorArrays,
  } = useQAnalysisStore();

  useEffect(() => {
    setStudy(studyId);
  }, [studyId, setStudy]);

  const handleStartAnalysis = async () => {
    await performAnalysis();
    setActiveTab('results');
  };

  const handleStartInteractive = async () => {
    await startInteractiveSession();
    setActiveTab('rotate');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold text-primary-label">
          Q-Methodology Analysis
        </h1>
        <p className="mt-2 text-secondary-label">
          Configure and perform statistical analysis on your Q-sort data
        </p>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="configure">Configure</Tabs.Trigger>
          <Tabs.Trigger value="extract">Extract</Tabs.Trigger>
          <Tabs.Trigger value="rotate" disabled={!factorArrays}>
            Rotate
          </Tabs.Trigger>
          <Tabs.Trigger value="results" disabled={!factorArrays}>
            Results
          </Tabs.Trigger>
          <Tabs.Trigger value="export" disabled={!factorArrays}>
            Export
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="configure">
          <AnalysisConfiguration onAnalyze={handleStartAnalysis} />
        </Tabs.Content>

        <Tabs.Content value="extract">
          <FactorExtractionPanel />
        </Tabs.Content>

        <Tabs.Content value="rotate">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RotationInterface />
            <Factor3DSpace />
          </div>
        </Tabs.Content>

        <Tabs.Content value="results">
          <ResultsDisplay />
        </Tabs.Content>

        <Tabs.Content value="export">
          <ExportPanel />
        </Tabs.Content>
      </Tabs>
    </div>
  );
}
```

### 12.2 Interactive Rotation Interface

```typescript
// components/q-analysis/RotationInterface.tsx
'use client';

import { useState } from 'react';
import { useQAnalysisStore } from '@/lib/stores/q-analysis-store';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Slider } from '@/components/apple-ui/Slider';
import { Select } from '@/components/apple-ui/Select';
import { motion } from 'framer-motion';

export function RotationInterface() {
  const [factor1, setFactor1] = useState(0);
  const [factor2, setFactor2] = useState(1);
  const [angle, setAngle] = useState(0);

  const {
    applyRotation,
    undoRotation,
    saveAnalysis,
    rotationHistory,
    isRotating,
    numberOfFactors,
  } = useQAnalysisStore();

  const handleRotate = async () => {
    await applyRotation({
      factor1,
      factor2,
      angle,
      timestamp: new Date(),
    });
  };

  const factorOptions = Array.from(
    { length: numberOfFactors || 0 },
    (_, i) => ({
      label: `Factor ${i + 1}`,
      value: i,
    })
  );

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-primary-label">
            Manual Rotation Controls
          </h3>
          <p className="mt-1 text-sm text-secondary-label">
            Interactively rotate factor pairs to improve interpretation
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-label mb-2">
              Factor 1
            </label>
            <Select
              value={factor1}
              onChange={(e) => setFactor1(Number(e.target.value))}
              options={factorOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-label mb-2">
              Factor 2
            </label>
            <Select
              value={factor2}
              onChange={(e) => setFactor2(Number(e.target.value))}
              options={factorOptions}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-label mb-2">
            Rotation Angle: {angle}°
          </label>
          <Slider
            value={angle}
            onChange={(value) => setAngle(value)}
            min={-90}
            max={90}
            step={1}
            className="w-full"
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleRotate}
            disabled={isRotating}
            className="flex-1"
          >
            {isRotating ? 'Rotating...' : 'Apply Rotation'}
          </Button>

          <Button
            variant="secondary"
            onClick={undoRotation}
            disabled={rotationHistory.length === 0}
          >
            Undo
          </Button>
        </div>

        <div className="pt-4 border-t border-separator">
          <h4 className="text-sm font-medium text-primary-label mb-3">
            Rotation History
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {rotationHistory.map((rotation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-2 rounded-lg bg-quaternary-fill"
              >
                <span className="text-sm text-secondary-label">
                  F{rotation.factor1 + 1} × F{rotation.factor2 + 1}
                </span>
                <span className="text-sm font-medium text-primary-label">
                  {rotation.angle}°
                </span>
              </motion.div>
            ))}
            {rotationHistory.length === 0 && (
              <p className="text-sm text-tertiary-label text-center py-4">
                No rotations applied yet
              </p>
            )}
          </div>
        </div>

        <Button
          variant="primary"
          onClick={saveAnalysis}
          className="w-full"
        >
          Save Analysis
        </Button>
      </div>
    </Card>
  );
}
```

---

## 13. API Integration Layer

### 13.1 Backend API Client

```typescript
// lib/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/lib/stores/auth-store';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor for authentication
    this.client.interceptors.request.use(
      config => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            return this.client(originalRequest);
          } catch (refreshError) {
            // Redirect to login
            window.location.href = '/auth/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    const response = await this.client.post('/auth/refresh', {
      refreshToken,
    });

    const { accessToken } = response.data;
    localStorage.setItem('accessToken', accessToken);
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new APIClient();
```

### 13.2 Q-Analysis API Service

```typescript
// lib/api/q-analysis.ts
import { apiClient } from './client';

export interface AnalysisOptions {
  extractionMethod: string;
  rotationMethod: string;
  numberOfFactors: number | null;
  bootstrapIterations: number;
}

export interface QAnalysisResult {
  analysisId: string;
  correlationMatrix: number[][];
  extraction: any;
  rotation: any;
  factorArrays: any[];
  distinguishingStatements: any[];
  consensusStatements: any[];
}

export class QAnalysisAPI {
  static async perform(
    studyId: string,
    options: AnalysisOptions
  ): Promise<QAnalysisResult> {
    return apiClient.post(`/analysis/${studyId}/perform`, options);
  }

  static interactive = {
    async start(studyId: string): Promise<{ id: string }> {
      return apiClient.post(`/analysis/${studyId}/interactive/start`);
    },

    async rotate(sessionId: string, rotation: any): Promise<any> {
      return apiClient.post(
        `/analysis/interactive/${sessionId}/rotate`,
        rotation
      );
    },

    async save(sessionId: string): Promise<{ analysisId: string }> {
      return apiClient.post(`/analysis/interactive/${sessionId}/save`);
    },
  };

  static export = {
    async pqmethod(analysisId: string): Promise<Blob> {
      const response = await apiClient.get(
        `/analysis/${analysisId}/export/pqmethod`,
        { responseType: 'blob' }
      );
      return response as any;
    },

    async spss(analysisId: string): Promise<Blob> {
      const response = await apiClient.get(
        `/analysis/${analysisId}/export/spss`,
        { responseType: 'blob' }
      );
      return response as any;
    },

    async excel(analysisId: string): Promise<Blob> {
      const response = await apiClient.get(
        `/analysis/${analysisId}/export/excel`,
        { responseType: 'blob' }
      );
      return response as any;
    },

    async pdf(analysisId: string): Promise<Blob> {
      const response = await apiClient.get(
        `/analysis/${analysisId}/export/pdf`,
        { responseType: 'blob' }
      );
      return response as any;
    },
  };
}
```

---

## 14. 3D Factor Visualization

### 14.1 Three.js Factor Space Component

```typescript
// components/q-analysis/Factor3DSpace.tsx
'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Line } from '@react-three/drei';
import { useQAnalysisStore } from '@/lib/stores/q-analysis-store';
import * as THREE from 'three';

function FactorPoint({ position, label, color }: any) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position}>
      <Sphere ref={meshRef} args={[0.1, 32, 32]}>
        <meshStandardMaterial color={color} />
      </Sphere>
      <Text
        position={[0, 0.2, 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

function FactorAxes() {
  return (
    <>
      <Line
        points={[[-5, 0, 0], [5, 0, 0]]}
        color="red"
        lineWidth={2}
      />
      <Line
        points={[[0, -5, 0], [0, 5, 0]]}
        color="green"
        lineWidth={2}
      />
      <Line
        points={[[0, 0, -5], [0, 0, 5]]}
        color="blue"
        lineWidth={2}
      />
    </>
  );
}

export function Factor3DSpace() {
  const { factorLoadings } = useQAnalysisStore();

  const points = useMemo(() => {
    if (!factorLoadings) return [];

    // Convert factor loadings to 3D coordinates
    return factorLoadings.map((loading, index) => ({
      position: [
        loading[0] * 4 || 0,
        loading[1] * 4 || 0,
        loading[2] * 4 || 0,
      ],
      label: `P${index + 1}`,
      color: `hsl(${(index * 360) / factorLoadings.length}, 70%, 50%)`,
    }));
  }, [factorLoadings]);

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden bg-quaternary-fill">
      <Canvas camera={{ position: [5, 5, 5], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        <FactorAxes />

        {points.map((point, index) => (
          <FactorPoint key={index} {...point} />
        ))}

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
      </Canvas>
    </div>
  );
}
```

---

## 15. Testing for Phase 6.5

### 15.1 Q-Analysis UI Tests

```typescript
// __tests__/q-analysis/QAnalysisDashboard.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QAnalysisDashboard } from '@/components/q-analysis/QAnalysisDashboard';
import { useQAnalysisStore } from '@/lib/stores/q-analysis-store';

jest.mock('@/lib/stores/q-analysis-store');

describe('QAnalysisDashboard', () => {
  const mockPerformAnalysis = jest.fn();
  const mockSetStudy = jest.fn();

  beforeEach(() => {
    (useQAnalysisStore as jest.Mock).mockReturnValue({
      setStudy: mockSetStudy,
      performAnalysis: mockPerformAnalysis,
      isAnalyzing: false,
      factorArrays: null,
    });
  });

  it('should render configuration tab by default', () => {
    render(<QAnalysisDashboard studyId="test-study" />);

    expect(screen.getByText('Q-Methodology Analysis')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Configure' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('should call performAnalysis when starting analysis', async () => {
    const user = userEvent.setup();
    render(<QAnalysisDashboard studyId="test-study" />);

    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    await user.click(analyzeButton);

    await waitFor(() => {
      expect(mockPerformAnalysis).toHaveBeenCalled();
    });
  });

  it('should enable results tab after analysis completes', () => {
    (useQAnalysisStore as jest.Mock).mockReturnValue({
      setStudy: mockSetStudy,
      performAnalysis: mockPerformAnalysis,
      isAnalyzing: false,
      factorArrays: [{ factor: 1 }], // Analysis complete
    });

    render(<QAnalysisDashboard studyId="test-study" />);

    const resultsTab = screen.getByRole('tab', { name: 'Results' });
    expect(resultsTab).not.toBeDisabled();
  });
});
```

### 15.2 API Integration Tests

```typescript
// __tests__/api/q-analysis.test.ts
import { QAnalysisAPI } from '@/lib/api/q-analysis';
import { apiClient } from '@/lib/api/client';

jest.mock('@/lib/api/client');

describe('QAnalysisAPI', () => {
  it('should perform analysis with correct parameters', async () => {
    const mockResult = {
      analysisId: 'test-123',
      correlationMatrix: [
        [1, 0.5],
        [0.5, 1],
      ],
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResult);

    const result = await QAnalysisAPI.perform('study-123', {
      extractionMethod: 'pca',
      rotationMethod: 'varimax',
      numberOfFactors: 3,
      bootstrapIterations: 1000,
    });

    expect(apiClient.post).toHaveBeenCalledWith('/analysis/study-123/perform', {
      extractionMethod: 'pca',
      rotationMethod: 'varimax',
      numberOfFactors: 3,
      bootstrapIterations: 1000,
    });

    expect(result).toEqual(mockResult);
  });
});
```

---

## Summary of Phase 6.5 Updates

This update to Part 3 adds comprehensive specifications for:

1. **Frontend Separation**: Complete Next.js 14 application structure
2. **Q-Analysis State Management**: Zustand stores for analysis and WebSocket
3. **Q-Analytics UI Components**: Dashboard, rotation interface, 3D visualization
4. **API Integration Layer**: Backend communication with authentication
5. **Testing Infrastructure**: Unit and integration tests for new components

These additions provide the technical implementation details needed to complete Phase 6.5 and make the platform fully functional with a proper frontend application.
