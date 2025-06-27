export const formatTime = (totalSeconds: number | null | undefined): string => {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds) || totalSeconds < 0) {
    return '00:00'; // 유효하지 않은 값은 00:00으로 표시
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

/**
 * 날짜를 한국 시간대로 변환하여 'YYYY-MM-DD HH:MM' 형식으로 반환
 * @param date 날짜 객체 또는 ISO 문자열
 * @returns 한국 시간대 기준 날짜 및 시간 문자열
 */
export const formatKoreanDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // 한국 시간대(UTC+9)로 설정
  const koreanTime = new Date(dateObj.getTime() + 9 * 60 * 60 * 1000);
  
  const year = koreanTime.getUTCFullYear();
  const month = String(koreanTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(koreanTime.getUTCDate()).padStart(2, '0');
  const hours = String(koreanTime.getUTCHours()).padStart(2, '0');
  const minutes = String(koreanTime.getUTCMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * 날짜를 한국 시간대로 변환하여 'YYYY-MM-DD' 형식으로 반환
 * @param date 날짜 객체 또는 ISO 문자열
 * @returns 한국 시간대 기준 날짜 문자열
 */
export const formatKoreanDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // 한국 시간대(UTC+9)로 설정
  const koreanTime = new Date(dateObj.getTime() + 9 * 60 * 60 * 1000);
  
  const year = koreanTime.getUTCFullYear();
  const month = String(koreanTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(koreanTime.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}; 