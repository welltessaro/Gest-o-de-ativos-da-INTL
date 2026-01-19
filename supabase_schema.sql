
-- ============================================================
-- APENAS MÓDULO CONTÁBIL - EXECUTE NO SQL EDITOR DO SUPABASE
-- ============================================================

-- 1. Criação das Tabelas (Respeitando a ordem de dependência)
CREATE TABLE IF NOT EXISTS public.accounting_accounts (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.accounting_classifications (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    "accountId" TEXT REFERENCES public.accounting_accounts(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS public.asset_type_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "classificationId" TEXT REFERENCES public.accounting_classifications(id) ON DELETE SET NULL
);

-- 2. Habilitação de Segurança (RLS)
ALTER TABLE public.accounting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_type_configs ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Acesso Público (Necessário para o app conectar)
DROP POLICY IF EXISTS "Public Full Access" ON public.accounting_accounts;
CREATE POLICY "Public Full Access" ON public.accounting_accounts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access" ON public.accounting_classifications;
CREATE POLICY "Public Full Access" ON public.accounting_classifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access" ON public.asset_type_configs;
CREATE POLICY "Public Full Access" ON public.asset_type_configs FOR ALL USING (true) WITH CHECK (true);

-- Dica: Após executar, o Supabase pode levar alguns segundos para atualizar o cache do esquema.
