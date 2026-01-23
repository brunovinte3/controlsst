
import React, { useState, useMemo, useEffect } from 'react';
import { Employee } from '../types';
import { STATUS_CONFIG, NR_COURSES } from '../constants';
import { getDaysRemaining } from '../utils/calculations';
import { StorageService } from '../services/storage';

interface VisitorSearchViewProps {
  employees: Employee[];
}

const VisitorSearchView: React.FC<VisitorSearchViewProps> = ({ employees }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(StorageService.getLastSyncTime());

  useEffect(() => {
    setLastSync(StorageService.getLastSyncTime());
  }, [employees]);

  const selectedEmployee = useMemo(() => {
    if (!selectedId) return null;
    return employees.find(e => e.id === selectedId) || null;
  }, [employees, selectedId]);

  const normalize = (text: string) => 
    text.toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

  const searchResults = useMemo(() => {
    const term = normalize(searchTerm);
    if (term.length < 2) return [];
    
    return employees.filter(emp => {
      const name = normalize(emp.name || '');
      const reg = normalize(emp.registration || '');
      return name.includes(term) || reg.includes(term);
    }).slice(0, 5);
  }, [employees, searchTerm]);

  const handleSelect = (emp: Employee) => {
    setSelectedId(emp.id);
    setSearchTerm('');
  };

  const isCipero = (emp: Employee) => ['VALID', 'EXPIRING'].includes(emp.trainings['NR05']?.status);
  const isBrigadista = (emp: Employee) => ['VALID', 'EXPIRING'].includes(emp.trainings['NR23']?.status);

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <div className="no-print">
        <h2 className="text-3xl font-black text-emerald-900 tracking-tighter italic">Consulta <span className="text-emerald-600">Colaborador</span></h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Verificação de Conformidade Normativa em Tempo Real</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4 no-print">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Digite Nome ou RE do colaborador..." 
            className="w-full px-8 py-6 bg-white border-2 border-emerald-100 rounded-[2.5rem] text-sm font-bold shadow-xl outline-none focus:border-emerald-500 transition-all text-center"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
          
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[2rem] shadow-2xl border border-emerald-50 overflow-hidden z-50">
              {searchResults.map(emp => (
                <button 
                  key={emp.id}
                  onClick={() => handleSelect(emp)}
                  className="w-full p-6 flex items-center justify-between hover:bg-emerald-50 transition-colors border-b border-emerald-50 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center font-black text-emerald-700">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black text-emerald-950 uppercase">{emp.name}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">RE: {emp.registration} • {emp.setor}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isCipero(emp) && <span className="w-6 h-6 bg-emerald-500 text-white rounded flex items-center justify-center text-[10px] font-black shadow-sm">C</span>}
                    {isBrigadista(emp) && <span className="w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center text-[10px] font-black shadow-sm">B</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedEmployee ? (
        <div className="animate-fadeIn space-y-6">
          <div className="bg-white rounded-[3rem] shadow-xl border border-emerald-100 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0">
            
            <div className="p-8 md:p-12 bg-emerald-50/50 flex flex-col md:flex-row items-center gap-8 border-b border-emerald-100 print:bg-white print:border-emerald-900 print:border-b-4 relative">
              
              <div className="absolute top-4 right-8 text-right no-print flex items-center gap-4">
                 <div className="flex gap-2">
                    {isCipero(selectedEmployee) && (
                      <div className="flex items-center gap-2 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200">
                         <span className="w-5 h-5 bg-emerald-500 text-white rounded-md flex items-center justify-center text-[10px] font-black">C</span>
                         <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">CIPEIRO</span>
                      </div>
                    )}
                    {isBrigadista(selectedEmployee) && (
                      <div className="flex items-center gap-2 bg-red-100 px-3 py-1.5 rounded-xl border border-red-200">
                         <span className="w-5 h-5 bg-red-500 text-white rounded-md flex items-center justify-center text-[10px] font-black">B</span>
                         <span className="text-[8px] font-black text-red-700 uppercase tracking-widest">BRIGADISTA</span>
                      </div>
                    )}
                 </div>
                 <div className="h-8 w-px bg-emerald-200"></div>
                 <div>
                    <p className="text-[7px] font-black text-emerald-800/20 uppercase tracking-[0.2em] leading-none">Dados Sincronizados em:</p>
                    <p className="text-[9px] font-black text-emerald-600/40 italic">{lastSync || 'Data não disponível'}</p>
                 </div>
              </div>

              <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-white border-4 border-white shadow-xl overflow-hidden flex-shrink-0 print:shadow-none">
                {selectedEmployee.photoUrl ? (
                  <img src={selectedEmployee.photoUrl} alt={selectedEmployee.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-emerald-200 font-black">
                    {selectedEmployee.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-3">
                  <h3 className="text-2xl md:text-3xl font-black text-emerald-950 uppercase tracking-tighter flex items-center justify-center md:justify-start gap-3">
                    {selectedEmployee.name}
                    <div className="flex gap-1 print:hidden">
                       {isCipero(selectedEmployee) && <span className="w-8 h-8 bg-emerald-500 text-white rounded-xl flex items-center justify-center text-sm font-black shadow-lg">C</span>}
                       {isBrigadista(selectedEmployee) && <span className="w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center text-sm font-black shadow-lg">B</span>}
                    </div>
                  </h3>
                  <span className="bg-emerald-900 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mx-auto md:mx-0 print:bg-black print:text-white">
                    RE: {selectedEmployee.registration}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-black text-emerald-800/40 uppercase tracking-widest">Empresa / Unidade</p>
                    <p className="text-sm font-black text-emerald-800 uppercase italic">{selectedEmployee.company || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-emerald-800/40 uppercase tracking-widest">Setor / Função</p>
                    <p className="text-sm font-black text-emerald-800 uppercase italic">{selectedEmployee.setor} • {selectedEmployee.role}</p>
                  </div>
                </div>
              </div>

              <div className="no-print">
                 <button 
                  onClick={() => window.print()}
                  className="bg-emerald-900 text-emerald-400 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                 >
                   IMPRIMIR FICHA 🖨️
                 </button>
              </div>
            </div>

            <div className="p-8 md:p-12 overflow-x-auto">
              <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.3em] mb-8 italic flex items-center gap-2 print:text-sm">
                <span className="w-2 h-2 bg-emerald-500 rounded-full print:hidden"></span>
                Grade de Treinamentos Normativos (NRs)
              </h4>
              
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-emerald-100 text-[10px] font-black uppercase text-emerald-800/40 print:border-emerald-900 print:text-black">
                    <th className="pb-4 pr-4">Treinamento</th>
                    <th className="pb-4 px-4">Conclusão</th>
                    <th className="pb-4 px-4">Validade</th>
                    <th className="pb-4 px-4 text-center">Dias Restantes</th>
                    <th className="pb-4 pl-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {NR_COURSES.map(course => {
                    const training = selectedEmployee.trainings[course.id];
                    const status = training?.status || 'NOT_TRAINED';
                    const days = getDaysRemaining(training?.expiryDate);
                    
                    return (
                      <tr key={course.id} className="border-b border-emerald-50/50 hover:bg-emerald-50/30 transition-colors group print:border-gray-200">
                        <td className="py-6 pr-4">
                          <p className="text-xs font-black text-emerald-950 uppercase">{course.id}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mt-1 print:text-[8px]">{course.name}</p>
                        </td>
                        <td className="py-6 px-4 text-xs font-black text-emerald-800">
                          {training?.completionDate ? new Date(training.completionDate).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="py-6 px-4 text-xs font-black text-emerald-800">
                          {training?.expiryDate ? new Date(training.expiryDate).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="py-6 px-4 text-center">
                          <span className={`text-[10px] font-black uppercase ${days !== null && days < 0 ? 'text-red-500' : 'text-emerald-600'} print:text-[8px]`}>
                            {days !== null ? (days < 0 ? `Vencido (${Math.abs(days)}d)` : `${days} dias`) : '-'}
                          </span>
                        </td>
                        <td className="py-6 pl-4 text-right">
                          <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest ${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].text} shadow-sm border border-current opacity-70 group-hover:opacity-100 transition-opacity print:opacity-100 print:border-gray-300`}>
                            {STATUS_CONFIG[status].label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              <div className="mt-12 pt-8 border-t border-emerald-50 text-center opacity-0 print:opacity-100">
                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.5em]">Documento Gerado Via ControlSST Cloud • Autenticidade Garantida em {lastSync}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center opacity-20 no-print">
           <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center text-6xl mb-6">👷‍♂️</div>
           <p className="text-emerald-900 font-black uppercase text-xs tracking-[0.3em]">Digite um termo para visualizar a ficha do trabalhador</p>
        </div>
      )}
    </div>
  );
};

export default VisitorSearchView;
