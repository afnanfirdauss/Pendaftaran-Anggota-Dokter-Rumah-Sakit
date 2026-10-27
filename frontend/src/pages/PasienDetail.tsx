import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Pasien, Pendaftaran } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Skeleton } from '../components/common/Skeleton';
import { formatDate, calculateAge, formatDateTime } from '../lib/utils';
import {
  ArrowLeft,
  Edit,
  UserPlus,
  Calendar,
  Phone,
  MapPin,
  Clock,
  FileText,
  CheckCircle2,
} from 'lucide-react';

export const PasienDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    nik: '',
    gender: 'L' as 'L' | 'P',
    birth_date: '',
    phone: '',
    address: '',
  });
  const [editError, setEditError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ success: boolean; data: Pasien }>({
    queryKey: ['pasien', id],
    queryFn: () => api.get(`/pasiens/${id}`),
  });

  const patient = data?.data;

  const editMutation = useMutation({
    mutationFn: (updatedData: typeof editFormData) =>
      api.put(`/pasiens/${id}`, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pasien', id] });
      queryClient.invalidateQueries({ queryKey: ['pasiens'] });
      setIsEditModalOpen(false);
    },
    onError: (err: any) => {
      setEditError(err.message || 'Gagal memperbarui data pasien.');
    },
  });

  const openEditModal = () => {
    if (!patient) return;
    setEditFormData({
      name: patient.name,
      nik: patient.nik || '',
      gender: patient.gender,
      birth_date: patient.birth_date,
      phone: patient.phone || '',
      address: patient.address || '',
    });
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editMutation.mutate(editFormData);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">Data pasien tidak ditemukan.</p>
        <Link to="/pasiens">
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Kembali ke Daftar Pasien
          </Button>
        </Link>
      </div>
    );
  }

  const visits = patient.pendaftarans || [];

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/pasiens">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Kembali ke Data Pasien
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={openEditModal}
            leftIcon={<Edit className="w-4 h-4" />}
          >
            Edit Data Pasien
          </Button>

          <Link to={`/pendaftaran-baru?patient_id=${patient.id}`}>
            <Button size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
              Daftarkan Kunjungan
            </Button>
          </Link>
        </div>
      </div>

      {/* Patient Profile Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl shrink-0">
              {patient.name.charAt(0)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-extrabold text-slate-900">{patient.name}</h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {patient.medical_record_number}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                  {patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-xs text-slate-600 mt-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {formatDate(patient.birth_date)} ({calculateAge(patient.birth_date)})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{patient.phone || 'Tidak ada nomor telepon'}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-400 text-[10px]">NIK:</span>
                  <span className="font-mono">{patient.nik || '-'}</span>
                </div>

                <div className="flex items-center gap-1.5 sm:col-span-2 md:col-span-3">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{patient.address || 'Alamat belum dilengkapi'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-left md:text-right shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <span className="text-[11px] text-slate-400 block">Pendaftaran Pertama:</span>
            <span className="text-xs font-medium text-slate-700">
              {formatDateTime(patient.first_registered_at)}
            </span>
            <div className="mt-2">
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {visits.length} Riwayat Kunjungan
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Visit History Section */}
      <Card
        className="p-5"
        header={
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Riwayat Kunjungan & Antrean</h3>
              <p className="text-xs text-slate-500 mt-0.5">Daftar seluruh pendaftaran poliklinik pasien ini</p>
            </div>
            <Link to={`/pendaftaran-baru?patient_id=${patient.id}`}>
              <Button size="sm" variant="outline" leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
                Tambah Kunjungan
              </Button>
            </Link>
          </div>
        }
      >
        {visits.length > 0 ? (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 text-slate-500 font-semibold border-y border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-5">No. Antrean</th>
                  <th className="py-2.5 px-4">Tanggal Kunjungan</th>
                  <th className="py-2.5 px-4">Poliklinik</th>
                  <th className="py-2.5 px-4">Dokter</th>
                  <th className="py-2.5 px-4">Jenis</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-5">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visits.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-5 font-bold font-mono text-blue-700 text-sm">
                      {reg.queue_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {formatDate(reg.visit_date)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {reg.poliklinik.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{reg.dokter.name}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize font-medium text-slate-700">
                        {reg.visit_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={reg.status} />
                    </td>
                    <td className="py-3 px-5 text-slate-500 max-w-xs truncate">
                      {reg.cancellation_reason ? (
                        <span className="text-rose-600 italic">Batal: {reg.cancellation_reason}</span>
                      ) : (
                        reg.notes || '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            Belum ada catatan riwayat kunjungan untuk pasien ini.
          </div>
        )}
      </Card>

      {/* Edit Patient Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Data Pasien"
        description="Nomor Rekam Medis (NRM) bersifat permanen dan tidak dapat diubah."
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {editError}
            </div>
          )}

          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
            No. Rekam Medis: <strong className="text-blue-700 font-mono">{patient.medical_record_number}</strong> (Tetap)
          </div>

          <Input
            label="Nama Lengkap Pasien"
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nomor KTP / NIK (Opsional)"
              value={editFormData.nik}
              onChange={(e) => setEditFormData({ ...editFormData, nik: e.target.value })}
            />

            <Select
              label="Jenis Kelamin"
              value={editFormData.gender}
              onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as 'L' | 'P' })}
              options={[
                { value: 'L', label: 'Laki-laki (L)' },
                { value: 'P', label: 'Perempuan (P)' },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Tanggal Lahir"
              type="date"
              value={editFormData.birth_date}
              onChange={(e) => setEditFormData({ ...editFormData, birth_date: e.target.value })}
              required
            />

            <Input
              label="Nomor Telepon"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Alamat Lengkap
            </label>
            <textarea
              rows={2}
              value={editFormData.address}
              onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={editMutation.isPending}
            >
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
