
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Employee, TrainingRecord, TrainingStatus } from '../types';
import { getDaysRemaining } from '../utils/calculations';
import { STATUS_CONFIG, NR_COURSES } from '../constants';

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
  const [detailModal, setDetailModal] = useState<{ label: string, status?: TrainingStatus | 'PENDING' | 'RECENT', data: any[] } | null>(null);

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
        { name: 'Válidos', value: s.trained, color: '#10B981', status: 'VALID' },
        { name: 'Vencendo', value: s.expiring, color: '#F59E0B', status: 'EXPIRING' },
        { name: 'Vencidos', value: s.expired, color: '#EF4444', status: 'EXPIRED' }
      ],
      filteredCount: filtered.length
    };
  }, [employees, selectedCompany]);

  const companies = useMemo(() => ['Todas', ...Array.from(new Set(employees.map(e => e.company)))], [employees]);

  // Handler unificado para abrir o balão de detalhes
  const handleDetailView = (type: 'EXPIRED' | 'EXPIRING' | 'VALID' | 'CRITICAL_15' | 'ALERT_60' | 'RECENT_30') => {
    const issuesBySector: Record<string, any[]> = {};
    const filtered = selectedCompany === 'Todas' ? employees : employees.filter(e => e.company === selectedCompany);

    let modalLabel = '';
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    filtered.forEach(emp => {
      Object.entries(emp.trainings).forEach(([cid, r]) => {
        const record = r as TrainingRecord;
        const days = getDaysRemaining(record.expiryDate);
        let match = false;

        switch(type) {
          case 'EXPIRED': if (record.status === 'EXPIRED') { match = true; modalLabel = 'Cursos Vencidos'; } break;
          case 'EXPIRING': if (record.status === 'EXPIRING') { match = true; modalLabel = 'Cursos em Vencimento'; } break;
          case 'VALID': if (record.status === 'VALID') { match = true; modalLabel = 'Cursos Válidos'; } break;
          case 'CRITICAL_15': if (record.status === 'EXPIRING' && days !== null && days <= 15) { match = true; modalLabel = 'Crítico (Até 15 dias)'; } break;
          case 'ALERT_60': if (record.status === 'EXPIRING' && days !== null && days <= 60) { match = true; modalLabel = 'Alerta (Até 60 dias)'; } break;
          case 'RECENT_30': 
            if (record.completionDate) {
              const compDate = new Date(record.completionDate);
              if (compDate >= thirtyDaysAgo) { match = true; modalLabel = 'Realizados (Últimos 30 dias)'; }
            }
            break;
        }

        if (match) {
          const sec = (emp.setor || 'Geral').trim();
          if (!issuesBySector[sec]) issuesBySector[sec] = [];
          
          const courseInfo = NR_COURSES.find(c => c.id === cid);
          issuesBySector[sec].push({
            name: emp.name,
            reg: emp.registration,
            role: emp.role || '-',
            courseId: cid,
            courseName: courseInfo?.name || cid,
            completion: record.completionDate,
            expiry: record.expiryDate,
            days: days,
            isCipero: ['VALID', 'EXPIRING'].includes(emp.trainings['NR05']?.status),
            isBrigadista: ['VALID', 'EXPIRING'].includes(emp.trainings['NR23']?.status)
          });
        }
      });
    });

    setDetailModal({ 
      label: modalLabel,
      status: type.includes('CRITICAL') || type.includes('ALERT') ? 'EXPIRING' : (type.includes('RECENT') ? 'VALID' : type as any),
      data: Object.entries(issuesBySector).map(([sector, list]) => ({ sector, list })) 
    });
  };

  const handlePieClick = (data: any) => {
    const status = data.status || data.payload?.status;
    if (status) handleDetailView(status);
  };

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

      {/* CARDS INDICADORES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button onClick={() => handleDetailView('CRITICAL_15')} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-red-100 flex items-center gap-6 group hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 text-left w-full">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-xl group-hover:bg-red-500 group-hover:text-white transition-colors flex-shrink-0 shadow-inner">🚨</div>
          <div className="overflow-hidden"><p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest truncate">Crítico (15 dias)</p><h4 className="text-3xl font-black text-red-600 tracking-tighter leading-none mt-1">{stats.s.expiring15}</h4></div>
        </button>
        <button onClick={() => handleDetailView('ALERT_60')} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-amber-100 flex items-center gap-6 group hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 text-left w-full">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-xl group-hover:bg-amber-500 group-hover:text-white transition-colors flex-shrink-0 shadow-inner">⏳</div>
          <div className="overflow-hidden"><p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest truncate">Alerta (60 dias)</p><h4 className="text-3xl font-black text-amber-500 tracking-tighter leading-none mt-1">{stats.s.expiring60}</h4></div>
        </button>
        <button onClick={() => handleDetailView('RECENT_30')} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-emerald-100 flex items-center gap-6 group hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 text-left w-full">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors flex-shrink-0 shadow-inner">🔥</div>
          <div className="overflow-hidden"><p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest truncate">Realizados (30 dias)</p><h4 className="text-3xl font-black text-emerald-600 tracking-tighter leading-none mt-1">{stats.s.recentTrainings}</h4></div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm border border-emerald-100 overflow-hidden hover:shadow-xl transition-shadow relative group">
           <h3 className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest mb-6 text-center">Saúde Normativa Global</h3>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" onClick={(data) => handlePieClick(data)} className="cursor-pointer">
                  {stats.statusData.map((e, i) => <Cell key={i} fill={e.color} stroke="#fff" strokeWidth={4} className="hover:opacity-80 transition-opacity" />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
           </div>
        </div>

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

      {/* MODAL DE DETALHES COM TAGS C E B */}
      {detailModal && (
        <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-xl z-[1200] flex items-center justify-center p-4 md:p-8 overflow-y-auto no-print">
          <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] animate-fadeIn border border-emerald-100">
            <header className="p-8 border-b border-emerald-50 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10 rounded-t-[3rem]">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${detailModal.status ? STATUS_CONFIG[detailModal.status]?.bg : 'bg-emerald-50'}`}>
                   {detailModal.label.includes('Crítico') || detailModal.label.includes('Alerta') ? '⏳' : detailModal.label.includes('Vencido') ? '🚨' : '✅'}
                </div>
                <div><h3 className="text-xl md:text-2xl font-black text-emerald-900 italic tracking-tighter leading-none">{detailModal.label}</h3><p className="text-[9px] font-bold text-emerald-700/40 uppercase tracking-widest mt-2 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>Relatório Detalhado</p></div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => window.print()} className="bg-emerald-900 text-emerald-400 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-800 transition-all shadow-xl active:scale-95 flex items-center gap-2"><span>IMPRIMIR RELATÓRIO</span><span>🖨️</span></button>
                <button onClick={() => setDetailModal(null)} className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all text-xl active:scale-90">✕</button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-12">
              {detailModal.data.map((sec, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="flex items-center gap-4 border-b border-emerald-100 pb-2"><h4 className="text-[14px] font-black text-emerald-800 uppercase tracking-widest italic">{sec.sector}</h4><span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black shadow-sm">{sec.list.length} ocorrências</span></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sec.list.map((item: any, i: number) => (
                      <div key={i} className="bg-emerald-50/20 border border-emerald-100 p-6 rounded-[2.5rem] flex flex-col justify-between group hover:bg-white hover:shadow-xl hover:border-emerald-300 transition-all cursor-default">
                        <div className="mb-4">
                           <div className="flex items-start justify-between">
                              <p className="text-sm font-black text-emerald-950 uppercase leading-tight mb-2 pr-10">{item.name}</p>
                              <div className="flex gap-1">
                                {item.isCipero && <span className="w-6 h-6 bg-emerald-500 text-white rounded-md flex items-center justify-center text-[10px] font-black shadow-sm">C</span>}
                                {item.isBrigadista && <span className="w-6 h-6 bg-red-500 text-white rounded-md flex items-center justify-center text-[10px] font-black shadow-sm">B</span>}
                              </div>
                           </div>
                           <div className="flex flex-col gap-1">
                              <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest">RE: {item.reg}</p>
                              <p className="text-[10px] font-black text-emerald-800/80 uppercase tracking-tighter">Função: <span className="text-emerald-600 italic">{item.role}</span></p>
                           </div>
                        </div>
                        <div className="pt-4 border-t border-emerald-50/50">
                           <div className="flex justify-between items-start">
                              <div className="flex flex-col gap-1"><span className="text-[10px] font-black text-emerald-600 italic bg-emerald-50 px-2 py-1 rounded-lg w-fit">{item.courseId}</span><span className="text-[8px] font-bold text-gray-400 uppercase leading-none max-w-[120px]">{item.courseName}</span></div>
                              <div className="text-right"><p className="text-[10px] font-black text-emerald-900 leading-none">Venc: {item.expiry ? new Date(item.expiry).toLocaleDateString('pt-BR') : '--/--/--'}</p><p className={`text-[8px] font-black uppercase mt-1 ${item.days < 0 ? 'text-red-500' : 'text-amber-500'}`}>{item.days !== null ? (item.days < 0 ? `Expirado (${Math.abs(item.days)}d)` : `${item.days} dias restantes`) : 'N/A'}</p></div>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
