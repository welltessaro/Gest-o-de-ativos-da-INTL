
import React, { useState } from 'react';
import { Package, LogIn, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { UserAccount } from '../types';
import { db } from '../services/supabase';

interface AuthProps {
  onLogin: (user: UserAccount) => void;
  users: UserAccount[]; // Mantido por compatibilidade de interface, mas ignorado no login direto
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAuthenticating(true);

    try {
      // SEGURANÇA: Busca direta no Supabase para evitar vazamento da tabela inteira
      const foundUser = await db.users.getForAuth(username.toLowerCase());

      if (foundUser) {
        // Validação de senha (em produção, use hashes com Supabase Auth)
        const isValid = foundUser.password === password || (!foundUser.password && password === 'admin');
        
        if (isValid) {
          onLogin(foundUser);
        } else {
          setError('Senha incorreta.');
        }
      } else {
        setError('Usuário não encontrado.');
      }
    } catch (err) {
      setError('Erro ao conectar com o serviço de autenticação.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-12">
          <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl mb-6 transform -rotate-6">
            <Package className="text-white w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">AssetTrack <span className="text-blue-600">Pro</span></h1>
          <p className="text-slate-600 font-bold mt-2 uppercase tracking-widest text-[10px]">Gestão de Ativos de TI</p>
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-blue-600" /> Usuário
              </label>
              <input 
                type="text" 
                required 
                disabled={isAuthenticating}
                className="w-full p-4 rounded-2xl border border-slate-200 outline-none font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400 transition-all bg-slate-50/50" 
                placeholder="Digite seu usuário" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" /> Senha
              </label>
              <input 
                type="password" 
                required 
                disabled={isAuthenticating}
                className="w-full p-4 rounded-2xl border border-slate-200 outline-none font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400 transition-all bg-slate-50/50" 
                placeholder="Digite sua senha" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            
            {error && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                <p className="text-rose-600 text-xs font-black text-center uppercase tracking-tight">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isAuthenticating}
              className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[2rem] shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-3 disabled:bg-slate-400"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Acessar Sistema
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center border-t border-slate-50 pt-6">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              Acesso Restrito • Monitoramento Ativo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
