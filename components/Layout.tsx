
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(StorageService.getLastSyncTime());
  const hasSheetsUrl = !!StorageService.getSheetsUrl();

  useEffect(() => {
    StorageService.getAppSettings().then(setConfig);
    
    const interval = setInterval(() => {
      setLastSync(StorageService.getLastSyncTime());
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    const success = await StorageService.syncWithSheets();
    if (success) {
      setLastSync(StorageService.getLastSyncTime());
      if (onRefreshData) onRefreshData();
    }
    setIsSyncing(false);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  if (!config) return null;
  
  const allTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', adminOnly: false },
    { id: 'employees', label: 'Cadastro de Funcionários', icon: '👷', adminOnly: true },
    { id: 'visitor_search', label: 'Consulta Rápida', icon: '🔍', adminOnly: false, visitorOnly: true },
    { id: 'reports', label: 'Relatórios', icon: '📋', adminOnly: false },
    { id: 'matrix', label: 'Matriz de Cursos', icon: '📜', adminOnly: false },
    { id: 'config', label: 'Configuração', icon: '⚙️', adminOnly: true },
  ];

  const visibleTabs = allTabs.filter(tab => {
    if (tab.adminOnly && !isAdmin) return false;
    if (tab.visitorOnly && isAdmin) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F0FDF4]">
      {/* Barra Superior Mobile */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#064E3B] text-white no-print sticky top-0 z-[110] shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-lg shadow-lg">⛑️</div>
          <span className="font-black italic tracking-tighter">ControlSST</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3 bg-emerald-700 rounded-xl active:scale-90 transition-transform"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`
        fixed inset-y-0 left-0 z-[105] w-72 md:relative md:w-80 bg-[#064E3B] text-white flex flex-col no-print shadow-2xl transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-10 border-b border-green-800/50">
          <header className="flex flex-col items-start">
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
          </header>
        </div>

        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
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
            <div className="pt-8 space-y-3">
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className={`w-full text-left px-5 py-4 rounded-2xl flex items-center gap-4 transition-all border-2 border-emerald-500/30 bg-emerald-900/20 hover:bg-emerald-500 hover:text-white ${isSyncing ? 'animate-pulse' : ''}`}
              >
                <span className={`text-xl ${isSyncing ? 'animate-spin' : ''}`}>🔄</span>
                <span className="text-sm tracking-wide uppercase font-black text-[10px]">
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                </span>
              </button>
              
              <div className="px-5 py-3 bg-black/20 rounded-2xl border border-emerald-800/40 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-xs italic">i</div>
                <div>
                  <p className="text-[7px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Última Atualização Sheets</p>
                  <p className="text-[9px] font-bold text-emerald-100/60 font-mono">{lastSync || 'Pendente'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-green-800/50 space-y-4 bg-green-950/20">
          <button 
            onClick={onLogout} 
            className="w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-red-500/20 flex items-center justify-center gap-2"
          >
            <span>SAIR</span> 🚪
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-x-hidden h-screen flex flex-col relative z-0">
        <div className="no-print p-4 md:px-12 md:pt-8 md:pb-0 flex justify-end">
            <div className="bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full border border-emerald-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-default">
               <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${lastSync ? 'bg-emerald-400' : 'bg-gray-400'} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${lastSync ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                  </span>
                  <p className="text-[8px] font-black text-emerald-900/40 uppercase tracking-widest leading-none">Database Status</p>
               </div>
               <div className="h-4 w-px bg-emerald-100"></div>
               <div className="flex items-center gap-2">
                  <span className="text-[10px]">☁️</span>
                  <p className="text-[9px] font-black text-emerald-700 uppercase italic">
                    {lastSync ? `Sincronizado em ${lastSync}` : 'Aguardando Sincronização Inicial'}
                  </p>
               </div>
            </div>
        </div>

        <div className="flex-1 p-4 md:p-12 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
