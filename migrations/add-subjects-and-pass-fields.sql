-- 과목별 과락 판정 기능 개선을 위한 마이그레이션

-- 1. questions 테이블에 과목 관련 필드 추가
-- 과목 필드 기본값 설정 및 추가 필드 생성
ALTER TABLE questions 
  ALTER COLUMN exam_subject SET DEFAULT '미지정',
  ADD COLUMN IF NOT EXISTS subject_category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS subject_subcategory VARCHAR(100);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS questions_exam_subject_idx ON questions(exam_subject);
CREATE INDEX IF NOT EXISTS questions_subject_category_idx ON questions(subject_category);

-- 2. exam_results 테이블에 과락 관련 필드 추가
ALTER TABLE exam_results
  ADD COLUMN IF NOT EXISTS is_passed BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS fail_reasons JSONB DEFAULT '[]'::jsonb;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS is_passed_idx ON exam_results(is_passed);

-- 3. 기존 과목 정보 업데이트 (미지정 과목 처리)
UPDATE questions
SET exam_subject = '미지정'
WHERE exam_subject IS NULL OR exam_subject = '';

-- 4. 기존 시험 결과 과락 판정 업데이트
UPDATE exam_results
SET is_passed = (score >= 60)
WHERE is_passed IS NULL;

-- 5. 기존 시험 결과의 과목별 점수 업데이트 (과목별 점수와 과락 여부 계산)
UPDATE exam_results
SET 
  subject_stats = jsonb_object_agg(
    key, 
    (value::jsonb || 
     jsonb_build_object(
       'score', 
       CASE WHEN (value->>'total')::int > 0 
         THEN ROUND(((value->>'correct')::int::float / (value->>'total')::int::float) * 100) 
         ELSE 0 
       END,
       'isPassed', 
       CASE WHEN (value->>'total')::int > 0 
         THEN (ROUND(((value->>'correct')::int::float / (value->>'total')::int::float) * 100) >= 60)
         ELSE TRUE
       END
     )
    )::jsonb
  )
FROM (
  SELECT id, jsonb_each(subject_stats) AS stats
  FROM exam_results
) AS s
WHERE exam_results.id = s.id;

-- 6. 과락 정보를 각 시험 결과에 저장
WITH fail_reasons_data AS (
  SELECT 
    er.id,
    CASE
      WHEN er.score < 60 THEN jsonb_build_array('총점 미달')
      WHEN (
        SELECT bool_or(
          CASE 
            WHEN (subj_stats.value->>'total')::int > 0 
            THEN (ROUND(((subj_stats.value->>'correct')::int::float / (subj_stats.value->>'total')::int::float) * 100) < 60)
            ELSE FALSE
          END
        )
        FROM jsonb_each(er.subject_stats) AS subj_stats
      ) THEN
        jsonb_build_array(
          '과목 과락: ' || (
            SELECT string_agg(key, ', ')
            FROM jsonb_each(er.subject_stats) AS subjects
            WHERE 
              (subjects.value->>'total')::int > 0 AND
              ROUND(((subjects.value->>'correct')::int::float / (subjects.value->>'total')::int::float) * 100) < 60
          )
        )
      ELSE jsonb_build_array()
    END AS reasons
  FROM exam_results er
)
UPDATE exam_results er
SET 
  fail_reasons = frd.reasons,
  is_passed = CASE
    WHEN er.score < 60 THEN FALSE
    WHEN jsonb_array_length(frd.reasons) > 0 THEN FALSE
    ELSE TRUE
  END
FROM fail_reasons_data frd
WHERE er.id = frd.id;

-- 7. 과목 관련 정보를 위한 인덱스 재생성
REINDEX INDEX questions_exam_subject_idx;
REINDEX INDEX questions_subject_category_idx;
REINDEX INDEX is_passed_idx; 