
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeView from './components/EmployeeView';
import Reports from './components/Reports';
import MatrixView from './components/MatrixView';
import ImportData from './components/ImportData';
import ConfigView from './components/ConfigView';
import AuthView from './components/AuthView';
import { Employee, UserRole } from './types';
import { StorageService } from './services/storage';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null); 

  const isAdmin = userRole === 'admin';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await StorageService.getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userRole) {
      loadData();
      // Auto-sync ao abrir se tiver URL configurada
      if (isAdmin && StorageService.getSheetsUrl()) {
        StorageService.syncWithSheets().then(success => {
          if (success) loadData();
        });
      }
    }
  }, [userRole]);

  const handleImport = async (data: Employee[]) => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      await StorageService.saveEmployees(data);
      await loadData();
      setActiveTab('dashboard');
    } catch (error) {
      alert("Erro ao salvar dados.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!userRole) {
    return <AuthView onLogin={(role) => setUserRole(role)} />;
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <div className="w-12 h-12 border-4 border-green-100 border-t-green-600 rounded-full animate-spin"></div>
          <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Acessando Nuvem SST...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard employees={employees} isAdmin={isAdmin} />;
      case 'employees': return <EmployeeView employees={employees} onUpdate={loadData} isAdmin={isAdmin} />;
      case 'reports': return <Reports employees={employees} />;
      case 'matrix': return <MatrixView />;
      case 'import': return isAdmin ? (
        <div className="space-y-10">
           <ImportData onImport={handleImport} />
           <div className="max-w-6xl mx-auto bg-white p-8 rounded-[2.5rem] border border-gray-100 flex items-center justify-between shadow-sm">
             <div>
                <h4 className="font-black text-gray-800">Cópia de Segurança (Backup)</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Baixe todos os dados locais do navegador</p>
             </div>
             <button 
                onClick={() => StorageService.downloadBackup()}
                className="bg-blue-50 text-blue-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-100 transition-all"
             >
                Baixar Arquivo .JSON 💾
             </button>
           </div>
        </div>
      ) : null;
      case 'config': return isAdmin ? <ConfigView onUpdate={loadData} /> : null;
      default: return <Dashboard employees={employees} isAdmin={isAdmin} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      userRole={userRole} 
      onLogout={() => setUserRole(null)}
      onRefreshData={loadData}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
