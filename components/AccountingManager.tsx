
import React, { useState } from 'react';
import { 
  Calculator, 
  Book, 
  Layers, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  X, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Briefcase,
  Tag,
  DollarSign,
  Loader2
} from 'lucide-react';
import { AccountingAccount, AccountingClassification, AssetTypeConfig } from '../types';

interface AccountingManagerProps {
  accounts: AccountingAccount[];
  classifications: AccountingClassification[];
  assetTypes: AssetTypeConfig[];
  onAddAccount: (acc: Omit<AccountingAccount, 'id'>) => Promise<void>;
  onUpdateAccount: (acc: AccountingAccount) => Promise<void>;
  onRemoveAccount: (id: string) => Promise<void>;
  onAddClassification: (cls: Omit<AccountingClassification, 'id'>) => Promise<void>;
  onUpdateClassification: (cls: AccountingClassification) => Promise<void>;
  onRemoveClassification: (id: string) => Promise<void>;
  onAddAssetType: (type: Omit<AssetTypeConfig, 'id'>) => Promise<void>;
  onUpdateAssetType: (type: AssetTypeConfig) => Promise<void>;
  onRemoveAssetType: (id: string) => Promise<void>;
}

const AccountingManager: React.FC<AccountingManagerProps> = ({
  accounts, classifications, assetTypes,
  onAddAccount, onUpdateAccount, onRemoveAccount,
  onAddClassification, onUpdateClassification, onRemoveClassification,
  onAddAssetType, onUpdateAssetType, onRemoveAssetType
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'classifications' | 'asset-types'>('accounts');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState<any>({});

  const handleTabChange = (tab: 'accounts' | 'classifications' | 'asset-types') => {
    setActiveSubTab(tab);
    setShowForm(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleOpenForm = (item: any = null) => {
    setEditingItem(item);
    if (activeSubTab === 'accounts') {
      setFormData(item || { code: '', name: '' });
    } else if (activeSubTab === 'classifications') {
      setFormData(item || { name: '', code: '', accountId: '' });
    } else {
      setFormData(item || { name: '', classificationId: '' });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (activeSubTab === 'accounts') {
        if (editingItem) await onUpdateAccount(formData);
        else await onAddAccount(formData);
      } else if (activeSubTab === 'classifications') {
        if (editingItem) await onUpdateClassification(formData);
        else await onAddClassification(formData);
      } else {
        if (editingItem) await onUpdateAssetType(formData);
        else await onAddAssetType(formData);
      }
      setShowForm(false);
      setEditingItem(null);
    } catch (err: any) {
      console.error("Erro Contabil:", err);
      alert(`Falha ao salvar: ${err.message || 'Erro desconhecido'}\n\nVerifique se as tabelas foram criadas no Supabase.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm(`Deseja realmente excluir este registro?`)) return;
    try {
      if (type === 'account') await onRemoveAccount(id);
      else if (type === 'classification') await onRemoveClassification(id);
      else await onRemoveAssetType(id);
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'N/A';
  const getClassificationName = (id: string) => classifications.find(c => c.id === id)?.name || 'N/A';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] p-2 border border-slate-100 shadow-sm flex gap-2">
        <button 
          onClick={() => handleTabChange('accounts')}
          className={`flex-1 py-4 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'accounts' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Contas Contábeis
        </button>
        <button 
          onClick={() => handleTabChange('classifications')}
          className={`flex-1 py-4 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'classifications' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'
          }`}
        >
          <Book className="w-4 h-4" /> Classificações
        </button>
        <button 
          onClick={() => handleTabChange('asset-types')}
          className={`flex-1 py-4 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'asset-types' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" /> Tipos de Ativos
        </button>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          {activeSubTab === 'accounts' && <><DollarSign className="w-7 h-7 text-blue-600" /> Gestão de Contas</>}
          {activeSubTab === 'classifications' && <><Book className="w-7 h-7 text-indigo-600" /> Classificações Contábeis</>}
          {activeSubTab === 'asset-types' && <><Layers className="w-7 h-7 text-emerald-600" /> Cadastro de Tipos</>}
        </h3>
        <button 
          onClick={() => handleOpenForm()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 flex items-center gap-2 transition-all transform active:scale-95 uppercase text-[10px] tracking-widest"
        >
          <Plus className="w-5 h-5" /> Adicionar Novo
        </button>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Informação Principal</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalhes / Vínculos</th>
              <th className="px-8 py-5 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeSubTab === 'accounts' && accounts.map(acc => (
              <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <p className="font-black text-slate-900 leading-none mb-1">{acc.name}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{acc.code}</p>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Conta Ativa</span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleOpenForm(acc)} className="p-2 text-slate-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(acc.id, 'account')} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {activeSubTab === 'classifications' && classifications.map(cls => (
              <tr key={cls.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <p className="font-black text-slate-900 leading-none mb-1">{cls.name}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{cls.code}</p>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-sm font-bold text-slate-600">{getAccountName(cls.accountId)}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleOpenForm(cls)} className="p-2 text-slate-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(cls.id, 'classification')} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {activeSubTab === 'asset-types' && assetTypes.map(type => (
              <tr key={type.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <p className="font-black text-slate-900 leading-none">{type.name}</p>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <Book className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-sm font-bold text-slate-600">{getClassificationName(type.classificationId || '')}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleOpenForm(type)} className="p-2 text-slate-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(type.id, 'asset-type')} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {((activeSubTab === 'accounts' && accounts.length === 0) || 
               (activeSubTab === 'classifications' && classifications.length === 0) || 
               (activeSubTab === 'asset-types' && assetTypes.length === 0)) && (
                <tr>
                  <td colSpan={3} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs opacity-50">
                    Nenhum registro encontrado nesta categoria.
                  </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tight">
                {editingItem ? 'Editar' : 'Cadastrar'} {activeSubTab === 'accounts' ? 'Conta' : activeSubTab === 'classifications' ? 'Classificação' : 'Tipo'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              {activeSubTab === 'accounts' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código da Conta</label>
                    <input className="w-full p-4 rounded-2xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-600" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required placeholder="Ex: 1.01.01.001" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Conta</label>
                    <input className="w-full p-4 rounded-2xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-600" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Ex: Notebooks e Desktop" />
                  </div>
                </>
              )}

              {activeSubTab === 'classifications' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código</label>
                    <input className="w-full p-4 rounded-2xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-600" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required placeholder="Ex: CLS-001" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Classificação</label>
                    <input className="w-full p-4 rounded-2xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-600" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Ex: Equipamentos de TI" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conta Contábil Vinculada</label>
                    <select className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold outline-none focus:ring-2 focus:ring-blue-600" value={formData.accountId} onChange={e => setFormData({...formData, accountId: e.target.value})} required>
                      <option value="">Selecione uma conta...</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              {activeSubTab === 'asset-types' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Tipo</label>
                    <input className="w-full p-4 rounded-2xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-600" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Ex: MacBook" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Classificação Contábil</label>
                    <select className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold outline-none focus:ring-2 focus:ring-blue-600" value={formData.classificationId} onChange={e => setFormData({...formData, classificationId: e.target.value})} required>
                      <option value="">Selecione uma classificação...</option>
                      {classifications.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-6 border-t border-slate-100">
                <button type="button" disabled={isSaving} onClick={() => setShowForm(false)} className="flex-1 py-4 font-bold text-slate-400">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSaving ? 'Salvando...' : 'Confirmar Salvar'}
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
