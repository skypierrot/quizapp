// types/toast.ts
// 토스트 관련 타입 정의

/**
 * 토스트 메시지의 타입을 정의합니다.
 * 모든 토스트 메시지는 이 타입을 사용해야 합니다.
 * ShadCN UI의 toast 컴포넌트와 호환됩니다.
 */
export type ToastType = "default" | "destructive" | "success" | "warning" | "info" | "error";

/**
 * 토스트 액션 요소의 타입을 정의합니다.
 */
export type ToastActionElement = React.ReactElement<{
  className?: string;
  altText: string;
  onClick?: () => void;
}>;

/**
 * 토스트 컴포넌트의 변형을 정의합니다.
 * ToastType과 동일한 값을 가지므로 호환성을 위해 유지합니다.
 */
export type ToastVariant = ToastType; 