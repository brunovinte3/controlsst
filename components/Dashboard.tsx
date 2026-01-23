
import React, { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Employee, TrainingRecord } from '../types';
import { getDeptColor } from '../constants';

interface DashboardProps {
  employees: Employee[];
  isAdmin: boolean;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-gray-100 min-w-[180px] animate-fadeIn">
        <p className="font-black text-gray-900 mb-2 text-[10px] uppercase tracking-wider">{payload[0].name}</p>
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-500 text-[10px] uppercase">Total</span>
          <span className="font-black text-emerald-600 text-lg">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ employees, isAdmin }) => {
  const [selectedCompany, setSelectedCompany] = useState<string>('Todas');

  const stats = useMemo(() => {
    const s = { trained: 0, expiring: 0, expired: 0 };
    const setorStats: Record<string, number> = {};
    const filtered = selectedCompany === 'Todas' ? employees : employees.filter(e => e.company === selectedCompany);

    filtered.forEach(emp => {
      // Contador de setores
      const setorNome = emp.setor || 'Não Definido';
      setorStats[setorNome] = (setorStats[setorNome] || 0) + 1;

      // Contador de treinamentos
      Object.entries(emp.trainings || {}).forEach(([_, t]) => {
        const record = t as TrainingRecord;
        if (record.status === 'VALID') s.trained++;
        else if (record.status === 'EXPIRING') s.expiring++;
        else if (record.status === 'EXPIRED') s.expired++;
      });
    });

    return { 
      s, 
      setorData: Object.entries(setorStats).map(([name, value]) => ({ name, value })),
      statusData: [
        { name: 'Válidos', value: s.trained, color: '#10B981' },
        { name: 'Vencendo', value: s.expiring, color: '#F59E0B' },
        { name: 'Vencidos', value: s.expired, color: '#EF4444' }
      ],
      filteredCount: filtered.length
    };
  }, [employees, selectedCompany]);

  const companies = useMemo(() => ['Todas', ...Array.from(new Set(employees.map(e => e.company)))], [employees]);

  return (
    <div className="space-y-10 pb-20 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tighter italic">
            Dashboard <span className="text-emerald-600">Analytics</span>
          </h2>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 italic">Gestão Inteligente de SST</p>
        </div>
        <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black outline-none border-none">
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Cursos Válidos', val: stats.s.trained, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '✅' },
          { label: 'Em Reciclagem', val: stats.s.expiring, color: 'text-amber-500', bg: 'bg-amber-50', icon: '⏳' },
          { label: 'Cursos Vencidos', val: stats.s.expired, color: 'text-red-600', bg: 'bg-red-50', icon: '🚨' },
          { label: 'Colaboradores Ativos', val: stats.filteredCount, color: 'text-blue-600', bg: 'bg-blue-50', icon: '👷' },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 transition-all hover:scale-105">
            <div className="flex justify-between items-start">
              <span className={`text-2xl p-4 rounded-2xl ${item.bg}`}>{item.icon}</span>
              <span className={`text-5xl font-black tracking-tighter ${item.color}`}>{item.val}</span>
            </div>
            <p className="mt-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-gray-100">
           <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 text-center">Status Global dos Treinamentos</h3>
           <ResponsiveContainer width="100%" height={300}>
             <PieChart>
               <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                 {stats.statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
               </Pie>
               <Tooltip content={<CustomTooltip />} />
             </PieChart>
           </ResponsiveContainer>
        </div>
        <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-gray-100">
           <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 text-center">Colaboradores por Setor</h3>
           <ResponsiveContainer width="100%" height={300}>
             <PieChart>
               <Pie data={stats.setorData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" nameKey="name">
                 {stats.setorData.map((e, i) => <Cell key={i} fill={getDeptColor(e.name)} />)}
               </Pie>
               <Tooltip content={<CustomTooltip />} />
             </PieChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
