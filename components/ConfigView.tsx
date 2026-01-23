
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
        setErrorMessage('O script respondeu, mas não enviou dados de funcionários.');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage('Falha de conexão. Verifique se o script está publicado como "Qualquer um" no Google.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn space-y-12 pb-20">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-emerald-900/5 border-2 border-emerald-100">
        <header className="mb-10 text-center">
          <div className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl">📊</div>
          <h2 className="text-4xl font-black text-gray-800 mb-2 tracking-tighter">Base de Dados <span className="text-emerald-600">Google Sheets</span></h2>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest italic">Integração em tempo real com sua planilha</p>
        </header>

        <div className="max-w-2xl mx-auto space-y-8">
          <div className="bg-emerald-50 p-8 rounded-[2.5rem] border-2 border-emerald-200">
            <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-4 ml-1">
              Link Atual da Implantação:
            </label>
            <div className="space-y-4">
              <input 
                type="text" 
                className="w-full bg-white border-2 border-emerald-100 rounded-2xl p-4 text-xs font-mono focus:border-emerald-500 outline-none shadow-sm"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Cole o link /exec aqui..."
              />
              
              <div className="flex gap-4">
                <button 
                  onClick={validateAndTest}
                  disabled={status === 'testing'}
                  className="flex-1 py-4 bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {status === 'testing' ? '⌛ TESTANDO...' : 'SALVAR E SINCRONIZAR AGORA 🔄'}
                </button>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-6 py-4 bg-white border-2 border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center hover:bg-emerald-50 transition-colors"
                  title="Ver dados brutos"
                >
                  🔗
                </a>
              </div>

              {status === 'success' && (
                <div className="bg-green-500 text-white p-4 rounded-xl text-center font-black text-[10px] uppercase animate-bounce">
                  ✅ Conectado com Sucesso!
                </div>
              )}
              
              {status === 'error' && (
                <div className="bg-red-500 text-white p-4 rounded-xl text-center font-black text-[10px] uppercase">
                  ❌ {errorMessage}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-200">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic">⚠️ Lembrete de Publicação:</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              No seu Google Apps Script, ao clicar em <b>Implantar > Nova Implantação</b>, garanta que:
              <br/>• <b>Executar como:</b> Eu
              <br/>• <b>Quem pode acessar:</b> Qualquer um
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
        <header className="mb-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl">👤</div>
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Login do Administrador</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Altere seu usuário e senha de acesso</p>
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
              {isProfileSaved ? 'ATUALIZADO ✅' : 'SALVAR CREDENCIAIS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigView;
