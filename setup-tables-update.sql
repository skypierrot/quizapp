-- questions 테이블에 tags 컬럼 추가
ALTER TABLE "questions" ADD COLUMN "tags" jsonb DEFAULT '[]'; 