
import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, 
  Clock, 
  Search, 
  Check, 
  AlertCircle,
  CreditCard,
  FileText,
  Package,
  Calendar,
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
  QrCode
} from 'lucide-react';
import { EquipmentRequest, Employee, ItemFulfillment, Quotation, Asset, AssetType } from '../types';

interface PurchaseOrderManagerProps {
  requests: EquipmentRequest[];
  employees: Employee[];
  onUpdateRequest: (req: EquipmentRequest) => void;
  onAssetCreated: (asset: Omit<Asset, 'createdAt' | 'qrCode'>) => void;
}

const PurchaseOrderManager: React.FC<PurchaseOrderManagerProps> = ({ requests, employees, onUpdateRequest, onAssetCreated }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [activeSelection, setActiveSelection] = useState<{ requestId: string; fIndex: number } | null>(null);
  const [bulkSelected, setBulkSelected] = useState<string[]>([]); // "requestId-fIndex"
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  
  // Dados para o cadastro no inventário
  const [receiptData, setReceiptData] = useState<Partial<Asset>>({
    brand: '',
    model: '',
    id: '',
    observations: ''
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
      employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.request.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const status = item.fulfillment.purchaseStatus || 'Pendente';
    const matchesStatus = statusFilter === 'Todos' || status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'N/A';

  const handleUpdateQuotation = (qIndex: number, field: keyof Quotation, value: string) => {
    if (!currentRequest || activeSelection === null) return;
    const newFulfillments = [...(currentRequest.itemFulfillments || [])];
    const item = { ...newFulfillments[activeSelection.fIndex] };
    const quotations = [...(item.quotations || [{ url: '', deliveryPrediction: '' }, { url: '', deliveryPrediction: '' }, { url: '', deliveryPrediction: '' }])];
    quotations[qIndex] = { ...quotations[qIndex], [field]: value };
    item.quotations = quotations;
    newFulfillments[activeSelection.fIndex] = item;
    onUpdateRequest({ ...currentRequest, itemFulfillments: newFulfillments });
  };

  const handleApproveQuotation = (qIndex: number) => {
    if (!currentRequest || activeSelection === null) return;
    const newFulfillments = [...(currentRequest.itemFulfillments || [])];
    newFulfillments[activeSelection.fIndex] = { 
      ...newFulfillments[activeSelection.fIndex], 
      purchaseStatus: 'Cotação Aprovada',
      approvedQuotationIndex: qIndex
    };
    onUpdateRequest({ ...currentRequest, itemFulfillments: newFulfillments });
  };

  const handleAuthorizeOrder = () => {
    if (!currentRequest || activeSelection === null) return;
    const newFulfillments = [...(currentRequest.itemFulfillments || [])];
    newFulfillments[activeSelection.fIndex] = { 
      ...newFulfillments[activeSelection.fIndex], 
      purchaseStatus: 'Pedido Autorizado'
    };
    onUpdateRequest({ ...currentRequest, itemFulfillments: newFulfillments });
  };

  const handleSetComprado = (requestId: string, fIndex: number) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;
    const newFulfillments = [...(req.itemFulfillments || [])];
    newFulfillments[fIndex] = { ...newFulfillments[fIndex], purchaseStatus: 'Comprado' };
    onUpdateRequest({ ...req, itemFulfillments: newFulfillments });
  };

  const handleBulkMarkAsPurchased = () => {
    bulkSelected.forEach(id => {
      const [reqId, fIdx] = id.split('-');
      handleSetComprado(reqId, parseInt(fIdx));
    });
    setBulkSelected([]);
  };

  const handleOpenReceipt = () => {
    if (!currentFulfillment) return;
    setReceiptData({
      brand: '',
      model: '',
      id: `AST-${Math.floor(Math.random() * 9000) + 1000}`,
      observations: `Item recebido via Pedido de Compra referente à requisição ${currentRequest?.id}`,
      type: currentFulfillment.type
    });
    setShowReceiptForm(true);
  };

  const handleFinalizeAndCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRequest || activeSelection === null || !currentFulfillment) return;

    // 1. Cria o ativo no inventário
    onAssetCreated({
      id: receiptData.id || '',
      brand: receiptData.brand || '',
      model: receiptData.model || '',
      type: currentFulfillment.type,
      status: 'Em Uso',
      assignedTo: currentRequest.employeeId,
      observations: receiptData.observations || '',
      photos: []
    });

    // 2. Atualiza o status da requisição para entregue
    const newFulfillments = [...(currentRequest.itemFulfillments || [])];
    newFulfillments[activeSelection.fIndex] = { 
      ...newFulfillments[activeSelection.fIndex], 
      isDelivered: true,
      linkedAssetId: receiptData.id 
    };
    
    onUpdateRequest({ ...currentRequest, itemFulfillments: newFulfillments });
    
    // 3. Limpa estados
    setShowReceiptForm(false);
    setActiveSelection(null);
  };

  const handleSetDeliveryForecast = (date: string) => {
    if (!currentRequest || activeSelection === null) return;
    const newFulfillments = [...(currentRequest.itemFulfillments || [])];
    newFulfillments[activeSelection.fIndex] = { ...newFulfillments[activeSelection.fIndex], deliveryForecastDate: date };
    onUpdateRequest({ ...currentRequest, itemFulfillments: newFulfillments });
  };

  const toggleBulk = (id: string) => {
    setBulkSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Cotações Pendentes', count: purchaseItems.filter(i => (i.fulfillment.purchaseStatus || 'Pendente') === 'Pendente').length, color: 'amber' },
          { label: 'Aguard. Autorização', count: purchaseItems.filter(i => i.fulfillment.purchaseStatus === 'Cotação Aprovada').length, color: 'blue' },
          { label: 'Pedidos Autorizados', count: purchaseItems.filter(i => i.fulfillment.purchaseStatus === 'Pedido Autorizado').length, color: 'indigo' },
          { label: 'Em Trânsito (Pagos)', count: purchaseItems.filter(i => i.fulfillment.purchaseStatus === 'Comprado').length, color: 'emerald' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-3xl font-black text-${stat.color}-600 tracking-tight`}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Bulk Actions Bar */}
      {bulkSelected.length > 0 && (
        <div className="bg-slate-900 text-white p-6 rounded-[2rem] flex items-center justify-between shadow-2xl animate-in slide-in-from-top-4">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                 <ShoppingCart className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                 <p className="font-bold">{bulkSelected.length} itens selecionados</p>
                 <p className="text-xs text-slate-400">Você pode processar a compra conjunta destes itens agora.</p>
              </div>
           </div>
           <div className="flex gap-3">
              <button onClick={() => setBulkSelected([])} className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white transition-colors">Cancelar</button>
              <button 
                onClick={handleBulkMarkAsPurchased}
                className="bg-blue-600 hover:bg-blue-700 px-8 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" /> Confirmar Pagamento do Lote
              </button>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por item ou colaborador..." 
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm bg-white font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto max-w-full">
          {['Todos', 'Pendente', 'Cotação Aprovada', 'Pedido Autorizado', 'Comprado'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                statusFilter === status 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-5 w-12 text-center">
                 <div className="flex items-center justify-center">
                    <MoreHorizontal className="w-4 h-4 text-slate-300" />
                 </div>
              </th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipamento</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Atual</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map((item) => {
              const itemId = `${item.request.id}-${item.index}`;
              const isAutorizado = item.fulfillment.purchaseStatus === 'Pedido Autorizado';
              const isSelected = bulkSelected.includes(itemId);

              return (
                <tr 
                  key={itemId} 
                  className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${isSelected ? 'bg-blue-50/30' : ''}`}
                  onClick={() => setActiveSelection({ requestId: item.request.id, fIndex: item.index })}
                >
                  <td className="px-6 py-6 text-center" onClick={(e) => e.stopPropagation()}>
                    {isAutorizado ? (
                      <button onClick={() => toggleBulk(itemId)}>
                        {isSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 text-slate-200" />}
                      </button>
                    ) : (
                      <div className="w-5 h-5" />
                    )}
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                        <Package className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-800">{item.fulfillment.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <p className="text-sm font-bold text-slate-700">{getEmployeeName(item.request.employeeId)}</p>
                  </td>
                  <td className="px-6 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      (item.fulfillment.purchaseStatus || 'Pendente') === 'Pendente' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      item.fulfillment.purchaseStatus === 'Cotação Aprovada' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                      item.fulfillment.purchaseStatus === 'Pedido Autorizado' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                      'bg-emerald-600 text-white border-emerald-700'
                    }`}>
                      {item.fulfillment.purchaseStatus || 'Pendente'}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <ChevronRight className="w-5 h-5 text-slate-300 ml-auto group-hover:translate-x-1 transition-transform" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredItems.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-10 h-10 text-slate-200" />
             </div>
             <p className="text-slate-400 font-bold">Nenhum pedido encontrado para o filtro selecionado.</p>
          </div>
        )}
      </div>

      {/* Side Details Panel */}
      {activeSelection && currentRequest && currentFulfillment && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveSelection(null)} />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
                    <ShoppingCart className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Workflow de Compra</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{currentRequest.id} • {currentFulfillment.type}</p>
                  </div>
                </div>
                <button onClick={() => setActiveSelection(null)} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-10">
                {/* Status Progress Map */}
                <div className="flex items-center justify-between px-4">
                   {['Cotação', 'Aprovação', 'Autorização', 'Compra'].map((step, idx) => (
                     <div key={idx} className="flex flex-col items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          (idx === 0) || 
                          (idx === 1 && currentFulfillment.purchaseStatus !== 'Pendente') ||
                          (idx === 2 && ['Pedido Autorizado', 'Comprado'].includes(currentFulfillment.purchaseStatus!)) ||
                          (idx === 3 && currentFulfillment.purchaseStatus === 'Comprado')
                            ? 'bg-blue-600' : 'bg-slate-200'
                        }`} />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{step}</span>
                     </div>
                   ))}
                </div>

                {/* Section 1: Cotações */}
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" /> Comparativo de Mercado
                      </h4>
                      {(currentFulfillment.purchaseStatus || 'Pendente') === 'Pendente' && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 font-bold uppercase">Preencher cotações</span>
                      )}
                   </div>

                   <div className="space-y-4">
                      {[0, 1, 2].map(qIdx => {
                        const q = currentFulfillment.quotations?.[qIdx] || { url: '', deliveryPrediction: '' };
                        const isChosen = currentFulfillment.approvedQuotationIndex === qIdx;
                        const canEdit = (currentFulfillment.purchaseStatus || 'Pendente') === 'Pendente';

                        return (
                          <div key={qIdx} className={`p-6 rounded-[2.5rem] border transition-all ${
                            isChosen ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'
                          }`}>
                            <div className="flex items-center justify-between mb-4">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opção de Fornecedor 0{qIdx + 1}</span>
                               {isChosen && <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase">Cotação Selecionada</span>}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">URL / Link</label>
                                  <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                                      placeholder="Link do produto..."
                                      value={q.url}
                                      onChange={(e) => handleUpdateQuotation(qIdx, 'url', e.target.value)}
                                      disabled={!canEdit}
                                    />
                                  </div>
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Entrega Est.</label>
                                  <input 
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                                    placeholder="Ex: 3 dias"
                                    value={q.deliveryPrediction}
                                    onChange={(e) => handleUpdateQuotation(qIdx, 'deliveryPrediction', e.target.value)}
                                    disabled={!canEdit}
                                  />
                               </div>
                            </div>

                            {canEdit && q.url && q.deliveryPrediction && (
                              <button 
                                onClick={() => handleApproveQuotation(qIdx)}
                                className="mt-4 w-full bg-white border border-slate-200 py-3 rounded-2xl text-xs font-black text-slate-700 hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 uppercase tracking-widest"
                              >
                                <Check className="w-4 h-4" /> Selecionar Fornecedor
                              </button>
                            )}
                          </div>
                        );
                      })}
                   </div>
                </div>

                {/* Section 2: Autorização */}
                {currentFulfillment.purchaseStatus === 'Cotação Aprovada' && (
                  <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl shadow-indigo-100 animate-in zoom-in-95">
                     <div className="flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6" />
                        <h4 className="font-black uppercase tracking-widest text-sm">Autorização de Pedido</h4>
                     </div>
                     <p className="text-sm text-indigo-100 leading-relaxed">
                        A cotação foi selecionada com sucesso. Agora o gestor responsável deve autorizar o pedido para que o financeiro proceda com o pagamento.
                     </p>
                     <button 
                        onClick={handleAuthorizeOrder}
                        className="w-full bg-white text-indigo-600 font-black py-4 rounded-2xl shadow-lg hover:bg-indigo-50 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                     >
                        <Zap className="w-5 h-5" /> Autorizar Pedido Agora
                     </button>
                  </div>
                )}

                {/* Section 3: Pagamento (Status Pedido Autorizado) */}
                {currentFulfillment.purchaseStatus === 'Pedido Autorizado' && (
                  <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-4 shadow-2xl">
                     <div className="flex items-center gap-3">
                        <CreditCard className="w-6 h-6 text-blue-400" />
                        <h4 className="font-black uppercase tracking-widest text-sm">Liquidação de Pedido</h4>
                     </div>
                     <p className="text-sm text-slate-400 leading-relaxed">
                        Este pedido está autorizado. Insira a data prevista de entrega informada pelo fornecedor antes de confirmar o pagamento.
                     </p>

                     <div className="space-y-2 py-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Prevista de Entrega</label>
                        <input 
                          type="date"
                          className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                          value={currentFulfillment.deliveryForecastDate || ''}
                          onChange={(e) => handleSetDeliveryForecast(e.target.value)}
                        />
                     </div>

                     <button 
                        onClick={() => handleSetComprado(currentRequest.id, activeSelection.fIndex)}
                        disabled={!currentFulfillment.deliveryForecastDate}
                        className={`w-full font-black py-4 rounded-2xl shadow-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${
                          currentFulfillment.deliveryForecastDate 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                     >
                        <CreditCard className="w-5 h-5" /> Confirmar Pagamento Realizado
                     </button>
                  </div>
                )}

                {/* Section 4: Entrega (Status Comprado) */}
                {currentFulfillment.purchaseStatus === 'Comprado' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4">
                     <div className="p-8 bg-emerald-600 rounded-[2.5rem] text-white space-y-6 shadow-xl">
                        <div className="flex items-center gap-3">
                           <Truck className="w-6 h-6" />
                           <h4 className="font-black uppercase tracking-widest text-sm">Acompanhamento Logístico</h4>
                        </div>
                        
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-emerald-200 uppercase tracking-widest ml-1">Data Prevista de Chegada</label>
                           <input 
                            type="date"
                            className="w-full bg-emerald-700/50 border border-emerald-500 rounded-2xl p-4 text-white focus:ring-2 focus:ring-white outline-none font-bold"
                            value={currentFulfillment.deliveryForecastDate || ''}
                            onChange={(e) => handleSetDeliveryForecast(e.target.value)}
                           />
                        </div>

                        <div className="p-4 bg-white/10 rounded-2xl flex items-start gap-3">
                           <AlertCircle className="w-5 h-5 text-emerald-200 shrink-0" />
                           <p className="text-[10px] text-emerald-50 font-bold leading-relaxed uppercase">
                             O item permanecerá no dashboard até que o TI confirme o recebimento e o número de série.
                           </p>
                        </div>

                        <button 
                          onClick={handleOpenReceipt}
                          className="w-full bg-white text-emerald-600 font-black py-4 rounded-2xl shadow-xl hover:bg-emerald-50 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                          <Tag className="w-5 h-5" /> Confirmar Entrega e Cadastrar Patrimônio
                        </button>
                     </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Modal de Recebimento e Tombamento (Cadastro no Inventário) */}
      {showReceiptForm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-emerald-600 p-8 text-white flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                       <QrCode className="w-7 h-7" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black tracking-tight">Entrada de Patrimônio</h3>
                       <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest">Recebimento de Item de Compra</p>
                    </div>
                 </div>
                 <button onClick={() => setShowReceiptForm(false)} className="p-2 hover:bg-white/10 rounded-full">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <form onSubmit={handleFinalizeAndCreateAsset} className="p-10 space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Patrimonial (Automático)</label>
                       <input 
                        className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-800"
                        value={receiptData.id}
                        onChange={e => setReceiptData({...receiptData, id: e.target.value})}
                        required
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Equipamento</label>
                       <input 
                        className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-500"
                        value={receiptData.type}
                        disabled
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Marca Recebida</label>
                       <input 
                        className="w-full p-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                        placeholder="Ex: Dell, Apple, LG..."
                        value={receiptData.brand}
                        onChange={e => setReceiptData({...receiptData, brand: e.target.value})}
                        required
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Modelo Exato</label>
                       <input 
                        className="w-full p-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                        placeholder="Ex: Latitude 5430"
                        value={receiptData.model}
                        onChange={e => setReceiptData({...receiptData, model: e.target.value})}
                        required
                       />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Notas de Recebimento / Serial Number</label>
                    <textarea 
                      className="w-full p-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-24 font-medium text-slate-600"
                      placeholder="Insira o número de série e observações técnicas..."
                      value={receiptData.observations}
                      onChange={e => setReceiptData({...receiptData, observations: e.target.value})}
                    />
                 </div>

                 <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                       <p className="text-xs font-bold text-emerald-800 leading-tight">Ao confirmar, o item será vinculado automaticamente a {getEmployeeName(currentRequest?.employeeId || '')}.</p>
                       <p className="text-[10px] text-emerald-600 mt-1 uppercase font-black">Uma etiqueta patrimonial será gerada no módulo de impressões.</p>
                    </div>
                 </div>

                 <button 
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                 >
                    <Check className="w-6 h-6" /> Finalizar e Gerar Patrimônio
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderManager;
