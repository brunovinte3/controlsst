
import { Employee, AdminProfile, CompanyProfile, TrainingPhoto } from '../types';
import { supabase } from './supabase';

const DEFAULT_ADMIN: AdminProfile = {
  username: 'Bruno',
  password: '#Bruno91218175',
  email: 'brunosilva1232014@gmail.com',
  icon: '👨‍💼'
};

const DEFAULT_COMPANY: CompanyProfile = {
  name: 'ControlSST',
  cnpj: '00.000.000/0001-00',
  logoUrl: '🛡️',
  footerText: 'Relatório Gerencial de Conformidade Normativa'
};

export const StorageService = {
  async getAppSettings(): Promise<{ company: CompanyProfile, admin: AdminProfile }> {
    const { data, error } = await supabase.from('app_settings').select('*');
    if (error || !data || data.length === 0) {
      return { company: DEFAULT_COMPANY, admin: DEFAULT_ADMIN };
    }
    
    const company = data.find(i => i.key === 'company_profile')?.value || DEFAULT_COMPANY;
    const admin = data.find(i => i.key === 'admin_profile')?.value || DEFAULT_ADMIN;
    
    return { company, admin };
  },

  async updateAppSetting(key: 'company_profile' | 'admin_profile', value: any) {
    await supabase.from('app_settings').upsert({ key, value });
  },

  // Fix: Added missing method to update company profile in app settings
  async updateCompanyProfile(company: CompanyProfile) {
    return this.updateAppSetting('company_profile', company);
  },

  // Fix: Added missing method to update admin profile in app settings
  async updateAdminProfile(admin: AdminProfile) {
    return this.updateAppSetting('admin_profile', admin);
  },

  // Fix: Added missing method to retrieve Google Sheets URL from local storage
  getSheetsUrl(): string | null {
    return localStorage.getItem('sst_sheets_url');
  },

  // Fix: Added missing method to persist Google Sheets URL in local storage
  saveSheetsUrl(url: string) {
    localStorage.setItem('sst_sheets_url', url);
  },

  async getEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase.from('employees').select('*');
    if (error) return [];
    return data.map(item => ({
        ...item,
        trainings: item.trainings || {}
    }));
  },

  async saveEmployees(employees: Employee[]): Promise<void> {
    // Para simplificar, deletamos e inserimos ou fazemos upsert
    // O ideal em produção seria um upsert baseado em ID
    for (const emp of employees) {
      await supabase.from('employees').upsert(emp);
    }
  },

  async addEmployees(newEmployees: Employee[]): Promise<Employee[]> {
    for (const emp of newEmployees) {
      await supabase.from('employees').upsert(emp);
    }
    return this.getEmployees();
  },

  async updateEmployee(updatedEmp: Employee): Promise<Employee[]> {
    await supabase.from('employees').upsert(updatedEmp);
    return this.getEmployees();
  },

  async deleteEmployee(id: string): Promise<Employee[]> {
    await supabase.from('employees').delete().eq('id', id);
    return this.getEmployees();
  },

  async getTrainingPhotos(): Promise<TrainingPhoto[]> {
    const { data, error } = await supabase.from('training_photos').select('*');
    if (error) return [];
    return data;
  },

  async saveTrainingPhotos(photos: TrainingPhoto[]): Promise<void> {
    // Upsert das fotos
    for (const photo of photos) {
      await supabase.from('training_photos').upsert(photo);
    }
  },

  async removeTrainingPhoto(id: string): Promise<void> {
    await supabase.from('training_photos').delete().eq('id', id);
  },

  // Perfil administrativo estático ou vindo do DB
  getAdminProfile(): AdminProfile {
    return DEFAULT_ADMIN;
  },

  getCompanyProfile(): CompanyProfile {
    return DEFAULT_COMPANY;
  },

  downloadBackup() {
    this.getEmployees().then(data => {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_sst_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    });
  }
};
