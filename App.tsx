
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AssetManager from './components/AssetManager';
import EmployeeManager from './components/EmployeeManager';
import RequestsManager from './components/RequestsManager';
import PrintManager from './components/PrintManager';
import PurchaseOrderManager from './components/PurchaseOrderManager';
import UserManager from './components/UserManager';
import InventoryCheckManager from './components/InventoryCheckManager';
import CompanyManager from './components/CompanyManager';
import MaintenanceManager from './components/MaintenanceManager';
import Auth from './components/Auth';
import { MOCK_ASSETS, MOCK_EMPLOYEES, MOCK_USERS, MOCK_COMPANIES } from './constants';
import { Asset, Employee, EquipmentRequest, UserAccount, AppModule, AuditSession, Company } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES);
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [users, setUsers] = useState<UserAccount[]>(MOCK_USERS);
  const [auditSessions, setAuditSessions] = useState<AuditSession[]>([]);
  
  const [requests, setRequests] = useState<EquipmentRequest[]>([
    {
      id: 'REQ-1',
      requesterId: '2',
      employeeId: '1',
      items: ['Notebook', 'Mouse', 'Monitor'],
      itemFulfillments: [
        { type: 'Notebook', isPurchaseOrder: true, purchaseStatus: 'Pendente' },
        { type: 'Mouse', isPurchaseOrder: false },
        { type: 'Monitor', isPurchaseOrder: false }
      ],
      status: 'Pendente',
      createdAt: '2024-03-20',
      observation: 'Colaborador novo iniciando na próxima segunda-feira. Necessita de setup completo.'
    }
  ]);

  useEffect(() => {
    if (currentUser && !currentUser.modules.includes(activeTab as AppModule)) {
      if (currentUser.modules.length > 0) {
        setActiveTab(currentUser.modules[0]);
      }
    }
  }, [currentUser, activeTab]);

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

  const handleAddCompany = (compData: Omit<Company, 'id' | 'createdAt'>) => {
    const newCompany: Company = {
      ...compData,
      id: `COMP-${Math.floor(Math.random() * 10000)}`,
      createdAt: new Date().toLocaleDateString('pt-BR')
    };
    setCompanies([...companies, newCompany]);
  };

  const handleUpdateCompany = (updatedCompany: Company) => {
    setCompanies(companies.map(c => c.id === updatedCompany.id ? updatedCompany : c));
  };

  const handleAddAsset = (assetData: Omit<Asset, 'id' | 'createdAt' | 'qrCode'>) => {
    const newAsset: Asset = {
      ...assetData,
      id: `AST-${Math.floor(Math.random() * 10000)}`,
      createdAt: new Date().toLocaleDateString('pt-BR'),
      qrCode: `QR-${Math.random().toString(36).substr(2, 9)}`,
    };
    setAssets([newAsset, ...assets]);
  };

  const handleAssetCreatedFromPurchase = (assetData: Omit<Asset, 'createdAt' | 'qrCode'>) => {
    const newAsset: Asset = {
      ...assetData,
      createdAt: new Date().toLocaleDateString('pt-BR'),
      qrCode: `QR-${assetData.id}`,
    };
    setAssets([newAsset, ...assets]);
  };

  const handleUpdateAsset = (updatedAsset: Asset) => {
    setAssets(assets.map(a => a.id === updatedAsset.id ? updatedAsset : a));
  };

  const handleAddEmployee = (empData: Omit<Employee, 'id'>) => {
    const newEmp: Employee = { ...empData, id: String(employees.length + 1) };
    setEmployees([newEmp, ...employees]);
  };

  const handleAddRequest = (reqData: Omit<EquipmentRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReq: EquipmentRequest = {
      ...reqData,
      id: `REQ-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      status: 'Pendente',
      createdAt: new Date().toLocaleDateString('pt-BR'),
      itemFulfillments: reqData.items.map(type => ({ type, isPurchaseOrder: false }))
    };
    setRequests([newReq, ...requests]);
  };

  const handleUpdateStatus = (id: string, status: EquipmentRequest['status']) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status } : r));
  };

  const handleUpdateRequest = (updatedReq: EquipmentRequest) => {
    setRequests(requests.map(r => r.id === updatedReq.id ? updatedReq : r));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard assets={assets} requests={requests} employees={employees} />;
      case 'companies':
        return (
          <CompanyManager 
            companies={companies} 
            assets={assets}
            onAddCompany={handleAddCompany}
            onUpdateCompany={handleUpdateCompany}
            onRemoveCompany={(id) => setCompanies(companies.filter(c => c.id !== id))}
          />
        );
      case 'assets':
        return (
          <AssetManager 
            assets={assets} 
            employees={employees}
            companies={companies}
            onAdd={handleAddAsset} 
            onUpdate={handleUpdateAsset}
            onRemove={(id) => setAssets(assets.filter(a => a.id !== id))} 
          />
        );
      case 'maintenance':
        return (
          <MaintenanceManager 
            assets={assets}
            employees={employees}
            companies={companies}
            onUpdateAsset={handleUpdateAsset}
          />
        );
      case 'employees':
        return <EmployeeManager employees={employees} onAdd={handleAddEmployee} />;
      case 'requests':
        return (
          <RequestsManager 
            requests={requests} 
            employees={employees} 
            assets={assets}
            onAddRequest={handleAddRequest} 
            onUpdateStatus={handleUpdateStatus}
            onUpdateRequest={handleUpdateRequest}
          />
        );
      case 'purchase-orders':
        return (
          <PurchaseOrderManager 
            requests={requests} 
            employees={employees}
            onUpdateRequest={handleUpdateRequest}
            onAssetCreated={handleAssetCreatedFromPurchase}
          />
        );
      case 'printing':
        return <PrintManager assets={assets} />;
      case 'user-management':
        return (
          <UserManager 
            users={users} 
            onAddUser={(u) => setUsers([...users, {...u, id: String(Date.now())}])}
            onUpdateUser={(u) => setUsers(users.map(old => old.id === u.id ? u : old))}
            onRemoveUser={(id) => setUsers(users.filter(u => u.id !== id))}
          />
        );
      case 'inventory-check':
        return (
          <InventoryCheckManager 
            assets={assets}
            employees={employees}
            auditSessions={auditSessions}
            onAddAuditSession={(s) => setAuditSessions([...auditSessions, s])}
            onUpdateAuditSession={(s) => setAuditSessions(auditSessions.map(old => old.id === s.id ? s : old))}
            onGenerateDivergenceRequest={() => {}} 
          />
        );
      default:
        return <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Módulo em Desenvolvimento</div>;
    }
  };

  if (!isAuthenticated || !currentUser) {
    return <Auth onLogin={handleLogin} users={users} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      currentUser={currentUser}
      onLogout={handleLogout}
      requests={requests}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
