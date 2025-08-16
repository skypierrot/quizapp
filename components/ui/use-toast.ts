"use client";

// 간단한 토스트 기능 구현
import { useState, useCallback } from "react";

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'destructive';

interface ToastOptions {
  title?: string | undefined;
  description?: string | undefined;
  duration?: number | undefined;
  variant?: ToastType | undefined;
}

interface Toast extends ToastOptions {
  id: string;
  visible: boolean;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      title: options.title,
      description: options.description,
      duration: options.duration || 3000,
      variant: options.variant || 'info',
      visible: true,
    };

    setToasts((prevToasts) => [...prevToasts, newToast]);

    setTimeout(() => {
      setToasts((prevToasts) => 
        prevToasts.map((toast) => 
          toast.id === id ? { ...toast, visible: false } : toast
        )
      );

      setTimeout(() => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
      }, 300);
    }, newToast.duration);

    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prevToasts) => 
      prevToasts.map((toast) => 
        toast.id === id ? { ...toast, visible: false } : toast
      )
    );

    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, 300);
  }, []);

  return {
    toast,
    dismissToast,
    toasts,
  };
}

export type { ToastOptions }; 