"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Toast } from "./toast";
import { useToast } from "./use-toast";

export function Toaster() {
  const { toasts, dismissToast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  if (!isMounted) return null;

  return isMounted
    ? createPortal(
        <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:flex-col md:max-w-[420px]">
          {toasts
            .filter((toast) => toast.visible)
            .map((toast) => (
              <Toast
                key={toast.id}
                title={toast.title}
                description={toast.description}
                variant={toast.variant as any}
                onClose={() => dismissToast(toast.id)}
                className="animate-in fade-in-0 slide-in-from-right-full slide-out-to-right-full duration-300"
              />
            ))}
        </div>,
        document.body
      )
    : null;
} 