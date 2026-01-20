
import React, { useState } from 'react';
import { 
  FileText, Plus, X, Clock, ChevronRight, CheckCircle, ShoppingCart, Link as LinkIcon, 
  Search, AlertCircle, User, Calendar, Package, Check, Ban, Truck, MessageSquare, 
  CheckSquare, Wrench, UserPlus, Loader2, ShieldCheck, Edit2, Trash2, Download, ImageIcon,
  Printer
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { EquipmentRequest, Employee, Asset, AssetType, UserAccount, AssetTypeConfig } from '../types';
import { ASSET_TYPES } from '../constants';

interface RequestsManagerProps {
  requests: EquipmentRequest[];
  employees: Employee[];
  assets: Asset[];
  currentUser: UserAccount;
  onAddRequest: (req: Omit<EquipmentRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  onUpdateStatus: (id: string, status: EquipmentRequest['status']) => Promise<void>;
  onUpdateRequest: (req: EquipmentRequest) => Promise<void>;
  onRemoveRequest?: (id: string) => Promise<void>;
  assetTypeConfigs: AssetTypeConfig[];
}

const RequestsManager: React.FC<RequestsManagerProps> = ({ 
  requests, 
  employees, 
  assets, 
  currentUser, 
  onAddRequest, 
  onUpdateStatus, 
  onUpdateRequest, 
  onRemoveRequest,
  assetTypeConfigs 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EquipmentRequest | null>(null);
  const [itemToLink, setItemToLink] = useState<{ index: number; type: AssetType } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newReq, setNewReq] = useState<Omit<EquipmentRequest, 'id' | 'createdAt' | 'status'>>({
    requesterId: currentUser.id, 
    employeeId: '',
    items: [],
    observation: ''
  });

  const getEmployee = (id?: string | null) => employees.find(e => e.id === id);
  const getEmployeeName = (id?: string | null) => getEmployee(id)?.name || 'Desconhecido';
  
  const toggleItem = (type: AssetType) => {
    setNewReq(prev => ({
      ...prev,
      items: prev.items.includes(type) ? prev.items.filter(i => i !== type) : [...prev.items, type]
    }));
  };

  const generateResponsibilityTerm = (req: EquipmentRequest) => {
    const employee = getEmployee(req.employeeId);
    if (!employee) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Cabeçalho
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('TERMO DE RESPONSABILIDADE E ENTREGA', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Protocolo: ${req.id}`, pageWidth - 20, 30, { align: 'right' });
    doc.text(`Data: ${new Date(req.createdAt).toLocaleDateString('pt-BR')}`, pageWidth - 20, 35, { align: 'right' });

    // Dados do Colaborador
    doc.setFont('helvetica', 'bold');
    doc.text('1. IDENTIFICAÇÃO DO COLABORADOR', 20, 50);
    doc.line(20, 52, pageWidth - 20, 52);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${employee.name}`, 20, 60);
    doc.text(`CPF: ${employee.cpf}`, 20, 65);
    doc.text(`Departamento: ${employee.sector} / ${employee.role}`, 20, 70);

    // Lista de Equipamentos
    doc.setFont('helvetica', 'bold');
    doc.text('2. EQUIPAMENTOS ENTREGUES', 20, 85);
    doc.line(20, 87, pageWidth - 20, 87);

    const tableData = (req.itemFulfillments || []).map(f => {
      const asset = assets.find(a => a.id === f.linkedAssetId);
      return [
        f.type,
        asset?.brand || 'N/A',
        asset?.model || 'N/A',
        asset?.id || 'Pendente',
        asset?.serialNumber || 'S/N'
      ];
    });

    (doc as any).autoTable({
      startY: 92,
      head: [['Tipo', 'Marca', 'Modelo', 'Patrimônio', 'Série']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillGray: 200, textColor: 0, fontStyle: 'bold' },
      styles: { fontSize: 9 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;

    // Termos
    doc.setFont('helvetica', 'bold');
    doc.text('3. DECLARAÇÃO DE RESPONSABILIDADE', 20, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const text = `Declaro ter recebido os equipamentos acima descritos em perfeito estado de conservação e funcionamento, comprometendo-me a utilizá-los exclusivamente para fins profissionais de interesse da empresa. Assumo total responsabilidade pela guarda, conservação e integridade dos mesmos, ciente de que danos causados por uso indevido ou negligência poderão ser objeto de ressarcimento conforme legislação vigente. Em caso de desligamento, comprometo-me a devolver os itens imediatamente ao setor de TI.`;
    const splitText = doc.splitTextToSize(text, pageWidth - 40);
    doc.text(splitText, 20, finalY + 7);

    // Assinaturas
    const sigY = finalY + 60;
    doc.line(20, sigY, 90, sigY);
    doc.text('Assinatura do Colaborador', 35, sigY + 5);
    
    doc.line(120, sigY, 190, sigY);
    doc.text('Responsável TI (Entrega)', 135, sigY + 5);

    doc.save(`Termo_Responsabilidade_${req.id}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newReq.items.length === 0 || !newReq.employeeId) {
      alert("Preencha todos os campos.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onAddRequest({
        ...newReq,
        itemFulfillments: newReq.items.map(type => ({ type, isPurchaseOrder: false }))
      });
      setShowModal(false);
      setNewReq({ requesterId: currentUser.id, employeeId: '', items: [], observation: '' });
    } catch (err) { alert("Erro ao criar requisição."); }
    finally { setIsSubmitting(false); }
  };

  const handleLinkAsset = async (index: number, assetId: string) => {
    if (!selectedRequest) return;
    const newFulfillments = [...(selectedRequest.itemFulfillments || [])];
    newFulfillments[index] = { type: selectedRequest.items[index], linkedAssetId: assetId, isPurchaseOrder: false };
    const updated = { ...selectedRequest, itemFulfillments: newFulfillments };
    await onUpdateRequest(updated);
    setSelectedRequest(updated);
    setItemToLink(null);
  };

  const handleStatusChange = async (status: EquipmentRequest['status']) => {
    if (selectedRequest) {
      const updated = { ...selectedRequest, status };
      await onUpdateRequest(updated);
      setSelectedRequest(updated);
    }
  };

  const handleRemove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!onRemoveRequest) return;
    if (confirm("Tem certeza que deseja excluir permanentemente esta requisição?")) {
      try {
        await onRemoveRequest(id);
        if (selectedRequest?.id === id) setSelectedRequest(null);
      } catch (err) { alert("Falha ao excluir requisição."); }
    }
  };

  const availableAssetsByType = (type: AssetType) => {
    return assets.filter(a => a.type === type && a.status === 'Disponível');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
      <div className="lg:col-span-2 space-y-4 print:hidden">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
          <Clock className="w-5 h-5 text-blue-600" /> Fluxo de Atendimento
        </h3>
        
        {requests.map(req => (
          <div 
            key={req.id} 
            onClick={() => setSelectedRequest(req)}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all group cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-600"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                req.status === 'Pendente' ? 'bg-amber-100 text-amber-700' :
                req.status === 'Aprovado' ? 'bg-blue-100 text-blue-700' :
                req.status === 'Preparando' ? 'bg-indigo-100 text-indigo-700' :
                req.status === 'Entregue' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {req.status === 'Preparando' ? <Wrench className="w-6 h-6" /> : req.status === 'Entregue' ? <ShieldCheck className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
              </div>
              <div>
                <p className="font-black text-slate-900">{req.id}</p>
                <p className="text-sm text-slate-600 font-semibold">Para: {getEmployeeName(req.employeeId)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tight ${
                 req.status === 'Pendente' ? 'bg-amber-100 text-amber-800 border-amber-200' : 
                 req.status === 'Aprovado' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                 req.status === 'Preparando' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                 req.status === 'Entregue' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200'
               }`}>
                 {req.status}
               </span>
               <button onClick={(e) => handleRemove(e, req.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                 <Trash2 className="w-5 h-5" />
               </button>
               <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="bg-white p-16 rounded-[2.5rem] border border-dashed border-slate-300 text-center space-y-4">
             <p className="text-slate-600 font-black uppercase tracking-widest text-xs">Nenhuma solicitação encontrada.</p>
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl h-fit space-y-6 sticky top-24 print:hidden">
        <button 
          onClick={() => setShowModal(true)}
          className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Requisição</span>
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
                 <h3 className="text-xl font-black uppercase tracking-tight">Nova Requisição</h3>
                 <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto flex-1">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</label>
                    <select className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none font-bold" value={newReq.employeeId || ''} onChange={e => setNewReq({...newReq, employeeId: e.target.value})} required>
                       <option value="">Selecione...</option>
                       {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                       {(assetTypeConfigs.length > 0 ? assetTypeConfigs.map(t => t.name) : ASSET_TYPES).map(type => (
                         <button key={type} type="button" onClick={() => toggleItem(type as AssetType)} className={`p-3 rounded-xl border text-[10px] font-black uppercase ${newReq.items.includes(type as AssetType) ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                           {type}
                         </button>
                       ))}
                    </div>
                 </div>
                 <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] shadow-xl uppercase tracking-widest text-xs disabled:bg-slate-300">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Abrir Requisição"}
                 </button>
              </form>
           </div>
        </div>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setSelectedRequest(null); setItemToLink(null); }} />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedRequest.id}</h3>
                <p className="text-sm text-slate-600 font-bold">Destino: {getEmployeeName(selectedRequest.employeeId)}</p>
              </div>
              <div className="flex items-center gap-2">
                 <button onClick={(e) => handleRemove(e, selectedRequest.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors" title="Excluir Requisição">
                   <Trash2 className="w-5 h-5" />
                 </button>
                 <button onClick={() => { setSelectedRequest(null); setItemToLink(null); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-6 h-6" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
               {selectedRequest.items.map((itemType, idx) => {
                  const fulfillment = selectedRequest.itemFulfillments?.[idx];
                  const isLinked = !!fulfillment?.linkedAssetId;
                  return (
                    <div key={idx} className={`p-5 rounded-3xl border ${isLinked ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-black text-slate-900">{itemType}</span>
                        {isLinked && <span className="text-[10px] font-black uppercase text-emerald-800">Vinculado: {fulfillment.linkedAssetId}</span>}
                      </div>
                      {!isLinked && selectedRequest.status !== 'Entregue' && (
                        <button onClick={() => setItemToLink({ index: idx, type: itemType })} className="w-full py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all">
                          Vincular Ativo
                        </button>
                      )}
                      {itemToLink?.index === idx && (
                        <div className="mt-4 p-4 bg-slate-100 rounded-2xl border border-slate-300">
                           <div className="space-y-2">
                              {availableAssetsByType(itemType).map(asset => (
                                <button key={asset.id} onClick={() => handleLinkAsset(idx, asset.id)} className="w-full text-left p-3 bg-white border border-slate-300 rounded-xl hover:border-blue-600">
                                   <p className="text-xs font-black">{asset.id} - {asset.brand} {asset.model}</p>
                                </button>
                              ))}
                              {availableAssetsByType(itemType).length === 0 && <p className="text-[10px] font-black text-slate-400 text-center uppercase">Sem estoque disponível</p>}
                           </div>
                        </div>
                      )}
                    </div>
                  );
               })}
            </div>
            
            <div className="p-8 border-t border-slate-200 flex flex-col gap-3">
               {selectedRequest.status === 'Pendente' && <button onClick={() => handleStatusChange('Aprovado')} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs">Aprovar Pedido</button>}
               {selectedRequest.status === 'Aprovado' && <button onClick={() => handleStatusChange('Preparando')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs">Iniciar Preparação</button>}
               {selectedRequest.status === 'Preparando' && (
                 <button 
                  onClick={() => {
                    const allLinked = selectedRequest.itemFulfillments?.every(f => f.linkedAssetId || f.isPurchaseOrder);
                    if (!allLinked) {
                      alert("Vincule todos os ativos antes de confirmar a entrega.");
                      return;
                    }
                    handleStatusChange('Entregue');
                  }} 
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-emerald-100"
                 >
                   Confirmar Entrega
                 </button>
               )}
               {selectedRequest.status === 'Entregue' && (
                 <div className="space-y-3">
                   <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                     <CheckCircle className="w-5 h-5 text-emerald-600" />
                     <span className="text-xs font-black uppercase text-emerald-800 tracking-tight">Solicitação Finalizada</span>
                   </div>
                   <button 
                    onClick={() => generateResponsibilityTerm(selectedRequest)}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                   >
                     <Printer className="w-5 h-5" />
                     Imprimir Termo de Entrega
                   </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsManager;
