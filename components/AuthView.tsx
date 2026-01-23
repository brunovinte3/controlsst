
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { UserRole, CompanyProfile, AdminProfile } from '../types';

interface AuthViewProps {
  onLogin: (role: UserRole) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [appConfig, setAppConfig] = useState<{company: CompanyProfile, admin: AdminProfile} | null>(null);

  useEffect(() => {
    StorageService.getAppSettings().then(config => {
      setAppConfig(config);
    });
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appConfig) return;
    
    if (username === appConfig.admin.username && password === appConfig.admin.password) {
      onLogin('admin');
    } else {
      setError('Credenciais incorretas. Verifique usuário e senha.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(`Um link de recuperação foi enviado para brunosilva1232014@gmail.com`);
    setTimeout(() => {
      setSuccess('');
      setMode('login');
    }, 4000);
  };

  if (!appConfig) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-['Inter']">
      <div className="w-full max-w-md bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-gray-100 animate-fadeIn relative">
        
        <div className="p-12">
          <header className="text-center mb-10">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-orange-500 rounded-3xl shadow-xl shadow-orange-900/20 rotate-3 animate-pulse opacity-20"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-orange-400 to-amber-500 rounded-3xl flex items-center justify-center text-5xl shadow-xl shadow-orange-900/40 animate-bounce-short z-10 border-b-4 border-orange-600 overflow-hidden">
                <span className="drop-shadow-lg">⛑️</span>
              </div>
            </div>

            <h1 className="text-5xl font-black tracking-tighter leading-none italic">
              <span className="text-[#064E3B]">Control</span>
              <span className="text-emerald-500">SST</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.25em] mt-3">Gestão Profissional de SST</p>
          </header>

          {mode === 'login' ? (
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Usuário Administrador</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-4 pl-6 font-bold text-sm outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-inner"
                  placeholder="Nome de usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                <input 
                  type="password" 
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-4 pl-6 font-bold text-sm outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-inner"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <p className="text-red-500 text-[10px] font-black uppercase text-center animate-pulse">{error}</p>}

              <button 
                type="submit"
                className="w-full py-5 bg-[#064E3B] text-emerald-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all"
              >
                Acessar Painel ⚡
              </button>

              <div className="flex flex-col gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-emerald-600 transition-colors"
                >
                  Esqueci minha senha
                </button>
                <button 
                  type="button"
                  onClick={() => onLogin('visitor')}
                  className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-orange-600 shadow-xl"
                >
                  Acesso de Consulta 👁️
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgot} className="space-y-6 animate-fadeIn">
              <div className="text-center mb-6">
                <h3 className="text-lg font-black text-gray-800 tracking-tight">Recuperar Acesso</h3>
                <p className="text-[11px] text-gray-500 font-medium italic">As instruções serão enviadas para o e-mail de segurança.</p>
              </div>
              {success ? (
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 text-center">
                   <p className="text-emerald-700 font-black text-[10px] uppercase">{success}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail Administrativo</label>
                    <input 
                      required
                      type="email" 
                      className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-4 font-bold text-sm outline-none focus:bg-white focus:border-emerald-500"
                      placeholder="brunosilva1232014@gmail.com"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-5 bg-[#064E3B] text-emerald-400 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/20"
                  >
                    Enviar Link de Resgate
                  </button>
                  <button 
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"
                  >
                    Voltar para o Login
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;
