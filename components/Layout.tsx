
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { CompanyProfile, AdminProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: 'admin' | 'visitor';
  onLogout: () => void;
  onRefreshData?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, userRole, onLogout, onRefreshData }) => {
  const isAdmin = userRole === 'admin';
  const [config, setConfig] = useState<{company: CompanyProfile, admin: AdminProfile} | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const hasSheetsUrl = !!StorageService.getSheetsUrl();

  useEffect(() => {
    StorageService.getAppSettings().then(setConfig);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    const success = await StorageService.syncWithSheets();
    if (success && onRefreshData) {
      onRefreshData();
    }
    setIsSyncing(false);
  };

  if (!config) return null;
  
  const allTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', adminOnly: false },
    { id: 'employees', label: 'Funcionários', icon: '👷', adminOnly: false },
    { id: 'reports', label: 'Relatórios', icon: '📋', adminOnly: false },
    { id: 'matrix', label: 'Matriz de Cursos', icon: '📜', adminOnly: false },
    { id: 'import', label: 'Importação', icon: '📥', adminOnly: true },
    { id: 'config', label: 'Configuração', icon: '⚙️', adminOnly: true },
  ];

  const visibleTabs = allTabs.filter(tab => !tab.adminOnly || isAdmin);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FDFDFD]">
      <nav className="w-full md:w-80 bg-[#064E3B] text-white flex flex-col no-print shadow-2xl z-50">
        {/* LOGO UNIFICADA COM O LOGIN */}
        <div className="p-10 border-b border-green-800/50">
          <header className="flex flex-col items-center md:items-start">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 bg-orange-500 rounded-2xl shadow-lg rotate-3 opacity-20"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center text-3xl shadow-xl border-b-2 border-orange-600">
                <span>⛑️</span>
              </div>
            </div>

            <h1 className="text-3xl font-black tracking-tighter leading-none italic">
              <span className="text-white">Control</span>
              <span className="text-emerald-400">SST</span>
            </h1>
            <p className="text-[8px] text-emerald-300/40 font-black uppercase tracking-[0.2em] mt-2 italic">
              Gestão Profissional de SST
            </p>
          </header>
        </div>

        <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-5 py-4 rounded-2xl flex items-center gap-4 transition-all duration-300 group ${
                activeTab === tab.id 
                  ? 'bg-emerald-600 shadow-xl font-bold scale-[1.02]' 
                  : 'hover:bg-emerald-700/40 text-emerald-100/70 hover:text-white'
              }`}
            >
              <span className="text-xl group-hover:scale-125 duration-300">{tab.icon}</span>
              <span className="text-sm tracking-wide uppercase font-black text-[10px]">{tab.label}</span>
            </button>
          ))}

          {isAdmin && hasSheetsUrl && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`w-full text-left px-5 py-4 mt-8 rounded-2xl flex items-center gap-4 transition-all border-2 border-emerald-500/30 bg-emerald-900/20 hover:bg-emerald-500 hover:text-white ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`text-xl ${isSyncing ? 'animate-spin' : ''}`}>🔄</span>
              <span className="text-sm tracking-wide uppercase font-black text-[10px]">
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Planilha'}
              </span>
            </button>
          )}
        </div>

        <div className="p-6 border-t border-green-800/50 space-y-4">
          <div className="bg-green-900/40 p-4 rounded-3xl border border-green-700/30 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-xl">
              {isAdmin ? config.admin.icon : '👀'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black uppercase text-emerald-400 truncate tracking-widest">
                {isAdmin ? config.admin.username : 'Visitante'}
              </p>
              <p className="text-[8px] font-bold text-emerald-300/40 uppercase tracking-tighter">
                {isAdmin ? 'Controle Total' : 'Modo Leitura'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onLogout} 
            className="w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border border-red-500/20 flex items-center justify-center gap-2"
          >
            Sair do Painel 🚪
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto h-screen scroll-smooth flex flex-col bg-[#FDFDFD]">
        <div className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
