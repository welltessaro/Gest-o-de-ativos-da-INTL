
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
import { sendMaintenanceAlert } from '../services/telegramService';

interface MaintenanceManagerProps {
  assets: Asset[];
  employees: Employee[];
  companies: Department[];
  currentUser: UserAccount;
  onUpdateAsset: (asset: Asset) => Promise<void>;
  onAddNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => void;
  onAddRequest: (req: any) => Promise<void>;
}

const MaintenanceManager: React.FC<MaintenanceManagerProps> = ({ 
  assets, 
  employees, 
  companies, 
  currentUser, 
  onUpdateAsset, 
  onAddNotification, 
  onAddRequest 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState(''); // Novo estado para filtro de usuário
  
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

  const filteredAvailable = availableForMaintenance.filter(a => {
    const matchesSearch = a.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEmployee = employeeFilter ? a.assignedTo === employeeFilter : true;

    return matchesSearch && matchesEmployee;
  });

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
      
      // Envia notificação para o Telegram
      await sendMaintenanceAlert(updatedAsset, reason, currentUser);

      setShowModal(false);
      setSelectedAssetId('');
      setReason('');
      setEmployeeFilter('');
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
        employeeId: null,
        items: [poType],
        observation: `[MANUTENÇÃO] Aquisição de peça (${poType}) para reparo do ativo ${detailAsset.id}.\nDiagnóstico Atual: ${finalDiagnosis || detailAsset.observations}`,
        itemFulfillments: [{ 
          type: poType, 
          isPurchaseOrder: true, 
          purchaseStatus: 'Pendente',
          quotations: [
             { url: '', price: 0, deliveryPrediction: '' },
             { url: '', price: 0, deliveryPrediction: '' },
             { url: '', price: 0, deliveryPrediction: '' }
          ]
        }]
      });
      
      setShowPOForm(false);
      setShowDetailModal(false);
      setDetailAsset(null);
      setFinalDiagnosis('');

      onAddNotification({
        title: 'Solicitação de Compra',
        message: `Pedido de compra iniciado para ${poType} (Ref: ${detailAsset.id}).`,
        type: 'info',
        targetModule: 'purchase-orders'
      });
      alert("Fluxo de compra iniciado com sucesso!\nO modal de manutenção foi fechado. Acompanhe a cotação no módulo 'Pedidos de Compra'.");
    } catch (e: any) {
      console.error(e);
      const errorMsg = e?.message || "Erro desconhecido";
      alert("Erro ao iniciar fluxo de compra: " + errorMsg);
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
                 <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
              </div>

              <form onSubmit={handleOpenMaintenance} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecione o Equipamento</label>
                    
                    {/* Filtro de Colaborador */}
                    <div className="space-y-2">
                       <select 
                         className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
                         value={employeeFilter}
                         onChange={(e) => setEmployeeFilter(e.target.value)}
                       >
                          <option value="">Filtrar por Colaborador (Todos)</option>
                          {employees.map(emp => (
                             <option key={emp.id} value={emp.id}>{emp.name} — {emp.sector}</option>
                          ))}
                       </select>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-[2rem] border border-slate-200">
                       <div className="relative mb-4">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                          <input 
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-amber-500" 
                            placeholder="Buscar por ID, Marca ou Modelo..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                          />
                       </div>
                       <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                          {filteredAvailable.map(asset => (
                             <div 
                               key={asset.id}
                               onClick={() => setSelectedAssetId(asset.id)}
                               className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                 selectedAssetId === asset.id 
                                   ? 'bg-amber-100 border-amber-300 shadow-md' 
                                   : 'bg-white border-slate-100 hover:border-amber-200'
                               }`}
                             >
                                <div className="flex items-center gap-3">
                                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedAssetId === asset.id ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                      <Package className="w-4 h-4" />
                                   </div>
                                   <div>
                                      <p className="text-xs font-black text-slate-800">{asset.type} - {asset.brand} {asset.model}</p>
                                      <p className="text-[10px] text-slate-500 font-mono">{asset.id}</p>
                                   </div>
                                </div>
                                {selectedAssetId === asset.id && <CheckCircle2 className="w-5 h-5 text-amber-600" />}
                             </div>
                          ))}
                          {filteredAvailable.length === 0 && (
                            <p className="text-center py-4 text-xs font-bold text-slate-400 uppercase">Nenhum ativo disponível encontrado.</p>
                          )}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Relato do Problema / Motivo</label>
                    <textarea 
                      className="w-full p-6 rounded-[2rem] border border-slate-200 font-medium outline-none focus:ring-2 focus:ring-amber-500 h-32 bg-slate-50 focus:bg-white transition-colors"
                      placeholder="Descreva o defeito relatado pelo usuário ou motivo da manutenção preventiva..."
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      required
                    />
                 </div>
              </form>

              <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                 <button onClick={() => setShowModal(false)} className="px-8 py-4 font-bold text-slate-400 hover:bg-slate-100 rounded-2xl transition-all">Cancelar</button>
                 <button 
                   onClick={handleOpenMaintenance}
                   disabled={!selectedAssetId || !reason || isSubmitting}
                   className="px-10 py-4 bg-amber-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-100 flex items-center gap-2 hover:bg-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                   Confirmar Entrada
                 </button>
              </div>
           </div>
        </div>
      )}

      {showDetailModal && detailAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl h-full md:h-auto md:max-h-[95vh] md:rounded-[3rem] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                       <Activity className="w-7 h-7" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Diagnóstico & Reparo</h3>
                       <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{detailAsset.id} • {detailAsset.model}</p>
                    </div>
                 </div>
                 <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                    <X className="w-6 h-6 text-slate-400" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                 <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 space-y-2">
                    <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Motivo da Entrada
                    </h4>
                    <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">
                      "{detailAsset.observations}"
                    </p>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Laudo Técnico Final / Solução</label>
                       {validationError && <span className="text-[10px] font-bold text-rose-500 animate-pulse">Campo Obrigatório</span>}
                    </div>
                    <textarea 
                      className={`w-full p-6 rounded-[2rem] border ${validationError ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'} font-medium outline-none focus:ring-2 focus:ring-blue-500 h-40 bg-white shadow-sm`}
                      placeholder="Descreva o procedimento realizado, peças trocadas ou motivo da condenação do equipamento..."
                      value={finalDiagnosis}
                      onChange={e => {
                        setFinalDiagnosis(e.target.value);
                        if(e.target.value.trim()) setValidationError(false);
                      }}
                    />
                 </div>

                 {showPOForm && (
                   <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 animate-in slide-in-from-top-4">
                      <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <ShoppingCart className="w-4 h-4" /> Solicitar Peça de Reposição
                      </h4>
                      <div className="space-y-3">
                         <label className="text-[10px] font-bold text-slate-500 uppercase">Tipo de Peça</label>
                         <select 
                           className="w-full p-3 rounded-xl border border-blue-200 bg-white font-bold text-sm outline-none"
                           value={poType}
                           onChange={(e) => setPoType(e.target.value as AssetType)}
                         >
                            {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                         <div className="flex gap-2 pt-2">
                            <button 
                              onClick={() => setShowPOForm(false)}
                              className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-500"
                            >
                               Cancelar
                            </button>
                            <button 
                              onClick={handleCreatePurchaseOrder}
                              disabled={isSubmitting}
                              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-blue-700"
                            >
                               {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Abrir Pedido'}
                            </button>
                         </div>
                      </div>
                   </div>
                 )}
              </div>
              
              <div className="p-6 bg-slate-50 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
                 {!showPOForm && (
                   <button 
                     onClick={() => setShowPOForm(true)}
                     className="py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:border-blue-400 hover:text-blue-600 transition-all flex flex-col items-center justify-center gap-1"
                   >
                     <ShoppingCart className="w-4 h-4" />
                     Solicitar Peça
                   </button>
                 )}
                 
                 <button 
                   onClick={handleRetireAsset}
                   disabled={isSubmitting}
                   className="py-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-rose-100 hover:border-rose-300 transition-all flex flex-col items-center justify-center gap-1"
                 >
                   <Trash2 className="w-4 h-4" />
                   Condenar / Baixar
                 </button>

                 <button 
                   onClick={handleConcludeMaintenance}
                   disabled={isSubmitting}
                   className="py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex flex-col items-center justify-center gap-1 md:col-span-1"
                 >
                   <CheckCircle2 className="w-4 h-4" />
                   Concluir Reparo
                 </button>
              </div>
           </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default MaintenanceManager;
