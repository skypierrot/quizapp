-- 기존 시험 결과 데이터를 통계 테이블로 마이그레이션
INSERT INTO user_stats (
  user_id,
  total_exams,
  total_questions,
  total_correct,
  average_score,
  subject_stats,
  last_exam_at
)
SELECT
  user_id,
  COUNT(*) as total_exams,
  SUM(total_questions) as total_questions,
  SUM(correct_count) as total_correct,
  ROUND(AVG(score)) as average_score,
  jsonb_object_agg(
    subject,
    jsonb_build_object(
      'total_questions', SUM(total_questions),
      'total_correct', SUM(correct_count)
    )
  ) as subject_stats,
  MAX(created_at) as last_exam_at
FROM exam_results
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE
SET
  total_exams = EXCLUDED.total_exams,
  total_questions = EXCLUDED.total_questions,
  total_correct = EXCLUDED.total_correct,
  average_score = EXCLUDED.average_score,
  subject_stats = EXCLUDED.subject_stats,
  last_exam_at = EXCLUDED.last_exam_at,
  updated_at = NOW();

-- 기존 게시글 데이터를 통계 테이블로 마이그레이션
UPDATE user_stats us
SET
  total_posts = (
    SELECT COUNT(*)
    FROM posts p
    WHERE p.user_id = us.user_id
  ),
  last_post_at = (
    SELECT MAX(created_at)
    FROM posts p
    WHERE p.user_id = us.user_id
  ),
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1
  FROM posts p
  WHERE p.user_id = us.user_id
);

-- 기존 댓글 데이터를 통계 테이블로 마이그레이션
UPDATE user_stats us
SET
  total_comments = (
    SELECT COUNT(*)
    FROM comments c
    WHERE c.user_id = us.user_id
  ),
  last_comment_at = (
    SELECT MAX(created_at)
    FROM comments c
    WHERE c.user_id = us.user_id
  ),
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1
  FROM comments c
  WHERE c.user_id = us.user_id
); 