
import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Package,
  ArrowLeftRight,
  Camera,
  ImageIcon,
  ScanBarcode,
  Edit2,
  HardDrive,
  Microchip,
  Filter,
  Eye,
  EyeOff,
  Book,
  DollarSign
} from 'lucide-react';
import { Asset, AssetType, Employee, Department, HistoryEntry, AssetStatus, AssetTypeConfig, AccountingClassification } from '../types';

interface AssetManagerProps {
  assets: Asset[];
  employees: Employee[];
  companies: Department[];
  assetTypeConfigs: AssetTypeConfig[];
  classifications: AccountingClassification[];
  onAdd: (asset: Omit<Asset, 'id' | 'createdAt' | 'qrCode' | 'history'> & { id?: string }) => Promise<void>;
  onUpdate: (asset: Asset) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

const AssetManager: React.FC<AssetManagerProps> = ({ assets, employees, companies, assetTypeConfigs, classifications, onAdd, onUpdate, onRemove }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRetired, setShowRetired] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Asset>>({
    id: '',
    type: 'Notebook',
    status: 'Disponível',
    brand: '',
    model: '',
    serialNumber: '',
    observations: '',
    photos: [],
    departmentId: '',
    assignedTo: '',
    ram: '',
    storage: '',
    processor: '',
    screenSize: '',
    caseModel: '',
    isWireless: false,
    monitorInputs: [],
    isAbnt: true,
    hasNumericKeypad: true,
    purchaseValue: 0
  });

  useEffect(() => {
    if (companies.length > 0 && !formData.departmentId && !editingAsset) {
      setFormData(prev => ({ ...prev, departmentId: companies[0].id }));
    }
  }, [companies, showForm, editingAsset]);

  const getDepartmentName = (id: string) => companies.find(c => c.id === id)?.name || 'N/A';
  const getEmployeeName = (id?: string) => employees.find(e => e.id === id)?.name || 'Em Estoque';

