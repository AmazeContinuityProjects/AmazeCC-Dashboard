CREATE TABLE IF NOT EXISTS class_user_hashes (class_id TEXT, user_hash TEXT, last_updated_at BIGINT, PRIMARY KEY (class_id, user_hash));
TRUNCATE TABLE class_overall_stats;
TRUNCATE TABLE class_assessment_stats;
ALTER TABLE papers_archive ADD COLUMN IF NOT EXISTS exam_semester TEXT;
ALTER TABLE qbank_questions ADD COLUMN IF NOT EXISTS topic_name TEXT;
ALTER TABLE papers_archive ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE papers_archive ADD COLUMN IF NOT EXISTS storage_provider TEXT DEFAULT 'R2';
ALTER TABLE papers_archive ALTER COLUMN source_type SET DEFAULT 'UPLOAD';
ALTER TABLE papers_archive ADD COLUMN IF NOT EXISTS source_url TEXT;