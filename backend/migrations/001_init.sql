-- Migração inicial: tabela de submissions
CREATE TABLE IF NOT EXISTS submissions (
  id            SERIAL PRIMARY KEY,
  student_name  VARCHAR(200) NOT NULL,
  student_ra    VARCHAR(50)  NOT NULL,
  subject       VARCHAR(200) NOT NULL,
  title         VARCHAR(300) NOT NULL,
  notes         TEXT DEFAULT '',
  
  -- Arquivo
  original_filename VARCHAR(500) NOT NULL,
  stored_filename   VARCHAR(500) NOT NULL,
  file_path         TEXT NOT NULL,
  file_size         BIGINT NOT NULL DEFAULT 0,
  mime_type         VARCHAR(200) DEFAULT 'application/octet-stream',
  
  -- Status / Feedback
  status        VARCHAR(30) NOT NULL DEFAULT 'recebido',
  feedback      TEXT DEFAULT '',
  
  -- Timestamps
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para buscas e filtros
CREATE INDEX IF NOT EXISTS idx_submissions_subject    ON submissions(subject);
CREATE INDEX IF NOT EXISTS idx_submissions_student_ra ON submissions(student_ra);
CREATE INDEX IF NOT EXISTS idx_submissions_status     ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
