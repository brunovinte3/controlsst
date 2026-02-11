
import React, { useState, useMemo } from 'react';
import { Employee, TrainingStatus, TrainingRecord, EmployeeSituation } from '../types';
import { NR_COURSES, STATUS_CONFIG, SITUATION_CONFIG } from '../constants';
import { getDaysRemaining } from '../utils/calculations';

interface ReportsProps {
  employees: Employee[];
}

const Reports: React.FC<ReportsProps> = ({ employees }) => {
  const [filters, setFilters] = useState({
    company: '',
    setor: '',
    status: '' as TrainingStatus | '',
    situation: '' as EmployeeSituation | '',
    course: '',
    search: '',
    period: 'all' as 'all' | '15' | '30' | '60' | '90' | 'expired',
  });

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
        const matchesSituation = !filters.situation || emp.situation === filters.situation;
        const matchesCourse = !filters.course || cid === filters.course;

        let matchesPeriod = true;
        if (filters.period === 'expired') matchesPeriod = t.status === 'EXPIRED';

        if (matchesSearch && matchesCompany && matchesSetor && matchesStatus && matchesSituation && matchesCourse && matchesPeriod) {
          result.push({ employee: emp, courseId: cid, record: t, days });
        }
      });
    });
    return result;
  }, [employees, filters]);

  return (
    <div className="space-y-6 pb-20 animate-fadeIn print:pb-0 print:space-y-0">
      <div className="flex justify-between items-center no-print">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter italic">Auditoria <span className="text-emerald-600">Normativa</span></h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Relatórios Gerenciais ControlSST</p>
        </div>
        <button onClick={() => window.print()} className="bg-[#064E3B] text-emerald-400 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">🖨️ Exportar PDF</button>
      </div>

      <div className="hidden print:block mb-8 p-10 bg-emerald-50 border-b-4 border-emerald-900">
          <h1 className="text-3xl font-black uppercase text-emerald-950 tracking-tighter">Relatório de Auditoria SST</h1>
          <div className="mt-4 grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest text-emerald-700">
             <p>Empresa: {filters.company || 'Todas'}</p>
             <p className="text-right">Setor: {filters.setor || 'Todos'}</p>
             <p>Status: {filters.status || 'Todos'}</p>
             <p className="text-right">Gerado em: {new Date().toLocaleString()}</p>
          </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-emerald-50 no-print space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-[9px] font-black text-emerald-800/40 uppercase mb-2">Empresa</label>
            <select className="w-full bg-emerald-50/30 border border-emerald-50 rounded-xl p-3 text-xs font-bold" value={filters.company} onChange={e => setFilters({...filters, company: e.target.value})}>
              <option value="">Todas</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-emerald-800/40 uppercase mb-2">Treinamento (NR)</label>
            <select className="w-full bg-emerald-50/30 border border-emerald-50 rounded-xl p-3 text-xs font-bold" value={filters.course} onChange={e => setFilters({...filters, course: e.target.value})}>
              <option value="">Todas as NRs</option>
              {NR_COURSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-emerald-800/40 uppercase mb-2">Setor</label>
            <select className="w-full bg-emerald-50/30 border border-emerald-50 rounded-xl p-3 text-xs font-bold" value={filters.setor} onChange={e => setFilters({...filters, setor: e.target.value})}>
              <option value="">Todos</option>
              {setores.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-emerald-800/40 uppercase mb-2">Estado</label>
            <select className="w-full bg-emerald-50/30 border border-emerald-50 rounded-xl p-3 text-xs font-bold" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value as any})}>
              <option value="">Todos os Status</option>
              <option value="VALID">Válidos</option>
              <option value="EXPIRING">Vencendo</option>
              <option value="EXPIRED">Vencidos</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-emerald-800/40 uppercase mb-2">Situação</label>
            <select className="w-full bg-emerald-50/30 border border-emerald-50 rounded-xl p-3 text-xs font-bold" value={filters.situation} onChange={e => setFilters({...filters, situation: e.target.value as any})}>
              <option value="">Todas</option>
              <option value="ATIVO">Ativo</option>
              <option value="AFASTADO">Afastado</option>
              <option value="DEMITIDO">Demitido</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-emerald-800/40 uppercase mb-2">Pesquisa</label>
            <input type="text" className="w-full bg-emerald-50/30 border border-emerald-50 rounded-xl p-3 text-xs font-bold" placeholder="Nome ou RE..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-emerald-100 print:shadow-none print:border-none print:overflow-visible">
        <table className="w-full text-left print:text-black">
          <thead className="bg-emerald-900 text-emerald-400 font-black uppercase text-[9px] tracking-[0.2em] print:bg-emerald-100 print:text-black print:border-b-2 print:border-emerald-900">
            <tr>
              <th className="px-8 py-6">Empresa</th>
              <th className="px-8 py-6">Colaborador</th>
              <th className="px-8 py-6">Situação</th>
              <th className="px-8 py-6">Curso / Setor</th>
              <th className="px-8 py-6">Vencimento</th>
              <th className="px-8 py-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50 print:divide-gray-200">
            {reportData.map((item, idx) => (
              <tr key={idx} className="sst-table-row print:break-inside-avoid">
                <td className="px-8 py-5 text-[9px] font-black">{item.employee.company}</td>
                <td className="px-8 py-5">
                  <p className="font-black text-emerald-950 text-sm print:text-black">{item.employee.name}</p>
                  <p className="text-[9px] text-emerald-600/60 font-black">RE: {item.employee.registration}</p>
                </td>
                <td className="px-8 py-5">
                   <span className={`px-2 py-1 rounded text-[7px] font-black uppercase ${SITUATION_CONFIG[item.employee.situation].bg} ${SITUATION_CONFIG[item.employee.situation].text} border border-current`}>
                    {SITUATION_CONFIG[item.employee.situation].label}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <p className="font-black text-emerald-700 text-sm italic print:text-black">{item.courseId}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">{item.employee.setor}</p>
                </td>
                <td className="px-8 py-5 text-xs font-black">
                  {item.record.expiryDate ? new Date(item.record.expiryDate).toLocaleDateString('pt-BR') : '---'}
                </td>
                <td className="px-8 py-5">
                  <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest ${STATUS_CONFIG[item.record.status].bg} ${STATUS_CONFIG[item.record.status].text} print:border print:border-gray-300`}>
                    {STATUS_CONFIG[item.record.status].label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hidden print:block mt-12 pt-8 border-t-2 border-emerald-900 text-center">
         <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.5em]">Fim do Relatório • ControlSST Gestão Normativa</p>
      </div>
    </div>
  );
};

export default Reports;
