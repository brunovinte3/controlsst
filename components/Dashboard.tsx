
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Employee, TrainingRecord, TrainingStatus } from '../types';
import { getDaysRemaining } from '../utils/calculations';
import { STATUS_CONFIG, NR_COURSES, DEPT_COLORS } from '../constants';

interface DashboardProps {
  employees: Employee[];
  isAdmin: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 dark:bg-emerald-950/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-emerald-100 dark:border-emerald-800 min-w-[180px] animate-fadeIn">
        <p className="font-black text-emerald-900 dark:text-emerald-400 mb-2 text-[10px] uppercase tracking-wider">
          {label || data.id || data.name}
        </p>
        <div className="space-y-1">
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex justify-between items-center gap-4">
              <span className="font-bold text-emerald-800/40 dark:text-emerald-400/40 text-[9px] uppercase">{p.name}</span>
              <span className="font-black text-emerald-600 text-sm" style={{ color: p.color || p.fill }}>
                {p.dataKey === 'value' ? `${p.value}%` : p.value}
              </span>
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
  const [detailModal, setDetailModal] = useState<{ 
    label: string, 
    data: any[], 
    type: string, 
    targetCourse?: string 
  } | null>(null);

  const stats = useMemo(() => {
    const s = { 
      trained: 0, 
      expiring: 0, 
      expired: 0,
      expiring15: 0,
      expiring60: 0,
      recentTrainings: 0,
      ciperos: 0,
      brigadistas: 0
    };
    
    const sectorMap: Record<string, { total: number, compliant: number }> = {};
    const companyMap: Record<string, { total: number, compliant: number }> = {};
    const nrExpiringMap: Record<string, number> = {};

    const filtered = selectedCompany === 'Todas' ? employees : employees.filter(e => e.company === selectedCompany);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    filtered.forEach(emp => {
      const sectorName = (emp.setor || 'Geral').trim();
      const compName = (emp.company || 'Padrão').trim();

      if (!sectorMap[sectorName]) sectorMap[sectorName] = { total: 0, compliant: 0 };
      if (!companyMap[compName]) companyMap[compName] = { total: 0, compliant: 0 };
      
      sectorMap[sectorName].total++;
      companyMap[compName].total++;

      let hasValidTraining = false;

      // Lógica Especial: Se for CONDOMINIO A, CIPA = NR31.5 (CIPATR), senão CIPA = NR05
      const cipaKey = emp.company === 'CONDOMINIO A' ? 'NR315' : 'NR05';
      const cipaRecord = emp.trainings[cipaKey];
      if (cipaRecord && ['VALID', 'EXPIRING'].includes(cipaRecord.status)) s.ciperos++;

      // Brigada sempre NR23
      const brigadaRecord = emp.trainings['NR23'];
      if (brigadaRecord && ['VALID', 'EXPIRING'].includes(brigadaRecord.status)) s.brigadistas++;

      Object.entries(emp.trainings || {}).forEach(([cid, t]) => {
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
          
          nrExpiringMap[cid] = (nrExpiringMap[cid] || 0) + 1;
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
        companyMap[compName].compliant++;
      }
    });

    return { 
      s, 
      sectorData: Object.entries(sectorMap).map(([name, data]) => ({ 
        name, 
        Total: data.total, 
        Capacitados: data.compliant 
      })).sort((a, b) => b.Total - a.Total),
      companyData: Object.entries(companyMap).map(([name, data]) => ({
        name,
        value: Math.round((data.compliant / data.total) * 100)
      })),
      nrData: Object.entries(nrExpiringMap).map(([id, count]) => ({
        id,
        Proximos: count
      })).sort((a, b) => b.Proximos - a.Proximos).slice(0, 5),
    };
  }, [employees, selectedCompany]);

  const companies = useMemo(() => ['Todas', ...Array.from(new Set(employees.map(e => e.company)))], [employees]);

  const handleDetailView = (type: string, courseId?: string) => {
    const issuesBySector: Record<string, any[]> = {};
    const filtered = selectedCompany === 'Todas' ? employees : employees.filter(e => e.company === selectedCompany);

    let modalLabel = '';
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    filtered.forEach(emp => {
      let matchingCourses: any[] = [];
      let matchFound = false;

      if (type === 'CIPEROS') {
        const cipaKey = emp.company === 'CONDOMINIO A' ? 'NR315' : 'NR05';
        const record = emp.trainings[cipaKey];
        if (record && ['VALID', 'EXPIRING'].includes(record.status)) {
          matchFound = true;
          modalLabel = emp.company === 'CONDOMINIO A' ? 'CIPATR ATIVOS (NR 31.5)' : 'MEMBROS DA CIPA (NR 05)';
          matchingCourses.push({ cid: cipaKey, record });
        }
      } else if (type === 'BRIGADISTAS') {
        const record = emp.trainings['NR23'];
        if (record && ['VALID', 'EXPIRING'].includes(record.status)) {
          matchFound = true;
          modalLabel = 'BRIGADISTAS ATIVOS (NR 23)';
          matchingCourses.push({ cid: 'NR23', record });
        }
      } else if (courseId) {
        const record = emp.trainings[courseId];
        if (record && record.status === 'EXPIRING') {
          matchFound = true;
          modalLabel = `VENCIMENTOS PRÓXIMOS (60 DIAS): ${courseId}`;
          matchingCourses.push({ cid: courseId, record, days: getDaysRemaining(record.expiryDate) });
        }
      } else {
        Object.entries(emp.trainings).forEach(([cid, r]) => {
          const record = r as TrainingRecord;
          const days = getDaysRemaining(record.expiryDate);
          let match = false;
          switch(type) {
            case 'EXPIRED': if (record.status === 'EXPIRED') { match = true; modalLabel = 'CURSOS VENCIDOS'; } break;
            case 'EXPIRING': if (record.status === 'EXPIRING') { match = true; modalLabel = 'CURSOS EM VENCIMENTO'; } break;
            case 'CRITICAL_15': if (record.status === 'EXPIRING' && days !== null && days <= 15) { match = true; modalLabel = 'CRÍTICO EM 15 DIAS'; } break;
            case 'ALERT_60': if (record.status === 'EXPIRING' && days !== null && days <= 60) { match = true; modalLabel = 'ALERTA EM 60 DIAS'; } break;
            case 'RECENT_30': 
              if (record.completionDate) {
                const compDate = new Date(record.completionDate);
                if (compDate >= thirtyDaysAgo) { match = true; modalLabel = 'REALIZADOS (ÚLTIMOS 30 DIAS)'; }
              }
              break;
          }
          if (match) matchingCourses.push({ cid, record, days });
        });
      }

      if (matchingCourses.length > 0) {
        const sec = (emp.setor || 'Geral').trim();
        if (!issuesBySector[sec]) issuesBySector[sec] = [];
        issuesBySector[sec].push({
          name: emp.name,
          reg: emp.registration,
          role: emp.role || '-',
          setor: emp.setor || '-',
          courses: matchingCourses
        });
      }
    });

    setDetailModal({ 
      label: modalLabel,
      type,
      targetCourse: courseId,
      data: Object.entries(issuesBySector).map(([sector, list]) => ({ sector, list })) 
    });
  };

  const isCipaLabel = selectedCompany === 'CONDOMINIO A' ? 'CIPATR' : 'CIPA';

  return (
    <div className="space-y-8 pb-20 animate-fadeIn overflow-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-emerald-900 dark:text-emerald-400 tracking-tighter italic">
            Dashboard <span className="text-emerald-600">Analytics</span>
          </h2>
          <p className="text-emerald-800/40 dark:text-emerald-500/50 font-bold uppercase text-[8px] md:text-[10px] tracking-[0.2em] mt-1 italic">Gestão Inteligente de SST</p>
        </div>
        <div className="bg-white dark:bg-emerald-900/20 p-2 rounded-2xl border border-emerald-100 dark:border-emerald-800 shadow-sm w-full md:w-auto">
          <select 
            value={selectedCompany} 
            onChange={(e) => setSelectedCompany(e.target.value)} 
            className="w-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl text-xs font-black outline-none border-none cursor-pointer"
          >
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </header>

      {/* CARDS INDICADORES */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 no-print">
        <button onClick={() => handleDetailView('CRITICAL_15')} className="bg-white dark:bg-emerald-900/10 p-5 rounded-[2rem] border border-red-100 dark:border-red-900/30 flex flex-col gap-2 group hover:shadow-xl transition-all text-left">
          <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-lg group-hover:bg-red-500 group-hover:text-white transition-all">🚨</div>
          <p className="text-[8px] font-black text-emerald-800/40 dark:text-emerald-500/50 uppercase tracking-widest leading-none">CRÍTICO EM 15 DIAS</p>
          <h4 className="text-2xl font-black text-red-600 leading-none mt-1">{stats.s.expiring15}</h4>
        </button>
        <button onClick={() => handleDetailView('ALERT_60')} className="bg-white dark:bg-emerald-900/10 p-5 rounded-[2rem] border border-amber-100 dark:border-amber-900/30 flex flex-col gap-2 group hover:shadow-xl transition-all text-left">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-lg group-hover:bg-amber-500 group-hover:text-white transition-all">⏳</div>
          <p className="text-[8px] font-black text-emerald-800/40 dark:text-emerald-500/50 uppercase tracking-widest leading-none">ALERTA EM 60 DIAS</p>
          <h4 className="text-2xl font-black text-amber-500 leading-none mt-1">{stats.s.expiring60}</h4>
        </button>
        <button onClick={() => handleDetailView('CIPEROS')} className="bg-white dark:bg-emerald-900/10 p-5 rounded-[2rem] border border-emerald-100 dark:border-emerald-800/30 flex flex-col gap-2 group hover:shadow-xl transition-all text-left">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-lg group-hover:bg-emerald-500 group-hover:text-white transition-all font-black text-sm">C</div>
          <p className="text-[8px] font-black text-emerald-800/40 dark:text-emerald-500/50 uppercase tracking-widest leading-none">{isCipaLabel}</p>
          <h4 className="text-2xl font-black text-emerald-600 leading-none mt-1">{stats.s.ciperos}</h4>
        </button>
        <button onClick={() => handleDetailView('BRIGADISTAS')} className="bg-white dark:bg-emerald-900/10 p-5 rounded-[2rem] border border-red-100 dark:border-red-900/30 flex flex-col gap-2 group hover:shadow-xl transition-all text-left">
          <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-lg group-hover:bg-red-500 group-hover:text-white transition-all font-black text-sm">B</div>
          <p className="text-[8px] font-black text-emerald-800/40 dark:text-emerald-500/50 uppercase tracking-widest leading-none">BRIGADA</p>
          <h4 className="text-2xl font-black text-red-500 leading-none mt-1">{stats.s.brigadistas}</h4>
        </button>
        <button onClick={() => handleDetailView('RECENT_30')} className="hidden lg:flex bg-white dark:bg-emerald-900/10 p-5 rounded-[2rem] border border-emerald-100 dark:border-emerald-800/30 flex-col gap-2 group hover:shadow-xl transition-all text-left">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-lg group-hover:bg-emerald-500 group-hover:text-white transition-all">🔥</div>
          <p className="text-[8px] font-black text-emerald-800/40 dark:text-emerald-500/50 uppercase tracking-widest leading-none">Recentes</p>
          <h4 className="text-2xl font-black text-emerald-600 leading-none mt-1">{stats.s.recentTrainings}</h4>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
        <div className="bg-white dark:bg-emerald-950/40 p-8 rounded-[3rem] border border-emerald-100 dark:border-emerald-800 shadow-sm relative group overflow-hidden">
           <h3 className="text-[10px] font-black text-emerald-800/40 dark:text-emerald-400/40 uppercase tracking-widest mb-6 italic">Capacitação por Unidade (%)</h3>
           <div className="h-[280px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={stats.companyData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={90}
                   paddingAngle={5}
                   dataKey="value"
                   nameKey="name"
                   label={({name, value}) => `${name}: ${value}%`}
                 >
                   {stats.companyData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip content={<CustomTooltip />} />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white dark:bg-emerald-950/40 p-8 rounded-[3rem] border border-emerald-100 dark:border-emerald-800 shadow-sm relative group overflow-hidden">
           <div className="flex justify-between items-start mb-6">
              <h3 className="text-[10px] font-black text-emerald-800/40 dark:text-emerald-400/40 uppercase tracking-widest italic">PRÓXIMAS NRS COM VENCIMENTO EM 60 DIAS</h3>
              <span className="text-[8px] font-bold text-emerald-500/50 uppercase tracking-widest animate-pulse">Clique na Barra 👆</span>
           </div>
           <div className="h-[280px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart 
                  layout="vertical" 
                  data={stats.nrData}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload.length > 0) {
                      handleDetailView('NR_SPECIFIC', data.activePayload[0].payload.id);
                    }
                  }}
               >
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#10b98110" />
                 <XAxis type="number" hide />
                 <YAxis dataKey="id" type="category" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900}} />
                 <Tooltip content={<CustomTooltip />} />
                 <Bar 
                    dataKey="Proximos" 
                    fill="#F59E0B" 
                    radius={[0, 10, 10, 0]} 
                    barSize={15} 
                    className="cursor-pointer hover:fill-emerald-600 transition-colors"
                  />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-emerald-950/40 p-8 rounded-[3rem] border border-emerald-100 dark:border-emerald-800 shadow-sm no-print">
         <h3 className="text-[10px] font-black text-emerald-800/40 dark:text-emerald-400/40 uppercase tracking-widest mb-6 text-center italic">Efetivo Capacitado por Setor</h3>
         <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={stats.sectorData}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900 }} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Total" fill="#e2e8f0" radius={[0, 10, 10, 0]} barSize={10} />
              <Bar dataKey="Capacitados" fill="#10b981" radius={[0, 10, 10, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
         </div>
      </div>

      {/* MODAL DETALHES - CUSTOMIZADO PARA CIPA/BRIGADA/NR INTERATIVA */}
      {detailModal && (
        <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-xl z-[1500] flex items-center justify-center p-4 print:relative print:p-0 print:bg-white print:block">
          <div className="bg-white dark:bg-emerald-950 w-full max-w-5xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] border border-emerald-100 dark:border-emerald-800 print:max-h-none print:shadow-none print:border-none print:static print:w-full">
             <header className="p-8 border-b dark:border-emerald-800 flex justify-between items-center bg-white dark:bg-emerald-950 sticky top-0 z-10 rounded-t-[3rem] no-print">
                <div>
                  <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-400 italic">{detailModal.label}</h3>
                  <p className="text-[8px] font-black text-emerald-800/40 dark:text-emerald-400/40 uppercase tracking-widest mt-1 italic">Detalhamento para Auditoria e Planejamento</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => { setTimeout(() => window.print(), 100); }} 
                    className="px-6 py-3 bg-emerald-700 text-emerald-400 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-900 transition-all flex items-center gap-2"
                  >
                    🖨️ IMPRIMIR LISTA
                  </button>
                  <button onClick={() => setDetailModal(null)} className="w-12 h-12 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full hover:bg-red-500 transition-all">✕</button>
                </div>
             </header>

             {/* Cabeçalho de Impressão */}
             <div className="hidden print:block p-10 border-b-4 border-emerald-900 mb-8 bg-emerald-50">
                <div className="flex justify-between items-center mb-6">
                   <h1 className="text-4xl font-black uppercase italic text-emerald-900 tracking-tighter">ControlSST Analytics</h1>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Relatório</p>
                      <p className="text-xl font-black uppercase italic text-emerald-950 leading-none">{detailModal.label}</p>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Filtro: {selectedCompany}</p>
                   <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Data: {new Date().toLocaleString()}</p>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar print:overflow-visible print:p-0">
                {detailModal.data.map((sec, idx) => (
                  <div key={idx} className="space-y-4 print:break-inside-avoid mb-10">
                    <div className="border-b-2 dark:border-emerald-800 pb-2 flex items-center justify-between print:border-emerald-900">
                      <h4 className="font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest italic print:text-emerald-900">{sec.sector}</h4>
                      <span className="text-[10px] font-black text-emerald-500 opacity-50">{sec.list.length} Registros</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-1">
                      {sec.list.map((item: any, i: number) => (
                        <div key={i} className="bg-emerald-50/20 dark:bg-emerald-900/10 border dark:border-emerald-800/30 p-5 rounded-3xl flex justify-between items-center group transition-all print:border-gray-200 print:bg-white print:rounded-none print:border-b print:p-4">
                          <div className="flex-1">
                            <p className="text-xs font-black text-emerald-950 dark:text-white uppercase leading-tight">{item.name}</p>
                            
                            {/* Visual simplificado para CIPA e BRIGADA conforme solicitado */}
                            {(detailModal.type === 'CIPEROS' || detailModal.type === 'BRIGADISTAS') ? (
                              <div className="grid grid-cols-2 mt-2 gap-y-1">
                                 <p className="text-[8px] font-bold text-emerald-600/60 uppercase tracking-widest">MATRICULA: <span className="text-emerald-800 dark:text-emerald-300">{item.reg}</span></p>
                                 <p className="text-[8px] font-bold text-emerald-600/60 uppercase tracking-widest text-right">SETOR: <span className="text-emerald-800 dark:text-emerald-300">{item.setor}</span></p>
                                 <p className="text-[8px] font-bold text-emerald-600/60 uppercase tracking-widest col-span-2">FUNÇÃO: <span className="text-emerald-800 dark:text-emerald-300">{item.role}</span></p>
                                 {item.courses.map((c: any) => (
                                   <p key={c.cid} className="text-[8px] font-black text-emerald-700 uppercase col-span-2 mt-1">
                                      VALIDADE {detailModal.type === 'CIPEROS' ? 'CIPEIRO' : 'BRIGADISTA'}: {c.record.expiryDate ? new Date(c.record.expiryDate).toLocaleDateString('pt-BR') : '---'}
                                   </p>
                                 ))}
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 mt-2 gap-y-1">
                                 <p className="text-[8px] font-bold text-emerald-600/60 uppercase tracking-widest">MAT: <span className="text-emerald-800 dark:text-emerald-300">{item.reg}</span></p>
                                 <p className="text-[8px] font-bold text-emerald-600/60 uppercase tracking-widest text-right">SET: <span className="text-emerald-800 dark:text-emerald-300">{item.setor}</span></p>
                                 <p className="text-[8px] font-bold text-emerald-600/60 uppercase tracking-widest col-span-2">FUN: <span className="text-emerald-800 dark:text-emerald-300">{item.role}</span></p>
                                 <div className="flex flex-wrap gap-1 mt-3">
                                  {item.courses.map((c: any) => (
                                    <span key={c.cid} className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${c.record.status === 'EXPIRED' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300'}`}>
                                      {c.cid}: VENC. {c.record.expiryDate ? new Date(c.record.expiryDate).toLocaleDateString('pt-BR') : '---'}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {(detailModal.type === 'CIPEROS' || detailModal.type === 'BRIGADISTAS') && (
                            <div className="ml-4">
                               <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-lg ${detailModal.type === 'CIPEROS' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                 {detailModal.type === 'CIPEROS' ? 'C' : 'B'}
                               </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
             
             <footer className="hidden print:block p-8 border-t-2 border-emerald-900 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest bg-emerald-50">
                SISTEMA DE GESTÃO NORMATIVA SST CLOUD - DOCUMENTO PARA USO INTERNO
             </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
