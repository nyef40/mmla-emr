-- Seed the 5 roles
INSERT INTO roles (name, description) VALUES
  ('super_admin', 'Full system access - owner/IT'),
  ('admin',       'Administrative access - office manager'),
  ('rn',          'Registered Nurse - clinical staff'),
  ('pt',          'Physical Therapist - clinical staff'),
  ('billing_admin','Billing and payroll access');

-- Seed permissions based on the RBAC matrix from the architecture doc
-- super_admin: full access to everything
INSERT INTO permissions (role_id, module, action, scope)
SELECT r.id, m.module, a.action, 'all'
FROM roles r
CROSS JOIN (VALUES
  ('user_mgmt'), ('patient_list'), ('patient_chart'), ('mar'),
  ('scheduling'), ('forms'), ('billing'), ('reports'),
  ('libraries'), ('payroll'), ('audit_log')
) AS m(module)
CROSS JOIN (VALUES ('create'), ('read'), ('update'), ('delete')) AS a(action)
WHERE r.name = 'super_admin';

-- admin: user_mgmt (create, read), patient_list/chart/scheduling/forms (all), mar (read), reports (all), libraries (CRUD)
INSERT INTO permissions (role_id, module, action, scope)
SELECT r.id, p.module, p.action, p.scope
FROM roles r
CROSS JOIN (VALUES
  ('user_mgmt',      'create', 'all'),
  ('user_mgmt',      'read',   'all'),
  ('patient_list',   'create', 'all'),
  ('patient_list',   'read',   'all'),
  ('patient_list',   'update', 'all'),
  ('patient_list',   'delete', 'all'),
  ('patient_chart',  'create', 'all'),
  ('patient_chart',  'read',   'all'),
  ('patient_chart',  'update', 'all'),
  ('patient_chart',  'delete', 'all'),
  ('mar',            'read',   'all'),
  ('scheduling',     'create', 'all'),
  ('scheduling',     'read',   'all'),
  ('scheduling',     'update', 'all'),
  ('scheduling',     'delete', 'all'),
  ('forms',          'create', 'all'),
  ('forms',          'read',   'all'),
  ('forms',          'update', 'all'),
  ('forms',          'delete', 'all'),
  ('reports',        'create', 'all'),
  ('reports',        'read',   'all'),
  ('reports',        'update', 'all'),
  ('reports',        'delete', 'all'),
  ('libraries',      'create', 'all'),
  ('libraries',      'read',   'all'),
  ('libraries',      'update', 'all'),
  ('libraries',      'delete', 'all'),
  ('payroll',        'read',   'all')
) AS p(module, action, scope)
WHERE r.name = 'admin';

-- rn: patient_list/chart/scheduling/forms (own), mar (read+edit own), reports (own), libraries (read)
INSERT INTO permissions (role_id, module, action, scope)
SELECT r.id, p.module, p.action, p.scope
FROM roles r
CROSS JOIN (VALUES
  ('patient_list',   'read',   'own'),
  ('patient_list',   'update', 'own'),
  ('patient_chart',  'read',   'own'),
  ('patient_chart',  'update', 'own'),
  ('patient_chart',  'create', 'own'),
  ('mar',            'read',   'own'),
  ('mar',            'update', 'own'),
  ('mar',            'create', 'own'),
  ('scheduling',     'read',   'own'),
  ('scheduling',     'update', 'own'),
  ('forms',          'read',   'own'),
  ('forms',          'create', 'own'),
  ('forms',          'update', 'own'),
  ('reports',        'read',   'own'),
  ('libraries',      'read',   'all')
) AS p(module, action, scope)
WHERE r.name = 'rn';

-- pt: same as rn except no MAR access
INSERT INTO permissions (role_id, module, action, scope)
SELECT r.id, p.module, p.action, p.scope
FROM roles r
CROSS JOIN (VALUES
  ('patient_list',   'read',   'own'),
  ('patient_list',   'update', 'own'),
  ('patient_chart',  'read',   'own'),
  ('patient_chart',  'update', 'own'),
  ('patient_chart',  'create', 'own'),
  ('scheduling',     'read',   'own'),
  ('scheduling',     'update', 'own'),
  ('forms',          'read',   'own'),
  ('forms',          'create', 'own'),
  ('forms',          'update', 'own'),
  ('reports',        'read',   'own'),
  ('libraries',      'read',   'all')
) AS p(module, action, scope)
WHERE r.name = 'pt';

-- billing_admin: patient_list (read), billing/payroll (CRUD), reports (billing_only), libraries (read)
INSERT INTO permissions (role_id, module, action, scope)
SELECT r.id, p.module, p.action, p.scope
FROM roles r
CROSS JOIN (VALUES
  ('patient_list',   'read',   'all'),
  ('billing',        'create', 'all'),
  ('billing',        'read',   'all'),
  ('billing',        'update', 'all'),
  ('billing',        'delete', 'all'),
  ('payroll',        'create', 'all'),
  ('payroll',        'read',   'all'),
  ('payroll',        'update', 'all'),
  ('payroll',        'delete', 'all'),
  ('reports',        'read',   'billing_only'),
  ('libraries',      'read',   'all')
) AS p(module, action, scope)
WHERE r.name = 'billing_admin';