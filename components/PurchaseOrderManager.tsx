
import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Check, 
  AlertCircle,
  CreditCard,
  FileText,
  Package,
  Truck,
  X,
  Link as LinkIcon,
  CheckSquare,
  Square,
  MoreHorizontal,
  ChevronRight,
  ShieldCheck,
  Zap,
  Tag,
  QrCode,
  DollarSign,
  Plus,
  ArrowRight,
  ExternalLink,
  Loader2,
  Clock
} from 'lucide-react';
import { EquipmentRequest, Employee, ItemFulfillment, Quotation, Asset, HistoryEntry, AssetType, AssetTypeConfig } from '../types';
import { ASSET_TYPES } from '../constants';

interface PurchaseOrderManagerProps {
  requests: EquipmentRequest[];
  employees: Employee[];
  onUpdateRequest: (req: EquipmentRequest) => Promise<void>;
  onAssetCreated: (asset: Omit<Asset, 'id' | 'createdAt' | 'qrCode' | 'history'> & { id?: string; history?: HistoryEntry[] }) => Promise<void>;
  onAddRequest: (req: Omit<EquipmentRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  assetTypeConfigs: AssetTypeConfig[];
}

const PurchaseOrderManager: React.FC<PurchaseOrderManagerProps> = ({ 
  requests, 
  employees, 
  onUpdateRequest, 
  onAssetCreated, 
  onAddRequest,
  assetTypeConfigs 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [activeSelection, setActiveSelection] = useState<{ requestId: string; fIndex: number } | null>(null);
  const [showDirectOrderModal, setShowDirectOrderModal] = useState(false);
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newDirectOrder, setNewDirectOrder] = useState({
    type: 'Notebook' as AssetType,
    observation: ''
  });

  const [receiptData, setReceiptData] = useState<Partial<Asset>>({
    brand: '',
    model: '',
    id: '',
    observations: '',
    purchaseValue: 0
  });

  const currentRequest = useMemo(() => {
    if (!activeSelection) return null;
    return requests.find(r => r.id === activeSelection.requestId) || null;
  }, [requests, activeSelection]);

  const currentFulfillment = useMemo(() => {
    if (!currentRequest || activeSelection === null) return null;
    return currentRequest.itemFulfillments?.[activeSelection.fIndex] || null;
  }, [currentRequest, activeSelection]);

  const purchaseItems = useMemo(() => {
    const items: Array<{ request: EquipmentRequest; fulfillment: ItemFulfillment; index: number }> = [];
    requests.forEach(req => {
      req.itemFulfillments?.forEach((f, idx) => {
        if (f.isPurchaseOrder && !f.isDelivered) {
          items.push({ request: req, fulfillment: f, index: idx });
        }
      });
    });
    return items;
  }, [requests]);

  const filteredItems = purchaseItems.filter(item => {
    const employee = employees.find(e => e.id === item.request.employeeId);
    const matchesSearch = 
      item.fulfillment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee?.name || 'Estoque').toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.request.id.toLowerCase().includes(searchTerm.toLowerCase());
    const status = item.fulfillment.purchaseStatus || 'Pendente';
    const matchesStatus = statusFilter === 'Todos' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getEmployeeName = (id?: string | null) => employees.find(e => e.id === id)?.name || 'Estoque TI (Reposição)';

  const handleUpdateQuotation = async (qIndex: number, field: keyof Quotation, value: any) => {
    if (!currentRequest || activeSelection === null) return;
    const newFulfillments = [...(currentRequest.itemFulfillments || [])];
    const item = { ...newFulfillments[activeSelection.fIndex] };
    const quotations = [...(item.quotations || [
      { url: '', price: 0, deliveryPrediction: '' }, 
      { url: '', price: 0, deliveryPrediction: '' }, 
      { url: '', price: 0, deliveryPrediction: '' }
    ])];
    quotations[qIndex] = { ...quotations[qIndex], [field]: value };
    item.quotations = quotations;
    newFulfillments[activeSelection.fIndex] = item;
    await onUpdateRequest({ ...currentRequest, itemFulfillments: newFulfillments });
  };

  const handleApproveQuotation = async (qIndex: number) => {
    if (!currentRequest || activeSelection === null) return;
    const newFulfillments = [...(currentRequest.itemFulfillments || [])];
    newFulfillments[activeSelection.fIndex] = { 
      ...newFulfillments[activeSelection.fIndex], 
      purchaseStatus: 'Cotação Aprovada', 
      approvedQuotationIndex: qIndex 
    };
    await onUpdateRequest({ ...currentRequest, itemFulfillments: newFulfillments });
  };

  const handleAuthorizeOrder = async () => {
    if (!currentRequest || activeSelection === null) return;
    const newFulfillments = [...(currentRequest.itemFulfillments || [])];
    newFulfillments[activeSelection.fIndex] = { 
      ...newFulfillments[activeSelection.fIndex], 
      purchaseStatus: 'Pedido Autorizado' 
    };
    await onUpdateRequest({ ...currentRequest, itemFulfillments: newFulfillments });
  };

  const handleSetComprado = async (requestId: string, fIndex: number) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;
    const newFulfillments = [...(req.itemFulfillments || [])];
    newFulfillments[fIndex] = { ...newFulfillments[fIndex], purchaseStatus: 'Comprado' };
    await onUpdateRequest({ ...req, itemFulfillments: newFulfillments });
  };

  const handleOpenReceipt = () => {
    if (!currentFulfillment) return;
    
    // Regra: Capturar valor se NÃO for peça de reposição
    const isReplacementPart = currentFulfillment.type.toLowerCase().includes('peça') || 
                               currentFulfillment.type.toLowerCase().includes('reposição');
    
    let priceFromQuotation = 0;
    if (!isReplacementPart && currentFulfillment.approvedQuotationIndex !== undefined) {
      priceFromQuotation = currentFulfillment.quotations?.[currentFulfillment.approvedQuotationIndex]?.price || 0;
    }

    setReceiptData({
      brand: '',
      model: '',
      id: '',
      observations: `Item recebido via Pedido de Compra referente à requisição ${currentRequest?.id}`,
      type: currentFulfillment.type,
      purchaseValue: priceFromQuotation
    });
    setShowReceiptForm(true);
  };

  const handleFinalizeAndCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRequest || activeSelection === null || !currentFulfillment) return;
    setIsSubmitting(true);

