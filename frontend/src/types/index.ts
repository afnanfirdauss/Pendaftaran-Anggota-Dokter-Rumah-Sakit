export type Role = 'admin' | 'petugas' | 'dokter';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  is_active: boolean;
  dokter?: {
    id: number;
    name: string;
    sip: string;
    specialization: string;
    poliklinik_id: number;
    poliklinik_name?: string;
  } | null;
}

export interface Poliklinik {
  id: number;
  code: string;
  name: string;
  queue_prefix: string;
  description?: string | null;
  floor?: string | null;
  is_active: boolean;
  dokters_count?: number;
  jadwal_praktiks_count?: number;
}

export interface Dokter {
  id: number;
  user_id?: number | null;
  poliklinik_id: number;
  sip: string;
  name: string;
  specialization: string;
  phone?: string | null;
  email?: string | null;
  is_active: boolean;
  poliklinik?: Poliklinik;
  jadwal_praktiks?: JadwalPraktik[];
}

export interface JadwalPraktik {
  id: number;
  dokter_id: number;
  poliklinik_id: number;
  day_of_week: number;
  day_name: string;
  start_time: string;
  end_time: string;
  quota: number;
  is_active: boolean;
  dokter?: Dokter;
  poliklinik?: Poliklinik;
}

export interface AvailableSchedule {
  id: number;
  dokter_id: number;
  dokter_name: string;
  specialization: string;
  day_of_week: number;
  day_name: string;
  start_time: string;
  end_time: string;
  quota: number;
  booked_count: number;
  remaining_quota: number;
  is_full: boolean;
}

export interface Pasien {
  id: number;
  medical_record_number: string;
  nik?: string | null;
  name: string;
  gender: 'L' | 'P';
  birth_date: string;
  phone?: string | null;
  address?: string | null;
  first_registered_at: string;
  pendaftarans?: Pendaftaran[];
}

export type QueueStatus = 'waiting' | 'called' | 'in_progress' | 'completed' | 'cancelled';
export type VisitType = 'umum' | 'kontrol';

export interface Pendaftaran {
  id: number;
  registration_number: string;
  queue_number: string;
  queue_sequence: number;
  patient_id: number;
  dokter_id: number;
  poliklinik_id: number;
  jadwal_praktik_id: number;
  visit_date: string;
  visit_type: VisitType;
  status: QueueStatus;
  called_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  notes?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
  patient: Pasien;
  dokter: Dokter;
  poliklinik: Poliklinik;
  jadwal_praktik?: JadwalPraktik;
  registered_by?: User;
}

export interface PrintableSlipData {
  hospital_name: string;
  hospital_address: string;
  registration_number: string;
  queue_number: string;
  queue_sequence: number;
  patient_mrn: string;
  patient_name: string;
  patient_gender: string;
  poliklinik_name: string;
  poliklinik_floor: string;
  dokter_name: string;
  visit_date: string;
  schedule_time: string;
  visit_type: string;
  status: string;
  registered_at: string;
  registered_by: string;
  arrival_instructions: string[];
}

export interface DashboardData {
  metrics: {
    total_patients: number;
    today_registrations: number;
    waiting_count: number;
    in_progress_count: number;
    completed_count: number;
    cancelled_count: number;
  };
  chart_trend: Array<{
    date: string;
    label: string;
    total: number;
    completed: number;
    cancelled: number;
    active: number;
  }>;
  clinic_distribution: Array<{
    name: string;
    prefix: string;
    count: number;
  }>;
  recent_registrations: Pendaftaran[];
}

export interface PublicDisplayData {
  today: string;
  recently_called: {
    id: number;
    queue_number: string;
    patient_name: string;
    poliklinik_name: string;
    poliklinik_floor: string;
    dokter_name: string;
    called_at: string;
    called_at_timestamp: number;
  } | null;
  clinic_boards: Array<{
    clinic_id: number;
    clinic_name: string;
    prefix: string;
    floor: string;
    current_queue: string;
    current_status: string;
    current_doctor?: string | null;
    current_patient_masked?: string | null;
    waiting_count: number;
    completed_count: number;
  }>;
}

export interface LaporanData {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_registrations: number;
    completed_visits: number;
    cancelled_visits: number;
    active_visits: number;
    completion_rate: number;
  };
  clinic_breakdown: Array<{
    id: number;
    clinic_name: string;
    queue_prefix: string;
    total_visits: number;
    completed_visits: number;
    cancelled_visits: number;
  }>;
  doctor_breakdown: Array<{
    id: number;
    doctor_name: string;
    specialization: string;
    clinic_name: string;
    total_patients: number;
    completed_patients: number;
    cancelled_patients: number;
  }>;
  daily_trend: Array<{
    visit_date: string;
    total: number;
    completed: number;
    cancelled: number;
  }>;
}
