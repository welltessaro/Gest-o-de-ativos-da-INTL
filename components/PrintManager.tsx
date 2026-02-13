
import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  FileDown, 
  FileText, 
  Search, 
  CheckSquare, 
  Square, 
  QrCode, 
  Download,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Asset } from '../types';

interface PrintManagerProps {
  assets: Asset[];
}

const PrintManager: React.FC<PrintManagerProps> = ({ assets }) => {
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);

  const filteredAssets = useMemo(() => {
    return assets.filter(a => 
      a.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assets, searchTerm]);

  const toggleSelection = (id: string) => {
    setSelectedAssetIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedAssetIds.length === filteredAssets.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(filteredAssets.map(a => a.id));
    }
  };

  const handleExportTxt = () => {
    setExporting('TXT');
    const selectedAssets = assets.filter(a => selectedAssetIds.includes(a.id));
    const content = selectedAssets.map(a => (
      `==============================\n` +
      `EMPRESA: AssetTrack Pro\n` +
      `ID INVENTÁRIO: ${a.id}\n` +
      `TIPO: ${a.type}\n` +
      `MARCA: ${a.brand}\n` +
      `MODELO: ${a.model}\n` +
      `QR CODE: ${a.qrCode}\n` +
      `STATUS: ${a.status}\n` +
      `DATA EXPORTAÇÃO: ${new Date().toLocaleDateString('pt-BR')}\n` +
      `==============================`
    )).join('\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `etiquetas_texto_${new Date().getTime()}.txt`;
    link.click();
    
    setTimeout(() => {
      setExporting(null);
      URL.revokeObjectURL(url);
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    setExporting('PDF');
    const selectedAssets = assets.filter(a => selectedAssetIds.includes(a.id));
    const logo = localStorage.getItem('assettrack_logo');
    
    // Geramos um documento HTML altamente estilizado que atua como o "PDF" das etiquetas
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Etiquetas de Inventário - AssetTrack Pro</title>
        <style>
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
          .label-card {
            width: 150px;
            height: 150px;
            border: 2px solid #000;
            padding: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            page-break-inside: avoid;
            background: white;
            position: relative;
          }
          .company-logo {
            max-height: 20px;
            max-width: 80px;
            margin-bottom: 5px;
            object-fit: contain;
          }
          .company-name {
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            color: #2563eb;
            margin-bottom: 5px;
          }
          .qr-placeholder {
            width: 80px;
            height: 80px;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            color: #94a3b8;
            margin-bottom: 5px;
          }
          .inventory-id {
            font-family: monospace;
            font-size: 14px;
            font-weight: 900;
            color: #000;
          }
          .footer { font-size: 6px; color: #64748b; margin-top: 2px; }
          @media print {
            body { padding: 0; gap: 10px; }
            .label-card { border-color: #000; }
          }
        </style>
      </head>
      <body>
        ${selectedAssets.map(a => `
          <div class="label-card">
            ${logo ? `<img src="${logo}" class="company-logo" />` : `<div class="company-name">AssetTrack Pro</div>`}
            <div class="qr-placeholder">[QR: ${a.qrCode}]</div>
            <div class="inventory-id">${a.id}</div>
            <div class="footer">${a.brand} - ${a.type}</div>
          </div>
        `).join('')}
        <script>
          window.onload = function() {
            // Pequeno delay para garantir renderização antes do usuário decidir o que fazer
            console.log('Documento pronto para impressão ou salvamento em PDF');
          }
        <\/script>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `etiquetas_visual_${new Date().getTime()}.html`;
    link.click();
    
    setTimeout(() => {
      setExporting(null);
      URL.revokeObjectURL(url);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Filtrar por ID ou Modelo..." 
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <button 
            disabled={selectedAssetIds.length === 0}
            onClick={handleExportTxt}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all border ${
              selectedAssetIds.length > 0 ? 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-sm' : 'bg-slate-100 text-slate-400 border-transparent cursor-not-allowed'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>TXT</span>
          </button>
          <button 
            disabled={selectedAssetIds.length === 0}
            onClick={handleExportPdf}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all border ${
              selectedAssetIds.length > 0 ? 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-sm' : 'bg-slate-100 text-slate-400 border-transparent cursor-not-allowed'
            }`}
          >
            <FileDown className="w-5 h-5" />
            <span>Gerar PDF/HTML</span>
          </button>
          <button 
            disabled={selectedAssetIds.length === 0}
            onClick={handlePrint}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg ${
              selectedAssetIds.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' : 'bg-slate-300 text-white cursor-not-allowed'
            }`}
          >
            <Printer className="w-5 h-5" />
            <span>Imprimir Selecionados</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List Section */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={toggleAll} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                {selectedAssetIds.length === filteredAssets.length && filteredAssets.length > 0 ? (
                  <CheckSquare className="w-6 h-6 text-blue-600" />
                ) : (
                  <Square className="w-6 h-6 text-slate-300" />
                )}
              </button>
              <span className="text-sm font-bold text-slate-700">
                {selectedAssetIds.length} selecionados de {filteredAssets.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 italic">Selecione para gerar lote de impressão</p>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.map((asset) => (
                  <tr 
                    key={asset.id} 
                    onClick={() => toggleSelection(asset.id)}
                    className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${selectedAssetIds.includes(asset.id) ? 'bg-blue-50/50' : ''}`}
                  >
                    <td className="px-6 py-4 w-12">
                       {selectedAssetIds.includes(asset.id) ? (
                         <CheckSquare className="w-5 h-5 text-blue-600" />
                       ) : (
                         <Square className="w-5 h-5 text-slate-200" />
                       )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{asset.id}</span>
                        <span className="text-xs text-slate-400">{asset.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{asset.brand}</span>
                        <span className="text-xs text-slate-500">{asset.model}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                         asset.status === 'Disponível' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                       }`}>
                         {asset.status}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAssets.length === 0 && (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                <p>Nenhum ativo disponível para seleção.</p>
              </div>
            )}
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl h-[600px] flex flex-col sticky top-24 print:static print:bg-white print:text-black print:shadow-none print:p-0 print:h-auto print:w-full">
           <div className="flex items-center gap-2 mb-8 print:hidden">
              <QrCode className="w-6 h-6 text-blue-400" />
              <h4 className="font-bold text-lg">Visualização da Etiqueta</h4>
           </div>

           {selectedAssetIds.length > 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center space-y-8 print:space-y-12">
                <div className="bg-white p-4 rounded-3xl shadow-2xl shadow-blue-500/10 print:shadow-none print:border-2 print:border-black">
                   <div className="border-[1.5px] border-slate-900 p-3 rounded-2xl flex flex-col items-center gap-4">
                      <div className="text-center">
                         {localStorage.getItem('assettrack_logo') ? (
                           <img src={localStorage.getItem('assettrack_logo')!} alt="Logo" className="h-6 object-contain mb-1" />
                         ) : (
                           <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1 print:text-black">AssetTrack Pro</p>
                         )}
                      </div>
                      <QrCode className="w-32 h-32 text-slate-900" />
                      <div className="w-full h-[1px] bg-slate-200" />
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 print:text-slate-400">Patrimônio / Inventário</p>
                        <p className="text-2xl font-mono font-black text-slate-900 tracking-tighter leading-none">
                          {assets.find(a => a.id === selectedAssetIds[0])?.id}
                        </p>
                      </div>
                   </div>
                </div>

                <div className="text-center space-y-2 print:hidden">
                   <p className="text-sm text-slate-400 font-medium">Exibindo exemplo da 1ª etiqueta do lote.</p>
                   <p className="text-xs text-slate-500">Formato: 40mm x 40mm | Inclui Nome e ID</p>
                </div>
                
                {exporting && (
                  <div className="bg-blue-500/20 border border-blue-500/30 p-4 rounded-2xl flex items-center gap-3 animate-pulse print:hidden">
                    <Download className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-bold text-blue-100 tracking-tight">Baixando arquivo {exporting}...</span>
                  </div>
                )}
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                <Printer className="w-16 h-16 mb-4" />
                <p className="font-medium text-slate-300">Selecione um ou mais ativos para pré-visualizar a impressão.</p>
             </div>
           )}

           <div className="mt-auto pt-6 border-t border-slate-800 space-y-4 print:hidden">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <AlertCircle className="w-4 h-4" />
                <span>O arquivo baixado contém todas as etiquetas selecionadas.</span>
              </div>
              <div className="text-xs text-slate-500 flex flex-col gap-1">
                 <p>• TXT: Dados estruturados para sistemas externos.</p>
                 <p>• PDF/HTML: Layout visual pronto para impressão.</p>
              </div>
           </div>
        </div>
      </div>
      
      {/* Hidden container for full batch printing */}
      <div id="print-area" className="hidden print:block print:bg-white print:p-0">
        <div className="flex flex-wrap gap-4 p-4">
          {assets.filter(a => selectedAssetIds.includes(a.id)).map(a => (
            <div key={a.id} className="page-break-after-always flex flex-col items-center justify-center border-2 border-black p-4 w-[4cm] h-[4cm] text-black bg-white">
               {localStorage.getItem('assettrack_logo') ? (
                 <img src={localStorage.getItem('assettrack_logo')!} alt="Logo" className="h-5 object-contain mb-1" />
               ) : (
                 <p className="text-[10px] font-black text-blue-600 uppercase mb-1">AssetTrack Pro</p>
               )}
               <QrCode className="w-24 h-24 mb-2" />
               <p className="text-[8px] font-bold uppercase text-slate-500">Patrimônio</p>
               <p className="text-lg font-mono font-black leading-none">{a.id}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .page-break-after-always { page-break-after: always; }
          @page { margin: 0; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default PrintManager;
