
import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Search, 
  Plus, 
  X, 
  Activity, 
  ExternalLink, 
  CheckCircle2, 
  Package, 
  AlertCircle,
  Building2,
  Clock,
  ChevronRight,
  Info
} from 'lucide-react';
import { Asset, AssetStatus, Employee, Company } from '../types';

interface MaintenanceManagerProps {
  assets: Asset[];
  employees: Employee[];
  companies: Company[];
  onUpdateAsset: (asset: Asset) => void;
}

const MaintenanceManager: React.FC<MaintenanceManagerProps> = ({ assets, employees, companies, onUpdateAsset }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // States para o formulário de abertura de manutenção
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
    const asset = assets.find(a => a.id === selectedAssetId);
    if (!asset) return;

    const updatedAsset: Asset = {
      ...asset,
      status: 'Manutenção',
      observations: `[${maintenanceType} | ${maintenanceScope}] ${reason}`
    };

    onUpdateAsset(updatedAsset);
    setShowModal(false);
    setSelectedAssetId('');
    setReason('');
  };

  const handleConcludeMaintenance = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    const updatedAsset: Asset = {
      ...asset,
      status: 'Disponível',
      observations: `Manutenção concluída em ${new Date().toLocaleDateString('pt-BR')}. Equipamento retornado ao estoque.`
    };

    onUpdateAsset(updatedAsset);
  };

  const getCompanyName = (id: string) => companies.find(c => c.id === id)?.name || 'N/A';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Centro de Manutenção</h3>
          <p className="text-slate-500 font-medium italic">Gestão técnica de ativos fora de operação.</p>
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
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500">
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
                <Building2 className="w-3 h-3" /> {getCompanyName(asset.companyId)}
              </div>
            </div>

            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 mb-6 flex-1">
               <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <Info className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase">Laudo Técnico</span>
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
          <div className="col-span-full py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                <Wrench className="w-10 h-10 text-slate-200" />
             </div>
             <div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Fila de manutenção vazia</p>
                <p className="text-[10px] text-slate-300 font-medium max-w-xs mt-1">Todos os equipamentos estão em operação ou disponíveis em estoque.</p>
             </div>
          </div>
        )}
      </div>

      {/* MODAL: ABERTURA DE MANUTENÇÃO */}
      {showModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
              <div className="bg-amber-600 p-8 text-white flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                       <Wrench className="w-7 h-7" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black tracking-tight uppercase">Check-in de Oficina</h3>
                       <p className="text-amber-100 text-[10px] font-black uppercase tracking-widest leading-none">Início de processo de reparo/revisão</p>
                    </div>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <form onSubmit={handleOpenMaintenance} className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
                 {/* Seleção do Equipamento */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selecione o Ativo</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Filtrar..." 
                          className="pl-8 pr-4 py-1.5 rounded-full border border-slate-100 bg-slate-50 text-[10px] font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all w-48"
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                       {filteredAvailable.map(asset => (
                         <button 
                          key={asset.id}
                          type="button"
                          onClick={() => setSelectedAssetId(asset.id)}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                            selectedAssetId === asset.id 
                            ? 'bg-amber-50 border-amber-600 shadow-lg shadow-amber-50 scale-[1.01]' 
                            : 'bg-white border-slate-50 hover:border-slate-200'
                          }`}
                         >
                            <div className="flex items-center gap-3">
                               <Package className={`w-5 h-5 ${selectedAssetId === asset.id ? 'text-amber-600' : 'text-slate-300'}`} />
                               <div className="text-left">
                                  <p className="text-xs font-black text-slate-800 leading-none">{asset.id}</p>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">{asset.type} — {asset.brand}</p>
                               </div>
                            </div>
                            {selectedAssetId === asset.id && <ChevronRight className="w-4 h-4 text-amber-600" />}
                         </button>
                       ))}
                       {filteredAvailable.length === 0 && (
                         <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum ativo disponível</p>
                         </div>
                       )}
                    </div>
                 </div>

                 {/* Detalhes da Manutenção */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Intervenção</label>
                       <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                          <button 
                            type="button"
                            onClick={() => setMaintenanceType('Preventiva')}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              maintenanceType === 'Preventiva' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            Preventiva
                          </button>
                          <button 
                            type="button"
                            onClick={() => setMaintenanceType('Corretiva')}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              maintenanceType === 'Corretiva' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            Corretiva
                          </button>
                       </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Local do Serviço</label>
                       <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                          <button 
                            type="button"
                            onClick={() => setMaintenanceScope('Interna')}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              maintenanceScope === 'Interna' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            Interna
                          </button>
                          <button 
                            type="button"
                            onClick={() => setMaintenanceScope('Externa')}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              maintenanceScope === 'Externa' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            Externa
                          </button>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Motivo / Laudo Inicial</label>
                    <textarea 
                      className="w-full p-6 rounded-[2rem] border border-slate-200 bg-white focus:ring-2 focus:ring-amber-500 outline-none resize-none h-32 font-medium text-slate-700 shadow-sm"
                      placeholder="Descreva o problema ou o que será revisado..."
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      required
                    />
                 </div>

                 <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                       <p className="text-xs font-bold text-amber-800 leading-tight">O equipamento ficará indisponível para requisições até que o reparo seja concluído.</p>
                       <p className="text-[10px] text-amber-600 mt-1 uppercase font-black">Este registro aparecerá nos cards analíticos da diretoria.</p>
                    </div>
                 </div>

                 <button 
                  type="submit"
                  disabled={!selectedAssetId}
                  className={`w-full font-black py-5 rounded-[2rem] shadow-xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs ${
                    selectedAssetId 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-100' 
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                 >
                    <Wrench className="w-5 h-5" /> Confirmar Check-in em Oficina
                 </button>
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

export default MaintenanceManager;
