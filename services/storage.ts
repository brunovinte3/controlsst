
import { Employee, AdminProfile, CompanyProfile, TrainingPhoto } from '../types';
import { supabase } from './supabase';
import { formatEmployeeData } from '../utils/calculations';

const DEFAULT_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyazZ7cte9PaYLtBnlPNm62UvRjzRttAQsWxsb0vaQI6J_jZ37lgwJ4lxsFp5Do8M8c/exec';

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
      if (error) return { company: DEFAULT_COMPANY, admin: DEFAULT_ADMIN };
      const company = data?.find(i => i.key === 'company_profile')?.value || DEFAULT_COMPANY;
      const admin = data?.find(i => i.key === 'admin_profile')?.value || DEFAULT_ADMIN;
      return { company, admin };
    } catch (e) {
      return { company: DEFAULT_COMPANY, admin: DEFAULT_ADMIN };
    }
  },

  async updateAppSetting(key: 'company_profile' | 'admin_profile', value: any) {
    await supabase.from('app_settings').upsert({ key, value });
  },

  async updateCompanyProfile(company: CompanyProfile) {
    return this.updateAppSetting('company_profile', company);
  },

  async updateAdminProfile(admin: AdminProfile) {
    return this.updateAppSetting('admin_profile', admin);
  },

  async getEmployees(): Promise<Employee[]> {
    try {
      const { data, error } = await supabase.from('employees').select('*').order('name');
      if (error) {
        if (error.message.includes('company')) {
          const { data: retryData, error: retryError } = await supabase.from('employees').select('id, name, registration, role, department, trainings, photoUrl').order('name');
          if (retryError) throw retryError;
          return (retryData || []).map(item => ({ ...item, company: 'Empresa Padrão', trainings: item.trainings || {} }));
        }
        throw error;
      }
      return (data || []).map(item => ({ ...item, trainings: item.trainings || {} }));
    } catch (e) {
      return [];
    }
  },

  async saveEmployees(employees: Employee[]): Promise<void> {
    if (!employees.length) return;
    try {
      const { error } = await supabase.from('employees').upsert(employees, { onConflict: 'id' });
      if (error && error.message.includes('company')) {
        const cleanEmployees = employees.map(({ company, ...rest }) => rest);
        const { error: retryError } = await supabase.from('employees').upsert(cleanEmployees, { onConflict: 'id' });
        if (retryError) throw retryError;
        return;
      }
      if (error) throw error;
    } catch (err: any) {
      throw new Error(`Erro no Banco: ${err.message}`);
    }
  },

  async updateEmployee(employee: Employee): Promise<void> {
    return this.saveEmployees([employee]);
  },

  async syncWithSheets(): Promise<boolean> {
    const url = this.getSheetsUrl();
    if (!url) return false;

    try {
      // Simplificamos o fetch removendo headers que disparam Pre-flight CORS (OPTIONS)
      // O Google Apps Script exige redirect: follow
      const response = await fetch(url, { 
        method: 'GET',
        redirect: 'follow',
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`Google Error: ${response.status}`);
      }

      const text = await response.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Conteúdo recebido não é JSON:", text.substring(0, 100));
        throw new Error("O Google retornou uma página HTML em vez de dados. Verifique se o Script foi publicado como 'Qualquer um' e não 'Qualquer um com conta Google'.");
      }
      
      if (Array.isArray(data)) {
        const formatted = formatEmployeeData(data);
        if (formatted.length > 0) {
          await this.saveEmployees(formatted);
          return true;
        }
      }
      return false;
    } catch (e: any) {
      console.error("Erro na Sincronização:", e);
      if (e.message === 'Failed to fetch') {
        throw new Error("CORS Block: O navegador impediu a conexão. Certifique-se de que o seu script doGet() retorna ContentService.MimeType.JSON.");
      }
      throw e;
    }
  },

  getSheetsUrl(): string {
    return localStorage.getItem('google_sheets_url') || DEFAULT_SHEETS_URL;
  },

  saveSheetsUrl(url: string): void {
    localStorage.setItem('google_sheets_url', url.trim());
  },

  async getTrainingPhotos(): Promise<TrainingPhoto[]> {
    const { data } = await supabase.from('training_photos').select('*');
    return data || [];
  },

  async saveTrainingPhotos(photos: TrainingPhoto[]): Promise<void> {
    for (const photo of photos) {
      await supabase.from('training_photos').upsert(photo);
    }
  },

  async removeTrainingPhoto(id: string): Promise<void> {
    await supabase.from('training_photos').delete().eq('id', id);
  },

  getAdminProfile(): AdminProfile { return DEFAULT_ADMIN; },
  getCompanyProfile(): CompanyProfile { return DEFAULT_COMPANY; },

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
