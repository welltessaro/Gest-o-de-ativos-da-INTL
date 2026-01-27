
-- ============================================================
-- ASSETTRACK PRO - MASTER SCHEMA DEFINITION (V3.0)
-- Execute este script no SQL Editor do Supabase para resetar/corrigir o banco
-- ============================================================

-- 1. LIMPEZA TOTAL (Opcional: Descomente se quiser limpar tudo antes de criar)
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;

-- 2. CRIAÇÃO DAS TABELAS

-- Departamentos
CREATE TABLE IF NOT EXISTS public.departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "costCenter" TEXT,
    "createdAt" TEXT
);

-- Colaboradores
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY,
    "departmentId" TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    sector TEXT,
    role TEXT,
    cpf TEXT,
    "isActive" BOOLEAN DEFAULT TRUE
);

-- Contas Contábeis (Estrutura Unificada)
CREATE TABLE IF NOT EXISTS public.accounting_accounts (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    "type" TEXT DEFAULT 'Ativo', -- Ativo, Despesa, Custo...
    "depreciates" BOOLEAN DEFAULT TRUE,
    "costCenter" TEXT
);

-- Tipos de Ativo (Mapeamento)
CREATE TABLE IF NOT EXISTS public.asset_type_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "accountId" TEXT REFERENCES public.accounting_accounts(id) ON DELETE SET NULL
);

-- Ativos (Assets)
CREATE TABLE IF NOT EXISTS public.assets (
    id TEXT PRIMARY KEY,
    "tagId" TEXT,
    "departmentId" TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
    "assignedTo" TEXT REFERENCES public.employees(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    "serialNumber" TEXT,
    "purchaseValue" NUMERIC,
    status TEXT DEFAULT 'Disponível',
    "qrCode" TEXT,
    "createdAt" TEXT,
    -- Campos de Hardware
    ram TEXT,
    storage TEXT,
    processor TEXT,
    "screenSize" TEXT,
    "caseModel" TEXT,
    "isWireless" BOOLEAN,
    "monitorInputs" TEXT[], -- Array de strings no Supabase é suportado
    "isAbnt" BOOLEAN,
    "hasNumericKeypad" BOOLEAN,
    observations TEXT,
    photos TEXT[], -- Array de URLs base64
    history JSONB[] -- Armazena o histórico como JSONB array
);

-- Requisições
CREATE TABLE IF NOT EXISTS public.requests (
    id TEXT PRIMARY KEY,
    "requesterId" TEXT,
    "employeeId" TEXT REFERENCES public.employees(id) ON DELETE SET NULL,
    items TEXT[],
    "itemFulfillments" JSONB[], -- Detalhes complexos da compra/vínculo
    observation TEXT,
    status TEXT DEFAULT 'Pendente',
    "createdAt" TEXT,
    type TEXT -- Padrao ou Divergencia
);

-- Usuários do Sistema
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT,
    sector TEXT,
    modules TEXT[],
    "employeeId" TEXT REFERENCES public.employees(id) ON DELETE SET NULL
);

-- Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    title TEXT,
    message TEXT,
    type TEXT,
    "createdAt" TEXT,
    "targetModule" TEXT,
    "isRead" BOOLEAN DEFAULT FALSE
);

-- Sessões de Auditoria
CREATE TABLE IF NOT EXISTS public.audit_sessions (
    id TEXT PRIMARY KEY,
    sector TEXT,
    "createdAt" TEXT,
    entries JSONB[], -- Lista de itens auditados
    "isFinished" BOOLEAN DEFAULT FALSE,
    "generatedRequestId" TEXT
);

-- 3. PERMISSÕES DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- Política "Acesso Total" para uso interno simplificado

-- Habilita RLS em todas as tabelas
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_type_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_sessions ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Public Access" ON public.departments;
DROP POLICY IF EXISTS "Public Access" ON public.employees;
DROP POLICY IF EXISTS "Public Access" ON public.accounting_accounts;
DROP POLICY IF EXISTS "Public Access" ON public.asset_type_configs;
DROP POLICY IF EXISTS "Public Access" ON public.assets;
DROP POLICY IF EXISTS "Public Access" ON public.requests;
DROP POLICY IF EXISTS "Public Access" ON public.users;
DROP POLICY IF EXISTS "Public Access" ON public.notifications;
DROP POLICY IF EXISTS "Public Access" ON public.audit_sessions;

-- Cria novas políticas permissivas (CRUD total para autenticados e anônimos neste contexto de app interno)
CREATE POLICY "Public Access" ON public.departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.accounting_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.asset_type_configs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.audit_sessions FOR ALL USING (true) WITH CHECK (true);

-- 4. ÍNDICES DE PERFORMANCE (Opcional, mas recomendado)
CREATE INDEX IF NOT EXISTS idx_assets_department ON public.assets("departmentId");
CREATE INDEX IF NOT EXISTS idx_assets_assigned ON public.assets("assignedTo");
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees("departmentId");
CREATE INDEX IF NOT EXISTS idx_requests_employee ON public.requests("employeeId");
CREATE INDEX IF NOT EXISTS idx_configs_account ON public.asset_type_configs("accountId");

-- Recarrega schema cache
NOTIFY pgrst, 'reload schema';
