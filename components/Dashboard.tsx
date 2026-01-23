
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Employee, TrainingRecord } from '../types';
import { getDaysRemaining } from '../utils/calculations';

interface DashboardProps {
  employees: Employee[];
  isAdmin: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-emerald-100 min-w-[180px] animate-fadeIn">
        <p className="font-black text-emerald-900 mb-2 text-[10px] uppercase tracking-wider">{label || payload[0].name}</p>
        <div className="space-y-1">
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex justify-between items-center gap-4">
              <span className="font-bold text-emerald-800/40 text-[9px] uppercase">{p.name}</span>
              <span className="font-black text-emerald-600 text-sm" style={{ color: p.color || p.fill }}>{p.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ employees, isAdmin }) => {
  const [selectedCompany, setSelectedCompany] = useState<string>('Todas');

  const stats = useMemo(() => {
    const s = { 
      trained: 0, 
      expiring: 0, 
      expired: 0,
      expiring15: 0,
      expiring60: 0,
      recentTrainings: 0
    };
    
    const sectorMap: Record<string, { total: number, compliant: number }> = {};
    const filtered = selectedCompany === 'Todas' ? employees : employees.filter(e => e.company === selectedCompany);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    filtered.forEach(emp => {
      const sectorName = (emp.setor || 'Geral').trim();
      if (!sectorMap[sectorName]) sectorMap[sectorName] = { total: 0, compliant: 0 };
      sectorMap[sectorName].total++;

      let hasValidTraining = false;

      Object.entries(emp.trainings || {}).forEach(([_, t]) => {
        const record = t as TrainingRecord;
        const days = getDaysRemaining(record.expiryDate);

        if (record.status === 'VALID') {
          s.trained++;
          hasValidTraining = true;
        } else if (record.status === 'EXPIRING') {
          s.expiring++;
          hasValidTraining = true;
          if (days !== null && days <= 15) s.expiring15++;
          if (days !== null && days <= 60) s.expiring60++;
        } else if (record.status === 'EXPIRED') {
          s.expired++;
        }

        if (record.completionDate) {
          const compDate = new Date(record.completionDate);
          if (compDate >= thirtyDaysAgo) s.recentTrainings++;
        }
      });

      if (hasValidTraining) {
        sectorMap[sectorName].compliant++;
      }
    });

    return { 
      s, 
      sectorData: Object.entries(sectorMap).map(([name, data]) => ({ 
        name, 
        Total: data.total, 
        Capacitados: data.compliant 
      })).sort((a, b) => b.Total - a.Total),
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
    <div className="space-y-8 pb-20 animate-fadeIn overflow-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-emerald-900 tracking-tighter italic">
            Dashboard <span className="text-emerald-600">Analytics</span>
          </h2>
          <p className="text-emerald-800/40 font-bold uppercase text-[8px] md:text-[10px] tracking-[0.2em] mt-1 italic">Gestão Inteligente de SST</p>
        </div>
        <div className="bg-white p-2 rounded-2xl border border-emerald-100 shadow-sm w-full md:w-auto">
          <select 
            value={selectedCompany} 
            onChange={(e) => setSelectedCompany(e.target.value)} 
            className="w-full bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black outline-none border-none cursor-pointer hover:bg-emerald-100 transition-colors"
          >
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </header>

      {/* CARDS DE INDICADORES PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-red-100 flex items-center gap-6 group hover:shadow-lg hover:-translate-y-1 transition-all active:scale-95 cursor-default">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-xl group-hover:bg-red-500 group-hover:text-white transition-colors">🚨</div>
          <div>
            <p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest">Crítico (15 dias)</p>
            <h4 className="text-3xl font-black text-red-600 tracking-tighter">{stats.s.expiring15}</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-amber-100 flex items-center gap-6 group hover:shadow-lg hover:-translate-y-1 transition-all active:scale-95 cursor-default">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">⏳</div>
          <div>
            <p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest">Alerta (60 dias)</p>
            <h4 className="text-3xl font-black text-amber-500 tracking-tighter">{stats.s.expiring60}</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-emerald-100 flex items-center gap-6 group hover:shadow-lg hover:-translate-y-1 transition-all active:scale-95 cursor-default">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">🔥</div>
          <div>
            <p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest">Realizados (30 dias)</p>
            <h4 className="text-3xl font-black text-emerald-600 tracking-tighter">{stats.s.recentTrainings}</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GRÁFICO DE STATUS GLOBAL */}
        <div className="bg-white p-8 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm border border-emerald-100 overflow-hidden hover:shadow-xl transition-shadow">
           <h3 className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest mb-6 text-center">Saúde Normativa Global</h3>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                  {stats.statusData.map((e, i) => <Cell key={i} fill={e.color} stroke="#fff" strokeWidth={4} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
           </div>
        </div>

        {/* GRÁFICO DE CONFORMIDADE POR SETOR */}
        <div className="bg-white p-8 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm border border-emerald-100 overflow-hidden hover:shadow-xl transition-shadow">
           <h3 className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest mb-6 text-center">Efetivo Capacitado por Setor</h3>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={stats.sectorData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#1e293b' }} width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', paddingBottom: '20px' }} />
                <Bar dataKey="Total" fill="#e2e8f0" radius={[0, 10, 10, 0]} barSize={12} name="Total Equipe" />
                <Bar dataKey="Capacitados" fill="#10b981" radius={[0, 10, 10, 0]} barSize={12} name="Com Curso Válido" />
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* RESUMO DE CARDS INFERIORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Cursos Ativos', val: stats.s.trained, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '✅' },
          { label: 'Total Em Vencimento', val: stats.s.expiring, color: 'text-amber-500', bg: 'bg-amber-50', icon: '⏳' },
          { label: 'Total Cursos Expirados', val: stats.s.expired, color: 'text-red-600', bg: 'bg-red-50', icon: '🚨' },
          { label: 'Total Efetivo', val: stats.filteredCount, color: 'text-emerald-700', bg: 'bg-emerald-100/50', icon: '👷' },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-emerald-100 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95">
            <div className="flex justify-between items-center">
              <span className={`text-xl p-3 rounded-2xl ${item.bg} shadow-inner`}>{item.icon}</span>
              <span className={`text-3xl font-black tracking-tighter ${item.color}`}>{item.val}</span>
            </div>
            <p className="mt-4 text-[9px] font-black text-emerald-800/40 uppercase tracking-widest leading-none">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
