
import React, { useState, useMemo, useEffect } from 'react';
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
  ExternalLink,
  Tags,
  ListChecks,
  Barcode,
  ClipboardList
} from 'lucide-react';
import { Asset } from '../types';
import JsBarcode from 'jsbarcode';

interface PrintManagerProps {
  assets: Asset[];
  companyLogo?: string | null; // NOVO PROP
}

const PrintManager: React.FC<PrintManagerProps> = ({ assets, companyLogo }) => {
  const [mode, setMode] = useState<'selection' | 'sequential' | 'manual'>('selection');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);

  // States for Sequential Mode
  const [quantity, setQuantity] = useState<number>(10);
  const [startNumber, setStartNumber] = useState<number>(1);

  // States for Manual Mode
  const [manualQuantity, setManualQuantity] = useState<number>(5);
  const [includePreGeneratedIds, setIncludePreGeneratedIds] = useState<boolean>(true);

  useEffect(() => {
    if (mode === 'sequential' || mode === 'manual') {
      const numbers = assets
        .map(a => parseInt(a.id.replace(/\D/g, ''), 10))
        .filter(n => !isNaN(n));
      
      const max = numbers.length > 0 ? Math.max(...numbers) : 0;
      setStartNumber(max + 1);
    }
  }, [mode, assets]);

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

  const generateBarcodeDataUrl = (text: string) => {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, text, {
      format: "CODE128",
      displayValue: false,
      height: 40,
      margin: 0
    });
    return canvas.toDataURL("image/png");
  };

  const handleGenerateSequential = () => {
    setExporting('PDF');
    const logo = companyLogo || localStorage.getItem('assettrack_logo');
    
    // Generate tags
    const tags = [];
    for (let i = 0; i < quantity; i++) {
      const num = startNumber + i;
      // Format ID: AST-XXXXX (5 digits)
      const id = `AST-${String(num).padStart(5, '0')}`;
      tags.push({
        id,
        barcode: generateBarcodeDataUrl(id)
      });
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Etiquetas Sequenciais - AssetTrack Pro</title>
        <style>
          @page { size: 8.3cm 5.3cm; margin: 0; }
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; height: 100vh; }
          .label-card {
            width: 8.3cm;
            height: 5.3cm;
            border: 1px solid #e2e8f0;
            display: flex;
            overflow: hidden;
            page-break-inside: avoid;
            background: white;
            box-sizing: border-box;
          }
          .label-left {
            width: 40%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 5px;
            border-right: 1px dashed #e2e8f0;
          }
          .label-right {
            width: 60%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 5px;
          }
          .company-logo {
            max-width: 100%;
            max-height: 4cm;
            object-fit: contain;
          }
          .barcode-img {
            width: 95%;
            height: 1.5cm;
            object-fit: fill;
            margin-bottom: 5px;
          }
          .label-title {
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 5px;
          }
          .inventory-id {
            font-family: monospace;
            font-size: 14px;
            font-weight: 900;
            color: #000;
            margin-top: 2px;
            letter-spacing: 1px;
          }
          @media print {
            body { height: auto; display: block; }
            .label-card { border: none; page-break-after: always; }
            .label-left { border-right: 1px dashed #000; }
          }
        </style>
      </head>
      <body>
        ${tags.map(tag => `
          <div class="label-card">
            <div class="label-left">
              ${logo ? `<img src="${logo}" class="company-logo" />` : ``}
            </div>
            <div class="label-right">
              <div class="label-title">Patrimônio</div>
              <img src="${tag.barcode}" class="barcode-img" />
              <div class="inventory-id">${tag.id}</div>
            </div>
          </div>
        `).join('')}
        <script>
          window.onload = function() {
            console.log('Documento pronto para impressão');
          }
        <\/script>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `etiquetas_sequenciais_${startNumber}_${startNumber + quantity - 1}.html`;
    link.click();
    
    setTimeout(() => {
      setExporting(null);
      URL.revokeObjectURL(url);
    }, 2000);
  };

  const handleGenerateManualForm = () => {
    setExporting('PDF');
    const logo = companyLogo || localStorage.getItem('assettrack_logo');
    
    const forms = [];
    for (let i = 0; i < manualQuantity; i++) {
        const num = startNumber + i;
        const id = includePreGeneratedIds ? `AST-${String(num).padStart(5, '0')}` : '________________';
        forms.push({ id });
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Fichas de Cadastro Manual - AssetTrack Pro</title>
        <style>
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 10px; background: #fff; }
          .form-card {
            border: 1px dashed #94a3b8;
            padding: 12px;
            margin-bottom: 8px;
            page-break-inside: avoid;
            background: white;
            border-radius: 6px;
            height: 235px; /* Fixed height to ensure 4 fit */
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #0f172a; padding-bottom: 5px; flex-shrink: 0; }
          .logo { height: 20px; object-fit: contain; }
          .company-text { font-weight: 900; color: #2563eb; text-transform: uppercase; font-size: 12px; }
          .title { font-weight: 900; text-transform: uppercase; font-size: 10px; color: #0f172a; background: #f1f5f9; padding: 3px 8px; border-radius: 4px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; flex-grow: 1; }
          .field { margin-bottom: 2px; }
          .label { display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 2px; }
          .input-line { border-bottom: 1px solid #cbd5e1; height: 16px; width: 100%; background: #f8fafc; }
          .full-width { grid-column: span 2; }
          .id-box { border: 1px solid #0f172a; padding: 2px 8px; font-family: monospace; font-weight: 900; font-size: 14px; color: #0f172a; border-radius: 4px; background: #fff; }
          .footer-note { font-size: 8px; color: #94a3b8; margin-top: 5px; text-align: center; font-style: italic; flex-shrink: 0; }
          @media print {
            body { padding: 0; -webkit-print-color-adjust: exact; }
            .form-card { break-inside: avoid; border-color: #94a3b8; }
          }
        </style>
      </head>
      <body>
        ${forms.map(f => `
          <div class="form-card">
            <div class="header">
                ${logo ? `<img src="${logo}" class="logo" />` : `<span class="company-text">AssetTrack Pro</span>`}
                <div class="title">Ficha de Levantamento Cadastral</div>
                <div class="id-box">${f.id}</div>
            </div>
            <div class="grid">
                <div class="field">
                    <span class="label">Tipo de Equipamento</span>
                    <div class="input-line"></div>
                </div>
                <div class="field">
                    <span class="label">Marca / Fabricante</span>
                    <div class="input-line"></div>
                </div>
                <div class="field">
                    <span class="label">Modelo</span>
                    <div class="input-line"></div>
                </div>
                <div class="field">
                    <span class="label">Número de Série (S/N)</span>
                    <div class="input-line"></div>
                </div>
                <div class="field">
                    <span class="label">Setor / Departamento</span>
                    <div class="input-line"></div>
                </div>
                <div class="field">
                    <span class="label">Usuário Responsável</span>
                    <div class="input-line"></div>
                </div>
                <div class="field full-width">
                    <span class="label">Especificações Técnicas (Proc/RAM/Disco/Detalhes)</span>
                    <div class="input-line"></div>
                </div>
                <div class="field full-width">
                    <span class="label">Observações / Estado de Conservação</span>
                    <div class="input-line"></div>
                </div>
                <div class="field">
                    <span class="label">Data do Levantamento</span>
                    <div class="input-line"></div>
                </div>
                <div class="field">
                    <span class="label">Técnico Responsável</span>
                    <div class="input-line"></div>
                </div>
            </div>
            <div class="footer-note">Preencher com letra legível. Utilizar este formulário para cadastro posterior no sistema.</div>
          </div>
        `).join('')}
        <script>
          window.onload = function() {
            setTimeout(() => { console.log('Pronto'); }, 500);
          }
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fichas_manuais_${new Date().getTime()}.html`;
    link.click();
    
    setTimeout(() => {
      setExporting(null);
      URL.revokeObjectURL(url);
    }, 2000);
  };

  const handleExportPdf = () => {
    setExporting('PDF');
    const selectedAssets = assets.filter(a => selectedAssetIds.includes(a.id));
    const logo = companyLogo || localStorage.getItem('assettrack_logo');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Etiquetas de Inventário - AssetTrack Pro</title>
        <style>
          @page { size: 8.3cm 5.3cm; margin: 0; }
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; height: 100vh; }
          .label-card {
            width: 8.3cm;
            height: 5.3cm;
            border: 1px solid #e2e8f0;
            display: flex;
            overflow: hidden;
            page-break-inside: avoid;
            background: white;
            box-sizing: border-box;
          }
          .label-left {
            width: 40%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 5px;
            border-right: 1px dashed #e2e8f0;
          }
          .label-right {
            width: 60%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 5px;
          }
          .company-logo {
            max-width: 100%;
            max-height: 4cm;
            object-fit: contain;
          }
          .barcode-img {
            width: 95%;
            height: 1.5cm;
            object-fit: fill;
            margin-bottom: 5px;
          }
          .label-title {
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 5px;
          }
          .inventory-id {
            font-family: monospace;
            font-size: 14px;
            font-weight: 900;
            color: #000;
            margin-top: 2px;
            letter-spacing: 1px;
          }
          @media print {
            body { height: auto; display: block; }
            .label-card { border: none; page-break-after: always; }
            .label-left { border-right: 1px dashed #000; }
          }
        </style>
      </head>
      <body>
        ${selectedAssets.map(a => `
          <div class="label-card">
            <div class="label-left">
              ${logo ? `<img src="${logo}" class="company-logo" />` : ``}
            </div>
            <div class="label-right">
              <div class="label-title">Patrimônio</div>
              <img src="${generateBarcodeDataUrl(a.id)}" class="barcode-img" />
              <div class="inventory-id">${a.id}</div>
            </div>
          </div>
        `).join('')}
        <script>
          window.onload = function() {
            console.log('Documento pronto para impressão');
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
      {/* Mode Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center shadow-inner">
          <button
            onClick={() => setMode('selection')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              mode === 'selection' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            Seleção Manual
          </button>
          <button
            onClick={() => setMode('sequential')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              mode === 'sequential' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Tags className="w-4 h-4" />
            Gerador Sequencial
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              mode === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Ficha Manual
          </button>
        </div>
      </div>

      {mode === 'selection' ? (
        <>
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
                       <div className="border-[1.5px] border-slate-200 rounded-lg flex overflow-hidden w-[300px] h-[120px] bg-white">
                          <div className="w-[40%] border-r border-dashed border-slate-200 flex items-center justify-center p-4">
                             {companyLogo ? (
                               <img src={companyLogo} alt="Logo" className="max-w-full max-h-[60px] object-contain" />
                             ) : (
                               <p className="text-[12px] font-black text-blue-600 uppercase text-center leading-tight">AssetTrack Pro</p>
                             )}
                          </div>
                          <div className="w-[60%] flex flex-col items-center justify-center p-2">
                             <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Patrimônio</span>
                             <img 
                               src={generateBarcodeDataUrl(assets.find(a => a.id === selectedAssetIds[0])?.id || '')} 
                               className="w-full h-[50px] object-fill mb-1" 
                               alt="Barcode"
                             />
                             <span className="font-mono font-black text-sm text-slate-900">
                               {assets.find(a => a.id === selectedAssetIds[0])?.id}
                             </span>
                          </div>
                       </div>
                    </div>

                    <div className="text-center space-y-2 print:hidden">
                       <p className="text-sm text-slate-400 font-medium">Exibindo exemplo da 1ª etiqueta do lote.</p>
                       <p className="text-xs text-slate-500">Novo Padrão: 50mm x 20mm (Aprox) | Código de Barras</p>
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
        </>
      ) : mode === 'sequential' ? (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                <Tags className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Gerador de Etiquetas Sequenciais</h3>
                <p className="text-slate-500 text-sm">Gere lotes de etiquetas numeradas para novos ativos.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">Número Inicial</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">AST-</span>
                  <input
                    type="number"
                    value={startNumber}
                    onChange={(e) => setStartNumber(parseInt(e.target.value) || 0)}
                    className="w-full pl-16 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
                  />
                </div>
                <p className="text-xs text-slate-400">
                  O sistema detectou que o próximo número disponível é <strong className="text-slate-600">{startNumber}</strong> com base nos ativos existentes.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">Quantidade de Etiquetas</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  min={1}
                  max={1000}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                />
                <p className="text-xs text-slate-400">
                  Serão geradas etiquetas do <strong className="text-slate-600">AST-{String(startNumber).padStart(5, '0')}</strong> ao <strong className="text-slate-600">AST-{String(startNumber + quantity - 1).padStart(5, '0')}</strong>.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8">
              <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Barcode className="w-5 h-5 text-slate-400" />
                Pré-visualização do Lote
              </h4>
              <div className="flex flex-wrap gap-4 justify-center">
                {[...Array(Math.min(quantity, 3))].map((_, i) => (
                  <div key={i} className="w-[200px] h-[80px] bg-white border border-slate-200 rounded flex overflow-hidden shadow-sm">
                    <div className="w-[40%] border-r border-dashed border-slate-100 flex items-center justify-center p-2">
                      {companyLogo ? (
                        <img src={companyLogo} alt="Logo" className="max-w-full max-h-[40px] object-contain" />
                      ) : (
                        <span className="text-[8px] font-black text-blue-600 uppercase text-center">AssetTrack</span>
                      )}
                    </div>
                    <div className="w-[60%] flex flex-col items-center justify-center p-1">
                      <span className="text-[6px] font-bold uppercase text-slate-400 mb-0.5">Patrimônio</span>
                      <div className="w-[90%] h-[30px] bg-slate-100 mb-0.5 flex items-center justify-center">
                        <Barcode className="w-full h-full text-slate-800" />
                      </div>
                      <span className="font-mono font-black text-[9px]">AST-{String(startNumber + i).padStart(5, '0')}</span>
                    </div>
                  </div>
                ))}
                {quantity > 3 && (
                  <div className="w-[200px] h-[80px] bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400">
                    <span className="font-bold text-lg">+{quantity - 3}</span>
                    <span className="text-xs">etiquetas</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleGenerateSequential}
                disabled={quantity < 1}
                className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileDown className="w-5 h-5" />
                Gerar Arquivo de Impressão
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Fichas de Cadastro Manual</h3>
                <p className="text-slate-500 text-sm">Gere formulários impressos para levantamento de ativos em campo.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">Número Inicial (Opcional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">AST-</span>
                  <input
                    type="number"
                    value={startNumber}
                    onChange={(e) => setStartNumber(parseInt(e.target.value) || 0)}
                    disabled={!includePreGeneratedIds}
                    className={`w-full pl-16 pr-4 py-3 rounded-xl border outline-none font-mono text-lg transition-all ${
                      includePreGeneratedIds 
                        ? 'border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-white' 
                        : 'border-slate-100 bg-slate-50 text-slate-400'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="includeIds"
                    checked={includePreGeneratedIds}
                    onChange={(e) => setIncludePreGeneratedIds(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <label htmlFor="includeIds" className="text-sm text-slate-600 cursor-pointer select-none">
                    Incluir IDs pré-gerados nas fichas
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">Quantidade de Fichas</label>
                <input
                  type="number"
                  value={manualQuantity}
                  onChange={(e) => setManualQuantity(parseInt(e.target.value) || 1)}
                  min={1}
                  max={100}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-lg"
                />
                <p className="text-xs text-slate-400">
                  Serão geradas <strong>{manualQuantity}</strong> fichas para preenchimento manual.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8">
              <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                Pré-visualização da Ficha
              </h4>
              <div className="bg-white border-2 border-dashed border-slate-300 p-6 rounded-lg max-w-md mx-auto shadow-sm transform scale-95 origin-top">
                 <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-4">
                    <span className="font-black text-blue-600 text-xs uppercase">ASSETTRACK</span>
                    <span className="font-bold text-xs uppercase bg-slate-100 px-2 py-1 rounded">Ficha Cadastral</span>
                    <span className="font-mono font-black border border-black px-2 py-1 text-xs">
                      {includePreGeneratedIds ? `AST-${String(startNumber).padStart(5,'0')}` : '______'}
                    </span>
                 </div>
                 <div className="space-y-3 opacity-50">
                    {[1,2,3,4].map(i => (
                      <div key={i}>
                        <div className="h-2 w-20 bg-slate-200 mb-1 rounded"></div>
                        <div className="h-px w-full bg-slate-300"></div>
                      </div>
                    ))}
                 </div>
              </div>
              <p className="text-center text-xs text-slate-400 mt-4">Visualização simplificada. O arquivo gerado conterá campos detalhados.</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleGenerateManualForm}
                disabled={manualQuantity < 1}
                className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileDown className="w-5 h-5" />
                Gerar Fichas para Impressão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden container for full batch printing (Selection Mode) */}
      <div id="print-area" className="hidden print:block print:bg-white print:p-0">
        <div className="flex flex-wrap gap-4 p-4">
          {assets.filter(a => selectedAssetIds.includes(a.id)).map(a => (
            <div key={a.id} className="page-break-after-always flex flex-col items-center justify-center border-2 border-black p-4 w-[4cm] h-[4cm] text-black bg-white">
               {companyLogo ? (
                 <img src={companyLogo} alt="Logo" className="h-5 object-contain mb-1" />
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
