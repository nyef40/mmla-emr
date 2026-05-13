ALTER TABLE billing_codes ADD COLUMN IF NOT EXISTS rate numeric(10, 2);
ALTER TABLE billing_codes ADD COLUMN IF NOT EXISTS rate_type text;

UPDATE billing_codes SET rate = 350.00, rate_type = 'per_hour' WHERE code = '99601';
UPDATE billing_codes SET rate = 300.00, rate_type = 'per_hour' WHERE code = '99602';
UPDATE billing_codes SET code = 'G0299', description = 'SN IV High Tech Visit',  rate = 200.00,  rate_type = 'per_hour' WHERE code = 'IV-IG';
UPDATE billing_codes SET rate = 1100.00, rate_type = 'per_hour' WHERE code = 'G0069';
UPDATE billing_codes SET description = 'Init-Adm-SC-infusion-home, per hour', rate = 1300.00, rate_type = 'per_hour' WHERE code = 'G0089';

INSERT INTO billing_codes (code, description, rate, rate_type, display_order, is_active)
VALUES ('G0151', 'PT Visit', 400.00, 'per_visit', 6, true);
