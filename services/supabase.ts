
import { createClient } from '@supabase/supabase-js';
import { 
  Asset, Department, Employee, EquipmentRequest, AuditSession, 
  UserAccount, AppNotification, AccountingAccount, 
  AssetTypeConfig, LegalEntity
} from '../types';

// Configuração da Conexão
const SUPABASE_URL = 'https://zcbphldaobriwkpqcupa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_5GUfPGtwRSMJHjNqocwqwA_GUm6U0PE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- SISTEMA DE CACHE LOCAL (FALLBACK OFFLINE) ---
// Utilizado quando a conexão com o Supabase falha ou para dados temporários
const localDB = {
  save: (key: string, data: any) => {
    try {
      localStorage.setItem(`assettrack_${key}`, JSON.stringify(data));
    } catch (e) { console.error('Erro ao salvar cache local', e); }
  },
  get: (key: string) => {
    try {
      const val = localStorage.getItem(`assettrack_${key}`);
      return val ? JSON.parse(val) : null;
    } catch (e) { return null; }
  }
};

// --- HELPER GENÉRICO DE BANCO DE DADOS ---
// Padroniza as operações de CRUD para evitar repetição de código
const createTableManager = <T extends { id: string }>(tableName: string, cacheKey: string) => ({
  list: async (): Promise<T[]> => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('id', { ascending: true }); // Ordenação padrão segura

      if (error) throw error;
      
      const safeData = data || [];
      localDB.save(cacheKey, safeData);
      return safeData as T[];
    } catch (err) {
      console.warn(`[Supabase] Erro ao listar ${tableName}, usando cache.`, err);
      return localDB.get(cacheKey) || [];
    }
  },

  upsert: async (item: T): Promise<void> => {
    try {
      // Remove campos undefined para evitar erros no JSON do Supabase
      const cleanPayload = JSON.parse(JSON.stringify(item));
      const { error } = await supabase.from(tableName).upsert(cleanPayload);
      if (error) throw error;
    } catch (err: any) {
      console.error(`[Supabase] Erro ao salvar em ${tableName}:`, err.message);
      throw err;
    }
  },

  remove: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      console.error(`[Supabase] Erro ao deletar de ${tableName}:`, err.message);
      throw err;
    }
  },

  // Novo método para limpar a tabela inteira
  clearAll: async (): Promise<void> => {
    try {
      // Deleta tudo onde id não é '0' (praticamente tudo)
      const { error } = await supabase.from(tableName).delete().neq('id', '0');
      if (error) throw error;
      // Limpa cache local também
      localStorage.removeItem(`assettrack_${cacheKey}`);
    } catch (err: any) {
      console.error(`[Supabase] Erro ao limpar tabela ${tableName}:`, err.message);
      throw err;
    }
  }
});

// --- IMPLEMENTAÇÃO ESPECÍFICA POR ENTIDADE ---

export const db = {
  // 1. ATIVOS
  assets: {
    ...createTableManager<Asset>('assets', 'assets'),
    // Override do list para garantir tratamento de campos específicos
    list: async (): Promise<Asset[]> => {
      try {
        const { data, error } = await supabase.from('assets').select('*').order('createdAt', { ascending: false });
        if (error) throw error;
        
        const assets = (data || []).map((a: any) => ({
          ...a,
          purchaseValue: Number(a.purchaseValue) || 0,
          tagId: a.tagId || a.id,
          photos: a.photos || [],
          monitorInputs: a.monitorInputs || [],
          history: a.history || []
        })) as Asset[];

        localDB.save('assets', assets);
        return assets;
      } catch (err) {
        return localDB.get('assets') || [];
      }
    }
  },

  // 2. DEPARTAMENTOS
  departments: createTableManager<Department>('departments', 'departments'),

  // 3. COLABORADORES
  employees: createTableManager<Employee>('employees', 'employees'),

  // 3.1 ENTIDADES LEGAIS (EMPRESAS)
  legalEntities: createTableManager<LegalEntity>('legal_entities', 'legal_entities'),

  // 4. REQUISIÇÕES
  requests: {
    ...createTableManager<EquipmentRequest>('requests', 'requests'),
    list: async (): Promise<EquipmentRequest[]> => {
      try {
        const { data, error } = await supabase.from('requests').select('*').order('createdAt', { ascending: false });
        if (error) throw error;
        const requests = (data || []).map((r: any) => ({
           ...r,
           items: r.items || [],
           itemFulfillments: r.itemFulfillments || []
        }));
        localDB.save('requests', requests);
        return requests;
      } catch (err) { return localDB.get('requests') || []; }
    }
  },

  // 5. USUÁRIOS E AUTENTICAÇÃO
  users: {
    ...createTableManager<UserAccount>('users', 'users'),
    getForAuth: async (username: string): Promise<UserAccount | null> => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username.toLowerCase().trim())
          .single();
        
        if (error || !data) return null;
        
        return {
          ...data,
          modules: data.modules || []
        } as UserAccount;
      } catch (err) { return null; }
    },
    // Override upsert para garantir username em lowercase
    upsert: async (user: UserAccount) => {
      const payload = {
        ...user,
        username: user.username.toLowerCase().trim(),
        modules: user.modules || []
      };
      const { error } = await supabase.from('users').upsert(payload);
      if (error) throw error;
    }
  },

  // 6. CONTABILIDADE (PLANO DE CONTAS)
  accountingAccounts: {
    ...createTableManager<AccountingAccount>('accounting_accounts', 'accounting_accounts'),
    list: async (): Promise<AccountingAccount[]> => {
      try {
        const { data, error } = await supabase.from('accounting_accounts').select('*').order('code', { ascending: true });
        if (error) throw error;
        return (data || []) as AccountingAccount[];
      } catch (err) { return []; }
    }
  },

  // 7. CONFIGURAÇÃO DE TIPOS DE ATIVO
  assetTypeConfigs: {
    ...createTableManager<AssetTypeConfig>('asset_type_configs', 'asset_type_configs'),
    upsert: async (config: AssetTypeConfig) => {
      // Sanitização estrita para remover campos legados (classificationId)
      const payload = {
        id: config.id,
        name: config.name,
        accountId: config.accountId || null
      };
      const { error } = await supabase.from('asset_type_configs').upsert(payload);
      if (error) throw error;
    }
  },

  // 8. NOTIFICAÇÕES
  notifications: {
    list: async (): Promise<AppNotification[]> => {
      try {
        const { data, error } = await supabase.from('notifications').select('*').order('createdAt', { ascending: false }).limit(100);
        if (error) throw error;
        return (data || []) as AppNotification[];
      } catch (err) { return []; }
    },
    upsert: async (notif: AppNotification) => {
      const { error } = await supabase.from('notifications').upsert(notif);
      if (error) throw error;
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
    },
    clearAll: async () => {
      // Nota: Supabase não tem delete * sem where por segurança, usamos um workaround ou deletamos um a um no backend real
      // Para este app, vamos assumir que o usuário limpa localmente ou deletamos por ID
      const { error } = await supabase.from('notifications').delete().neq('id', '0'); 
      if (error) throw error;
    }
  },

  // 9. AUDITORIAS
  auditSessions: createTableManager<AuditSession>('audit_sessions', 'audit_sessions'),

  // Módulos Legados (Mantidos vazios para compatibilidade se algo chamar)
  accountingClassifications: {
    list: async () => [], upsert: async () => {}, remove: async () => {}
  }
};
