import { useEffect, useRef, useCallback, useState } from 'react';
import { DraftService } from '../services/draft.service';
import { useToast } from '@/components/ui/ToastNotification';
import debounce from 'lodash/debounce';

interface AutoSaveOptions {
  enabled?: boolean;
  delay?: number; // milliseconds
  onSave?: (data: any) => Promise<void> | void;
  onError?: (error: Error) => void;
  showNotifications?: boolean;
  validateBeforeSave?: (data: any) => boolean;
}

export function useAutoSave<T extends Record<string, any>>(
  data: T,
  draftId: string | null,
  options: AutoSaveOptions = {}
) {
  const {
    enabled = true,
    delay = 30000, // 30 seconds default as requested
    onSave,
    onError,
    showNotifications = true,
    validateBeforeSave,
  } = options;

  const { showError } = useToast();
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [autoSaveError, setAutoSaveError] = useState<Error | null>(null);
  const previousDataRef = useRef<T>(data);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create a debounced save function
  const debouncedSave = useRef(
    debounce(async (dataToSave: T, id: string) => {
      if (!enabled) return;

      // Validate data if validator provided
      if (validateBeforeSave && !validateBeforeSave(dataToSave)) {
        return;
      }

      setIsAutoSaving(true);
      setAutoSaveError(null);

      try {
        // Use custom save function if provided, otherwise use DraftService
        if (onSave) {
          await onSave(dataToSave);
        } else {
          DraftService.saveDraft(id, dataToSave);
        }

        setLastSaveTime(new Date());

        // Don't show notification here - handled by parent component
        // This ensures consistent messaging for both auto and manual saves

        // Update previous data reference
        previousDataRef.current = dataToSave;
      } catch (error: any) {
        const err = error as Error;
        setAutoSaveError(err);

        if (onError) {
          onError(err);
        }

        if (showNotifications) {
          showError(`Auto-save failed: ${err.message}`);
        }
      } finally {
        setIsAutoSaving(false);
      }
    }, delay)
  ).current;

  // Detect changes and trigger auto-save
  useEffect(() => {
    if (!enabled || !draftId) return;

    // Check if data has changed
    const hasChanged =
      JSON.stringify(data) !== JSON.stringify(previousDataRef.current);

    if (hasChanged) {
      debouncedSave(data, draftId);
    }

    return () => {
      debouncedSave.cancel();
    };
  }, [data, draftId, enabled, debouncedSave]);

  // Manual save function
  const saveNow = useCallback(async () => {
    if (!draftId) return;

    debouncedSave.cancel();
    setIsAutoSaving(true);
    setAutoSaveError(null);

    try {
      if (onSave) {
        await onSave(data);
      } else {
        DraftService.saveDraft(draftId, data);
      }

      setLastSaveTime(new Date());
      previousDataRef.current = data;

      // Don't show notification here - let the parent component handle it
      // This prevents duplicate notifications
    } catch (error: any) {
      const err = error as Error;
      setAutoSaveError(err);

      if (onError) {
        onError(err);
      }

      if (showNotifications) {
        showError(`Save failed: ${err.message}`);
      }
    } finally {
      setIsAutoSaving(false);
    }
  }, [data, draftId, onSave, showNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      debouncedSave.cancel();
    };
  }, []);

  return {
    isAutoSaving,
    lastSaveTime,
    autoSaveError,
    saveNow,
    hasUnsavedChanges:
      JSON.stringify(data) !== JSON.stringify(previousDataRef.current),
  };
}
