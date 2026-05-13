-- Expand insurance/payer library with billing and EDI configuration fields

-- Core billing identity
ALTER TABLE insurances ADD COLUMN IF NOT EXISTS bill_type          TEXT NOT NULL DEFAULT 'UB04';
ALTER TABLE insurances ADD COLUMN IF NOT EXISTS insurance_type     TEXT;
ALTER TABLE insurances ADD COLUMN IF NOT EXISTS financial_class    TEXT;
ALTER TABLE insurances ADD COLUMN IF NOT EXISTS payor_submitter_id TEXT;
ALTER TABLE insurances ADD COLUMN IF NOT EXISTS provider_number    TEXT;
ALTER TABLE insurances ADD COLUMN IF NOT EXISTS payor_type         TEXT;

-- Billing behavior
ALTER TABLE insurances ADD COLUMN IF NOT EXISTS bill_method        TEXT NOT NULL DEFAULT 'Normal';
ALTER TABLE insurances ADD COLUMN IF NOT EXISTS pps_billing        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE insurances ADD COLUMN IF NOT EXISTS ew_required        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE insurances ADD COLUMN IF NOT EXISTS timely_filing_days INTEGER;

-- Billing requirements (in addition to existing auth_required)
ALTER TABLE insurances ADD COLUMN IF NOT EXISTS requires_plan_of_care BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE insurances ADD COLUMN IF NOT EXISTS requires_hipps_code   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE insurances ADD COLUMN IF NOT EXISTS vbp_pps_adjust        BOOLEAN NOT NULL DEFAULT FALSE;

-- EDI / 837i configuration (replaces hardcoded PAYERS constant per insurance record)
ALTER TABLE insurances ADD COLUMN IF NOT EXISTS edi_receiver_id        TEXT;
ALTER TABLE insurances ADD COLUMN IF NOT EXISTS edi_receiver_qualifier TEXT DEFAULT 'ZZ';
ALTER TABLE insurances ADD COLUMN IF NOT EXISTS edi_receiver_name      TEXT;
ALTER TABLE insurances ADD COLUMN IF NOT EXISTS sbr_payor_qualifier    TEXT;

-- Seed well-known Medicare values on existing Medicare records
UPDATE insurances
SET
  bill_type             = 'UB04',
  insurance_type        = 'MedicareRevType',
  financial_class       = 'MedicareClass',
  payor_submitter_id    = '06014',
  payor_type            = '1-Medicare',
  bill_method           = 'Normal',
  pps_billing           = TRUE,
  edi_receiver_qualifier = 'ZZ',
  edi_receiver_id       = '06014',
  edi_receiver_name     = 'MEDICARE',
  sbr_payor_qualifier   = 'MA'
WHERE category IN ('Medicare', 'MedicareAdvantagePFFS', 'MedicareAdvantagePPOHMO', 'MedicareEpisodic');
