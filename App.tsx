
import React, { useState } from 'react';
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

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES);
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [requests, setRequests] = useState<EquipmentRequest[]>([]);
  const [auditSessions, setAuditSessions] = useState<AuditSession[]>([]);

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

  const handleAddAsset = (assetData: any) => {
    const id = assetData.id || `AST-${Math.floor(Math.random() * 9000) + 1000}`;
    const newAsset: Asset = { 
      ...assetData, 
      id, 
      qrCode: `QR-${id}`,
      createdAt: new Date().toISOString()
    };
    setAssets([newAsset, ...assets]);
  };

  const handleUpdateAsset = (updated: Asset) => {
    setAssets(assets.map(a => a.id === updated.id ? updated : a));
  };

  const handleRemoveAsset = (id: string) => {
    setAssets(assets.filter(a => a.id !== id));
  };

  const handleAddRequest = (reqData: any) => {
    const id = `REQ-${Math.floor(Math.random() * 9000) + 1000}`;
    const newReq: EquipmentRequest = { 
      ...reqData, 
      id, 
      status: 'Pendente',
      createdAt: new Date().toISOString()
    };
    setRequests([newReq, ...requests]);
  };

  const handleUpdateRequest = (req: EquipmentRequest) => {
    setRequests(requests.map(r => r.id === req.id ? req : r));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard assets={assets} requests={requests} employees={employees} />;
      case 'companies': return <CompanyManager companies={companies} assets={assets} onAddCompany={(c) => setCompanies([...companies, {...c, id: `COMP-${Date.now()}`, createdAt: new Date().toISOString()}])} onUpdateCompany={(updated) => setCompanies(companies.map(c => c.id === updated.id ? updated : c))} onRemoveCompany={(id) => setCompanies(companies.filter(c => c.id !== id))} />;
      case 'assets': return <AssetManager assets={assets} employees={employees} companies={companies} onAdd={handleAddAsset} onUpdate={handleUpdateAsset} onRemove={handleRemoveAsset} />;
      case 'employees': return <EmployeeManager employees={employees} onAdd={(e) => setEmployees([...employees, {...e, id: `EMP-${Date.now()}`}])} />;
      case 'requests': return <RequestsManager requests={requests} employees={employees} assets={assets} onAddRequest={handleAddRequest} onUpdateRequest={handleUpdateRequest} onUpdateStatus={(id, status) => { const req = requests.find(r => r.id === id); if(req) handleUpdateRequest({...req, status}); }} />;
      case 'inventory-check': return <InventoryCheckManager assets={assets} employees={employees} auditSessions={auditSessions} onAddAuditSession={(s) => setAuditSessions([s, ...auditSessions])} onUpdateAuditSession={(s) => setAuditSessions(auditSessions.map(old => old.id === s.id ? s : old))} onGenerateDivergenceRequest={(sector, assetIds) => handleAddRequest({ requesterId: currentUser?.id, employeeId: employees.find(e => e.sector === sector)?.id || '', items: assets.filter(a => assetIds.includes(a.id)).map(a => a.type), type: 'Divergencia', observation: `Divergência de auditoria no setor ${sector}` })} />;
      case 'maintenance': return <MaintenanceManager assets={assets} employees={employees} companies={companies} onUpdateAsset={handleUpdateAsset} />;
      case 'purchase-orders': return <PurchaseOrderManager requests={requests} employees={employees} onUpdateRequest={handleUpdateRequest} onAssetCreated={handleAddAsset} />;
      case 'printing': return <PrintManager assets={assets} />;
      case 'user-management': return <UserManager users={MOCK_USERS} onAddUser={()=>{}} onUpdateUser={()=>{}} onRemoveUser={()=>{}} />;
      default: return <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Módulo em Desenvolvimento</div>;
    }
  };

  if (!isAuthenticated || !currentUser) return <Auth onLogin={handleLogin} users={MOCK_USERS} />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} requests={requests}>
      {renderContent()}
    </Layout>
  );
};

export default App;
