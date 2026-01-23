
export type TrainingStatus = 'VALID' | 'EXPIRING' | 'EXPIRED' | 'NOT_TRAINED';

export interface NRCourse {
  id: string;
  name: string;
  validityYears: number | null; 
  description?: string;
  workload?: string;
}

export interface TrainingRecord {
  courseId: string;
  completionDate?: string; 
  expiryDate?: string;
  status: TrainingStatus;
}

export interface Employee {
  id: string;
  name: string;
  registration: string;
  role: string;
  department: string;
  company: string; // Nova coluna para gestão multi-empresa
  photoUrl?: string;
  trainings: Record<string, TrainingRecord>;
}

export interface AdminProfile {
  username: string;
  password: string;
  email: string;
  icon: string;
}

export interface CompanyProfile {
  name: string;
  cnpj: string;
  logoUrl: string;
  footerText: string;
}

export interface TrainingPhoto {
  id: string;
  url: string;
  caption: string;
}

export type UserRole = 'admin' | 'visitor' | null;
