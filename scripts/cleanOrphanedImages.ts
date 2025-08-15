import { db } from '@/db';
import { images } from '@/db/schema/images';
import { unlink, readdir } from 'fs/promises';
import path from 'path';
import { eq } from 'drizzle-orm';

/**
 * 고아 이미지 정리 스크립트
 * 다음 상황의 이미지를 정리합니다:
 * 1. DB에서 status='deleted'로 표시된 이미지 (삭제된 이미지)
 * 2. 파일은 존재하지만 DB에 메타데이터가 없는 이미지
 */
async function cleanOrphanedImages() {
  try {
    console.log('고아 이미지 정리 작업 시작...');
    const startTime = Date.now();
    
    // 1. 삭제 상태인 이미지 레코드 조회
    const deletedImages = await db.select().from(images).where(eq(images.status, 'deleted'));
    
    // 2. 파일 시스템에서 실제 파일 삭제
    let deletedCount = 0;
    for (const image of deletedImages) {
      const filePath = path.join(process.cwd(), 'public', image.path);
      try {
        await unlink(filePath);
        console.log(`삭제됨: ${image.path}`);
        deletedCount++;
        
        // 3. DB에서 레코드 삭제
        await db.delete(images).where(eq(images.id, image.id));
      } catch (error) {
        console.error(`파일 삭제 실패: ${image.path}`, error);
      }
    }
    
    console.log(`총 ${deletedCount}개의 삭제된 이미지 파일 정리 완료`);
    
    // 4. 메타데이터 없는 이미지 파일 검사 (디렉토리 스캔)
    const types = ['questions', 'options', 'explanations'];
    let orphanedFilesCount = 0;
    
    for (const type of types) {
      const dirPath = path.join(process.cwd(), 'public', 'uploads', type);
      
      try {
        const files = await readdir(dirPath);
        
        for (const file of files) {
          const relativePath = `/uploads/${type}/${file}`;
          // DB에 해당 경로의 이미지 레코드가 있는지 확인
          const exists = await db.select().from(images).where(eq(images.path, relativePath)).limit(1);
          
          if (exists.length === 0) {
            // 메타데이터 없는 파일 삭제
            const filePath = path.join(dirPath, file);
            try {
              await unlink(filePath);
              console.log(`메타데이터 없는 파일 삭제: ${relativePath}`);
              orphanedFilesCount++;
            } catch (error) {
              console.error(`파일 삭제 실패: ${relativePath}`, error);
            }
          }
        }
      } catch (error) {
        console.error(`디렉토리 읽기 실패: ${dirPath}`, error);
      }
    }
    
    console.log(`총 ${orphanedFilesCount}개의 고아 이미지 파일 정리 완료`);
    
    const endTime = Date.now();
    console.log(`이미지 정리 작업 완료 (소요 시간: ${(endTime - startTime) / 1000}초)`);
    
  } catch (error) {
    console.error('이미지 정리 중 오류 발생:', error);
  }
}

// 스크립트 직접 실행 시 실행
if (require.main === module) {
  cleanOrphanedImages()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default cleanOrphanedImages; 