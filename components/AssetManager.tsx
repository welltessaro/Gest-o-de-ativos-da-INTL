
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Camera, 
  QrCode,
  Trash2,
  X,
  Cpu,
  Database,
  Printer,
  Package,
  Building2,
  ClipboardList,
  FileSpreadsheet,
  UserPlus,
  Save,
  PlusCircle,
  Eye,
  FileDown
} from 'lucide-react';
import { Asset, AssetType, AssetStatus, Employee, Company } from '../types';
import { ASSET_TYPES } from '../constants';

interface AssetManagerProps {
  assets: Asset[];
  employees: Employee[];
  companies: Company[];
  // Fix: Allow an optional id property in the onAdd callback to support manual asset ID assignment, especially for bulk operations.
  onAdd: (asset: Omit<Asset, 'id' | 'createdAt' | 'qrCode'> & { id?: string }) => void;
  onUpdate: (asset: Asset) => void;
  onRemove: (id: string) => void;
}

interface BulkAssetEntry {
  tempId: string;
  companyId: string;
  type: AssetType;
  brand: string;
  model: string;
  id: string; // ID patrimonial real
  assignedTo: string;
  observations: string;
}

const AssetManager: React.FC<AssetManagerProps> = ({ assets, employees, companies, onAdd, onUpdate, onRemove }) => {
  const [showForm, setShowForm] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [filterAvailability, setFilterAvailability] = useState<string>('all');
  
  const [bulkEntries, setBulkEntries] = useState<BulkAssetEntry[]>([
    { tempId: '1', companyId: companies[0]?.id || '', type: 'Notebook', brand: '', model: '', id: '', assignedTo: '', observations: '' }
  ]);

  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    type: 'Notebook',
    status: 'Pendente Documentos',
    photos: [],
    companyId: companies[0]?.id || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.companyId) {
      alert("Por favor, selecione a empresa proprietária.");
      return;
    }
    onAdd(newAsset as Omit<Asset, 'id' | 'createdAt' | 'qrCode'>);
    setShowForm(false);
    setNewAsset({ type: 'Notebook', status: 'Pendente Documentos', photos: [], companyId: companies[0]?.id || '' });
  };

  const handleBulkAddRow = () => {
    setBulkEntries([...bulkEntries, { 
      tempId: Math.random().toString(), 
      companyId: companies[0]?.id || '', 
      type: 'Notebook', 
      brand: '', 
      model: '', 
      id: '', 
      assignedTo: '', 
      observations: '' 
    }]);
  };

  const handleBulkRemoveRow = (tempId: string) => {
    setBulkEntries(bulkEntries.filter(e => e.tempId !== tempId));
  };

  const handleBulkSave = () => {
    const invalid = bulkEntries.some(e => !e.brand || !e.model || !e.id || !e.companyId);
    if (invalid) {
      alert("Por favor, preencha Marca, Modelo, ID e Empresa para todos os itens.");
      return;
    }

    // Fix: Pass the manually entered 'id' from the bulk row to the onAdd function.
    bulkEntries.forEach(entry => {
      onAdd({
        id: entry.id,
        companyId: entry.companyId,
        type: entry.type,
        brand: entry.brand,
        model: entry.model,
        observations: entry.observations,
        photos: [],
        status: entry.assignedTo ? 'Em Uso' : 'Disponível',
        assignedTo: entry.assignedTo || undefined,
      });
    });

    alert(`${bulkEntries.length} ativos cadastrados com sucesso!`);
    setShowBulkModal(false);
    setBulkEntries([{ tempId: '1', companyId: companies[0]?.id || '', type: 'Notebook', brand: '', model: '', id: '', assignedTo: '', observations: '' }]);
  };

  const handleDownloadCollectionSheet = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-br">
      <head>
        <meta charset="UTF-8">
        <title>Guia de Coleta de Dados - AssetTrack Pro</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; color: #000; }
          .container { max-width: 210mm; margin: 0 auto; border: 4px solid #000; padding: 40px; min-height: 297mm; box-sizing: border-box; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; }
          .header p { margin: 5px 0 0; font-size: 16px; font-weight: bold; font-style: italic; color: #475569; }
          .header-info { text-align: right; font-size: 12px; font-weight: 900; text-transform: uppercase; }
          .header-info div { margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; border: 2px solid #000; }
          th { background: #f1f5f9; border: 2px solid #000; padding: 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; text-align: left; }
          td { border: 1px solid #000; height: 40px; padding: 8px; }
          .col-status { width: 80px; text-align: center; font-size: 9px; font-weight: bold; }
          .tips { margin-top: 40px; padding: 20px; background: #f8fafc; border: 2px solid #000; border-radius: 8px; font-size: 11px; font-weight: bold; line-height: 1.6; }
          .tips-title { color: #2563eb; text-transform: uppercase; font-weight: 900; margin-bottom: 8px; }
          .footer-note { margin-top: 60px; text-align: center; font-size: 9px; color: #94a3b8; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
          @media print {
            body { padding: 0; }
            .container { border: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <h1>AssetTrack Pro</h1>
              <p>Formulário de Levantamento Patrimonial</p>
            </div>
            <div class="header-info">
              <div>Unidade: ____________________</div>
              <div>Técnico: ____________________</div>
              <div>Data: ____/____/202__</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 150px;">Tipo (NB/DT/MN)</th>
                <th>Marca / Modelo</th>
                <th style="width: 140px;">ID Patrimonial</th>
                <th>Usuário / Setor</th>
                <th class="col-status">Estado (B|R|U)</th>
              </tr>
            </thead>
            <tbody>
              ${Array.from({ length: 18 }).map(() => `
                <tr>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td class="col-status">____</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="tips">
            <div class="tips-title">Dicas para o Levantamento em Campo:</div>
            • Verifique a etiqueta de serviço (Service Tag) embaixo do notebook ou atrás do gabinete.<br>
            • Identifique o usuário logado e confirme com o gestor do setor responsável.<br>
            • Marque se o equipamento possui danos físicos visíveis (B=Bom, R=Regular, U=Ruim).
          </div>

          <div class="footer-note">
            Documento de Controle Interno — AssetTrack Pro Enterprise Asset Management
          </div>
        </div>
        <script>
          // Autoprint opcional se aberto no navegador
          // window.print();
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guia_coleta_patrimonial_${new Date().getTime()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || a.type === filterType;
    const matchesCompany = filterCompany === 'all' || a.companyId === filterCompany;
    
    let matchesAvailability = true;
    if (filterAvailability === 'available') {
      matchesAvailability = !a.assignedTo;
    } else if (filterAvailability === 'assigned') {
      matchesAvailability = !!a.assignedTo;
    }

    return matchesSearch && matchesType && matchesAvailability && matchesCompany;
  });

  const getCompanyName = (id: string) => companies.find(c => c.id === id)?.name || 'N/A';

  return (
    <div className="space-y-6 relative">
      {/* TOOLBAR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 print:hidden">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por modelo, marca ou ID..." 
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
             <button 
                onClick={handleDownloadCollectionSheet}
                className="flex items-center gap-2 px-4 py-2 text-xs font-black text-blue-600 hover:bg-blue-50 rounded-xl transition-all uppercase tracking-widest group"
             >
                <FileDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                Guia de Coleta
             </button>
             <button 
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 rounded-xl transition-all uppercase tracking-widest"
             >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                Lançar Levantamento
             </button>
          </div>

          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Ativo</span>
          </button>
        </div>
      </div>

      {/* ASSET TABLE */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ativo / Empresa</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Marca/Modelo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.map((asset) => (
                <tr 
                  key={asset.id} 
                  onClick={() => setSelectedAsset(asset)}
                  className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 group-hover:text-blue-700">{asset.id}</span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                        <Building2 className="w-3 h-3" />
                        {getCompanyName(asset.companyId)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-600">{asset.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-slate-800">{asset.brand}</span>
                    <span className="text-sm text-slate-500 ml-2">{asset.model}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      asset.status === 'Disponível' ? 'bg-emerald-100 text-emerald-600' :
                      asset.status === 'Em Uso' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={(e) => {e.stopPropagation(); onRemove(asset.id)}} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: LANÇAMENTO EM LOTE */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300 print:hidden">
          <div className="h-20 bg-slate-800/50 border-b border-white/10 flex items-center justify-between px-8 text-white">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="font-black tracking-tight">Lançamento em Lote</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Transcreva os dados coletados em campo</p>
               </div>
            </div>
            <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
               <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-8">
             <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase w-48">Empresa / Tipo</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Marca / Modelo</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase w-32">ID Patrimonial</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Vincular Usuário</th>
                        <th className="px-6 py-4 text-right"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {bulkEntries.map((entry, idx) => (
                        <tr key={entry.tempId} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-6 py-4 space-y-2">
                              <select 
                                className="w-full p-2 bg-slate-100 rounded-xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-emerald-500"
                                value={entry.companyId}
                                onChange={e => {
                                  const newEntries = [...bulkEntries];
                                  newEntries[idx].companyId = e.target.value;
                                  setBulkEntries(newEntries);
                                }}
                              >
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                              <select 
                                className="w-full p-2 bg-white rounded-xl text-xs font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                                value={entry.type}
                                onChange={e => {
                                  const newEntries = [...bulkEntries];
                                  newEntries[idx].type = e.target.value as AssetType;
                                  setBulkEntries(newEntries);
                                }}
                              >
                                {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                           </td>
                           <td className="px-6 py-4 space-y-2">
                              <input 
                                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Marca (Ex: Dell)"
                                value={entry.brand}
                                onChange={e => {
                                  const newEntries = [...bulkEntries];
                                  newEntries[idx].brand = e.target.value;
                                  setBulkEntries(newEntries);
                                }}
                              />
                              <input 
                                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Modelo (Ex: G15)"
                                value={entry.model}
                                onChange={e => {
                                  const newEntries = [...bulkEntries];
                                  newEntries[idx].model = e.target.value;
                                  setBulkEntries(newEntries);
                                }}
                              />
                           </td>
                           <td className="px-6 py-4">
                              <input 
                                className="w-full p-2 bg-slate-100 border-none rounded-xl text-xs font-mono font-black outline-none focus:ring-2 focus:ring-emerald-500 text-center uppercase"
                                placeholder="ID-001"
                                value={entry.id}
                                onChange={e => {
                                  const newEntries = [...bulkEntries];
                                  newEntries[idx].id = e.target.value;
                                  setBulkEntries(newEntries);
                                }}
                              />
                           </td>
                           <td className="px-6 py-4">
                              <select 
                                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                value={entry.assignedTo}
                                onChange={e => {
                                  const newEntries = [...bulkEntries];
                                  newEntries[idx].assignedTo = e.target.value;
                                  setBulkEntries(newEntries);
                                }}
                              >
                                <option value="">Estoque (Sem usuário)</option>
                                {employees.filter(emp => emp.companyId === entry.companyId).map(emp => (
                                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                              </select>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => handleBulkRemoveRow(entry.tempId)}
                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
                <div className="p-6 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                   <button 
                    onClick={handleBulkAddRow}
                    className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest hover:underline"
                   >
                      <PlusCircle className="w-5 h-5" /> Adicionar mais um item
                   </button>
                   <div className="flex gap-4">
                      <button 
                        onClick={() => setShowBulkModal(false)}
                        className="px-8 py-3 rounded-2xl font-bold text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleBulkSave}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-3 rounded-2xl font-black shadow-xl shadow-emerald-100 flex items-center gap-2 uppercase tracking-widest text-xs transition-all active:scale-95"
                      >
                        <Save className="w-4 h-4" /> Finalizar Levantamento
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* MODAL PADRÃO DE NOVO ATIVO (MANTIDO) */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 tracking-tight">Onboarding de Ativo</h3>
                   <p className="text-slate-500 text-sm font-medium">Cadastre um novo dispositivo individualmente.</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="p-3 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-8">
               <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-full">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Empresa Unidade</label>
                      <select className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold" value={newAsset.companyId} onChange={(e) => setNewAsset({...newAsset, companyId: e.target.value})} required>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                      <select className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold" value={newAsset.type} onChange={(e) => setNewAsset({...newAsset, type: e.target.value as AssetType})} required>
                        {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marca</label>
                      <input className="w-full p-4 rounded-2xl border border-slate-200 font-bold" value={newAsset.brand || ''} onChange={(e) => setNewAsset({...newAsset, brand: e.target.value})} required />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-100 uppercase tracking-widest transition-all active:scale-95">Finalizar Cadastro</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetManager;
