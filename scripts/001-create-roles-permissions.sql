-- Create roles table
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create permissions table
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  module TEXT NOT NULL,       -- e.g. 'user_mgmt', 'patient_list', 'patient_chart', 'mar', 'scheduling', 'forms', 'billing', 'reports', 'libraries', 'payroll', 'audit_log'
  action TEXT NOT NULL,       -- e.g. 'create', 'read', 'update', 'delete', 'view', 'edit'
  scope TEXT NOT NULL,        -- 'all', 'own', 'billing_only', 'none'
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(role_id, module, action)
);

-- Create indexes
CREATE INDEX idx_permissions_role_id ON permissions(role_id);
CREATE INDEX idx_permissions_module ON permissions(module);