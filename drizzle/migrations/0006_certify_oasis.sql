-- Add billing/certification metadata to episodes
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS actual_end DATE;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS fbv_accrual DATE;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS final_bill DATE;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS held BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS pep BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS hipps_flag BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS medicaid BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS doc_status TEXT NOT NULL DEFAULT 'docs_not_rcvd';
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS admit_number TEXT;

-- OASIS assessments (one per certification period, sometimes more for corrections)
CREATE TABLE IF NOT EXISTS oasis_assessments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  episode_id INTEGER REFERENCES episodes(id),
  completed_by_id INTEGER REFERENCES users(id),
  assess_date DATE NOT NULL,
  rfa_code INTEGER NOT NULL DEFAULT 4,
  assessment_reason TEXT NOT NULL DEFAULT 'OASIS v3-E RFA 4 Followup',
  hipps_code TEXT,
  hhrg_code TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  export_file_name TEXT,
  exported_at TIMESTAMP,
  iqies_submission_id TEXT,
  iqies_asmt_id TEXT,
  correction_num INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Link MD orders to certification episodes; add 485-specific fields
ALTER TABLE md_orders ADD COLUMN IF NOT EXISTS episode_id INTEGER REFERENCES episodes(id);
ALTER TABLE md_orders ADD COLUMN IF NOT EXISTS document_type TEXT NOT NULL DEFAULT '485';
ALTER TABLE md_orders ADD COLUMN IF NOT EXISTS printed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE md_orders ADD COLUMN IF NOT EXISTS physician_id INTEGER REFERENCES physicians(id);
