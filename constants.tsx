
import { Asset, Employee, UserAccount, AppModule, Department } from './types';

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'DEPT-1', name: 'Tecnologia da Informação', costCenter: '1001-TI', createdAt: '01/01/2023' },
  { id: 'DEPT-2', name: 'Recursos Humanos', costCenter: '2002-RH', createdAt: '15/03/2023' },
  { id: 'DEPT-3', name: 'Comercial e Vendas', costCenter: '3003-COM', createdAt: '10/10/2023' },
];

export const MOCK_EMPLOYEES: Employee[] = [
  { id: '1', departmentId: 'DEPT-3', name: 'João Silva', sector: 'Vendas', role: 'Vendedor Senior', cpf: '123.456.789-00' },
  { id: '2', departmentId: 'DEPT-1', name: 'Maria Santos', sector: 'TI', role: 'Desenvolvedora', cpf: '987.654.321-11' },
  { id: '3', departmentId: 'DEPT-2', name: 'Carlos Lima', sector: 'RH', role: 'Analista de RH', cpf: '456.123.789-22' },
];

export const ALL_MODULES: { id: AppModule; label: string }[] = [
  { id: 'dashboard', label: 'Diretoria - Dashboard' },
  { id: 'departments', label: 'Gestão de Departamentos' },
  { id: 'assets', label: 'Inventário de Ativos' },
  { id: 'maintenance', label: 'Centro de Manutenção' },
  { id: 'employees', label: 'Colaboradores (RH)' },
  { id: 'requests', label: 'Requisições' },
  { id: 'purchase-orders', label: 'Pedidos de Compra' },
  { id: 'printing', label: 'Gerenciamento de Impressões' },
  { id: 'user-management', label: 'Gestão de Usuários' },
  { id: 'inventory-check', label: 'Check semestral' },
];

export const MOCK_USERS: UserAccount[] = [
  { 
    id: '1', 
    name: 'Administrador Master', 
    username: 'admin', 
    sector: 'TI',
    modules: ['dashboard', 'departments', 'assets', 'maintenance', 'employees', 'requests', 'purchase-orders', 'printing', 'user-management', 'inventory-check'] 
  },
  { 
    id: '2', 
    name: 'Diretor de Operações', 
    username: 'diretoria', 
    sector: 'Board',
    modules: ['dashboard', 'purchase-orders']
  },
];

export const MOCK_ASSETS: Asset[] = [
  {
    id: 'AST-001',
    departmentId: 'DEPT-1',
    type: 'Notebook',
    brand: 'Dell',
    model: 'Latitude 5420',
    ram: '16GB',
    storage: '512GB SSD',
    processor: 'Intel i7',
    screenSize: '14"',
    observations: 'Nenhuma marca de uso aparente.',
    photos: ['https://picsum.photos/400/300?random=1'],
    status: 'Em Uso',
    assignedTo: '1',
    qrCode: 'AST-001-QR',
    createdAt: '2023-10-01',
    // Fix: Adding missing history property required by Asset interface
    history: []
  },
  {
    id: 'AST-002',
    departmentId: 'DEPT-2',
    type: 'Monitor',
    brand: 'LG',
    model: 'UltraWide 29"',
    observations: 'Pequeno risco na base.',
    photos: ['https://picsum.photos/400/300?random=2'],
    status: 'Disponível',
    qrCode: 'AST-002-QR',
    createdAt: '2023-11-15',
    // Fix: Adding missing history property required by Asset interface
    history: []
  }
];

export const ASSET_TYPES = [
  'Desktop', 'Notebook', 'Mouse', 'Cabo', 'Monitor', 'Teclado', 'Headset', 'Suporte Notebook'
];
