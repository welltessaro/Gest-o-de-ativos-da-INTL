
import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Download, Database, ShieldCheck, Activity, Upload, Loader2, FileSpreadsheet, Trash2, AlertTriangle, MessageSquare, Save, CheckCircle2, Image as ImageIcon, X, Building2, Plus, Edit2 } from 'lucide-react';
import { Asset, EquipmentRequest, Employee, Department, AssetTypeConfig, AccountingAccount, UserAccount, SystemIntegrationConfig, LegalEntity } from '../types';
import { db } from '../services/supabase';

interface SystemInfoManagerProps {
  assets: Asset[];
  requests: EquipmentRequest[];
  employees: Employee[];
  departments: Department[];
  assetTypeConfigs: AssetTypeConfig[];
  accounts: AccountingAccount[];
  currentUser: UserAccount;
  legalEntities: LegalEntity[];
  onAddLegalEntity: (entity: LegalEntity) => void;
  onUpdateLegalEntity: (entity: LegalEntity) => void;
  onRemoveLegalEntity: (id: string) => void;
  onUpdateSystemLogo: (logo: string | null) => void; // NOVO
}

const SystemInfoManager: React.FC<SystemInfoManagerProps> = ({ 
  assets, 
  requests, 
  employees, 
  departments,
  assetTypeConfigs,
  accounts,
  currentUser,
  legalEntities,
  onAddLegalEntity,
  onUpdateLegalEntity,
  onRemoveLegalEntity,
  onUpdateSystemLogo
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  // States para Empresas
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<LegalEntity | null>(null);
  const [entityForm, setEntityForm] = useState<LegalEntity>({ id: '', socialReason: '', cnpj: '', address: '' });

  // Integrações
  const [telegramConfig, setTelegramConfig] = useState<SystemIntegrationConfig>({
    telegramBotToken: '',
    telegramChatId: ''
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showConfigSuccess, setShowConfigSuccess] = useState(false);

  useEffect(() => {
    const storedIntegration = localStorage.getItem('assettrack_integrations');
    if (storedIntegration) {
      setTelegramConfig(JSON.parse(storedIntegration));
    }
    
    // Carrega o logo inicial do DB (via App.tsx props ou cache local momentâneo)
    const storedLogo = localStorage.getItem('assettrack_logo');
    if (storedLogo) {
      setLogoPreview(storedLogo);
    }
  }, []);

  const handleSaveIntegrations = () => {
    localStorage.setItem('assettrack_integrations', JSON.stringify(telegramConfig));
    setShowConfigSuccess(true);
    setTimeout(() => setShowConfigSuccess(false), 3000);
  };

  const resizeImage = (base64Str: string, maxWidth = 300): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(base64Str); return; }

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png', 0.8)); // Compacta para PNG
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingLogo(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const rawBase64 = reader.result as string;
          // Redimensiona para garantir que cabe no DB e LocalStorage sem estourar cota
          const resizedBase64 = await resizeImage(rawBase64);
          
          setLogoPreview(resizedBase64);
          localStorage.setItem('assettrack_logo', resizedBase64); // Cache rápido
          
          // Salva no Banco de Dados
          await db.systemConfigs.upsert('company_logo', resizedBase64);
          
          // Notifica o App
          onUpdateSystemLogo(resizedBase64);
        } catch (err) {
          console.error("Erro ao salvar logo:", err);
          alert("Erro ao salvar imagem. Tente um arquivo menor.");
        } finally {
          setIsUploadingLogo(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = async () => {
    setLogoPreview(null);
    localStorage.removeItem('assettrack_logo');
    await db.systemConfigs.upsert('company_logo', ''); // Salva vazio
    onUpdateSystemLogo(null);
  };

  // --- ENTIDADES LEGAIS ---
  const handleOpenEntityForm = (entity: LegalEntity | null = null) => {
    setEditingEntity(entity);
    setEntityForm(entity || { id: '', socialReason: '', cnpj: '', address: '' });
    setShowEntityForm(true);
  };

  const handleSaveEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEntity) {
      onUpdateLegalEntity(entityForm);
    } else {
      onAddLegalEntity({ ...entityForm, id: `LEG-${Date.now()}` });
    }
    setShowEntityForm(false);
  };
  
  // --- LÓGICA DE EXPORTAÇÃO (XLSX) ---
  const handleExportSystemData = () => {
    try {
      const wb = XLSX.utils.book_new();

      // 1. Aba de Ativos
      const assetData = assets.map(a => {
        const emp = employees.find(e => e.id === a.assignedTo);
        const dept = departments.find(d => d.id === a.departmentId);
        
        // Resolve Classificação Contábil
        const config = assetTypeConfigs.find(c => c.name.toLowerCase().trim() === a.type.toLowerCase().trim());
        const account = accounts.find(c => c.id === config?.accountId);

        return {
          'ID Patrimonial': a.id,
          'Etiqueta (Tag)': a.tagId,
          'Tipo': a.type,
          'Código da Conta': account?.code || '', 
          'Classificação Contábil (Nome)': account?.name || '',
          'Class. Tipo': account?.type || 'Ativo',
          'Centro Custo Class.': account?.costCenter || '',
          'Marca': a.brand,
          'Modelo': a.model,
          'Número de Série': a.serialNumber,
          'Valor de Aquisição': a.purchaseValue || 0,
          'Status': a.status,
          'Responsável Atual': emp?.name || 'Estoque',
          'Departamento': dept?.name || 'Não Vinculado',
          'Processador': a.processor,
          'RAM': a.ram,
          'Armazenamento': a.storage,
          'Observações': a.observations,
          'Fotos (Base64)': (a.photos || []).join('|||'), // Exporta fotos separadas por pipe triplo
          'Data Criação': new Date(a.createdAt).toLocaleDateString()
        };
      });
      const wsAssets = XLSX.utils.json_to_sheet(assetData);
      XLSX.utils.book_append_sheet(wb, wsAssets, "Inventário Ativos");

      // 2. Aba de Colaboradores
      const employeeData = employees.map(e => {
        const dept = departments.find(d => d.id === e.departmentId);
        const assetCount = assets.filter(a => a.assignedTo === e.id).length;
        const legal = legalEntities.find(l => l.id === e.legalEntityId);
        return {
          'Nome': e.name,
          'CPF': e.cpf,
          'Cargo/Função': e.role,
          'Setor/Departamento': dept?.name || e.sector,
          'Empresa': legal?.socialReason || 'N/A',
          'Status Cadastro': e.isActive === false ? 'Inativo' : 'Ativo',
          'Qtd Ativos em Posse': assetCount
        };
      });
      const wsEmployees = XLSX.utils.json_to_sheet(employeeData);
      XLSX.utils.book_append_sheet(wb, wsEmployees, "Colaboradores");

      // 3. Aba de Requisições
      const requestData = requests.map(r => {
        const emp = employees.find(e => e.id === r.employeeId);
        return {
          'Protocolo': r.id,
          'Status': r.status,
          'Data': new Date(r.createdAt).toLocaleDateString(),
          'Solicitante (ID)': r.requesterId,
          'Beneficiário': emp?.name || 'Estoque/Outro',
          'Itens Solicitados': r.items.join(', '),
          'Observação': r.observation
        };
      });
      const wsRequests = XLSX.utils.json_to_sheet(requestData);
      XLSX.utils.book_append_sheet(wb, wsRequests, "Requisições");

      // 4. Aba de Departamentos
      const deptData = departments.map(d => ({
        'ID': d.id,
        'Nome Departamento': d.name,
        'Centro de Custo': d.costCenter,
        'Total Ativos Vinculados': assets.filter(a => a.departmentId === d.id).length
      }));
      const wsDepts = XLSX.utils.json_to_sheet(deptData);
      XLSX.utils.book_append_sheet(wb, wsDepts, "Departamentos");

      // Salva o arquivo
      XLSX.writeFile(wb, `AssetTrack_Export_Completo_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (error) {
      console.error("Erro na exportação:", error);
      alert("Houve um erro ao gerar o arquivo Excel.");
    }
  };

  // --- LÓGICA DE IMPORTAÇÃO (XLSX) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... (Mantém a lógica existente de importação)
    // O código existente de importação é longo e não precisa ser mudado para esta tarefa,
    // apenas garantindo que o resto do arquivo seja mantido.
    // ...
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    setIsImporting(true);

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        // Maps para acesso rápido
        const accountNameMap = new Map<string, string>(accounts.map(c => [c.name.toLowerCase().trim(), c.id]));
        const accountCodeMap = new Map<string, string>(accounts.map(c => [c.code.trim(), c.id])); // Mapa por Código
        const typeConfigMap = new Map<string, AssetTypeConfig>(assetTypeConfigs.map(t => [t.name.toLowerCase().trim(), t]));

        const parseCurrency = (val: any): number => {
          if (typeof val === 'number') return val;
          if (typeof val === 'string') {
            let s = val.replace('R$', '').trim();
            if (s.includes(',') && s.includes('.')) {
              s = s.replace(/\./g, '').replace(',', '.');
            } else if (s.includes(',')) {
              s = s.replace(',', '.');
            }
            return parseFloat(s) || 0;
          }
          return 0;
        };

        // --- 1. IMPORTAR DEPARTAMENTOS ---
        let deptMap = new Map<string, string>(); 
        const wsDepts = wb.Sheets["Departamentos"];
        if (wsDepts) {
          const data: any[] = XLSX.utils.sheet_to_json(wsDepts, { raw: false });
          for (const row of data) {
            const id = row['ID'] || `DEPT-${Math.floor(Math.random() * 100000)}`;
            const name = row['Nome Departamento'];
            if (name) {
              const dept: Department = {
                id,
                name,
                costCenter: row['Centro de Custo'] || '',
                createdAt: new Date().toISOString()
              };
              await db.departments.upsert(dept);
              deptMap.set(name, id);
            }
          }
        }
        departments.forEach(d => deptMap.set(d.name, d.id));

        // --- 2. IMPORTAR COLABORADORES ---
        let empMap = new Map<string, string>(); 
        const wsEmps = wb.Sheets["Colaboradores"];
        if (wsEmps) {
          const data: any[] = XLSX.utils.sheet_to_json(wsEmps, { raw: false });
          for (const row of data) {
            const cpf = row['CPF'];
            const name = row['Nome'];
            if (name && cpf) {
              const existingEmp = employees.find(e => e.cpf === cpf);
              const id = existingEmp?.id || `EMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
              
              const deptName = row['Setor/Departamento'];
              const departmentId = deptMap.get(deptName) || '';

              const emp: Employee = {
                id,
                name,
                cpf,
                role: row['Cargo/Função'] || '',
                sector: deptName || 'Geral',
                departmentId,
                isActive: row['Status Cadastro'] !== 'Inativo'
              };
              await db.employees.upsert(emp);
              empMap.set(name, id);
            }
          }
        }
        employees.forEach(e => empMap.set(e.name, e.id));

        // --- 3. IMPORTAR ATIVOS ---
        const wsAssets = wb.Sheets["Inventário Ativos"];
        let importedAssetsCount = 0;
        if (wsAssets) {
          const data: any[] = XLSX.utils.sheet_to_json(wsAssets, { raw: false });
          for (const row of data) {
            const id = row['ID Patrimonial'];
            if (id) {
              const typeName = (row['Tipo'] || 'Outros').trim();
              const classificationName = (row['Classificação Contábil (Nome)'] || '').trim();
              const classificationCode = (row['Código da Conta'] ? String(row['Código da Conta']) : '').trim();
              
              let accountId: string | undefined = undefined;

              if (classificationCode && classificationName) {
                 if (accountCodeMap.has(classificationCode)) {
                    accountId = accountCodeMap.get(classificationCode);
                 } else {
                    const newAccountId = `ACC-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                    const newAccount: AccountingAccount = {
                       id: newAccountId,
                       code: classificationCode,
                       name: classificationName,
                       type: (row['Class. Tipo'] || 'Ativo') as any,
                       costCenter: row['Centro Custo Class.'] || ''
                    };
                    await db.accountingAccounts.upsert(newAccount);
                    accountCodeMap.set(classificationCode, newAccountId);
                    accountId = newAccountId;
                 }
              } else if (classificationCode) {
                 accountId = accountCodeMap.get(classificationCode);
              } else if (classificationName) {
                 accountId = accountNameMap.get(classificationName.toLowerCase());
              }
              
              if (typeName) {
                const typeKey = typeName.toLowerCase();
                const existingConfig = typeConfigMap.get(typeKey);
                
                if (!existingConfig) {
                  const newConfig: AssetTypeConfig = {
                    id: `TYPE-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    name: typeName,
                    accountId: accountId
                  };
                  await db.assetTypeConfigs.upsert(newConfig);
                  typeConfigMap.set(typeKey, newConfig); 
                } else if (accountId && existingConfig.accountId !== accountId) {
                  const updatedConfig: AssetTypeConfig = { ...existingConfig, accountId };
                  await db.assetTypeConfigs.upsert(updatedConfig);
                  typeConfigMap.set(typeKey, updatedConfig);
                }
              }

              const empName = row['Responsável Atual'];
              const assignedTo = empMap.get(empName) || undefined; 
              
              const deptName = row['Departamento'];
              const departmentId = deptMap.get(deptName) || '';
              
              const purchaseVal = parseCurrency(row['Valor de Aquisição']);

              const existingAsset = assets.find(a => a.id === id);
              let history = existingAsset?.history || [];

              if (!existingAsset) {
                 history.push({
                   id: `HIST-IMPORT-${Date.now()}`,
                   date: new Date().toISOString(),
                   type: 'Criação',
                   description: 'Importado via Planilha Excel',
                   performedBy: 'Sistema de Importação'
                 });
              } else {
                 history.push({
                   id: `HIST-IMPORT-${Date.now()}-${Math.random()}`,
                   date: new Date().toISOString(),
                   type: 'Observação',
                   description: 'Dados atualizados via Importação em Lote',
                   performedBy: 'Sistema de Importação'
                 });
              }

              // Importação de FOTOS (Split por |||)
              const rawPhotos = row['Fotos (Base64)'];
              const importedPhotos = rawPhotos ? String(rawPhotos).split('|||').filter(p => p.trim() !== '') : [];

              const asset: Asset = {
                id,
                tagId: row['Etiqueta (Tag)'] || id,
                type: typeName,
                brand: row['Marca'] || '',
                model: row['Modelo'] || '',
                serialNumber: row['Número de Série'] || '',
                purchaseValue: purchaseVal,
                status: row['Status'] || 'Disponível',
                assignedTo,
                departmentId,
                processor: row['Processador'] || '',
                ram: row['RAM'] || '',
                storage: row['Armazenamento'] || '',
                observations: row['Observações'] || '',
                createdAt: existingAsset?.createdAt || new Date().toISOString(),
                qrCode: existingAsset?.qrCode || `QR-${id}`,
                photos: importedPhotos.length > 0 ? importedPhotos : (existingAsset?.photos || []),
                history
              };

              await db.assets.upsert(asset);
              importedAssetsCount++;
            }
          }
        }

        alert(`Importação concluída com sucesso!\n\n${importedAssetsCount} Ativos Processados.`);
        if (fileInputRef.current) fileInputRef.current.value = '';

      } catch (error) {
        console.error("Erro na importação:", error);
        alert("Erro crítico ao processar o arquivo.");
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- LÓGICA DE LIMPEZA TOTAL ---
  const handleClearDatabase = async () => {
    if (!confirm("ATENÇÃO: TEM CERTEZA QUE DESEJA APAGAR TODOS OS DADOS?")) return;
    if (!confirm("ÚLTIMO AVISO: Isso limpará todo o banco de dados.")) return;

    setIsClearing(true);
    try {
      await db.auditSessions.clearAll();
      await db.requests.clearAll();
      await db.notifications.clearAll();
      await db.assets.clearAll();
      await db.users.clearAll();
      await db.employees.clearAll();
      await db.departments.clearAll();
      await db.assetTypeConfigs.clearAll();
      await db.accountingAccounts.clearAll();
      await db.legalEntities.clearAll();
      await db.systemConfigs.clearAll(); // Limpa também configs

      alert("Limpeza do sistema concluída com sucesso!");
      window.location.reload();

    } catch (error: any) {
      console.error("Erro ao limpar banco:", error);
      alert("Ocorreu um erro ao tentar limpar o banco de dados.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Card de Exportação */}
        <div className="flex-1 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 z-0 group-hover:scale-110 transition-transform" />
           <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center shadow-inner z-10">
              <Download className="w-10 h-10 text-emerald-600" />
           </div>
           <div className="z-10">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Exportação de Dados</h3>
              <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto text-sm">
                Gere um arquivo Excel (.xlsx) completo para backup.
              </p>
           </div>
           <button 
            onClick={handleExportSystemData}
            className="z-10 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-emerald-100 transition-all uppercase tracking-widest text-xs flex items-center gap-2 transform hover:scale-105 active:scale-95"
          >
            <Download className="w-5 h-5" />
            Baixar Planilha Modelo
          </button>
        </div>

        {/* Card de Importação */}
        <div className="flex-1 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8 z-0 group-hover:scale-110 transition-transform" />
           <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center shadow-inner z-10">
              {isImporting ? <Loader2 className="w-10 h-10 text-blue-600 animate-spin" /> : <Upload className="w-10 h-10 text-blue-600" />}
           </div>
           <div className="z-10">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Importação em Lote</h3>
              <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto text-sm">
                Carregue a planilha para atualizar dados em massa.
              </p>
           </div>
           
           <input 
              type="file" 
              accept=".xlsx, .xls" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
           />
           
           <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className={`z-10 px-10 py-4 rounded-2xl font-black shadow-xl transition-all uppercase tracking-widest text-xs flex items-center gap-2 transform hover:scale-105 active:scale-95 ${
              isImporting 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'
            }`}
          >
            {isImporting ? 'Processando...' : 'Carregar Planilha .XLSX'}
            {!isImporting && <FileSpreadsheet className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Resto do componente permanece igual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CARD DADOS CORPORATIVOS */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden">
           <div className="flex flex-col h-full relative z-10">
              <div className="flex items-center gap-6 mb-6">
                 <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                    <Building2 className="w-8 h-8 text-white" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Dados Corporativos</h3>
                    <p className="text-slate-500 font-medium mt-1 text-sm">Empresas e Filiais para Relatórios.</p>
                 </div>
              </div>

              <div className="flex-1 space-y-3 max-h-60 overflow-y-auto custom-scrollbar mb-4">
                 {legalEntities.map(entity => (
                   <div key={entity.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center group">
                      <div>
                         <p className="text-xs font-black text-slate-800">{entity.socialReason}</p>
                         <p className="text-[10px] text-slate-500 font-mono">CNPJ: {entity.cnpj}</p>
                         <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{entity.address}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleOpenEntityForm(entity)} className="p-2 bg-white rounded-xl text-blue-600 hover:bg-blue-50">
                            <Edit2 className="w-4 h-4" />
                         </button>
                         <button onClick={() => { if(confirm('Remover esta empresa?')) onRemoveLegalEntity(entity.id); }} className="p-2 bg-white rounded-xl text-rose-600 hover:bg-rose-50">
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                 ))}
                 {legalEntities.length === 0 && <p className="text-center text-slate-400 text-xs py-4">Nenhuma empresa cadastrada.</p>}
              </div>

              <button 
                onClick={() => handleOpenEntityForm()}
                className="w-full bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" /> Cadastrar Nova Empresa
              </button>
           </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* CARD IDENTIDADE VISUAL */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden flex-1">
             <div className="flex items-start gap-6 relative z-10 h-full">
                <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                   <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 flex flex-col h-full">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">Identidade Visual</h3>
                   <p className="text-slate-500 font-medium mt-1 text-sm">
                     Logo para relatórios PDF e etiquetas. Salvo no banco de dados.
                   </p>
                   
                   <div className="mt-6 flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50 min-h-[100px]">
                      {logoPreview ? (
                        <div className="relative group">
                          <img src={logoPreview} alt="Logo Empresa" className="h-20 object-contain" />
                          <button 
                            onClick={handleRemoveLogo}
                            className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-slate-400">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs font-bold">Nenhum logo</p>
                        </div>
                      )}
                   </div>

                   <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={logoInputRef}
                      onChange={handleLogoUpload}
                   />

                   <div className="mt-4">
                      <button 
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-purple-200 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {isUploadingLogo ? 'Salvando...' : 'Carregar Imagem'}
                      </button>
                   </div>
                </div>
             </div>
          </div>

          {/* CARD INTEGRAÇÕES */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden flex-1">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                   <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Notificações</h3>
             </div>
             
             <div className="space-y-3">
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Bot Token</label>
                   <input 
                     type="password"
                     className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-sky-500 text-xs" 
                     value={telegramConfig.telegramBotToken}
                     onChange={e => setTelegramConfig({...telegramConfig, telegramBotToken: e.target.value})}
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Chat ID</label>
                   <input 
                     className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-sky-500 text-xs" 
                     value={telegramConfig.telegramChatId}
                     onChange={e => setTelegramConfig({...telegramConfig, telegramChatId: e.target.value})}
                   />
                </div>
             </div>

             <div className="mt-4 flex items-center gap-3">
                <button 
                  onClick={handleSaveIntegrations}
                  className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg shadow-sky-200 transition-all active:scale-95 w-full justify-center"
                >
                  <Save className="w-4 h-4" /> Salvar Config
                </button>
                {showConfigSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-in fade-in" />}
             </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8">
         <div className="space-y-6 w-full md:w-auto">
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Database className="w-8 h-8 text-white" />
               </div>
               <div>
                  <h3 className="text-2xl font-black tracking-tight">Status do Banco de Dados</h3>
                  <p className="text-blue-200 text-sm font-bold uppercase tracking-widest">Conexão Segura</p>
               </div>
            </div>
            
            <div className="space-y-2 pt-2">
               <div className="flex items-center gap-4 text-sm font-bold text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> PostgreSQL (Supabase)
               </div>
               <div className="flex items-center gap-4 text-sm font-bold text-slate-400">
                  <Activity className="w-4 h-4 text-blue-500" /> Replicação em Tempo Real
               </div>
            </div>
         </div>

         <div className="grid grid-cols-3 gap-8 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-700 pt-8 md:pt-0 md:pl-10">
            <div className="text-center">
               <span className="block text-3xl font-black">{assets.length}</span>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ativos</span>
            </div>
            <div className="text-center">
               <span className="block text-3xl font-black">{employees.length}</span>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pessoas</span>
            </div>
            <div className="text-center">
               <span className="block text-3xl font-black">{departments.length}</span>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Setores</span>
            </div>
         </div>
      </div>

      {/* ZONA DE PERIGO - RESET DE BANCO - VISIBLE ONLY TO ADMIN */}
      {currentUser.username === 'admin' && (
      <div className="border-2 border-rose-100 bg-rose-50 rounded-[3rem] p-10 mt-8 flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center text-white shrink-0">
               <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
               <h4 className="text-xl font-black text-rose-900 uppercase tracking-tight">Zona de Perigo</h4>
               <p className="text-sm text-rose-800/80 font-bold mt-1">
                 Use esta função para limpar completamente o banco de dados e reiniciar o sistema do zero.
                 <br/><span className="text-xs uppercase opacity-75">Ideal para testes de importação em massa.</span>
               </p>
            </div>
         </div>
         <button 
           onClick={handleClearDatabase}
           disabled={isClearing}
           className="bg-white border-2 border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all shadow-lg shadow-rose-100/50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
         >
           {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
           {isClearing ? 'Apagando Dados...' : 'Apagar Tudo / Reset'}
         </button>
      </div>
      )}

      {/* MODAL FORM LEGAL ENTITY */}
      {showEntityForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-black text-slate-900">
                    {editingEntity ? 'Editar Empresa' : 'Nova Empresa/Filial'}
                 </h3>
                 <button onClick={() => setShowEntityForm(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSaveEntity} className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Razão Social</label>
                    <input className="w-full p-4 rounded-2xl border border-slate-200 font-bold" value={entityForm.socialReason} onChange={e => setEntityForm({...entityForm, socialReason: e.target.value})} required placeholder="Ex: Minha Empresa Ltda" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ</label>
                    <input className="w-full p-4 rounded-2xl border border-slate-200 font-bold" value={entityForm.cnpj} onChange={e => setEntityForm({...entityForm, cnpj: e.target.value})} required placeholder="00.000.000/0001-00" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Completo</label>
                    <textarea className="w-full p-4 rounded-2xl border border-slate-200 font-bold h-24" value={entityForm.address} onChange={e => setEntityForm({...entityForm, address: e.target.value})} required placeholder="Rua, Número, Bairro, Cidade - UF" />
                 </div>
                 <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl uppercase tracking-widest text-xs mt-4">
                    Salvar Dados
                 </button>
              </form>
           </div>
        </div>
      )}

      <div className="text-center py-10 opacity-50">
         <p className="text-xs font-black uppercase tracking-widest text-slate-400">AssetTrack Pro Enterprise v2.9</p>
         <p className="text-[10px] text-slate-400 mt-1">Módulo de Importação/Exportação Avançado</p>
      </div>

    </div>
  );
};

export default SystemInfoManager;
