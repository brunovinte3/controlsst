
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
      setErrorMessage('URL inválida. Deve começar com https://script.google.com');
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
        throw new Error("A planilha não retornou dados. Verifique se há conteúdo nela.");
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage('Erro de conexão. Verifique se você configurou "Quem pode acessar" como "Qualquer um" no Google.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn space-y-12 pb-20">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
        <header className="mb-10 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4">☁️</div>
          <h2 className="text-3xl font-black text-gray-800 mb-2 tracking-tighter">Planilha como <span className="text-green-600 italic">Banco de Dados</span></h2>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest italic">Sincronização em Tempo Real com Google Sheets</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter">
              <span className="text-green-500">1.</span> Copiar este Código
            </h3>
            <p className="text-[11px] text-gray-500 leading-relaxed italic">
              Clique no botão abaixo para copiar o script que deve ser colado no Google Sheets (Extensões > Apps Script).
            </p>
            <div className="relative group">
              <pre className="bg-gray-900 text-green-400 p-6 rounded-3xl text-[10px] font-mono overflow-hidden h-48 border-2 border-gray-800 group-hover:border-green-500 transition-all">
                {scriptCode}
              </pre>
              <button 
                onClick={() => { navigator.clipboard.writeText(scriptCode); alert('Script copiado com sucesso!'); }}
                className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
              >
                Copiar Script 📋
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter">
              <span className="text-green-500">2.</span> Publicar "App da Web"
            </h3>
            <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 space-y-3">
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">⚠️ Importante no Google Sheets:</p>
              <ul className="text-[11px] text-emerald-700 space-y-2 font-medium">
                <li>• Clique em <b>Implantar</b> &gt; <b>Nova Implantação</b></li>
                <li>• Tipo: Escolha <b>"App da Web"</b></li>
                <li>• Quem pode acessar: Escolha <b>"Qualquer um"</b></li>
                <li>• Copie a URL gerada e cole abaixo:</li>
              </ul>
              <input 
                type="text" 
                className="w-full bg-white border-2 border-emerald-200 rounded-2xl p-4 outline-none text-sm font-mono focus:border-green-500 shadow-sm"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button 
                onClick={validateAndTest}
                disabled={status === 'testing'}
                className="w-full py-5 bg-[#064E3B] text-green-400 rounded-2xl font-black text-xs tracking-widest shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                {status === 'testing' ? 'CONECTANDO...' : 'SALVAR URL E SINCRONIZAR 🔄'}
              </button>
              {status === 'success' && <p className="text-center text-[10px] font-black text-green-600 uppercase animate-bounce">✅ Planilha conectada com sucesso!</p>}
              {status === 'error' && <p className="text-center text-[10px] font-black text-red-500 uppercase">❌ {errorMessage}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
        <header className="mb-10">
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
            <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl">👤</span>
            Perfil do Administrador
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
              {isProfileSaved ? 'SALVO ✅' : 'SALVAR PERFIL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigView;
