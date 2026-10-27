import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Dokter, Poliklinik } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { TableSkeleton } from '../components/common/Skeleton';
import { Stethoscope, Plus, Edit, Power, Phone, Mail } from 'lucide-react';

export const DokterList: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Dokter | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    sip: '',
    specialization: '',
    poliklinik_id: '',
    phone: '',
    email: '',
    is_active: true,
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Clinics for selection
  const { data: clinicsData } = useQuery<{ success: boolean; data: Poliklinik[] }>({
    queryKey: ['polikliniks-selection'],
    queryFn: () => api.get('/polikliniks?active_only=true'),
  });

  // Fetch Doctors list
  const { data, isLoading } = useQuery<{ success: boolean; data: Dokter[] }>({
    queryKey: ['dokters-master'],
    queryFn: () => api.get('/dokters'),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: any) => {
      if (editingDoctor) {
        return api.put(`/dokters/${editingDoctor.id}`, payload);
      }
      return api.post('/dokters', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dokters-master'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Gagal menyimpan data dokter.');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/dokters/${id}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dokters-master'] });
    },
  });

  const openCreateModal = () => {
    setEditingDoctor(null);
    setFormData({
      name: '',
      sip: '',
      specialization: '',
      poliklinik_id: '',
      phone: '',
      email: '',
      is_active: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (doc: Dokter) => {
    setEditingDoctor(doc);
    setFormData({
      name: doc.name,
      sip: doc.sip,
      specialization: doc.specialization,
      poliklinik_id: doc.poliklinik_id.toString(),
      phone: doc.phone || '',
      email: doc.email || '',
      is_active: doc.is_active,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const doctors = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Kelola Data Tenaga Medis (Dokter)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar dokter spesialis, Surat Izin Praktik (SIP), dan penempatan poliklinik
          </p>
        </div>

        <Button size="sm" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Tambah Dokter
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={6} cols={5} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Nama Dokter</th>
                  <th className="py-3 px-4">Surat Izin Praktik (SIP)</th>
                  <th className="py-3 px-4">Poliklinik Penempatan</th>
                  <th className="py-3 px-4">Kontak Telepon & Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900 text-sm">{doc.name}</div>
                      <div className="text-[11px] text-teal-700 font-medium">
                        {doc.specialization}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {doc.sip}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">
                        {doc.poliklinik?.name || '-'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{doc.phone || '-'}</div>
                      <div className="text-[11px] text-slate-400">{doc.email || '-'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge status={doc.is_active ? 'active' : 'inactive'} />
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(doc)}
                          className="text-xs py-1 px-2.5"
                          leftIcon={<Edit className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleActiveMutation.mutate(doc.id)}
                          className={`text-xs py-1 px-2.5 ${
                            doc.is_active
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          leftIcon={<Power className="w-3.5 h-3.5" />}
                        >
                          {doc.is_active ? 'Nonaktifkan' : 'Aktifkan'}
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

      {/* Modal Add/Edit Doctor */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDoctor ? 'Edit Data Dokter' : 'Tambah Dokter Baru'}
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate({
              ...formData,
              poliklinik_id: Number(formData.poliklinik_id),
            });
          }}
          className="space-y-4"
        >
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {formError}
            </div>
          )}

          <Input
            label="Nama Lengkap & Gelar Dokter"
            placeholder="Contoh: dr. Ahmad Fauzi, Sp.PD"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nomor SIP / NIP"
              placeholder="SIP-501/DKK/..."
              value={formData.sip}
              onChange={(e) => setFormData({ ...formData, sip: e.target.value })}
              required
            />

            <Input
              label="Spesialisasi Medis"
              placeholder="Contoh: Spesialis Anak"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Poliklinik Penempatan <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.poliklinik_id}
              onChange={(e) => setFormData({ ...formData, poliklinik_id: e.target.value })}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600"
              required
            >
              <option value="">-- Pilih Poliklinik --</option>
              {clinicsData?.data.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.queue_prefix}] {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nomor Telepon Kerja"
              placeholder="08123456789"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <Input
              label="Email Dokter"
              type="email"
              placeholder="dokter@mediqueue.test"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={saveMutation.isPending}>
              Simpan Data Dokter
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
