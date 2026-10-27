import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Poliklinik } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { TableSkeleton } from '../components/common/Skeleton';
import { Building2, Plus, Edit, Power, Users } from 'lucide-react';

export const PoliklinikList: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Poliklinik | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    queue_prefix: '',
    floor: '',
    description: '',
    is_active: true,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ success: boolean; data: Poliklinik[] }>({
    queryKey: ['polikliniks-master'],
    queryFn: () => api.get('/polikliniks'),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: typeof formData) => {
      if (editingClinic) {
        return api.put(`/polikliniks/${editingClinic.id}`, payload);
      }
      return api.post('/polikliniks', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polikliniks-master'] });
      queryClient.invalidateQueries({ queryKey: ['polikliniks-active'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Gagal menyimpan data poliklinik.');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/polikliniks/${id}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polikliniks-master'] });
      queryClient.invalidateQueries({ queryKey: ['polikliniks-active'] });
    },
  });

  const openCreateModal = () => {
    setEditingClinic(null);
    setFormData({
      code: '',
      name: '',
      queue_prefix: '',
      floor: 'Lantai 1',
      description: '',
      is_active: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (clinic: Poliklinik) => {
    setEditingClinic(clinic);
    setFormData({
      code: clinic.code,
      name: clinic.name,
      queue_prefix: clinic.queue_prefix,
      floor: clinic.floor || '',
      description: clinic.description || '',
      is_active: clinic.is_active,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const clinics = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Kelola Data Poliklinik</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar departemen poliklinik, kode awalan antrean, dan lokasi lantai
          </p>
        </div>

        <Button size="sm" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Tambah Poliklinik
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Kode & Prefiks</th>
                  <th className="py-3 px-4">Nama Poliklinik</th>
                  <th className="py-3 px-4">Lokasi Gedung / Lantai</th>
                  <th className="py-3 px-4">Dokter & Jadwal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clinics.map((clinic) => (
                  <tr key={clinic.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {clinic.queue_prefix}
                        </span>
                        <span className="font-mono font-bold text-slate-700">{clinic.code}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{clinic.name}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {clinic.description || '-'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-medium">{clinic.floor || '-'}</td>

                    <td className="py-3 px-4 text-slate-600">
                      <span className="inline-flex items-center gap-1 font-semibold text-blue-700">
                        <Users className="w-3.5 h-3.5" />
                        {clinic.dokters_count ?? 0} Dokter
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <Badge status={clinic.is_active ? 'active' : 'inactive'} />
                    </td>

                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(clinic)}
                          className="text-xs py-1 px-2.5"
                          leftIcon={<Edit className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleActiveMutation.mutate(clinic.id)}
                          className={`text-xs py-1 px-2.5 ${
                            clinic.is_active
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          leftIcon={<Power className="w-3.5 h-3.5" />}
                        >
                          {clinic.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Add/Edit Clinic */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClinic ? 'Edit Data Poliklinik' : 'Tambah Poliklinik Baru'}
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Kode Poli"
              placeholder="Contoh: UMU"
              maxLength={10}
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
            />

            <Input
              label="Prefiks Antrean"
              placeholder="Contoh: A"
              maxLength={5}
              value={formData.queue_prefix}
              onChange={(e) => setFormData({ ...formData, queue_prefix: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <Input
            label="Nama Poliklinik"
            placeholder="Contoh: Poliklinik Umum"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Lokasi Lantai / Gedung"
            placeholder="Contoh: Lantai 1 Gedung A"
            value={formData.floor}
            onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Deskripsi Singkat
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={saveMutation.isPending}>
              Simpan Poliklinik
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
