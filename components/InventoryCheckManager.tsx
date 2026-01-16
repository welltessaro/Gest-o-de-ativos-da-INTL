
import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ClipboardList, 
  FileText, 
  ArrowRight,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  User,
  Package,
  AlertCircle,
  Eye,
  Download
} from 'lucide-react';
import { Asset, Employee, AuditSession, AuditStatus, AuditEntry, EquipmentRequest } from '../types';

interface InventoryCheckManagerProps {
  assets: Asset[];
  employees: Employee[];
  auditSessions: AuditSession[];
  onAddAuditSession: (session: AuditSession) => void;
  onUpdateAuditSession: (session: AuditSession) => void;
  onGenerateDivergenceRequest: (sector: string, assets: string[]) => void;
}

const InventoryCheckManager: React.FC<InventoryCheckManagerProps> = ({ 
  assets, 
  employees, 
  auditSessions, 
  onAddAuditSession, 
  onUpdateAuditSession,
  onGenerateDivergenceRequest
}) => {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'entry'>('list');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const sectors = useMemo(() => Array.from(new Set(employees.map(e => e.sector))), [employees]);

  const selectedSession = useMemo(() => 
    auditSessions.find(s => s.id === selectedSessionId) || null
  , [auditSessions, selectedSessionId]);

  const handleCreateSession = () => {
    if (!selectedSector) return;
    
    const newSession: AuditSession = {
      id: `AUD-${Date.now()}`,
      sector: selectedSector,
      createdAt: new Date().toLocaleDateString('pt-BR'),
      entries: [],
      isFinished: false
    };
    
    onAddAuditSession(newSession);
    setSelectedSessionId(newSession.id);
    setActiveView('entry');
  };

  const assetsInSector = useMemo(() => {
    const currentSector = selectedSession ? selectedSession.sector : selectedSector;
    if (!currentSector) return [];
    
    const employeesInSector = employees.filter(e => e.sector === currentSector).map(e => e.id);
    return assets.filter(a => a.assignedTo && employeesInSector.includes(a.assignedTo));
  }, [assets, employees, selectedSector, selectedSession]);

  const handleUpdateEntry = (assetId: string, status: AuditStatus) => {
    if (!selectedSession) return;
    
    const newEntries = [...selectedSession.entries];
    const existingIndex = newEntries.findIndex(e => e.assetId === assetId);
    
    if (existingIndex >= 0) {
      newEntries[existingIndex] = { ...newEntries[existingIndex], status, checkedAt: new Date().toISOString() };
    } else {
      newEntries.push({ assetId, status, checkedAt: new Date().toISOString() });
    }
    
    onUpdateAuditSession({ ...selectedSession, entries: newEntries });
  };

  const handleFinishAudit = () => {
    if (!selectedSession) return;
    
    const issues = selectedSession.entries.filter(e => e.status === 'Ruim' || e.status === 'Não Encontrado');
    const updatedSession = { ...selectedSession, isFinished: true };
    
    onUpdateAuditSession(updatedSession);

    if (issues.length > 0) {
      const assetIds = issues.map(i => i.assetId);
      onGenerateDivergenceRequest(selectedSession.sector, assetIds);
      alert(`${issues.length} divergências encontradas! Um pedido de confronto foi gerado para o setor ${selectedSession.sector}.`);
    } else {
      alert('Auditoria concluída com sucesso! Nenhuma divergência encontrada.');
    }
    
    setActiveView('list');
    setSelectedSessionId(null);
  };

  const triggerPrint = () => {
    window.print();
  };

  const getEmployeeName = (id?: string) => employees.find(e => e.id === id)?.name || 'N/A';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* UI SECTION: Only visible on screen */}
      <div className="print:hidden space-y-8">
        {activeView === 'list' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Check Semestral</h3>
                <p className="text-slate-500 font-medium">Gestão de auditorias de ativos por setor.</p>
              </div>
              <button 
                onClick={() => setActiveView('create')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 flex items-center gap-2 transition-all transform active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Nova Auditoria
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {auditSessions.map(session => (
                <div 
                  key={session.id} 
                  className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col"
                  onClick={() => {
                    setSelectedSessionId(session.id);
                    setActiveView('entry');
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                      <ClipboardList className="w-6 h-6" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      session.isFinished ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {session.isFinished ? 'Concluída' : 'Em Aberto'}
                    </span>
                  </div>
                  
                  <h4 className="text-xl font-black text-slate-800 mb-1">{session.sector}</h4>
                  <p className="text-sm text-slate-400 font-bold mb-4 uppercase tracking-tighter">{session.id} • {session.createdAt}</p>
                  
                  <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">{session.entries.length} itens conferidos</span>
                    <div className="flex items-center gap-1 text-blue-600 text-xs font-black uppercase tracking-widest">
                      Gerenciar <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}

              {auditSessions.length === 0 && (
                <div className="col-span-full py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                    <FileText className="w-10 h-10 text-slate-200" />
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold">Nenhuma auditoria iniciada.</p>
                    <p className="text-xs text-slate-300">Comece uma nova auditoria para validar os ativos da empresa.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'create' && (
          <div className="max-w-xl mx-auto space-y-8 animate-in zoom-in-95 duration-300 py-10">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">Iniciar Auditoria</h3>
              <p className="text-slate-500 font-medium">Selecione o setor que deseja auditar no momento.</p>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Setor Alvo</label>
                <div className="grid grid-cols-2 gap-3">
                  {sectors.map(sector => (
                    <button
                      key={sector}
                      onClick={() => setSelectedSector(sector)}
                      className={`p-4 rounded-2xl border font-bold text-sm transition-all ${
                        selectedSector === sector 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-100 scale-[1.02]' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                      }`}
                    >
                      {sector}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveView('list')}
                  className="flex-1 px-8 py-4 rounded-2xl font-bold text-slate-400 hover:text-slate-600"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateSession}
                  disabled={!selectedSector}
                  className={`flex-1 px-8 py-4 rounded-2xl font-black shadow-xl transition-all ${
                    selectedSector ? 'bg-slate-900 text-white shadow-slate-200 hover:bg-black' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  Iniciar Auditoria
                </button>
              </div>
            </div>
          </div>
        )}

        {activeView === 'entry' && selectedSession && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveView('list')}
                  className="p-3 bg-white border border-slate-100 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all shadow-sm"
                >
                  <X className="w-6 h-6" />
                </button>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Lançamento: {selectedSession.sector}</h3>
                  <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest font-black">{selectedSession.id}</p>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={() => setShowPrintPreview(true)}
                  className="flex-1 md:flex-none bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <Eye className="w-5 h-5" />
                  Visualizar Impressão
                </button>
                {!selectedSession.isFinished && (
                  <button 
                    onClick={handleFinishAudit}
                    disabled={selectedSession.entries.length < assetsInSector.length}
                    className={`flex-1 md:flex-none px-8 py-4 rounded-2xl font-black shadow-xl transition-all ${
                      selectedSession.entries.length >= assetsInSector.length 
                        ? 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Finalizar Auditoria
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                 <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" /> Itens no Inventário para este Setor
                    </h4>
                    <span className="text-xs font-bold text-slate-500">{selectedSession.entries.length} de {assetsInSector.length} conferidos</span>
                 </div>
                 <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-500" 
                      style={{ width: `${(selectedSession.entries.length / assetsInSector.length) * 100}%` }}
                    />
                 </div>
              </div>

              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/30 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipamento</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proprietário / ID Ativo</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado de Conservação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assetsInSector.map(asset => {
                    const entry = selectedSession.entries.find(e => e.assetId === asset.id);
                    const isFinished = selectedSession.isFinished;

                    return (
                      <tr key={asset.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                              <Package className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{asset.type}</p>
                              <p className="text-xs text-slate-500">{asset.brand} {asset.model}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-300" />
                            <p className="text-sm font-bold text-slate-700">{getEmployeeName(asset.assignedTo)}</p>
                          </div>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">{asset.id}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-center gap-2">
                            {(['Bom', 'Regular', 'Ruim', 'Não Encontrado'] as AuditStatus[]).map(status => (
                              <button
                                key={status}
                                disabled={isFinished}
                                onClick={() => handleUpdateEntry(asset.id, status)}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                  entry?.status === status
                                    ? status === 'Bom' ? 'bg-emerald-600 border-emerald-700 text-white' :
                                      status === 'Regular' ? 'bg-blue-600 border-blue-700 text-white' :
                                      status === 'Ruim' ? 'bg-rose-600 border-rose-700 text-white' :
                                      'bg-slate-900 border-slate-900 text-white'
                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                                } ${isFinished ? 'cursor-default' : ''}`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {assetsInSector.length === 0 && (
                <div className="p-20 text-center flex flex-col items-center">
                  <AlertCircle className="w-10 h-10 text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold">Nenhum ativo vinculado a este setor.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PRINT PREVIEW MODAL: Simulates a PDF interface */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300 print:hidden">
          {/* Header Toolbar */}
          <div className="h-20 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-8 text-white shadow-2xl">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="font-black tracking-tight">Visualizador de Documentos</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Prévia da Folha de Campo • {selectedSession?.sector}</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <button 
                onClick={() => setShowPrintPreview(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
               >
                 Cancelar
               </button>
               <button 
                onClick={triggerPrint}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black flex items-center gap-2 shadow-xl shadow-blue-900/20 transition-all transform active:scale-95"
               >
                 <Printer className="w-5 h-5" />
                 Imprimir ou Salvar PDF
               </button>
            </div>
          </div>

          {/* Document Content Area */}
          <div className="flex-1 overflow-auto p-12 flex justify-center bg-slate-900/50">
             <div className="w-full max-w-[210mm] bg-white shadow-[0_0_100px_rgba(0,0,0,0.5)] p-12 text-black min-h-[297mm]">
                <div className="border-4 border-black p-8">
                   <div className="flex justify-between items-start mb-8 border-b-4 border-black pb-6">
                      <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter">AssetTrack Pro</h1>
                        <p className="text-xl font-bold italic text-slate-600">Check Semestral de Patrimônio</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black uppercase text-xs">Setor: <span className="underline">{selectedSession?.sector || selectedSector}</span></p>
                        <p className="font-black uppercase text-xs">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                        <p className="font-black uppercase text-xs">ID: {selectedSession?.id || 'NOVO-CHECK'}</p>
                      </div>
                   </div>

                   <div className="mb-10 p-6 bg-slate-100 border-2 border-black rounded-lg">
                      <p className="text-xs uppercase font-black leading-tight mb-2">Instruções para o Auditor:</p>
                      <ul className="text-xs space-y-2 font-bold text-slate-800">
                         <li>1. Verifique fisicamente a presença do ID Patrimonial no equipamento.</li>
                         <li>2. Marque com um "X" a coluna correspondente ao estado físico (B=Bom, R=Regular, U=Ruim, NE=Não Encontrado).</li>
                         <li>3. Ao final, solicite a assinatura do gestor do setor para validar o inventário.</li>
                      </ul>
                   </div>

                   <table className="w-full border-collapse border-2 border-black mb-16">
                      <thead>
                        <tr className="bg-slate-200">
                          <th className="border-2 border-black p-3 text-xs uppercase font-black text-left">Equipamento / Especificações</th>
                          <th className="border-2 border-black p-3 text-xs uppercase font-black text-left">ID Patrimonial | Responsável</th>
                          <th className="border-2 border-black p-3 text-xs uppercase font-black w-12 text-center">B</th>
                          <th className="border-2 border-black p-3 text-xs uppercase font-black w-12 text-center">R</th>
                          <th className="border-2 border-black p-3 text-xs uppercase font-black w-12 text-center">U</th>
                          <th className="border-2 border-black p-3 text-xs uppercase font-black w-12 text-center">NE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assetsInSector.map(asset => (
                          <tr key={asset.id} className="border-b border-slate-200">
                            <td className="border-x-2 border-black p-4 text-[11px] font-bold">
                              {asset.type} — {asset.brand} {asset.model}
                            </td>
                            <td className="border-x-2 border-black p-4 text-[11px]">
                              <span className="font-black">{asset.id}</span> <br/> 
                              <span className="text-slate-500 uppercase">{getEmployeeName(asset.assignedTo)}</span>
                            </td>
                            <td className="border-x-2 border-black p-4 text-center"><div className="w-6 h-6 border-2 border-black mx-auto bg-slate-50" /></td>
                            <td className="border-x-2 border-black p-4 text-center"><div className="w-6 h-6 border-2 border-black mx-auto bg-slate-50" /></td>
                            <td className="border-x-2 border-black p-4 text-center"><div className="w-6 h-6 border-2 border-black mx-auto bg-slate-50" /></td>
                            <td className="border-x-2 border-black p-4 text-center"><div className="w-6 h-6 border-2 border-black mx-auto bg-slate-50" /></td>
                          </tr>
                        ))}
                        {/* Fill remaining space to maintain document aesthetic if needed */}
                      </tbody>
                   </table>

                   <div className="mt-24 grid grid-cols-2 gap-24">
                      <div className="border-t-4 border-black pt-4 text-center">
                         <p className="text-xs font-black uppercase tracking-widest">Assinatura Auditor TI</p>
                         <p className="text-[10px] mt-1 text-slate-500 font-bold">NOME: __________________________</p>
                      </div>
                      <div className="border-t-4 border-black pt-4 text-center">
                         <p className="text-xs font-black uppercase tracking-widest">Responsável pelo Setor</p>
                         <p className="text-[10px] mt-1 text-slate-500 font-bold uppercase">SETOR: {selectedSession?.sector || selectedSector}</p>
                      </div>
                   </div>

                   <div className="mt-20 text-center">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Documento Gerado Digitalmente via AssetTrack Pro Enterprise — Licenciado para Uso Interno</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* PRINT SECTION: Only visible on paper (Triggered bytriggerPrint) */}
      <div id="audit-print-area" className="hidden print:block font-serif bg-white text-black p-0 w-full">
        <div className="p-8 border-4 border-black mb-6">
           <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter">AssetTrack Pro</h1>
                <p className="text-lg font-bold italic">Check Semestral de Patrimônio</p>
              </div>
              <div className="text-right">
                <p className="font-bold uppercase text-xs">Setor: {selectedSession?.sector || selectedSector}</p>
                <p className="font-bold uppercase text-xs">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                <p className="font-bold uppercase text-xs">ID Sessão: {selectedSession?.id || 'NOVO-CHECK'}</p>
              </div>
           </div>

           <table className="w-full border-collapse border-2 border-black mb-10">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border-2 border-black p-2 text-xs uppercase font-black">Equipamento</th>
                  <th className="border-2 border-black p-2 text-xs uppercase font-black">ID / Responsável</th>
                  <th className="border-2 border-black p-2 text-xs uppercase font-black w-10 text-center">B</th>
                  <th className="border-2 border-black p-2 text-xs uppercase font-black w-10 text-center">R</th>
                  <th className="border-2 border-black p-2 text-xs uppercase font-black w-10 text-center">U</th>
                  <th className="border-2 border-black p-2 text-xs uppercase font-black w-10 text-center">NE</th>
                </tr>
              </thead>
              <tbody>
                {assetsInSector.map(asset => (
                  <tr key={asset.id}>
                    <td className="border border-black p-2 text-[10px] font-bold">
                      {asset.type} — {asset.brand} {asset.model}
                    </td>
                    <td className="border border-black p-2 text-[10px]">
                      {asset.id} | {getEmployeeName(asset.assignedTo)}
                    </td>
                    <td className="border border-black p-2 text-center"><div className="w-5 h-5 border border-black mx-auto" /></td>
                    <td className="border border-black p-2 text-center"><div className="w-5 h-5 border border-black mx-auto" /></td>
                    <td className="border border-black p-2 text-center"><div className="w-5 h-5 border border-black mx-auto" /></td>
                    <td className="border border-black p-2 text-center"><div className="w-5 h-5 border border-black mx-auto" /></td>
                  </tr>
                ))}
              </tbody>
           </table>

           <div className="mt-16 grid grid-cols-2 gap-20">
              <div className="border-t-2 border-black pt-2 text-center">
                 <p className="text-[10px] font-black uppercase tracking-widest">Assinatura Auditor TI</p>
              </div>
              <div className="border-t-2 border-black pt-2 text-center">
                 <p className="text-[10px] font-black uppercase tracking-widest">Responsável Setor</p>
              </div>
           </div>
        </div>
      </div>

      <style>{`
        @media print {
          /* Hide everything except the print area */
          body, html, #root { background: white !important; margin: 0; padding: 0; }
          header, aside, main > header, nav, button, .print\\:hidden, #root > * { display: none !important; }
          
          #audit-print-area { 
            display: block !important; 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            visibility: visible !important;
          }
          
          #audit-print-area * { visibility: visible !important; }

          @page { size: portrait; margin: 1.5cm; }
        }
      `}</style>
    </div>
  );
};

export default InventoryCheckManager;
