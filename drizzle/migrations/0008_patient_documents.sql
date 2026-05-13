CREATE TABLE IF NOT EXISTS patient_documents (
  id            SERIAL PRIMARY KEY,
  patient_id    INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  episode_id    INTEGER REFERENCES episodes(id) ON DELETE SET NULL,
  category      TEXT NOT NULL DEFAULT 'NonCategory',
  display_name  TEXT NOT NULL,
  file_name     TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type     TEXT NOT NULL,
  file_size     INTEGER NOT NULL DEFAULT 0,
  doc_date      DATE NOT NULL,
  uploaded_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id ON patient_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_episode_id ON patient_documents(episode_id);
