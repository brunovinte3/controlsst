
import React, { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Employee, TrainingRecord, TrainingPhoto } from '../types';
import { getDeptColor, NR_COURSES } from '../constants';
import { getDaysRemaining } from '../utils/calculations';
import { StorageService } from '../services/storage';

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
          <span className="font-bold text-gray-500 text-[10px] uppercase">Quantidade</span>
          <span className="font-black text-emerald-600 text-lg">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ employees, isAdmin }) => {
  const [selectedCompany, setSelectedCompany] = useState<string>('Todas');
  const [photos, setPhotos] = useState<TrainingPhoto[]>([]);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');

  useEffect(() => {
    StorageService.getTrainingPhotos().then(setPhotos);
  }, []);

  useEffect(() => {
    if (photos.length > 0) {
      const timer = setInterval(() => {
        setCurrentPhotoIdx(prev => (prev + 1) % photos.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [photos]);

  const stats = useMemo(() => {
    const s = { trained: 0, expiring: 0, expired: 0 };
    const deptStats: Record<string, number> = {};
    const alert15: any[] = [];
    const alert60: any[] = [];
    const recent: any[] = [];

    const filtered = selectedCompany === 'Todas' ? employees : employees.filter(e => e.company === selectedCompany);

    filtered.forEach(emp => {
      deptStats[emp.department] = (deptStats[emp.department] || 0) + 1;
      Object.entries(emp.trainings).forEach(([cid, t]) => {
        const record = t as TrainingRecord;
        const days = getDaysRemaining(record.expiryDate);
        if (record.completionDate) recent.push({ emp, cid, date: record.completionDate });
        if (record.status === 'VALID') s.trained++;
        else if (record.status === 'EXPIRING') {
          s.expiring++;
          if (days !== null && days <= 15) alert15.push({ emp, cid, days });
          else if (days !== null && days <= 60) alert60.push({ emp, cid, days });
        }
        else if (record.status === 'EXPIRED') s.expired++;
      });
    });

    recent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { 
      s, 
      deptData: Object.entries(deptStats).map(([name, value]) => ({ name, value })),
      statusData: [
        { name: 'Válidos', value: s.trained, color: '#10B981' },
        { name: 'Vencendo', value: s.expiring, color: '#F59E0B' },
        { name: 'Vencidos', value: s.expired, color: '#EF4444' }
      ],
      alert15, alert60,
      recent: recent.slice(0, 6),
      filteredCount: filtered.length
    };
  }, [employees, selectedCompany]);

  const handleAddPhoto = async () => {
    if (!newPhotoUrl) return;
    const newPhoto: TrainingPhoto = {
      id: `photo-${Date.now()}`,
      url: newPhotoUrl,
      caption: newPhotoCaption || 'Registro de Treinamento'
    };
    const updated = [...photos, newPhoto];
    setPhotos(updated);
    await StorageService.saveTrainingPhotos([newPhoto]);
    setNewPhotoUrl('');
    setNewPhotoCaption('');
  };

  const handleRemovePhoto = async (id: string) => {
    const updated = photos.filter(p => p.id !== id);
    setPhotos(updated);
    await StorageService.removeTrainingPhoto(id);
    if (currentPhotoIdx >= updated.length) setCurrentPhotoIdx(0);
  };

  const companies = useMemo(() => ['Todas', ...Array.from(new Set(employees.map(e => e.company)))], [employees]);

  return (
    <div className="space-y-10 pb-20 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tighter italic">
            Dashboard <span className="text-emerald-600">Analytics</span>
          </h2>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 italic">SST Intel Cloud Integration</p>
        </div>
        <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
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
          <div key={i} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <span className={`text-2xl p-4 rounded-2xl ${item.bg}`}>{item.icon}</span>
              <span className={`text-5xl font-black tracking-tighter ${item.color}`}>{item.val}</span>
            </div>
            <p className="mt-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-800">Galeria de <span className="text-emerald-600">Evidências</span></h3>
          {isAdmin && <button onClick={() => setIsPhotoModalOpen(true)} className="bg-emerald-50 text-emerald-700 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">✏️ Gerenciar Galeria</button>}
        </div>
        <div className="relative h-[300px] md:h-[450px] bg-emerald-50/30 rounded-[2.5rem] overflow-hidden shadow-inner">
          {photos.length > 0 ? (
            <>
              {photos.map((photo, idx) => (
                <div key={photo.id} className={`absolute inset-0 transition-all duration-1000 ${idx === currentPhotoIdx ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}>
                  <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80">
                    <p className="text-white font-black uppercase text-xs tracking-widest italic">{photo.caption}</p>
                  </div>
                </div>
              ))}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {photos.map((_, idx) => (
                  <button key={idx} onClick={() => setCurrentPhotoIdx(idx)} className={`w-2 h-2 rounded-full transition-all ${idx === currentPhotoIdx ? 'bg-emerald-400 w-8' : 'bg-white/40'}`} />
                ))}
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-emerald-900/20">
              <span className="text-6xl mb-4">📸</span>
              <p className="font-black uppercase text-[10px] tracking-[0.3em]">Aguardando registros do Supabase...</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-gray-100">
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
           <ResponsiveContainer width="100%" height={300}>
             <PieChart>
               <Pie data={stats.deptData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                 {stats.deptData.map((e, i) => <Cell key={i} fill={getDeptColor(e.name)} />)}
               </Pie>
               <Tooltip content={<CustomTooltip />} />
             </PieChart>
           </ResponsiveContainer>
        </div>
      </div>

      {isPhotoModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-8 space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-xl font-black uppercase tracking-tighter">Gerenciar Galeria Cloud</h3>
               <button onClick={() => setIsPhotoModalOpen(false)}>✕</button>
            </div>
            <div className="space-y-4">
               <input type="text" placeholder="URL da Imagem" className="w-full p-4 bg-gray-50 rounded-2xl" value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)} />
               <input type="text" placeholder="Legenda" className="w-full p-4 bg-gray-50 rounded-2xl" value={newPhotoCaption} onChange={e => setNewPhotoCaption(e.target.value)} />
               <button onClick={handleAddPhoto} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest">Adicionar ao Banco</button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
               {photos.map(p => (
                 <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                   <p className="text-[10px] font-black truncate max-w-[200px]">{p.caption}</p>
                   <button onClick={() => handleRemovePhoto(p.id)} className="text-red-500">🗑️</button>
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
