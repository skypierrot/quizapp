-- 공지게시판 테이블
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(200) NOT NULL,
  content text NOT NULL,
  author_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  is_pinned boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS notice_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id uuid NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  author_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

-- 자유게시판(스레드형)
CREATE TABLE IF NOT EXISTS threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(200) NOT NULL,
  content text NOT NULL,
  author_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  upvotes integer NOT NULL DEFAULT 0,
  downvotes integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS thread_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES thread_comments(id) ON DELETE CASCADE,
  author_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  upvotes integer NOT NULL DEFAULT 0,
  downvotes integer NOT NULL DEFAULT 0
); 