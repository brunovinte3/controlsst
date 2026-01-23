
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { AdminProfile } from '../types';

const ConfigView: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => {
  const [url, setUrl] = useState(StorageService.getSheetsUrl());
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const initialAdmin = StorageService.getAdminProfile();
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(initialAdmin);
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  useEffect(() => {
    setUrl(StorageService.getSheetsUrl());
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
        onUpdate();
      } else {
        setStatus('error');
        setErrorMessage('O Google respondeu, mas não encontramos dados. Verifique os nomes das colunas (NOME, MATRICULA, etc).');
      }
    } catch (err: any) {
      console.error("Erro de Sincronização:", err);
      setStatus('error');
      setErrorMessage(err.message || 'Falha de conexão com a nuvem Google.');
    }
  };

  const googleScriptCode = `function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0];
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var jsonArray = [];
    for (var i = 1; i < data.length; i++) {
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        var header = headers[j].toString().trim();
        var value = data[i][j];
        if (value instanceof Date) {
          obj[header] = Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
        } else { obj[header] = value; }
      }
      jsonArray.push(obj);
    }
    return ContentService.createTextOutput(JSON.stringify(jsonArray))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"error": error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn space-y-12 pb-20">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-emerald-900/5 border-2 border-emerald-100">
        <header className="mb-10 text-center">
          <div className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl">📊</div>
          <h2 className="text-4xl font-black text-gray-800 mb-2 tracking-tighter">Base de Dados <span className="text-emerald-600">Google Sheets</span></h2>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest italic">Sincronização Cloud via API /exec</p>
        </header>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Alerta de Código do Script */}
          <div className="bg-emerald-900 text-white p-8 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl">⚡</div>
             <div className="relative z-10">
               <h4 className="text-emerald-400 font-black text-xs uppercase tracking-[0.2em] mb-4">🛠️ O Código Perfeito para o seu Google Script</h4>
               <p className="text-xs text-emerald-100/70 mb-6 font-medium leading-relaxed">
                 Para evitar o erro de conexão, apague tudo o que estiver no seu editor do Google Apps Script e cole o código abaixo exatamente como está. Depois, clique em <b>Implantar > Nova Implantação</b> e selecione <b>"Qualquer um"</b>.
               </p>
               <div className="relative group">
                 <pre className="bg-black/30 p-6 rounded-2xl text-[10px] font-mono overflow-x-auto leading-normal text-emerald-300 border border-emerald-500/30 max-h-60 custom-scrollbar">
                   {googleScriptCode}
                 </pre>
                 <button 
                  onClick={() => navigator.clipboard.writeText(googleScriptCode)}
                  className="absolute top-4 right-4 bg-emerald-500 text-white text-[9px] px-3 py-1 rounded-lg font-black hover:bg-emerald-400"
                 >
                   COPIAR CÓDIGO
                 </button>
               </div>
             </div>
          </div>

          <div className="bg-emerald-50 p-8 rounded-[2.5rem] border-2 border-emerald-200 shadow-inner">
            <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-4 ml-1">
              URL da Implantação Gerada (Web App):
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
                  {status === 'testing' ? '⌛ ESTABELECENDO CONEXÃO...' : 'TESTAR E SINCRONIZAR 🔄'}
                </button>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-6 py-4 bg-white border-2 border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center hover:bg-emerald-50 transition-colors shadow-sm"
                  title="Abrir no Navegador"
                >
                  🔗
                </a>
              </div>

              {status === 'success' && (
                <div className="bg-green-500 text-white p-4 rounded-xl text-center font-black text-[10px] uppercase animate-bounce">
                  ✅ Sincronização Cloud Ativa!
                </div>
              )}
              
              {status === 'error' && (
                <div className="bg-red-600 text-white p-4 rounded-xl text-center font-black text-[10px] uppercase leading-relaxed shadow-xl animate-shake">
                  {errorMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
        <header className="mb-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl">👤</div>
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Login Administrativo</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alterar credenciais de segurança</p>
          </div>
        </header>

        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Usuário</label>
            <input 
              type="text" 
              className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-4 font-bold text-sm focus:border-blue-500 outline-none"
              value={adminProfile.username}
              onChange={e => setAdminProfile({...adminProfile, username: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha</label>
            <input 
              type="text" 
              className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-4 font-bold text-sm focus:border-blue-500 outline-none"
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
              {isProfileSaved ? 'SALVO COM SUCESSO ✅' : 'ATUALIZAR ACESSO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigView;
