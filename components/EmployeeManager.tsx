
import React, { useState } from 'react';
import { Users, Plus, Search, Trash2, Edit2, Building2, X, Package, Shield, FileText } from 'lucide-react';
import { Employee, Department, Asset, UserAccount, EquipmentRequest } from '../types';

interface EmployeeManagerProps {
  employees: Employee[];
  departments: Department[];
  assets: Asset[];
  users: UserAccount[];
  requests: EquipmentRequest[];
  onAdd: (employee: Omit<Employee, 'id'>) => void;
  onUpdate: (employee: Employee) => void;
  onRemove: (id: string) => void;
}

const EmployeeManager: React.FC<EmployeeManagerProps> = ({ employees, departments, assets, users, requests, onAdd, onUpdate, onRemove }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Omit<Employee, 'id'>>({
    name: '', sector: '', role: '', cpf: '', departmentId: ''
  });

  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setFormData({ name: '', sector: '', role: '', cpf: '', departmentId: '' });
    setShowForm(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      sector: emp.sector,
      role: emp.role,
      cpf: emp.cpf,
      departmentId: emp.departmentId
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departmentId) {
      alert("Selecione um departamento.");
      return;
    }
    const selectedDept = departments.find(d => d.id === formData.departmentId);
    const finalData = { ...formData, sector: selectedDept?.name || 'Geral' };
    if (editingEmployee) onUpdate({ ...finalData, id: editingEmployee.id });
    else onAdd(finalData);
    setShowForm(false);
    setEditingEmployee(null);
  };

  const getDepartmentName = (id: string) => departments.find(d => d.id === id)?.name || 'N/A';

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.cpf.includes(searchTerm) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por nome, cargo ou CPF..." 
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Cadastrar Colaborador</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Nome</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Vínculos</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Departamento</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Função</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEmployees.map(emp => {
              const hasAssets = assets.some(a => a.assignedTo === emp.id);
              const hasUser = users.some(u => u.employeeId === emp.id);
              const hasRequests = requests.some(r => r.employeeId === emp.id);

              return (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{emp.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{emp.cpf}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      {/* Fix: Wrapped Lucide icons in spans to support the title attribute for tooltips and resolve TS errors */}
                      <span title={hasAssets ? "Possui Ativos" : "Sem Ativos"}>
                        <Package className={`w-4 h-4 ${hasAssets ? 'text-blue-500' : 'text-slate-200'}`} />
                      </span>
                      <span title={hasUser ? "Possui Usuário" : "Sem Usuário"}>
                        <Shield className={`w-4 h-4 ${hasUser ? 'text-indigo-500' : 'text-slate-200'}`} />
                      </span>
                      <span title={hasRequests ? "Possui Histórico de Requisições" : "Sem Requisições"}>
                        <FileText className={`w-4 h-4 ${hasRequests ? 'text-amber-500' : 'text-slate-200'}`} />
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-700 font-bold">{getDepartmentName(emp.departmentId)}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{emp.role}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        type="button"
                        onClick={() => handleOpenEdit(emp)} 
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const confirmMsg = `Deseja realmente excluir o colaborador ${emp.name}?\n\nEle será removido desta lista, mas o histórico de ativos e requisições será preservado no banco de dados.`;
                          if(window.confirm(confirmMsg)) {
                            onRemove(emp.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remover (Arquivar)"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <Users className="w-7 h-7 text-blue-600" />
                {editingEmployee ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nome do colaborador" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                <input className="w-full p-4 rounded-2xl border border-slate-200 bg-white outline-none font-bold" placeholder="000.000.000-00" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Departamento</label>
                <div className="relative">
                   <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                   <select className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white outline-none font-bold appearance-none" value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})} required>
                     <option value="">Selecione...</option>
                     {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                   </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Função / Cargo</label>
                <input className="w-full p-4 rounded-2xl border border-slate-200 bg-white outline-none font-bold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="Ex: Desenvolvedor Senior" required />
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-4 font-bold text-slate-500">Cancelar</button>
                <button type="submit" className="px-12 py-4 font-black bg-blue-600 text-white rounded-2xl shadow-xl uppercase text-xs tracking-widest">
                  {editingEmployee ? 'Salvar' : 'Salvar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManager;
