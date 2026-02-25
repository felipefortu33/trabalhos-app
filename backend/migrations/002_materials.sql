-- Migração: tabela de materiais de aula
CREATE TABLE IF NOT EXISTS materials (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(300) NOT NULL,
  description     TEXT DEFAULT '',
  subject         VARCHAR(200) NOT NULL,
  category        VARCHAR(100) NOT NULL DEFAULT 'geral',

  -- Arquivo
  original_filename VARCHAR(500) NOT NULL,
  stored_filename   VARCHAR(500) NOT NULL,
  file_path         TEXT NOT NULL,
  file_size         BIGINT NOT NULL DEFAULT 0,
  mime_type         VARCHAR(200) DEFAULT 'application/octet-stream',

  -- Timestamps
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_materials_subject    ON materials(subject);
CREATE INDEX IF NOT EXISTS idx_materials_category   ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_created_at ON materials(created_at DESC);
