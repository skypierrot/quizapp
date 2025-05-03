/**
 * 간단한 임시 ID를 생성합니다.
 * Math.random()과 Date.now()를 조합하여 충돌 가능성을 낮춥니다.
 * 더 강력한 고유성이 필요하다면 uuid 같은 라이브러리 사용을 고려하세요.
 */
export const generateTempId = (): string => {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}; 