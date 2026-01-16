
import { Asset, Employee, UserAccount, AppModule, Company } from './types';

export const MOCK_COMPANIES: Company[] = [
  { id: 'COMP-1', name: 'Matriz São Paulo', cnpj: '12.345.678/0001-90', createdAt: '01/01/2023' },
  { id: 'COMP-2', name: 'Filial Curitiba', cnpj: '12.345.678/0002-88', createdAt: '15/03/2023' },
  { id: 'COMP-3', name: 'Tech Inova Serviços', cnpj: '99.888.777/0001-11', createdAt: '10/10/2023' },
];

export const MOCK_EMPLOYEES: Employee[] = [
  { id: '1', companyId: 'COMP-1', name: 'João Silva', sector: 'Vendas', role: 'Vendedor Senior', cpf: '123.456.789-00' },
  { id: '2', companyId: 'COMP-1', name: 'Maria Santos', sector: 'TI', role: 'Desenvolvedora', cpf: '987.654.321-11' },
  { id: '3', companyId: 'COMP-2', name: 'Carlos Lima', sector: 'RH', role: 'Analista de RH', cpf: '456.123.789-22' },
];

export const ALL_MODULES: { id: AppModule; label: string }[] = [
  { id: 'dashboard', label: 'Diretoria - Dashboard' },
  { id: 'companies', label: 'Empresas Clientes' },
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
    modules: ['dashboard', 'companies', 'assets', 'maintenance', 'employees', 'requests', 'purchase-orders', 'printing', 'user-management', 'inventory-check'] 
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
    companyId: 'COMP-1',
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
    createdAt: '2023-10-01'
  },
  {
    id: 'AST-002',
    companyId: 'COMP-2',
    type: 'Monitor',
    brand: 'LG',
    model: 'UltraWide 29"',
    observations: 'Pequeno risco na base.',
    photos: ['https://picsum.photos/400/300?random=2'],
    status: 'Disponível',
    qrCode: 'AST-002-QR',
    createdAt: '2023-11-15'
  }
];

export const ASSET_TYPES = [
  'Desktop', 'Notebook', 'Mouse', 'Cabo', 'Monitor', 'Teclado', 'Headset', 'Suporte Notebook'
];
