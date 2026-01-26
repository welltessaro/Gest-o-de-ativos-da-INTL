
-- ============================================================
-- SCRIPT COMPLETO DE ESTRUTURA - ASSETTRACK PRO V2
-- ============================================================

-- 1. Departamentos
CREATE TABLE IF NOT EXISTS public.departments (
    id TEXT PRIMARY KEY, 
    name TEXT NOT NULL, 
    "costCenter" TEXT, 
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Colaboradores
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY, 
    "departmentId" TEXT REFERENCES public.departments(id), 
    name TEXT NOT NULL, 
    sector TEXT, 
    role TEXT, 
    cpf TEXT, 
    "isActive" BOOLEAN DEFAULT TRUE
);

-- 3. Ativos (Incluindo tagId e purchaseValue nativos)
CREATE TABLE IF NOT EXISTS public.assets (
    id TEXT PRIMARY KEY, 
    "tagId" TEXT,
    "purchaseValue" NUMERIC DEFAULT 0,
    "departmentId" TEXT REFERENCES public.departments(id), 
    type TEXT NOT NULL, 
    brand TEXT, 
    model TEXT, 
    status TEXT DEFAULT 'Disponível', 
    "assignedTo" TEXT REFERENCES public.employees(id), 
    "qrCode" TEXT, 
    observations TEXT, 
    photos TEXT[], 
    history JSONB DEFAULT '[]'::jsonb, 
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Requisições (Adicionado campo type para Diferenças)
CREATE TABLE IF NOT EXISTS public.requests (
    id TEXT PRIMARY KEY, 
    "requesterId" TEXT, 
    "employeeId" TEXT REFERENCES public.employees(id), 
    items TEXT[], 
    "itemFulfillments" JSONB DEFAULT '[]'::jsonb, 
    observation TEXT, 
    status TEXT DEFAULT 'Pendente', 
    type TEXT DEFAULT 'Padrao',
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Usuários (Estrutura completa com employeeId nativo)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY, 
    name TEXT NOT NULL, 
    username TEXT UNIQUE NOT NULL,
    password TEXT DEFAULT 'admin',
    sector TEXT,
    modules TEXT[],
    "employeeId" TEXT REFERENCES public.employees(id)
);

-- 6. Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY, 
    title TEXT, 
    message TEXT, 
    type TEXT, 
    "targetModule" TEXT, 
    "isRead" BOOLEAN DEFAULT FALSE, 
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Auditorias (Check Semestral)
CREATE TABLE IF NOT EXISTS public.audit_sessions (
    id TEXT PRIMARY KEY, 
    sector TEXT, 
    entries JSONB DEFAULT '[]'::jsonb, 
    "isFinished" BOOLEAN DEFAULT FALSE, 
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Contabilidade e Configurações
CREATE TABLE IF NOT EXISTS public.accounting_accounts (
    id TEXT PRIMARY KEY, 
    code TEXT NOT NULL, 
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.accounting_classifications (
    id TEXT PRIMARY KEY, 
    name TEXT NOT NULL, 
    code TEXT NOT NULL, 
    "accountId" TEXT REFERENCES public.accounting_accounts(id)
);

CREATE TABLE IF NOT EXISTS public.asset_type_configs (
    id TEXT PRIMARY KEY, 
    name TEXT NOT NULL, 
    "classificationId" TEXT REFERENCES public.accounting_classifications(id)
);

-- ============================================================
-- SEGURANÇA E POLÍTICAS RLS
-- ============================================================

DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Public Access" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Public Access" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;

-- Usuário Admin Inicial (Garante que sempre exista acesso)
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
