-- Add status column to reports table
ALTER TABLE reports ADD COLUMN status TEXT DEFAULT 'draft';

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Update existing records to 'draft' status
UPDATE reports SET status = 'draft' WHERE status IS NULL;
