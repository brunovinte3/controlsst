
import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { formatEmployeeData } from '../utils/calculations';
import { AdminProfile } from '../types';

const ConfigView: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => {
  const [url, setUrl] = useState(StorageService.getSheetsUrl() || '');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Profile State
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
        obj[header] = row[i];
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
    if (!url.includes('script.google.com')) {
      setStatus('error');
      setErrorMessage('A URL fornecida não é um link válido do Google Scripts.');
      return;
    }

    setStatus('testing');
    setErrorMessage('');

    let testUrl = url.trim();
    if (!testUrl.endsWith('/exec')) {
       testUrl = testUrl.replace(/\/$/, '') + '/exec';
    }

    try {
      const response = await fetch(testUrl, { cache: 'no-store' });
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Erro no Script: ${data.error}`);
      }

      if (Array.isArray(data)) {
        const employees = formatEmployeeData(data);
        await StorageService.saveEmployees(employees);
        setStatus('success');
        StorageService.saveSheetsUrl(url);
        onUpdate();
      } else {
        throw new Error("O script não retornou uma lista de funcionários.");
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Falha ao acessar o Script.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn space-y-12 pb-20">
      {/* Seção 1: Segurança e Identidade */}
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
        <header className="mb-10">
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
            <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl">👤</span>
            Segurança e Identidade do Administrador
          </h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 ml-14 italic">Gerenciar credenciais de acesso e perfil</p>
        </header>

        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome de Usuário (Login)</label>
            <input 
              type="text" 
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-sm focus:border-blue-500 outline-none transition-all"
              value={adminProfile.username}
              onChange={e => setAdminProfile({...adminProfile, username: e.target.value})}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
            <input 
              type="text" 
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-sm focus:border-blue-500 outline-none transition-all"
              value={adminProfile.password}
              onChange={e => setAdminProfile({...adminProfile, password: e.target.value})}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Ícone de Perfil</label>
            <div className="flex gap-4">
              <input 
                type="text" 
                maxLength={2}
                className="w-20 bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-2xl text-center outline-none focus:border-blue-500"
                value={adminProfile.icon}
                onChange={e => setAdminProfile({...adminProfile, icon: e.target.value})}
              />
              <button 
                type="submit"
                className={`flex-1 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  isProfileSaved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white shadow-xl shadow-blue-900/20 hover:scale-[1.02]'
                }`}
              >
                {isProfileSaved ? 'ATUALIZADO ✅' : 'SALVAR PERFIL'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Seção 2: Cloud Sync (Inalterado, apenas ajustes de padding) */}
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
        <header className="mb-10 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">☁️</div>
          <h2 className="text-3xl font-black text-gray-800 mb-2 tracking-tighter">Conexão <span className="text-green-600 italic">Cloud SST</span></h2>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest italic">Sincronização em tempo real com Planilhas Google</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter">
              <span className="text-green-500">1.</span> Script de Integração
            </h3>
            <div className="relative group">
              <pre className="bg-gray-900 text-green-400 p-6 rounded-3xl text-[10px] font-mono overflow-hidden h-48 border-2 border-gray-800 group-hover:border-green-500 transition-all">
                {scriptCode}
              </pre>
              <button 
                onClick={() => { navigator.clipboard.writeText(scriptCode); alert('Copiado!'); }}
                className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
              >
                Copiar
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter">
              <span className="text-green-500">2.</span> Ponto de Extremidade (Endpoint)
            </h3>
            <div className="space-y-4">
              <input 
                type="text" 
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 outline-none text-sm font-mono"
                placeholder="URL do App da Web do Google Script"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button 
                onClick={validateAndTest}
                className="w-full py-5 bg-[#064E3B] text-green-400 rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-green-900/20"
              >
                SINCRONIZAR AGORA 🔄
              </button>
              {status === 'success' && <p className="text-center text-[10px] font-black text-green-600 uppercase">Sincronização concluída com sucesso!</p>}
              {errorMessage && <p className="text-center text-[10px] font-black text-red-500 uppercase">{errorMessage}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigView;
