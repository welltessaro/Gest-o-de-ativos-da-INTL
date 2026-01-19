
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2,
  X,
  Cpu,
  Layers,
  Monitor,
  Wifi,
  Usb,
  Zap,
  Type,
  History,
  Clock,
  User,
  Wrench,
  CheckCircle2,
  Tag,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  PlusCircle,
  Save,
  MessageSquarePlus,
  AlertCircle,
  Loader2,
  Building2,
  Package
} from 'lucide-react';
import { Asset, AssetType, Employee, Department, HistoryEntry, AssetStatus } from '../types';
import { ASSET_TYPES } from '../constants';

interface AssetManagerProps {
  assets: Asset[];
  employees: Employee[];
  companies: Department[];
  onAdd: (asset: Omit<Asset, 'id' | 'createdAt' | 'qrCode' | 'history'> & { id?: string }) => Promise<void>;
  onUpdate: (asset: Asset) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

interface BulkAssetEntry {
  tempId: string;
  departmentId: string;
  type: AssetType;
  brand: string;
  model: string;
  ram: string;
  storage: string;
  screenSize: string;
  caseModel: string;
  isWireless: boolean;
  monitorInputs: string[];
  isAbnt: boolean;
  hasNumericKeypad: boolean;
  id: string; 
  assignedTo: string;
  observations: string;
}

const AssetManager: React.FC<AssetManagerProps> = ({ assets, employees, companies, onAdd, onUpdate, onRemove }) => {
  const [showForm, setShowForm] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [manualLog, setManualLog] = useState('');

  const [bulkEntries, setBulkEntries] = useState<BulkAssetEntry[]>([]);
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    type: 'Notebook',
    status: 'Disponível',
    photos: [],
    departmentId: '',
    ram: '',
    storage: '',
    screenSize: '',
    caseModel: '',
    isWireless: false,
    monitorInputs: [],
    isAbnt: true,
    hasNumericKeypad: true
  });

  // Garante que o ID do departamento esteja correto ao abrir o modal
  useEffect(() => {
    if (companies.length > 0 && !newAsset.departmentId) {
      setNewAsset(prev => ({ ...prev, departmentId: companies[0].id }));
      setBulkEntries([{ 
        tempId: '1', departmentId: companies[0].id, type: 'Notebook', brand: '', model: '', ram: '', storage: '', screenSize: '', caseModel: '', isWireless: false, monitorInputs: [], isAbnt: true, hasNumericKeypad: true, id: '', assignedTo: '', observations: '' 
      }]);
    }
  }, [companies, showForm, showBulkModal]);

  const getDepartmentName = (id: string) => companies.find(c => c.id === id)?.name || 'N/A';
  const getEmployeeName = (id?: string) => employees.find(e => e.id === id)?.name || 'Em Estoque';

  const handleAddManualLog = async () => {
    if (!detailAsset || !manualLog.trim()) return;

    const newEntry: HistoryEntry = {
      id: Math.random().toString(),
      date: new Date().toISOString(),
      type: 'Observação',
      description: manualLog,
      performedBy: 'Gestor de TI'
    };

    const updatedAsset: Asset = {
      ...detailAsset,
      history: [...(detailAsset.history || []), newEntry]
    };

    await onUpdate(updatedAsset);
    setDetailAsset(updatedAsset);
    setManualLog('');
  };

  const handleStatusChangeManual = async (newStatus: AssetStatus) => {
    if (!detailAsset) return;

    const newEntry: HistoryEntry = {
      id: Math.random().toString(),
      date: new Date().toISOString(),
      type: 'Status',
      description: `Status alterado manualmente de ${detailAsset.status} para ${newStatus}.`,
      performedBy: 'Gestor de TI'
    };

    const updatedAsset: Asset = {
      ...detailAsset,
      status: newStatus,
      history: [...(detailAsset.history || []), newEntry]
    };

    await onUpdate(updatedAsset);
    setDetailAsset(updatedAsset);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.departmentId) {
      alert("Selecione ou crie um departamento primeiro.");
      return;
    }
    await onAdd(newAsset as any);
    setShowForm(false);
    setNewAsset({ type: 'Notebook', status: 'Disponível', photos: [], departmentId: companies[0]?.id || '', ram: '', storage: '', screenSize: '', caseModel: '', isWireless: false, monitorInputs: [], isAbnt: true, hasNumericKeypad: true });
  };

  const handleBulkAddRow = () => {
    setBulkEntries([...bulkEntries, { 
      tempId: Math.random().toString(), 
      departmentId: companies[0]?.id || '', 
      type: 'Notebook', 
      brand: '', 
      model: '', 
      ram: '',
      storage: '',
      screenSize: '',
      caseModel: '',
      isWireless: false,
      monitorInputs: [],
      isAbnt: true,
      hasNumericKeypad: true,
      id: '', 
      assignedTo: '', 
      observations: '' 
    }]);
  };

  const handleBulkSave = async () => {
    if (companies.length === 0) {
      alert("Erro: Você precisa cadastrar pelo menos um Departamento antes.");
      return;
    }

    setIsSavingBulk(true);
    try {
      for (const entry of bulkEntries) {
        if (!entry.id) continue;
        await onAdd({
          id: entry.id,
          departmentId: entry.departmentId || companies[0].id,
          type: entry.type,
          brand: entry.brand,
          model: entry.model,
          ram: entry.ram,
          storage: entry.storage,
          screenSize: entry.screenSize,
          caseModel: entry.caseModel,
          isWireless: entry.isWireless,
          monitorInputs: entry.monitorInputs,
          isAbnt: entry.isAbnt,
          hasNumericKeypad: entry.hasNumericKeypad,
          observations: entry.observations,
          photos: [],
          status: entry.assignedTo ? 'Em Uso' : 'Disponível',
          assignedTo: entry.assignedTo || undefined,
        });
      }
      setShowBulkModal(false);
      setBulkEntries([{ tempId: '1', departmentId: companies[0]?.id || '', type: 'Notebook', brand: '', model: '', ram: '', storage: '', screenSize: '', caseModel: '', isWireless: false, monitorInputs: [], isAbnt: true, hasNumericKeypad: true, id: '', assignedTo: '', observations: '' }]);
    } catch (err) {
      alert("Erro ao salvar ativos em lote.");
    } finally {
      setIsSavingBulk(false);
    }
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || a.type === filterType;
    return matchesSearch && matchesType;
  });

  const toggleMonitorInput = (current: string[], val: string) => {
    return current.includes(val) ? current.filter(v => v !== val) : [...current, val];
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 print:hidden">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por modelo, marca ou ID..." 
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all shadow-sm font-semibold placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button onClick={() => setShowBulkModal(true)} className="flex items-center gap-2 px-4 py-3 text-xs font-black text-slate-800 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Lançar Levantamento
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-lg uppercase tracking-widest text-xs">
            <Plus className="w-5 h-5" />
            <span>Novo Ativo</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-widest">Ativo / Departamento</th>
                <th className="px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-widest">Tipo</th>
                <th className="px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-widest">Marca/Modelo</th>
                <th className="px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredAssets.map((asset) => (
                <tr 
                  key={asset.id} 
                  onClick={() => setDetailAsset(asset)}
                  className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 group-hover:text-blue-700">{asset.id}</span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-700 font-black uppercase">
                        <Layers className="w-3 h-3" />
                        {getDepartmentName(asset.departmentId)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-black text-slate-800">{asset.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-slate-900">{asset.brand}</span>
                    <span className="text-sm text-slate-700 ml-2 font-medium">{asset.model}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                      asset.status === 'Disponível' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      asset.status === 'Em Uso' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      asset.status === 'Manutenção' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={async (e) => {e.stopPropagation(); if(confirm("Remover este ativo?")) await onRemove(asset.id)}} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                       <Package className="w-12 h-12" />
                       <p className="font-black uppercase tracking-widest text-xs">Nenhum ativo registrado.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailAsset && (
        <div className="fixed inset-0 z-[150] flex items-center justify-end p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl h-full md:h-auto md:max-h-[90vh] md:rounded-[3rem] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                       <Tag className="w-7 h-7" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 tracking-tight">{detailAsset.id}</h3>
                       <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Rastreabilidade Total</p>
                    </div>
                 </div>
                 <button onClick={() => {setDetailAsset(null); setManualLog('');}} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                 <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Gestão de Status</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                       {(['Disponível', 'Em Uso', 'Manutenção', 'Baixado'] as AssetStatus[]).map(s => (
                          <button 
                            key={s}
                            onClick={() => handleStatusChangeManual(s)}
                            className={`py-2 text-[9px] font-black uppercase rounded-xl border transition-all ${
                               detailAsset.status === s ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                            }`}
                          >
                             {s}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Responsável Atual</p>
                       <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-blue-600" />
                          <p className="font-bold text-slate-800">{getEmployeeName(detailAsset.assignedTo)}</p>
                       </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Especificação</p>
                       <div className="flex items-center gap-3">
                          <Cpu className="w-5 h-5 text-blue-600" />
                          <p className="font-bold text-slate-800">{detailAsset.type} {detailAsset.brand}</p>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <History className="w-5 h-5 text-blue-600" />
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Linha do Tempo</h4>
                       </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Adicionar Log Manual</p>
                       <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="Descreva um evento..."
                            className="flex-1 p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600"
                            value={manualLog}
                            onChange={(e) => setManualLog(e.target.value)}
                          />
                          <button onClick={handleAddManualLog} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-black transition-colors shadow-lg">
                            <MessageSquarePlus className="w-5 h-5" />
                          </button>
                       </div>
                    </div>

                    <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                       {detailAsset.history?.length > 0 ? (
                         [...detailAsset.history].reverse().map((entry) => (
                           <div key={entry.id} className="relative group">
                              <div className={`absolute -left-[30px] top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                                entry.type === 'Manutenção' ? 'bg-amber-500' :
                                entry.type === 'Atribuição' ? 'bg-blue-600' :
                                entry.type === 'Criação' ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}>
                                {entry.type === 'Manutenção' && <Wrench className="w-3 h-3 text-white" />}
                                {entry.type === 'Atribuição' && <User className="w-3 h-3 text-white" />}
                                {entry.type === 'Criação' && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                              <div className="space-y-1">
                                 <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(entry.date).toLocaleDateString('pt-BR')}</p>
                                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{entry.type}</span>
                                 </div>
                                 <p className="text-sm text-slate-800 font-bold leading-relaxed">{entry.description}</p>
                              </div>
                           </div>
                         ))
                       ) : <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs opacity-50">Nenhum histórico</p>}
                    </div>
                 </div>
              </div>
              
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                 <button onClick={() => setDetailAsset(null)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all">Fechar</button>
              </div>
           </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300 print:hidden">
          <div className="h-20 bg-slate-800/50 border-b border-white/10 flex items-center justify-between px-8 text-white">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="font-black tracking-tight">Levantamento de Campo em Lote</h3>
                  <p className="text-[10px] text-slate-200 font-black uppercase tracking-widest">Coleta Física de Inventário</p>
               </div>
            </div>
            <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
               <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-8">
             {companies.length === 0 ? (
               <div className="bg-white rounded-[2.5rem] p-20 text-center flex flex-col items-center justify-center space-y-6">
                  <Building2 className="w-20 h-20 text-slate-200" />
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Banco Sem Departamentos</h3>
                  <p className="text-slate-500 max-w-sm text-sm">Cadastre os Departamentos antes de lançar o levantamento.</p>
                  <button onClick={() => setShowBulkModal(false)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest">Voltar</button>
               </div>
             ) : (
              <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-800 uppercase w-48 tracking-widest">Depto / Tipo</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-800 uppercase tracking-widest">Marca / Modelo</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-800 uppercase tracking-widest">Patrimônio</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-800 uppercase tracking-widest">Responsável</th>
                            <th className="px-6 py-4"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bulkEntries.map((entry, idx) => (
                            <tr key={entry.tempId} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 space-y-2">
                                  <select className="w-full p-2 bg-slate-100 rounded-xl text-xs font-bold border-none appearance-none" value={entry.departmentId} onChange={e => {const n=[...bulkEntries]; n[idx].departmentId=e.target.value; setBulkEntries(n)}}>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                  </select>
                                  <select className="w-full p-2 bg-white rounded-xl text-xs font-bold border border-slate-300 appearance-none" value={entry.type} onChange={e => {const n=[...bulkEntries]; n[idx].type=e.target.value as AssetType; setBulkEntries(n)}}>
                                    {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                  </select>
                                </td>
                                <td className="px-6 py-4 space-y-2">
                                  <input className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold" placeholder="Marca" value={entry.brand} onChange={e => {const n=[...bulkEntries]; n[idx].brand=e.target.value; setBulkEntries(n)}} />
                                  <input className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold" placeholder="Modelo" value={entry.model} onChange={e => {const n=[...bulkEntries]; n[idx].model=e.target.value; setBulkEntries(n)}} />
                                </td>
                                <td className="px-6 py-4">
                                  <input className="w-full p-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-mono font-black uppercase text-center" placeholder="ID PATRIMONIAL" value={entry.id} onChange={e => {const n=[...bulkEntries]; n[idx].id=e.target.value; setBulkEntries(n)}} />
                                </td>
                                <td className="px-6 py-4">
                                  <select className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold appearance-none" value={entry.assignedTo} onChange={e => {const n=[...bulkEntries]; n[idx].assignedTo=e.target.value; setBulkEntries(n)}}>
                                    <option value="">ESTOQUE</option>
                                    {employees.filter(emp => emp.departmentId === entry.departmentId).map(emp => (
                                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button onClick={() => setBulkEntries(bulkEntries.filter(b => b.tempId !== entry.tempId))} className="text-slate-400 hover:text-rose-500 transition-colors p-2"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                          ))}
                        </tbody>
                    </table>
                  </div>
                  <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                    <button onClick={handleBulkAddRow} disabled={isSavingBulk} className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:underline disabled:opacity-30">
                        <PlusCircle className="w-5 h-5" /> Item
                    </button>
                    <div className="flex gap-4">
                        <button onClick={() => setShowBulkModal(false)} className="px-8 py-3 font-black text-slate-500 uppercase text-xs tracking-widest">Descartar</button>
                        <button onClick={handleBulkSave} disabled={isSavingBulk} className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-3 rounded-2xl font-black shadow-xl shadow-emerald-100 flex items-center gap-2 uppercase tracking-widest text-xs transition-all disabled:bg-slate-400">
                          {isSavingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Salvar Levantamento
                        </button>
                    </div>
                  </div>
              </div>
             )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in zoom-in-95">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl"><Plus className="w-8 h-8" /></div>
                <h3 className="text-2xl font-black">Novo Patrimônio</h3>
             </div>
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tipo</label>
                      <select className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none font-bold appearance-none" value={newAsset.type} onChange={e => setNewAsset({...newAsset, type: e.target.value as any})}>
                         {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Marca</label>
                      <input className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none font-bold" value={newAsset.brand} onChange={e => setNewAsset({...newAsset, brand: e.target.value})} placeholder="Dell" required />
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Modelo</label>
                   <input className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none font-bold" value={newAsset.model} onChange={e => setNewAsset({...newAsset, model: e.target.value})} placeholder="Latitude 5420" required />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Departamento</label>
                   <select className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none font-bold appearance-none" value={newAsset.departmentId} onChange={e => setNewAsset({...newAsset, departmentId: e.target.value})} required>
                     {companies.length === 0 && <option value="">Nenhum Depto Encontrado</option>}
                     {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-4 font-black text-slate-400 uppercase tracking-widest text-xs">Cancelar</button>
                   <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl uppercase tracking-widest text-xs">Salvar Ativo</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetManager;
