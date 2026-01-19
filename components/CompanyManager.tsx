
import React, { useState } from 'react';
import { Layers, Plus, Search, Trash2, Edit2, Package, X, ChevronRight, ShieldCheck } from 'lucide-react';
import { Department, Asset } from '../types';

interface CompanyManagerProps {
  companies: Department[];
  assets: Asset[];
  onAddCompany: (company: Omit<Department, 'id' | 'createdAt'>) => void;
  onUpdateCompany: (company: Department) => void;
  onRemoveCompany: (id: string) => void;
}

const CompanyManager: React.FC<CompanyManagerProps> = ({ companies, assets, onAddCompany, onUpdateCompany, onRemoveCompany }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', costCenter: '' });

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.costCenter?.includes(searchTerm)
  );

  const getAssetCount = (departmentId: string) => assets.filter(a => a.departmentId === departmentId).length;

  const handleEdit = (department: Department) => {
    setEditingCompany(department);
    setFormData({ name: department.name, costCenter: department.costCenter || '' });
    setShowForm(true);
  };

  const handleOpenCreate = () => {
    setEditingCompany(null);
    setFormData({ name: '', costCenter: '' });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCompany) {
      onUpdateCompany({
        ...editingCompany,
        name: formData.name,
        costCenter: formData.costCenter
      });
    } else {
      onAddCompany(formData);
    }
    setFormData({ name: '', costCenter: '' });
    setShowForm(false);
    setEditingCompany(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar departamento ou centro de custo..." 
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 flex items-center gap-2 transition-all transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Novo Departamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map(dept => (
          <div 
            key={dept.id} 
            onClick={() => handleEdit(dept)}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group relative overflow-hidden cursor-pointer active:scale-[0.98]"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">
                <Layers className="w-7 h-7" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm(`Deseja realmente remover o departamento ${dept.name}?`)) {
                      onRemoveCompany(dept.id);
                    }
                  }}
                  className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  title="Remover Departamento"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">{dept.name}</h4>
                <Edit2 className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{dept.costCenter || 'C. Custo não informado'}</p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-300" />
                <span className="text-sm font-black text-slate-700">{getAssetCount(dept.id)} Ativos</span>
              </div>
              <div className="flex items-center gap-1 text-blue-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                Editar <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        ))}

        {filteredCompanies.length === 0 && (
          <div className="col-span-full py-24 text-center flex flex-col items-center justify-center bg-white rounded-[3rem] border border-dashed border-slate-200">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Layers className="w-10 h-10 text-slate-200" />
             </div>
             <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Nenhum departamento encontrado</p>
             <button onClick={handleOpenCreate} className="mt-4 text-blue-600 font-bold hover:underline">Cadastrar primeiro departamento</button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className={`p-8 ${editingCompany ? 'bg-amber-600' : 'bg-blue-600'} text-white flex justify-between items-center transition-colors`}>
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    {editingCompany ? <Edit2 className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">
                      {editingCompany ? 'Editar Departamento' : 'Novo Departamento'}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Módulo de Estrutura Organizacional</p>
                  </div>
               </div>
               <button onClick={() => { setShowForm(false); setEditingCompany(null); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-6">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Departamento</label>
                  <input 
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold shadow-sm"
                    placeholder="Ex: Recursos Humanos"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                    autoFocus
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Centro de Custo (Opcional)</label>
                  <input 
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold shadow-sm"
                    placeholder="Ex: 2002-RH"
                    value={formData.costCenter}
                    onChange={e => setFormData({...formData, costCenter: e.target.value})}
                  />
               </div>

               <div className={`p-6 rounded-3xl flex items-start gap-4 border transition-all ${editingCompany ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                  <ShieldCheck className={`w-6 h-6 shrink-0 ${editingCompany ? 'text-amber-600' : 'text-blue-600'}`} />
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-tight">Vínculos de Auditoria</p>
                    <p className="text-[11px] font-bold leading-relaxed opacity-80">
                      Os ativos e colaboradores vinculados a este departamento aparecerão nos relatórios analíticos de Centro de Custo da diretoria.
                    </p>
                  </div>
               </div>

               <div className="flex gap-3">
                 <button 
                  type="button"
                  onClick={() => { setShowForm(false); setEditingCompany(null); }}
                  className="flex-1 py-5 rounded-[2rem] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest text-xs transition-colors"
                 >
                   Cancelar
                 </button>
                 <button 
                  type="submit"
                  className={`flex-[2] text-white font-black py-5 rounded-[2rem] shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs ${
                    editingCompany 
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' 
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                  }`}
                 >
                    {editingCompany ? 'Salvar Alterações' : 'Criar Departamento'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManager;
