
export type AssetType = string;

export type AssetStatus = 'Disponível' | 'Em Uso' | 'Manutenção' | 'Baixado' | 'Pendente Documentos';

export interface HistoryEntry {
  id: string;
  date: string;
  type: 'Manutenção' | 'Atribuição' | 'Status' | 'Criação' | 'Observação';
  description: string;
  performedBy?: string;
  userContext?: string; 
}

export interface Department {
  id: string;
  name: string;
  costCenter?: string;
  createdAt: string;
}

// Nova Interface para Dados da Empresa
export interface LegalEntity {
  id: string;
  socialReason: string; // Razão Social
  cnpj: string;
  address: string;
}

// Configurações Globais do Sistema (DB)
export interface SystemConfig {
  key: string;
  value: string;
}

// Estrutura Unificada
export interface AccountingAccount {
  id: string;
  code: string; // Número da Conta
  name: string; // Classificação Contábil
  costCenter?: string;
  type?: 'Ativo' | 'Despesa' | 'Custo' | 'Outros';
}

export interface AssetTypeConfig {
  id: string;
  name: string;
  accountId?: string; // Vínculo direto com a conta
}

export interface Asset {
  id: string;
  tagId?: string; // Novo campo: Etiqueta patrimonial física
  serialNumber?: string;
  departmentId: string;
  type: AssetType;
  brand: string;
  model: string;
  ram?: string;
  storage?: string;
  processor?: string;
  screenSize?: string;
  caseModel?: string; 
  isWireless?: boolean; 
  monitorInputs?: string[]; 
  isAbnt?: boolean; 
  hasNumericKeypad?: boolean; 
  observations: string;
  photos: string[];
  status: AssetStatus;
  assignedTo?: string; 
  qrCode: string;
  createdAt: string;
  history: HistoryEntry[]; 
  purchaseValue?: number; // Novo campo para valor de aquisição
}

export interface Employee {
  id: string;
  departmentId: string;
  name: string;
  sector: string;
  role: string;
  cpf: string;
  isActive?: boolean;
  legalEntityId?: string; // Vínculo com a empresa/filial
}

export type AppModule = 
  | 'dashboard' 
  | 'departments'
  | 'assets' 
  | 'employees' 
  | 'requests' 
  | 'purchase-orders' 
  | 'printing' 
  | 'user-management' 
  | 'inventory-check'
  | 'maintenance'
  | 'accounting'
  | 'system-info';

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  password?: string;
  sector: string;
  modules: AppModule[];
  employeeId?: string;
  // Segregação de Funções Financeiras
  canApprovePurchase?: boolean; // Permissão nível Diretoria (Autorizar Pedido)
  canExecutePurchase?: boolean; // Permissão nível Financeiro (Realizar Pagamento)
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'maintenance' | 'delivery' | 'alert';
  createdAt: string;
  targetModule?: AppModule;
  isRead?: boolean;
}

export interface Quotation {
  url: string;
  price?: number;
  deliveryPrediction: string;
}

export interface ItemFulfillment {
  type: AssetType;
  linkedAssetId?: string;
  isPurchaseOrder: boolean;
  purchaseStatus?: 'Pendente' | 'Cotação Aprovada' | 'Pedido Autorizado' | 'Comprado' | 'Reprovado';
  quotations?: Quotation[];
  approvedQuotationIndex?: number;
  deliveryForecastDate?: string;
  isDelivered?: boolean;
}

export interface EquipmentRequest {
  id: string;
  requesterId: string;
  employeeId?: string | null; // Alterado para permitir nulo/undefined
  items: AssetType[];
  itemFulfillments?: ItemFulfillment[];
  observation?: string;
  status: 'Pendente' | 'Aprovado' | 'Preparando' | 'Entregue' | 'Cancelado' | 'Confronto';
  createdAt: string;
  type?: 'Padrao' | 'Divergencia';
}

export type AuditStatus = 'Bom' | 'Regular' | 'Ruim' | 'Não Encontrado';

export interface AuditEntry {
  assetId: string;
  status: AuditStatus;
  checkedAt: string;
  observation?: string;
}

export interface AuditSession {
  id: string;
  sector: string;
  createdAt: string;
  entries: AuditEntry[];
  isFinished: boolean;
  generatedRequestId?: string;
}

// Configurações de Integração (Legado/Local)
export interface SystemIntegrationConfig {
  telegramBotToken?: string;
  telegramChatId?: string;
  companyLogo?: string; // Base64 string do logo
}
