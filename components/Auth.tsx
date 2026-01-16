
import React, { useState } from 'react';
import { Package, LogIn, Lock, User as UserIcon, AlertCircle, Database, ChevronDown, ChevronUp, Terminal, Copy, Check } from 'lucide-react';
import { UserAccount } from '../types';
import { isSupabaseConfigured } from '../services/supabase';

interface AuthProps {
  onLogin: (user: UserAccount) => void;
  users: UserAccount[];
}

const Auth: React.FC<AuthProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const inputUser = username.toLowerCase();
    const foundUser = users.find(u => u.username.toLowerCase() === inputUser && (u.password === password || (password === 'admin' && !u.password)));

    if (foundUser) onLogin(foundUser);
    else setError('Credenciais inválidas. Verifique usuário e senha.');
  };

  const sqlCode = `-- COPIE E COLE ESTE SCRIPT NO SQL EDITOR DO SUPABASE

-- 1. Tabela de Empresas
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Colaboradores
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sector TEXT,
  role TEXT,
  cpf TEXT
);

-- 3. Tabela de Ativos
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  ram TEXT,
  storage TEXT,
  processor TEXT,
  screen_size TEXT,
  observations TEXT,
  photos TEXT[],
  status TEXT NOT NULL,
  assigned_to TEXT REFERENCES employees(id) ON DELETE SET NULL,
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Requisições de Equipamentos
CREATE TABLE IF NOT EXISTS equipment_requests (
  id TEXT PRIMARY KEY,
  requester_id TEXT,
  employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
  items TEXT[],
  item_fulfillments JSONB,
  observation TEXT,
  status TEXT,
  type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Sessões de Auditoria (Check Semestral)
CREATE TABLE IF NOT EXISTS audit_sessions (
  id TEXT PRIMARY KEY,
  sector TEXT,
  entries JSONB,
  is_finished BOOLEAN DEFAULT FALSE,
  generated_request_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar acesso público inicial (Desativar em produção para maior segurança)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write" ON assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write" ON equipment_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write" ON audit_sessions FOR ALL USING (true) WITH CHECK (true);`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl mb-4 transform -rotate-6">
            <Package className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">AssetTrack <span className="text-blue-600">Pro</span></h1>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-slate-400" /> Usuário
              </label>
              <input type="text" required className="w-full p-3.5 rounded-2xl border border-slate-200 outline-none" placeholder="admin" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" /> Senha
              </label>
              <input type="password" required className="w-full p-3.5 rounded-2xl border border-slate-200 outline-none" placeholder="admin" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95">Acessar Sistema</button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-100">
            <button 
              onClick={() => setShowSqlGuide(!showSqlGuide)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all ${isSupabaseConfigured ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">Script SQL para o Banco</span>
              </div>
              {showSqlGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showSqlGuide && (
              <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="p-4 bg-slate-900 rounded-2xl relative group">
                   <div className="flex items-center justify-between text-blue-400 mb-3">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase">Executar no Supabase SQL Editor</span>
                      </div>
                      <button 
                        onClick={handleCopy}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span className="text-[9px] font-bold uppercase">{copied ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                   </div>
                   <pre className="text-[9px] text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60 custom-scrollbar">
                     {sqlCode}
                   </pre>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                   <p className="text-[10px] text-blue-700 font-bold leading-tight">
                     Dica: Clique em "Copiar" e cole no menu <b>SQL Editor</b> do Supabase para criar as tabelas instantaneamente.
                   </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Auth;
