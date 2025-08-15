"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Toast = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    title?: string | undefined;
    description?: string | undefined;
    variant?: "default" | "destructive" | "success" | "warning" | "info" | undefined;
    onClose?: (() => void) | undefined;
  }
>(({ className, title, description, variant = "default", onClose, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "group pointer-events-auto relative flex w-full max-w-md items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 shadow-lg transition-all",
        variant === "default" && "bg-white text-slate-950 dark:bg-slate-950 dark:text-slate-50",
        variant === "destructive" && "bg-red-50 text-red-900 border-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-50",
        variant === "success" && "bg-green-50 text-green-900 border-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-50",
        variant === "warning" && "bg-yellow-50 text-yellow-900 border-yellow-100 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-50",
        variant === "info" && "bg-blue-50 text-blue-900 border-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-50",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1">
        {title && <div className="font-medium">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 rounded-md p-1 text-slate-500 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
    </div>
  );
});

Toast.displayName = "Toast";

export { Toast }; 