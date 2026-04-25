-- Update users table: change role enum values
-- First update existing user(s)
UPDATE users SET role = 'super_admin' WHERE role = 'admin';
UPDATE users SET role = 'rn' WHERE role = 'nurse';
UPDATE users SET role = 'pt' WHERE role = 'doctor';
-- 'staff' stays as-is but we'll remove it since it's not in the new model;
-- if any staff users exist, map them to 'admin' or handle individually
-- UPDATE users SET role = 'admin' WHERE role = 'staff';

-- Add ip_address column to sessions table
-- ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ip_address TEXT;
-- ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- used 'npm run db:push' to apply these changes
-- 'IF NOT EXISTS' is a problem in 'postgres'

-- The 'accounts' and 'verification_tokens' tables remain for now but won't be used.
-- They can be dropped later once you confirm NextAuth is fully removed.