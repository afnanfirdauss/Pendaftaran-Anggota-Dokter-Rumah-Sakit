import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Pasien } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Skeleton, TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate, calculateAge } from '../lib/utils';
import {
  Search,
  UserPlus,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Calendar,
  Phone,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

export const Pasiens: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [page, setPage] = useState(1);

  // New Patient Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nik: '',
    gender: 'L' as 'L' | 'P',
    birth_date: '',
    phone: '',
    address: '',
    confirm_duplicate: false,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [potentialDuplicate, setPotentialDuplicate] = useState<any>(null);

  // Fetch next MRN for preview
  const { data: mrnData } = useQuery<{ success: boolean; data: { next_mrn: string } }>({
    queryKey: ['next-mrn'],
    queryFn: () => api.get('/pasiens/next-mrn'),
    enabled: isModalOpen,
  });

  // Fetch paginated patient list
  const { data, isLoading, isFetching } = useQuery<{
    success: boolean;
    data: {
      data: Pasien[];
      current_page: number;
      last_page: number;
      total: number;
    };
  }>({
    queryKey: ['pasiens', page, search, genderFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (search) params.append('search', search);
      if (genderFilter) params.append('gender', genderFilter);
      return api.get(`/pasiens?${params.toString()}`);
    },
  });

  // Create patient mutation
  const createMutation = useMutation({
    mutationFn: (newPatient: typeof formData) => api.post('/pasiens', newPatient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pasiens'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      if (err.data?.is_potential_duplicate) {
        setPotentialDuplicate(err.data.existing_patient);
        setFormError(err.message);
      } else {
        setFormError(err.message || 'Gagal menyimpan data pasien.');
      }
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      nik: '',
      gender: 'L',
      birth_date: '',
      phone: '',
      address: '',
      confirm_duplicate: false,
    });
    setFormError(null);
    setPotentialDuplicate(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.birth_date) {
      setFormError('Nama lengkap dan tanggal lahir wajib diisi.');
      return;
    }
    setFormError(null);
    createMutation.mutate(formData);
  };

  const handleConfirmDuplicateSubmit = () => {
    setFormData((prev) => ({ ...prev, confirm_duplicate: true }));
    createMutation.mutate({ ...formData, confirm_duplicate: true });
  };

  const patients = data?.data.data || [];
  const total = data?.data.total || 0;
  const lastPage = data?.data.last_page || 1;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Nama, No. RM, NIK, No. HP..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <select
            value={genderFilter}
            onChange={(e) => {
              setGenderFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs sm:text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="">Semua Gender</option>
            <option value="L">Laki-laki (L)</option>
            <option value="P">Perempuan (P)</option>
          </select>
        </div>

        {/* Register New Patient Button */}
        <Button
          size="md"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          leftIcon={<UserPlus className="w-4 h-4" />}
          className="shrink-0 w-full sm:w-auto"
        >
          Pasien Baru
        </Button>
      </div>

      {/* Patient Table Card */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Total terdaftar: <strong className="text-slate-800">{total} pasien</strong>
          </span>
          {isFetching && <span className="text-blue-600 animate-pulse font-medium">Memuat data...</span>}
        </div>

        {isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={8} cols={5} />
          </div>
        ) : patients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-5">No. Rekam Medis</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Gender & Usia</th>
                  <th className="py-3 px-4">Kontak & NIK</th>
                  <th className="py-3 px-4">Alamat</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-bold font-mono text-blue-700 text-xs">
                      {patient.medical_record_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 text-sm">{patient.name}</div>
                      <div className="text-[11px] text-slate-400">
                        Lahir: {formatDate(patient.birth_date)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-700">
                        {patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                      <div className="text-[11px] text-slate-500">
                        {calculateAge(patient.birth_date)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 font-medium">{patient.phone || '-'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        NIK: {patient.nik || '-'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                      {patient.address || '-'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link to={`/pasiens/${patient.id}`}>
                        <Button size="sm" variant="outline" className="text-xs" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                          Detail
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Tidak Ada Data Pasien"
            description="Tidak ditemukan data pasien yang sesuai dengan kata kunci pencarian Anda."
            actionLabel="Daftarkan Pasien Baru"
            onAction={() => {
              resetForm();
              setIsModalOpen(true);
            }}
          />
        )}

        {/* Pagination Footer */}
        {lastPage > 1 && (
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Halaman {page} dari {lastPage}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Sebelumnya
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* New Patient Registration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Daftarkan Pasien Baru"
        description="Nomor Rekam Medis (NRM) akan dibuat otomatis dan unik oleh sistem."
        maxWidth="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Automatic MRN Preview Badge */}
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800">
              Estimasi No. Rekam Medis Otomatis:
            </span>
            <span className="text-sm font-extrabold font-mono text-blue-700 bg-white px-2.5 py-0.5 rounded shadow-2xs">
              {mrnData?.data.next_mrn || 'Membuat NRM...'}
            </span>
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{formError}</p>
                  {potentialDuplicate && (
                    <div className="mt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={handleConfirmDuplicateSubmit}
                        isLoading={createMutation.isPending}
                      >
                        Tetap Simpan sebagai Pasien Berbeda
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <Input
            label="Nama Lengkap Pasien"
            placeholder="Contoh: Siti Rahmawati"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nomor KTP / NIK (Opsional)"
              placeholder="16 Digit NIK"
              maxLength={16}
              value={formData.nik}
              onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
            />

            <Select
              label="Jenis Kelamin"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
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
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              required
            />

            <Input
              label="Nomor Telepon / WhatsApp"
              placeholder="Contoh: 081234567890"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Alamat Lengkap
            </label>
            <textarea
              rows={2}
              placeholder="Jl. Mawar No. 12, Kelurahan, Kecamatan, Kota"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
            >
              Simpan Data Pasien
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
