-- 시험 결과가 추가될 때 통계 업데이트
CREATE OR REPLACE FUNCTION update_user_stats_on_exam()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (
    user_id,
    total_exams,
    total_questions,
    total_correct,
    average_score,
    subject_stats,
    last_exam_at
  )
  VALUES (
    NEW.user_id,
    1,
    NEW.total_questions,
    NEW.correct_count,
    NEW.score,
    NEW.subject_stats,
    NEW.created_at
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    total_exams = user_stats.total_exams + 1,
    total_questions = user_stats.total_questions + NEW.total_questions,
    total_correct = user_stats.total_correct + NEW.correct_count,
    average_score = (user_stats.average_score * user_stats.total_exams + NEW.score) / (user_stats.total_exams + 1),
    subject_stats = user_stats.subject_stats || NEW.subject_stats,
    last_exam_at = NEW.created_at,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_stats_on_exam
  AFTER INSERT ON exam_results
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_exam();

-- 게시글이 추가될 때 통계 업데이트
CREATE OR REPLACE FUNCTION update_user_stats_on_post()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (
    user_id,
    total_posts,
    last_post_at
  )
  VALUES (
    NEW.user_id,
    1,
    NEW.created_at
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    total_posts = user_stats.total_posts + 1,
    last_post_at = NEW.created_at,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_stats_on_post
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_post();

-- 댓글이 추가될 때 통계 업데이트
CREATE OR REPLACE FUNCTION update_user_stats_on_comment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (
    user_id,
    total_comments,
    last_comment_at
  )
  VALUES (
    NEW.user_id,
    1,
    NEW.created_at
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    total_comments = user_stats.total_comments + 1,
    last_comment_at = NEW.created_at,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_stats_on_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_comment(); 