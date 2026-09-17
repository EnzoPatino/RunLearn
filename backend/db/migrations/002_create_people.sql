CREATE TABLE IF NOT EXISTS people (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  rol VARCHAR(50) NOT NULL DEFAULT 'estudiante',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_people_email ON people (email);

INSERT INTO people (nombre, email, rol)
VALUES 
  ('Enzo Patiño', 'enzo@runlearn.dev', 'profesor'),
  ('Camila Rodríguez', 'camila@runlearn.dev', 'estudiante'),
  ('Mateo Gómez', 'mateo@runlearn.dev', 'estudiante')
ON CONFLICT (email) DO NOTHING;