    try {
      await onAssetCreated({
        id: receiptData.id || undefined,
        brand: receiptData.brand || '',
        model: receiptData.model || '',
        type: currentFulfillment.type,
        departmentId: 'DEPT-1',
        status: currentRequest.employeeId ? 'Em Uso' : 'Disponível',
        assignedTo: currentRequest.employeeId || undefined,
        observations: receiptData.observations || '',
        purchaseValue: receiptData.purchaseValue || 0,
        photos: [],
        history: [
          {
            id: Math.random().toString(),
            date: new Date().toISOString(),
            type: 'Criação',
            description: `Tombamento via compra ref. ${currentRequest.id}. Valor registrado: R$ ${receiptData.purchaseValue?.toLocaleString('pt-BR')}`,
            performedBy: 'Sistema Financeiro'
          }
        ]
      });

      const newFulfillments = [...(currentRequest.itemFulfillments || [])];
      newFulfillments[activeSelection.fIndex] = { 
        ...newFulfillments[activeSelection.fIndex], 
        isDelivered: true, 
        linkedAssetId: receiptData.id || 'AUTO-GERADO'
      };
      
      await onUpdateRequest({ ...currentRequest, itemFulfillments: newFulfillments });
      
      setShowReceiptForm(false);
      setActiveSelection(null);
    } catch (err) {
      alert("Erro ao finalizar tombamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDirectOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAddRequest({
        requesterId: '1',
        employeeId: '', 
        items: [newDirectOrder.type],
        observation: newDirectOrder.observation,
        itemFulfillments: [{
          type: newDirectOrder.type,
          isPurchaseOrder: true,
          purchaseStatus: 'Pendente',
          quotations: [
            { url: '', price: 0, deliveryPrediction: '' },
            { url: '', price: 0, deliveryPrediction: '' },
            { url: '', price: 0, deliveryPrediction: '' }
          ]
        }]
      });
      setShowDirectOrderModal(false);
      setNewDirectOrder({ type: 'Notebook', observation: '' });
    } catch (err) {
      alert("Erro ao criar pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 w-full">
          {[
            { label: 'Cotações', count: purchaseItems.filter(i => (i.fulfillment.purchaseStatus || 'Pendente') === 'Pendente').length, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Autorização', count: purchaseItems.filter(i => i.fulfillment.purchaseStatus === 'Cotação Aprovada').length, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Autorizados', count: purchaseItems.filter(i => i.fulfillment.purchaseStatus === 'Pedido Autorizado').length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Em Trânsito', count: purchaseItems.filter(i => i.fulfillment.purchaseStatus === 'Comprado').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((stat, i) => (
            <div key={i} className={`${stat.bg} p-5 rounded-[1.5rem] border border-slate-100 shadow-sm`}>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color} tracking-tight`}>{stat.count}</p>
            </div>
          ))}
        </div>
        <button 
          onClick={() => setShowDirectOrderModal(true)}
          className="w-full lg:w-auto bg-slate-900 hover:bg-black text-white px-8 py-5 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] transition-all"
        >
          <Plus className="w-5 h-5" /> Nova Ordem de Compra
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipamento</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Destinatário</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Workflow</th>
                <th className="px-6 py-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr 
                  key={`${item.request.id}-${item.index}`} 
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer" 
                  onClick={() => setActiveSelection({ requestId: item.request.id, fIndex: item.index })}
                >
                  <td className="px-6 py-6 font-mono text-xs font-bold text-slate-400">{item.request.id}</td>
                  <td className="px-6 py-6 font-bold text-slate-800">{item.fulfillment.type}</td>
                  <td className="px-6 py-6">
                    <span className="text-sm font-bold text-slate-700">{getEmployeeName(item.request.employeeId)}</span>
                  </td>
                  <td className="px-6 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      (item.fulfillment.purchaseStatus || 'Pendente') === 'Pendente' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      item.fulfillment.purchaseStatus === 'Cotação Aprovada' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                      item.fulfillment.purchaseStatus === 'Pedido Autorizado' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    }`}>
                      {item.fulfillment.purchaseStatus || 'Pendente'}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-all font-black text-[10px] uppercase">
                      Gerenciar <ChevronRight className="w-4 h-4" />
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs opacity-50">
                    Nenhum pedido de compra ativo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeSelection && currentRequest && currentFulfillment && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveSelection(null)} />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Gestão de Ordem de Compra</h3>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{currentRequest.id} • Item #{activeSelection.fIndex + 1}</p>
                  </div>
                </div>
                <button onClick={() => setActiveSelection(null)} className="p-3 hover:bg-slate-200 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Item Solicitado</p>
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
                      <Package className="w-7 h-7 text-blue-600" />
                   </div>
                   <div>
                      <h4 className="text-lg font-black text-slate-900">{currentFulfillment.type}</h4>
                      <p className="text-xs font-bold text-slate-600">Para: {getEmployeeName(currentRequest.employeeId)}</p>
                   </div>
                </div>
              </div>

              {/* ETAPA 1: COTAÇÕES */}
              {(currentFulfillment.purchaseStatus || 'Pendente') === 'Pendente' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Mapa Comparativo de Cotações</h4>
                  </div>
                  <div className="space-y-4">
                    {[0, 1, 2].map(qIdx => (
                      <div key={qIdx} className="bg-white border-2 border-slate-200 rounded-3xl p-6 hover:border-blue-400 transition-all shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                           <span className="text-[10px] font-black uppercase bg-slate-100 px-3 py-1 rounded-full text-slate-600">Fornecedor {qIdx + 1}</span>
                           <button 
                            onClick={() => handleApproveQuotation(qIdx)}
                            className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"
                           >
                              Escolher Fornecedor
                           </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="relative">
                              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                                placeholder="Link do produto (URL)" 
                                value={currentFulfillment.quotations?.[qIdx]?.url || ''}
                                onChange={e => handleUpdateQuotation(qIdx, 'url', e.target.value)}
                              />
                           </div>
                           <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input 
                                type="number"
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                                placeholder="Preço (R$)" 
                                value={currentFulfillment.quotations?.[qIdx]?.price || ''}
                                onChange={e => handleUpdateQuotation(qIdx, 'price', parseFloat(e.target.value))}
                              />
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ETAPA 2: AUTORIZAÇÃO */}
              {currentFulfillment.purchaseStatus === 'Cotação Aprovada' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Aprovação da Diretoria</h4>
                  </div>
                  <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl">
                     <p className="text-[10px] font-black uppercase opacity-70 mb-4 tracking-widest">Fornecedor Selecionado</p>
                     <div className="flex items-center justify-between mb-8">
                        <div>
                          <p className="text-3xl font-black">R$ {currentFulfillment.quotations?.[currentFulfillment.approvedQuotationIndex || 0].price?.toLocaleString('pt-BR')}</p>
                          <p className="text-xs font-bold text-blue-100 mt-1">
                             Aguardando sua autorização para prosseguir com a compra.
                          </p>
                        </div>
                        <a 
                          href={currentFulfillment.quotations?.[currentFulfillment.approvedQuotationIndex || 0].url} 
                          target="_blank" 
                          className="bg-white/20 hover:bg-white/40 p-4 rounded-2xl transition-all"
                        >
                          <ExternalLink className="w-6 h-6" />
                        </a>
                     </div>
                     <button 
                      onClick={handleAuthorizeOrder}
                      className="w-full bg-white text-blue-600 font-black py-5 rounded-[2rem] uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all"
                     >
                       <CheckSquare className="w-5 h-5" /> Autorizar Pedido
                     </button>
                  </div>
                </div>
              )}

              {/* ETAPA 3: PAGAMENTO */}
              {currentFulfillment.purchaseStatus === 'Pedido Autorizado' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Financeiro</h4>
                  </div>
                  <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl text-center">
                     <p className="text-sm font-bold mb-8">O pedido foi autorizado. Realize o pagamento e confirme o envio abaixo.</p>
                     <button 
                      onClick={() => handleSetComprado(currentRequest.id, activeSelection.fIndex)}
                      className="w-full bg-white text-indigo-600 font-black py-5 rounded-[2rem] shadow-xl uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                     >
                        <Truck className="w-6 h-6" /> Confirmar Pagamento e Envio
                     </button>
                  </div>
                </div>
              )}

              {/* ETAPA 4: RECEBIMENTO */}
              {currentFulfillment.purchaseStatus === 'Comprado' && (
                <div className="space-y-6">
                   <div className="flex items-center gap-2 text-emerald-600">
                    <Truck className="w-6 h-6" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Equipamento em Trânsito</h4>
                  </div>
                  <div className="bg-emerald-600 rounded-[2.5rem] p-10 text-white shadow-xl text-center">
                     <Package className="w-16 h-16 mx-auto mb-6 animate-bounce" />
                     <p className="font-bold mb-8">O item está a caminho. Clique abaixo ao recebê-lo fisicamente.</p>
                     <button 
                      onClick={handleOpenReceipt}
                      className="w-full bg-white text-emerald-600 font-black py-5 rounded-[2rem] shadow-xl uppercase tracking-widest text-xs"
                     >
                        Registrar Recebimento
                     </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVA ORDEM DIRETA */}
      {showDirectOrderModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <ShoppingCart className="w-5 h-5" />
                    <h3 className="text-xl font-black uppercase tracking-tight">Nova Ordem de Compra</h3>
                 </div>
                 <button onClick={() => setShowDirectOrderModal(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleCreateDirectOrder} className="p-10 space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Equipamento</label>
                    <select 
                      className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none font-bold appearance-none"
                      value={newDirectOrder.type}
                      onChange={e => setNewDirectOrder({...newDirectOrder, type: e.target.value as AssetType})}
                    >
                      {(assetTypeConfigs.length > 0 ? assetTypeConfigs.map(t => t.name) : ASSET_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações</label>
                    <textarea 
                      className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold h-32 outline-none"
                      placeholder="Motivo da compra..."
                      value={newDirectOrder.observation}
                      onChange={e => setNewDirectOrder({...newDirectOrder, observation: e.target.value})}
                      required
                    />
                 </div>
                 <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[2rem] shadow-xl uppercase tracking-widest text-xs disabled:bg-slate-300"
                 >
                    {isSubmitting ? 'Processando...' : 'Abrir Ordem de Compra'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* MODAL: TOMBAMENTO */}
      {showReceiptForm && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden">
              <div className="bg-emerald-600 p-8 text-white flex items-center justify-between">
                 <h3 className="text-xl font-black uppercase tracking-tight">Tombamento</h3>
                 <button onClick={() => setShowReceiptForm(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleFinalizeAndCreateAsset} className="p-10 space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Patrimonial (Vazio = Auto)</label>
                    <input 
                      className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-mono font-black text-lg text-center" 
                      value={receiptData.id} 
                      onChange={e => setReceiptData({...receiptData, id: e.target.value})} 
                      placeholder="Ex: AST-5050"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400">Marca</label>
                      <input className="w-full p-4 rounded-2xl border border-slate-200" placeholder="Dell" value={receiptData.brand} onChange={e => setReceiptData({...receiptData, brand: e.target.value})} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400">Modelo</label>
                      <input className="w-full p-4 rounded-2xl border border-slate-200" placeholder="G15" value={receiptData.model} onChange={e => setReceiptData({...receiptData, model: e.target.value})} required />
                    </div>
                 </div>
                 
                 {receiptData.purchaseValue && receiptData.purchaseValue > 0 ? (
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                       <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Valor de Aquisição</span>
                       <span className="text-lg font-black text-emerald-700">R$ {receiptData.purchaseValue.toLocaleString('pt-BR')}</span>
                    </div>
                 ) : null}

                 <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-[2rem] shadow-xl uppercase tracking-widest text-xs">
                    {isSubmitting ? 'Salvando...' : 'Concluir e Registrar Ativo'}
                 </button>
              </form>
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

export default PurchaseOrderManager;
