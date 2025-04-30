import { useToast } from "@/components/ui/use-toast";
import { IImageUploadResult, ImageType } from "@/types/question";
import { ToastType } from "@/types/toast";

/**
 * 파일을 base64 문자열로 변환합니다. (현재 사용 안 함)
 * @param file 변환할 파일 객체
 * @returns Promise<string> base64 문자열
 */
// export const convertToBase64 = (file: File): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.readAsDataURL(file);
//     reader.onload = () => resolve(reader.result as string);
//     reader.onerror = error => reject(error);
//   });
// };

/**
 * 이미지 파일을 처리하고 base64 문자열로 변환합니다. (현재 사용 안 함)
 * 이미지 크기 제한 검사도 수행합니다.
 * @param file 이미지 파일
 * @param maxSizeMB 최대 크기(MB)
 * @returns Promise<IImageUploadResult> 처리 결과
 */
// export const handleImageUpload = async (
//   file: File, 
//   maxSizeMB: number = 10
// ): Promise<IImageUploadResult> => {
//   // 이미지 타입 검사
//   if (!file.type.startsWith('image/')) {
//     return {
//       success: false,
//       message: "이미지 파일만 업로드 가능합니다."
//     };
//   }
// 
//   // 크기 제한 검사 (기본 10MB)
//   const maxSize = maxSizeMB * 1024 * 1024;
//   if (file.size > maxSize) {
//     return {
//       success: false,
//       message: `${maxSizeMB}MB 이하의 이미지만 업로드 가능합니다.`
//     };
//   }
// 
//   try {
//     const base64 = await convertToBase64(file);
//     return {
//       success: true,
//       message: "이미지가 성공적으로 변환되었습니다.",
//       imageUrl: base64
//     };
//   } catch (error) {
//     console.error("이미지 변환 오류:", error);
//     return {
//       success: false,
//       message: "이미지 처리 중 오류가 발생했습니다."
//     };
//   }
// };

/**
 * 클립보드 이벤트에서 이미지 파일을 추출합니다.
 * 이미지 크기 제한 검사도 수행합니다.
 * @param e 클립보드 이벤트
 * @param maxSizeMB 최대 크기(MB)
 * @returns Promise<File | { success: false; message: string }> 추출된 파일 객체 또는 오류 객체
 */
export const handlePasteImage = async (
  e: ClipboardEvent,
  maxSizeMB: number = 10
): Promise<File | { success: false; message: string }> => {
  if (!e.clipboardData) {
    return {
      success: false,
      message: "클립보드 데이터를 읽을 수 없습니다."
    };
  }

  // 클립보드에서 이미지 파일 추출
  const items = e.clipboardData.items;
  let imageFile: File | null = null;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      imageFile = items[i].getAsFile();
      break;
    }
  }

  if (!imageFile) {
    return {
      success: false,
      message: "클립보드에 이미지가 없습니다."
    };
  }

  // 이미지 타입 검사 (추가)
  if (!imageFile.type.startsWith('image/')) {
    return {
      success: false,
      message: "이미지 파일만 붙여넣기 가능합니다."
    };
  }

  // 크기 제한 검사
  const maxSize = maxSizeMB * 1024 * 1024;
  if (imageFile.size > maxSize) {
    return {
      success: false,
      message: `${maxSizeMB}MB 이하의 이미지만 붙여넣기 가능합니다.`
    };
  }

  // Base64 변환 대신 File 객체 반환
  return imageFile;
};

/**
 * 토스트 메시지를 표시합니다. 오류 처리에 사용됩니다.
 * @param title 제목
 * @param message 메시지
 * @param type 토스트 타입
 */
export const showImageToast = (
  title: string, 
  message: string, 
  type: ToastType = "default"
) => {
  // 컴포넌트 내에서만 훅을 사용할 수 있으므로 여기서는 console.log로 대체
  console.log(`[Image Toast] ${title}: ${message} (${type})`);
  // 실제 컴포넌트에서는 useToast 훅을 사용하여 표시
};

/**
 * 파일의 SHA-256 해시를 계산합니다.
 * @param file 해시를 계산할 파일 객체
 * @returns Promise<string> 계산된 해시 문자열 (hex)
 */
export async function getFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * API 응답 데이터 등에서 이미지 URL을 추출하고 정규화합니다.
 * 입력값이 문자열이거나 { url: string } 객체 형태일 수 있으며,
 * 반환되는 URL은 항상 /images/uploaded/ 로 시작하도록 보장합니다 (이미 그렇게 시작하는 경우는 제외).
 * @param img 이미지 데이터 (string 또는 { url: string })
 * @returns 정규화된 이미지 URL 문자열 또는 빈 문자열
 */
export const getImageUrl = (img: { url: string } | string | undefined | null): string => {
  if (!img) return ""; // null 또는 undefined 처리
  const url = typeof img === "string" ? img : img.url;
  if (!url) return ""; // URL 값이 없는 경우 처리

  // blob: URL은 그대로 반환 (오류 확인용)
  if (url.startsWith('blob:')) {
    console.warn("getImageUrl received a blob URL:", url);
    return url;
  }

  // 이미 올바른 경로 형식이거나 외부 URL이면 그대로 반환
  if (url.startsWith("/images/uploaded/") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // 경로 앞에 /images/uploaded/ 추가 (파일 이름만 있는 경우 등)
  // 경로 맨 앞에 /가 있을 수도 있고 없을 수도 있으므로 제거 후 추가
  const filename = url.startsWith('/') ? url.substring(1) : url;
  return `/images/uploaded/${filename}`;
}; 