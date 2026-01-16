
import React, { useState } from 'react';
import { UserPlus, Search, Trash2, Shield, User as UserIcon, X, Check, Edit2, Key, LayoutGrid, Star } from 'lucide-react';
import { UserAccount, AppModule } from '../types';
import { ALL_MODULES } from '../constants';

interface UserManagerProps {
  users: UserAccount[];
  onAddUser: (user: Omit<UserAccount, 'id'>) => void;
  onUpdateUser: (user: UserAccount) => void;
  onRemoveUser: (id: string) => void;
}

const UserManager: React.FC<UserManagerProps> = ({ users, onAddUser, onUpdateUser, onRemoveUser }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Omit<UserAccount, 'id'>>({
    name: '',
    username: '',
    password: '',
    sector: '',
    modules: []
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ name: '', username: '', password: '', sector: '', modules: [] });
    setShowForm(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({ 
      name: user.name, 
      username: user.username, 
      password: '', 
      sector: user.sector, 
      modules: user.modules 
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const updatedUser: UserAccount = {
        ...editingUser,
        ...formData,
        password: formData.password || editingUser.password 
      };
      onUpdateUser(updatedUser);
    } else {
      onAddUser(formData);
    }
    setShowForm(false);
  };

  const toggleModule = (moduleId: AppModule) => {
    // Impede remover a gestão de usuários do admin principal
    if (editingUser?.username === 'admin' && moduleId === 'user-management') return;

    setFormData(prev => ({
      ...prev,
      modules: prev.modules.includes(moduleId)
        ? prev.modules.filter(m => m !== moduleId)
        : [...prev.modules, moduleId]
    }));
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou usuário..." 
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg"
        >
          <UserPlus className="w-5 h-5" />
          <span>Novo Usuário</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Usuário</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Setor</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Acesso</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map(user => (
              <tr 
                key={user.id} 
                className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                onClick={() => handleOpenEdit(user)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 leading-none group-hover:text-blue-600 transition-colors">{user.name}</p>
                        {user.username === 'admin' && (
                          <span className="bg-amber-100 text-amber-700 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase flex items-center gap-1">
                            <Star className="w-2 h-2 fill-current" /> Master
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium">@{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className="text-sm text-slate-600 font-medium">{user.sector}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {user.modules.length > 0 ? (
                      user.modules.slice(0, 3).map(m => (
                        <span key={m} className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          m === 'user-management' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {ALL_MODULES.find(mod => mod.id === m)?.label.split(' ')[0]}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Nenhum</span>
                    )}
                    {user.modules.length > 3 && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-500 rounded text-[9px] font-bold uppercase">
                        +{user.modules.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => handleOpenEdit(user)}
                      className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onRemoveUser(user.id)}
                      disabled={user.username === 'admin'}
                      className={`p-2 transition-colors ${user.username === 'admin' ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-8 shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    {editingUser ? <Edit2 className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                      {editingUser ? 'Editar Perfil' : 'Novo Usuário do Sistema'}
                    </h3>
                    <p className="text-sm text-slate-500">Configure as credenciais e o nível de acesso.</p>
                  </div>
               </div>
               <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full">
                 <X className="w-6 h-6 text-slate-400" />
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest block">Nome Completo</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex: João Silva"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest block">Setor</label>
                  <input 
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                    value={formData.sector}
                    onChange={e => setFormData({...formData, sector: e.target.value})}
                    placeholder="Ex: TI, RH, Diretoria"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest block">Login / Usuário</label>
                  <input 
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    placeholder="Ex: joao.silva"
                    required
                    disabled={editingUser?.username === 'admin'}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest block">
                    {editingUser ? 'Alterar Senha (Opcional)' : 'Senha de Acesso'}
                  </label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="password"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      placeholder={editingUser ? "•••••••• (Vazio = sem alteração)" : "••••••••"}
                      required={!editingUser}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" /> Permissões de Módulo
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold">{formData.modules.length} módulos ativos</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-4 rounded-3xl border border-slate-200">
                  {ALL_MODULES.map(module => {
                    const isAdminMasterModule = editingUser?.username === 'admin' && module.id === 'user-management';
                    
                    return (
                      <button
                        key={module.id}
                        type="button"
                        onClick={() => toggleModule(module.id)}
                        disabled={isAdminMasterModule}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                          formData.modules.includes(module.id)
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100'
                            : 'bg-white border-slate-100 text-slate-600 hover:border-blue-300'
                        } ${isAdminMasterModule ? 'opacity-80 cursor-not-allowed border-blue-200' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <LayoutGrid className={`w-3.5 h-3.5 ${formData.modules.includes(module.id) ? 'text-white' : 'text-slate-300'}`} />
                          <div>
                            <span className="text-xs font-bold block leading-none">{module.label}</span>
                            {isAdminMasterModule && <span className="text-[8px] opacity-70">Obrigatório para Master</span>}
                          </div>
                        </div>
                        {formData.modules.includes(module.id) && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 shrink-0" />
                  <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                    <strong>Nota:</strong> Usuários com o módulo <strong>"Gestão de Usuários"</strong> ativo possuem permissão para criar novos usuários e editar as permissões de outros colaboradores, incluindo o acesso aos Dashboards de Diretoria.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                <button type="submit" className="px-12 py-4 font-black bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-black transition-all">
                  {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default UserManager;
