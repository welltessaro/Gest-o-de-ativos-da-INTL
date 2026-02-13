
import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Trash2, Shield, User as UserIcon, X, Check, Edit2, Key, LayoutGrid, Star, Users, Briefcase, CreditCard, PenTool } from 'lucide-react';
import { UserAccount, AppModule, Employee } from '../types';
import { ALL_MODULES } from '../constants';

interface UserManagerProps {
  users: UserAccount[];
  employees: Employee[];
  onAddUser: (user: Omit<UserAccount, 'id'>) => void;
  onUpdateUser: (user: UserAccount) => void;
  onRemoveUser: (id: string) => void;
}

const UserManager: React.FC<UserManagerProps> = ({ users, employees, onAddUser, onUpdateUser, onRemoveUser }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Omit<UserAccount, 'id'>>({
    name: '',
    username: '',
    password: '',
    sector: '',
    modules: [],
    employeeId: '',
    canApprovePurchase: false,
    canExecutePurchase: false
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ 
      name: '', username: '', password: '', sector: '', modules: [], employeeId: '', 
      canApprovePurchase: false, canExecutePurchase: false 
    });
    setShowForm(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({ 
      name: user.name, 
      username: user.username, 
      password: '', 
      sector: user.sector, 
      modules: user.modules,
      employeeId: user.employeeId || '',
      canApprovePurchase: user.canApprovePurchase || false,
      canExecutePurchase: user.canExecutePurchase || false
    });
    setShowForm(true);
  };

  const handleEmployeeChange = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        employeeId,
        name: emp.name,
        sector: emp.sector
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        employeeId: '',
        name: '',
        sector: ''
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId && !editingUser?.username.includes('admin')) {
      alert("É obrigatório vincular um colaborador para criar uma conta de usuário.");
      return;
    }

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
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Setor Oficial</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Acesso & Funções</th>
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
                      <p className="text-xs text-slate-400 font-medium">@{user.username} {user.employeeId ? '• Vinculado' : ''}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className="text-sm text-slate-600 font-medium">{user.sector}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap gap-1">
                      {user.modules.slice(0, 2).map(m => (
                        <span key={m} className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold uppercase text-slate-500">
                          {ALL_MODULES.find(mod => mod.id === m)?.label.split(' ')[0]}
                        </span>
                      ))}
                      {user.modules.length > 2 && <span className="text-[9px] font-bold text-slate-400 self-center">+{user.modules.length - 2}</span>}
                    </div>
                    <div className="flex gap-1">
                       {user.canApprovePurchase && (
                         <span className="bg-purple-100 text-purple-700 text-[8px] px-2 py-0.5 rounded-md font-black uppercase flex items-center gap-1 w-fit" title="Aprovador">
                           <PenTool className="w-2 h-2" /> Aprova
                         </span>
                       )}
                       {user.canExecutePurchase && (
                         <span className="bg-emerald-100 text-emerald-700 text-[8px] px-2 py-0.5 rounded-md font-black uppercase flex items-center gap-1 w-fit" title="Comprador">
                           <CreditCard className="w-2 h-2" /> Compra
                         </span>
                       )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleOpenEdit(user)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onRemoveUser(user.id)} disabled={user.username === 'admin'} className={`p-2 transition-colors ${user.username === 'admin' ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600'}`}>
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
                      {editingUser ? 'Editar Perfil' : 'Novo Usuário'}
                    </h3>
                    <p className="text-sm text-slate-500">Defina o vínculo e as permissões de acesso.</p>
                  </div>
               </div>
               <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full">
                 <X className="w-6 h-6 text-slate-400" />
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 space-y-4">
                <div className="flex items-center gap-2 text-blue-700">
                   <Users className="w-5 h-5" />
                   <label className="text-xs font-black uppercase tracking-widest">Vincular Colaborador</label>
                </div>
                <div className="relative">
                   <select 
                     className="w-full p-4 rounded-xl bg-white border border-blue-200 outline-none font-bold text-slate-800 appearance-none shadow-sm focus:ring-2 focus:ring-blue-500"
                     value={formData.employeeId}
                     onChange={(e) => handleEmployeeChange(e.target.value)}
                     required={!editingUser?.username.includes('admin')}
                   >
                     <option value="">Selecione o funcionário no RH...</option>
                     {employees.map(emp => (
                       <option key={emp.id} value={emp.id}>{emp.name} — {emp.role} ({emp.sector})</option>
                     ))}
                   </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60 pointer-events-none">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">Nome</label>
                  <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm" value={formData.name} readOnly />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">Setor</label>
                  <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm" value={formData.sector} readOnly />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest block">Login</label>
                  <input className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="usuario" required disabled={editingUser?.username === 'admin'} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest block">Senha</label>
                  <input type="password" className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={editingUser ? "••••" : "Senha"} required={!editingUser} />
                </div>
              </div>

              {/* SEGREGAÇÃO DE FUNÇÕES FINANCEIRAS */}
              <div className="space-y-3">
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 border-b border-slate-100 pb-1">Permissões Financeiras (Segregação de Função)</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* APROVADOR */}
                    <div 
                      onClick={() => setFormData({...formData, canApprovePurchase: !formData.canApprovePurchase})}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${formData.canApprovePurchase ? 'bg-purple-50 border-purple-200' : 'bg-white border-slate-100 hover:border-purple-100'}`}
                    >
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.canApprovePurchase ? 'bg-purple-200 text-purple-700' : 'bg-slate-100 text-slate-400'}`}>
                             <PenTool className="w-5 h-5" />
                          </div>
                          <div>
                             <h5 className={`font-black text-sm ${formData.canApprovePurchase ? 'text-purple-900' : 'text-slate-600'}`}>Aprovador</h5>
                             <p className="text-[10px] opacity-70 font-bold">Autoriza pedidos</p>
                          </div>
                       </div>
                       <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.canApprovePurchase ? 'border-purple-600 bg-purple-600' : 'border-slate-300'}`}>
                          {formData.canApprovePurchase && <Check className="w-3 h-3 text-white" />}
                       </div>
                    </div>

                    {/* COMPRADOR */}
                    <div 
                      onClick={() => setFormData({...formData, canExecutePurchase: !formData.canExecutePurchase})}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${formData.canExecutePurchase ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 hover:border-emerald-100'}`}
                    >
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.canExecutePurchase ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                             <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                             <h5 className={`font-black text-sm ${formData.canExecutePurchase ? 'text-emerald-900' : 'text-slate-600'}`}>Comprador</h5>
                             <p className="text-[10px] opacity-70 font-bold">Confirma pagamentos</p>
                          </div>
                       </div>
                       <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.canExecutePurchase ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`}>
                          {formData.canExecutePurchase && <Check className="w-3 h-3 text-white" />}
                       </div>
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
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                <button type="submit" className="px-12 py-4 font-black bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-black transition-all">
                  {editingUser ? 'Salvar Alterações' : 'Criar Conta Vinculada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default UserManager;
