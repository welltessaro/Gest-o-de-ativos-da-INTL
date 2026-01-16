
import React, { useState } from 'react';
import { Package, LogIn, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { UserAccount } from '../types';

interface AuthProps {
  onLogin: (user: UserAccount) => void;
  users: UserAccount[];
}

const Auth: React.FC<AuthProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const inputUser = username.toLowerCase();
    
    // Procura o usuário na lista (considerando password 'admin' como padrão se não definido)
    const foundUser = users.find(u => 
      u.username.toLowerCase() === inputUser && 
      (u.password === password || (password === 'admin' && !u.password))
    );

    if (foundUser) {
      onLogin(foundUser);
    } else {
      setError('Credenciais inválidas. Verifique seu usuário e senha.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 mb-4 transform -rotate-6">
            <Package className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">AssetTrack <span className="text-blue-600">Pro</span></h1>
          <p className="text-slate-500 font-medium">Gestão de Ativos de TI Inteligente</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 md:p-10 transition-all">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2 text-blue-600">
               <LogIn className="w-5 h-5" />
               <span className="text-xl font-black uppercase tracking-widest">Acesso Restrito</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5" />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-slate-400" /> Usuário
              </label>
              <input 
                type="text"
                required
                autoComplete="username"
                className="w-full p-3.5 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                placeholder="Usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" /> Senha
              </label>
              <input 
                type="password"
                required
                autoComplete="current-password"
                className="w-full p-3.5 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all transform active:scale-[0.98] mt-4"
            >
              Acessar Sistema
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
