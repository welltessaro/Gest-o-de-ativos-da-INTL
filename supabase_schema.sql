
-- ============================================================
-- ASSETTRACK PRO V2 - SCHEMA DEFINITIVO
-- ============================================================
-- Este script reseta e recria a estrutura para garantir integridade.
-- ATENÇÃO: Dados existentes podem ser perdidos se as tabelas forem recriadas.

-- 1. LIMPEZA (Opcional - Remove tabelas antigas para evitar conflitos de migração)
DROP TABLE IF EXISTS public.asset_type_configs CASCADE;
DROP TABLE IF EXISTS public.accounting_classifications CASCADE;
DROP TABLE IF EXISTS public.accounting_accounts CASCADE;
DROP TABLE IF EXISTS public.audit_sessions CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.requests CASCADE;
DROP TABLE IF EXISTS public.assets CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;

-- 2. DEPARTAMENTOS
CREATE TABLE public.departments (
    id TEXT PRIMARY KEY, 
    name TEXT NOT NULL, 
    "costCenter" TEXT, 
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COLABORADORES
CREATE TABLE public.employees (
    id TEXT PRIMARY KEY, 
    "departmentId" TEXT REFERENCES public.departments(id) ON DELETE SET NULL, 
    name TEXT NOT NULL, 
    sector TEXT, 
    role TEXT, 
    cpf TEXT, 
    "isActive" BOOLEAN DEFAULT TRUE
);

-- 4. USUÁRIOS (Agora com employeeId nativo)
CREATE TABLE public.users (
    id TEXT PRIMARY KEY, 
    name TEXT NOT NULL, 
    username TEXT UNIQUE NOT NULL,
    password TEXT DEFAULT 'admin',
    sector TEXT,
    modules TEXT[],
    "employeeId" TEXT REFERENCES public.employees(id) ON DELETE SET NULL
);

-- 5. ATIVOS (Com colunas financeiras e de tag nativas)
CREATE TABLE public.assets (
    id TEXT PRIMARY KEY, 
    "tagId" TEXT,
    "purchaseValue" NUMERIC DEFAULT 0,
    "departmentId" TEXT REFERENCES public.departments(id) ON DELETE SET NULL, 
    type TEXT NOT NULL, 
    brand TEXT, 
    model TEXT, 
    "serialNumber" TEXT,
    "processor" TEXT,
    "ram" TEXT,
    "storage" TEXT,
    "screenSize" TEXT,
    "caseModel" TEXT,
    "isWireless" BOOLEAN,
    "monitorInputs" TEXT[],
    "isAbnt" BOOLEAN,
    "hasNumericKeypad" BOOLEAN,
    status TEXT DEFAULT 'Disponível', 
    "assignedTo" TEXT REFERENCES public.employees(id) ON DELETE SET NULL, 
    "qrCode" TEXT, 
    observations TEXT, 
    photos TEXT[], 
    history JSONB DEFAULT '[]'::jsonb, 
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 6. REQUISIÇÕES
CREATE TABLE public.requests (
    id TEXT PRIMARY KEY, 
    "requesterId" TEXT, 
    "employeeId" TEXT REFERENCES public.employees(id) ON DELETE SET NULL, 
    items TEXT[], 
    "itemFulfillments" JSONB DEFAULT '[]'::jsonb, 
    observation TEXT, 
    status TEXT DEFAULT 'Pendente', 
    type TEXT DEFAULT 'Padrao', 
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 7. NOTIFICAÇÕES
CREATE TABLE public.notifications (
    id TEXT PRIMARY KEY, 
    title TEXT, 
    message TEXT, 
    type TEXT, 
    "targetModule" TEXT, 
    "isRead" BOOLEAN DEFAULT FALSE, 
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AUDITORIAS
CREATE TABLE public.audit_sessions (
    id TEXT PRIMARY KEY, 
    sector TEXT, 
    entries JSONB DEFAULT '[]'::jsonb, 
    "isFinished" BOOLEAN DEFAULT FALSE, 
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MÓDULO CONTÁBIL
CREATE TABLE public.accounting_accounts (
    id TEXT PRIMARY KEY, 
    code TEXT NOT NULL, 
    name TEXT NOT NULL
);

CREATE TABLE public.accounting_classifications (
    id TEXT PRIMARY KEY, 
    name TEXT NOT NULL, 
    code TEXT NOT NULL, 
    "accountId" TEXT REFERENCES public.accounting_accounts(id) ON DELETE CASCADE
);

CREATE TABLE public.asset_type_configs (
    id TEXT PRIMARY KEY, 
    name TEXT NOT NULL, 
    "classificationId" TEXT REFERENCES public.accounting_classifications(id) ON DELETE SET NULL
);

-- ============================================================
-- SEGURANÇA (RLS - Row Level Security)
-- ============================================================

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_type_configs ENABLE ROW LEVEL SECURITY;

-- Política de Acesso Total (Para protótipo interno)
CREATE POLICY "Acesso Total" ON public.departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total" ON public.assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total" ON public.requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total" ON public.audit_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total" ON public.accounting_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total" ON public.accounting_classifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total" ON public.asset_type_configs FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- DADOS INICIAIS (SEED)
-- ============================================================

-- Usuário Admin Padrão (Com system-info incluído)
INSERT INTO public.users (id, name, username, password, sector, modules)
VALUES (
    'admin-master-01', 
    'Administrador Master', 
    'admin', 
    'admin', 
    'Tecnologia', 
    ARRAY[
        'dashboard',
        'departments',
        'assets',
        'maintenance',
        'employees',
        'requests',
        'purchase-orders',
        'printing',
        'user-management',
        'inventory-check',
        'accounting',
        'system-info'
    ]
)
ON CONFLICT (username) DO UPDATE 
SET modules = EXCLUDED.modules;
