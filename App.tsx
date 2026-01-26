
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AssetManager from './components/AssetManager';
import EmployeeManager from './components/EmployeeManager';
import RequestsManager from './components/RequestsManager';
import CompanyManager from './components/CompanyManager';
import MaintenanceManager from './components/MaintenanceManager';
import PurchaseOrderManager from './components/PurchaseOrderManager';
import PrintManager from './components/PrintManager';
import UserManager from './components/UserManager';
import InventoryCheckManager from './components/InventoryCheckManager';
import AccountingManager from './components/AccountingManager';
import Auth from './components/Auth';
import { MOCK_USERS } from './constants';
import { 
  Asset, Employee, EquipmentRequest, UserAccount, 
  Department, AuditSession, AppNotification, AccountingAccount, 
  AccountingClassification, AssetTypeConfig 
} from './types';
import { db, supabase } from './services/supabase';
import { Loader2, Package, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<EquipmentRequest[]>([]);
  const [auditSessions, setAuditSessions] = useState<AuditSession[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Estados Contábeis
  const [accountingAccounts, setAccountingAccounts] = useState<AccountingAccount[]>([]);
  const [accountingClassifications, setAccountingClassifications] = useState<AccountingClassification[]>([]);
  const [assetTypeConfigs, setAssetTypeConfigs] = useState<AssetTypeConfig[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled([
        db.departments.list(),
        db.assets.list(),
        db.employees.list(),
        db.requests.list(),
        db.auditSessions.list(),
        db.users.list(),
        db.notifications.list(),
        db.accountingAccounts.list(),
        db.accountingClassifications.list(),
        db.assetTypeConfigs.list()
      ]);

      const [
        depts, assts, emps, reqs, audits, userList, 
        notifs, accAccounts, accClass, assetConfigs
      ] = results.map(r => r.status === 'fulfilled' ? (r.value || []) : []);
      
      if (results.every(r => r.status === 'rejected')) setIsOffline(true);

      setDepartments(depts);
      setAssets(assts);
      setEmployees(emps);
      setRequests(reqs);
      setAuditSessions(audits);
      setAccountingAccounts(accAccounts);
      setAccountingClassifications(accClass);
      setAssetTypeConfigs(assetConfigs);
      
      const finalUsers = userList && userList.length > 0 ? [...userList] : [...MOCK_USERS];
      if (!finalUsers.find(u => u.username === 'admin')) {
        finalUsers.push(MOCK_USERS[0]);
      }
      setUsers(finalUsers);
      setNotifications(notifs);

    } catch (err: any) {
      console.error("Erro no carregamento:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    loadData(); 
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new as AppNotification;
          setNotifications(prev => {
            if (!prev) return [newNotif];
            if (prev.find(n => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev].slice(0, 50);
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const addNotification = async (notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `NTF-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...(prev || [])].slice(0, 50));
    try { await db.notifications.upsert(newNotif); } catch (e) {}
  };

  const markNotificationAsRead = async (id: string) => {
    const target = notifications.find(n => n.id === id);
    if (!target) return;
    const updated = { ...target, isRead: true };
    setNotifications(prev => (prev || []).map(n => n.id === id ? updated : n));
    try { await db.notifications.upsert(updated); } catch (e) {}
  };

  const clearNotifications = async () => {
    setNotifications([]);
    try { await db.notifications.clearAll(); } catch (e) {}
  };

  const handleLogin = async (user: UserAccount) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    if (user.modules && user.modules.length > 0) setActiveTab(user.modules[0]);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleAddAsset = async (assetData: any) => {
    let finalId = assetData.id?.trim();
    let finalTagId = assetData.tagId?.trim();

    if (!finalId) {
       const randomSuffix = Math.floor(1000 + Math.random() * 9000);
       finalId = `AST-${randomSuffix}`;
       while(assets.some(a => a.id === finalId)) {
         finalId = `AST-${Math.floor(1000 + Math.random() * 9000)}`;
       }
       // Se ID for automático, mantemos a etiqueta manual se existir, senão pode ficar vazia
    } else {
       // Se ID for manual, copiamos o ID para a etiqueta conforme requisito
       finalTagId = finalId;
    }

    const newAsset: Asset = { 
      ...assetData, 
      id: finalId, 
      tagId: finalTagId,
      qrCode: `QR-${finalId}`,
      createdAt: new Date().toISOString(),
      history: assetData.history || [{
        id: Math.random().toString(),
        date: new Date().toISOString(),
        type: 'Criação',
        description: `Patrimônio registrado no sistema (ID Automático: ${!assetData.id ? 'Sim' : 'Não'}). Etiqueta: ${finalTagId || 'N/A'}.`,
        performedBy: currentUser?.name || 'Sistema'
      }],
      observations: assetData.observations || ''
    };
    await db.assets.upsert(newAsset);
    setAssets(prev => [newAsset, ...(prev || [])]);
  };

  const handleUpdateAsset = async (updated: Asset) => {
    const oldAsset = assets.find(a => a.id === updated.id);
    let finalAsset = { ...updated };

    // LÓGICA DE PROTEÇÃO DE STATUS CRÍTICO
    if (finalAsset.status === 'Baixado') {
      // Se for baixa, limpa obrigatoriamente vínculos para evitar erros de integridade e inconsistência visual
      finalAsset.assignedTo = undefined;
      // Mantemos o departmentId apenas se for necessário para histórico de custos, 
      // mas geralmente ativos baixados saem do centro de custo.
    } else if (finalAsset.status === 'Manutenção') {
      // Se estiver em manutenção, mantemos o status manual vindo do componente
    } else {
      // Lógica automática para outros estados
      if (finalAsset.assignedTo) {
        finalAsset.status = 'Em Uso';
        const emp = employees.find(e => e.id === finalAsset.assignedTo);
        if (emp) finalAsset.departmentId = emp.departmentId;
      } else if (finalAsset.status === 'Em Uso' || (oldAsset?.assignedTo && !finalAsset.assignedTo)) {
        finalAsset.status = 'Disponível';
      }
    }

    try {
      console.log(`[AssetUpdate] Persistindo ${finalAsset.id} com status ${finalAsset.status}`);
      await db.assets.upsert(finalAsset);
      setAssets(prev => {
        const next = (prev || []).map(a => a.id === finalAsset.id ? { ...finalAsset } : a);
        return [...next];
      });
    } catch (err: any) {
      console.error("Falha ao atualizar ativo no Supabase:", err);
      throw err;
    }
  };

  const handleRemoveAsset = async (id: string) => {
    await db.assets.remove(id);
    setAssets(prev => (prev || []).filter(a => a.id !== id));
  };

  const handleAddRequest = async (reqData: any): Promise<void> => {
    const id = `REQ-${Math.floor(Math.random() * 9000) + 1000}`;
    
    // CORREÇÃO CRÍTICA: Se employeeId for string vazia, converte para null.
    // Isso evita o erro de chave estrangeira no banco de dados.
    const sanitizedData = { ...reqData };
    if (sanitizedData.employeeId === '') {
      sanitizedData.employeeId = null;
    }

    const newReq: EquipmentRequest = { ...sanitizedData, id, status: 'Pendente', createdAt: new Date().toISOString() };
    await db.requests.upsert(newReq);
    setRequests(prev => [newReq, ...(prev || [])]);
  };

  const handleUpdateRequest = async (req: EquipmentRequest) => {
    await db.requests.upsert(req);
    setRequests(prev => (prev || []).map(r => r.id === req.id ? req : r));

    if (req.status === 'Entregue' && req.employeeId) {
      const employee = employees.find(e => e.id === req.employeeId);
      if (!employee) return;

      const assetsToUpdate: Asset[] = [];
      
      req.itemFulfillments?.forEach(f => {
        if (f.linkedAssetId) {
          const asset = assets.find(a => a.id === f.linkedAssetId);
          if (asset) {
            assetsToUpdate.push({
              ...asset,
              status: 'Em Uso',
              assignedTo: employee.id,
              departmentId: employee.departmentId,
              history: [
                ...(asset.history || []),
                {
                  id: Math.random().toString(),
                  date: new Date().toISOString(),
                  type: 'Atribuição',
                  description: `Ativo entregue ao colaborador ${employee.name} via Requisição ${req.id}.`,
                  performedBy: currentUser?.name || 'Sistema'
                }
              ]
            });
          }
        }
      });

      if (assetsToUpdate.length > 0) {
        for (const asset of assetsToUpdate) {
          await db.assets.upsert(asset);
        }
        setAssets(prev => {
          const newAssets = [...prev];
          assetsToUpdate.forEach(updated => {
            const idx = newAssets.findIndex(a => a.id === updated.id);
            if (idx !== -1) newAssets[idx] = updated;
          });
          return newAssets;
        });
        
        addNotification({
          title: 'Patrimônio Atualizado',
          message: `${assetsToUpdate.length} item(ns) movidos para posse de ${employee.name}.`,
          type: 'delivery',
          targetModule: 'assets'
        });
      }
    }
  };

  const handleRemoveRequest = async (id: string) => {
    await db.requests.remove(id);
    setRequests(prev => (prev || []).filter(r => r.id !== id));
  };

  const handleUpdateAuditSession = async (session: AuditSession) => {
    await db.auditSessions.upsert(session);
    setAuditSessions(prev => (prev || []).map(old => old.id === session.id ? session : old));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl animate-pulse mb-4">
          <Package className="text-white w-10 h-10" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">AssetTrack Pro: Sincronizando com Supabase...</p>
        </div>
      </div>
    );
  }

  const activeEmployees = (employees || []).filter(e => e.isActive !== false);

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      currentUser={currentUser || MOCK_USERS[0]} 
      onLogout={handleLogout} 
      requests={requests}
      notifications={notifications}
      onMarkAsRead={markNotificationAsRead}
      onClearAll={clearNotifications}
    >
      {isOffline && (
        <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-800 animate-bounce">
           <WifiOff className="w-5 h-5" />
           <p className="text-xs font-black uppercase tracking-tight">O sistema está em modo de contingência offline (Local Storage).</p>
        </div>
      )}

      {(() => {
        if (!isAuthenticated || !currentUser) return <Auth onLogin={handleLogin} users={users} />;

        switch (activeTab) {
          case 'dashboard': return <Dashboard assets={assets} requests={requests} employees={activeEmployees} />;
          case 'departments': 
            return <CompanyManager 
              companies={departments} assets={assets} 
              onAddCompany={async (d) => { 
                const newD = {...d, id: `DEPT-${Date.now()}`, createdAt: new Date().toISOString()}; 
                await db.departments.upsert(newD); 
                setDepartments(prev => [...prev, newD]); 
              }} 
              onUpdateCompany={async (u) => { await db.departments.upsert(u); setDepartments(prev => prev.map(d => d.id === u.id ? u : d)); }} 
              onRemoveCompany={async (id) => { await db.departments.remove(id); setDepartments(prev => prev.filter(d => d.id !== id)); }} 
            />;
          case 'assets': return <AssetManager assets={assets} employees={activeEmployees} companies={departments} onAdd={handleAddAsset} onUpdate={handleUpdateAsset} onRemove={handleRemoveAsset} assetTypeConfigs={assetTypeConfigs} classifications={accountingClassifications} />;
          case 'employees': 
            return <EmployeeManager 
              employees={activeEmployees} departments={departments} assets={assets} users={users} requests={requests}
              onAdd={async (e) => { 
                const newE = {...e, id: `EMP-${Date.now()}`, isActive: true}; 
                await db.employees.upsert(newE); 
                setEmployees(prev => [...prev, newE]); 
              }} 
              onUpdate={async (u) => { await db.employees.upsert(u); setEmployees(prev => prev.map(e => e.id === u.id ? u : e)); }}
              onRemove={async (id) => { 
                setEmployees(prev => {
                  const target = prev.find(e => e.id === id);
                  if (!target) return prev;
                  const updatedEmployee = { ...target, isActive: false };
                  db.employees.upsert(updatedEmployee);
                  return prev.map(e => e.id === id ? updatedEmployee : e);
                });
              }}
            />;
          case 'requests': 
            return <RequestsManager 
              requests={requests} employees={activeEmployees} assets={assets} currentUser={currentUser} 
              onAddRequest={handleAddRequest} 
              onUpdateRequest={handleUpdateRequest} 
              onUpdateStatus={async (id, status) => { const req = requests.find(r => r.id === id); if(req) await handleUpdateRequest({...req, status}); }} 
              onRemoveRequest={handleRemoveRequest}
              assetTypeConfigs={assetTypeConfigs}
            />;
          case 'inventory-check': 
            return <InventoryCheckManager 
              assets={assets} 
              employees={activeEmployees} 
              auditSessions={auditSessions} 
              onAddAuditSession={async (s) => { 
                await db.auditSessions.upsert(s); 
                setAuditSessions(prev => [s, ...prev]); 
              }} 
              onUpdateAuditSession={handleUpdateAuditSession} 
              onGenerateDivergenceRequest={(sector, ids) => {
                handleAddRequest({ 
                  requesterId: currentUser.id, 
                  employeeId: activeEmployees.find(e => e.sector === sector)?.id || '', 
                  items: assets.filter(a => ids.includes(a.id)).map(a => a.type), 
                  type: 'Divergencia', 
                  observation: `Divergência Auditoria: ${sector}` 
                });
              }} 
            />;
          case 'maintenance': 
            return <MaintenanceManager 
              assets={assets} employees={activeEmployees} companies={departments} 
              currentUser={currentUser}
              onUpdateAsset={handleUpdateAsset} 
              onAddNotification={addNotification}
              onAddRequest={handleAddRequest}
            />;
          case 'purchase-orders': return <PurchaseOrderManager requests={requests} employees={activeEmployees} onUpdateRequest={handleUpdateRequest} onAssetCreated={handleAddAsset} onAddRequest={handleAddRequest} assetTypeConfigs={assetTypeConfigs} />;
          case 'printing': return <PrintManager assets={assets} />;
          case 'user-management': 
            return <UserManager 
              users={users} employees={activeEmployees}
              onAddUser={async (u) => { 
                const newU = { ...u, id: `USR-${Math.floor(Math.random() * 9000) + 1000}` }; 
                await db.users.upsert(newU); 
                setUsers(prev => [...prev, newU]); 
              }} 
              onUpdateUser={async (u) => { await db.users.upsert(u); setUsers(prev => prev.map(old => old.id === u.id ? u : old)); }} 
              onRemoveUser={async (id) => { await db.users.remove(id); setUsers(prev => prev.filter(u => u.id !== id)); }} 
            />;
          case 'accounting':
            return <AccountingManager 
              accounts={accountingAccounts}
              classifications={accountingClassifications}
              assetTypes={assetTypeConfigs}
              onAddAccount={async (a) => { const newA = {...a, id: `ACC-${Date.now()}`}; await db.accountingAccounts.upsert(newA); setAccountingAccounts(prev => [...prev, newA]); }}
              onUpdateAccount={async (a) => { await db.accountingAccounts.upsert(a); setAccountingAccounts(prev => prev.map(old => old.id === a.id ? a : old)); }}
              onRemoveAccount={async (id) => { await db.accountingAccounts.remove(id); setAccountingAccounts(prev => prev.filter(a => a.id !== id)); }}
              onAddClassification={async (c) => { const newC = {...c, id: `CLS-${Date.now()}`}; await db.accountingClassifications.upsert(newC); setAccountingClassifications(prev => [...prev, newC]); }}
              onUpdateClassification={async (c) => { await db.accountingClassifications.upsert(c); setAccountingClassifications(prev => prev.map(old => old.id === c.id ? c : old)); }}
              onRemoveClassification={async (id) => { await db.accountingClassifications.remove(id); setAccountingClassifications(prev => prev.filter(c => c.id !== id)); }}
              onAddAssetType={async (t) => { const newT = {...t, id: `TYPE-${Date.now()}`}; await db.assetTypeConfigs.upsert(newT); setAssetTypeConfigs(prev => [...prev, newT]); }}
              onUpdateAssetType={async (t) => { await db.assetTypeConfigs.upsert(t); setAssetTypeConfigs(prev => prev.map(old => old.id === t.id ? t : old)); }}
              onRemoveAssetType={async (id) => { await db.assetTypeConfigs.remove(id); setAssetTypeConfigs(prev => prev.filter(t => t.id !== id)); }}
            />;
          default: return <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Módulo em Desenvolvimento</div>;
        }
      })()}
    </Layout>
  );
};

export default App;
