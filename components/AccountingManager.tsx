
import React, { useState, useMemo } from 'react';
import { 
  Book, 
  Layers, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  X, 
  Check, 
  Tag,
  Loader2,
  FolderOpen,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { AccountingAccount, AssetTypeConfig, Department } from '../types';

interface AccountingManagerProps {
  accounts: AccountingAccount[];
  assetTypes: AssetTypeConfig[];
  departments: Department[]; 
  onAddAccount: (acc: Omit<AccountingAccount, 'id'>) => Promise<void>;
  onUpdateAccount: (acc: AccountingAccount) => Promise<void>;
  onRemoveAccount: (id: string) => Promise<void>;
  onAddAssetType: (type: Omit<AssetTypeConfig, 'id'>) => Promise<void>;
  onUpdateAssetType: (type: AssetTypeConfig) => Promise<void>;
  onRemoveAssetType: (id: string) => Promise<void>;
}

const AccountingManager: React.FC<AccountingManagerProps> = ({
  accounts, assetTypes, departments,
  onAddAccount, onUpdateAccount, onRemoveAccount,
  onAddAssetType, onUpdateAssetType, onRemoveAssetType
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'asset-types'>('accounts');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'account' | 'asset-type'>('account');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [formData, setFormData] = useState<any>({});

  // --- FILTROS ---
  const filteredAccounts = useMemo(() => {
    return accounts.filter(a => 
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.code.includes(searchTerm)
    ).sort((a, b) => a.code.localeCompare(b.code));
  }, [accounts, searchTerm]);

  const filteredAssetTypes = useMemo(() => {
    return assetTypes.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [assetTypes, searchTerm]);

  // --- AGRUPAMENTO POR CONTA (PARA A VIEW DE CARDS) ---
  const groupedAssetTypes = useMemo(() => {
    const groups: Record<string, AssetTypeConfig[]> = {};
    
    // Inicializa grupos para todas as contas (para mostrar cards vazios também)
    accounts.forEach(acc => {
      groups[acc.id] = [];
    });
    
    // Grupo especial para sem vínculo
    groups['unlinked'] = [];

    filteredAssetTypes.forEach(type => {
      if (type.accountId && groups[type.accountId]) {
        groups[type.accountId].push(type);
      } else {
        groups['unlinked'].push(type);
      }
    });

    return groups;
  }, [accounts, filteredAssetTypes]);

  // --- AÇÕES ---

  const handleOpenAccountForm = (account: AccountingAccount | null = null) => {
    setFormType('account');
    setEditingItem(account);
    setFormData(account ? {
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      costCenter: account.costCenter
    } : { 
      code: '', 
      name: '', 
      type: 'Ativo', 
      costCenter: '' 
    });
    setShowForm(true);
  };

  const handleOpenAssetTypeForm = (type: AssetTypeConfig | null = null, preSelectedAccountId?: string) => {
    setFormType('asset-type');
    setEditingItem(type);
    setFormData(type ? { 
        id: type.id, 
        name: type.name, 
        accountId: type.accountId 
    } : { 
        name: '', 
        accountId: preSelectedAccountId || '' 
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (formType === 'account') {
        if (editingItem) await onUpdateAccount(formData);
        else await onAddAccount(formData);
      } else if (formType === 'asset-type') {
        if (editingItem) await onUpdateAssetType(formData);
        else await onAddAssetType(formData);
      }
      setShowForm(false);
      setEditingItem(null);
    } catch (err: any) {
      alert(`Falha ao salvar: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, type: 'account' | 'asset-type') => {
    if (!confirm('Deseja realmente excluir este registro?')) return;
    try {
      if (type === 'account') await onRemoveAccount(id);
      else await onRemoveAssetType(id);
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  const getAccountName = (id: string) => {
    const acc = accounts.find(a => a.id === id);
    return acc ? `${acc.code} - ${acc.name}` : 'Não Vinculado';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER E TABS */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div className="bg-white rounded-[2rem] p-1.5 border border-slate-100 shadow-sm flex gap-1 w-full md:w-auto">
              <button 
                onClick={() => setActiveTab('accounts')}
                className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === 'accounts' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Book className="w-4 h-4" /> Plano de Contas
              </button>
              <button 
                onClick={() => setActiveTab('asset-types')}
                className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === 'asset-types' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-4 h-4" /> Mapeamento de Tipos
              </button>
           </div>

           <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                 <input 
                   className="w-full md:w-64 pl-9 pr-4 py-3 rounded-2xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                   placeholder={activeTab === 'accounts' ? "Buscar conta..." : "Buscar equipamento..."}
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>
              <button 
                onClick={() => activeTab === 'accounts' ? handleOpenAccountForm() : handleOpenAssetTypeForm()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-blue-100 flex items-center gap-2 transition-all transform active:scale-95 uppercase text-[10px] tracking-widest whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> 
                {activeTab === 'accounts' ? 'Nova Conta' : 'Novo Tipo'}
              </button>
           </div>
        </div>
      </div>

      {/* CONTEÚDO: CONTAS */}
      {activeTab === 'accounts' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-slate-100 bg-slate-50/50">
                   <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                   <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Classificação (Nome)</th>
                   <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Natureza</th>
                   <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Centro Custo</th>
                   <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {filteredAccounts.map(acc => (
                   <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="px-6 py-4">
                       <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-mono font-bold">
                          {acc.code}
                       </span>
                     </td>
                     <td className="px-6 py-4 font-bold text-slate-700 text-sm">{acc.name}</td>
                     <td className="px-6 py-4">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                         acc.type === 'Ativo' ? 'bg-emerald-50 text-emerald-700' : 
                         acc.type === 'Despesa' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                       }`}>
                         {acc.type || 'Ativo'}
                       </span>
                     </td>
                     <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">
                        {acc.costCenter || '-'}
                     </td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleOpenAccountForm(acc)} className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-slate-100 transition-colors">
                              <Edit2 className="w-4 h-4" />
                           </button>
                           <button onClick={() => handleDelete(acc.id, 'account')} className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 transition-colors">
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     </td>
                   </tr>
                 ))}
                 {filteredAccounts.length === 0 && (
                   <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <FolderOpen className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Nenhuma conta cadastrada</p>
                      </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {/* CONTEÚDO: MAPEAMENTO (VIEW DE CARDS) */}
      {activeTab === 'asset-types' && (
        <div className="space-y-8">
           
           {/* Card de Itens Sem Vínculo (Só aparece se houver) */}
           {groupedAssetTypes['unlinked'] && groupedAssetTypes['unlinked'].length > 0 && (
             <div className="bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] p-6 shadow-lg shadow-rose-50 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 bg-rose-200 rounded-xl flex items-center justify-center text-rose-700">
                      <AlertCircle className="w-5 h-5" />
                   </div>
                   <div>
                      <h4 className="text-lg font-black text-rose-800">Sem Vínculo Contábil</h4>
                      <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Estes itens precisam ser classificados</p>
                   </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                   {groupedAssetTypes['unlinked'].map(type => (
                     <div key={type.id} className="bg-white p-3 rounded-2xl border border-rose-200 flex justify-between items-center group shadow-sm hover:shadow-md transition-all">
                        <span className="font-bold text-slate-700 text-sm">{type.name}</span>
                        <div className="flex gap-1">
                           <button onClick={() => handleOpenAssetTypeForm(type)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                              <Edit2 className="w-3.5 h-3.5" />
                           </button>
                           <button onClick={() => handleDelete(type.id, 'asset-type')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {/* Grid de Contas */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAccounts.map(account => (
                <div key={account.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden hover:shadow-lg transition-all group h-full">
                   {/* Header do Card (Conta) */}
                   <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center group-hover:bg-slate-100/80 transition-colors">
                      <div className="flex items-center gap-3">
                         <span className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold shadow-md shadow-blue-200">
                            {account.code}
                         </span>
                         <div>
                            <h4 className="font-black text-slate-800 leading-tight">{account.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{account.type} • {groupedAssetTypes[account.id]?.length || 0} Tipos</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => handleOpenAssetTypeForm(null, account.id)}
                        className="p-2 bg-white border border-slate-200 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        title="Adicionar tipo nesta conta"
                      >
                         <Plus className="w-4 h-4" />
                      </button>
                   </div>

                   {/* Lista de Tipos */}
                   <div className="p-6 flex-1 bg-white">
                      {groupedAssetTypes[account.id]?.length > 0 ? (
                        <div className="space-y-2">
                           {groupedAssetTypes[account.id].map(type => (
                             <div key={type.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group/item">
                                <div className="flex items-center gap-2">
                                   <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover/item:bg-blue-500 transition-colors" />
                                   <span className="text-sm font-bold text-slate-700">{type.name}</span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                   <button onClick={() => handleOpenAssetTypeForm(type)} className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                                      <Edit2 className="w-3.5 h-3.5" />
                                   </button>
                                   <button onClick={() => handleDelete(type.id, 'asset-type')} className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                                      <Trash2 className="w-3.5 h-3.5" />
                                   </button>
                                </div>
                             </div>
                           ))}
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center py-8 text-center opacity-40">
                           <FolderOpen className="w-8 h-8 text-slate-300 mb-2" />
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nenhum tipo vinculado</p>
                        </div>
                      )}
                   </div>
                </div>
              ))}
              
              {filteredAccounts.length === 0 && (
                 <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase text-xs">
                    Nenhuma conta encontrada para o filtro atual.
                 </div>
              )}
           </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tight">
                {editingItem ? 'Editar' : 'Adicionar'} {formType === 'account' ? 'Conta Contábil' : 'Tipo de Equipamento'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              
              {formType === 'account' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código da Conta</label>
                    <input className="w-full p-4 rounded-2xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-600" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required placeholder="Ex: 1.01.05" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Classificação (Nome)</label>
                    <input className="w-full p-4 rounded-2xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-600" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Ex: Equipamentos de Informática" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Natureza</label>
                      <select 
                        className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold outline-none focus:ring-2 focus:ring-blue-600"
                        value={formData.type || 'Ativo'}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Despesa">Despesa</option>
                        <option value="Custo">Custo</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Centro de Custo</label>
                      <select 
                        className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold outline-none focus:ring-2 focus:ring-blue-600" 
                        value={formData.costCenter || ''} 
                        onChange={e => setFormData({...formData, costCenter: e.target.value})}
                      >
                        <option value="">Selecione...</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.costCenter || d.name}>
                            {d.name} {d.costCenter ? `(${d.costCenter})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {formType === 'asset-type' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Comum (Equipamento)</label>
                    <input className="w-full p-4 rounded-2xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-600" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Ex: Macbook, Dell G15..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vincular à Conta Contábil</label>
                    <select 
                      className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold outline-none focus:ring-2 focus:ring-blue-600" 
                      value={formData.accountId || ''} 
                      onChange={e => setFormData({...formData, accountId: e.target.value})} 
                      required
                    >
                      <option value="">Selecione a Conta...</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-6 border-t border-slate-100">
                <button type="button" disabled={isSaving} onClick={() => setShowForm(false)} className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-colors">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-2 transition-all"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {isSaving ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountingManager;
