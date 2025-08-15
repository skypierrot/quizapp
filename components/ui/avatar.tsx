import * as React from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Avatar({ children, ...props }: AvatarProps) {
  return (
    <div
      className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full"
      {...props}
    >
      {children}
    </div>
  );
}

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function AvatarFallback({ children, ...props }: AvatarFallbackProps) {
  return (
    <span
      className="flex h-full w-full items-center justify-center rounded-full bg-muted"
      {...props}
    >
      {children}
    </span>
  );
} 