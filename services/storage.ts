
import { Employee, AdminProfile, CompanyProfile, TrainingPhoto } from '../types';
import { supabase } from './supabase';
import { formatEmployeeData } from '../utils/calculations';

// URL fornecida pelo usuário como padrão
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
  // Configurações do App (Supabase ainda é útil aqui)
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
      console.warn("Não foi possível salvar configuração no Supabase, usando local.");
    }
  },

  // BUSCA DE FUNCIONÁRIOS (HÍBRIDA)
  async getEmployees(): Promise<Employee[]> {
    // 1. Tenta buscar da Planilha primeiro (Sua fonte real)
    try {
      const sheetsData = await this.fetchDirectlyFromSheets();
      if (sheetsData.length > 0) {
        // Tenta espelhar no Supabase em background (sem travar se der erro)
        this.saveEmployees(sheetsData).catch(e => console.warn("Erro ao espelhar no Supabase:", e.message));
        return sheetsData;
      }
    } catch (e) {
      console.error("Erro ao buscar do Google Sheets, tentando Supabase...", e);
    }

    // 2. Fallback: Se o Google falhar, tenta o Supabase
    try {
      const { data, error } = await supabase.from('employees').select('*').order('name');
      if (!error && data) return data.map(item => ({ ...item, trainings: item.trainings || {} }));
    } catch (e) {
      console.error("Supabase também falhou.");
    }

    return [];
  },

  // Busca direta do Google Apps Script
  async fetchDirectlyFromSheets(): Promise<Employee[]> {
    const url = this.getSheetsUrl();
    if (!url) return [];

    try {
      const response = await fetch(url, { method: 'GET', redirect: 'follow' });
      if (!response.ok) return [];
      const text = await response.text();
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        return formatEmployeeData(data);
      }
    } catch (e) {
      console.error("Erro fetch Sheets:", e);
    }
    return [];
  },

  async saveEmployees(employees: Employee[]): Promise<void> {
    if (!employees.length) return;
    // Opcional: Salva no Supabase para busca rápida e persistência de fotos
    try {
      const { error } = await supabase.from('employees').upsert(employees, { onConflict: 'id' });
      if (error) {
        // Se der erro de coluna, não interrompemos o fluxo do usuário
        console.warn("Supabase recusou os dados (Schema Cache). Os dados estão apenas na memória/Sheets.");
      }
    } catch (err) {
      console.warn("Erro silencioso no Supabase:", err);
    }
  },

  async updateEmployee(employee: Employee): Promise<void> {
    // Se editar manualmente no app, tentamos salvar no Supabase
    try {
      await supabase.from('employees').upsert(employee);
    } catch (e) {
      alert("Nota: Edição salva apenas nesta sessão. Para persistir, altere na sua Planilha Google.");
    }
  },

  async syncWithSheets(): Promise<boolean> {
    const data = await this.fetchDirectlyFromSheets();
    if (data.length > 0) {
      await this.saveEmployees(data);
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

  async getTrainingPhotos(): Promise<TrainingPhoto[]> {
    try {
      const { data } = await supabase.from('training_photos').select('*');
      return data || [];
    } catch (e) { return []; }
  },

  async saveTrainingPhotos(photos: TrainingPhoto[]): Promise<void> {
    for (const photo of photos) {
      try { await supabase.from('training_photos').upsert(photo); } catch(e) {}
    }
  },

  getAdminProfile(): AdminProfile { return DEFAULT_ADMIN; },
  getCompanyProfile(): CompanyProfile { return DEFAULT_COMPANY; },

  async updateAdminProfile(admin: AdminProfile) {
    await this.updateAppSetting('admin_profile', admin);
  },

  async downloadBackup() {
    const data = await this.getEmployees();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_sst.json`;
    a.click();
  }
};
