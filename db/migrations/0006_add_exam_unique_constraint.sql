-- 유니크 제약조건 추가: (name, date, subject) 조합
ALTER TABLE exams
ADD CONSTRAINT unique_exam UNIQUE (name, date, subject);
