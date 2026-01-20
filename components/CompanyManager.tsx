
import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Package, 
  X, 
  ChevronRight, 
  ShieldCheck, 
  FileText, 
  History, 
  TrendingUp, 
  Activity,
  ArrowRight,
  Clock,
  Briefcase,
  User,
  Heart
} from 'lucide-react';
import { Department, Asset, HistoryEntry } from '../types';

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
  const [selectedDeptForReport, setSelectedDeptForReport] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', costCenter: '' });

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.costCenter?.includes(searchTerm)
  );

  // Alterado para contar apenas ativos que NÃO estão baixados
  const getAssetCount = (departmentId: string) => assets.filter(a => a.departmentId === departmentId && a.status !== 'Baixado').length;

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

  const departmentAssets = useMemo(() => {
    if (!selectedDeptForReport) return [];
    return assets.filter(a => a.departmentId === selectedDeptForReport.id && a.status !== 'Baixado');
  }, [assets, selectedDeptForReport]);

  const healthScore = useMemo(() => {
    if (departmentAssets.length === 0) return 100;
    const maintenance = departmentAssets.filter(a => a.status === 'Manutenção').length;
    return Math.round(100 - (maintenance / departmentAssets.length * 100));
  }, [departmentAssets]);

  const aggregatedHistory = useMemo(() => {
    if (!selectedDeptForReport) return [];
    const allHistory: (HistoryEntry & { assetId: string; assetType: string })[] = [];
    
    // Pegamos ativos atuais e antigos vinculados a este depto para um histórico completo
    assets.filter(a => a.departmentId === selectedDeptForReport.id).forEach(asset => {
      (asset.history || []).forEach(entry => {
        allHistory.push({
          ...entry,
          assetId: asset.id,
          assetType: asset.type
        });
      });
    });

    return allHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [assets, selectedDeptForReport]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar departamento..." 
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
            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group relative overflow-hidden flex flex-col"
          >
            <div className="flex justify-between items-start mb-6">
              <div 
                onClick={() => handleEdit(dept)}
                className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm cursor-pointer"
              >
                <Layers className="w-7 h-7" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedDeptForReport(dept)}
                  className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                >
                  <FileText className="w-5 h-5" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm(`Deseja realmente remover ${dept.name}?`)) onRemoveCompany(dept.id);
                  }}
                  className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-1 cursor-pointer flex-1" onClick={() => setSelectedDeptForReport(dept)}>
              <h4 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">{dept.name}</h4>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{dept.costCenter || 'C. Custo não informado'}</p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-300" />
                <span className="text-sm font-black text-slate-700">{getAssetCount(dept.id)} Itens</span>
              </div>
              <button 
                onClick={() => setSelectedDeptForReport(dept)}
                className="flex items-center gap-1 text-blue-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0"
              >
                Relatório <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedDeptForReport && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              <div className="p-8 bg-slate-900 text-white flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                       <FileText className="w-7 h-7" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black tracking-tight">{selectedDeptForReport.name}</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mapa de Saúde e Inventário de Ativos</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedDeptForReport(null)} className="p-3 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-7 h-7" />
                 </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                 <div className="w-full lg:w-1/3 border-r border-slate-100 bg-slate-50/50 p-8 overflow-y-auto custom-scrollbar space-y-8">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm text-center">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Saúde Operacional</p>
                       <div className="flex items-center justify-center gap-2 mb-2">
                          <Heart className={`w-5 h-5 ${healthScore > 80 ? 'text-emerald-500 fill-emerald-500' : 'text-amber-500 fill-amber-500'}`} />
                          <span className="text-4xl font-black text-slate-900">{healthScore}%</span>
                       </div>
                       <p className="text-[9px] text-slate-500 font-bold uppercase">Índice de Ativos Disponíveis</p>
                    </div>

                    <div className="space-y-4">
                       <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Frota do Setor</h5>
                       {departmentAssets.map(asset => (
                         <div key={asset.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              asset.status === 'Em Uso' ? 'bg-emerald-50 text-emerald-600' : 
                              asset.status === 'Manutenção' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                            }`}>
                               <Package className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                               <p className="text-xs font-black text-slate-800 truncate">{asset.brand} {asset.model}</p>
                               <p className="text-[10px] font-mono text-slate-400 uppercase">{asset.status}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-white">
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-3">
                          <History className="w-5 h-5 text-blue-600" />
                          <h4 className="text-lg font-black text-slate-900 tracking-tight">Histórico Completo de Movimentação</h4>
                       </div>
                    </div>

                    <div className="relative pl-8 space-y-10 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                       {aggregatedHistory.map((entry, idx) => (
                         <div key={`${entry.id}-${idx}`} className="relative group">
                            <div className={`absolute -left-[30px] top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                              entry.type === 'Manutenção' ? 'bg-amber-500' :
                              entry.type === 'Atribuição' ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}>
                               <Clock className="w-3 h-3 text-white" />
                            </div>
                            <div className="space-y-1.5">
                               <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(entry.date).toLocaleDateString()}</span>
                                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[8px] font-black uppercase text-slate-500">
                                     {entry.assetType} • {entry.assetId}
                                  </span>
                               </div>
                               <p className="text-sm font-bold text-slate-800 leading-relaxed group-hover:text-blue-700 transition-colors">
                                  {entry.description}
                                </p>
                               <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                                  <ShieldCheck className="w-3 h-3" /> {entry.performedBy || 'Sistema'}
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
              
              <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end">
                 <button onClick={() => setSelectedDeptForReport(null)} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Fechar Relatório</button>
              </div>
           </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className={`p-8 ${editingCompany ? 'bg-amber-600' : 'bg-blue-600'} text-white flex justify-between items-center transition-colors`}>
               <h3 className="text-2xl font-black tracking-tight">{editingCompany ? 'Editar Departamento' : 'Novo Departamento'}</h3>
               <button onClick={() => { setShowForm(false); setEditingCompany(null); }} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome</label>
                  <input className="w-full p-4 rounded-2xl border border-slate-200 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Centro de Custo</label>
                  <input className="w-full p-4 rounded-2xl border border-slate-200 font-bold" value={formData.costCenter} onChange={e => setFormData({...formData, costCenter: e.target.value})} />
               </div>
               <div className="flex gap-3 pt-4">
                 <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-5 rounded-[2rem] font-black text-slate-400 uppercase tracking-widest text-xs">Cancelar</button>
                 <button type="submit" className={`flex-[2] text-white font-black py-5 rounded-[2rem] shadow-xl uppercase tracking-widest text-xs ${editingCompany ? 'bg-amber-600' : 'bg-blue-600'}`}>Salvar</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManager;
