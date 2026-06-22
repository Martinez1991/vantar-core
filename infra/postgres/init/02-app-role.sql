-- Role da aplicação (não-superuser) para que o Row-Level Security realmente se
-- aplique (RS-IAM-006). O runtime conecta como vantar_app; migrate/seed seguem
-- como o superuser vantar (que ignora RLS — necessário para semear).
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'vantar_app') THEN
    CREATE ROLE vantar_app LOGIN PASSWORD 'vantar_app' NOSUPERUSER NOBYPASSRLS;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO vantar_app;

-- Privilégios sobre os objetos criados a seguir (migrations rodam como vantar).
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO vantar_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO vantar_app;
