
export type AssetType = 
  | 'Desktop' 
  | 'Notebook' 
  | 'Mouse' 
  | 'Cabo' 
  | 'Monitor' 
  | 'Teclado' 
  | 'Headset' 
  | 'Suporte Notebook';

export type AssetStatus = 'Disponível' | 'Em Uso' | 'Manutenção' | 'Baixado' | 'Pendente Documentos';

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  createdAt: string;
}

export interface Asset {
  id: string;
  companyId: string; // Vínculo com a empresa
  type: AssetType;
  brand: string;
  model: string;
  ram?: string;
  storage?: string;
  processor?: string;
  screenSize?: string;
  observations: string;
  photos: string[];
  status: AssetStatus;
  assignedTo?: string; // Employee ID
  qrCode: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  companyId: string; // Vínculo com a empresa
  name: string;
  sector: string;
  role: string;
  cpf: string;
}

export type AppModule = 
  | 'dashboard' 
  | 'companies'
  | 'assets' 
  | 'employees' 
  | 'requests' 
  | 'purchase-orders' 
  | 'printing' 
  | 'user-management' 
  | 'inventory-check'
  | 'maintenance';

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  password?: string;
  sector: string;
  modules: AppModule[];
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
  purchaseStatus?: 'Pendente' | 'Cotação Aprovada' | 'Pedido Autorizado' | 'Comprado';
  quotations?: Quotation[];
  approvedQuotationIndex?: number;
  deliveryForecastDate?: string;
  isDelivered?: boolean;
}

export interface EquipmentRequest {
  id: string;
  requesterId: string;
  employeeId: string;
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
