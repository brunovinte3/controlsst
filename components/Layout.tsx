
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { CompanyProfile, AdminProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: 'admin' | 'visitor';
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, userRole, onLogout }) => {
  const isAdmin = userRole === 'admin';
  const [config, setConfig] = useState<{company: CompanyProfile, admin: AdminProfile} | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempLogo, setTempLogo] = useState('');
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    StorageService.getAppSettings().then(data => {
      setConfig(data);
      setTempLogo(data.company.logoUrl);
      setTempName(data.company.name);
    });
  }, []);

  const saveChanges = async () => {
    if (!config) return;
    const newCompany = { ...config.company, logoUrl: tempLogo, name: tempName };
    await StorageService.updateAppSetting('company_profile', newCompany);
    setConfig({ ...config, company: newCompany });
    setIsEditing(false);
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
        <div className="p-8 border-b border-green-800/50 relative group">
          {isAdmin && (
            <button 
              onClick={() => isEditing ? saveChanges() : setIsEditing(true)}
              className="absolute top-4 right-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {isEditing ? '💾' : '✏️'}
            </button>
          )}

          {isEditing ? (
            <div className="space-y-3 animate-fadeIn">
              <input 
                type="text" 
                className="w-full bg-green-900/50 border border-green-700 p-2 rounded text-[10px]"
                value={tempLogo}
                onChange={e => setTempLogo(e.target.value)}
                placeholder="URL do Logo"
              />
              <input 
                type="text" 
                className="w-full bg-green-900/50 border border-green-700 p-2 rounded text-[10px] font-bold"
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                placeholder="Nome do App"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-orange-500 w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-orange-400/30">
                 <span className="text-2xl">⛑️</span>
              </div>
              <h1 className="text-2xl font-black tracking-tighter leading-none italic truncate">
                <span className="text-white">Control</span>
                <span className="text-emerald-400">SST</span>
              </h1>
            </div>
          )}
          <p className="text-[9px] text-emerald-300/40 font-black uppercase tracking-[0.2em] mt-3 italic">SST Intel Management System</p>
        </div>

        <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-5 py-4 rounded-2xl flex items-center gap-4 transition-all duration-300 group ${
                activeTab === tab.id 
                  ? 'bg-emerald-600 shadow-xl shadow-emerald-900/30 font-bold scale-[1.02]' 
                  : 'hover:bg-emerald-700/40 text-emerald-100/70 hover:text-white'
              }`}
            >
              <span className={`text-xl transition-transform group-hover:scale-125 duration-300 ${activeTab === tab.id ? 'animate-bounce-short' : ''}`}>
                {tab.icon}
              </span>
              <span className="text-sm tracking-wide uppercase font-black text-[10px]">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-green-800/50 space-y-4">
          <div className="bg-green-900/40 p-4 rounded-3xl border border-green-700/30 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-xl shadow-inner">
              {isAdmin ? config.admin.icon : '👀'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black uppercase text-emerald-400 truncate tracking-widest">
                {isAdmin ? config.admin.username : 'Visitante'}
              </p>
              <p className="text-[8px] font-bold text-emerald-300/40 uppercase tracking-tighter">
                {isAdmin ? 'Acesso Administrativo' : 'Modo Leitura'}
              </p>
            </div>
          </div>
          
          <button onClick={onLogout} className="w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border border-red-500/20 shadow-lg shadow-red-950/20">
            Encerrar Sessão 🚪
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto h-screen scroll-smooth flex flex-col bg-[#FDFDFD]">
        <div className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
          {children}
        </div>
        <footer className="p-8 text-center border-t border-gray-50 no-print">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 italic">
            ControlSST © {new Date().getFullYear()} • <span className="text-emerald-300/50">brunosilva1232014@gmail.com</span>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Layout;
