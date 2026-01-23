
import React, { useState, useMemo } from 'react';
import { Employee, TrainingStatus, TrainingRecord, CompanyProfile } from '../types';
import { NR_COURSES, STATUS_CONFIG } from '../constants';
import { getDaysRemaining } from '../utils/calculations';
import { StorageService } from '../services/storage';

interface ReportsProps {
  employees: Employee[];
}

const Reports: React.FC<ReportsProps> = ({ employees }) => {
  const [filters, setFilters] = useState({
    company: '',
    setor: '',
    status: '' as TrainingStatus | '',
    course: '',
    search: '',
    period: 'all' as 'all' | '15' | '30' | '60' | '90' | 'expired',
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const companies = useMemo(() => Array.from(new Set(employees.map(e => e.company))), [employees]);
  const setores = useMemo(() => Array.from(new Set(employees.map(e => e.setor))), [employees]);

  const reportData = useMemo(() => {
    let result: any[] = [];
    employees.forEach(emp => {
      Object.entries(emp.trainings).forEach(([cid, record]) => {
        const t = record as TrainingRecord;
        const days = getDaysRemaining(t.expiryDate);
        
        const matchesSearch = emp.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                             emp.registration.includes(filters.search);
        const matchesCompany = !filters.company || emp.company === filters.company;
        const matchesSetor = !filters.setor || emp.setor === filters.setor;
        const matchesStatus = !filters.status || t.status === filters.status;
        const matchesCourse = !filters.course || cid === filters.course;

        let matchesPeriod = true;
        if (filters.period === 'expired') matchesPeriod = t.status === 'EXPIRED';

        if (matchesSearch && matchesCompany && matchesSetor && matchesStatus && matchesCourse && matchesPeriod) {
          result.push({ employee: emp, courseId: cid, record: t, days });
        }
      });
    });
    return result;
  }, [employees, filters]);

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      <div className="flex justify-between items-center no-print">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter italic">Auditoria <span className="text-emerald-600">Normativa</span></h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Relatórios Gerenciais ControlSST</p>
        </div>
        <button onClick={() => window.print()} className="bg-[#064E3B] text-emerald-400 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">🖨️ Exportar PDF</button>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-emerald-50 no-print space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[9px] font-black text-emerald-800/40 uppercase mb-2">Empresa</label>
            <select className="w-full bg-emerald-50/30 border border-emerald-50 rounded-xl p-3 text-xs" value={filters.company} onChange={e => setFilters({...filters, company: e.target.value})}>
              <option value="">Todas</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-emerald-800/40 uppercase mb-2">Setor</label>
            <select className="w-full bg-emerald-50/30 border border-emerald-50 rounded-xl p-3 text-xs" value={filters.setor} onChange={e => setFilters({...filters, setor: e.target.value})}>
              <option value="">Todos</option>
              {setores.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-emerald-800/40 uppercase mb-2">Estado</label>
            <select className="w-full bg-emerald-50/30 border border-emerald-50 rounded-xl p-3 text-xs" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value as any})}>
              <option value="">Todos os Status</option>
              <option value="VALID">Válidos</option>
              <option value="EXPIRING">Vencendo</option>
              <option value="EXPIRED">Vencidos</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-emerald-800/40 uppercase mb-2">Pesquisa</label>
            <input type="text" className="w-full bg-emerald-50/30 border border-emerald-50 rounded-xl p-3 text-xs" placeholder="Nome ou RE..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-emerald-100">
        <table className="w-full text-left">
          <thead className="bg-emerald-900 text-emerald-400 font-black uppercase text-[9px] tracking-[0.2em]">
            <tr>
              <th className="px-8 py-6">Empresa</th>
              <th className="px-8 py-6">Colaborador</th>
              <th className="px-8 py-6">Curso / Setor</th>
              <th className="px-8 py-6">Vencimento</th>
              <th className="px-8 py-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50">
            {reportData.map((item, idx) => (
              <tr key={idx} className="sst-table-row">
                <td className="px-8 py-5 text-[9px] font-black">{item.employee.company}</td>
                <td className="px-8 py-5">
                  <p className="font-black text-emerald-950 text-sm">{item.employee.name}</p>
                  <p className="text-[9px] text-emerald-600/60 font-black">RE: {item.employee.registration}</p>
                </td>
                <td className="px-8 py-5">
                  <p className="font-black text-emerald-700 text-sm italic">{item.courseId}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">{item.employee.setor}</p>
                </td>
                <td className="px-8 py-5 text-xs font-black">
                  {item.record.expiryDate ? new Date(item.record.expiryDate).toLocaleDateString('pt-BR') : '---'}
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
  );
};

export default Reports;
