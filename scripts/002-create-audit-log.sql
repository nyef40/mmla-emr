-- Create audit_log table (HIPAA requirement)
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,          -- 'view', 'create', 'update', 'delete', 'login', 'logout', 'failed_login'
  table_name TEXT,               -- which table was accessed
  record_id INTEGER,             -- which record was accessed
  old_data JSONB,                -- previous state (for updates/deletes)
  new_data JSONB,                -- new state (for creates/updates)
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for audit queries
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);