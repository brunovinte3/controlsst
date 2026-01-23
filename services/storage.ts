
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
    try {
      const { data, error } = await supabase.from('app_settings').select('*');
      if (error) {
        console.error("Erro Supabase (app_settings):", error.message);
        return { company: DEFAULT_COMPANY, admin: DEFAULT_ADMIN };
      }
      
      const company = data?.find(i => i.key === 'company_profile')?.value || DEFAULT_COMPANY;
      const admin = data?.find(i => i.key === 'admin_profile')?.value || DEFAULT_ADMIN;
      
      return { company, admin };
    } catch (e) {
      console.error("Falha crítica ao buscar configurações:", e);
      return { company: DEFAULT_COMPANY, admin: DEFAULT_ADMIN };
    }
  },

  async updateAppSetting(key: 'company_profile' | 'admin_profile', value: any) {
    const { error } = await supabase.from('app_settings').upsert({ key, value });
    if (error) console.error("Erro ao salvar configuração:", error.message);
  },

  async updateCompanyProfile(company: CompanyProfile) {
    return this.updateAppSetting('company_profile', company);
  },

  async updateAdminProfile(admin: AdminProfile) {
    return this.updateAppSetting('admin_profile', admin);
  },

  getSheetsUrl(): string | null {
    return localStorage.getItem('sst_sheets_url');
  },

  saveSheetsUrl(url: string) {
    localStorage.setItem('sst_sheets_url', url);
  },

  async getEmployees(): Promise<Employee[]> {
    try {
      const { data, error } = await supabase.from('employees').select('*');
      if (error) {
        console.error("Erro Supabase (employees):", error.message);
        return [];
      }
      return (data || []).map(item => ({
          ...item,
          trainings: item.trainings || {}
      }));
    } catch (e) {
      console.error("Falha ao buscar funcionários:", e);
      return [];
    }
  },

  async saveEmployees(employees: Employee[]): Promise<void> {
    for (const emp of employees) {
      const { error } = await supabase.from('employees').upsert(emp);
      if (error) console.error(`Erro ao salvar funcionário ${emp.name}:`, error.message);
    }
  },

  async addEmployees(newEmployees: Employee[]): Promise<Employee[]> {
    await this.saveEmployees(newEmployees);
    return this.getEmployees();
  },

  async updateEmployee(updatedEmp: Employee): Promise<Employee[]> {
    const { error } = await supabase.from('employees').upsert(updatedEmp);
    if (error) console.error("Erro ao atualizar funcionário:", error.message);
    return this.getEmployees();
  },

  async deleteEmployee(id: string): Promise<Employee[]> {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) console.error("Erro ao deletar funcionário:", error.message);
    return this.getEmployees();
  },

  async getTrainingPhotos(): Promise<TrainingPhoto[]> {
    const { data, error } = await supabase.from('training_photos').select('*');
    if (error) {
      console.error("Erro Supabase (photos):", error.message);
      return [];
    }
    return data || [];
  },

  async saveTrainingPhotos(photos: TrainingPhoto[]): Promise<void> {
    for (const photo of photos) {
      const { error } = await supabase.from('training_photos').upsert(photo);
      if (error) console.error("Erro ao salvar foto:", error.message);
    }
  },

  async removeTrainingPhoto(id: string): Promise<void> {
    const { error } = await supabase.from('training_photos').delete().eq('id', id);
    if (error) console.error("Erro ao remover foto:", error.message);
  },

  getAdminProfile(): AdminProfile {
    return DEFAULT_ADMIN;
  },

  getCompanyProfile(): CompanyProfile {
    return DEFAULT_COMPANY;
  },

  async downloadBackup() {
    const data = await this.getEmployees();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_sst_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }
};
