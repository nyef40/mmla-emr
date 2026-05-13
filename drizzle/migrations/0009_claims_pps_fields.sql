-- PPS / PDGM calculation fields on claims
ALTER TABLE claims
  ADD COLUMN IF NOT EXISTS case_weight        NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS wage_index         NUMERIC(10, 6),
  ADD COLUMN IF NOT EXISTS cbsa_code          TEXT,
  ADD COLUMN IF NOT EXISTS eep_amount         NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS outlier_amount     NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS sequester_amount   NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS final_posted       NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS pps_notes          TEXT;
