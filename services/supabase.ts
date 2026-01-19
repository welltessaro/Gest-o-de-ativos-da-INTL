
import { createClient } from '@supabase/supabase-js';
import { 
  Asset, Department, Employee, EquipmentRequest, AuditSession, 
  UserAccount, AppNotification, AccountingAccount, 
  AccountingClassification, AssetTypeConfig 
} from '../types';

const SUPABASE_URL = 'https://zcbphldaobriwkpqcupa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_5GUfPGtwRSMJHjNqocwqwA_GUm6U0PE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const localDB = {
  save: (key: string, data: any) => localStorage.setItem(`assettrack_${key}`, JSON.stringify(data)),
  get: (key: string) => {
    const val = localStorage.getItem(`assettrack_${key}`);
    return val ? JSON.parse(val) : null;
  }
};

const DATA_MARKER = '--- [SISTEMA-DATA-V1] ---';

const toB64 = (obj: any): string => {
  try {
    const str = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (e) {
    console.error("Erro na codificação Base64:", e);
    return "";
  }
};

const fromB64 = (str: string): any => {
  if (!str) return null;
  try {
    const binary = atob(str.trim());
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoded = new TextDecoder().decode(bytes);
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
};

const deflateAsset = (asset: Asset) => {
  const { 
    serialNumber, ram, storage, processor, screenSize, 
    caseModel, isWireless, monitorInputs, isAbnt, hasNumericKeypad, purchaseValue,
    ...dbReady 
  } = asset;

  const virtualFields = {
    serialNumber, ram, storage, processor, screenSize, 
    caseModel, isWireless, monitorInputs, isAbnt, hasNumericKeypad, purchaseValue
  };

  const observations = dbReady.observations || '';
  const cleanObs = observations.split(DATA_MARKER)[0].trim();
  const encodedData = toB64(virtualFields);
  
  return {
    ...dbReady,
    assignedTo: dbReady.assignedTo || null,
    departmentId: dbReady.departmentId || null,
    observations: `${cleanObs}\n\n${DATA_MARKER}\n${encodedData}`
  };
};

const inflateAsset = (dbAsset: any): Asset => {
  if (!dbAsset) return null as any;
  const asset = { ...dbAsset, history: dbAsset.history || [] } as Asset;
  
  if (typeof dbAsset.observations === 'string' && dbAsset.observations.includes(DATA_MARKER)) {
    try {
      const parts = dbAsset.observations.split(DATA_MARKER);
      asset.observations = parts[0].trim();
      const virtualFields = fromB64(parts[1].trim());
      if (virtualFields) {
        Object.assign(asset, virtualFields);
      }
    } catch (e) {}
  }
  return asset;
};

const deflateUser = (user: UserAccount) => {
  const { employeeId, password, modules, sector, ...rest } = user;
  
  const virtualFields = { 
    employeeId: employeeId || null, 
    password: password || 'admin', 
    modules: modules || [] 
  };
  
  const encodedData = toB64(virtualFields);
  const currentSector = sector || '';
  const cleanSector = currentSector.split(DATA_MARKER)[0].trim();
  
  return {
    ...rest,
    username: (rest.username || '').toLowerCase().trim(),
    password: virtualFields.password,
    sector: `${cleanSector} ${DATA_MARKER}${encodedData}`
  };
};

const inflateUser = (dbUser: any): UserAccount => {
  if (!dbUser) return null as any;
  
  const user = { 
    ...dbUser, 
    modules: dbUser.modules || [] 
  } as UserAccount;
  
  if (typeof dbUser.sector === 'string' && dbUser.sector.includes(DATA_MARKER)) {
    try {
      const parts = dbUser.sector.split(DATA_MARKER);
      user.sector = parts[0].trim();
      const virtualFields = fromB64(parts[1].trim());
      if (virtualFields) {
        user.employeeId = virtualFields.employeeId || "";
        user.password = virtualFields.password || dbUser.password || 'admin';
        user.modules = Array.isArray(virtualFields.modules) ? virtualFields.modules : [];
      }
    } catch (e) {}
  }

  if (user.username === 'admin' && (!user.modules || user.modules.length === 0)) {
    user.modules = [
      'dashboard', 'departments', 'assets', 'maintenance', 'employees', 
      'requests', 'purchase-orders', 'printing', 'user-management', 'inventory-check', 'accounting'
    ];
  }

  return user;
};

export const db = {
  assets: {
    list: async () => {
      try {
        const { data, error } = await supabase.from('assets').select('*').order('createdAt', { ascending: false });
        if (error) throw error;
        const inflated = (data || []).map(inflateAsset);
        localDB.save('assets', inflated);
        return inflated;
      } catch (err) {
        return localDB.get('assets') || [];
      }
    },
    upsert: async (asset: Asset) => {
      const dbReady = deflateAsset(asset);
      const { error } = await supabase.from('assets').upsert(dbReady);
      if (error) throw error;
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
    }
  },
  departments: {
    list: async () => {
      try {
        const { data, error } = await supabase.from('departments').select('*');
        if (error) throw error;
        localDB.save('departments', data);
        return data as Department[];
      } catch (err) {
        return localDB.get('departments') || [];
      }
    },
    upsert: async (dept: Department) => {
      const { error } = await supabase.from('departments').upsert(dept);
      if (error) throw error;
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
    }
  },
  employees: {
    list: async () => {
      try {
        const { data, error } = await supabase.from('employees').select('*');
        if (error) throw error;
        localDB.save('employees', data);
        return data as Employee[];
      } catch (err) {
        return localDB.get('employees') || [];
      }
    },
    upsert: async (emp: Employee) => {
      const { error } = await supabase.from('employees').upsert(emp);
      if (error) throw error;
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    }
  },
  requests: {
    list: async () => {
      try {
        const { data, error } = await supabase.from('requests').select('*').order('createdAt', { ascending: false });
        if (error) throw error;
        localDB.save('requests', data);
        return data as EquipmentRequest[];
      } catch (err) {
        return localDB.get('requests') || [];
      }
    },
    upsert: async (req: EquipmentRequest) => {
      const { error } = await supabase.from('requests').upsert(req);
      if (error) throw error;
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('requests').delete().eq('id', id);
      if (error) throw error;
    }
  },
  accountingAccounts: {
    list: async () => {
      try {
        const { data, error } = await supabase.from('accounting_accounts').select('*').order('code', { ascending: true });
        if (error) throw error;
        return data as AccountingAccount[];
      } catch (err: any) { 
        if (err.code === 'PGRST204' || err.code === 'PGRST205') {
          console.warn("Tabela accounting_accounts não encontrada no Supabase. Execute o SQL de inicialização.");
        }
        return []; 
      }
    },
    upsert: async (account: AccountingAccount) => {
      const { error } = await supabase.from('accounting_accounts').upsert(account);
      if (error) throw error;
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('accounting_accounts').delete().eq('id', id);
      if (error) throw error;
    }
  },
  accountingClassifications: {
    list: async () => {
      try {
        const { data, error } = await supabase.from('accounting_classifications').select('*').order('code', { ascending: true });
        if (error) throw error;
        return data as AccountingClassification[];
      } catch (err: any) { 
        if (err.code === 'PGRST204' || err.code === 'PGRST205') {
          console.warn("Tabela accounting_classifications não encontrada no Supabase. Execute o SQL de inicialização.");
        }
        return []; 
      }
    },
    upsert: async (classification: AccountingClassification) => {
      const { error } = await supabase.from('accounting_classifications').upsert(classification);
      if (error) throw error;
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('accounting_classifications').delete().eq('id', id);
      if (error) throw error;
    }
  },
  assetTypeConfigs: {
    list: async () => {
      try {
        const { data, error } = await supabase.from('asset_type_configs').select('*').order('name', { ascending: true });
        if (error) throw error;
        return data as AssetTypeConfig[];
      } catch (err: any) { 
        if (err.code === 'PGRST204' || err.code === 'PGRST205') {
          console.warn("Tabela asset_type_configs não encontrada no Supabase. Execute o SQL de inicialização.");
        }
        return []; 
      }
    },
    upsert: async (config: AssetTypeConfig) => {
      const { error } = await supabase.from('asset_type_configs').upsert(config);
      if (error) throw error;
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('asset_type_configs').delete().eq('id', id);
      if (error) throw error;
    }
  },
  notifications: {
    list: async () => {
      try {
        const { data, error } = await supabase.from('notifications').select('*').order('createdAt', { ascending: false }).limit(50);
        if (error) throw error;
        return data as AppNotification[];
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
      const { error } = await supabase.from('notifications').delete().neq('id', 'clear_marker');
      if (error) throw error;
    }
  },
  auditSessions: {
    list: async () => {
      try {
        const { data, error } = await supabase.from('audit_sessions').select('*').order('createdAt', { ascending: false });
        if (error) throw error;
        return data as AuditSession[];
      } catch (err) { return []; }
    },
    upsert: async (session: AuditSession) => {
      const { error } = await supabase.from('audit_sessions').upsert(session);
      if (error) throw error;
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('audit_sessions').delete().eq('id', id);
      if (error) throw error;
    }
  },
  users: {
    list: async () => {
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        return (data || []).map(inflateUser);
      } catch (err) { return []; }
    },
    getForAuth: async (username: string) => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username.toLowerCase().trim())
          .single();
        if (error) throw error;
        return inflateUser(data);
      } catch (err: any) { return null; }
    },
    upsert: async (user: UserAccount) => {
      const dbReady = deflateUser(user);
      const { error } = await supabase.from('users').upsert(dbReady);
      if (error) throw error;
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
    }
  }
};
