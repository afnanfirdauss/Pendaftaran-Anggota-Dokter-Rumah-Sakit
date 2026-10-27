import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { User, Role, Dokter } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { TableSkeleton } from '../components/common/Skeleton';
import { ShieldCheck, UserPlus, Edit, Power, Key } from 'lucide-react';

export const UsersList: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'petugas' as Role,
    phone: '',
    is_active: true,
    dokter_id: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Doctors for doctor account linking
  const { data: doctorsData } = useQuery<{ success: boolean; data: Dokter[] }>({
    queryKey: ['dokters-for-users'],
    queryFn: () => api.get('/dokters'),
  });

  // Fetch Users
  const { data, isLoading } = useQuery<{ success: boolean; data: User[] }>({
    queryKey: ['users-master'],
    queryFn: () => api.get('/users'),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: any) => {
      if (editingUser) {
        return api.put(`/users/${editingUser.id}`, payload);
      }
      return api.post('/users', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-master'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Gagal menyimpan data pengguna.');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/users/${id}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-master'] });
    },
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'petugas',
      phone: '',
      is_active: true,
      dokter_id: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '', // Leave blank to keep existing password
      role: u.role,
      phone: u.phone || '',
      is_active: u.is_active,
      dokter_id: u.dokter ? u.dokter.id.toString() : '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const users = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Manajemen Akun Pengguna & Hak Akses</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola akun petugas loket, dokter spesialis, dan administrator sistem
          </p>
        </div>

        <Button size="sm" onClick={openCreateModal} leftIcon={<UserPlus className="w-4 h-4" />}>
          Tambah Pengguna
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
                  <th className="py-3 px-5">Nama Pengguna</th>
                  <th className="py-3 px-4">Alamat Email</th>
                  <th className="py-3 px-4">Hak Akses (Role)</th>
                  <th className="py-3 px-4">Relasi Dokter / No. Telp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-5">
                      <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700">{u.email}</td>

                    <td className="py-3 px-4">
                      <Badge status={u.role} />
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {u.dokter ? (
                        <div>
                          <span className="font-semibold text-teal-700">{u.dokter.name}</span>
                          <span className="text-[10px] text-slate-400 block">
                            {u.dokter.specialization} ({u.dokter.poliklinik_name || '-'})
                          </span>
                        </div>
                      ) : (
                        <span>{u.phone || '-'}</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <Badge status={u.is_active ? 'active' : 'inactive'} />
                    </td>

                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(u)}
                          className="text-xs py-1 px-2.5"
                          leftIcon={<Edit className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleActiveMutation.mutate(u.id)}
                          className={`text-xs py-1 px-2.5 ${
                            u.is_active
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          leftIcon={<Power className="w-3.5 h-3.5" />}
                        >
                          {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
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

      {/* Modal Add/Edit User */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna Baru'}
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const payload: any = {
              name: formData.name,
              email: formData.email,
              role: formData.role,
              phone: formData.phone || null,
              is_active: formData.is_active,
            };
            if (formData.password) {
              payload.password = formData.password;
            }
            if (formData.role === 'dokter' && formData.dokter_id) {
              payload.dokter_id = Number(formData.dokter_id);
            }
            saveMutation.mutate(payload);
          }}
          className="space-y-4"
        >
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {formError}
            </div>
          )}

          <Input
            label="Nama Lengkap"
            placeholder="Contoh: Budi Santoso"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Alamat Email (Digunakan untuk Login)"
            type="email"
            placeholder="nama@mediqueue.test"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label={editingUser ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password'}
            type="password"
            placeholder="Minimal 6 karakter"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!editingUser}
          />

          <Select
            label="Peran Pengguna (Role)"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
            options={[
              { value: 'petugas', label: 'Petugas Pendaftaran / Loket' },
              { value: 'dokter', label: 'Dokter Poliklinik' },
              { value: 'admin', label: 'Administrator' },
            ]}
            required
          />

          {formData.role === 'dokter' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Hubungkan ke Profil Dokter
              </label>
              <select
                value={formData.dokter_id}
                onChange={(e) => setFormData({ ...formData, dokter_id: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="">-- Pilih Dokter --</option>
                {doctorsData?.data.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="Nomor Telepon (Opsional)"
            placeholder="08123456789"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={saveMutation.isPending}>
              Simpan Pengguna
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
