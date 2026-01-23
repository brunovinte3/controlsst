
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { AdminProfile } from '../types';

const ConfigView: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => {
  const [url, setUrl] = useState(StorageService.getSheetsUrl());
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastSync, setLastSync] = useState<string | null>(StorageService.getLastSyncTime());
  
  const initialAdmin = StorageService.getAdminProfile();
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(initialAdmin);
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  useEffect(() => {
    setUrl(StorageService.getSheetsUrl());
    setLastSync(StorageService.getLastSyncTime());
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.updateAdminProfile(adminProfile);
    setIsProfileSaved(true);
    setTimeout(() => setIsProfileSaved(false), 3000);
  };

  const validateAndTest = async () => {
    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith('https://script.google.com')) {
      setStatus('error');
      setErrorMessage('URL inválida. Deve começar com https://script.google.com');
      return;
    }

    setStatus('testing');
    setErrorMessage('');
    
    try {
      StorageService.saveSheetsUrl(cleanUrl);
      const success = await StorageService.syncWithSheets();
      if (success) {
        setStatus('success');
        setLastSync(StorageService.getLastSyncTime());
        onUpdate();
      } else {
        setStatus('error');
        setErrorMessage('O Google respondeu mas o formato dos dados é incompatível.');
      }
    } catch (err: any) {
      console.error("Erro detectado:", err);
      setStatus('error');
      setErrorMessage(err.message || 'Erro de conexão.');
    }
  };

  const sqlFix = `-- 1. COMANDO DE REPARO COMPLETO (Copie e rode no SQL Editor)
-- Esse comando garante que todas as colunas existem e recarrega o schema

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  registration TEXT NOT NULL,
  role TEXT DEFAULT '-',
  setor TEXT DEFAULT 'Geral',
  company TEXT DEFAULT 'Empresa Padrão',
  "photoUrl" TEXT,
  trainings JSONB DEFAULT '{}'::jsonb
);

-- Adiciona setor se não existir (caso a tabela já existisse antes)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS setor TEXT DEFAULT 'Geral';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS role TEXT DEFAULT '-';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS company TEXT DEFAULT 'Empresa Padrão';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS trainings JSONB DEFAULT '{}'::jsonb;

-- 2. COMANDO PARA LIMPAR CACHE (IMPORTANTE!)
NOTIFY pgrst, 'reload schema';`;

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn space-y-12 pb-20">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-emerald-900/5 border-2 border-emerald-100">
        <header className="mb-10 text-center">
          <div className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl">📊</div>
          <h2 className="text-4xl font-black text-gray-800 mb-2 tracking-tighter">Base de Dados <span className="text-emerald-600">SST Cloud</span></h2>
          <div className="flex items-center justify-center gap-2 mt-1">
             <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest italic">Integração Sheets & Supabase</p>
             <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
             <p className="text-emerald-600 font-black uppercase text-[10px] tracking-widest italic">
               Status: {lastSync ? `Sincronizado em ${lastSync}` : 'Aguardando Sincronização'}
             </p>
          </div>
        </header>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Alerta de Erro de Schema */}
          {status === 'error' && (errorMessage.includes('column') || errorMessage.includes('cache') || errorMessage.includes('schema')) && (
            <div className="bg-amber-900 text-white p-8 rounded-[2.5rem] space-y-4 border-l-8 border-amber-500 animate-fadeIn">
               <h4 className="text-amber-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                 <span>🚨</span> Problema de Sincronização de Schema
               </h4>
               <div className="text-[11px] text-amber-100/80 font-medium space-y-2">
                 <p>O Supabase ainda não reconheceu as novas colunas. Siga estes passos:</p>
                 <ol className="list-decimal ml-4 space-y-1">
                   <li>Vá no <b>SQL Editor</b> do Supabase.</li>
                   <li>Cole o código abaixo e clique em <b>RUN</b>.</li>
                   <li><b>RECARREGUE ESTA PÁGINA (F5)</b> após o comando terminar.</li>
                 </ol>
               </div>
               <div className="relative group">
                 <pre className="bg-black/40 p-6 rounded-2xl text-[10px] font-mono overflow-x-auto text-amber-200 border border-amber-500/20 max-h-48 overflow-y-auto custom-scrollbar">
                   {sqlFix}
                 </pre>
                 <button 
                  onClick={() => navigator.clipboard.writeText(sqlFix)}
                  className="absolute top-4 right-4 bg-amber-500 text-white text-[9px] px-3 py-1 rounded-lg font-black hover:bg-amber-400"
                 >
                   COPIAR SQL DE REPARO
                 </button>
               </div>
            </div>
          )}

          <div className="bg-emerald-50 p-8 rounded-[2.5rem] border-2 border-emerald-200">
            <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-4 ml-1">
              URL da API do Google (Sua Planilha):
            </label>
            <div className="space-y-4">
              <input 
                type="text" 
                className="w-full bg-white border-2 border-emerald-100 rounded-2xl p-4 text-xs font-mono focus:border-emerald-500 outline-none shadow-sm"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
              />
              
              <div className="flex gap-4">
                <button 
                  onClick={validateAndTest}
                  disabled={status === 'testing'}
                  className="flex-1 py-4 bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {status === 'testing' ? '⌛ SINCRONIZANDO...' : 'TESTAR E ATUALIZAR AGORA 🔄'}
                </button>
              </div>

              {status === 'success' && (
                <div className="bg-green-500 text-white p-4 rounded-xl text-center font-black text-[10px] uppercase animate-bounce">
                  ✅ Sincronizado com Sucesso!
                </div>
              )}
              
              {status === 'error' && (
                <div className="bg-red-600 text-white p-4 rounded-xl text-center font-black text-[10px] uppercase leading-relaxed shadow-xl">
                  {errorMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigView;
