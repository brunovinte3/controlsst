
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
    try {
      await supabase.from('app_settings').upsert({ key, value });
    } catch (e) {
      console.warn("Não foi possível salvar configuração no Supabase.");
    }
  },

  async getEmployees(): Promise<Employee[]> {
    try {
      const sheetsData = await this.fetchDirectlyFromSheets();
      if (sheetsData.length > 0) {
        this.saveEmployees(sheetsData).catch(e => console.warn("Erro ao espelhar no Supabase"));
        return sheetsData;
      }
    } catch (e) {
      console.error("Erro ao buscar do Google Sheets");
    }

    try {
      const { data, error } = await supabase.from('employees').select('*').order('name');
      if (!error && data) return data.map(item => ({ ...item, trainings: item.trainings || {} }));
    } catch (e) {
      console.error("Supabase falhou");
    }

    return [];
  },

  async fetchDirectlyFromSheets(): Promise<Employee[]> {
    const url = this.getSheetsUrl();
    if (!url) return [];

    try {
      const response = await fetch(url, { method: 'GET', redirect: 'follow' });
      if (!response.ok) return [];
      const text = await response.text();
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        const formatted = formatEmployeeData(data);
        if (formatted.length > 0) {
           this.setLastSyncTime(); // Registra o sucesso aqui
        }
        return formatted;
      }
    } catch (e) {
      console.error("Erro fetch Sheets");
    }
    return [];
  },

  async saveEmployees(employees: Employee[]): Promise<void> {
    if (!employees.length) return;
    try {
      await supabase.from('employees').upsert(employees, { onConflict: 'id' });
    } catch (err) {}
  },

  async updateEmployee(employee: Employee): Promise<void> {
    try {
      await supabase.from('employees').upsert(employee);
    } catch (e) {
      alert("Salvo apenas localmente.");
    }
  },

  async syncWithSheets(): Promise<boolean> {
    const data = await this.fetchDirectlyFromSheets();
    if (data.length > 0) {
      await this.saveEmployees(data);
      this.setLastSyncTime(); // Garante o registro no sync explícito
      return true;
    }
    return false;
  },

  getSheetsUrl(): string {
    return localStorage.getItem('google_sheets_url') || DEFAULT_SHEETS_URL;
  },

  saveSheetsUrl(url: string): void {
    localStorage.setItem('google_sheets_url', url.trim());
  },

  getLastSyncTime(): string | null {
    return localStorage.getItem('last_sync_timestamp');
  },

  setLastSyncTime(): void {
    const now = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    localStorage.setItem('last_sync_timestamp', now);
  },

  getAdminProfile(): AdminProfile { return DEFAULT_ADMIN; },
  getCompanyProfile(): CompanyProfile { return DEFAULT_COMPANY; },

  async updateAdminProfile(admin: AdminProfile) {
    await this.updateAppSetting('admin_profile', admin);
  }
};
