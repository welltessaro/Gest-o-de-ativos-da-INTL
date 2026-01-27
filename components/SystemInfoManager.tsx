
import React from 'react';
import * as XLSX from 'xlsx';
import { Download, Database, HardDrive, ShieldCheck, Activity } from 'lucide-react';
import { Asset, EquipmentRequest, Employee, Department } from '../types';

interface SystemInfoManagerProps {
  assets: Asset[];
  requests: EquipmentRequest[];
  employees: Employee[];
  departments: Department[];
}

const SystemInfoManager: React.FC<SystemInfoManagerProps> = ({ assets, requests, employees, departments }) => {
  
  // --- LÓGICA DE EXPORTAÇÃO (XLSX) ---
  const handleExportSystemData = () => {
    try {
      const wb = XLSX.utils.book_new();

      // 1. Aba de Ativos
      const assetData = assets.map(a => {
        const emp = employees.find(e => e.id === a.assignedTo);
        const dept = departments.find(d => d.id === a.departmentId);
        return {
          'ID Patrimonial': a.id,
          'Etiqueta (Tag)': a.tagId,
          'Tipo': a.type,
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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Card de Exportação */}
        <div className="flex-1 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center text-center space-y-6">
           <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center shadow-inner">
              <Download className="w-12 h-12 text-emerald-600" />
           </div>
           <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Exportação de Dados</h3>
              <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">
                Gere um arquivo Excel (.xlsx) completo contendo todas as tabelas do sistema: Ativos, Colaboradores, Requisições e Departamentos.
              </p>
           </div>
           <button 
            onClick={handleExportSystemData}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-emerald-100 transition-all uppercase tracking-widest text-xs flex items-center gap-2 transform hover:scale-105 active:scale-95"
          >
            <Download className="w-5 h-5" />
            Baixar Relatório Completo
          </button>
        </div>

        {/* Card de Informações do Sistema */}
        <div className="flex-1 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl flex flex-col justify-between">
           <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Database className="w-8 h-8 text-white" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black tracking-tight">Status do Banco de Dados</h3>
                    <p className="text-blue-200 text-sm font-bold uppercase tracking-widest">Conexão Segura</p>
                 </div>
              </div>
              
              <div className="space-y-4 pt-4">
                 <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400 font-bold text-sm">Registros de Ativos</span>
                    <span className="text-xl font-black">{assets.length}</span>
                 </div>
                 <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400 font-bold text-sm">Colaboradores</span>
                    <span className="text-xl font-black">{employees.length}</span>
                 </div>
                 <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400 font-bold text-sm">Movimentações (Req)</span>
                    <span className="text-xl font-black">{requests.length}</span>
                 </div>
              </div>
           </div>

           <div className="mt-8 flex gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                 <ShieldCheck className="w-4 h-4 text-emerald-500" /> Sistema Operacional
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                 <Activity className="w-4 h-4 text-blue-500" /> Sincronização Ativa
              </div>
           </div>
        </div>
      </div>

      {/* Rodapé Informativo */}
      <div className="text-center py-10 opacity-50">
         <p className="text-xs font-black uppercase tracking-widest text-slate-400">AssetTrack Pro Enterprise v2.5</p>
         <p className="text-[10px] text-slate-400 mt-1">Desenvolvido para gestão de alta performance.</p>
      </div>

    </div>
  );
};

export default SystemInfoManager;
