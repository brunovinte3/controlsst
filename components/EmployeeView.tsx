
import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import { STATUS_CONFIG, NR_COURSES } from '../constants';
import { calculateTrainingStatus, getExpiryDate, getDaysRemaining } from '../utils/calculations';
import { StorageService } from '../services/storage';

interface EmployeeViewProps {
  employees: Employee[];
  onUpdate: () => void;
  isAdmin: boolean;
}

const EmployeeView: React.FC<EmployeeViewProps> = ({ employees, onUpdate, isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSetor, setSelectedSetor] = useState('Todos');
  const [selectedCompany, setSelectedCompany] = useState('Todas');
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  const setores = useMemo(() => ['Todos', ...Array.from(new Set(employees.map(e => (e.setor || 'Geral').trim())))], [employees]);
  const companies = useMemo(() => ['Todas', ...Array.from(new Set(employees.map(e => e.company)))], [employees]);

  const filtered = employees.filter(e => {
    const name = e.name || '';
    const reg = e.registration || '';
    const role = e.role || '';
    const search = searchTerm.toLowerCase();
    
    const matchesSearch = name.toLowerCase().includes(search) || 
                         reg.includes(search) ||
                         role.toLowerCase().includes(search);
    const matchesSetor = selectedSetor === 'Todos' || e.setor === selectedSetor;
    const matchesCompany = selectedCompany === 'Todas' || e.company === selectedCompany;
    return matchesSearch && matchesSetor && matchesCompany;
  });

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp || !isAdmin) return;
    try {
      await StorageService.updateEmployee(editingEmp);
      setEditingEmp(null);
      onUpdate();
    } catch (err) {
      alert("Erro ao salvar cadastro.");
    }
  };

  const updateTrainingDate = (courseId: string, date: string) => {
    if (!editingEmp || !isAdmin) return;
    const course = NR_COURSES.find(c => c.id === courseId);
    if (!course) return;
    const newStatus = calculateTrainingStatus(date, course.validityYears);
    const newExpiry = getExpiryDate(date, course.validityYears);
    const updatedTrainings = {
      ...editingEmp.trainings,
      [courseId]: {
        courseId,
        completionDate: date || undefined,
        expiryDate: newExpiry,
        status: newStatus
      }
    };
    setEditingEmp({ ...editingEmp, trainings: updatedTrainings });
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-emerald-900 italic tracking-tighter">Gestão de <span className="text-emerald-600">Equipe</span></h2>
          <p className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-[0.2em] mt-1 italic">Controle Multi-Empresa ControlSST</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setEditingEmp({ id: `emp-${Date.now()}`, name: '', registration: '', role: '', setor: '', company: '', trainings: {} })}
            className="w-full md:w-auto bg-[#064E3B] text-emerald-400 px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <span>➕ Novo Colaborador</span>
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-emerald-100 shadow-sm flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <label className="text-[9px] font-black text-emerald-800/40 uppercase ml-1 mb-2 block tracking-widest italic">Empresa</label>
          <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} className="w-full bg-emerald-50/50 border-2 border-transparent px-4 py-3 rounded-2xl text-xs font-black text-emerald-700 outline-none shadow-inner focus:border-emerald-500 transition-colors">
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[9px] font-black text-emerald-800/40 uppercase ml-1 mb-2 block tracking-widest italic">Setor</label>
          <select value={selectedSetor} onChange={(e) => setSelectedSetor(e.target.value)} className="w-full bg-emerald-50/50 border-2 border-transparent px-4 py-3 rounded-2xl text-xs font-black text-emerald-700 outline-none shadow-inner focus:border-emerald-500 transition-colors">
            {setores.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-[2]">
          <label className="text-[9px] font-black text-emerald-800/40 uppercase ml-1 mb-2 block tracking-widest italic">Filtro Rápido</label>
          <input type="text" placeholder="Pesquisar por Nome ou RE..." className="w-full px-5 py-3 bg-emerald-50/50 border-2 border-transparent rounded-2xl text-xs font-bold shadow-inner outline-none focus:bg-white focus:border-emerald-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map(emp => (
          <div key={emp.id} className="bg-white rounded-[2.5rem] border border-emerald-100 hover:border-emerald-300 transition-all shadow-sm group active:scale-[0.98]">
            <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="w-14 h-14 md:w-16 md:h-16 text-white rounded-[1.8rem] flex items-center justify-center font-black text-xl shadow-lg relative overflow-hidden bg-emerald-50 flex-shrink-0 border border-emerald-200">
                  {emp.photoUrl ? (
                    <img src={emp.photoUrl} alt={emp.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="relative z-10 text-emerald-600 opacity-30 font-black uppercase tracking-widest">{emp.name?.charAt(0) || '?'}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-md md:text-lg font-black text-emerald-900 leading-none mb-1 uppercase tracking-tight truncate">{emp.name}</h3>
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">{emp.company}</span>
                      <p className="text-[9px] text-emerald-800/40 font-bold uppercase tracking-tight">RE: <span className="text-emerald-900">{emp.registration}</span></p>
                    </div>
                    <p className="text-[9px] text-emerald-600 font-black uppercase tracking-tight truncate">
                      <span className="text-emerald-700">{emp.role}</span> • <span className="text-emerald-500">{emp.setor}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Bolinhas de Status */}
              <div className="flex flex-wrap gap-1.5 lg:justify-end max-w-full lg:max-w-xs">
                {NR_COURSES.map(course => {
                  const training = emp.trainings[course.id];
                  const status = training?.status || 'NOT_TRAINED';
                  const days = getDaysRemaining(training?.expiryDate);
                  const complDate = training?.completionDate ? new Date(training.completionDate).toLocaleDateString('pt-BR') : 'Não Realizado';
                  const expDate = training?.expiryDate ? new Date(training.expiryDate).toLocaleDateString('pt-BR') : 'N/A';
                  
                  const tooltipText = `CURSO: ${course.name}\nREALIZAÇÃO: ${complDate}\nVALIDADE: ${expDate}\nSTATUS: ${STATUS_CONFIG[status].label}\nDIAS RESTANTES: ${days !== null ? (days < 0 ? `Expirado há ${Math.abs(days)} dias` : `${days} dias`) : 'N/A'}`;

                  return (
                    <div 
                      key={course.id} 
                      title={tooltipText}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black text-white shadow-sm transition-transform hover:scale-125 cursor-help ${STATUS_CONFIG[status].color}`}
                    >
                      {course.id.replace('NR', '')}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 w-full lg:w-auto mt-2 lg:mt-0">
                <button onClick={() => setEditingEmp(emp)} className="flex-1 lg:flex-none bg-emerald-100 text-emerald-700 px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.1em] hover:bg-emerald-600 hover:text-white transition-all active:scale-90">
                  {isAdmin ? 'Editar 📝' : 'Ficha 👁️'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Edição - AJUSTADO PARA O TOPO */}
      {editingEmp && (
        <div className="fixed inset-0 bg-emerald-950/70 backdrop-blur-md z-[1000] flex items-start justify-center overflow-y-auto px-4 py-8 md:py-16">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-fadeIn relative">
            <header className="p-6 md:p-10 border-b flex justify-between items-center bg-emerald-50/40 sticky top-0 z-10 backdrop-blur-sm border-emerald-100">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-emerald-900 leading-none">Configuração de <span className="text-emerald-600 italic">Prontuário</span></h3>
                <p className="text-[9px] font-bold text-emerald-700/60 uppercase tracking-widest mt-2">Gestão Individual ControlSST</p>
              </div>
              <button 
                onClick={() => setEditingEmp(null)} 
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white rounded-full border border-emerald-100 shadow-sm text-lg hover:bg-red-50 hover:text-red-500 transition-colors active:scale-90"
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleSaveEdit} className="p-6 md:p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Nome Completo', key: 'name' },
                  { label: 'Matrícula', key: 'registration' },
                  { label: 'Link da Foto', key: 'photoUrl' },
                  { label: 'Empresa', key: 'company' },
                  { label: 'Setor', key: 'setor' },
                  { label: 'Função', key: 'role' }
                ].map(field => (
                  <div key={field.key} className="space-y-2">
                    <label className="text-[9px] font-black text-emerald-800/40 uppercase tracking-widest ml-2">{field.label}</label>
                    <input 
                      disabled={!isAdmin} required={field.key !== 'photoUrl'} type="text" 
                      className="w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl p-4 font-black text-sm outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-inner" 
                      value={(editingEmp as any)[field.key] || ''} 
                      onChange={e => setEditingEmp({...editingEmp, [field.key]: e.target.value})} 
                    />
                  </div>
                ))}
              </div>

              <div className="pt-10 border-t border-emerald-100">
                <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.3em] mb-8 italic flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Datas de Treinamentos
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {NR_COURSES.map(course => (
                    <div key={course.id} className="bg-emerald-50/40 p-5 rounded-3xl border border-emerald-100 hover:border-emerald-300 transition-colors shadow-inner">
                      <label className="block text-[8px] font-black text-emerald-700 uppercase mb-3 tracking-tighter">{course.name}</label>
                      <input 
                        disabled={!isAdmin} type="date" 
                        className="w-full bg-white border border-emerald-200 rounded-xl p-3 text-xs font-black outline-none focus:border-emerald-500 transition-all shadow-sm" 
                        value={editingEmp.trainings[course.id]?.completionDate || ''} 
                        onChange={e => updateTrainingDate(course.id, e.target.value)} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <footer className="pt-10 border-t border-emerald-100 flex flex-col md:flex-row gap-4">
                <button type="button" onClick={() => setEditingEmp(null)} className="flex-1 py-5 text-emerald-800/40 font-black uppercase text-[10px] tracking-widest hover:text-red-500 transition-colors order-2 md:order-1">Cancelar</button>
                {isAdmin && (
                  <button onClick={handleSaveEdit} className="flex-[2] py-5 bg-[#064E3B] text-emerald-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all order-1 md:order-2">
                    CONSOLIDAR ALTERAÇÕES 💾
                  </button>
                )}
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeView;
