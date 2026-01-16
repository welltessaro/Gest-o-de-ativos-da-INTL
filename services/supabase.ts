
import { createClient } from '@supabase/supabase-js';
import { Asset, Company, Employee, EquipmentRequest, AuditSession } from '../types';

// A URL do seu projeto baseada no ID fornecido
const supabaseUrl = process.env.SUPABASE_URL || 'https://hauaemihkmrpjmzgpigh.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// O sistema só tentará conectar se a chave Anon for fornecida nas variáveis de ambiente
export const isSupabaseConfigured = supabaseAnonKey.length > 10;

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mapeadores para consistência App (camelCase) vs DB (snake_case)
const mapAsset = (data: any): Asset => ({
  id: data.id,
  companyId: data.company_id,
  type: data.type,
  brand: data.brand,
  model: data.model,
  ram: data.ram,
  storage: data.storage,
  processor: data.processor,
  screenSize: data.screen_size,
  observations: data.observations,
  photos: data.photos || [],
  status: data.status,
  assignedTo: data.assigned_to,
  qrCode: data.qr_code,
  createdAt: data.created_at
});

const mapAssetToDB = (asset: any) => ({
  id: asset.id,
  company_id: asset.companyId,
  type: asset.type,
  brand: asset.brand,
  model: asset.model,
  ram: asset.ram,
  storage: asset.storage,
  processor: asset.processor,
  screen_size: asset.screenSize,
  observations: asset.observations,
  photos: asset.photos,
  status: asset.status,
  assigned_to: asset.assignedTo,
  qr_code: asset.qrCode
});

export const db = {
  assets: {
    fetch: async (): Promise<Asset[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapAsset);
    },
    insert: async (asset: Omit<Asset, 'createdAt'>): Promise<Asset> => {
      if (!supabase) throw new Error("Offline");
      const { data, error } = await supabase.from('assets').insert([mapAssetToDB(asset)]).select();
      if (error) throw error;
      return mapAsset(data[0]);
    },
    update: async (id: string, updates: Partial<Asset>): Promise<Asset> => {
      if (!supabase) throw new Error("Offline");
      const dbUpdates = mapAssetToDB(updates);
      Object.keys(dbUpdates).forEach(key => (dbUpdates as any)[key] === undefined && delete (dbUpdates as any)[key]);
      const { data, error } = await supabase.from('assets').update(dbUpdates).eq('id', id).select();
      if (error) throw error;
      return mapAsset(data[0]);
    },
    delete: async (id: string) => {
      if (!supabase) throw new Error("Offline");
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
    }
  },
  companies: {
    fetch: async (): Promise<Company[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.from('companies').select('*').order('name');
      if (error) throw error;
      return data.map(c => ({ ...c, createdAt: c.created_at }));
    },
    insert: async (company: Omit<Company, 'createdAt'>): Promise<Company> => {
      if (!supabase) throw new Error("Offline");
      const { data, error } = await supabase.from('companies').insert([company]).select();
      if (error) throw error;
      return { ...data[0], createdAt: data[0].created_at };
    }
  },
  employees: {
    fetch: async (): Promise<Employee[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.from('employees').select('*').order('name');
      if (error) throw error;
      return data.map(e => ({
        id: e.id,
        companyId: e.company_id,
        name: e.name,
        sector: e.sector,
        role: e.role,
        cpf: e.cpf
      }));
    },
    // Fix: Allow optional 'id' in Employee creation to avoid TS error when accessing emp.id
    insert: async (emp: Omit<Employee, 'id'> & { id?: string }): Promise<Employee> => {
      if (!supabase) throw new Error("Offline");
      const id = emp.id || `EMP-${Math.floor(Math.random() * 10000)}`;
      const { data, error } = await supabase.from('employees').insert([{ 
        id, 
        company_id: emp.companyId, 
        name: emp.name, 
        sector: emp.sector, 
        role: emp.role, 
        cpf: emp.cpf 
      }]).select();
      if (error) throw error;
      return { ...emp, id: data[0].id } as Employee;
    }
  },
  requests: {
    fetch: async (): Promise<EquipmentRequest[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.from('equipment_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(r => ({
        id: r.id,
        requesterId: r.requester_id,
        employeeId: r.employee_id,
        items: r.items,
        itemFulfillments: r.item_fulfillments,
        observation: r.observation,
        status: r.status,
        type: r.type,
        createdAt: r.created_at
      }));
    },
    insert: async (req: Omit<EquipmentRequest, 'createdAt'>): Promise<EquipmentRequest> => {
      if (!supabase) throw new Error("Offline");
      const { data, error } = await supabase.from('equipment_requests').insert([{
        id: req.id,
        requester_id: req.requesterId,
        employee_id: req.employeeId,
        items: req.items,
        item_fulfillments: req.itemFulfillments,
        observation: req.observation,
        status: req.status,
        type: req.type
      }]).select();
      if (error) throw error;
      return { ...req, createdAt: data[0].created_at };
    },
    update: async (req: EquipmentRequest): Promise<EquipmentRequest> => {
      if (!supabase) throw new Error("Offline");
      const { data, error } = await supabase.from('equipment_requests').update({
        status: req.status,
        item_fulfillments: req.itemFulfillments,
        observation: req.observation
      }).eq('id', req.id).select();
      if (error) throw error;
      return { ...req, createdAt: data[0].created_at };
    }
  },
  auditSessions: {
    fetch: async (): Promise<AuditSession[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.from('audit_sessions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(s => ({
        id: s.id,
        sector: s.sector,
        entries: s.entries,
        isFinished: s.is_finished,
        generatedRequestId: s.generated_request_id,
        createdAt: s.created_at
      }));
    },
    insert: async (session: AuditSession): Promise<AuditSession> => {
      if (!supabase) throw new Error("Offline");
      const { data, error } = await supabase.from('audit_sessions').insert([{
        id: session.id,
        sector: session.sector,
        entries: session.entries,
        is_finished: session.isFinished,
        generated_request_id: session.generatedRequestId
      }]).select();
      if (error) throw error;
      return { ...session, createdAt: data[0].created_at };
    },
    update: async (session: AuditSession): Promise<AuditSession> => {
      if (!supabase) throw new Error("Offline");
      const { data, error } = await supabase.from('audit_sessions').update({
        entries: session.entries,
        is_finished: session.isFinished,
        generated_request_id: session.generatedRequestId
      }).eq('id', session.id).select();
      if (error) throw error;
      return { ...session, createdAt: data[0].created_at };
    }
  }
};
