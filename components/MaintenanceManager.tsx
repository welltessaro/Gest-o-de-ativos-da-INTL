
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
  Settings2,
  ShoppingCart,
  Trash2,
  FileText,
  Zap,
  Loader2,
  History
} from 'lucide-react';
import { Asset, HistoryEntry, Employee, Department, AppNotification, EquipmentRequest, AssetType, UserAccount } from '../types';
import { ASSET_TYPES } from '../constants';

interface MaintenanceManagerProps {
  assets: Asset[];
  employees: Employee[];
  companies: Department[];
  currentUser: UserAccount;
  onUpdateAsset: (asset: Asset) => Promise<void>;
  onAddNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => void;
  onAddRequest: (req: any) => Promise<void>;
}

const MaintenanceManager: React.FC<MaintenanceManagerProps> = ({ assets, employees, companies, currentUser, onUpdateAsset, onAddNotification, onAddRequest }) => {
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  
  const [reason, setReason] = useState('');
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPOForm, setShowPOForm] = useState(false);
  const [poType, setPoType] = useState<AssetType>('Mouse');
  const [validationError, setValidationError] = useState(false);

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

  const handleOpenMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !reason.trim()) return;

    const asset = assets.find(a => a.id === selectedAssetId);
    if (!asset) return;

    setIsSubmitting(true);
    try {
      const historyEntry: HistoryEntry = {
        id: `HIST-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'Manutenção',
        description: `Entrada em manutenção: ${reason}`,
        performedBy: currentUser.name
      };

      const updatedAsset: Asset = {
        ...asset,
        status: 'Manutenção',
        observations: reason,
        history: [...(asset.history || []), historyEntry]
      };

      await onUpdateAsset(updatedAsset);
      setShowModal(false);
      setSelectedAssetId('');
      setReason('');
    } catch (error) {
      alert("Erro ao iniciar manutenção.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConcludeMaintenance = async () => {
    if (!detailAsset) return;
    
    const diagnosis = finalDiagnosis.trim();
    if (!diagnosis) {
      setValidationError(true);
      return;
    }

    setIsSubmitting(true);
    setValidationError(false);
    try {
      const historyEntry: HistoryEntry = {
        id: `HIST-CONC-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'Manutenção',
        description: `Manutenção concluída. Laudo: ${diagnosis}`,
        performedBy: currentUser.name
      };

      const updatedAsset: Asset = {
        ...detailAsset,
        status: 'Disponível',
        assignedTo: undefined, // Libera o colaborador anterior
        observations: `Reparo finalizado em ${new Date().toLocaleDateString()}: ${diagnosis}`,
        history: [...(detailAsset.history || []), historyEntry]
      };

      await onUpdateAsset(updatedAsset);
      alert("Manutenção concluída com sucesso! O ativo está disponível para uso.");
      setShowDetailModal(false);
      setDetailAsset(null);
      setFinalDiagnosis('');
    } catch (error: any) {
      alert("Falha ao concluir: " + (error.message || "Erro de rede"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetireAsset = async () => {
    if (!detailAsset) return;
    
    const diagnosis = finalDiagnosis.trim();
    if (!diagnosis) {
      setValidationError(true);
      return;
    }
    
    if (!window.confirm("CONFIRMAÇÃO CRÍTICA: Deseja realmente realizar a BAIXA PATRIMONIAL permanente deste ativo? Esta ação removerá o ativo de circulação.")) {
      return;
    }

    setIsSubmitting(true);
    setValidationError(false);
    try {
      const historyEntry: HistoryEntry = {
        id: `HIST-BAIXA-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'Status',
        description: `BAIXA PATRIMONIAL DEFINITIVA: ${diagnosis}`,
        performedBy: currentUser.name
      };

      const updatedAsset: Asset = {
        ...detailAsset,
        status: 'Baixado',
        assignedTo: undefined, // Crucial: limpar vínculo
        departmentId: detailAsset.departmentId, // Mantemos depto original p/ histórico
        observations: `ATIVO INATIVADO/BAIXADO EM ${new Date().toLocaleDateString()}: ${diagnosis}`,
        history: [...(detailAsset.history || []), historyEntry]
      };

      console.log("[Maintenance] Executando baixa para:", updatedAsset.id);
      await onUpdateAsset(updatedAsset);
      
      onAddNotification({
        title: 'Baixa de Patrimônio',
        message: `O ativo ${detailAsset.id} foi inativado permanentemente.`,
        type: 'alert',
        targetModule: 'assets'
      });

      alert(`Baixa patrimonial do ativo ${detailAsset.id} realizada com sucesso!`);
      setShowDetailModal(false);
      setDetailAsset(null);
      setFinalDiagnosis('');
    } catch (error: any) {
      console.error("Erro na baixa:", error);
      alert("Erro ao processar baixa patrimonial: " + (error.message || "Verifique a conexão ou permissões."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePurchaseOrder = async () => {
    if (!detailAsset) return;
    setIsSubmitting(true);
    try {
      await onAddRequest({
        requesterId: currentUser.id,
        employeeId: '', 
        items: [poType],
        observation: `Peça p/ Manutenção ${detailAsset.id}: ${poType}`,
        itemFulfillments: [{ type: poType, isPurchaseOrder: true, purchaseStatus: 'Pendente' }]
      });
      setShowPOForm(false);
      alert("Solicitação de peça enviada para Compras.");
    } catch (e) {
      alert("Erro ao solicitar peça.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Centro de Manutenção</h3>
          <p className="text-slate-500 font-medium italic">Gestão técnica e descarte de equipamentos.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-amber-100 flex items-center gap-2 transition-all transform active:scale-95"
        >
          <Wrench className="w-5 h-5" />
          Nova Entrada de Reparo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assetsInMaintenance.map(asset => (
          <div 
            key={asset.id} 
            onClick={() => {
              if (isSubmitting) return;
              setDetailAsset(asset);
              setFinalDiagnosis(''); 
              setValidationError(false);
              setShowDetailModal(true);
            }}
            className="bg-white p-6 rounded-[2.5rem] border-2 border-amber-100 shadow-sm hover:shadow-xl hover:border-amber-400 transition-all group flex flex-col cursor-pointer active:scale-95"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 shadow-sm">
                <Activity className="w-7 h-7" />
              </div>
              <div className="flex flex-col items-end">
                 <span className="bg-amber-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-1 shadow-lg shadow-amber-100">
                    Em Reparo
                 </span>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter font-mono">{asset.id}</p>
              </div>
            </div>

            <div className="space-y-1 mb-6">
              <h4 className="text-xl font-black text-slate-800 tracking-tight leading-none group-hover:text-amber-600 transition-colors">{asset.type}</h4>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{asset.brand} {asset.model}</p>
            </div>

            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 mb-6 flex-1">
               <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <Info className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Diagnóstico Inicial</span>
               </div>
               <p className="text-xs text-slate-600 font-medium leading-relaxed italic line-clamp-3">
                 "{asset.observations}"
               </p>
            </div>

            <div className="flex items-center justify-between text-amber-600 font-black text-[10px] uppercase tracking-widest pt-2 border-t border-amber-100">
               <span>Painel de Encerramento</span>
               <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}

        {assetsInMaintenance.length === 0 && (
          <div className="col-span-full py-32 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Settings2 className="w-10 h-10 text-slate-200" />
             </div>
             <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Sem Ativos em Manutenção</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 bg-amber-600 text-white flex items-center justify-between">
                 <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                   <Wrench className="w-7 h-7" /> Entrada em Manutenção
                 </h3>
                 <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                 <div className="w-full lg:w-1/2 border-r border-slate-100 flex flex-col p-8 bg-slate-50/50 overflow-y-auto custom-scrollbar">
                    <div className="relative mb-6">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                       <input 
                         type="text"
                         placeholder="Buscar por Patrimônio..."
                         className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white outline-none font-bold shadow-sm"
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                       />
                    </div>
                    <div className="space-y-3">
                       {filteredAvailable.map(asset => (
                         <button 
                          key={asset.id}
                          type="button"
                          onClick={() => setSelectedAssetId(asset.id)}
                          className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                            selectedAssetId === asset.id 
                              ? 'bg-amber-600 border-amber-600 text-white shadow-xl' 
                              : 'bg-white border-slate-200 text-slate-800 hover:border-amber-300'
                          }`}
                         >
                            <div className="text-left">
                               <p className="text-xs font-black uppercase tracking-tight">{asset.type}</p>
                               <p className={`text-[10px] font-bold ${selectedAssetId === asset.id ? 'text-amber-100' : 'text-slate-500'}`}>
                                 {asset.brand} {asset.model} • {asset.id}
                               </p>
                            </div>
                         </button>
                       ))}
                    </div>
                 </div>
                 <div className="flex-1 p-8 bg-white overflow-y-auto">
                    <form onSubmit={handleOpenMaintenance} className="space-y-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Diagnóstico Inicial</label>
                          <textarea 
                            className="w-full p-5 rounded-[2rem] border border-slate-200 bg-slate-50 outline-none resize-none h-40 font-medium text-slate-700"
                            placeholder="Descreva o problema observado..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                          />
                       </div>
                       <button 
                        type="submit"
                        disabled={!selectedAssetId || isSubmitting}
                        className={`w-full py-5 rounded-[2rem] font-black shadow-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3 ${
                          selectedAssetId && !isSubmitting ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-slate-100 text-slate-300'
                        }`}
                       >
                          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                          {isSubmitting ? 'Iniciando...' : 'Confirmar Entrada'}
                       </button>
                    </form>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showDetailModal && detailAsset && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
              <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-600 rounded-2xl flex items-center justify-center">
                       <Settings2 className="w-7 h-7" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black tracking-tight">{detailAsset.id}</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Encerramento de Ordem Técnica</p>
                    </div>
                 </div>
                 <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                       <History className="w-4 h-4 text-amber-500" /> Diagnóstico Inicial de Entrada
                    </label>
                    <div className="w-full p-6 rounded-[2.5rem] bg-slate-50 border-2 border-slate-100 font-bold text-slate-500 italic">
                       "{detailAsset.observations}"
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between items-center ml-1">
                      <label className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${validationError ? 'text-rose-500' : 'text-blue-600'}`}>
                         <FileText className="w-4 h-4" /> Laudo Técnico / Justificativa (Obrigatório)
                      </label>
                      {validationError && <span className="text-[9px] font-black text-rose-500 uppercase animate-pulse">Preenchimento Necessário</span>}
                    </div>
                    <textarea 
                      className={`w-full p-6 rounded-[2.5rem] bg-white border-2 outline-none font-bold text-slate-800 min-h-[160px] resize-none transition-all ${validationError ? 'border-rose-300 ring-2 ring-rose-100 shadow-lg shadow-rose-100' : 'border-slate-200 focus:border-blue-500'}`}
                      placeholder="Relate os procedimentos realizados ou o motivo técnico para a baixa patrimonial..."
                      value={finalDiagnosis}
                      onChange={(e) => {
                        setFinalDiagnosis(e.target.value);
                        if (e.target.value.trim()) setValidationError(false);
                      }}
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <button 
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setShowPOForm(!showPOForm)}
                      className="w-full p-5 rounded-2xl border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-50"
                    >
                       <ShoppingCart className="w-5 h-5 text-blue-600" />
                       <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">Solicitar Peças</span>
                    </button>

                    <button 
                      type="button"
                      onClick={handleRetireAsset}
                      disabled={isSubmitting}
                      className={`w-full p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-50 ${validationError ? 'border-rose-400 bg-rose-50 animate-bounce' : 'border-slate-100 hover:border-rose-600 hover:bg-rose-50/30'}`}
                    >
                       <Trash2 className={`w-5 h-5 ${validationError ? 'text-rose-600' : 'text-rose-500'}`} />
                       <span className={`text-[11px] font-black uppercase tracking-widest ${validationError ? 'text-rose-800' : 'text-rose-700'}`}>Baixa / Inativar</span>
                    </button>
                 </div>

                 {showPOForm && (
                    <div className="bg-blue-50 p-6 rounded-[2rem] border-2 border-blue-100 space-y-4 animate-in slide-in-from-top-2">
                       <select 
                          className="w-full p-4 rounded-xl bg-white border border-blue-200 font-bold outline-none"
                          value={poType}
                          onChange={(e) => setPoType(e.target.value as AssetType)}
                       >
                          {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                       <button 
                          type="button"
                          onClick={handleCreatePurchaseOrder}
                          disabled={isSubmitting}
                          className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg uppercase tracking-widest text-[10px] disabled:opacity-50"
                       >
                          Confirmar Pedido de Peça
                       </button>
                    </div>
                 )}

                 <div className="pt-6">
                    <button 
                      type="button"
                      onClick={handleConcludeMaintenance}
                      disabled={isSubmitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:bg-slate-400"
                    >
                       {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                       {isSubmitting ? 'Salvando...' : 'Concluir e Liberar p/ Uso'}
                    </button>
                 </div>
              </div>
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

export default MaintenanceManager;
