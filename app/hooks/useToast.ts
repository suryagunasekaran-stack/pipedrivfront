import { useState } from 'react';
import { ToastState } from '../types/pipedrive';
import { TOAST_AUTO_HIDE_DELAY } from '../constants';

/**
 * Custom hook for managing toast notifications
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    show: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showToast = (type: ToastState['type'], title: string, message: string) => {
    setToast({ show: true, type, title, message });
    
    // Auto-hide after configured delay
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, TOAST_AUTO_HIDE_DELAY);
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  return {
    toast,
    showToast,
    hideToast
  };
}
