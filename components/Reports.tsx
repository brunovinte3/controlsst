
import React, { useState, useMemo } from 'react';
import { Employee, TrainingStatus, TrainingRecord, CompanyProfile } from '../types';
import { NR_COURSES, STATUS_CONFIG, getDeptColor } from '../constants';
import { getDaysRemaining } from '../utils/calculations';
import { StorageService } from '../services/storage';

interface ReportsProps {
  employees: Employee[];
}

const Reports: React.FC<ReportsProps> = ({ employees }) => {
  const [filters, setFilters] = useState({
    company: '',
    department: '',
    status: '' as TrainingStatus | '',
    course: '',
    search: '',
    period: 'all' as 'all' | '15' | '30' | '60' | '90' | 'expired',
  });

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(StorageService.getCompanyProfile());
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const companies = useMemo(() => Array.from(new Set(employees.map(e => e.company))), [employees]);
  const departments = useMemo(() => Array.from(new Set(employees.map(e => e.department))), [employees]);

  const reportData = useMemo(() => {
    let result: any[] = [];
    employees.forEach(emp => {
      Object.entries(emp.trainings).forEach(([cid, record]) => {
        const t = record as TrainingRecord;
        const days = getDaysRemaining(t.expiryDate);
        
        const matchesSearch = emp.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                             emp.registration.includes(filters.search) ||
                             emp.role.toLowerCase().includes(filters.search.toLowerCase());
        const matchesCompany = !filters.company || emp.company === filters.company;
        const matchesDept = !filters.department || emp.department === filters.department;
        const matchesStatus = !filters.status || t.status === filters.status;
        const matchesCourse = !filters.course || cid === filters.course;

        let matchesPeriod = true;
        if (filters.period === '15') matchesPeriod = days !== null && days <= 15 && days >= 0;
        else if (filters.period === '30') matchesPeriod = days !== null && days <= 30 && days >= 0;
        else if (filters.period === '60') matchesPeriod = days !== null && days <= 60 && days >= 0;
        else if (filters.period === '90') matchesPeriod = days !== null && days <= 90 && days >= 0;
        else if (filters.period === 'expired') matchesPeriod = t.status === 'EXPIRED';

        if (matchesSearch && matchesCompany && matchesDept && matchesStatus && matchesCourse && matchesPeriod) {
          result.push({ employee: emp, courseId: cid, record: t, days });
        }
      });
    });
    return result;
  }, [employees, filters]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.updateCompanyProfile(companyProfile);
    setIsConfigOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      <div className="flex justify-between items-center no-print">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter italic">Auditoria <span className="text-emerald-600">Normativa</span></h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Geração de Relatórios ControlSST</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setIsConfigOpen(true)} className="bg-white border border-emerald-100 text-emerald-700 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest">⚙️ Layout PDF</button>
          <button onClick={() => window.print()} className="bg-[#064E3B] text-emerald-400 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">🖨️ Exportar</button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-emerald-50 no-print space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[9px] font-black text-emerald-800/40 uppercase mb-2 tracking-widest">Empresa</label>
            <select className="w-full bg-emerald-50/30 border-2 border-emerald-50 rounded-xl p-3 font-bold text-xs" value={filters.company} onChange={e => setFilters({...filters, company: e.target.value})}>
              <option value="">Todas as Empresas</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-emerald-800/40 uppercase mb-2 tracking-widest">Setor</label>
            <select className="w-full bg-emerald-50/30 border-2 border-emerald-50 rounded-xl p-3 font-bold text-xs" value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})}>
              <option value="">Todos os Setores</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-emerald-800/40 uppercase mb-2 tracking-widest">Vencimento</label>
            <select className="w-full bg-emerald-50/30 border-2 border-emerald-50 rounded-xl p-3 font-bold text-xs" value={filters.period} onChange={e => setFilters({...filters, period: e.target.value as any})}>
              <option value="all">Toda Vigência</option>
              <option value="15">15 Dias</option>
              <option value="30">30 Dias</option>
              <option value="60">60 Dias</option>
              <option value="90">90 Dias</option>
              <option value="expired">Vencidos</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-emerald-800/40 uppercase mb-2 tracking-widest">Estado (Status)</label>
            <select className="w-full bg-emerald-50/30 border-2 border-emerald-50 rounded-xl p-3 font-bold text-xs" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value as any})}>
              <option value="">Todos os Status</option>
              <option value="VALID">Válidos</option>
              <option value="EXPIRING">Vencendo</option>
              <option value="EXPIRED">Vencidos</option>
              <option value="NOT_TRAINED">Não Capacitados</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-black text-emerald-800/40 uppercase mb-2 tracking-widest">Curso (NR)</label>
            <select className="w-full bg-emerald-50/30 border-2 border-emerald-50 rounded-xl p-3 font-bold text-xs" value={filters.course} onChange={e => setFilters({...filters, course: e.target.value})}>
              <option value="">Todas as NRs</option>
              {NR_COURSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-emerald-800/40 uppercase mb-2 tracking-widest">Busca Geral (Nome, RE, Função)</label>
            <input type="text" className="w-full bg-emerald-50/30 border-2 border-emerald-50 rounded-xl p-3 font-bold text-xs" placeholder="Pesquisar..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-emerald-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-emerald-900 text-emerald-400 font-black uppercase text-[9px] tracking-[0.2em] border-b border-emerald-800">
              <tr>
                <th className="px-8 py-6">Empresa</th>
                <th className="px-8 py-6">Colaborador (Matrícula / Função)</th>
                <th className="px-8 py-6">Curso / Setor</th>
                <th className="px-8 py-6">Vencimento</th>
                <th className="px-8 py-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {reportData.map((item, idx) => (
                <tr key={idx} className="sst-table-row">
                  <td className="px-8 py-5"><span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md">{item.employee.company}</span></td>
                  <td className="px-8 py-5">
                    <p className="font-black text-emerald-950 text-sm tracking-tight">{item.employee.name}</p>
                    <p className="text-[9px] text-emerald-600/60 uppercase font-black tracking-tighter">RE: {item.employee.registration} • {item.employee.role}</p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="font-black text-emerald-700 text-sm italic">{item.courseId}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">{item.employee.department}</p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="font-black text-emerald-950 text-xs">{item.record.expiryDate ? new Date(item.record.expiryDate).toLocaleDateString('pt-BR') : '---'}</p>
                    {item.days !== null && <p className={`text-[8px] font-black uppercase tracking-tighter mt-0.5 ${item.days < 0 ? 'text-red-600' : 'text-amber-600'}`}>{item.days < 0 ? 'Vencido' : `${item.days}d restantes`}</p>}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest ${STATUS_CONFIG[item.record.status].bg} ${STATUS_CONFIG[item.record.status].text}`}>
                      {STATUS_CONFIG[item.record.status].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
