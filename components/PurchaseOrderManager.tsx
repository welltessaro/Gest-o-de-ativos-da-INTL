
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
  QrCode
} from 'lucide-react';
import { EquipmentRequest, Employee, ItemFulfillment, Quotation, Asset, HistoryEntry } from '../types';

interface PurchaseOrderManagerProps {
  requests: EquipmentRequest[];
  employees: Employee[];
  onUpdateRequest: (req: EquipmentRequest) => void;
  onAssetCreated: (asset: Omit<Asset, 'createdAt' | 'qrCode' | 'history'> & { history?: HistoryEntry[] }) => void;
}

const PurchaseOrderManager: React.FC<PurchaseOrderManagerProps> = ({ requests, employees, onUpdateRequest, onAssetCreated }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [activeSelection, setActiveSelection] = useState<{ requestId: string; fIndex: number } | null>(null);
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  
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
    newFulfillments[activeSelection.fIndex] = { ...newFulfillments[activeSelection.fIndex], purchaseStatus: 'Cotação Aprovada', approvedQuotationIndex: qIndex };
    onUpdateRequest({ ...currentRequest, itemFulfillments: newFulfillments });
  };

  const handleAuthorizeOrder = () => {
    if (!currentRequest || activeSelection === null) return;
    const newFulfillments = [...(currentRequest.itemFulfillments || [])];
    newFulfillments[activeSelection.fIndex] = { ...newFulfillments[activeSelection.fIndex], purchaseStatus: 'Pedido Autorizado' };
    onUpdateRequest({ ...currentRequest, itemFulfillments: newFulfillments });
  };

  const handleSetComprado = (requestId: string, fIndex: number) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;
    const newFulfillments = [...(req.itemFulfillments || [])];
    newFulfillments[fIndex] = { ...newFulfillments[fIndex], purchaseStatus: 'Comprado' };
    onUpdateRequest({ ...req, itemFulfillments: newFulfillments });
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

    const creationHistory: HistoryEntry = {
      id: Math.random().toString(),
      date: new Date().toISOString(),
      type: 'Criação',
      description: `Ativo tombado via Pedido de Compra referente à Requisição ${currentRequest.id}.`,
      performedBy: 'Sistema Financeiro'
    };

    const assignmentHistory: HistoryEntry = {
      id: Math.random().toString(),
      date: new Date().toISOString(),
      type: 'Atribuição',
      description: `Entregue ao colaborador no momento do tombamento.`,
      userContext: getEmployeeName(currentRequest.employeeId)
    };

    onAssetCreated({
      id: receiptData.id || '',
      brand: receiptData.brand || '',
      model: receiptData.model || '',
      type: currentFulfillment.type,
      departmentId: currentRequest.items.length > 0 ? 'DEPT-1' : 'DEPT-1', // Default TI
      status: 'Em Uso',
      assignedTo: currentRequest.employeeId,
      observations: receiptData.observations || '',
      photos: [],
      history: [creationHistory, assignmentHistory]
    });

    const newFulfillments = [...(currentRequest.itemFulfillments || [])];
    newFulfillments[activeSelection.fIndex] = { ...newFulfillments[activeSelection.fIndex], isDelivered: true, linkedAssetId: receiptData.id };
    onUpdateRequest({ ...currentRequest, itemFulfillments: newFulfillments });
    
    setShowReceiptForm(false);
    setActiveSelection(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Cotações Pendentes', count: purchaseItems.filter(i => (i.fulfillment.purchaseStatus || 'Pendente') === 'Pendente').length, color: 'amber' },
          { label: 'Aguard. Autorização', count: purchaseItems.filter(i => i.fulfillment.purchaseStatus === 'Cotação Aprovada').length, color: 'blue' },
          { label: 'Pedidos Autorizados', count: purchaseItems.filter(i => i.fulfillment.purchaseStatus === 'Pedido Autorizado').length, color: 'indigo' },
          { label: 'Em Trânsito', count: purchaseItems.filter(i => i.fulfillment.purchaseStatus === 'Comprado').length, color: 'emerald' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-3xl font-black text-${stat.color}-600 tracking-tight`}>{stat.count}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipamento</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Workflow</th>
              <th className="px-6 py-5 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map((item) => (
              <tr key={`${item.request.id}-${item.index}`} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setActiveSelection({ requestId: item.request.id, fIndex: item.index })}>
                <td className="px-6 py-6 font-bold text-slate-800">{item.fulfillment.type}</td>
                <td className="px-6 py-6 text-sm font-bold text-slate-700">{getEmployeeName(item.request.employeeId)}</td>
                <td className="px-6 py-6">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    (item.fulfillment.purchaseStatus || 'Pendente') === 'Pendente' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    item.fulfillment.purchaseStatus === 'Cotação Aprovada' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                  }`}>
                    {item.fulfillment.purchaseStatus || 'Pendente'}
                  </span>
                </td>
                <td className="px-6 py-6 text-right"><ChevronRight className="w-5 h-5 text-slate-300 ml-auto group-hover:translate-x-1" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeSelection && currentRequest && currentFulfillment && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveSelection(null)} />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col p-8 space-y-8 animate-in slide-in-from-right duration-300">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black uppercase tracking-tight">Gestão de Pedido de Compra</h3>
                <button onClick={() => setActiveSelection(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button>
             </div>
             
             {currentFulfillment.purchaseStatus === 'Comprado' ? (
                <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white space-y-6 shadow-xl">
                   <div className="flex items-center gap-3"><Truck className="w-6 h-6" /><h4 className="font-black uppercase tracking-widest text-sm">Acompanhamento Logístico</h4></div>
                   <button onClick={handleOpenReceipt} className="w-full bg-white text-emerald-600 font-black py-4 rounded-2xl shadow-xl uppercase tracking-widest text-xs">Confirmar Recebimento e Tombamento</button>
                </div>
             ) : (
                <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl shadow-indigo-100">
                   <div className="flex items-center gap-3"><ShieldCheck className="w-6 h-6" /><h4 className="font-black uppercase tracking-widest text-sm">Liquidação de Pedido</h4></div>
                   <button onClick={() => handleSetComprado(currentRequest.id, activeSelection.fIndex)} className="w-full bg-white text-indigo-600 font-black py-4 rounded-2xl shadow-lg uppercase tracking-widest text-xs">Confirmar Pagamento e Iniciar Trânsito</button>
                </div>
             )}
          </div>
        </div>
      )}

      {showReceiptForm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="bg-emerald-600 p-8 text-white flex items-center justify-between">
                 <h3 className="text-xl font-black uppercase tracking-tight">Registro Inicial de Histórico</h3>
                 <button onClick={() => setShowReceiptForm(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleFinalizeAndCreateAsset} className="p-10 space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Patrimonial</label>
                    <input className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-mono font-bold" value={receiptData.id} onChange={e => setReceiptData({...receiptData, id: e.target.value})} required />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <input className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold" placeholder="Marca (Ex: Dell)" value={receiptData.brand} onChange={e => setReceiptData({...receiptData, brand: e.target.value})} required />
                    <input className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold" placeholder="Modelo" value={receiptData.model} onChange={e => setReceiptData({...receiptData, model: e.target.value})} required />
                 </div>
                 <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                    <p className="text-xs font-bold text-emerald-800 leading-tight">Ao confirmar, o sistema registrará a criação do patrimônio e a entrega inicial ao usuário no histórico de vida do ativo.</p>
                 </div>
                 <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-[2rem] shadow-xl uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                    <Check className="w-6 h-6" /> Finalizar e Registrar Vida Útil
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderManager;
