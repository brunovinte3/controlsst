
import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import { STATUS_CONFIG, NR_COURSES } from '../constants';
import { calculateTrainingStatus, getExpiryDate, getDaysRemaining, formatEmployeeData } from '../utils/calculations';
import { StorageService } from '../services/storage';

interface EmployeeViewProps {
  employees: Employee[];
  onUpdate: () => void;
  isAdmin: boolean;
}

const EmployeeView: React.FC<EmployeeViewProps> = ({ employees, onUpdate, isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSetor, setSelectedSetor] = useState('TODOS');
  const [selectedCompany, setSelectedCompany] = useState('TODAS');
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [viewingSheetEmp, setViewingSheetEmp] = useState<Employee | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  
  // Estados para Importação em Massa
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<Employee[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Normalização Rigorosa para buscas e filtros
  const simplify = (text: any) => 
    String(text || '')
      .toUpperCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  // Lista de Empresas Únicas (para o filtro)
  const companies = useMemo(() => {
    const set = new Set(employees.map(e => simplify(e.company || 'EMPRESA PADRÃO')));
    return ['TODAS', ...Array.from(set)].sort();
  }, [employees]);

  // Lista de Setores Únicos baseados na empresa selecionada
  const setores = useMemo(() => {
    const pool = selectedCompany === 'TODAS' 
      ? employees 
      : employees.filter(e => simplify(e.company) === selectedCompany);
    
    const set = new Set(pool.map(e => simplify(e.setor || 'GERAL')));
    return ['TODOS', ...Array.from(set)].sort();
  }, [employees, selectedCompany]);

  // LÓGICA DE FILTRAGEM E ORDENAÇÃO (CORREÇÃO DE BUG)
  const filteredEmployees = useMemo(() => {
    const term = simplify(searchTerm);
    
    return employees
      .filter(emp => {
        const empComp = simplify(emp.company || 'EMPRESA PADRÃO');
        const empSet = simplify(emp.setor || 'GERAL');
        const empName = simplify(emp.name);
        const empReg = simplify(emp.registration);

        const matchesCompany = selectedCompany === 'TODAS' || empComp === selectedCompany;
        const matchesSetor = selectedSetor === 'TODOS' || empSet === selectedSetor;
        const matchesSearch = !term || empName.includes(term) || empReg.includes(term);

        return matchesCompany && matchesSetor && matchesSearch;
      })
      .sort((a, b) => a.name.localeCompare(b.name)); // FORÇA ORDEM ALFABÉTICA
  }, [employees, searchTerm, selectedSetor, selectedCompany]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp || !isAdmin) return;
    try {
      await StorageService.updateEmployee(editingEmp);
      setEditingEmp(null);
      setViewingSheetEmp(null);
      onUpdate();
      alert("Dados sincronizados com sucesso!");
    } catch (err) {
      alert("Erro ao salvar no banco de dados.");
    }
  };

  const handleProcessBulk = () => {
    try {
      const trimmed = importText.trim();
      if (!trimmed) return alert("Cole os dados primeiro.");
      const lines = trimmed.split(/\r?\n/);
      const separator = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
      const headers = lines[0].split(separator).map(h => h.trim());
      const rawData = lines.slice(1).map(line => {
        const values = line.split(separator).map(v => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = values[i] || undefined; });
        return obj;
      });
      const formatted = formatEmployeeData(rawData);
      setImportPreview(formatted);
    } catch (err) {
      alert("Erro ao processar planilha.");
    }
  };

  const handleSaveBulk = async () => {
    if (!importPreview.length) return;
    setIsImporting(true);
    try {
      await StorageService.saveEmployees(importPreview);
      setImportPreview([]);
      setImportText('');
      setShowBulkImport(false);
      onUpdate();
      alert(`${importPreview.length} registros atualizados!`);
    } catch (err) {
      alert("Erro na sincronização.");
    } finally {
      setIsImporting(false);
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
      [courseId]: { courseId, completionDate: date || undefined, expiryDate: newExpiry, status: newStatus }
    };
    setEditingEmp({ ...editingEmp, trainings: updatedTrainings });
  };

  return (
    <div className="space-y-10 pb-24 animate-fadeIn">
      {/* Cabeçalho Administrativo */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-emerald-900 tracking-tighter uppercase italic">
            Cadastro de <span className="text-emerald-600">Funcionários</span>
          </h2>
          <p className="text-[10px] font-bold text-emerald-800/40 uppercase tracking-[0.2em] mt-1">Gestão de Prontuários e Edição 100% Cloud</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowBulkImport(true)}
            className="flex-1 md:flex-none bg-white text-emerald-700 border-2 border-emerald-100 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm"
          >
            📥 Importar Planilha
          </button>
          <button 
            onClick={() => setEditingEmp({ id: `NEW-${Date.now()}`, name: '', registration: '', role: '', setor: '', company: '', trainings: {} })}
            className="flex-[2] md:flex-none bg-emerald-900 text-emerald-400 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>➕ Novo Cadastro</span>
          </button>
        </div>
      </div>

      {/* ÁREA DE BUSCA (ESTILO CONSULTA RÁPIDA) */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-emerald-100 shadow-xl space-y-10">
        <div className="max-w-4xl mx-auto">
          <label className="text-[10px] font-black text-emerald-800/30 uppercase tracking-[0.4em] mb-6 block text-center italic">Pesquisa Inteligente de Colaboradores</label>
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Digite Nome ou Matrícula para filtrar a lista..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-10 py-8 bg-emerald-50/50 border-2 border-transparent rounded-[3rem] text-lg font-black text-emerald-950 shadow-inner outline-none focus:bg-white focus:border-emerald-500 transition-all text-center placeholder:text-emerald-900/20" 
            />
            <span className="absolute left-8 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-focus-within:opacity-100 transition-opacity">🔍</span>
          </div>
        </div>

        {/* Filtros de Seleção */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="space-y-3">
            <label className="text-[9px] font-black text-emerald-800/40 uppercase tracking-[0.2em] ml-6">Unidade Operacional</label>
            <select 
              value={selectedCompany} 
              onChange={(e) => { setSelectedCompany(e.target.value); setSelectedSetor('TODOS'); }} 
              className="w-full bg-white border-2 border-emerald-50 px-8 py-5 rounded-[2rem] text-xs font-black text-emerald-700 focus:border-emerald-500 outline-none transition-all shadow-sm cursor-pointer appearance-none text-center"
            >
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[9px] font-black text-emerald-800/40 uppercase tracking-[0.2em] ml-6">Departamento / Setor</label>
            <select 
              value={selectedSetor} 
              onChange={(e) => setSelectedSetor(e.target.value)} 
              className="w-full bg-white border-2 border-emerald-50 px-8 py-5 rounded-[2rem] text-xs font-black text-emerald-700 focus:border-emerald-500 outline-none transition-all shadow-sm cursor-pointer appearance-none text-center"
            >
              {setores.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* RESULTADOS (GRID ORDENADO DE A-Z) */}
      <div className="flex justify-between items-center px-4">
        <p className="text-[10px] font-black text-emerald-800/30 uppercase tracking-widest italic">
          Exibindo <span className="text-emerald-600">{filteredEmployees.length}</span> colaboradores por ordem alfabética
        </p>
      </div>

      {filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEmployees.map(emp => (
            <div key={emp.id} className="bg-white p-8 rounded-[3rem] border border-emerald-100 hover:border-emerald-500 hover:shadow-2xl transition-all group flex flex-col justify-between animate-fadeIn">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 bg-emerald-50 rounded-[1.5rem] overflow-hidden border border-emerald-100 shadow-inner flex-shrink-0 relative">
                  {emp.photoUrl ? (
                    <img src={emp.photoUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-emerald-200 font-black text-3xl">{emp.name.charAt(0)}</div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-emerald-950 uppercase truncate leading-none mb-2">{emp.name}</h3>
                  <p className="text-[9px] font-bold text-emerald-600/50 uppercase tracking-widest truncate">RE: {emp.registration}</p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter truncate mt-1 italic">{emp.setor} • {emp.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setViewingSheetEmp(emp)} className="py-4 bg-emerald-50 text-emerald-700 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">📜 VER FICHA</button>
                <button onClick={() => setEditingEmp(emp)} className="py-4 bg-emerald-700 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-900 shadow-lg transition-all">✏️ EDITAR</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/50 border-4 border-dashed border-emerald-100 rounded-[4rem] py-32 text-center">
          <div className="text-7xl mb-6 opacity-10">🕵️‍♂️</div>
          <p className="text-emerald-950/30 font-black uppercase text-xs tracking-[0.4em]">Nenhum colaborador encontrado com estes filtros</p>
          <button onClick={() => {setSearchTerm(''); setSelectedCompany('TODAS'); setSelectedSetor('TODOS');}} className="mt-6 text-[10px] font-black text-emerald-600 underline uppercase tracking-widest hover:text-emerald-800">Limpar Todos os Filtros</button>
        </div>
      )}

      {/* MODAL: EDIÇÃO 100% PODER */}
      {editingEmp && (
        <div className="fixed inset-0 bg-emerald-950/95 backdrop-blur-2xl z-[1200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden my-auto animate-fadeIn border border-emerald-50">
            <header className="p-10 border-b flex justify-between items-center bg-emerald-50/40">
              <div>
                <h3 className="text-2xl font-black text-emerald-950 leading-none uppercase tracking-tighter italic">Ficha de <span className="text-emerald-600">Edição Total</span></h3>
                <p className="text-[9px] font-bold text-emerald-700/60 uppercase tracking-widest mt-3">Alteração de dados cadastrais e validades de NRs</p>
              </div>
              <button onClick={() => setEditingEmp(null)} className="w-14 h-14 flex items-center justify-center bg-white rounded-full border border-emerald-100 text-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">✕</button>
            </header>

            <form onSubmit={handleSaveEdit} className="p-12 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { label: 'Nome Completo', key: 'name', type: 'text' },
                  { label: 'Matrícula / RE', key: 'registration', type: 'text' },
                  { label: 'Unidade / Empresa', key: 'company', type: 'text' },
                  { label: 'Setor de Trabalho', key: 'setor', type: 'text' },
                  { label: 'Cargo / Função', key: 'role', type: 'text' },
                  { label: 'URL da Foto', key: 'photoUrl', type: 'text' }
                ].map(field => (
                  <div key={field.key} className="space-y-3">
                    <label className="text-[9px] font-black text-emerald-800/40 uppercase tracking-widest ml-3">{field.label}</label>
                    <input 
                      required={field.key !== 'photoUrl'} 
                      type={field.type} 
                      className="w-full bg-emerald-50/30 border-2 border-emerald-50 rounded-2xl p-5 font-black text-sm outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-inner" 
                      value={(editingEmp as any)[field.key] || ''} 
                      onChange={e => setEditingEmp({...editingEmp, [field.key]: e.target.value})} 
                    />
                  </div>
                ))}
              </div>

              <div className="pt-12 border-t border-emerald-100">
                <h4 className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.3em] mb-10 italic flex items-center gap-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Datas de Treinamentos (Conclusão)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {NR_COURSES.map(course => (
                    <div key={course.id} className="bg-emerald-50/20 p-6 rounded-3xl border border-emerald-100 group hover:bg-white hover:border-emerald-500 transition-all shadow-inner">
                      <label className="block text-[8px] font-black text-emerald-800 uppercase mb-3 tracking-tighter">{course.name}</label>
                      <input 
                        type="date" 
                        className="w-full bg-white border border-emerald-100 rounded-xl p-3 text-xs font-black outline-none focus:border-emerald-500 transition-all" 
                        value={editingEmp.trainings[course.id]?.completionDate || ''} 
                        onChange={e => updateTrainingDate(course.id, e.target.value)} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <footer className="pt-10 border-t border-emerald-100 flex gap-6">
                <button type="button" onClick={() => setEditingEmp(null)} className="flex-1 py-6 text-emerald-800/40 font-black uppercase text-[10px] tracking-widest hover:text-red-600 transition-colors">CANCELAR</button>
                <button type="submit" className="flex-[2] py-6 bg-emerald-950 text-emerald-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">Sincronizar Alterações 💾</button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORTAÇÃO EM MASSA */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-emerald-950/90 backdrop-blur-xl z-[1300] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
            <header className="p-10 border-b flex justify-between items-center bg-emerald-50/50">
              <div>
                <h3 className="text-2xl font-black text-emerald-900 uppercase italic">Importação em <span className="text-emerald-600">Massa</span></h3>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2">Copie e cole os dados do Excel (com cabeçalho)</p>
              </div>
              <button onClick={() => setShowBulkImport(false)} className="w-12 h-12 flex items-center justify-center bg-white rounded-full text-xl hover:bg-red-500 transition-all shadow-sm">✕</button>
            </header>
            <div className="p-12 space-y-8 overflow-y-auto custom-scrollbar">
              <textarea 
                className="w-full h-80 p-8 bg-emerald-50/30 border-2 border-emerald-100 rounded-[2.5rem] font-mono text-xs outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-inner"
                placeholder="Cole os dados aqui..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <div className="flex justify-between items-center bg-emerald-50/40 p-6 rounded-3xl">
                <p className="text-[10px] font-black text-emerald-950 uppercase italic tracking-widest">{importPreview.length} Colaboradores Carregados</p>
                <div className="flex gap-4">
                  <button onClick={() => setImportText('')} className="px-6 py-4 text-red-500 font-black text-[10px] uppercase">Limpar</button>
                  <button onClick={handleProcessBulk} className="px-8 py-4 bg-emerald-200 text-emerald-800 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm">Processar</button>
                  <button onClick={handleSaveBulk} disabled={!importPreview.length || isImporting} className="px-10 py-4 bg-emerald-950 text-emerald-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl disabled:opacity-50">
                    {isImporting ? 'Enviando...' : 'Sincronizar Cloud ☁️'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeView;
