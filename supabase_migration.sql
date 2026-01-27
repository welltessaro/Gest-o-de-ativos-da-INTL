
-- ============================================================
-- SCRIPT DE MIGRACAO E CORRECAO - ASSETTRACK PRO
-- ============================================================

-- 1. Garante que a coluna 'employeeId' exista na tabela de usuários
-- Isso resolve erros de PGRST204 se o banco estiver desatualizado
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "employeeId" TEXT REFERENCES public.employees(id);

-- 2. Limpeza de políticas para garantir acesso correto (Anti-bloqueio RLS)
DO $$ 
DECLARE 
    t text;
    p record;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

        FOR p IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = t
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
        END LOOP;

        EXECUTE format('CREATE POLICY "System Access" ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;

-- 3. Recarrega o cache do PostgREST para reconhecer novas colunas
NOTIFY pgrst, 'reload schema';
