'use client'

import Navbar from "./Navbar";
import NicknameGuard from "./NicknameGuard";
import SimpleErrorBoundary from "./SimpleErrorBoundary";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SimpleErrorBoundary>
      <NicknameGuard>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          {children}
        </div>
      </NicknameGuard>
    </SimpleErrorBoundary>
  );
}
