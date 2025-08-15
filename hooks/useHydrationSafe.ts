import { useState, useEffect } from 'react';

/**
 * Hydration 안전성을 보장하는 훅
 * 서버와 클라이언트 간 렌더링 불일치를 방지합니다.
 */
export function useHydrationSafe() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

/**
 * 조건부 렌더링을 위한 안전한 훅
 * mounted 상태가 false일 때는 fallback을 반환합니다.
 */
export function useSafeRender<T>(
  renderFn: () => T,
  fallback: T,
  dependencies: any[] = []
): T {
  const mounted = useHydrationSafe();
  
  useEffect(() => {
    // 의존성 배열이 변경될 때마다 실행
  }, dependencies);

  if (!mounted) {
    return fallback;
  }

  return renderFn();
}

/**
 * 클라이언트 전용 상태를 위한 훅
 * 서버에서는 초기값을, 클라이언트에서는 실제 값을 반환합니다.
 */
export function useClientState<T>(initialValue: T, clientValue: T): T {
  const mounted = useHydrationSafe();
  return mounted ? clientValue : initialValue;
}

/**
 * 안전한 이벤트 핸들러를 위한 훅
 * mounted 상태가 false일 때는 noop 함수를 반환합니다.
 */
export function useSafeEventHandler<T extends (...args: any[]) => any>(
  handler: T
): T {
  const mounted = useHydrationSafe();
  
  if (!mounted) {
    return (() => {}) as T;
  }
  
  return handler;
}
