
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
  Lock,
  Building2,
  Wrench,
  Layers,
  Truck,
  AlertCircle,
  Clock,
  Trash2,
  Check,
  Calculator,
  Book,
  Database
} from 'lucide-react';
import { AppModule, UserAccount, EquipmentRequest, AppNotification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserAccount;
  onLogout: () => void;
  requests: EquipmentRequest[];
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, currentUser, onLogout, 
  requests, notifications, onMarkAsRead, onClearAll 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const visibleNotifications = useMemo(() => {
    return (notifications || []).filter(n => {
      if (!n.targetModule) return true;
      return currentUser.modules?.includes(n.targetModule) ?? false;
    });
  }, [notifications, currentUser]);

  const unreadCount = visibleNotifications.filter(n => !n.isRead).length;

  const menuItems: { id: AppModule; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Diretoria - Dashboard', icon: LayoutDashboard },
    { id: 'departments', label: 'Gestão de Departamentos', icon: Layers },
    { id: 'assets', label: 'Inventário de Ativos', icon: Package },
    { id: 'maintenance', label: 'Centro de Manutenção', icon: Wrench },
    { id: 'employees', label: 'Colaboradores (RH)', icon: Users },
    { id: 'requests', label: 'Requisições', icon: FileText },
    { id: 'purchase-orders', label: 'Pedidos de Compra', icon: ShoppingCart },
    { id: 'printing', label: 'Gerenciamento de Impressões', icon: Printer },
    { id: 'user-management', label: 'Gestão de Usuários', icon: ShieldCheck },
    { id: 'inventory-check', label: 'Check semestral', icon: ClipboardList },
    { id: 'accounting', label: 'Classificação Contábil', icon: Calculator },
    { id: 'system-info', label: 'Informações do Sistema', icon: Database },
  ];

  const getNotifIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'maintenance': return <Wrench className="w-4 h-4 text-amber-600" />;
      case 'delivery': return <Truck className="w-4 h-4 text-emerald-600" />;
      case 'alert': return <AlertCircle className="w-4 h-4 text-rose-600" />;
      default: return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.round(diffMs / 60000);
    
    if (diffMin < 1) return 'Agora mesmo';
    if (diffMin < 60) return `${diffMin} min atrás`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

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

        <nav className="mt-8 px-4 space-y-1.5 overflow-y-auto h-[calc(100vh-250px)] custom-sidebar-scroll">
          {menuItems.map((item) => {
            const hasAccess = currentUser.modules?.includes(item.id) ?? false;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                disabled={!hasAccess}
                onClick={() => {
                  if (hasAccess) {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }
                }}
                className={`group flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-300 ${
                  !hasAccess 
                    ? 'opacity-30 grayscale cursor-not-allowed border border-transparent hover:bg-slate-800/20' 
                    : isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${!hasAccess ? 'text-slate-500' : isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                  <span className="font-semibold text-sm">{item.label}</span>
                </div>
                {!hasAccess && <Lock className="w-3 h-3 text-slate-600" />}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-0 w-full px-4 border-t border-slate-800 pt-4 bg-slate-900">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-300 hover:text-rose-400 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        <header className="h-20 flex items-center justify-between px-6 bg-white border-b border-slate-200 lg:px-10 sticky top-0 z-50">
          <button className="lg:hidden p-2 text-slate-800" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="hidden lg:block">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase">
              {menuItems.find(i => i.id === activeTab)?.icon && React.createElement(menuItems.find(i => i.id === activeTab)!.icon, { className: "w-5 h-5 text-blue-600" })}
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-3 rounded-2xl border transition-all ${
                  unreadCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-100 text-slate-800'
                } hover:bg-slate-100`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 z-[100]">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-900 tracking-widest">Central de Avisos</span>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={onClearAll} 
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Limpar tudo"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                       <button onClick={() => setShowNotifications(false)}><X className="w-4 h-4 text-slate-500 hover:text-slate-800" /></button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-4 space-y-3 custom-sidebar-scroll">
                    {visibleNotifications.length > 0 ? (
                      visibleNotifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          onClick={() => onMarkAsRead(notif.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer group relative ${
                            notif.isRead ? 'bg-white border-slate-100' : 'bg-blue-50/50 border-blue-100 shadow-sm'
                          } hover:bg-slate-50`}
                        >
                           <div className="flex items-start gap-3">
                              <div className={`mt-1 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                notif.type === 'maintenance' ? 'bg-amber-100' :
                                notif.type === 'delivery' ? 'bg-emerald-100' :
                                notif.type === 'alert' ? 'bg-rose-100' : 'bg-blue-100'
                              }`}>
                                {getNotifIcon(notif.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                   <p className={`text-xs font-black truncate ${notif.isRead ? 'text-slate-700' : 'text-slate-900'}`}>{notif.title}</p>
                                   {!notif.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0" />}
                                </div>
                                <p className="text-[10px] text-slate-600 font-medium leading-relaxed mt-1">{notif.message}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2">{getTimeAgo(notif.createdAt)}</p>
                              </div>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 opacity-30">
                        <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhum aviso no momento</p>
                      </div>
                    )}
                  </div>
                  {visibleNotifications.length > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/30 text-center">
                       <button onClick={() => setShowNotifications(false)} className="text-[10px] font-black uppercase text-blue-600 hover:underline">Fechar Notificações</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-black text-slate-900">{currentUser.name}</span>
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
      
      <style>{`
        .custom-sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .custom-sidebar-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
};

export default Layout;
