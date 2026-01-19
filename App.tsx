
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
import { MOCK_USERS } from './constants';
import { Asset, Employee, EquipmentRequest, UserAccount, Department, AuditSession, HistoryEntry } from './types';
import { db } from './services/supabase';
import { Loader2, AlertCircle, Package } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<EquipmentRequest[]>([]);
  const [auditSessions, setAuditSessions] = useState<AuditSession[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);

  // Carregamento inicial do Supabase
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [depts, assts, emps, reqs, audits, userList] = await Promise.all([
          db.departments.list().catch(() => []),
          db.assets.list().catch(() => []),
          db.employees.list().catch(() => []),
          db.requests.list().catch(() => []),
          db.auditSessions.list().catch(() => []),
          db.users.list().catch(() => [])
        ]);

        setDepartments(depts);
        setAssets(assts);
        setEmployees(emps);
        setRequests(reqs);
        setAuditSessions(audits);
        
        // Se o banco estiver vazio, garantimos que exista ao menos o admin do mock para o primeiro login
        if (userList.length === 0) {
          setUsers(MOCK_USERS);
        } else {
          setUsers(userList);
        }
      } catch (err) {
        setError("Erro ao conectar com o banco de dados Supabase.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogin = async (user: UserAccount) => {
    // Se o usuário logado for o admin mock e não estiver no banco, tentamos salvar ele
    const userExists = users.some(u => u.id === user.id);
    if (!userExists || user.id === '1') {
      try {
        await db.users.upsert(user);
      } catch (e) {
        console.warn("Não foi possível persistir o usuário inicial no banco ainda.");
      }
    }
    
    setCurrentUser(user);
    setIsAuthenticated(true);
    if (user.modules.length > 0) setActiveTab(user.modules[0]);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // HANDLERS DE PERSISTÊNCIA (ASSETS)
  const handleAddAsset = async (assetData: any) => {
    const id = assetData.id || `AST-${Math.floor(Math.random() * 9000) + 1000}`;
    const initialHistory: HistoryEntry[] = assetData.history || [
      {
        id: Math.random().toString(),
        date: new Date().toISOString(),
        type: 'Criação',
        description: 'Ativo registrado no inventário.',
        performedBy: currentUser?.name || 'Sistema'
      }
    ];

    const newAsset: Asset = { 
      ...assetData, 
      id, 
      qrCode: `QR-${id}`,
      createdAt: new Date().toISOString(),
      history: initialHistory,
      observations: assetData.observations || ''
    };

    setAssets(prev => [newAsset, ...prev]);
    await db.assets.upsert(newAsset);
  };

  const handleUpdateAsset = async (updated: Asset) => {
    setAssets(prev => prev.map(a => a.id === updated.id ? updated : a));
    await db.assets.upsert(updated);
  };

  const handleRemoveAsset = async (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    await db.assets.remove(id);
  };

  // HANDLERS DE PERSISTÊNCIA (REQUESTS)
  const handleAddRequest = async (reqData: any) => {
    const id = `REQ-${Math.floor(Math.random() * 9000) + 1000}`;
    const newReq: EquipmentRequest = { 
      ...reqData, 
      id, 
      status: 'Pendente',
      createdAt: new Date().toISOString()
    };
    setRequests(prev => [newReq, ...prev]);
    await db.requests.upsert(newReq);
  };

  const handleUpdateRequest = async (req: EquipmentRequest) => {
    setRequests(prev => prev.map(r => r.id === req.id ? req : r));
    await db.requests.upsert(req);
  };

  const handleUpdateAuditSession = async (session: AuditSession) => {
    setAuditSessions(prev => prev.map(old => old.id === session.id ? session : old));
    await db.auditSessions.upsert(session);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl animate-pulse mb-4">
            <Package className="text-white w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">AssetTrack Pro</h1>
        </div>
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Sincronizando com Supabase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h3 className="text-xl font-black text-slate-800 mb-2">Falha Crítica</h3>
        <p className="text-slate-500 max-w-sm mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest">Tentar Reconectar</button>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) return <Auth onLogin={handleLogin} users={users} />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} requests={requests}>
      {(() => {
        switch (activeTab) {
          case 'dashboard': 
            return <Dashboard assets={assets} requests={requests} employees={employees} />;
          
          case 'departments': 
            return <CompanyManager 
              companies={departments} 
              assets={assets} 
              onAddCompany={async (d) => { 
                const newD = {...d, id: `DEPT-${Date.now()}`, createdAt: new Date().toISOString()}; 
                setDepartments(prev => [...prev, newD]); 
                await db.departments.upsert(newD); 
              }} 
              onUpdateCompany={async (updated) => { 
                setDepartments(prev => prev.map(d => d.id === updated.id ? updated : d)); 
                await db.departments.upsert(updated); 
              }} 
              onRemoveCompany={async (id) => { 
                setDepartments(prev => prev.filter(d => d.id !== id)); 
                await db.departments.remove(id); 
              }} 
            />;
          
          case 'assets': 
            return <AssetManager 
              assets={assets} 
              employees={employees} 
              companies={departments} 
              onAdd={handleAddAsset} 
              onUpdate={handleUpdateAsset} 
              onRemove={handleRemoveAsset} 
            />;
          
          case 'employees': 
            return <EmployeeManager 
              employees={employees} 
              departments={departments} 
              onAdd={async (e) => { 
                const newE = {...e, id: `EMP-${Date.now()}`}; 
                setEmployees(prev => [...prev, newE]); 
                await db.employees.upsert(newE); 
              }} 
            />;
          
          case 'requests': 
            return <RequestsManager 
              requests={requests} 
              employees={employees} 
              assets={assets} 
              onAddRequest={handleAddRequest} 
              onUpdateRequest={handleUpdateRequest} 
              onUpdateStatus={async (id, status) => { 
                const req = requests.find(r => r.id === id); 
                if(req) handleUpdateRequest({...req, status}); 
              }} 
            />;
          
          case 'inventory-check': 
            return <InventoryCheckManager 
              assets={assets} 
              employees={employees} 
              auditSessions={auditSessions} 
              onAddAuditSession={async (s) => { 
                setAuditSessions(prev => [s, ...prev]); 
                await db.auditSessions.upsert(s); 
              }} 
              onUpdateAuditSession={handleUpdateAuditSession} 
              onGenerateDivergenceRequest={(sector, assetIds) => 
                handleAddRequest({ 
                  requesterId: currentUser?.id, 
                  employeeId: employees.find(e => e.sector === sector)?.id || '', 
                  items: assets.filter(a => assetIds.includes(a.id)).map(a => a.type), 
                  type: 'Divergencia', 
                  observation: `Divergência de auditoria no setor ${sector}` 
                })
              } 
            />;
          
          case 'maintenance': 
            return <MaintenanceManager 
              assets={assets} 
              employees={employees} 
              companies={departments} 
              onUpdateAsset={handleUpdateAsset} 
            />;
          
          case 'purchase-orders': 
            return <PurchaseOrderManager 
              requests={requests} 
              employees={employees} 
              onUpdateRequest={handleUpdateRequest} 
              onAssetCreated={handleAddAsset} 
            />;
          
          case 'printing': 
            return <PrintManager assets={assets} />;
          
          case 'user-management': 
            return <UserManager 
              users={users} 
              onAddUser={async (u) => { 
                const newU = {...u, id: Date.now().toString()}; 
                setUsers(prev => [...prev, newU]); 
                await db.users.upsert(newU); 
              }} 
              onUpdateUser={async (u) => { 
                setUsers(prev => prev.map(old => old.id === u.id ? u : old)); 
                await db.users.upsert(u); 
              }} 
              onRemoveUser={async (id) => { 
                setUsers(prev => prev.filter(u => u.id !== id)); 
                await db.users.remove(id); 
              }} 
            />;
          
          default: 
            return <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Módulo em Desenvolvimento</div>;
        }
      })()}
    </Layout>
  );
};

export default App;
