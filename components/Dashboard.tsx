
import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  Layers,
  Sparkles,
  Truck,
  ArrowRight,
  Package,
  X,
  User,
  Archive,
  ChevronRight,
  Info
} from 'lucide-react';
import { Asset, EquipmentRequest, Employee, AssetStatus } from '../types';
import { generateAssetReportSummary } from '../services/geminiService';

interface DashboardProps {
  assets: Asset[];
  requests: EquipmentRequest[];
  employees: Employee[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

type DetailType = 'total' | 'in-use' | 'maintenance' | 'retired' | null;

const Dashboard: React.FC<DashboardProps> = ({ assets, requests, employees }) => {
  const [aiInsight, setAiInsight] = useState<string>("Gerando insights inteligentes...");
  const [selectedDetail, setSelectedDetail] = useState<DetailType>(null);

  useEffect(() => {
    generateAssetReportSummary(assets).then(setAiInsight);
  }, [assets]);

  const today = new Date().toISOString().split('T')[0];

  const todayDeliveries = useMemo(() => {
    const deliveries: any[] = [];
    requests.forEach(req => {
      req.itemFulfillments?.forEach(f => {
        if (f.purchaseStatus === 'Comprado' && !f.isDelivered && f.deliveryForecastDate === today) {
          const emp = employees.find(e => e.id === req.employeeId);
          deliveries.push({
            id: req.id,
            item: f.type,
            employeeName: emp?.name || 'N/A',
            sector: emp?.sector || 'N/A'
          });
        }
      });
    });
    return deliveries;
  }, [requests, employees, today]);

  const stats = [
    { id: 'total' as DetailType, label: 'Total Ativos', value: assets.length, icon: Layers, color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 'in-use' as DetailType, label: 'Em Uso', value: assets.filter(a => a.status === 'Em Uso').length, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { id: 'maintenance' as DetailType, label: 'Em Manutenção', value: assets.filter(a => a.status === 'Manutenção').length, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-100' },
    { id: 'retired' as DetailType, label: 'Baixados', value: assets.filter(a => a.status === 'Baixado').length, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  const chartData = [
    { name: 'Desktop', qty: assets.filter(a => a.type === 'Desktop').length },
    { name: 'Notebook', qty: assets.filter(a => a.type === 'Notebook').length },
    { name: 'Monitor', qty: assets.filter(a => a.type === 'Monitor').length },
    { name: 'Outros', qty: assets.filter(a => !['Desktop', 'Notebook', 'Monitor'].includes(a.type)).length },
  ];

  const statusData = [
    { name: 'Disponível', value: assets.filter(a => a.status === 'Disponível').length },
    { name: 'Em Uso', value: assets.filter(a => a.status === 'Em Uso').length },
    { name: 'Manutenção', value: assets.filter(a => a.status === 'Manutenção').length },
    { name: 'Pendente Doc', value: assets.filter(a => a.status === 'Pendente Documentos').length },
  ];

  // Agrupamento para detalhe "Em Uso"
  const assetsGroupedByEmployee = useMemo(() => {
    const inUseAssets = assets.filter(a => a.status === 'Em Uso' && a.assignedTo);
    const groups: Record<string, Asset[]> = {};
    
    inUseAssets.forEach(asset => {
      const empId = asset.assignedTo!;
      if (!groups[empId]) groups[empId] = [];
      groups[empId].push(asset);
    });

    return Object.entries(groups).map(([empId, items]) => ({
      employee: employees.find(e => e.id === empId),
      items
    }));
  }, [assets, employees]);

  const getEmployeeName = (id?: string) => employees.find(e => e.id === id)?.name || 'N/A';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Notificação de Entregas do Dia */}
      {todayDeliveries.length > 0 && (
        <div className="bg-white border-2 border-emerald-500 rounded-[2.5rem] p-8 shadow-xl shadow-emerald-50 overflow-hidden relative">
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6 text-center md:text-left">
                 <div className="w-16 h-16 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-lg shadow-emerald-200 shrink-0 animate-bounce">
                    <Truck className="w-8 h-8" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Entregas de Hoje</h3>
                    <p className="text-slate-500 font-medium">Temos {todayDeliveries.length} {todayDeliveries.length === 1 ? 'equipamento chegando' : 'equipamentos chegando'} ao escritório hoje.</p>
                 </div>
              </div>
              <div className="flex flex-wrap gap-3">
                 {todayDeliveries.slice(0, 3).map((d, i) => (
                   <div key={i} className="bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-2xl flex items-center gap-3">
                      <Package className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-emerald-600 leading-none">{d.item}</p>
                        <p className="text-xs font-bold text-slate-700">{d.employeeName}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
           <div className="absolute top-[-50%] right-[-5%] w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50"></div>
        </div>
      )}

      {/* AI Insight Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-blue-200" />
            <h3 className="font-black text-lg uppercase tracking-widest">Insights Estratégicos</h3>
          </div>
          <p className="text-blue-50 leading-relaxed text-lg font-medium italic">
            "{aiInsight}"
          </p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
      </div>

      {/* Quick Stats - Clickable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            onClick={() => setSelectedDetail(stat.id)}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer active:scale-95"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-3xl font-black text-slate-800 tracking-tighter">{stat.value}</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Ativos por Categoria</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="qty" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Status dos Ativos</h3>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3 ml-8">
              {statusData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{entry.name}</span>
                  <span className="text-xs font-black text-slate-700 ml-auto">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED VIEW MODAL */}
      {selectedDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                       {selectedDetail === 'total' && <Layers className="w-7 h-7" />}
                       {selectedDetail === 'in-use' && <ShieldCheck className="w-7 h-7" />}
                       {selectedDetail === 'maintenance' && <Activity className="w-7 h-7" />}
                       {selectedDetail === 'retired' && <AlertTriangle className="w-7 h-7" />}
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                          {selectedDetail === 'total' && 'Relatório de Ativos'}
                          {selectedDetail === 'in-use' && 'Ativos Alocados'}
                          {selectedDetail === 'maintenance' && 'Centro de Manutenção'}
                          {selectedDetail === 'retired' && 'Arquivo de Baixas'}
                       </h3>
                       <p className="text-slate-500 text-sm font-medium uppercase tracking-widest text-[10px]">Visão Analítica para Diretoria</p>
                    </div>
                 </div>
                 <button 
                  onClick={() => setSelectedDetail(null)}
                  className="p-3 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-900"
                 >
                    <X className="w-6 h-6" />
                 </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                
                {/* 1. TOTAL ATIVOS - QUANTIDADE POR TIPO */}
                {selectedDetail === 'total' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {chartData.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black">
                             {item.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-800">{item.name}</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Categoria Ativa</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-black text-slate-900">{item.qty}</p>
                          <p className="text-[10px] font-black text-blue-600 uppercase">Unidades</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. EM USO - AGRUPADO POR COLABORADOR */}
                {selectedDetail === 'in-use' && (
                  <div className="space-y-6">
                    {assetsGroupedByEmployee.map((group, idx) => (
                      <div key={idx} className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
                        <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white rounded-full border border-slate-200 flex items-center justify-center text-slate-400">
                                <User className="w-6 h-6" />
                             </div>
                             <div>
                                <h4 className="font-black text-slate-800">{group.employee?.name || 'Não Vinculado'}</h4>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{group.employee?.sector || 'Sem Setor'}</p>
                             </div>
                          </div>
                          <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100">
                            {group.items.length} {group.items.length === 1 ? 'Ativo' : 'Ativos'}
                          </span>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {group.items.map(asset => (
                            <div key={asset.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                               <Package className="w-5 h-5 text-slate-400" />
                               <div>
                                  <p className="text-xs font-black text-slate-800 leading-none mb-1">{asset.type}</p>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">{asset.brand} {asset.model}</p>
                                  <p className="text-[9px] text-blue-500 font-mono mt-1">ID: {asset.id}</p>
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. EM MANUTENÇÃO - DETALHADO COM MOTIVO */}
                {selectedDetail === 'maintenance' && (
                  <div className="space-y-4">
                    {assets.filter(a => a.status === 'Manutenção').map(asset => (
                      <div key={asset.id} className="bg-white p-6 rounded-3xl border-2 border-amber-100 shadow-sm flex flex-col md:flex-row gap-6 hover:border-amber-400 transition-colors">
                        <div className="flex items-center gap-4 md:w-1/3">
                           <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                              <Activity className="w-8 h-8" />
                           </div>
                           <div>
                              <p className="font-black text-slate-800 text-lg">{asset.type}</p>
                              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">{asset.brand} {asset.model}</p>
                              <p className="text-[10px] font-mono text-slate-400">PATRIMÔNIO: {asset.id}</p>
                           </div>
                        </div>
                        <div className="flex-1 bg-amber-50/50 p-6 rounded-2xl border border-amber-100 relative">
                           <div className="absolute -top-3 left-4 bg-amber-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Laudo Técnico / Motivo</div>
                           <p className="text-sm text-slate-700 font-medium italic leading-relaxed">
                             "{asset.observations || 'Nenhum motivo específico detalhado no cadastro de manutenção.'}"
                           </p>
                           <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-amber-600 tracking-widest">
                             <User className="w-3 h-3" /> Responsável Anterior: {getEmployeeName(asset.assignedTo)}
                           </div>
                        </div>
                      </div>
                    ))}
                    {assets.filter(a => a.status === 'Manutenção').length === 0 && (
                      <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                         <Info className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                         <p className="text-slate-400 font-bold uppercase tracking-widest">Nenhum equipamento em manutenção no momento.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. BAIXADOS - EQUIPAMENTOS APOSENTADOS E MOTIVO */}
                {selectedDetail === 'retired' && (
                  <div className="grid grid-cols-1 gap-4">
                    {assets.filter(a => a.status === 'Baixado').map(asset => (
                      <div key={asset.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center justify-between hover:bg-rose-50/30 transition-colors group">
                        <div className="flex items-center gap-6">
                           <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-rose-100 group-hover:text-rose-600 transition-all">
                              <Archive className="w-7 h-7" />
                           </div>
                           <div>
                              <div className="flex items-center gap-3">
                                <h4 className="text-lg font-black text-slate-800">{asset.type}</h4>
                                <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Baixado</span>
                              </div>
                              <p className="text-sm text-slate-500 font-bold uppercase tracking-tighter">{asset.brand} {asset.model} • {asset.id}</p>
                           </div>
                        </div>
                        <div className="max-w-md text-right">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Motivo da Baixa</p>
                           <p className="text-sm text-slate-600 font-medium leading-tight">
                             {asset.observations || 'Sucateamento técnico por obsolescência.'}
                           </p>
                        </div>
                      </div>
                    ))}
                    {assets.filter(a => a.status === 'Baixado').length === 0 && (
                      <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                         <Archive className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                         <p className="text-slate-400 font-bold uppercase tracking-widest">Nenhum equipamento baixado no histórico.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                 <p className="text-xs text-slate-400 font-medium italic">Dados sincronizados em tempo real com o banco de ativos.</p>
                 <button 
                  onClick={() => setSelectedDetail(null)}
                  className="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-200 transition-all"
                 >
                    Fechar Relatório
                 </button>
              </div>
           </div>
        </div>
      )}

      <style>{`
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

export default Dashboard;
