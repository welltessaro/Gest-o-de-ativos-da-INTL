
import React, { useState } from 'react';
import { Users, Plus, Search, Trash2, Edit2, Building2 } from 'lucide-react';
import { Employee, Department } from '../types';

interface EmployeeManagerProps {
  employees: Employee[];
  departments: Department[];
  onAdd: (employee: Omit<Employee, 'id'>) => void;
}

const EmployeeManager: React.FC<EmployeeManagerProps> = ({ employees, departments, onAdd }) => {
  const [showForm, setShowForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, 'id'>>({
    name: '', sector: '', role: '', cpf: '', departmentId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.departmentId) {
      alert("Selecione um departamento para o colaborador.");
      return;
    }
    onAdd(newEmployee);
    setNewEmployee({ name: '', sector: '', role: '', cpf: '', departmentId: '' });
    setShowForm(false);
  };

  const getDepartmentName = (id: string) => departments.find(d => d.id === id)?.name || 'N/A';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar colaborador..." 
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          />
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200"
        >
          <Plus className="w-5 h-5" />
          <span>Cadastrar Colaborador</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nome</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Setor / Depto</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Função</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">CPF</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-bold text-slate-800">{emp.name}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-slate-700 font-bold">{emp.sector}</span>
                    <span className="text-[10px] text-slate-400 font-black uppercase">{getDepartmentName(emp.departmentId)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 font-medium">{emp.role}</td>
                <td className="px-6 py-4 text-slate-500 text-sm font-mono">{emp.cpf}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 className="w-5 h-5" /></button>
                    <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Novo Colaborador
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-bold"
                  value={newEmployee.name}
                  onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Setor</label>
                  <input 
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-bold"
                    value={newEmployee.sector}
                    onChange={e => setNewEmployee({...newEmployee, sector: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                  <input 
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-bold"
                    placeholder="000.000.000-00"
                    value={newEmployee.cpf}
                    onChange={e => setNewEmployee({...newEmployee, cpf: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Departamento (Chave DB)</label>
                <div className="relative">
                   <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                   <select 
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-bold appearance-none"
                    value={newEmployee.departmentId}
                    onChange={e => setNewEmployee({...newEmployee, departmentId: e.target.value})}
                    required
                   >
                     <option value="">Selecione um Departamento...</option>
                     {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                   </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Função / Cargo</label>
                <input 
                  className="w-full p-4 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-bold"
                  value={newEmployee.role}
                  onChange={e => setNewEmployee({...newEmployee, role: e.target.value})}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-4 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl">Cancelar</button>
                <button type="submit" className="px-12 py-4 font-black bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100 uppercase text-xs tracking-widest transition-all active:scale-95">Salvar Colaborador</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManager;
