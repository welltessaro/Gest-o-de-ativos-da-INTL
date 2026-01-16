
import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  X, 
  Clock, 
  ChevronRight, 
  CheckCircle, 
  ShoppingCart, 
  Link as LinkIcon, 
  Search, 
  AlertCircle,
  User,
  Calendar,
  Package,
  Check,
  Ban,
  Truck,
  MessageSquare,
  CheckSquare,
  Wrench
} from 'lucide-react';
import { EquipmentRequest, Employee, Asset, AssetType, ItemFulfillment } from '../types';
import { ASSET_TYPES } from '../constants';

interface RequestsManagerProps {
  requests: EquipmentRequest[];
  employees: Employee[];
  assets: Asset[];
  onAddRequest: (req: Omit<EquipmentRequest, 'id' | 'createdAt' | 'status'>) => void;
  onUpdateStatus: (id: string, status: EquipmentRequest['status']) => void;
  onUpdateRequest: (req: EquipmentRequest) => void;
}

const RequestsManager: React.FC<RequestsManagerProps> = ({ requests, employees, assets, onAddRequest, onUpdateStatus, onUpdateRequest }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EquipmentRequest | null>(null);
  const [itemToLink, setItemToLink] = useState<{ index: number; type: AssetType } | null>(null);
  const [newReq, setNewReq] = useState<Omit<EquipmentRequest, 'id' | 'createdAt' | 'status'>>({
    requesterId: '2', 
    employeeId: '',
    items: [],
    observation: ''
  });

  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Desconhecido';
  const getEmployeeSector = (id: string) => employees.find(e => e.id === id)?.sector || 'Setor não informado';

  const toggleItem = (type: AssetType) => {
    setNewReq(prev => ({
      ...prev,
      items: prev.items.includes(type) ? prev.items.filter(i => i !== type) : [...prev.items, type]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRequest(newReq);
    setShowModal(false);
    setNewReq({ requesterId: '2', employeeId: '', items: [], observation: '' });
  };

  const handleLinkAsset = (index: number, assetId: string) => {
    if (!selectedRequest) return;
    const newFulfillments = [...(selectedRequest.itemFulfillments || [])];
    newFulfillments[index] = {
      type: selectedRequest.items[index],
      linkedAssetId: assetId,
      isPurchaseOrder: false
    };
    const updated = { ...selectedRequest, itemFulfillments: newFulfillments };
    onUpdateRequest(updated);
    setSelectedRequest(updated);
    setItemToLink(null);
  };

  const handleMarkForPurchase = (index: number) => {
    if (!selectedRequest) return;
    const newFulfillments = [...(selectedRequest.itemFulfillments || [])];
    newFulfillments[index] = {
      type: selectedRequest.items[index],
      linkedAssetId: undefined,
      isPurchaseOrder: true,
      purchaseStatus: 'Pendente'
    };
    const updated = { ...selectedRequest, itemFulfillments: newFulfillments };
    onUpdateRequest(updated);
    setSelectedRequest(updated);
  };

  const handleStatusChange = (status: EquipmentRequest['status']) => {
    if (selectedRequest) {
      onUpdateStatus(selectedRequest.id, status);
      setSelectedRequest(prev => prev ? { ...prev, status } : null);
    }
  };

  const availableAssetsByType = (type: AssetType) => {
    return assets.filter(a => a.type === type && a.status === 'Disponível');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" /> Fluxo de Atendimento
        </h3>
        
        {requests.map(req => (
          <div 
            key={req.id} 
            onClick={() => setSelectedRequest(req)}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all group cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                req.status === 'Pendente' ? 'bg-amber-50 text-amber-500' :
                req.status === 'Aprovado' ? 'bg-blue-50 text-blue-500' :
                req.status === 'Preparando' ? 'bg-indigo-50 text-indigo-500' :
                req.status === 'Entregue' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'
              }`}>
                {req.status === 'Preparando' ? <Wrench className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-800">{req.id}</p>
                  {req.itemFulfillments?.some(f => f.isPurchaseOrder) && (
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1">
                      <ShoppingCart className="w-2.5 h-2.5" /> Compra
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">Para: {getEmployeeName(req.employeeId)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
               <div className="hidden md:flex flex-col items-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Itens</span>
                  <span className="text-sm font-bold text-slate-700">{req.items.length} eqp.</span>
               </div>
               <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                 req.status === 'Pendente' ? 'bg-amber-100 text-amber-600' : 
                 req.status === 'Aprovado' ? 'bg-blue-100 text-blue-600' :
                 req.status === 'Preparando' ? 'bg-indigo-100 text-indigo-600' :
                 req.status === 'Entregue' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
               }`}>
                 {req.status}
               </span>
               <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="bg-white p-16 rounded-[2.5rem] border border-dashed border-slate-200 text-center space-y-4">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-10 h-10 text-slate-200" />
             </div>
             <p className="text-slate-400 font-medium">Nenhuma solicitação pendente de triagem.</p>
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl h-fit space-y-6 sticky top-24">
        <div className="bg-blue-50 p-4 rounded-3xl mb-6">
           <div className="flex items-center gap-2 text-blue-600 mb-2">
             <AlertCircle className="w-5 h-5" />
             <h4 className="font-bold text-sm">Triagem de Ativos</h4>
           </div>
           <p className="text-xs text-blue-700 leading-relaxed">
             Toda requisição deve ser vinculada a um item do inventário ou gerar um pedido de compra aprovado pela diretoria.
           </p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span>Abrir Nova Requisição</span>
        </button>
      </div>

      {/* Side Detail Panel (Fulfillment UI) */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setSelectedRequest(null); setItemToLink(null); }} />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Triagem Técnica</h3>
                  <p className="text-sm text-slate-500">{selectedRequest.id}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedRequest(null); setItemToLink(null); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
               {/* User Info Header */}
               <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{getEmployeeName(selectedRequest.employeeId)}</p>
                      <p className="text-xs text-slate-500 font-medium">{getEmployeeSector(selectedRequest.employeeId)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data Solicitação</p>
                    <p className="text-xs font-bold text-slate-700">{selectedRequest.createdAt}</p>
                  </div>
               </div>

               {/* Item Fulfillment List */}
               <div className="space-y-4">
                 <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                   <Package className="w-4 h-4 text-blue-600" /> Itens Requisitados ({selectedRequest.items.length})
                 </h4>
                 
                 <div className="space-y-4">
                    {selectedRequest.items.map((itemType, idx) => {
                      const fulfillment = selectedRequest.itemFulfillments?.[idx];
                      const isLinked = !!fulfillment?.linkedAssetId;
                      const isPurchase = !!fulfillment?.isPurchaseOrder;

                      return (
                        <div key={idx} className={`border p-5 rounded-3xl transition-all ${
                          isLinked ? 'bg-emerald-50/30 border-emerald-100' : 
                          isPurchase ? 'bg-amber-50/30 border-amber-100' : 'bg-white border-slate-100 shadow-sm'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                isLinked ? 'bg-emerald-100 text-emerald-600' : 
                                isPurchase ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                              }`}>
                                <Package className="w-5 h-5" />
                              </div>
                              <span className="font-bold text-slate-800">{itemType}</span>
                            </div>
                            
                            {isLinked ? (
                              <div className="flex items-center gap-1 text-emerald-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-tight">Vinculado: {fulfillment.linkedAssetId}</span>
                              </div>
                            ) : isPurchase ? (
                              <div className={`flex items-center gap-1 ${fulfillment.purchaseStatus === 'Aprovado' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                <ShoppingCart className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-tight">Pedido: {fulfillment.purchaseStatus}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aguardando Triagem</span>
                            )}
                          </div>

                          {!isLinked && !isPurchase && (
                            <div className="grid grid-cols-2 gap-3">
                               <button 
                                onClick={() => setItemToLink({ index: idx, type: itemType })}
                                className="bg-white border border-slate-200 py-2.5 rounded-2xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                               >
                                 <LinkIcon className="w-3.5 h-3.5" /> Vincular Estoque
                               </button>
                               <button 
                                onClick={() => handleMarkForPurchase(idx)}
                                className="bg-white border border-slate-200 py-2.5 rounded-2xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                               >
                                 <ShoppingCart className="w-3.5 h-3.5" /> Pedido Compra
                               </button>
                            </div>
                          )}

                          {/* Inline Selection Dropdown for Inventory */}
                          {itemToLink?.index === idx && (
                            <div className="mt-4 p-4 bg-slate-100 rounded-2xl border border-slate-200 animate-in fade-in zoom-in-95">
                               <div className="flex items-center justify-between mb-3">
                                  <h5 className="text-[10px] font-black text-slate-500 uppercase">Escolha um item disponível:</h5>
                                  <button onClick={() => setItemToLink(null)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-3 h-3" />
                                  </button>
                               </div>
                               <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                  {availableAssetsByType(itemType).length > 0 ? (
                                    availableAssetsByType(itemType).map(asset => (
                                      <button 
                                        key={asset.id}
                                        onClick={() => handleLinkAsset(idx, asset.id)}
                                        className="w-full text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all flex items-center justify-between group"
                                      >
                                         <div>
                                           <p className="text-xs font-bold text-slate-800">{asset.id}</p>
                                           <p className="text-[10px] text-slate-500">{asset.brand} - {asset.model}</p>
                                         </div>
                                         <Plus className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                                      </button>
                                    ))
                                  ) : (
                                    <div className="text-center py-4 space-y-2">
                                       <AlertCircle className="w-6 h-6 text-slate-300 mx-auto" />
                                       <p className="text-[10px] text-slate-400 font-medium">Ops! Não há saldo disponível para "{itemType}" no inventário.</p>
                                    </div>
                                  )}
                               </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                 </div>
               </div>

               {/* Request Observation */}
               <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" /> Justificativa
                  </h4>
                  <div className="p-5 bg-white rounded-3xl border border-blue-100 text-sm text-slate-700 leading-relaxed italic shadow-sm">
                    "{selectedRequest.observation || "Nenhuma observação informada pelo solicitante."}"
                  </div>
               </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex flex-col gap-3">
               <div className="flex flex-col gap-2">
                 {selectedRequest.status === 'Pendente' && (
                   <button 
                    onClick={() => handleStatusChange('Aprovado')}
                    disabled={selectedRequest.itemFulfillments?.length === 0}
                    className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-100"
                   >
                     <Check className="w-5 h-5" />
                     Aprovar e Avançar para Preparação
                   </button>
                 )}

                 {selectedRequest.status === 'Aprovado' && (
                    <button 
                      onClick={() => handleStatusChange('Preparando')}
                      className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100"
                    >
                      <Wrench className="w-5 h-5" />
                      Iniciar Preparação Técnica
                    </button>
                 )}

                 {(selectedRequest.status === 'Aprovado' || selectedRequest.status === 'Preparando') && (
                    <button 
                      onClick={() => handleStatusChange('Entregue')}
                      disabled={selectedRequest.itemFulfillments?.some(f => !f.linkedAssetId && !(f.isPurchaseOrder && f.purchaseStatus === 'Comprado'))}
                      className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                        selectedRequest.itemFulfillments?.some(f => !f.linkedAssetId && !(f.isPurchaseOrder && f.purchaseStatus === 'Comprado'))
                          ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-100'
                      }`}
                    >
                      <Truck className="w-5 h-5" />
                      Finalizar Entrega ao Colaborador
                    </button>
                 )}
               </div>
               
               {selectedRequest.status === 'Entregue' && (
                 <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 text-emerald-700 font-bold justify-center">
                    <CheckCircle className="w-5 h-5" />
                    Requisição Finalizada com Sucesso
                 </div>
               )}

               {selectedRequest.itemFulfillments?.some(f => !f.linkedAssetId && !f.isPurchaseOrder) && selectedRequest.status === 'Pendente' && (
                 <p className="text-[10px] text-center text-rose-500 font-bold">Atenção: Existem itens pendentes de triagem/vínculo.</p>
               )}
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Nova Requisição</h3>
                <p className="text-slate-500 text-sm">Selecione os equipamentos necessários para o colaborador.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
              <div className="space-y-3">
                <label className="text-sm font-black text-slate-700 uppercase tracking-widest block">Colaborador Alvo</label>
                <select 
                  className="w-full p-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700 shadow-sm"
                  value={newReq.employeeId}
                  onChange={e => setNewReq({...newReq, employeeId: e.target.value})}
                  required
                >
                  <option value="">Escolher colaborador...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.sector}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-black text-slate-700 uppercase tracking-widest block">Checklist de Equipamentos</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ASSET_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleItem(type as AssetType)}
                      className={`p-4 rounded-2xl border text-sm font-bold transition-all text-center flex flex-col items-center gap-2 ${
                        newReq.items.includes(type as AssetType)
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100 scale-[1.02]'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-slate-50 shadow-sm'
                      }`}
                    >
                      <Package className={`w-5 h-5 ${newReq.items.includes(type as AssetType) ? 'text-white' : 'text-slate-300'}`} />
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-slate-700 uppercase tracking-widest block">Justificativa ou Observações</label>
                <textarea 
                  rows={4}
                  className="w-full p-5 rounded-[2rem] border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all shadow-sm"
                  placeholder="Descreva o motivo da solicitação (ex: nova contratação, upgrade, substituição por defeito...)"
                  value={newReq.observation}
                  onChange={e => setNewReq({...newReq, observation: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
                <button type="submit" className="px-12 py-4 font-black bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">Iniciar Triagem</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
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

export default RequestsManager;
