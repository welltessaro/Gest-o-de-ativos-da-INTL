
import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Search, 
  Plus, 
  X, 
  Activity, 
  CheckCircle2, 
  Package, 
  AlertCircle,
  Building2,
  Clock,
  ChevronRight,
  Info,
  Layers,
  ArrowRight,
  User,
  Settings2
} from 'lucide-react';
import { Asset, HistoryEntry, Employee, Department } from '../types';

interface MaintenanceManagerProps {
  assets: Asset[];
  employees: Employee[];
  companies: Department[];
  onUpdateAsset: (asset: Asset) => void;
}

const MaintenanceManager: React.FC<MaintenanceManagerProps> = ({ assets, employees, companies, onUpdateAsset }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [maintenanceType, setMaintenanceType] = useState<'Preventiva' | 'Corretiva'>('Preventiva');
  const [maintenanceScope, setMaintenanceScope] = useState<'Interna' | 'Externa'>('Interna');
  const [reason, setReason] = useState('');

  const assetsInMaintenance = useMemo(() => 
    assets.filter(a => a.status === 'Manutenção')
  , [assets]);

  const availableForMaintenance = useMemo(() => 
    assets.filter(a => a.status !== 'Manutenção' && a.status !== 'Baixado')
  , [assets]);

  const filteredAvailable = availableForMaintenance.filter(a => 
    a.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) return;

    const asset = assets.find(a => a.id === selectedAssetId);
    if (!asset) return;

    const historyEntry: HistoryEntry = {
      id: Math.random().toString(),
      date: new Date().toISOString(),
      type: 'Manutenção',
      description: `Início de manutenção ${maintenanceType} (${maintenanceScope}). Motivo: ${reason}`,
      performedBy: 'Técnico de TI',
      userContext: getEmployeeName(asset.assignedTo)
    };

    const updatedAsset: Asset = {
      ...asset,
      status: 'Manutenção',
      observations: reason,
      history: [...(asset.history || []), historyEntry]
    };

    onUpdateAsset(updatedAsset);
    setShowModal(false);
    setSelectedAssetId('');
    setReason('');
    setSearchTerm('');
  };

  const handleConcludeMaintenance = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    const historyEntry: HistoryEntry = {
      id: Math.random().toString(),
      date: new Date().toISOString(),
      type: 'Manutenção',
      description: `Manutenção concluída. Equipamento revisado e retornado ao estoque.`,
      performedBy: 'Técnico de TI'
    };

    const updatedAsset: Asset = {
      ...asset,
      status: 'Disponível',
      assignedTo: undefined, // Ao sair da manutenção, volta para o estoque disponível
      observations: `Última manutenção em ${new Date().toLocaleDateString('pt-BR')}`,
      history: [...(asset.history || []), historyEntry]
    };

    onUpdateAsset(updatedAsset);
  };

  const getDepartmentName = (id: string) => companies.find(c => c.id === id)?.name || 'N/A';
  const getEmployeeName = (id?: string) => employees.find(e => e.id === id)?.name || 'N/A';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Centro de Manutenção</h3>
          <p className="text-slate-500 font-medium italic">Gestão técnica e histórico de reparos.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-amber-100 flex items-center gap-2 transition-all transform active:scale-95"
        >
          <Wrench className="w-5 h-5" />
          Abrir Manutenção
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assetsInMaintenance.map(asset => (
          <div key={asset.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-amber-100 shadow-sm hover:shadow-md transition-all group flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 shadow-sm">
                <Activity className="w-7 h-7" />
              </div>
              <div className="flex flex-col items-end">
                 <span className="bg-amber-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-1 shadow-lg shadow-amber-100">
                    Em Manutenção
                 </span>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter font-mono">{asset.id}</p>
              </div>
            </div>

            <div className="space-y-1 mb-6">
              <h4 className="text-xl font-black text-slate-800 tracking-tight leading-none">{asset.type}</h4>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{asset.brand} {asset.model}</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase pt-2">
                <Layers className="w-3 h-3" /> {getDepartmentName(asset.departmentId)}
              </div>
            </div>

            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 mb-6 flex-1">
               <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <Info className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Diagnóstico de Entrada</span>
               </div>
               <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                 "{asset.observations}"
               </p>
            </div>

            <button 
              onClick={() => handleConcludeMaintenance(asset.id)}
              className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Concluir Reparo
            </button>
          </div>
        ))}

        {assetsInMaintenance.length === 0 && (
          <div className="col-span-full py-32 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Settings2 className="w-10 h-10 text-slate-200" />
             </div>
             <div>
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Sem Ativos em Manutenção</p>
                <p className="text-[10px] text-slate-300 font-bold uppercase mt-1">Todos os equipamentos estão operacionais ou em estoque.</p>
             </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 bg-amber-600 text-white flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                       <Wrench className="w-7 h-7" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black tracking-tight">Nova Ordem de Serviço</h3>
                       <p className="text-amber-100 text-[10px] font-black uppercase tracking-widest">Rastreio e Histórico Técnico</p>
                    </div>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                 <div className="w-full lg:w-1/2 border-r border-slate-100 flex flex-col p-8 bg-slate-50/50">
                    <div className="relative mb-6">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                       <input 
                         type="text"
                         placeholder="Buscar por ID ou Modelo..."
                         className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white outline-none font-bold"
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                       />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                       {filteredAvailable.map(asset => (
                         <button 
                          key={asset.id}
                          onClick={() => setSelectedAssetId(asset.id)}
                          className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                            selectedAssetId === asset.id 
                              ? 'bg-amber-600 border-amber-600 text-white shadow-xl' 
                              : 'bg-white border-slate-200 text-slate-800 hover:border-amber-300'
                          }`}
                         >
                            <div className="flex items-center gap-3">
                               <Package className={`w-5 h-5 ${selectedAssetId === asset.id ? 'text-white' : 'text-slate-400'}`} />
                               <div className="text-left">
                                  <p className="text-xs font-black uppercase tracking-tight">{asset.type}</p>
                                  <p className={`text-[10px] font-bold ${selectedAssetId === asset.id ? 'text-amber-100' : 'text-slate-500'}`}>
                                    {asset.brand} {asset.model} • {asset.id}
                                  </p>
                               </div>
                            </div>
                            <ArrowRight className={`w-4 h-4 transition-transform ${selectedAssetId === asset.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                         </button>
                       ))}
                    </div>
                 </div>
                 <div className="flex-1 p-8 bg-white overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleOpenMaintenance} className="space-y-8">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tipo</label>
                             <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button type="button" onClick={() => setMaintenanceType('Preventiva')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-lg transition-all ${maintenanceType === 'Preventiva' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Prev.</button>
                                <button type="button" onClick={() => setMaintenanceType('Corretiva')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-lg transition-all ${maintenanceType === 'Corretiva' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Corr.</button>
                             </div>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Escopo</label>
                             <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button type="button" onClick={() => setMaintenanceScope('Interna')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-lg transition-all ${maintenanceScope === 'Interna' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Int.</button>
                                <button type="button" onClick={() => setMaintenanceScope('Externa')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-lg transition-all ${maintenanceScope === 'Externa' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Ext.</button>
                             </div>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Laudo de Entrada</label>
                          <textarea 
                            className="w-full p-5 rounded-[2rem] border border-slate-200 bg-slate-50 outline-none resize-none h-40 font-medium text-slate-700 placeholder:text-slate-400"
                            placeholder="Descreva o problema ou as ações preventivas..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                          />
                       </div>
                       <button 
                        type="submit"
                        disabled={!selectedAssetId}
                        className={`w-full py-5 rounded-[2rem] font-black shadow-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3 ${
                          selectedAssetId ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        }`}
                       >
                          <Wrench className="w-5 h-5" /> Abrir OS e Salvar Histórico
                       </button>
                    </form>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceManager;
