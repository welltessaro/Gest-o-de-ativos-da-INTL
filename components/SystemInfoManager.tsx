
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Download, Database, ShieldCheck, Activity, Upload, Loader2, FileSpreadsheet, Trash2, AlertTriangle } from 'lucide-react';
import { Asset, EquipmentRequest, Employee, Department, AssetTypeConfig, AccountingAccount, UserAccount } from '../types';
import { db } from '../services/supabase';

interface SystemInfoManagerProps {
  assets: Asset[];
  requests: EquipmentRequest[];
  employees: Employee[];
  departments: Department[];
  assetTypeConfigs: AssetTypeConfig[];
  accounts: AccountingAccount[];
  currentUser: UserAccount;
}

const SystemInfoManager: React.FC<SystemInfoManagerProps> = ({ 
  assets, 
  requests, 
  employees, 
  departments,
  assetTypeConfigs,
  accounts,
  currentUser
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
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
          'Código da Conta': account?.code || '', // Adicionado: Código Contábil
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
          'Data Criação': new Date(a.createdAt).toLocaleDateString()
        };
      });
      const wsAssets = XLSX.utils.json_to_sheet(assetData);
      XLSX.utils.book_append_sheet(wb, wsAssets, "Inventário Ativos");

      // 2. Aba de Colaboradores
      const employeeData = employees.map(e => {
        const dept = departments.find(d => d.id === e.departmentId);
        const assetCount = assets.filter(a => a.assignedTo === e.id).length;
        return {
          'Nome': e.name,
          'CPF': e.cpf,
          'Cargo/Função': e.role,
          'Setor/Departamento': dept?.name || e.sector,
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

        // Helper para converter valor monetário string (pt-BR) para number
        const parseCurrency = (val: any): number => {
          if (typeof val === 'number') return val;
          if (typeof val === 'string') {
            let s = val.replace('R$', '').trim();
            // Lógica simples: se tem virgula e ponto, assume formato 1.000,00
            // Se só tem virgula, assume decimal (1000,00)
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
          // raw: false força leitura como string (texto exibido), preservando formatação
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
          // raw: false garante que 'Código da Conta' seja lido como Texto ("001" permanece "001")
          const data: any[] = XLSX.utils.sheet_to_json(wsAssets, { raw: false });
          for (const row of data) {
            const id = row['ID Patrimonial'];
            if (id) {
              // --- TRATAMENTO DE CLASSIFICAÇÃO CONTÁBIL ---
              const typeName = (row['Tipo'] || 'Outros').trim();
              const classificationName = (row['Classificação Contábil (Nome)'] || '').trim();
              const classificationCode = (row['Código da Conta'] ? String(row['Código da Conta']) : '').trim();
              
              let accountId: string | undefined = undefined;

              // 1. Tenta resolver ou criar a Conta Contábil (Plano de Contas)
              if (classificationCode && classificationName) {
                 if (accountCodeMap.has(classificationCode)) {
                    accountId = accountCodeMap.get(classificationCode);
                 } else {
                    // CRIA NOVA CONTA SE NÃO EXISTIR NA BASE
                    const newAccountId = `ACC-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                    const newAccount: AccountingAccount = {
                       id: newAccountId,
                       code: classificationCode,
                       name: classificationName,
                       type: (row['Class. Tipo'] || 'Ativo') as any,
                       costCenter: row['Centro Custo Class.'] || ''
                    };
                    await db.accountingAccounts.upsert(newAccount);
                    
                    // Atualiza mapas locais para que as próximas linhas usem a conta criada
                    accountCodeMap.set(classificationCode, newAccountId);
                    accountId = newAccountId;
                 }
              } else if (classificationCode) {
                 // Se só tem código, tenta achar na base
                 accountId = accountCodeMap.get(classificationCode);
              } else if (classificationName) {
                 // Se só tem nome, tenta achar na base
                 accountId = accountNameMap.get(classificationName.toLowerCase());
              }
              
              // 2. Atualiza/Cria Configuração do Tipo de Ativo e Vínculo
              if (typeName) {
                const typeKey = typeName.toLowerCase();
                const existingConfig = typeConfigMap.get(typeKey);
                
                // Se já existe config, mas achamos um accountId novo via planilha, atualizamos
                // Se não existe, criamos um novo Tipo de Ativo
                
                if (!existingConfig) {
                  const newConfig: AssetTypeConfig = {
                    id: `TYPE-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    name: typeName,
                    accountId: accountId
                  };
                  await db.assetTypeConfigs.upsert(newConfig);
                  typeConfigMap.set(typeKey, newConfig); 
                } else if (accountId && existingConfig.accountId !== accountId) {
                  // Atualiza vínculo se mudou na planilha
                  const updatedConfig: AssetTypeConfig = { ...existingConfig, accountId };
                  await db.assetTypeConfigs.upsert(updatedConfig);
                  typeConfigMap.set(typeKey, updatedConfig);
                }
              }

              // --- TRATAMENTO DO ATIVO ---
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
                photos: existingAsset?.photos || [],
                history
              };

              await db.assets.upsert(asset);
              importedAssetsCount++;
            }
          }
        }

        alert(`Importação concluída com sucesso!\n\nDados Processados:\n- Departamentos Sincronizados\n- Colaboradores Sincronizados\n- ${importedAssetsCount} Ativos Processados\n- Tipos de Ativo & Contas Atualizados\n\nRecarregue a página para visualizar todas as alterações.`);
        
        if (fileInputRef.current) fileInputRef.current.value = '';

      } catch (error) {
        console.error("Erro na importação:", error);
        alert("Erro crítico ao processar o arquivo. Verifique se o formato segue o modelo de exportação padrão.");
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- LÓGICA DE LIMPEZA TOTAL ---
  const handleClearDatabase = async () => {
    if (!confirm("ATENÇÃO: TEM CERTEZA QUE DESEJA APAGAR TODOS OS DADOS?\n\nEssa ação é irreversível e excluirá todos os ativos, colaboradores, departamentos e histórico do sistema.")) {
      return;
    }
    
    // Segunda confirmação para evitar acidentes
    if (!confirm("ÚLTIMO AVISO: Isso limpará todo o banco de dados para testes. Confirmar exclusão total?")) {
      return;
    }

    setIsClearing(true);
    try {
      // A ordem importa para evitar erros de Foreign Key (embora o ON DELETE SET NULL ajude, é melhor limpar dependentes primeiro)
      
      // 1. Auditorias e Requisições (Dependentes)
      await db.auditSessions.clearAll();
      await db.requests.clearAll();
      
      // 2. Notificações
      await db.notifications.clearAll();

      // 3. Ativos (Vinculados a Depts e Emps)
      await db.assets.clearAll();

      // 4. Usuários (Vinculados a Emps)
      // Nota: Não podemos apagar o usuário atual da sessão Auth se estiver logado via Supabase Auth, 
      // mas aqui estamos limpando a tabela 'users' pública da aplicação.
      await db.users.clearAll();

      // 5. Colaboradores (Vinculados a Depts)
      await db.employees.clearAll();

      // 6. Departamentos (Base)
      await db.departments.clearAll();
      
      // 7. Configurações Auxiliares (Opcional, mas bom para reset total)
      await db.assetTypeConfigs.clearAll();
      await db.accountingAccounts.clearAll();

      alert("Limpeza do sistema concluída com sucesso! A página será recarregada.");
      window.location.reload();

    } catch (error: any) {
      console.error("Erro ao limpar banco:", error);
      alert("Ocorreu um erro ao tentar limpar o banco de dados. Verifique o console ou as permissões.");
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
                Gere um arquivo Excel (.xlsx) completo para backup ou para editar dados em massa e reimportar.
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
                Carregue a planilha preenchida para atualizar ou criar múltiplos registros de Ativos e Colaboradores.
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
          {isImporting && <p className="text-[10px] font-bold text-blue-600 animate-pulse">Isso pode levar alguns segundos...</p>}
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

      <div className="text-center py-10 opacity-50">
         <p className="text-xs font-black uppercase tracking-widest text-slate-400">AssetTrack Pro Enterprise v2.7</p>
         <p className="text-[10px] text-slate-400 mt-1">Módulo de Importação/Exportação Avançado</p>
      </div>

    </div>
  );
};

export default SystemInfoManager;
