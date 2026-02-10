-- Migration: Add 'confirmed' status to reports table
-- Date: 2026-02-10
-- Description: Extend status column to support 3-stage workflow (draft -> confirmed -> completed)
-- Note: SQLite doesn't support DROP CONSTRAINT, so we recreate the table

-- Create new table with updated CHECK constraint
CREATE TABLE reports_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id TEXT UNIQUE NOT NULL,
  customer_info TEXT,
  packages TEXT,
  package_positions TEXT,
  install_date TEXT,
  install_time TEXT,
  install_address TEXT,
  notes TEXT,
  installer_name TEXT,
  image_key TEXT,
  image_filename TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'confirmed', 'completed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy data from old table
INSERT INTO reports_new 
SELECT * FROM reports;

-- Drop old table
DROP TABLE reports;

-- Rename new table
ALTER TABLE reports_new RENAME TO reports;
