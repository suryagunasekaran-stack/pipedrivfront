/**
 * Custom hook for using react-hot-toast with predefined configurations
 */
import toast from 'react-hot-toast';

export const useToast = () => {
  const showSuccess = (message: string, duration?: number) => {
    return toast.success(message, {
      duration: duration || 3000,
    });
  };

  const showError = (message: string, duration?: number) => {
    return toast.error(message, {
      duration: duration || 5000,
    });
  };

  const showLoading = (message: string) => {
    return toast.loading(message);
  };

  const showInfo = (message: string, duration?: number) => {
    return toast(message, {
      icon: 'ℹ️',
      duration: duration || 4000,
    });
  };

  const showWarning = (message: string, duration?: number) => {
    return toast(message, {
      icon: '⚠️',
      duration: duration || 4000,
      style: {
        background: '#f59e0b',
        color: '#fff',
      },
    });
  };

  const dismiss = (toastId?: string) => {
    toast.dismiss(toastId);
  };

  const dismissAll = () => {
    toast.dismiss();
  };

  // Promise-based toast for async operations
  const showPromise = <T,>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    }
  ) => {
    return toast.promise(promise, msgs);
  };

  return {
    success: showSuccess,
    error: showError,
    loading: showLoading,
    info: showInfo,
    warning: showWarning,
    dismiss,
    dismissAll,
    promise: showPromise,
  };
};

export default useToast;
