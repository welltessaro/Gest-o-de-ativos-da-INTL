
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
import Auth from './components/Auth';
import { MOCK_USERS, MOCK_ASSETS, MOCK_COMPANIES, MOCK_EMPLOYEES } from './constants';
import { Asset, Employee, EquipmentRequest, UserAccount, Company, AuditSession } from './types';
import { db, isSupabaseConfigured } from './services/supabase';
import { Cloud, CloudOff } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  
  const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES);
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [requests, setRequests] = useState<EquipmentRequest[]>([]);
  const [auditSessions, setAuditSessions] = useState<AuditSession[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated || !isSupabaseConfigured) return;
      
      try {
        setIsLoading(true);
        const [a, c, e, r, s] = await Promise.all([
          db.assets.fetch(),
          db.companies.fetch(),
          db.employees.fetch(),
          db.requests.fetch(),
          db.auditSessions.fetch()
        ]);
        
        if (c.length > 0) setCompanies(c);
        if (a.length > 0) setAssets(a);
        if (e.length > 0) setEmployees(e);
        if (r.length > 0) setRequests(r);
        if (s.length > 0) setAuditSessions(s);
      } catch (err) {
        console.warn("Falha na sincronização Cloud. Usando dados locais.", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    if (user.modules.length > 0) setActiveTab(user.modules[0]);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleAddAsset = async (assetData: any) => {
    const id = assetData.id || `AST-${Math.floor(Math.random() * 9000) + 1000}`;
    const newAsset = { ...assetData, id, qrCode: `QR-${id}` };
    
    if (isSupabaseConfigured) {
      try {
        const saved = await db.assets.insert(newAsset);
        setAssets([saved, ...assets]);
      } catch (e) { alert("Erro ao salvar no banco."); }
    } else {
      setAssets([{ ...newAsset, createdAt: new Date().toISOString() } as Asset, ...assets]);
    }
  };

  const handleUpdateAsset = async (updated: Asset) => {
    if (isSupabaseConfigured) {
      try {
        const saved = await db.assets.update(updated.id, updated);
        setAssets(assets.map(a => a.id === updated.id ? saved : a));
      } catch (e) { alert("Erro ao atualizar no banco."); }
    } else {
      setAssets(assets.map(a => a.id === updated.id ? updated : a));
    }
  };

  const handleAddRequest = async (reqData: any) => {
    const id = `REQ-${Math.floor(Math.random() * 9000) + 1000}`;
    const newReq = { ...reqData, id, status: 'Pendente' };
    
    if (isSupabaseConfigured) {
      try {
        const saved = await db.requests.insert(newReq);
        setRequests([saved, ...requests]);
      } catch (e) { alert("Erro ao criar requisição."); }
    } else {
      setRequests([{ ...newReq, createdAt: new Date().toISOString() } as EquipmentRequest, ...requests]);
    }
  };

  const handleUpdateRequest = async (req: EquipmentRequest) => {
    if (isSupabaseConfigured) {
      try {
        const saved = await db.requests.update(req);
        setRequests(requests.map(r => r.id === req.id ? saved : r));
      } catch (e) { alert("Erro ao atualizar requisição."); }
    } else {
      setRequests(requests.map(r => r.id === req.id ? req : r));
    }
  };

  const renderContent = () => {
    if (isLoading) return (
      <div className="flex flex-col items-center justify-center p-20">
         <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
         <p className="mt-4 text-blue-600 font-bold uppercase tracking-widest text-xs">Sincronizando Cloud...</p>
      </div>
    );

    switch (activeTab) {
      case 'dashboard': return <Dashboard assets={assets} requests={requests} employees={employees} />;
      case 'companies': return <CompanyManager companies={companies} assets={assets} onAddCompany={async (c) => { if(isSupabaseConfigured) { const s = await db.companies.insert(c); setCompanies([...companies, s]); } else setCompanies([...companies, {...c, id: Math.random().toString(), createdAt: ''}])}} onUpdateCompany={()=>{}} onRemoveCompany={()=>{}} />;
      case 'assets': return <AssetManager assets={assets} employees={employees} companies={companies} onAdd={handleAddAsset} onUpdate={handleUpdateAsset} onRemove={async (id) => { if(isSupabaseConfigured) await db.assets.delete(id); setAssets(assets.filter(a => a.id !== id)); }} />;
      case 'employees': return <EmployeeManager employees={employees} onAdd={async (e) => { if(isSupabaseConfigured) { const s = await db.employees.insert(e); setEmployees([...employees, s]); } else setEmployees([...employees, {...e, id: Math.random().toString()}])}} />;
      case 'requests': return <RequestsManager requests={requests} employees={employees} assets={assets} onAddRequest={handleAddRequest} onUpdateRequest={handleUpdateRequest} onUpdateStatus={(id, status) => { const req = requests.find(r => r.id === id); if(req) handleUpdateRequest({...req, status}); }} />;
      case 'inventory-check': return <InventoryCheckManager assets={assets} employees={employees} auditSessions={auditSessions} onAddAuditSession={async (s) => { if(isSupabaseConfigured) { const saved = await db.auditSessions.insert(s); setAuditSessions([saved, ...auditSessions]); } else setAuditSessions([s, ...auditSessions]); }} onUpdateAuditSession={async (s) => { if(isSupabaseConfigured) { const saved = await db.auditSessions.update(s); setAuditSessions(auditSessions.map(old => old.id === s.id ? saved : old)); } else setAuditSessions(auditSessions.map(old => old.id === s.id ? s : old)); }} onGenerateDivergenceRequest={(sector, assetIds) => handleAddRequest({ requesterId: currentUser?.id, employeeId: employees.find(e => e.sector === sector)?.id || '', items: assets.filter(a => assetIds.includes(a.id)).map(a => a.type), type: 'Divergencia', observation: `Divergência de auditoria no setor ${sector}` })} />;
      case 'maintenance': return <MaintenanceManager assets={assets} employees={employees} companies={companies} onUpdateAsset={handleUpdateAsset} />;
      case 'purchase-orders': return <PurchaseOrderManager requests={requests} employees={employees} onUpdateRequest={handleUpdateRequest} onAssetCreated={handleAddAsset} />;
      case 'printing': return <PrintManager assets={assets} />;
      case 'user-management': return <UserManager users={MOCK_USERS} onAddUser={()=>{}} onUpdateUser={()=>{}} onRemoveUser={()=>{}} />;
      default: return <div className="p-20 text-center text-slate-400 font-bold uppercase">Módulo Cloud</div>;
    }
  };

  if (!isAuthenticated || !currentUser) return <Auth onLogin={handleLogin} users={MOCK_USERS} />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} requests={requests}>
      <div className="mb-4 flex items-center gap-2">
        {isSupabaseConfigured ? (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            <Cloud className="w-3 h-3" /> Cloud Conectado
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
            <CloudOff className="w-3 h-3" /> Modo Offline (Local)
          </div>
        )}
      </div>
      {renderContent()}
    </Layout>
  );
};

export default App;
