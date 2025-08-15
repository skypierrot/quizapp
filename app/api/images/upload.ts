// 비활성화된 파일 - TypeScript 빌드 에러로 인해 주석 처리
// 추후 스키마 업데이트 후 활성화 예정

/*
import { db } from '@/lib/db';
import { images } from '@/db/schema/images';

// 업로드 성공 후 DB 기록
await db.insert(images).values({
  filename: fileName, // 저장된 파일명
  originalName: file.originalname || file.name, // 업로드 시 원본 파일명
  path: publicPath, // publicPath는 '/images/uploaded/...' 형태
  type: 'question', // 필요시 동적으로 지정
  size: file.size,
  mimeType: file.mimetype || file.type,
  status: 'active',
  createdAt: new Date(),
  lastCheckedAt: new Date(),
});
*/

// 현재는 빈 내용으로 TypeScript 에러 방지
export {}; 