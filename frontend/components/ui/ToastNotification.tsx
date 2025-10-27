'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Info, AlertTriangle, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'autosave';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
}

interface ToastNotificationProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const toastIcons = {
  success: <Check className="w-4 h-4" />,
  error: <X className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
  info: <Info className="w-4 h-4" />,
  autosave: <Save className="w-4 h-4" />,
};

const toastStyles = {
  success:
    'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
  error:
    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
  warning:
    'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  autosave:
    'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200',
};

export function ToastNotification({
  toast,
  onDismiss,
}: ToastNotificationProps) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, toast.duration);

      return () => clearTimeout(timer);
    }
    // Return undefined for consistency when no timer is set
    return undefined;
  }, [toast, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-sm backdrop-blur-sm',
        'min-w-[280px] max-w-[420px]',
        toastStyles[toast.type]
      )}
    >
      <span className="flex-shrink-0">{toastIcons[toast.type]}</span>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  position?: Toast['position'];
}

export function ToastContainer({
  toasts,
  onDismiss,
  position = 'top-right',
}: ToastContainerProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  const stackDirection = position.includes('bottom')
    ? 'flex-col-reverse'
    : 'flex-col';

  return (
    <div
      className={cn(
        'fixed z-50',
        positionClasses[position],
        'pointer-events-none'
      )}
    >
      <div className={cn('flex gap-2', stackDirection)}>
        <AnimatePresence mode="sync">
          {toasts.map((toast: any) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastNotification toast={toast} onDismiss={onDismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Toast Hook
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 3000,
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter((t: any) => t.id !== id));
  };

  const showSuccess = (message: string, duration?: number) => {
    return addToast({
      type: 'success',
      message,
      ...(duration !== undefined && { duration }),
    });
  };

  const showError = (message: string, duration?: number) => {
    return addToast({ type: 'error', message, duration: duration ?? 5000 });
  };

  const showWarning = (message: string, duration?: number) => {
    return addToast({ type: 'warning', message, duration: duration ?? 4000 });
  };

  const showInfo = (message: string, duration?: number) => {
    return addToast({
      type: 'info',
      message,
      ...(duration !== undefined && { duration }),
    });
  };

  const showAutoSave = (message: string = 'Auto-saved') => {
    // Remove any existing autosave toasts
    setToasts(prev => prev.filter((t: any) => t.type !== 'autosave'));
    return addToast({ type: 'autosave', message, duration: 2000 });
  };

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showAutoSave,
  };
}
