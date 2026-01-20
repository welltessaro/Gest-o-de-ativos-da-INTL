
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  Layers,
  Truck,
  ArrowRight,
  Package,
  X,
  User,
  Archive,
  ChevronRight,
  Info
} from 'lucide-react';
import { Asset, EquipmentRequest, Employee } from '../types';

interface DashboardProps {
  assets: Asset[];
  requests: EquipmentRequest[];
  employees: Employee[];
}

const COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#4f46e5'];

type DetailType = 'total' | 'in-use' | 'maintenance' | 'retired' | null;

const Dashboard: React.FC<DashboardProps> = ({ assets, requests, employees }) => {
  const [selectedDetail, setSelectedDetail] = useState<DetailType>(null);

  const today = new Date().toISOString().split('T')[0];

  // Filtra apenas ativos que compõem a frota operacional (Ignora Baixados para contagens de "Total")
  const activeAssets = useMemo(() => assets.filter(a => a.status !== 'Baixado'), [assets]);

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
    // Total agora usa activeAssets (exclui baixados)
    { id: 'total' as DetailType, label: 'Ativos Operacionais', value: activeAssets.length, icon: Layers, color: 'text-blue-700', bg: 'bg-blue-100' },
    { id: 'in-use' as DetailType, label: 'Em Uso', value: assets.filter(a => a.status === 'Em Uso').length, icon: ShieldCheck, color: 'text-emerald-700', bg: 'bg-emerald-100' },
    { id: 'maintenance' as DetailType, label: 'Em Manutenção', value: assets.filter(a => a.status === 'Manutenção').length, icon: Activity, color: 'text-amber-700', bg: 'bg-amber-100' },
    // Mantemos a contagem total de baixados para histórico, mas ela não soma no card 'Total' acima
    { id: 'retired' as DetailType, label: 'Baixados / Sucata', value: assets.filter(a => a.status === 'Baixado').length, icon: AlertTriangle, color: 'text-rose-700', bg: 'bg-rose-100' },
  ];

  // Gráficos agora baseados na frota ativa
  const chartData = [
    { name: 'Desktop', qty: activeAssets.filter(a => a.type === 'Desktop').length },
    { name: 'Notebook', qty: activeAssets.filter(a => a.type === 'Notebook').length },
    { name: 'Monitor', qty: activeAssets.filter(a => a.type === 'Monitor').length },
    { name: 'Outros', qty: activeAssets.filter(a => !['Desktop', 'Notebook', 'Monitor'].includes(a.type)).length },
  ];

  const statusData = [
    { name: 'Disponível', value: activeAssets.filter(a => a.status === 'Disponível').length },
    { name: 'Em Uso', value: activeAssets.filter(a => a.status === 'Em Uso').length },
    { name: 'Manutenção', value: activeAssets.filter(a => a.status === 'Manutenção').length },
    { name: 'Pendente Doc', value: activeAssets.filter(a => a.status === 'Pendente Documentos').length },
  ];

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
      {todayDeliveries.length > 0 && (
        <div className="bg-white border-2 border-emerald-500 rounded-[2.5rem] p-8 shadow-xl shadow-emerald-50 overflow-hidden relative">
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6 text-center md:text-left">
                 <div className="w-16 h-16 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-lg shadow-emerald-200 shrink-0 animate-bounce">
                    <Truck className="w-8 h-8" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Entregas de Hoje</h3>
                    <p className="text-slate-600 font-semibold">Temos {todayDeliveries.length} {todayDeliveries.length === 1 ? 'equipamento chegando' : 'equipamentos chegando'} ao escritório hoje.</p>
                 </div>
              </div>
              <div className="flex flex-wrap gap-3">
                 {todayDeliveries.slice(0, 3).map((d, i) => (
                   <div key={i} className="bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-2xl flex items-center gap-3">
                      <Package className="w-4 h-4 text-emerald-700" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-emerald-700 leading-none">{d.item}</p>
                        <p className="text-xs font-bold text-slate-800">{d.employeeName}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            onClick={() => setSelectedDetail(stat.id)}
            className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer active:scale-95"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{stat.label}</p>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Ativos por Categoria (Ativos)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="qty" fill="#2563eb" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Status Operacional</h3>
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
                   contentStyle={{borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3 ml-8">
              {statusData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}} />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{entry.name}</span>
                  <span className="text-xs font-black text-slate-900 ml-auto">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                       {selectedDetail === 'total' && <Layers className="w-7 h-7" />}
                       {selectedDetail === 'in-use' && <ShieldCheck className="w-7 h-7" />}
                       {selectedDetail === 'maintenance' && <Activity className="w-7 h-7" />}
                       {selectedDetail === 'retired' && <AlertTriangle className="w-7 h-7" />}
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                          {selectedDetail === 'total' && 'Relatório de Ativos Operacionais'}
                          {selectedDetail === 'in-use' && 'Ativos Alocados'}
                          {selectedDetail === 'maintenance' && 'Centro de Manutenção'}
                          {selectedDetail === 'retired' && 'Arquivo de Baixas'}
                       </h3>
                       <p className="text-slate-600 text-sm font-black uppercase tracking-widest text-[10px]">Visão Analítica para Diretoria</p>
                    </div>
                 </div>
                 <button 
                  onClick={() => setSelectedDetail(null)}
                  className="p-3 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-900"
                 >
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                {selectedDetail === 'total' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {chartData.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-black">
                             {item.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-600 font-black uppercase tracking-widest">Categoria Ativa</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-black text-slate-900">{item.qty}</p>
                          <p className="text-[10px] font-black text-blue-700 uppercase">Unidades</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedDetail === 'in-use' && (
                  <div className="space-y-6">
                    {assetsGroupedByEmployee.map((group, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
                        <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white rounded-full border border-slate-300 flex items-center justify-center text-slate-500">
                                <User className="w-6 h-6" />
                             </div>
                             <div>
                                <h4 className="font-black text-slate-900">{group.employee?.name || 'Não Vinculado'}</h4>
                                <p className="text-xs text-slate-600 font-black uppercase tracking-widest">{group.employee?.sector || 'Sem Setor'}</p>
                             </div>
                          </div>
                          <span className="bg-blue-700 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100">
                            {group.items.length} {group.items.length === 1 ? 'Ativo' : 'Ativos'}
                          </span>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {group.items.map(asset => (
                            <div key={asset.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                               <Package className="w-5 h-5 text-slate-600" />
                               <div>
                                  <p className="text-xs font-black text-slate-900 leading-none mb-1">{asset.type}</p>
                                  <p className="text-[10px] text-slate-600 font-black uppercase">{asset.brand} {asset.model}</p>
                                  <p className="text-[9px] text-blue-700 font-mono font-bold mt-1">ID: {asset.id}</p>
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedDetail === 'maintenance' && (
                  <div className="space-y-4">
                    {assets.filter(a => a.status === 'Manutenção').map(asset => (
                      <div key={asset.id} className="bg-white p-6 rounded-3xl border-2 border-amber-200 shadow-sm flex flex-col md:flex-row gap-6 hover:border-amber-500 transition-colors">
                        <div className="flex items-center gap-4 md:w-1/3">
                           <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-700 shrink-0">
                              <Activity className="w-8 h-8" />
                           </div>
                           <div>
                              <p className="font-black text-slate-900 text-lg">{asset.type}</p>
                              <p className="text-sm text-slate-600 font-black uppercase tracking-widest leading-none mb-1">{asset.brand} {asset.model}</p>
                              <p className="text-[10px] font-mono font-bold text-slate-500">PATRIMÔNIO: {asset.id}</p>
                           </div>
                        </div>
                        <div className="flex-1 bg-amber-50/50 p-6 rounded-2xl border border-amber-200 relative">
                           <div className="absolute -top-3 left-4 bg-amber-700 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Laudo Técnico / Motivo</div>
                           <p className="text-sm text-slate-800 font-semibold italic leading-relaxed">
                             "{asset.observations || 'Nenhum motivo específico detalhado no cadastro de manutenção.'}"
                           </p>
                           <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-amber-700 tracking-widest">
                             <User className="w-3 h-3" /> Responsável Anterior: {getEmployeeName(asset.assignedTo)}
                           </div>
                        </div>
                      </div>
                    ))}
                    {assets.filter(a => a.status === 'Manutenção').length === 0 && (
                      <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-300">
                         <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                         <p className="text-slate-600 font-black uppercase tracking-widest">Nenhum equipamento em manutenção no momento.</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedDetail === 'retired' && (
                  <div className="grid grid-cols-1 gap-4">
                    {assets.filter(a => a.status === 'Baixado').map(asset => (
                      <div key={asset.id} className="bg-white p-6 rounded-3xl border border-slate-300 flex items-center justify-between hover:bg-rose-50/30 transition-colors group">
                        <div className="flex items-center gap-6">
                           <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-rose-100 group-hover:text-rose-700 transition-all">
                              <Archive className="w-7 h-7" />
                           </div>
                           <div>
                              <div className="flex items-center gap-3">
                                <h4 className="text-lg font-black text-slate-900">{asset.type}</h4>
                                <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-200">Baixado</span>
                              </div>
                              <p className="text-sm text-slate-600 font-black uppercase tracking-tighter">{asset.brand} {asset.model} • {asset.id}</p>
                           </div>
                        </div>
                        <div className="max-w-md text-right">
                           <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Motivo da Baixa</p>
                           <p className="text-sm text-slate-800 font-semibold leading-tight">
                             {asset.observations || 'Sucateamento técnico por obsolescência.'}
                           </p>
                        </div>
                      </div>
                    ))}
                    {assets.filter(a => a.status === 'Baixado').length === 0 && (
                      <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-300">
                         <Archive className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                         <p className="text-slate-600 font-black uppercase tracking-widest">Nenhum equipamento baixado no histórico.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                 <p className="text-xs text-slate-600 font-bold italic">Dados sincronizados em tempo real com o banco de ativos.</p>
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
          background: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
