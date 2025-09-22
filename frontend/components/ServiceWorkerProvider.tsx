import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Wifi, WifiOff, CheckCircle, AlertCircle } from 'lucide-react';

interface ServiceWorkerContextType {
  isOnline: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
  updateServiceWorker: () => void;
  checkForUpdates: () => Promise<void>;
  clearCache: () => Promise<void>;
  syncOfflineData: () => Promise<void>;
}

const ServiceWorkerContext = createContext<ServiceWorkerContextType>({
  isOnline: true,
  isUpdateAvailable: false,
  registration: null,
  updateServiceWorker: () => {},
  checkForUpdates: async () => {},
  clearCache: async () => {},
  syncOfflineData: async () => {}
});

export const useServiceWorker = () => useContext(ServiceWorkerContext);

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

export const ServiceWorkerProvider: React.FC<ServiceWorkerProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [offlineDataCount, setOfflineDataCount] = useState(0);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      registerServiceWorker();
    }

    // Network status listeners
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online!', {
        icon: <Wifi className="h-4 w-4" />,
        description: 'Your connection has been restored.'
      });
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline', {
        icon: <WifiOff className="h-4 w-4" />,
        description: 'Your work will be saved locally and synced when you reconnect.'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for messages from service worker
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    // Check for offline data on mount
    checkOfflineData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      setRegistration(reg);

      // Check for updates immediately
      reg.addEventListener('updatefound', handleUpdateFound);

      // Check if there's already a waiting worker
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        setIsUpdateAvailable(true);
        setShowUpdatePrompt(true);
      }

      // Listen for new waiting workers
      reg.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      console.log('[ServiceWorker] Registration successful');

      // Check for updates periodically (every 30 minutes)
      setInterval(() => {
        reg.update();
      }, 1800000);

    } catch (error) {
      console.error('[ServiceWorker] Registration failed:', error);
      toast.error('Failed to enable offline support', {
        description: 'The app will still work but won\'t be available offline.'
      });
    }
  };

  const handleUpdateFound = () => {
    const installingWorker = registration?.installing;
    if (!installingWorker) return;

    installingWorker.addEventListener('statechange', () => {
      if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New update available
        setWaitingWorker(installingWorker);
        setIsUpdateAvailable(true);
        setShowUpdatePrompt(true);
        
        toast.info('Update available!', {
          description: 'A new version of VQMethod is ready to install.',
          action: {
            label: 'Update',
            onClick: updateServiceWorker
          },
          duration: Infinity
        });
      }
    });
  };

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    const { type, ...data } = event.data;

    switch (type) {
      case 'SYNC_COMPLETE':
        toast.success('Data synced successfully', {
          icon: <CheckCircle className="h-4 w-4" />,
          description: 'Your offline changes have been uploaded.'
        });
        checkOfflineData();
        break;
        
      case 'CACHE_UPDATED':
        console.log('[ServiceWorker] Cache updated');
        break;
        
      case 'OFFLINE_DATA_COUNT':
        setOfflineDataCount(data.count);
        break;
    }
  };

  const updateServiceWorker = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setIsUpdateAvailable(false);
      setShowUpdatePrompt(false);
      
      toast.success('Update installing...', {
        description: 'The page will reload to apply the update.'
      });
    }
  }, [waitingWorker]);

  const checkForUpdates = async () => {
    if (!registration) return;

    try {
      await registration.update();
      
      if (!isUpdateAvailable) {
        toast.info('You have the latest version', {
          icon: <CheckCircle className="h-4 w-4" />
        });
      }
    } catch (error) {
      toast.error('Failed to check for updates');
    }
  };

  const clearCache = async () => {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      // Clear localStorage data
      const keysToKeep = ['accessibilitySettings', 'userPreferences'];
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      toast.success('Cache cleared successfully', {
        description: 'All cached data has been removed.'
      });

      // Reload to get fresh data
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error('Failed to clear cache');
    }
  };

  const syncOfflineData = async () => {
    if (!isOnline) {
      toast.warning('Cannot sync while offline');
      return;
    }

    try {
      // Check for offline questionnaire data
      const offlineKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('offline_questionnaire_')
      );

      if (offlineKeys.length === 0) {
        toast.info('No offline data to sync');
        return;
      }

      toast.loading('Syncing offline data...', { id: 'sync-toast' });

      // Sync each offline item
      let syncedCount = 0;
      
      for (const key of offlineKeys) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          
          // In production, this would call the actual API
          const response = await fetch('/api/questionnaires/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          if (response.ok) {
            localStorage.removeItem(key);
            syncedCount++;
          }
        } catch (error) {
          console.error(`Failed to sync ${key}:`, error);
        }
      }

      toast.success(`Synced ${syncedCount} items successfully`, { 
        id: 'sync-toast',
        icon: <CheckCircle className="h-4 w-4" />
      });

      setOfflineDataCount(offlineKeys.length - syncedCount);
    } catch (error) {
      toast.error('Failed to sync offline data', { id: 'sync-toast' });
    }
  };

  const checkOfflineData = () => {
    const count = Object.keys(localStorage).filter(key => 
      key.startsWith('offline_questionnaire_')
    ).length;
    
    setOfflineDataCount(count);
  };

  return (
    <ServiceWorkerContext.Provider
      value={{
        isOnline,
        isUpdateAvailable,
        registration,
        updateServiceWorker,
        checkForUpdates,
        clearCache,
        syncOfflineData
      }}
    >
      {children}

      {/* Update prompt */}
      {showUpdatePrompt && (
        <Card className="fixed bottom-4 right-4 p-4 shadow-lg z-50 max-w-sm animate-in slide-in-from-bottom">
          <div className="flex items-start gap-3">
            <RefreshCw className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Update Available</h3>
              <p className="text-xs text-muted-foreground mt-1">
                A new version of VQMethod is ready to install. Update now for the latest features and improvements.
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={updateServiceWorker}>
                  Update Now
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowUpdatePrompt(false)}
                >
                  Later
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Offline data indicator */}
      {offlineDataCount > 0 && isOnline && (
        <Card className="fixed top-20 right-4 p-3 shadow-md z-40 max-w-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <div className="flex-1">
              <p className="text-xs font-medium">
                {offlineDataCount} unsaved {offlineDataCount === 1 ? 'item' : 'items'}
              </p>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              className="h-7 text-xs"
              onClick={syncOfflineData}
            >
              Sync Now
            </Button>
          </div>
        </Card>
      )}

      {/* Connection status badge */}
      <div className="fixed bottom-4 left-4 z-40">
        <Badge 
          variant={isOnline ? 'default' : 'secondary'}
          className="gap-1.5 px-3 py-1"
        >
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3" />
              Online
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              Offline Mode
            </>
          )}
        </Badge>
      </div>
    </ServiceWorkerContext.Provider>
  );
};

// Utility hook for offline-capable forms
export const useOfflineForm = (formId: string) => {
  const { isOnline } = useServiceWorker();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const saveOffline = useCallback((data: any) => {
    const key = `offline_form_${formId}`;
    const saveData = {
      ...data,
      timestamp: new Date().toISOString(),
      formId
    };

    localStorage.setItem(key, JSON.stringify(saveData));
    setLastSaved(new Date());

    if (!isOnline) {
      toast.info('Saved locally', {
        description: 'Your changes will sync when you\'re back online.'
      });
    }

    return true;
  }, [formId, isOnline]);

  const loadOffline = useCallback(() => {
    const key = `offline_form_${formId}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      const data = JSON.parse(saved);
      setLastSaved(new Date(data.timestamp));
      return data;
    }
    
    return null;
  }, [formId]);

  const clearOffline = useCallback(() => {
    const key = `offline_form_${formId}`;
    localStorage.removeItem(key);
    setLastSaved(null);
  }, [formId]);

  return {
    saveOffline,
    loadOffline,
    clearOffline,
    lastSaved,
    isOnline
  };
};