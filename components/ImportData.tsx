
import React, { useState } from 'react';
import { formatEmployeeData } from '../utils/calculations';
import { Employee } from '../types';

interface ImportDataProps {
  onImport: (data: Employee[]) => void;
}

const ImportData: React.FC<ImportDataProps> = ({ onImport }) => {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');
  const [parsedEmployees, setParsedEmployees] = useState<Employee[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = () => {
    try {
      const trimmedInput = inputText.trim();
      if (!trimmedInput) {
        setError('O campo está vazio. Copie os dados da sua planilha e cole aqui.');
        return;
      }

      const lines = trimmedInput.split(/\r?\n/);
      if (lines.length < 2) {
        setError('Dados insuficientes. Certifique-se de copiar o CABEÇALHO e as LINHAS da planilha.');
        return;
      }

      const firstLine = lines[0];
      let separator = '\t';
      if (!firstLine.includes('\t')) {
        if (firstLine.includes(';')) separator = ';';
        else if (firstLine.includes(',')) separator = ',';
      }

      const headers = lines[0].split(separator).map(h => h.trim());
      
      const rawData = lines.slice(1).map(line => {
        const values = line.split(separator).map(v => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => {
          const val = values[i];
          obj[h] = (val === '' || val === '-' || val?.toUpperCase() === 'N/A') ? undefined : val;
        });
        return obj;
      });

      const employees = formatEmployeeData(rawData);
      
      if (employees.length === 0 || employees.every(e => e.name === 'Sem Nome')) {
        setError('Não reconhecemos os nomes das colunas. Verifique se o cabeçalho inclui "Nome", "Matrícula" e as NRs.');
        return;
      }

      setParsedEmployees(employees);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Erro crítico ao processar texto. Verifique se o formato da tabela está correto.');
    }
  };

  const handleSync = async () => {
    if (parsedEmployees.length === 0) return;
    setIsProcessing(true);
    try {
      await onImport(parsedEmployees);
      setParsedEmployees([]);
      setInputText('');
      alert('Sincronização com Supabase concluída com sucesso!');
    } catch (err) {
      setError('Erro ao sincronizar com o banco de dados.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setParsedEmployees([]);
    setError('');
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn space-y-6 pb-20">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-green-900/5 border border-gray-100">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3 tracking-tighter">
              <span className="text-4xl">📥</span> Importar <span className="text-emerald-600 italic">Planilha</span>
            </h2>
            <p className="text-gray-400 mt-1 font-bold uppercase text-[10px] tracking-widest italic">Integração Direta com Supabase Cloud</p>
          </div>
          
          <div className="flex gap-3">
             <button 
                onClick={handleClear}
                className="px-6 py-3 bg-red-50 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
             >
                Limpar 🗑️
             </button>
             <button 
                onClick={handleProcess}
                className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
             >
                Atualizar Prévia 🔄
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Identificação', val: 'Nome, RE, Cargo', icon: '👤' },
            { label: 'Cursos', val: 'NRs em colunas', icon: '📜' },
            { label: 'Datas', val: 'DD/MM/AAAA', icon: '📅' },
            { label: 'Status', val: 'Automático', icon: '⚡' },
          ].map((item, i) => (
            <div key={i} className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{item.icon}</span>
                <p className="font-black text-[9px] text-emerald-800 uppercase tracking-widest">{item.label}</p>
              </div>
              <p className="text-[10px] text-emerald-600 font-bold">{item.val}</p>
            </div>
          ))}
        </div>

        <div className="relative group">
          <textarea
            className="w-full h-[350px] p-8 bg-gray-50 border-2 border-gray-100 rounded-[2rem] font-mono text-sm outline-none focus:bg-white focus:border-emerald-500 transition-all resize-none shadow-inner"
            placeholder="Selecione os dados no Excel (Ctrl+C) e cole aqui (Ctrl+V)..."
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              if (error) setError('');
            }}
          />
          {inputText === '' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-10">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-xs font-black uppercase tracking-widest">Área de Colagem</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-[10px] font-black uppercase flex items-center gap-3 animate-bounce">
            ⚠️ {error}
          </div>
        )}

        {parsedEmployees.length > 0 && (
          <div className="mt-8 p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="font-black text-emerald-900 uppercase tracking-tighter">Resumo do Processamento</h4>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">{parsedEmployees.length} registros prontos para sincronizar</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-emerald-800/40 uppercase">Pronto para o banco?</span>
                <button 
                  onClick={handleSync}
                  disabled={isProcessing}
                  className="px-10 py-5 bg-[#064E3B] text-emerald-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-3"
                >
                  {isProcessing ? 'Sincronizando...' : 'SINCRONIZAR COM SUPABASE ☁️'}
                  {!isProcessing && <span className="text-xl">🚀</span>}
                </button>
              </div>
            </div>
            
            <div className="max-h-40 overflow-y-auto custom-scrollbar pr-4 space-y-2">
              {parsedEmployees.map((emp, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] bg-white/50 p-2 rounded-lg border border-emerald-100/50">
                  <span className="font-black text-emerald-900 uppercase">{emp.name}</span>
                  <span className="font-bold text-emerald-600/60">RE: {emp.registration} • {emp.department}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between opacity-40">
           <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">
             O sistema sobrescreve dados de funcionários com a mesma matrícula durante a sincronização.
           </p>
        </div>
      </div>
    </div>
  );
};

export default ImportData;
