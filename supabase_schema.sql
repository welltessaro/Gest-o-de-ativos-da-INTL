
-- ==============================================================================
-- ASSETTRACK PRO - MASTER DATABASE SCHEMA (FULL RESET)
-- ==============================================================================
-- ATENÇÃO: EXECUTE ESTE SCRIPT NO 'SQL EDITOR' DO SUPABASE.
-- ELE APAGARÁ TODOS OS DADOS EXISTENTES PARA RECRIAR A ESTRUTURA CORRETA.
-- ==============================================================================

-- 1. LIMPEZA TOTAL (DROP TABLES)
-- Remove tabelas na ordem correta para respeitar dependências (Foreign Keys)
DROP TABLE IF EXISTS public.audit_sessions CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.requests CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.assets CASCADE;
DROP TABLE IF EXISTS public.asset_type_configs CASCADE;
DROP TABLE IF EXISTS public.accounting_accounts CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.legal_entities CASCADE;

-- 2. CRIAÇÃO DAS TABELAS (CREATE TABLES)

-- 2.0 Entidades Legais (Empresas/Filiais)
CREATE TABLE public.legal_entities (
    id TEXT PRIMARY KEY,
    "socialReason" TEXT NOT NULL, -- Razão Social
    cnpj TEXT,
    address TEXT
);

-- 2.1 Departamentos
CREATE TABLE public.departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "costCenter" TEXT,
    "createdAt" TEXT
);

-- 2.2 Colaboradores
CREATE TABLE public.employees (
    id TEXT PRIMARY KEY,
    "departmentId" TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
    "legalEntityId" TEXT REFERENCES public.legal_entities(id) ON DELETE SET NULL, -- Vínculo Empresa
    name TEXT NOT NULL,
    sector TEXT,
    role TEXT,
    cpf TEXT,
    "isActive" BOOLEAN DEFAULT TRUE
);

-- 2.3 Contas Contábeis (Plano de Contas)
CREATE TABLE public.accounting_accounts (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    "type" TEXT DEFAULT 'Ativo', -- Ex: Ativo, Despesa, Custo
    "costCenter" TEXT
);

-- 2.4 Configuração de Tipos de Ativo
CREATE TABLE public.asset_type_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "accountId" TEXT REFERENCES public.accounting_accounts(id) ON DELETE SET NULL
);

-- 2.5 Ativos (Inventário)
CREATE TABLE public.assets (
    id TEXT PRIMARY KEY,
    "tagId" TEXT, -- Etiqueta física
    "departmentId" TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
    "assignedTo" TEXT REFERENCES public.employees(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    "serialNumber" TEXT,
    "purchaseValue" NUMERIC,
    status TEXT DEFAULT 'Disponível', -- Disponível, Em Uso, Manutenção, Baixado
    "qrCode" TEXT,
    "createdAt" TEXT,
    
    -- Especificações Técnicas
    ram TEXT,
    storage TEXT,
    processor TEXT,
    "screenSize" TEXT,
    "caseModel" TEXT,
    "isWireless" BOOLEAN,
    "monitorInputs" TEXT[], -- Array de Strings
    "isAbnt" BOOLEAN,
    "hasNumericKeypad" BOOLEAN,
    
    observations TEXT,
    photos TEXT[], -- Array de URLs (Base64 ou Links)
    history JSONB[] -- Array de Objetos JSON para log de movimentação
);

-- 2.6 Usuários do Sistema (Login)
CREATE TABLE public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT,
    sector TEXT,
    modules TEXT[], -- Array de strings com os módulos permitidos
    "employeeId" TEXT REFERENCES public.employees(id) ON DELETE SET NULL,
    "canApprovePurchase" BOOLEAN DEFAULT FALSE,
    "canExecutePurchase" BOOLEAN DEFAULT FALSE
);

-- 2.7 Requisições e Pedidos
CREATE TABLE public.requests (
    id TEXT PRIMARY KEY,
    "requesterId" TEXT, -- ID do usuário que abriu (sem FK estrita para permitir flexibilidade)
    "employeeId" TEXT REFERENCES public.employees(id) ON DELETE SET NULL, -- Beneficiário
    items TEXT[], -- Array de tipos solicitados
    "itemFulfillments" JSONB[], -- Detalhes complexos (Cotações, Vínculos, Status por item)
    observation TEXT,
    status TEXT DEFAULT 'Pendente',
    "createdAt" TEXT,
    type TEXT -- 'Padrao' ou 'Divergencia'
);

-- 2.8 Notificações
CREATE TABLE public.notifications (
    id TEXT PRIMARY KEY,
    title TEXT,
    message TEXT,
    type TEXT, -- info, maintenance, delivery, alert
    "createdAt" TEXT,
    "targetModule" TEXT,
    "isRead" BOOLEAN DEFAULT FALSE
);

-- 2.9 Auditorias (Check Semestral)
CREATE TABLE public.audit_sessions (
    id TEXT PRIMARY KEY,
    sector TEXT,
    "createdAt" TEXT,
    entries JSONB[], -- Lista de { assetId, status, checkedAt }
    "isFinished" BOOLEAN DEFAULT FALSE,
    "generatedRequestId" TEXT
);

-- 3. INDICES DE PERFORMANCE
CREATE INDEX idx_assets_department ON public.assets("departmentId");
CREATE INDEX idx_assets_assigned ON public.assets("assignedTo");
CREATE INDEX idx_employees_department ON public.employees("departmentId");
CREATE INDEX idx_employees_legal ON public.employees("legalEntityId");
CREATE INDEX idx_requests_employee ON public.requests("employeeId");
CREATE INDEX idx_asset_configs_account ON public.asset_type_configs("accountId");
CREATE INDEX idx_users_username ON public.users(username);

-- 4. CONFIGURAÇÃO DE SEGURANÇA (ROW LEVEL SECURITY - RLS)

-- Habilita RLS em todas as tabelas
ALTER TABLE public.legal_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_type_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_sessions ENABLE ROW LEVEL SECURITY;

-- Cria política de ACESSO TOTAL para a API (Anon/Authenticated/ServiceRole)
CREATE POLICY "Enable All Access" ON public.legal_entities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All Access" ON public.departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All Access" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All Access" ON public.accounting_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All Access" ON public.asset_type_configs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All Access" ON public.assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All Access" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All Access" ON public.requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All Access" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All Access" ON public.audit_sessions FOR ALL USING (true) WITH CHECK (true);

-- 5. FINALIZAÇÃO
-- Recarrega o cache de schema do PostgREST para garantir que a API reconheça as mudanças imediatamente
NOTIFY pgrst, 'reload schema';
