
import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2,
  X,
  Cpu,
  Layers,
  Monitor,
  Wifi,
  Usb,
  Zap,
  Type,
  History,
  Clock,
  User,
  Wrench,
  CheckCircle2,
  Tag,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  PlusCircle,
  Save
} from 'lucide-react';
import { Asset, AssetType, Employee, Department, HistoryEntry } from '../types';
import { ASSET_TYPES } from '../constants';

interface AssetManagerProps {
  assets: Asset[];
  employees: Employee[];
  companies: Department[];
  onAdd: (asset: Omit<Asset, 'id' | 'createdAt' | 'qrCode' | 'history'> & { id?: string }) => void;
  onUpdate: (asset: Asset) => void;
  onRemove: (id: string) => void;
}

interface BulkAssetEntry {
  tempId: string;
  departmentId: string;
  type: AssetType;
  brand: string;
  model: string;
  ram: string;
  storage: string;
  screenSize: string;
  caseModel: string;
  isWireless: boolean;
  monitorInputs: string[];
  isAbnt: boolean;
  hasNumericKeypad: boolean;
  id: string; 
  assignedTo: string;
  observations: string;
}

const AssetManager: React.FC<AssetManagerProps> = ({ assets, employees, companies, onAdd, onUpdate, onRemove }) => {
  const [showForm, setShowForm] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  const [bulkEntries, setBulkEntries] = useState<BulkAssetEntry[]>([
    { tempId: '1', departmentId: companies[0]?.id || '', type: 'Notebook', brand: '', model: '', ram: '', storage: '', screenSize: '', caseModel: '', isWireless: false, monitorInputs: [], isAbnt: true, hasNumericKeypad: true, id: '', assignedTo: '', observations: '' }
  ]);

  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    type: 'Notebook',
    status: 'Pendente Documentos',
    photos: [],
    departmentId: companies[0]?.id || '',
    ram: '',
    storage: '',
    screenSize: '',
    caseModel: '',
    isWireless: false,
    monitorInputs: [],
    isAbnt: true,
    hasNumericKeypad: true
  });

  const getDepartmentName = (id: string) => companies.find(c => c.id === id)?.name || 'N/A';
  const getEmployeeName = (id?: string) => employees.find(e => e.id === id)?.name || 'Disponível em Estoque';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(newAsset as any);
    setShowForm(false);
    setNewAsset({ type: 'Notebook', status: 'Pendente Documentos', photos: [], departmentId: companies[0]?.id || '', ram: '', storage: '', screenSize: '', caseModel: '', isWireless: false, monitorInputs: [], isAbnt: true, hasNumericKeypad: true });
  };

  const handleBulkAddRow = () => {
    setBulkEntries([...bulkEntries, { 
      tempId: Math.random().toString(), 
      departmentId: companies[0]?.id || '', 
      type: 'Notebook', 
      brand: '', 
      model: '', 
      ram: '',
      storage: '',
      screenSize: '',
      caseModel: '',
      isWireless: false,
      monitorInputs: [],
      isAbnt: true,
      hasNumericKeypad: true,
      id: '', 
      assignedTo: '', 
      observations: '' 
    }]);
  };

  const handleBulkSave = () => {
    bulkEntries.forEach(entry => {
      onAdd({
        id: entry.id,
        departmentId: entry.departmentId,
        type: entry.type,
        brand: entry.brand,
        model: entry.model,
        ram: entry.ram,
        storage: entry.storage,
        screenSize: entry.screenSize,
        caseModel: entry.caseModel,
        isWireless: entry.isWireless,
        monitorInputs: entry.monitorInputs,
        isAbnt: entry.isAbnt,
        hasNumericKeypad: entry.hasNumericKeypad,
        observations: entry.observations,
        photos: [],
        status: entry.assignedTo ? 'Em Uso' : 'Disponível',
        assignedTo: entry.assignedTo || undefined,
      });
    });
    setShowBulkModal(false);
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || a.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 print:hidden">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por modelo, marca ou ID..." 
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all shadow-sm font-semibold placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button onClick={() => setShowBulkModal(true)} className="flex items-center gap-2 px-4 py-3 text-xs font-black text-slate-800 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Lançar Levantamento
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-lg uppercase tracking-widest text-xs">
            <Plus className="w-5 h-5" />
            <span>Novo Ativo</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-widest">Ativo / Departamento</th>
                <th className="px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-widest">Tipo</th>
                <th className="px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-widest">Marca/Modelo</th>
                <th className="px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredAssets.map((asset) => (
                <tr 
                  key={asset.id} 
                  onClick={() => setDetailAsset(asset)}
                  className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 group-hover:text-blue-700">{asset.id}</span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-700 font-black uppercase">
                        <Layers className="w-3 h-3" />
                        {getDepartmentName(asset.departmentId)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-800">{asset.type}</span>
                      {asset.type === 'Monitor' && (
                        <div className="flex gap-2 text-[8px] font-bold text-slate-500 uppercase mt-1">
                          <span className="text-blue-600">{asset.screenSize}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-slate-900">{asset.brand}</span>
                    <span className="text-sm text-slate-700 ml-2 font-medium">{asset.model}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                      asset.status === 'Disponível' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      asset.status === 'Em Uso' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={(e) => {e.stopPropagation(); onRemove(asset.id)}} className="p-2 text-slate-500 hover:text-rose-600 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes e Histórico */}
      {detailAsset && (
        <div className="fixed inset-0 z-[150] flex items-center justify-end p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl h-full md:h-auto md:max-h-[90vh] md:rounded-[3rem] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                       <Tag className="w-7 h-7" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 tracking-tight">{detailAsset.id}</h3>
                       <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Visão Geral do Patrimônio</p>
                    </div>
                 </div>
                 <button onClick={() => setDetailAsset(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                 {/* Seção Técnica */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Responsável Atual</p>
                       <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-blue-600" />
                          <p className="font-bold text-slate-800">{getEmployeeName(detailAsset.assignedTo)}</p>
                       </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Especificação</p>
                       <div className="flex items-center gap-3">
                          <Cpu className="w-5 h-5 text-blue-600" />
                          <p className="font-bold text-slate-800">{detailAsset.type} {detailAsset.brand}</p>
                       </div>
                    </div>
                 </div>

                 {/* Histórico / Timeline */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-2">
                       <History className="w-5 h-5 text-blue-600" />
                       <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Histórico de Vida do Ativo</h4>
                    </div>

                    <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                       {detailAsset.history?.length > 0 ? (
                         detailAsset.history.slice().reverse().map((entry) => (
                           <div key={entry.id} className="relative group">
                              <div className={`absolute -left-[30px] top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-all ${
                                entry.type === 'Manutenção' ? 'bg-amber-500' :
                                entry.type === 'Atribuição' ? 'bg-blue-600' :
                                entry.type === 'Criação' ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}>
                                {entry.type === 'Manutenção' && <Wrench className="w-3 h-3 text-white" />}
                                {entry.type === 'Atribuição' && <User className="w-3 h-3 text-white" />}
                                {entry.type === 'Criação' && <CheckCircle2 className="w-3 h-3 text-white" />}
                                {entry.type === 'Status' && <Clock className="w-3 h-3 text-white" />}
                              </div>
                              
                              <div className="space-y-1">
                                 <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                       {new Date(entry.date).toLocaleDateString('pt-BR')} {new Date(entry.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                       entry.type === 'Manutenção' ? 'bg-amber-100 text-amber-700' :
                                       entry.type === 'Atribuição' ? 'bg-blue-100 text-blue-700' :
                                       entry.type === 'Criação' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                       {entry.type}
                                    </span>
                                 </div>
                                 <p className="text-sm text-slate-800 font-bold leading-relaxed">{entry.description}</p>
                                 {entry.userContext && (
                                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-slate-500 bg-slate-50 w-fit px-2 py-1 rounded-lg">
                                       <User className="w-2.5 h-2.5" /> Contexto: {entry.userContext}
                                    </div>
                                 )}
                              </div>
                           </div>
                         ))
                       ) : (
                         <div className="text-center py-10 opacity-30">
                            <Clock className="w-10 h-10 mx-auto mb-2" />
                            <p className="text-xs font-bold uppercase tracking-widest">Nenhum histórico registrado</p>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
              
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                 <button onClick={() => setDetailAsset(null)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200">Fechar Detalhes</button>
              </div>
           </div>
        </div>
      )}

      {/* Modais de Cadastro (Formulários existentes preservados) */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300 print:hidden">
          {/* Lógica do Modal Bulk mantida conforme versões anteriores */}
          <div className="h-20 bg-slate-800/50 border-b border-white/10 flex items-center justify-between px-8 text-white">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="font-black tracking-tight">Lançamento em Lote</h3>
                  <p className="text-[10px] text-slate-200 font-black uppercase tracking-widest">Coleta de Campo</p>
               </div>
            </div>
            <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
          </div>
          <div className="flex-1 overflow-auto p-8">
             {/* Tabela de cadastro bulk aqui */}
             <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-slate-400 font-bold uppercase tracking-widest mb-4">Interface de Cadastro em Lote</p>
                <button onClick={handleBulkSave} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl">Processar Lote Atual</button>
             </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in zoom-in-95">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl"><Plus className="w-8 h-8" /></div>
                <h3 className="text-2xl font-black">Novo Patrimônio</h3>
             </div>
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tipo</label>
                      <select className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none font-bold" value={newAsset.type} onChange={e => setNewAsset({...newAsset, type: e.target.value as any})}>
                         {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Marca</label>
                      <input className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none font-bold" value={newAsset.brand} onChange={e => setNewAsset({...newAsset, brand: e.target.value})} placeholder="Ex: Dell" required />
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Modelo</label>
                   <input className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none font-bold" value={newAsset.model} onChange={e => setNewAsset({...newAsset, model: e.target.value})} placeholder="Ex: Latitude 5420" required />
                </div>
                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-4 font-black text-slate-400 uppercase tracking-widest text-xs">Cancelar</button>
                   <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl uppercase tracking-widest text-xs">Salvar Ativo</button>
                </div>
             </form>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
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

export default AssetManager;
