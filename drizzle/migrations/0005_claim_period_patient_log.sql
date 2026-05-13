-- Link charges to their posted claim
ALTER TABLE charges ADD COLUMN IF NOT EXISTS claim_id INTEGER REFERENCES claims(id);

-- Store the billed amount per charge (may differ from rate × time)
ALTER TABLE charges ADD COLUMN IF NOT EXISTS billed_amount NUMERIC(10, 2);

-- Billing period, ICN (from 277CA), type-of-bill, HIPPS on claims
ALTER TABLE claims ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS icn TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS tob_code TEXT DEFAULT '329';
ALTER TABLE claims ADD COLUMN IF NOT EXISTS hipps_code TEXT;

-- Revenue code for each billing code (used in 837i SV2 segments)
ALTER TABLE billing_codes ADD COLUMN IF NOT EXISTS rev_code TEXT;
UPDATE billing_codes SET rev_code = '0552' WHERE code IN ('G0299', 'G0069', 'G0089');
UPDATE billing_codes SET rev_code = '0551' WHERE code IN ('G0493', 'G0151', '99601', '99602');

-- Separate city/state/zip on patients (needed for 837i N4 segment)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS zip TEXT;

-- Per-patient billing event log (submissions, ICN, payments, OASIS exports)
CREATE TABLE IF NOT EXISTS patient_logs (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
