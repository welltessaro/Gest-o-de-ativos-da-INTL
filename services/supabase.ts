
import { createClient } from '@supabase/supabase-js';
import { 
  Asset, Department, Employee, EquipmentRequest, AuditSession, 
  UserAccount, AppNotification, AccountingAccount, 
  AccountingClassification, AssetTypeConfig 
} from '../types';

const SUPABASE_URL = 'https://zcbphldaobriwkpqcupa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_5GUfPGtwRSMJHjNqocwqwA_GUm6U0PE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sistema de Cache Local (Fallback Offline)
const localDB = {
  save: (key: string, data: any) => localStorage.setItem(`assettrack_${key}`, JSON.stringify(data)),
  get: (key: string) => {
    const val = localStorage.getItem(`assettrack_${key}`);
    return val ? JSON.parse(val) : null;
  }
};

// --- MÉTODOS DE ACESSO LIMPOS ---

export const db = {
  assets: {
    list: async () => {
      try {
        const { data, error } = await supabase.from('assets').select('*').order('createdAt', { ascending: false });
        if (error) throw error;
        
        // Normalização e Proteção contra Nulls
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
        console.warn("Supabase offline/erro, usando cache local para ativos.");
        return localDB.get('assets') || [];
      }
    },
    upsert: async (asset: Asset) => {
      const payload = {
        ...asset,
        purchaseValue: asset.purchaseValue ?? 0,
        assignedTo: asset.assignedTo || null,
        departmentId: asset.departmentId || null,
        tagId: asset.tagId || null,
        photos: asset.photos || [],
        history: asset.history || []
      };
      
      const { error } = await supabase.from('assets').upsert(payload);
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
        return (data || []) as Department[];
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
        return (data || []) as Employee[];
      } catch (err) {
        return localDB.get('employees') || [];
      }
    },
    upsert: async (emp: Employee) => {
      const payload = {
        ...emp,
        departmentId: emp.departmentId || null
      };
      const { error } = await supabase.from('employees').upsert(payload);
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
        
        const requests = (data || []).map((r: any) => ({
           ...r,
           items: r.items || [],
           itemFulfillments: r.itemFulfillments || []
        })) as EquipmentRequest[];
        
        localDB.save('requests', requests);
        return requests;
      } catch (err) {
        return localDB.get('requests') || [];
      }
    },
    upsert: async (req: EquipmentRequest) => {
      const payload = {
        ...req,
        employeeId: req.employeeId || null,
        items: req.items || [],
        itemFulfillments: req.itemFulfillments || []
      };
      const { error } = await supabase.from('requests').upsert(payload);
      if (error) throw error;
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('requests').delete().eq('id', id);
      if (error) throw error;
    }
  },

  users: {
    list: async () => {
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        
        return (data || []).map((u: any) => ({
            ...u,
            modules: u.modules || []
        })) as UserAccount[];
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
        
        if (data) {
           data.modules = data.modules || [];
        }
        
        return data as UserAccount;
      } catch (err: any) { return null; }
    },
    upsert: async (user: UserAccount) => {
      // Garante que o username seja minúsculo e sem espaços
      const payload = {
        ...user,
        username: user.username.toLowerCase().trim(),
        employeeId: user.employeeId || null,
        modules: user.modules || []
      };
      const { error } = await supabase.from('users').upsert(payload);
      if (error) throw error;
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // --- MÓDULOS SECUNDÁRIOS E CONFIGURAÇÕES ---

  accountingAccounts: {
    list: async () => {
      try {
        const { data, error } = await supabase.from('accounting_accounts').select('*').order('code', { ascending: true });
        if (error) throw error;
        return (data || []) as AccountingAccount[];
      } catch (err: any) { return []; }
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
        return (data || []) as AccountingClassification[];
      } catch (err: any) { return []; }
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
        return (data || []) as AssetTypeConfig[];
      } catch (err: any) { return []; }
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
      const { error } = await supabase.from('notifications').delete().neq('id', 'clear_marker');
      if (error) throw error;
    }
  },

  auditSessions: {
    list: async () => {
      try {
        const { data, error } = await supabase.from('audit_sessions').select('*').order('createdAt', { ascending: false });
        if (error) throw error;
        
        return (data || []).map((s: any) => ({
           ...s,
           entries: s.entries || []
        })) as AuditSession[];
      } catch (err) { return []; }
    },
    upsert: async (session: AuditSession) => {
      const payload = {
         ...session,
         entries: session.entries || []
      };
      const { error } = await supabase.from('audit_sessions').upsert(payload);
      if (error) throw error;
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('audit_sessions').delete().eq('id', id);
      if (error) throw error;
    }
  }
};
