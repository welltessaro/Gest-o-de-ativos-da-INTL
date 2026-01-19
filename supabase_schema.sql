
-- ============================================================
-- SCRIPT DE CORREÇÃO E ATIVAÇÃO DE RLS - ASSETTRACK PRO
-- ============================================================

-- 1. Garantir que as Tabelas existam
CREATE TABLE IF NOT EXISTS public.departments (id TEXT PRIMARY KEY, name TEXT NOT NULL, "costCenter" TEXT, "createdAt" TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.employees (id TEXT PRIMARY KEY, "departmentId" TEXT REFERENCES public.departments(id), name TEXT NOT NULL, sector TEXT, role TEXT, cpf TEXT, "isActive" BOOLEAN DEFAULT TRUE);
CREATE TABLE IF NOT EXISTS public.assets (id TEXT PRIMARY KEY, "departmentId" TEXT REFERENCES public.departments(id), type TEXT NOT NULL, brand TEXT, model TEXT, status TEXT DEFAULT 'Disponível', "assignedTo" TEXT REFERENCES public.employees(id), "qrCode" TEXT, observations TEXT, photos TEXT[], history JSONB DEFAULT '[]'::jsonb, "createdAt" TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.requests (id TEXT PRIMARY KEY, "requesterId" TEXT, "employeeId" TEXT REFERENCES public.employees(id), items TEXT[], "itemFulfillments" JSONB DEFAULT '[]'::jsonb, observation TEXT, status TEXT DEFAULT 'Pendente', "createdAt" TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.users (id TEXT PRIMARY KEY, name TEXT NOT NULL, username TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS public.notifications (id TEXT PRIMARY KEY, title TEXT, message TEXT, type TEXT, "targetModule" TEXT, "isRead" BOOLEAN DEFAULT FALSE, "createdAt" TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.audit_sessions (id TEXT PRIMARY KEY, sector TEXT, entries JSONB DEFAULT '[]'::jsonb, "isFinished" BOOLEAN DEFAULT FALSE, "createdAt" TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.accounting_accounts (id TEXT PRIMARY KEY, code TEXT NOT NULL, name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS public.accounting_classifications (id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL, "accountId" TEXT REFERENCES public.accounting_accounts(id));
CREATE TABLE IF NOT EXISTS public.asset_type_configs (id TEXT PRIMARY KEY, name TEXT NOT NULL, "classificationId" TEXT REFERENCES public.accounting_classifications(id));

-- 2. Corrigir colunas faltantes na tabela users (Causa do erro relatado)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS sector TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS modules TEXT[];

-- 3. Habilitar RLS em todas as tabelas
DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- 4. Criar Políticas de Acesso Público (Permitir CRUD via Anonymous Key)
DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public Access" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Public Access" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;

-- 5. Inserir ou atualizar Usuário Administrador
-- Nota: O campo modules é inserido como um array de texto.
INSERT INTO public.users (id, name, username, password, sector, modules)
VALUES (
    'admin-init-id', 
    'Administrador Master', 
    'admin', 
    'admin', 
    'TI', 
    ARRAY['dashboard','departments','assets','maintenance','employees','requests','purchase-orders','printing','user-management','inventory-check','accounting']
)
ON CONFLICT (username) DO UPDATE 
SET modules = EXCLUDED.modules, 
    password = EXCLUDED.password;
