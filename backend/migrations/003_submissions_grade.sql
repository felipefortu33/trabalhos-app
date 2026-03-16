-- Migração: adiciona nota ao envio do aluno
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS grade NUMERIC(4,2);

-- Garantia de faixa de nota (0 a 10)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'submissions_grade_range'
  ) THEN
    ALTER TABLE submissions
      ADD CONSTRAINT submissions_grade_range CHECK (grade IS NULL OR (grade >= 0 AND grade <= 10));
  END IF;
END $$;
