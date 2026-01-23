
import React, { useState, useMemo } from 'react';
import { Employee, TrainingRecord } from '../types';
import { STATUS_CONFIG, NR_COURSES } from '../constants';
import { calculateTrainingStatus, getExpiryDate } from '../utils/calculations';
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

  const setores = useMemo(() => ['Todos', ...Array.from(new Set(employees.map(e => e.setor)))], [employees]);
  const companies = useMemo(() => ['Todas', ...Array.from(new Set(employees.map(e => e.company)))], [employees]);

  const filtered = employees.filter(e => {
    const name = e.name || '';
    const registration = e.registration || '';
    const role = e.role || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         registration.includes(searchTerm) ||
                         role.toLowerCase().includes(searchTerm.toLowerCase());
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
      alert("Erro ao salvar. Verifique sua conexão.");
    }
  };

  const createNewEmployee = () => {
    if (!isAdmin) return;
    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: '',
      registration: '',
      role: '',
      setor: '',
      company: '',
      photoUrl: '',
      trainings: {}
    };
    setEditingEmp(newEmp);
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
          <h2 className="text-3xl font-black text-gray-800 italic tracking-tighter">Gestão de <span className="text-emerald-600">Equipe</span></h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1 italic">Controle Multi-Empresa ControlSST</p>
        </div>
        {isAdmin && (
          <button 
            onClick={createNewEmployee}
            className="bg-[#064E3B] text-emerald-400 px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-emerald-900/20 hover:scale-105 transition-all flex items-center gap-3"
          >
            <span>➕ Novo Colaborador</span>
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-2 block tracking-widest italic">Empresa</label>
          <select 
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full bg-emerald-50/50 border-2 border-transparent px-4 py-3 rounded-2xl text-xs font-black text-emerald-700 outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-inner"
          >
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-2 block tracking-widest italic">Setor</label>
          <select 
            value={selectedSetor}
            onChange={(e) => setSelectedSetor(e.target.value)}
            className="w-full bg-emerald-50/50 border-2 border-transparent px-4 py-3 rounded-2xl text-xs font-black text-emerald-700 outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-inner"
          >
            {setores.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-[2] min-w-[300px]">
          <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-2 block tracking-widest italic">Filtro Rápido</label>
          <input 
            type="text" 
            placeholder="Nome, RE ou Função..." 
            className="w-full px-5 py-3 bg-emerald-50/50 border-2 border-transparent rounded-2xl text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {filtered.map(emp => (
          <div key={emp.id} className="bg-white rounded-[2.5rem] border border-gray-100 hover:border-emerald-300 transition-all shadow-sm group">
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5 flex-1">
                <div className="w-16 h-16 text-white rounded-[1.8rem] flex items-center justify-center font-black text-xl shadow-lg relative overflow-hidden bg-emerald-50 flex-shrink-0">
                  {emp.photoUrl ? (
                    <img src={emp.photoUrl} alt={emp.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="relative z-10 text-emerald-600 opacity-30">{emp.name?.charAt(0) || '?'}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-black text-gray-800 leading-none mb-1 uppercase tracking-tight truncate">{emp.name}</h3>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">{emp.company}</span>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Matrícula: <span className="text-gray-900">{emp.registration}</span></p>
                    </div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-tight truncate">
                      Função: <span className="text-emerald-700">{emp.role}</span> • Setor: <span className="text-emerald-500">{emp.setor}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 md:justify-end max-w-xs">
                {NR_COURSES.map(course => {
                  const training = emp.trainings[course.id];
                  const status = training?.status || 'NOT_TRAINED';
                  return (
                    <div 
                      key={course.id} 
                      title={`${course.name}: ${STATUS_CONFIG[status].label}`}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black text-white shadow-sm transition-transform hover:scale-125 cursor-help ${STATUS_CONFIG[status].color}`}
                    >
                      {course.id.replace('NR', '')}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 flex-shrink-0">
                <button 
                  onClick={() => setEditingEmp(emp)}
                  className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.1em] hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                >
                  {isAdmin ? 'Editar Cadastro 📝' : 'Visualizar Ficha 👁️'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingEmp && (
        <div className="fixed inset-0 bg-emerald-950/60 backdrop-blur-xl z-[9999] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col animate-fadeIn border border-white/20 mt-4 md:mt-10 mb-10">
            <header className="p-10 border-b flex justify-between items-center bg-emerald-50/20">
              <div>
                <h3 className="text-2xl font-black text-emerald-900">Configuração de <span className="text-emerald-600 italic">Prontuário</span></h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestão Individual ControlSST</p>
              </div>
              <button onClick={() => setEditingEmp(null)} className="w-12 h-12 flex items-center justify-center bg-white rounded-full hover:bg-red-50 hover:text-red-500 transition-all font-black border border-emerald-50 shadow-sm">✕</button>
            </header>

            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic">Nome Completo</label>
                  <input required disabled={!isAdmin} type="text" className="w-full bg-emerald-50/30 border-2 border-emerald-50 rounded-[1.5rem] p-4 font-black text-sm outline-none shadow-inner" value={editingEmp.name} onChange={e => setEditingEmp({...editingEmp, name: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic">Matrícula</label>
                  <input required disabled={!isAdmin} type="text" className="w-full bg-emerald-50/30 border-2 border-emerald-50 rounded-[1.5rem] p-4 font-black text-sm outline-none shadow-inner" value={editingEmp.registration} onChange={e => setEditingEmp({...editingEmp, registration: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic">URL da Foto do Perfil</label>
                  <input disabled={!isAdmin} type="text" className="w-full bg-emerald-50/30 border-2 border-emerald-50 rounded-[1.5rem] p-4 font-black text-sm outline-none shadow-inner" placeholder="Link da imagem (https://...)" value={editingEmp.photoUrl || ''} onChange={e => setEditingEmp({...editingEmp, photoUrl: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic">Empresa / Unidade</label>
                  <input required disabled={!isAdmin} type="text" className="w-full bg-emerald-50/30 border-2 border-emerald-50 rounded-[1.5rem] p-4 font-black text-sm outline-none shadow-inner" value={editingEmp.company} onChange={e => setEditingEmp({...editingEmp, company: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic">Setor</label>
                  <input required disabled={!isAdmin} type="text" className="w-full bg-emerald-50/30 border-2 border-emerald-50 rounded-[1.5rem] p-4 font-black text-sm outline-none shadow-inner" value={editingEmp.setor} onChange={e => setEditingEmp({...editingEmp, setor: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic">Função</label>
                  <input required disabled={!isAdmin} type="text" className="w-full bg-emerald-50/30 border-2 border-emerald-50 rounded-[1.5rem] p-4 font-black text-sm outline-none shadow-inner" value={editingEmp.role} onChange={e => setEditingEmp({...editingEmp, role: e.target.value})} />
                </div>
              </div>

              <div className="pt-10 border-t border-emerald-50">
                <h4 className="text-xs font-black text-emerald-900 uppercase tracking-[0.3em] italic mb-6">Datas de Conclusão de Treinamentos</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {NR_COURSES.map(course => (
                    <div key={course.id} className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100">
                      <label className="block text-[9px] font-black text-emerald-700 uppercase mb-2">{course.name}</label>
                      <input disabled={!isAdmin} type="date" className="w-full bg-white border border-emerald-200 rounded-xl p-2 text-xs font-black focus:border-emerald-500 outline-none" value={editingEmp.trainings[course.id]?.completionDate || ''} onChange={e => updateTrainingDate(course.id, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            </form>

            <footer className="p-10 border-t bg-emerald-50/30 flex gap-6">
              <button type="button" onClick={() => setEditingEmp(null)} className="flex-1 py-5 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:text-red-500 transition-colors">Cancelar</button>
              {isAdmin && (
                <button onClick={handleSaveEdit} className="flex-[2] py-5 bg-[#064E3B] text-emerald-400 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all">EFETIVAR REGISTRO 💾</button>
              )}
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeView;
