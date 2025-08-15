export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]; // 원본 배열 복사
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    if (shuffled[i] !== undefined && shuffled[j] !== undefined) {
      const temp = shuffled[i]!;
      shuffled[i] = shuffled[j]!;
      shuffled[j] = temp;
    }
  }
  return shuffled;
} 