  const getClassificationForType = (typeName: string) => {
    const config = assetTypeConfigs.find(t => t.name === typeName);
    if (!config) return null;
    return classifications.find(c => c.id === config.classificationId);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photos: [...(prev.photos || []), reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos?.filter((_, i) => i !== index)
    }));
  };

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({ ...asset });
    setShowForm(true);
    setDetailAsset(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingAsset) {
        await onUpdate({ ...editingAsset, ...formData } as Asset);
      } else {
        await onAdd(formData as any);
      }
      setShowForm(false);
      resetFormData();
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const resetFormData = () => {
    setFormData({ 
      id: '', type: assetTypeConfigs[0]?.name || 'Notebook', status: 'Disponível', brand: '', model: '', serialNumber: '', 
      observations: '', photos: [], departmentId: companies[0]?.id || '', assignedTo: '',
      ram: '', storage: '', processor: '', screenSize: '', caseModel: '',
      isWireless: false, monitorInputs: [], isAbnt: true, hasNumericKeypad: true, purchaseValue: 0
    });
    setEditingAsset(null);
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = 
      a.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVisibility = showRetired ? true : a.status !== 'Baixado';
    return matchesSearch && matchesVisibility;
  });

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 print:hidden">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Filtrar por ID, marca ou modelo..." 
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all shadow-sm font-semibold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button 
            onClick={() => setShowRetired(!showRetired)} 
            className={`flex items-center gap-2 px-4 py-3 text-xs font-black border rounded-2xl transition-all uppercase tracking-widest ${
              showRetired ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            {showRetired ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showRetired ? 'Ocultar Inativos' : 'Ver Inativos'}
          </button>
          <button 
            onClick={() => { resetFormData(); setShowForm(true); }} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-lg uppercase tracking-widest text-xs"
          >
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
                <th className="px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-widest">ID / Serial</th>
                <th className="px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-widest">Tipo / Classificação</th>
                <th className="px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-widest">Marca/Modelo</th>
                <th className="px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-widest">Responsável</th>
                <th className="px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredAssets.map((asset) => {
                const classification = getClassificationForType(asset.type);
                return (
                  <tr 
                    key={asset.id} 
                    onClick={() => setDetailAsset(asset)}
                    className={`hover:bg-blue-50/50 transition-colors cursor-pointer group ${asset.status === 'Baixado' ? 'bg-slate-50/50 opacity-60 grayscale' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900">{asset.id}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{asset.serialNumber || 'S/N'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">{asset.type}</span>
                        {classification && (
                          <div className="flex items-center gap-1 mt-1">
                            <Book className="w-2.5 h-2.5 text-blue-500" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{classification.name}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900">{asset.brand}</span>
                      <span className="text-sm text-slate-700 ml-2">{asset.model}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">{getEmployeeName(asset.assignedTo)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                        asset.status === 'Disponível' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        asset.status === 'Em Uso' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        asset.status === 'Manutenção' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        asset.status === 'Baixado' ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-slate-50 text-slate-700'
                      }`}>
                        {asset.status === 'Baixado' ? 'INATIVO' : asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEditModal(asset); }} 
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                       {editingAsset ? <Edit2 className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                         {editingAsset ? 'Editar Ativo' : 'Novo Registro de Ativo'}
                       </h3>
                       <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Inventário Técnico Enterprise</p>
                    </div>
                 </div>
                 <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                    <X className="w-6 h-6 text-slate-400" />
                 </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Patrimonial</label>
                       <input 
                         className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-mono font-bold outline-none focus:ring-2 focus:ring-blue-600" 
                         value={formData.id} 
                         onChange={e => setFormData({...formData, id: e.target.value})} 
                         placeholder="Ex: AST-001 (Opcional)"
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Ativo</label>
                       <select 
                         className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold outline-none focus:ring-2 focus:ring-blue-600"
                         value={formData.type}
                         onChange={e => setFormData({...formData, type: e.target.value as AssetType})}
                       >
                         {assetTypeConfigs.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                         {assetTypeConfigs.length === 0 && <option value="Notebook">Notebook</option>}
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsável Atual</label>
                       <select 
                         className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold outline-none focus:ring-2 focus:ring-blue-600"
                         value={formData.assignedTo}
                         onChange={e => setFormData({...formData, assignedTo: e.target.value})}
                       >
                         <option value="">Disponível (Em Estoque)</option>
                         {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marca</label>
                       <input 
                         className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold outline-none focus:ring-2 focus:ring-blue-600"
                         value={formData.brand}
                         onChange={e => setFormData({...formData, brand: e.target.value})}
                         placeholder="Dell, LG, etc"
                         required
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo</label>
                       <input 
                         className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold outline-none focus:ring-2 focus:ring-blue-600"
                         value={formData.model}
                         onChange={e => setFormData({...formData, model: e.target.value})}
                         placeholder="Latitude 5420, etc"
                         required
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor de Aquisição (R$)</label>
                       <input 
                         type="number"
                         step="0.01"
                         className="w-full p-4 rounded-2xl border border-slate-200 bg-emerald-50/30 font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                         value={formData.purchaseValue}
                         onChange={e => setFormData({...formData, purchaseValue: parseFloat(e.target.value)})}
                         placeholder="0,00"
                       />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Especificações Técnicas</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Processador</label>
                          <input className="w-full p-3 rounded-xl border border-slate-200 font-bold text-xs" value={formData.processor} onChange={e => setFormData({...formData, processor: e.target.value})} placeholder="i7, Ryzen 5..." />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Memória RAM</label>
                          <input className="w-full p-3 rounded-xl border border-slate-200 font-bold text-xs" value={formData.ram} onChange={e => setFormData({...formData, ram: e.target.value})} placeholder="8GB, 16GB..." />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Armazenamento</label>
                          <input className="w-full p-3 rounded-xl border border-slate-200 font-bold text-xs" value={formData.storage} onChange={e => setFormData({...formData, storage: e.target.value})} placeholder="256GB SSD..." />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Tela</label>
                          <input className="w-full p-3 rounded-xl border border-slate-200 font-bold text-xs" value={formData.screenSize} onChange={e => setFormData({...formData, screenSize: e.target.value})} placeholder='14", 24"...' />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações / Detalhes</label>
                    <textarea 
                      className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-medium outline-none focus:ring-2 focus:ring-blue-600 min-h-[120px]"
                      value={formData.observations}
                      onChange={e => setFormData({...formData, observations: e.target.value})}
                      placeholder="Histórico de uso, pequenos danos, etc..."
                    />
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fotos do Ativo</label>
                    <div className="flex flex-wrap gap-4">
                       {(formData.photos || []).map((photo, idx) => (
                         <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-200 group">
                            <img src={photo} className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => removePhoto(idx)}
                              className="absolute inset-0 bg-rose-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white"
                            >
                               <Trash2 className="w-5 h-5" />
                            </button>
                         </div>
                       ))}
                       <button 
                         type="button" 
                         onClick={() => fileInputRef.current?.click()}
                         className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-blue-600 hover:text-blue-600 transition-all"
                       >
                          <Camera className="w-6 h-6 mb-1" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Adicionar</span>
                       </button>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
                 </div>
              </form>
              
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                 <button 
                   type="button" 
                   onClick={() => setShowForm(false)} 
                   className="px-8 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors"
                 >
                   Cancelar
                 </button>
                 <button 
                   type="submit" 
                   onClick={handleSubmit}
                   disabled={isSaving}
                   className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100 flex items-center gap-2 hover:bg-blue-700 transition-all disabled:bg-slate-300 disabled:shadow-none"
                 >
                   {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                   {isSaving ? 'Salvando...' : 'Salvar Registro'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {detailAsset && (
        <div className="fixed inset-0 z-[150] flex items-center justify-end p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl h-full md:h-auto md:max-h-[90vh] md:rounded-[3rem] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${detailAsset.status === 'Baixado' ? 'bg-rose-600' : 'bg-blue-600'} rounded-2xl flex items-center justify-center text-white shadow-xl`}>
                       <Tag className="w-7 h-7" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 tracking-tight">{detailAsset.id}</h3>
                       <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                         {detailAsset.status === 'Baixado' ? 'Patrimônio Inativo/Baixado' : `Status: ${detailAsset.status}`}
                       </p>
                    </div>
                 </div>
                 <button onClick={() => setDetailAsset(null)} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                    <X className="w-6 h-6 text-slate-400" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Responsável Atual</p>
                       <p className="font-bold text-slate-800">{getEmployeeName(detailAsset.assignedTo)}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Departamento</p>
                       <p className="font-bold text-slate-800">{getDepartmentName(detailAsset.departmentId)}</p>
                    </div>
                 </div>

                 {detailAsset.purchaseValue ? (
                    <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <DollarSign className="w-6 h-6 text-emerald-600" />
                          <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Valor de Aquisição</p>
                       </div>
                       <p className="text-xl font-black text-emerald-700">R$ {detailAsset.purchaseValue.toLocaleString('pt-BR')}</p>
                    </div>
                 ) : null}

                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Dossiê de Ativo / Observações</p>
                    <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                      {detailAsset.observations || 'Nenhum detalhe técnico registrado.'}
                    </p>
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center gap-2">
                       <History className="w-5 h-5 text-blue-600" />
                       <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Linha do Tempo</h4>
                    </div>
                    <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                       {(detailAsset.history || []).slice().reverse().map((entry) => (
                         <div key={entry.id} className="relative">
                            <div className={`absolute -left-[30px] top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                               entry.type === 'Status' && entry.description.includes('BAIXA') ? 'bg-rose-600' : 'bg-slate-400'
                            }`}>
                               {entry.type === 'Status' && entry.description.includes('BAIXA') ? <Trash2 className="w-3 h-3 text-white" /> : <Clock className="w-3 h-3 text-white" />}
                            </div>
                            <div className="space-y-1">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(entry.date).toLocaleDateString()}</p>
                               <p className="text-sm text-slate-800 font-bold leading-tight">{entry.description}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
              
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                 <button onClick={() => setDetailAsset(null)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-colors shadow-lg">Fechar</button>
              </div>
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

export default AssetManager;
