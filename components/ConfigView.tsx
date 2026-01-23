
import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { AdminProfile } from '../types';

const ConfigView: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => {
  const [url, setUrl] = useState(StorageService.getSheetsUrl() || '');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const initialAdmin = StorageService.getAdminProfile();
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(initialAdmin);
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  const scriptCode = `function doGet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const json = rows.map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        const cleanHeader = header.toString().trim();
        obj[cleanHeader] = row[i];
      });
      return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(json))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ error: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.updateAdminProfile(adminProfile);
    setIsProfileSaved(true);
    setTimeout(() => setIsProfileSaved(false), 3000);
  };

  const validateAndTest = async () => {
    if (!url.startsWith('https://script.google.com')) {
      setStatus('error');
      setErrorMessage('URL inválida. Comece com https://script.google.com');
      return;
    }

    setStatus('testing');
    setErrorMessage('');
    
    try {
      StorageService.saveSheetsUrl(url);
      const success = await StorageService.syncWithSheets();
      if (success) {
        setStatus('success');
        onUpdate();
      } else {
        throw new Error("Planilha vazia ou inacessível.");
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage('Erro de permissão. Garanta que configurou "Qualquer um" no Google.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn space-y-12 pb-20">
      {/* SEÇÃO PRINCIPAL - GOOGLE SHEETS */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-emerald-900/5 border-2 border-emerald-100">
        <header className="mb-10 text-center">
          <div className="w-24 h-24 bg-emerald-600 text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-xl shadow-emerald-900/20 animate-bounce-short">⚡</div>
          <h2 className="text-4xl font-black text-gray-800 mb-2 tracking-tighter italic">Vincular <span className="text-emerald-600">Google Sheets</span></h2>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest italic">Abaixo você configura o link para sincronizar os dados</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* LADO ESQUERDO: CÓDIGO */}
          <div className="space-y-6 bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter">
              <span className="w-8 h-8 bg-gray-800 text-white rounded-lg flex items-center justify-center text-xs">1</span>
              Código do Script
            </h3>
            <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
              Copie este código, cole no <b>Apps Script</b> da sua planilha e clique em <b>Implantar > App da Web</b>.
            </p>
            <div className="relative group">
              <pre className="bg-gray-900 text-emerald-400 p-6 rounded-3xl text-[10px] font-mono overflow-hidden h-40 border-2 border-gray-800">
                {scriptCode}
              </pre>
              <button 
                onClick={() => { navigator.clipboard.writeText(scriptCode); alert('Copiado! Agora cole no Google Sheets.'); }}
                className="absolute inset-0 w-full h-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black uppercase text-xs tracking-widest rounded-3xl"
              >
                Clique para Copiar Código 📋
              </button>
            </div>
          </div>

          {/* LADO DIREITO: CAMPO DO LINK - ONDE COLOCAR O LINK */}
          <div className="space-y-8 bg-emerald-50 p-8 rounded-[2.5rem] border-2 border-emerald-200 shadow-xl shadow-emerald-900/5">
            <h3 className="text-lg font-black text-emerald-900 flex items-center gap-2 uppercase tracking-tighter">
              <span className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center text-xs">2</span>
              URL DA IMPLANTAÇÃO
            </h3>
            
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1">
                COLE SEU LINK AQUI (TERMINA EM /EXEC):
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full bg-white border-4 border-emerald-100 rounded-3xl p-6 outline-none text-sm font-mono focus:border-emerald-500 shadow-lg text-emerald-900 placeholder:opacity-30"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                {url && <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl">🔗</span>}
              </div>

              <div className="p-4 bg-white/60 rounded-2xl border border-emerald-100">
                <p className="text-[10px] text-emerald-800 font-bold leading-relaxed italic">
                  💡 <b>Dica:</b> No Google, ao implantar, lembre-se de marcar "Quem pode acessar" como <b>"Qualquer um"</b>, senão o app não conseguirá ler sua planilha.
                </p>
              </div>

              <button 
                onClick={validateAndTest}
                disabled={status === 'testing'}
                className="w-full py-6 bg-emerald-700 text-white rounded-3xl font-black text-sm tracking-[0.2em] shadow-2xl hover:bg-emerald-800 hover:scale-[1.02] transition-all disabled:opacity-50 active:scale-95"
              >
                {status === 'testing' ? '⌛ TESTANDO CONEXÃO...' : 'SALVAR E SINCRONIZAR 🔄'}
              </button>

              {status === 'success' && (
                <div className="bg-green-500 text-white p-4 rounded-2xl text-center font-black text-[10px] uppercase tracking-widest animate-bounce">
                  ✅ PLANILHA CONECTADA E SINCRONIZADA!
                </div>
              )}
              {status === 'error' && (
                <div className="bg-red-500 text-white p-4 rounded-2xl text-center font-black text-[10px] uppercase tracking-widest">
                  ❌ {errorMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PERFIL ADMIN */}
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
        <header className="mb-10">
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
            <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl">👤</span>
            Acesso Administrativo
          </h2>
        </header>

        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Usuário</label>
            <input 
              type="text" 
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-sm focus:border-blue-500 outline-none"
              value={adminProfile.username}
              onChange={e => setAdminProfile({...adminProfile, username: e.target.value})}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha</label>
            <input 
              type="text" 
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-sm focus:border-blue-500 outline-none"
              value={adminProfile.password}
              onChange={e => setAdminProfile({...adminProfile, password: e.target.value})}
            />
          </div>
          <div className="flex items-end">
            <button 
              type="submit"
              className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                isProfileSaved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white shadow-xl hover:scale-[1.02]'
              }`}
            >
              {isProfileSaved ? 'ATUALIZADO ✅' : 'ATUALIZAR LOGIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigView;
