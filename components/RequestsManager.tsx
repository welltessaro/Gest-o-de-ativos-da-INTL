
import React, { useState } from 'react';
import { 
  FileText, Plus, X, Clock, ChevronRight, CheckCircle, ShoppingCart, Link as LinkIcon, 
  Search, AlertCircle, User, Calendar, Package, Check, Ban, Truck, MessageSquare, 
  CheckSquare, Wrench, UserPlus, Loader2, ShieldCheck, Edit2, Trash2, Download, ImageIcon,
  Printer
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { EquipmentRequest, Employee, Asset, AssetType, UserAccount, AssetTypeConfig, LegalEntity } from '../types';
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
  legalEntities: LegalEntity[];
  companyLogo?: string | null; // NOVO PROP
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
  assetTypeConfigs,
  legalEntities,
  companyLogo
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

    // Busca dados da empresa vinculada
    const company = legalEntities.find(l => l.id === employee.legalEntityId);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const logo = companyLogo || localStorage.getItem('assettrack_logo'); // Fallback seguro

    // --- CONFIGURAÇÃO DE LAYOUT DO CABEÇALHO ---
    let leftContentMargin = 20;

    // 1. Logo (Lado Esquerdo)
    if (logo) {
       try {
         // Detecta formato se for Data URI (image/jpeg ou image/png)
         const isJpeg = logo.startsWith('data:image/jpeg') || logo.startsWith('data:image/jpg');
         const fmt = isJpeg ? 'JPEG' : 'PNG';
         
         // Posiciona logo em X=20, Y=10 com tamanho 30x30 para não distorcer muito e caber no header
         doc.addImage(logo, fmt, 20, 10, 30, 30); 
         
         // Empurra o texto para a direita (20 da margem + 30 do logo + 10 de respiro)
         leftContentMargin = 60; 
       } catch (e) { 
         console.error('Erro ao adicionar logo no PDF:', e); 
       }
    }

    // 2. Dados da Empresa (Lado Direito do Logo)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    
    // Coordenadas Y ajustadas para alinhar com o logo
    let currentY = 15; 

    if (company) {
       // Razão Social
       doc.text(company.socialReason.toUpperCase(), leftContentMargin, currentY);
       currentY += 6; // Espaçamento
       
       // CNPJ
       doc.setFont('helvetica', 'normal');
       doc.setFontSize(9);
       doc.text(`CNPJ: ${company.cnpj}`, leftContentMargin, currentY);
       currentY += 6;
       
       // Endereço com quebra de linha automática
       // Calcula largura disponível: Largura Pagina - Margem Esquerda Atual - Margem Direita (20)
       const maxAddressWidth = pageWidth - leftContentMargin - 20;
       const addressLines = doc.splitTextToSize(company.address, maxAddressWidth);
       doc.text(addressLines, leftContentMargin, currentY);
    } else {
       doc.text('ASSETTRACK PRO - GESTÃO DE ATIVOS', leftContentMargin, currentY);
       currentY += 6;
       doc.setFont('helvetica', 'normal');
       doc.setFontSize(9);
       doc.text('Controle Interno de Equipamentos', leftContentMargin, currentY);
    }

    // Linha Divisória do Cabeçalho (Baixada para Y=45 para garantir que não corte o logo/endereço)
    doc.setLineWidth(0.5);
    doc.line(20, 45, pageWidth - 20, 45);

    // --- TÍTULO DO DOCUMENTO ---
    const titleY = 60;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('TERMO DE RESPONSABILIDADE E ENTREGA', pageWidth / 2, titleY, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const dateStr = new Date(req.createdAt).toLocaleDateString('pt-BR');
    doc.text(`Protocolo: ${req.id}   |   Data de Emissão: ${dateStr}`, pageWidth / 2, titleY + 6, { align: 'center' });

    // --- SEÇÃO 1: COLABORADOR ---
    const section1Y = titleY + 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('1. IDENTIFICAÇÃO DO COLABORADOR', 20, section1Y);
    doc.line(20, section1Y + 2, pageWidth - 20, section1Y + 2);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nome: ${employee.name}`, 20, section1Y + 10);
    doc.text(`CPF: ${employee.cpf}`, 20, section1Y + 16);
    doc.text(`Departamento: ${employee.sector} / ${employee.role}`, 20, section1Y + 22);

    // --- SEÇÃO 2: EQUIPAMENTOS (TABELA) ---
    const section2Y = section1Y + 35;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('2. EQUIPAMENTOS ENTREGUES', 20, section2Y);
    doc.line(20, section2Y + 2, pageWidth - 20, section2Y + 2);

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
      startY: section2Y + 8,
      head: [['Tipo', 'Marca', 'Modelo', 'Patrimônio', 'Série']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' }, // Azul padrão profissional
      styles: { fontSize: 9, cellPadding: 2 },
      margin: { left: 20, right: 20 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;

    // --- SEÇÃO 3: TERMOS LEGAIS ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. DECLARAÇÃO DE RESPONSABILIDADE', 20, finalY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    const companyName = company ? company.socialReason : "a empresa";
    const text = `Declaro ter recebido os equipamentos acima descritos em perfeito estado de conservação e funcionamento, comprometendo-me a utilizá-los exclusivamente para fins profissionais de interesse de ${companyName}. \n\nAssumo total responsabilidade pela guarda, conservação e integridade dos mesmos, ciente de que danos causados por uso indevido, negligência ou extravio poderão ser objeto de ressarcimento conforme legislação trabalhista vigente (Art. 462 CLT). Em caso de desligamento ou solicitação formal, comprometo-me a devolver os itens imediatamente ao setor responsável.`;
    
    const splitText = doc.splitTextToSize(text, pageWidth - 40);
    doc.text(splitText, 20, finalY + 8);

    // --- ASSINATURAS ---
    const sigY = finalY + 50; // Espaço para assinar
    
    // Assinatura Colaborador
    doc.line(20, sigY, 90, sigY);
    doc.setFontSize(8);
    doc.text(employee.name.toUpperCase(), 55, sigY + 5, { align: 'center' });
    doc.text('Colaborador(a)', 55, sigY + 9, { align: 'center' });
    
    // Assinatura Gestor
    doc.line(120, sigY, 190, sigY);
    doc.text('GESTÃO DE ATIVOS / TI', 155, sigY + 5, { align: 'center' });
    doc.text('Responsável pela Entrega', 155, sigY + 9, { align: 'center' });

    // --- RODAPÉ DA PÁGINA 1 ---
    doc.setFontSize(7);
    doc.text('Documento gerado eletronicamente pelo sistema AssetTrack Pro.', 20, 285);
    doc.text('Página 1', pageWidth - 20, 285, { align: 'right' });

    // =========================================================================
    // SEGUNDA PÁGINA COM FOTOS (Anexo Fotográfico)
    // =========================================================================
    
    // Filtra ativos que possuem fotos
    const assetsWithPhotos = (req.itemFulfillments || [])
      .map(f => assets.find(a => a.id === f.linkedAssetId))
      .filter(a => a && a.photos && a.photos.length > 0) as Asset[];

    if (assetsWithPhotos.length > 0) {
      doc.addPage();
      
      // Cabeçalho Anexo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('ANEXO FOTOGRÁFICO - ESTADO DOS EQUIPAMENTOS', pageWidth / 2, 20, { align: 'center' });
      doc.setLineWidth(0.5);
      doc.line(20, 25, pageWidth - 20, 25);

      let currentY = 35;
      const marginX = 20;
      const colGap = 10;
      const imgWidth = 80;
      const imgHeight = 60;
      const col2X = marginX + imgWidth + colGap;

      assetsWithPhotos.forEach((asset) => {
        // Verifica se cabe o título do ativo na página
        if (currentY + 20 > pageHeight - 20) {
          doc.addPage();
          currentY = 20;
        }

        // Título do Ativo
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(240, 240, 240); // Fundo cinza claro
        doc.rect(marginX, currentY - 5, pageWidth - (marginX * 2), 8, 'F');
        doc.text(`${asset.type.toUpperCase()} - ${asset.brand} ${asset.model} (ID: ${asset.id})`, marginX + 2, currentY);
        currentY += 10;

        let currentCol = 0; // 0 = esquerda, 1 = direita

        asset.photos.forEach((photo) => {
          // Verifica se cabe a imagem
          if (currentY + imgHeight > pageHeight - 20) {
            doc.addPage();
            currentY = 20;
            currentCol = 0;
          }

          try {
            const isJpeg = photo.startsWith('data:image/jpeg') || photo.startsWith('data:image/jpg');
            const fmt = isJpeg ? 'JPEG' : 'PNG';
            
            const xPos = currentCol === 0 ? marginX : col2X;
            doc.addImage(photo, fmt, xPos, currentY, imgWidth, imgHeight);
            
            // Desenha borda na imagem
            doc.setDrawColor(200, 200, 200);
            doc.rect(xPos, currentY, imgWidth, imgHeight);

            // Controle de Coluna/Linha
            if (currentCol === 0) {
              currentCol = 1;
            } else {
              currentCol = 0;
              currentY += imgHeight + 10; // Avança linha
            }
          } catch (e) {
            console.error('Erro ao renderizar imagem no PDF', e);
          }
        });

        // Se terminou na coluna da esquerda, avança o Y para o próximo ativo não sobrepor
        if (currentCol === 1) {
          currentY += imgHeight + 10;
        }
        
        currentY += 5; // Espaço extra entre ativos
      });

      // Rodapé da Página 2+
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Anexo Fotográfico - AssetTrack Pro', 20, 285);
      doc.text(`Página ${pageCount}`, pageWidth - 20, 285, { align: 'right' });
    }

    doc.save(`Termo_${req.id}_${employee.name.split(' ')[0]}.pdf`);
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
