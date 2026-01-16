
import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  FileText, 
  Menu, 
  X, 
  LogOut,
  ClipboardList,
  Printer,
  ShoppingCart,
  ShieldCheck,
  Bell,
  Calendar,
  Building2,
  Wrench
} from 'lucide-react';
import { AppModule, UserAccount, EquipmentRequest } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserAccount;
  onLogout: () => void;
  requests: EquipmentRequest[];
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, currentUser, onLogout, requests }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const todayDeliveries = useMemo(() => {
    const deliveries: any[] = [];
    requests.forEach(req => {
      req.itemFulfillments?.forEach(f => {
        if (f.purchaseStatus === 'Comprado' && !f.isDelivered && f.deliveryForecastDate === today) {
          deliveries.push({
            id: req.id,
            item: f.type,
            employeeId: req.employeeId
          });
        }
      });
    });
    return deliveries;
  }, [requests, today]);

  const menuItems: { id: AppModule; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Diretoria - Dashboard', icon: LayoutDashboard },
    { id: 'companies', label: 'Empresas Clientes', icon: Building2 },
    { id: 'assets', label: 'Inventário de Ativos', icon: Package },
    { id: 'maintenance', label: 'Centro de Manutenção', icon: Wrench },
    { id: 'employees', label: 'Colaboradores (RH)', icon: Users },
    { id: 'requests', label: 'Requisições', icon: FileText },
    { id: 'purchase-orders', label: 'Pedidos de Compra', icon: ShoppingCart },
    { id: 'printing', label: 'Gerenciamento de Impressões', icon: Printer },
    { id: 'user-management', label: 'Gestão de Usuários', icon: ShieldCheck },
    { id: 'inventory-check', label: 'Check semestral', icon: ClipboardList },
  ];

  const visibleMenuItems = menuItems.filter(item => currentUser.modules.includes(item.id));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <div className={`fixed inset-0 z-50 bg-black/50 transition-opacity lg:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)} />
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 px-6 py-8 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Package className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">AssetTrack Pro</h1>
        </div>

        <nav className="mt-8 px-4 space-y-2 overflow-y-auto max-h-[calc(100vh-250px)] custom-sidebar-scroll">
          {visibleMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-4 left-0 w-full px-4 border-t border-slate-800 pt-4 bg-slate-900">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair do Sistema</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        <header className="h-20 flex items-center justify-between px-6 bg-white border-b border-slate-200 lg:px-10 sticky top-0 z-50">
          <button className="lg:hidden p-2 text-slate-600" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="hidden lg:block">
            <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase">
              {menuItems.find(i => i.id === activeTab)?.icon && React.createElement(menuItems.find(i => i.id === activeTab)!.icon, { className: "w-5 h-5 text-blue-600" })}
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 hover:bg-slate-100 transition-all"
              >
                <Bell className="w-5 h-5" />
                {todayDeliveries.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse border-2 border-white">
                    {todayDeliveries.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 z-[100]">
                  <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Notificações</span>
                    <button onClick={() => setShowNotifications(false)}><X className="w-4 h-4 text-slate-400" /></button>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-4 space-y-3">
                    {todayDeliveries.map((d, i) => (
                      <div key={i} className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                         <p className="text-xs font-bold text-slate-800">{d.item} Chegando!</p>
                         <p className="text-[10px] text-slate-500">Protocolo: {d.id}</p>
                      </div>
                    ))}
                    {todayDeliveries.length === 0 && <p className="text-center py-6 text-slate-400 font-medium">Sem avisos hoje.</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 pl-6 border-l border-slate-100">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-black text-slate-800">{currentUser.name}</span>
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">{currentUser.sector}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-center font-black text-white text-lg">
                 {currentUser.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
