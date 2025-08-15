import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  nickname?: string;
  [key: string]: any;
}

interface Session {
  user: User;
  [key: string]: any;
}

interface UseAuthReturn {
  session: Session | null;
  authStatus: 'loading' | 'authenticated' | 'unauthenticated';
  mounted: boolean;
  isLoading: boolean;
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [mounted, setMounted] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setSession(data);
          setAuthStatus('authenticated');
        } else {
          setAuthStatus('unauthenticated');
        }
      } else {
        setAuthStatus('unauthenticated');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthStatus('unauthenticated');
    } finally {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    // Hydration 안전성을 위한 지연 실행
    const timer = setTimeout(() => {
      checkAuth();
    }, 0);
    
    return () => clearTimeout(timer);
  }, [checkAuth]);

  return {
    session,
    authStatus,
    mounted,
    isLoading: !mounted || authStatus === 'loading'
  };
}
