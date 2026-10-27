import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Pendaftaran, Poliklinik, Dokter, PrintableSlipData, QueueStatus } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { PrintableSlip } from '../components/registration/PrintableSlip';
import { soundNotifier } from '../lib/chime';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime } from '../lib/utils';
import {
  Search,
  Volume2,
  Play,
  CheckCircle2,
  XCircle,
  Printer,
  Calendar,
  Filter,
  Tv,
  Clock,
  UserPlus,
  RefreshCw,
} from 'lucide-react';

export const Antrean: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [clinicId, setClinicId] = useState<string>('');
  const [doctorId, setDoctorId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState<string>(() => searchParams.get('search') || '');

  // Print Slip Modal State
  const [printSlipData, setPrintSlipData] = useState<PrintableSlipData | null>(null);

  // Cancellation Modal State
  const [cancellingReg, setCancellingReg] = useState<Pendaftaran | null>(null);
  const [cancellationReason, setCancellationReason] = useState('Pasien tidak hadir setelah dipanggil berkali-kali');

  // Fetch Clinics for Filter
  const { data: clinicsData } = useQuery<{ success: boolean; data: Poliklinik[] }>({
    queryKey: ['polikliniks-filter'],
    queryFn: () => api.get('/polikliniks'),
  });

  // Fetch Doctors for Filter
  const { data: doctorsData } = useQuery<{ success: boolean; data: Dokter[] }>({
    queryKey: ['dokters-filter', clinicId],
    queryFn: () => {
      const p = clinicId ? `?poliklinik_id=${clinicId}` : '';
      return api.get(`/dokters${p}`);
    },
  });

  // Fetch Queues List
  const { data, isLoading, isFetching, refetch } = useQuery<{
    success: boolean;
    date: string;
    counts: Record<string, number>;
    data: Pendaftaran[];
  }>({
    queryKey: ['antrean', date, clinicId, doctorId, activeTab, search],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('date', date);
      if (clinicId) params.append('poliklinik_id', clinicId);
      if (doctorId) params.append('dokter_id', doctorId);
      if (activeTab && activeTab !== 'all') params.append('status', activeTab);
      if (search) params.append('search', search);
      return api.get(`/antrean?${params.toString()}`);
    },
    refetchInterval: 10000, // auto-refresh every 10s
  });

  // Call Queue Mutation (with Chime & Indonesian Speech)
  const callMutation = useMutation({
    mutationFn: (id: number) => api.post<{ success: boolean; data: Pendaftaran }>(`/antrean/${id}/call`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['antrean'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Play audio chime and voice broadcast!
      if (res.data) {
        soundNotifier.announceQueue(res.data.queue_number, res.data.poliklinik.name);
      }
    },
  });

  // Update Status Mutation (Waiting -> Called -> In Progress -> Completed -> Cancelled)
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: number; status: QueueStatus; reason?: string }) =>
      api.patch(`/antrean/${id}/status`, {
        status,
        cancellation_reason: reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['antrean'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setCancellingReg(null);
    },
  });

  // Fetch slip for printing
  const fetchSlip = async (id: number) => {
    try {
      const res = await api.get<{ success: boolean; data: PrintableSlipData }>(`/pendaftarans/${id}/slip`);
      if (res.success && res.data) {
        setPrintSlipData(res.data);
      }
    } catch {
      alert('Gagal mengambil data karcis.');
    }
  };

  const queues = data?.data || [];
  const counts = data?.counts || { all: 0, waiting: 0, called: 0, in_progress: 0, completed: 0, cancelled: 0 };

  const tabs = [
    { id: 'all', label: 'Semua Status', count: counts.all },
    { id: 'waiting', label: 'Menunggu', count: counts.waiting, color: 'text-amber-700 bg-amber-50' },
    { id: 'called', label: 'Dipanggil', count: counts.called, color: 'text-blue-700 bg-blue-50' },
    { id: 'in_progress', label: 'Sedang Dilayani', count: counts.in_progress, color: 'text-purple-700 bg-purple-50' },
    { id: 'completed', label: 'Selesai', count: counts.completed, color: 'text-emerald-700 bg-emerald-50' },
    { id: 'cancelled', label: 'Dibatalkan', count: counts.cancelled, color: 'text-rose-700 bg-rose-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick TV link */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Meja Pengendali Antrean Pasien</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Panggil pasien dengan notifikasi suara bel & suara Indonesia secara langsung
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <Link to="/display" target="_blank">
            <Button size="sm" variant="outline" leftIcon={<Tv className="w-4 h-4 text-blue-600" />}>
              Buka Layar TV
            </Button>
          </Link>

          <Link to="/pendaftaran-baru">
            <Button size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
              Daftar Kunjungan
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Tanggal Kunjungan
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Poliklinik
            </label>
            <select
              value={clinicId}
              onChange={(e) => {
                setClinicId(e.target.value);
                setDoctorId('');
              }}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">Semua Poliklinik</option>
              {clinicsData?.data.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.queue_prefix}] {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Dokter Bertugas
            </label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">Semua Dokter</option>
              {doctorsData?.data.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Cari Antrean / Pasien
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="No. Antrean atau Nama Pasien..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 rounded-xl font-medium transition-all shrink-0 flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Queue List Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : queues.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">No. Antrean</th>
                  <th className="py-3 px-4">Nama Pasien & NRM</th>
                  <th className="py-3 px-4">Poliklinik & Dokter</th>
                  <th className="py-3 px-4">Jadwal & Waktu</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Aksi Pelayanan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queues.map((reg) => {
                  const isCalled = reg.status === 'called';
                  const isInProgress = reg.status === 'in_progress';
                  const isWaiting = reg.status === 'waiting';
                  const isCompleted = reg.status === 'completed';
                  const isCancelled = reg.status === 'cancelled';

                  return (
                    <tr
                      key={reg.id}
                      className={`transition-colors ${
                        isCalled
                          ? 'bg-blue-50/60 font-medium'
                          : isInProgress
                          ? 'bg-purple-50/40'
                          : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-black font-mono text-base text-blue-700">
                          {reg.queue_number}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {reg.registration_number}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{reg.patient.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-blue-800">{reg.patient.medical_record_number}</span>
                          <span>•</span>
                          <span>{reg.patient.gender === 'L' ? 'L' : 'P'}</span>
                          <span>•</span>
                          <span>{reg.visit_type}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{reg.poliklinik.name}</div>
                        <div className="text-[11px] text-teal-700 font-medium">{reg.dokter.name}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {reg.jadwal_praktik
                              ? `${reg.jadwal_praktik.start_time.substring(0, 5)} - ${reg.jadwal_praktik.end_time.substring(0, 5)}`
                              : '-'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Daftar: {formatDateTime(reg.created_at)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge status={reg.status} />
                        {reg.cancellation_reason && (
                          <div className="text-[10px] text-rose-600 italic max-w-xs mt-1">
                            {reg.cancellation_reason}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. Call Button */}
                          {!isCompleted && !isCancelled && (
                            <Button
                              size="sm"
                              variant={isCalled ? 'primary' : 'outline'}
                              onClick={() => callMutation.mutate(reg.id)}
                              isLoading={callMutation.isPending && callMutation.variables === reg.id}
                              title="Panggil Pasien (Bunyikan Bel Suara)"
                              className="text-xs py-1 px-2.5"
                              leftIcon={<Volume2 className="w-3.5 h-3.5" />}
                            >
                              {isCalled ? 'Panggil Ulang' : 'Panggil'}
                            </Button>
                          )}

                          {/* 2. Start Consultation */}
                          {(isWaiting || isCalled) && (
                            <Button
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-white text-xs py-1 px-2.5"
                              onClick={() => updateStatusMutation.mutate({ id: reg.id, status: 'in_progress' })}
                              isLoading={updateStatusMutation.isPending}
                              leftIcon={<Play className="w-3.5 h-3.5" />}
                            >
                              Layani
                            </Button>
                          )}

                          {/* 3. Complete Consultation */}
                          {isInProgress && (
                            <Button
                              size="sm"
                              variant="success"
                              className="text-xs py-1 px-2.5"
                              onClick={() => updateStatusMutation.mutate({ id: reg.id, status: 'completed' })}
                              isLoading={updateStatusMutation.isPending}
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            >
                              Selesai
                            </Button>
                          )}

                          {/* 4. Print Ticket Slip */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => fetchSlip(reg.id)}
                            title="Cetak Ulang Karcis"
                            className="p-1.5 text-slate-500 hover:text-slate-800"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Button>

                          {/* 5. Cancel Button */}
                          {!isCompleted && !isCancelled && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setCancellingReg(reg)}
                              title="Batalkan Pendaftaran"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            Tidak ada antrean yang sesuai dengan kriteria filter saat ini.
          </div>
        )}
      </Card>

      {/* Cancellation Reason Modal */}
      <Modal
        isOpen={!!cancellingReg}
        onClose={() => setCancellingReg(null)}
        title="Konfirmasi Pembatalan Antrean"
        description="Batalkan pendaftaran pasien ini jika pasien berhalangan hadir atau keluhan dialihkan."
        maxWidth="md"
      >
        {cancellingReg && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div>
                No. Antrean: <strong className="text-blue-700 font-mono">{cancellingReg.queue_number}</strong>
              </div>
              <div>
                Nama Pasien: <strong className="text-slate-800">{cancellingReg.patient.name}</strong>
              </div>
              <div>
                Poli & Dokter: {cancellingReg.poliklinik.name} — {cancellingReg.dokter.name}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                Alasan Pembatalan Administratif <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setCancellingReg(null)}>
                Kembali
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={updateStatusMutation.isPending}
                onClick={() =>
                  updateStatusMutation.mutate({
                    id: cancellingReg.id,
                    status: 'cancelled',
                    reason: cancellationReason,
                  })
                }
              >
                Ya, Batalkan Pendaftaran
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Print Slip Modal */}
      <Modal
        isOpen={!!printSlipData}
        onClose={() => setPrintSlipData(null)}
        maxWidth="md"
      >
        {printSlipData && (
          <PrintableSlip
            data={printSlipData}
            onClose={() => setPrintSlipData(null)}
          />
        )}
      </Modal>
    </div>
  );
};
