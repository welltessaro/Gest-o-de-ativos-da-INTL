
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
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" /> Fluxo de Atendimento
        </h3>
        
        {requests.map(req => (
          <div 
            key={req.id} 
            onClick={() => setSelectedRequest(req)}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all group cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-600"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                req.status === 'Pendente' ? 'bg-amber-100 text-amber-700' :
                req.status === 'Aprovado' ? 'bg-blue-100 text-blue-700' :
                req.status === 'Preparando' ? 'bg-indigo-100 text-indigo-700' :
                req.status === 'Entregue' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {req.status === 'Preparando' ? <Wrench className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-black text-slate-900">{req.id}</p>
                  {req.itemFulfillments?.some(f => f.isPurchaseOrder) && (
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 border border-amber-200">
                      <ShoppingCart className="w-2.5 h-2.5" /> Compra
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 font-semibold">Para: {getEmployeeName(req.employeeId)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
               <div className="hidden md:flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Itens</span>
                  <span className="text-sm font-black text-slate-800">{req.items.length} eqp.</span>
               </div>
               <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tight ${
                 req.status === 'Pendente' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 
                 req.status === 'Aprovado' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                 req.status === 'Preparando' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                 req.status === 'Entregue' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
               }`}>
                 {req.status}
               </span>
               <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="bg-white p-16 rounded-[2.5rem] border border-dashed border-slate-300 text-center space-y-4">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-10 h-10 text-slate-300" />
             </div>
             <p className="text-slate-600 font-black uppercase tracking-widest text-xs">Nenhuma solicitação pendente de triagem.</p>
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl h-fit space-y-6 sticky top-24">
        <div className="bg-blue-50 p-5 rounded-3xl mb-6 border border-blue-100">
           <div className="flex items-center gap-2 text-blue-700 mb-2">
             <AlertCircle className="w-5 h-5" />
             <h4 className="font-black text-sm uppercase tracking-widest">Triagem de Ativos</h4>
           </div>
           <p className="text-xs text-blue-800 leading-relaxed font-semibold">
             Toda requisição deve ser vinculada a um item do inventário ou gerar um pedido de compra aprovado pela diretoria.
           </p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 group uppercase tracking-widest text-xs"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span>Abrir Nova Requisição</span>
        </button>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setSelectedRequest(null); setItemToLink(null); }} />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right border-l border-slate-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Triagem Técnica</h3>
                  <p className="text-sm text-slate-600 font-bold">{selectedRequest.id}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedRequest(null); setItemToLink(null); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
               <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-500">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{getEmployeeName(selectedRequest.employeeId)}</p>
                      <p className="text-xs text-slate-700 font-bold uppercase tracking-tight">{getEmployeeSector(selectedRequest.employeeId)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data Solicitação</p>
                    <p className="text-xs font-black text-slate-900">{selectedRequest.createdAt}</p>
                  </div>
               </div>

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
                          isLinked ? 'bg-emerald-50 border-emerald-200' : 
                          isPurchase ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200 shadow-sm'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                isLinked ? 'bg-emerald-100 text-emerald-800' : 
                                isPurchase ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                <Package className="w-5 h-5" />
                              </div>
                              <span className="font-black text-slate-900">{itemType}</span>
                            </div>
                            
                            {isLinked ? (
                              <div className="flex items-center gap-1 text-emerald-800">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-tight">Vinculado: {fulfillment.linkedAssetId}</span>
                              </div>
                            ) : isPurchase ? (
                              <div className={`flex items-center gap-1 ${fulfillment.purchaseStatus === 'Aprovado' ? 'text-emerald-800' : 'text-amber-800'}`}>
                                <ShoppingCart className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-tight">Pedido: {fulfillment.purchaseStatus}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aguardando Triagem</span>
                            )}
                          </div>

                          {!isLinked && !isPurchase && (
                            <div className="grid grid-cols-2 gap-3">
                               <button 
                                onClick={() => setItemToLink({ index: idx, type: itemType })}
                                className="bg-white border border-slate-300 py-2.5 rounded-2xl text-xs font-black text-slate-800 flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all shadow-sm uppercase tracking-widest"
                               >
                                 <LinkIcon className="w-3.5 h-3.5" /> Vincular Estoque
                               </button>
                               <button 
                                onClick={() => handleMarkForPurchase(idx)}
                                className="bg-white border border-slate-300 py-2.5 rounded-2xl text-xs font-black text-slate-800 flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all shadow-sm uppercase tracking-widest"
                               >
                                 <ShoppingCart className="w-3.5 h-3.5" /> Pedido Compra
                               </button>
                            </div>
                          )}

                          {itemToLink?.index === idx && (
                            <div className="mt-4 p-4 bg-slate-100 rounded-2xl border border-slate-300 animate-in fade-in zoom-in-95">
                               <div className="flex items-center justify-between mb-3">
                                  <h5 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Escolha um item disponível:</h5>
                                  <button onClick={() => setItemToLink(null)} className="text-slate-500 hover:text-slate-900">
                                    <X className="w-3 h-3" />
                                  </button>
                               </div>
                               <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                  {availableAssetsByType(itemType).length > 0 ? (
                                    availableAssetsByType(itemType).map(asset => (
                                      <button 
                                        key={asset.id}
                                        onClick={() => handleLinkAsset(idx, asset.id)}
                                        className="w-full text-left p-3 rounded-xl bg-white border border-slate-300 hover:border-blue-600 hover:shadow-sm transition-all flex items-center justify-between group"
                                      >
                                         <div>
                                           <p className="text-xs font-black text-slate-900">{asset.id}</p>
                                           <p className="text-[10px] text-slate-700 font-semibold">{asset.brand} - {asset.model}</p>
                                         </div>
                                         <Plus className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                                      </button>
                                    ))
                                  ) : (
                                    <div className="text-center py-4 space-y-2">
                                       <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
                                       <p className="text-[10px] text-slate-600 font-bold uppercase">Ops! Não há saldo disponível para "{itemType}" no inventário.</p>
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

               <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" /> Justificativa
                  </h4>
                  <div className="p-5 bg-white rounded-3xl border border-blue-200 text-sm text-slate-800 leading-relaxed font-semibold italic shadow-sm">
                    "{selectedRequest.observation || "Nenhuma observação informada pelo solicitante."}"
                  </div>
               </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex flex-col gap-3">
               <div className="flex flex-col gap-2">
                 {selectedRequest.status === 'Pendente' && (
                   <button 
                    onClick={() => handleStatusChange('Aprovado')}
                    disabled={selectedRequest.itemFulfillments?.length === 0}
                    className="w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-100 uppercase tracking-widest text-xs"
                   >
                     <Check className="w-5 h-5" />
                     Aprovar e Avançar para Preparação
                   </button>
                 )}

                 {selectedRequest.status === 'Aprovado' && (
                    <button 
                      onClick={() => handleStatusChange('Preparando')}
                      className="w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs"
                    >
                      <Wrench className="w-5 h-5" />
                      Iniciar Preparação Técnica
                    </button>
                 )}

                 {(selectedRequest.status === 'Aprovado' || selectedRequest.status === 'Preparando') && (
                    <button 
                      onClick={() => handleStatusChange('Entregue')}
                      disabled={selectedRequest.itemFulfillments?.some(f => !f.linkedAssetId && !(f.isPurchaseOrder && f.purchaseStatus === 'Comprado'))}
                      className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-xs ${
                        selectedRequest.itemFulfillments?.some(f => !f.linkedAssetId && !(f.isPurchaseOrder && f.purchaseStatus === 'Comprado'))
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-100'
                      }`}
                    >
                      <Truck className="w-5 h-5" />
                      Finalizar Entrega ao Colaborador
                    </button>
                 )}
               </div>
               
               {selectedRequest.status === 'Entregue' && (
                 <div className="p-4 bg-emerald-100 rounded-2xl border border-emerald-300 flex items-center gap-3 text-emerald-800 font-black justify-center uppercase tracking-widest text-[10px]">
                    <CheckCircle className="w-5 h-5" />
                    Requisição Finalizada com Sucesso
                 </div>
               )}

               {selectedRequest.itemFulfillments?.some(f => !f.linkedAssetId && !f.isPurchaseOrder) && selectedRequest.status === 'Pendente' && (
                 <p className="text-[10px] text-center text-rose-700 font-black uppercase tracking-tight">Atenção: Existem itens pendentes de triagem/vínculo.</p>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsManager;
