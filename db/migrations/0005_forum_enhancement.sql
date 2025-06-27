-- 포럼 고도화를 위한 테이블 구조 변경

-- 기존 threads 테이블에 새 컬럼 추가
ALTER TABLE threads ADD COLUMN IF NOT EXISTS tags TEXT;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS is_closed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS is_reported BOOLEAN NOT NULL DEFAULT FALSE;

-- 기존 thread_comments 테이블에 새 컬럼 추가
ALTER TABLE thread_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE thread_comments ADD COLUMN IF NOT EXISTS is_reported BOOLEAN NOT NULL DEFAULT FALSE;

-- 태그 테이블 생성
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 게시글-태그 관계 테이블 생성
CREATE TABLE IF NOT EXISTS thread_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(thread_id, tag_id)
);

-- 북마크 테이블 생성
CREATE TABLE IF NOT EXISTS thread_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
  UNIQUE(thread_id, user_id)
);

-- 신고 테이블 생성
CREATE TABLE IF NOT EXISTS thread_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID,
  comment_id UUID,
  reporter_id TEXT NOT NULL,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES thread_comments(id) ON DELETE CASCADE,
  CONSTRAINT check_report_target CHECK (
    (thread_id IS NOT NULL AND comment_id IS NULL) OR 
    (thread_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_threads_category ON threads(category);
CREATE INDEX IF NOT EXISTS idx_threads_view_count ON threads(view_count);
CREATE INDEX IF NOT EXISTS idx_threads_comment_count ON threads(comment_count);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at);
CREATE INDEX IF NOT EXISTS idx_threads_is_pinned ON threads(is_pinned);
CREATE INDEX IF NOT EXISTS idx_thread_comments_thread_id ON thread_comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_bookmarks_user_id ON thread_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_thread_tags_thread_id ON thread_tags(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_tags_tag_id ON thread_tags(tag_id);

-- 기존 데이터의 댓글 수 업데이트
UPDATE threads 
SET comment_count = (
  SELECT COUNT(*) 
  FROM thread_comments 
  WHERE thread_comments.thread_id = threads.id
);

-- 트리거 함수: 댓글 추가/삭제 시 댓글 수 자동 업데이트
CREATE OR REPLACE FUNCTION update_thread_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE threads 
    SET comment_count = comment_count + 1 
    WHERE id = NEW.thread_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE threads 
    SET comment_count = comment_count - 1 
    WHERE id = OLD.thread_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_comment_count ON thread_comments;
CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR DELETE ON thread_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_comment_count(); 