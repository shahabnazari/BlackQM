import { useState } from 'react';

/**
 * usePopup Hook
 * Popup and modal state management
 */


export interface PopupState {
  isOpen: boolean;
  type: 'info' | 'warning' | 'error' | 'confirm';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function usePopup() {
  const [popupState, setPopupState] = useState<PopupState | null>(null);

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setPopupState({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm,
      onCancel: () => closePopup(),
    });
  }
  const showWarning = (title: string, message: string) => {
    setPopupState({
      isOpen: true,
      type: 'warning',
      title,
      message
    });
  }
  const showError = (title: string, message: string) => {
    setPopupState({
      isOpen: true,
      type: 'error',
      title,
      message
    });
  }
  const closePopup = () => {
    setPopupState(null);
  }
  return {
    popupState,
    showConfirm,
    showWarning,
    showError,
    closePopup
  }
}
