// Service Worker Registration and Management

export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCheckInterval: number | null = null;

  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      console.log('Service Worker registered successfully');

      // Handle updates
      this.handleUpdates();

      // Check for updates periodically (every 30 minutes)
      this.updateCheckInterval = window.setInterval(() => {
        this.checkForUpdates();
      }, 30 * 60 * 1000);

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed');
        this.onControllerChange();
      });

      // Handle messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });

      // Request notification permission if needed
      if ('Notification' in window && Notification.permission === 'default') {
        await this.requestNotificationPermission();
      }

      // Register background sync
      if ('sync' in this.registration) {
        await this.registerBackgroundSync();
      }

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  private handleUpdates(): void {
    if (!this.registration) return;

    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          this.notifyUpdateAvailable();
        }
      });
    });
  }

  private notifyUpdateAvailable(): void {
    // Show update notification to user
    const updateBanner = document.createElement('div');
    updateBanner.className = 'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50';
    updateBanner.innerHTML = `
      <div class="bg-blue-600 text-white p-4 rounded-lg shadow-lg flex items-center justify-between">
        <div>
          <p class="font-semibold">Update Available</p>
          <p class="text-sm opacity-90">A new version of VQMethod is available.</p>
        </div>
        <button id="update-btn" class="ml-4 px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
          Update
        </button>
      </div>
    `;

    document.body.appendChild(updateBanner);

    document.getElementById('update-btn')?.addEventListener('click', () => {
      this.skipWaiting();
      updateBanner.remove();
    });

    // Auto-remove after 10 seconds
    setTimeout(() => {
      updateBanner.remove();
    }, 10000);
  }

  private skipWaiting(): void {
    if (!this.registration?.waiting) return;

    // Tell service worker to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  private onControllerChange(): void {
    // Reload page when controller changes
    window.location.reload();
  }

  async checkForUpdates(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { data } = event;

    switch (data.type) {
      case 'upload-synced':
        this.notifyUploadSynced(data.url);
        break;
      case 'offline-ready':
        this.notifyOfflineReady();
        break;
      case 'cache-updated':
        console.log('Cache updated:', data.cacheName);
        break;
      default:
        console.log('Unknown message from service worker:', data);
    }
  }

  private notifyUploadSynced(url: string): void {
    // Show notification that offline upload was synced
    this.showNotification('Upload Synced', {
      body: 'Your offline upload has been synchronized.',
      icon: '/images/icon-192.png',
    });
  }

  private notifyOfflineReady(): void {
    console.log('App is ready for offline use');
  }

  async requestNotificationPermission(): Promise<void> {
    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  }

  async registerBackgroundSync(): Promise<void> {
    if (!this.registration || !('sync' in this.registration)) return;

    try {
      // Type assertion for sync API which might not be fully typed
      const reg = this.registration as any;
      if (reg.sync) {
        await reg.sync.register('sync-uploads');
        await reg.sync.register('sync-grid-changes');
        console.log('Background sync registered');
      }
    } catch (error) {
      console.error('Failed to register background sync:', error);
    }
  }

  showNotification(title: string, options?: NotificationOptions): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }

  async cacheUrls(urls: string[]): Promise<void> {
    if (!navigator.serviceWorker.controller) return;

    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_URLS',
      urls,
    });
  }

  async clearCache(cacheName?: string): Promise<void> {
    if (!navigator.serviceWorker.controller) return;

    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_CACHE',
      cacheName,
    });
  }

  async unregister(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.unregister();
      console.log('Service Worker unregistered');
    } catch (error) {
      console.error('Failed to unregister service worker:', error);
    }

    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }
  }

  isOffline(): boolean {
    return !navigator.onLine;
  }

  async syncOfflineData(): Promise<void> {
    if (!this.registration || !('sync' in this.registration)) return;

    try {
      // Type assertion for sync API which might not be fully typed
      const reg = this.registration as any;
      if (reg.sync) {
        await reg.sync.register('sync-all');
      }
    } catch (error) {
      console.error('Failed to trigger sync:', error);
    }
  }
}

// Create and export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Auto-register on load
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    serviceWorkerManager.register();
  });
}