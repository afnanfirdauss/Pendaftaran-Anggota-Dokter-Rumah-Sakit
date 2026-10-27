import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { api } from '../lib/api';
import { Pasien, Poliklinik, AvailableSchedule, PrintableSlipData, Pendaftaran } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Skeleton } from '../components/common/Skeleton';
import { PrintableSlip } from '../components/registration/PrintableSlip';
import { formatDate } from '../lib/utils';
import {
  Search,
  UserCheck,
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';

export const PendaftaranBaru: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const preselectedPatientId = searchParams.get('patient_id');

  // Form State
  const [selectedPatient, setSelectedPatient] = useState<Pasien | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedClinicId, setSelectedClinicId] = useState<number | ''>('');
  const [visitDate, setVisitDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | ''>('');
  const [visitType, setVisitType] = useState<'umum' | 'kontrol'>('umum');
  const [notes, setNotes] = useState('');

  // Success Modal & Printable Slip State
  const [successSlip, setSuccessSlip] = useState<PrintableSlipData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch preselected patient if param exists
  useEffect(() => {
    if (preselectedPatientId) {
      api.get<{ success: boolean; data: Pasien }>(`/pasiens/${preselectedPatientId}`)
        .then((res) => {
          if (res.success && res.data) {
            setSelectedPatient(res.data);
          }
        })
        .catch(() => {});
    }
  }, [preselectedPatientId]);

  // 2. Patient Search Query
  const { data: searchResults } = useQuery<{ success: boolean; data: { data: Pasien[] } }>({
    queryKey: ['patient-search', patientSearch],
    queryFn: () => api.get(`/pasiens?search=${encodeURIComponent(patientSearch)}&per_page=5`),
    enabled: patientSearch.length >= 2,
  });

  // 3. Fetch Active Polikliniks
  const { data: clinicsData, isLoading: clinicsLoading } = useQuery<{ success: boolean; data: Poliklinik[] }>({
    queryKey: ['polikliniks-active'],
    queryFn: () => api.get('/polikliniks?active_only=true'),
  });

  // 4. Fetch Available Schedules for chosen Clinic and Date (with quota check)
  const { data: schedulesData, isLoading: schedulesLoading } = useQuery<{
    success: boolean;
    day_name: string;
    data: AvailableSchedule[];
  }>({
    queryKey: ['available-schedules', selectedClinicId, visitDate],
    queryFn: () =>
      api.get(
        `/jadwal-praktiks/available?poliklinik_id=${selectedClinicId}&visit_date=${visitDate}`
      ),
    enabled: !!selectedClinicId && !!visitDate,
  });

  const availableSchedules = schedulesData?.data || [];
  const selectedSchedule = availableSchedules.find((s) => s.id === Number(selectedScheduleId));

  // 5. Submit Registration Mutation
  const registerMutation = useMutation({
    mutationFn: (payload: any) => api.post<{ success: boolean; data: Pendaftaran; slip: PrintableSlipData }>('/pendaftarans', payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['antrean'] });

      // Trigger celebration confetti for delight
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      setSuccessSlip(res.slip);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Gagal membuat pendaftaran kunjungan.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      setErrorMessage('Silakan pilih pasien terlebih dahulu.');
      return;
    }
    if (!selectedClinicId) {
      setErrorMessage('Silakan pilih poliklinik tujuan.');
      return;
    }
    if (!selectedSchedule) {
      setErrorMessage('Silakan pilih jadwal dokter yang tersedia.');
      return;
    }
    if (selectedSchedule.is_full) {
      setErrorMessage('Jadwal dokter ini sudah penuh. Silakan pilih dokter atau tanggal lain.');
      return;
    }

    setErrorMessage(null);

    registerMutation.mutate({
      patient_id: selectedPatient.id,
      poliklinik_id: Number(selectedClinicId),
      dokter_id: selectedSchedule.dokter_id,
      jadwal_praktik_id: selectedSchedule.id,
      visit_date: visitDate,
      visit_type: visitType,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Form Pendaftaran Kunjungan Pasien</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Nomor antrean dan karcis pendaftaran akan di-generate otomatis oleh sistem
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-start gap-2.5 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="font-semibold">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Pilih Pasien */}
        <Card
          className="p-5"
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <h3 className="text-sm font-bold text-slate-900">Pilih Data Pasien</h3>
              </div>
              {selectedPatient && (
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Ganti Pasien
                </button>
              )}
            </div>
          }
        >
          {selectedPatient ? (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{selectedPatient.name}</span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-200/80 text-blue-900">
                      {selectedPatient.medical_record_number}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedPatient.gender === 'L' ? 'Laki-laki' : 'Perempuan'} • Lahir: {formatDate(selectedPatient.birth_date)} • Telp: {selectedPatient.phone || '-'}
                  </p>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ketik minimal 2 huruf: Nama Pasien, NRM, atau NIK..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              {/* Search Results Dropdown List */}
              {searchResults?.data?.data && searchResults.data.data.length > 0 && (
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-md overflow-hidden">
                  {searchResults.data.data.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPatient(p);
                        setPatientSearch('');
                      }}
                      className="p-3 hover:bg-blue-50/60 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-xs sm:text-sm text-slate-800">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {p.medical_record_number} • {p.gender === 'L' ? 'Laki-laki' : 'Perempuan'} • {p.phone || 'No telp -'}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs py-1 px-2.5">
                        Pilih
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400 mr-2">Pasien belum pernah berobat?</span>
                <button
                  type="button"
                  onClick={() => navigate('/pasiens')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Daftarkan Pasien Baru Dulu
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Step 2: Pilih Poliklinik & Tanggal Kunjungan */}
        <Card
          className="p-5"
          header={
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                2
              </span>
              <h3 className="text-sm font-bold text-slate-900">Poliklinik & Tanggal Kunjungan</h3>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Pilih Poliklinik Tujuan <span className="text-rose-500">*</span>
              </label>
              {clinicsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <select
                  value={selectedClinicId}
                  onChange={(e) => {
                    setSelectedClinicId(e.target.value ? Number(e.target.value) : '');
                    setSelectedScheduleId('');
                  }}
                  className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  required
                >
                  <option value="">-- Pilih Poliklinik --</option>
                  {clinicsData?.data.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.queue_prefix}] {c.name} ({c.floor || 'Lantai 1'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <Input
              label="Tanggal Kunjungan"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={visitDate}
              onChange={(e) => {
                setVisitDate(e.target.value);
                setSelectedScheduleId('');
              }}
              required
            />
          </div>

          {/* Schedule Options for this clinic and date */}
          {selectedClinicId && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                Pilih Jadwal Dokter Bertugas (Hari: {schedulesData?.day_name || '...'}) <span className="text-rose-500">*</span>
              </label>

              {schedulesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : availableSchedules.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableSchedules.map((schedule) => {
                    const isSelected = Number(selectedScheduleId) === schedule.id;

                    return (
                      <div
                        key={schedule.id}
                        onClick={() => {
                          if (!schedule.is_full) {
                            setSelectedScheduleId(schedule.id);
                          }
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          schedule.is_full
                            ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-50/90 border-blue-600 shadow-sm ring-1 ring-blue-600'
                            : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-xs sm:text-sm text-slate-900">
                              {schedule.dokter_name}
                            </div>
                            <div className="text-[11px] text-teal-700 font-medium">
                              {schedule.specialization}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              schedule.is_full
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {schedule.is_full ? 'Penuh' : `Sisa ${schedule.remaining_quota}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {schedule.start_time} - {schedule.end_time} WIB
                          </span>
                          <span>•</span>
                          <span>
                            Kuota: {schedule.booked_count}/{schedule.quota}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
                  Tidak ada dokter yang bertugas di poliklinik ini pada hari {schedulesData?.day_name || 'terpilih'}. Silakan pilih tanggal atau poliklinik lain.
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Step 3: Informasi Kunjungan */}
        <Card
          className="p-5"
          header={
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                3
              </span>
              <h3 className="text-sm font-bold text-slate-900">Detail & Catatan Kunjungan</h3>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Jenis Kunjungan"
              value={visitType}
              onChange={(e) => setVisitType(e.target.value as 'umum' | 'kontrol')}
              options={[
                { value: 'umum', label: 'Pasien Baru / Kunjungan Umum' },
                { value: 'kontrol', label: 'Kontrol Berkala / Rujukan Internal' },
              ]}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Catatan Administratif (Opsional)
              </label>
              <input
                type="text"
                placeholder="Misal: Pasien membawa rujukan BPJS / Keluhan awal"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/antrean')}
          >
            Batal
          </Button>

          <Button
            type="submit"
            size="lg"
            isLoading={registerMutation.isPending}
            disabled={!selectedPatient || !selectedClinicId || !selectedScheduleId || selectedSchedule?.is_full}
            leftIcon={<FileCheck className="w-4 h-4" />}
          >
            Simpan & Cetak Karcis Antrean
          </Button>
        </div>
      </form>

      {/* Success Modal with Printable Slip */}
      <Modal
        isOpen={!!successSlip}
        onClose={() => {
          setSuccessSlip(null);
          navigate('/antrean');
        }}
        maxWidth="md"
      >
        {successSlip && (
          <PrintableSlip
            data={successSlip}
            onClose={() => {
              setSuccessSlip(null);
              navigate('/antrean');
            }}
          />
        )}
      </Modal>
    </div>
  );
};
