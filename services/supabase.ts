
import { createClient } from '@supabase/supabase-js';
import { Asset, Department, Employee, EquipmentRequest, AuditSession, UserAccount } from '../types';

const SUPABASE_URL = 'https://zcbphldaobriwkpqcupa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_5GUfPGtwRSMJHjNqocwqwA_GUm6U0PE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const db = {
  assets: {
    list: async () => {
      const { data, error } = await supabase.from('assets').select('*').order('createdAt', { ascending: false });
      if (error) { console.error("Erro ao listar assets:", error.message); throw error; }
      return data as Asset[];
    },
    upsert: async (asset: Asset) => {
      const { error } = await supabase.from('assets').upsert(asset);
      if (error) { console.error("Erro ao upsert asset:", error.message); throw error; }
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) { console.error("Erro ao remover asset:", error.message); throw error; }
    }
  },
  departments: {
    list: async () => {
      const { data, error } = await supabase.from('departments').select('*');
      if (error) { console.error("Erro ao listar departments:", error.message); throw error; }
      return data as Department[];
    },
    upsert: async (dept: Department) => {
      const { error } = await supabase.from('departments').upsert(dept);
      if (error) { console.error("Erro ao upsert department:", error.message); throw error; }
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) { console.error("Erro ao remover department:", error.message); throw error; }
    }
  },
  employees: {
    list: async () => {
      const { data, error } = await supabase.from('employees').select('*');
      if (error) { console.error("Erro ao listar employees:", error.message); throw error; }
      return data as Employee[];
    },
    upsert: async (emp: Employee) => {
      const { error } = await supabase.from('employees').upsert(emp);
      if (error) { console.error("Erro ao upsert employee:", error.message); throw error; }
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) { console.error("Erro ao remover employee:", error.message); throw error; }
    }
  },
  requests: {
    list: async () => {
      const { data, error } = await supabase.from('requests').select('*').order('createdAt', { ascending: false });
      if (error) { console.error("Erro ao listar requests:", error.message); throw error; }
      return data as EquipmentRequest[];
    },
    upsert: async (req: EquipmentRequest) => {
      const { error } = await supabase.from('requests').upsert(req);
      if (error) { console.error("Erro ao upsert request:", error.message); throw error; }
    }
  },
  auditSessions: {
    list: async () => {
      const { data, error } = await supabase.from('audit_sessions').select('*').order('createdAt', { ascending: false });
      if (error) { console.error("Erro ao listar audit_sessions:", error.message); throw error; }
      return data as AuditSession[];
    },
    upsert: async (session: AuditSession) => {
      const { error } = await supabase.from('audit_sessions').upsert(session);
      if (error) { console.error("Erro ao upsert audit_session:", error.message); throw error; }
    }
  },
  users: {
    list: async () => {
      const { data, error } = await supabase.from('users').select('id, name, username, sector, modules');
      if (error) { console.error("Erro ao listar users:", error.message); throw error; }
      return data as UserAccount[];
    },
    getForAuth: async (username: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Erro na busca de auth:", error.message);
      }
      return data as UserAccount | null;
    },
    upsert: async (user: UserAccount) => {
      const { error } = await supabase.from('users').upsert(user);
      if (error) { 
        console.error("Erro detalhado ao upsert user:", error.message, error.details, error.hint); 
        throw error; 
      }
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) { console.error("Erro ao remover user:", error.message); throw error; }
    }
  }
};
