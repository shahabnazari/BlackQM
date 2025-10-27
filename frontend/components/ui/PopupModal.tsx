'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/apple-ui/Button';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  X,
  AlertTriangle,
} from 'lucide-react';

export type PopupType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface PopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: PopupType;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  position?: 'center' | 'top' | 'bottom';
}

const iconMap = {
  success: <CheckCircle className="w-12 h-12 text-green-500" />,
  error: <XCircle className="w-12 h-12 text-red-500" />,
  warning: <AlertTriangle className="w-12 h-12 text-yellow-500" />,
  info: <Info className="w-12 h-12 text-blue-500" />,
  confirm: <AlertCircle className="w-12 h-12 text-blue-500" />,
};

const titleMap = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Information',
  confirm: 'Confirmation',
};

export default function PopupModal({
  isOpen,
  onClose,
  type = 'info',
  title,
  message,
  confirmText = type === 'confirm' ? 'Confirm' : 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  autoClose = type === 'success',
  autoCloseDelay = 3000,
  position = 'center',
}: PopupModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    }
    return undefined;
  }, [isOpen, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    handleClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    handleClose();
  };

  if (!mounted || !isOpen) return null;

  const positionClasses = {
    center: 'items-center justify-center',
    top: 'items-start justify-center pt-20',
    bottom: 'items-end justify-center pb-20',
  };

  const modalContent = (
    <div
      className={`fixed inset-0 z-[9999] flex ${positionClasses[position]} transition-opacity duration-200 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={type !== 'confirm' ? handleClose : undefined}
      />

      {/* Modal */}
      <div
        className={`
        relative bg-color-bg rounded-2xl shadow-2xl 
        min-w-[320px] max-w-md mx-4
        max-h-[90vh] overflow-hidden flex flex-col
        transform transition-all duration-200
        ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
      `}
      >
        {/* Close button for non-confirm modals */}
        {type !== 'confirm' && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-color-fill transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-color-text-secondary" />
          </button>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Icon */}
          <div className="flex justify-center mb-4">{iconMap[type]}</div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-center text-color-text mb-2">
            {title || titleMap[type]}
          </h3>

          {/* Message - Support multiline and long content */}
          <div className="text-center text-color-text-secondary leading-relaxed whitespace-pre-wrap max-w-full">
            {message}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6">
          {type === 'confirm' ? (
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={handleCancel}
                className="flex-1"
              >
                {cancelText}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirm}
                className="flex-1"
              >
                {confirmText}
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={handleClose}
              className="w-full"
            >
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// Utility hook for easy popup usage
export function usePopup() {
  const [popupState, setPopupState] = useState<{
    isOpen: boolean;
    type: PopupType;
    title?: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    type: 'info',
    message: '',
  });

  const showPopup = (
    type: PopupType,
    message: string,
    options?: {
      title?: string;
      onConfirm?: () => void;
      onCancel?: () => void;
    }
  ) => {
    setPopupState({
      isOpen: true,
      type,
      message,
      ...(options?.title && { title: options.title }),
      ...(options?.onConfirm && { onConfirm: options.onConfirm }),
      ...(options?.onCancel && { onCancel: options.onCancel }),
    });
  };

  const closePopup = () => {
    setPopupState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    popupState,
    showPopup,
    closePopup,
    showSuccess: (message: string, title?: string) =>
      showPopup('success', message, title ? { title } : {}),
    showError: (message: string, title?: string) =>
      showPopup('error', message, title ? { title } : {}),
    showWarning: (message: string, title?: string) =>
      showPopup('warning', message, title ? { title } : {}),
    showInfo: (message: string, title?: string) =>
      showPopup('info', message, title ? { title } : {}),
    showConfirm: (
      message: string,
      onConfirm: () => void,
      options?: { title?: string; onCancel?: () => void }
    ) => showPopup('confirm', message, { ...options, onConfirm }),
  };
}
