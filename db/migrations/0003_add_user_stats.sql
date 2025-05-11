-- Add subject_stats column to exam_results
ALTER TABLE exam_results
ADD COLUMN IF NOT EXISTS subject_stats JSONB NOT NULL DEFAULT '{}';

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id),
    
    -- Exam statistics
    total_exams INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    total_correct INTEGER NOT NULL DEFAULT 0,
    average_score INTEGER NOT NULL DEFAULT 0,
    
    -- Subject statistics
    subject_stats JSONB NOT NULL DEFAULT '{}',
    
    -- Post/Comment statistics
    total_posts INTEGER NOT NULL DEFAULT 0,
    total_comments INTEGER NOT NULL DEFAULT 0,
    
    -- Last activity timestamps
    last_exam_at TIMESTAMPTZ,
    last_post_at TIMESTAMPTZ,
    last_comment_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS user_stats_user_id_idx ON user_stats(user_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_stats_updated_at
    BEFORE UPDATE ON user_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 