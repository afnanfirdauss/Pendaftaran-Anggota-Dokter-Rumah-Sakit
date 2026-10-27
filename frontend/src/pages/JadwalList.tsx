import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { JadwalPraktik, Dokter, Poliklinik } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { TableSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, Plus, Clock, Users, Trash2, Edit } from 'lucide-react';

export const JadwalList: React.FC = () => {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<JadwalPraktik | null>(null);

  const [formData, setFormData] = useState({
    dokter_id: '',
    poliklinik_id: '',
    day_of_week: '1',
    start_time: '08:00',
    end_time: '12:00',
    quota: '25',
    is_active: true,
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Doctors with Clinics
  const { data: doctorsData } = useQuery<{ success: boolean; data: Dokter[] }>({
    queryKey: ['dokters-schedules-selection'],
    queryFn: () => api.get('/dokters?active_only=true'),
  });

  // Fetch Schedules list
  const { data, isLoading } = useQuery<{ success: boolean; data: JadwalPraktik[] }>({
    queryKey: ['jadwals-master'],
    queryFn: () => api.get('/jadwal-praktiks'),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: any) => {
      if (editingSchedule) {
        return api.put(`/jadwal-praktiks/${editingSchedule.id}`, payload);
      }
      return api.post('/jadwal-praktiks', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jadwals-master'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Gagal menyimpan jadwal praktik.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/jadwal-praktiks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jadwals-master'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Gagal menghapus jadwal.');
    },
  });

  const openCreateModal = () => {
    setEditingSchedule(null);
    setFormData({
      dokter_id: '',
      poliklinik_id: '',
      day_of_week: '1',
      start_time: '08:00',
      end_time: '12:00',
      quota: '25',
      is_active: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDoctorChange = (docIdStr: string) => {
    const doc = doctorsData?.data.find((d) => d.id === Number(docIdStr));
    setFormData({
      ...formData,
      dokter_id: docIdStr,
      poliklinik_id: doc ? doc.poliklinik_id.toString() : '',
    });
  };

  const schedules = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Jadwal Praktik Dokter & Kuota Kunjungan</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengaturan hari praktik, jam operasional poliklinik, dan batas kapasitas kuota
          </p>
        </div>

        {hasRole('admin') && (
          <Button size="sm" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
            Tambah Jadwal
          </Button>
        )}
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Hari Praktik</th>
                  <th className="py-3 px-4">Dokter Bertugas</th>
                  <th className="py-3 px-4">Poliklinik</th>
                  <th className="py-3 px-4">Jam Operasional</th>
                  <th className="py-3 px-4">Kuota Pasien</th>
                  <th className="py-3 px-4">Status</th>
                  {hasRole('admin') && <th className="py-3 px-5 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules.map((sch) => (
                  <tr key={sch.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-blue-800">
                      <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100">
                        {sch.day_name}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{sch.dokter?.name}</div>
                      <div className="text-[11px] text-teal-700 font-medium">
                        {sch.dokter?.specialization}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {sch.poliklinik?.name}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-mono font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {sch.start_time.substring(0, 5)} - {sch.end_time.substring(0, 5)} WIB
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {sch.quota} Pasien / Hari
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge status={sch.is_active ? 'active' : 'inactive'} />
                    </td>

                    {hasRole('admin') && (
                      <td className="py-3.5 px-5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Hapus jadwal dokter ${sch.dokter?.name} pada hari ${sch.day_name}?`)) {
                              deleteMutation.mutate(sch.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Add Schedule */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Jadwal Praktik Dokter"
        description="Sistem akan otomatis memvalidasi agar jam operasional valid dan tidak bertabrakan."
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (formData.end_time <= formData.start_time) {
              setFormError('Jam selesai praktik harus lebih besar daripada jam mulai.');
              return;
            }
            saveMutation.mutate({
              dokter_id: Number(formData.dokter_id),
              poliklinik_id: Number(formData.poliklinik_id),
              day_of_week: Number(formData.day_of_week),
              start_time: formData.start_time,
              end_time: formData.end_time,
              quota: Number(formData.quota),
              is_active: formData.is_active,
            });
          }}
          className="space-y-4"
        >
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Pilih Dokter <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.dokter_id}
              onChange={(e) => handleDoctorChange(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600"
              required
            >
              <option value="">-- Pilih Dokter --</option>
              {doctorsData?.data.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialization} - {d.poliklinik?.name})
                </option>
              ))}
            </select>
          </div>

          <Select
            label="Hari Praktik"
            value={formData.day_of_week}
            onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
            options={[
              { value: 1, label: 'Senin' },
              { value: 2, label: 'Selasa' },
              { value: 3, label: 'Rabu' },
              { value: 4, label: 'Kamis' },
              { value: 5, label: 'Jumat' },
              { value: 6, label: 'Sabtu' },
              { value: 7, label: 'Minggu' },
            ]}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Jam Mulai (WIB)"
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              required
            />

            <Input
              label="Jam Selesai (WIB)"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              required
            />
          </div>

          <Input
            label="Kapasitas Kuota Kunjungan (Pasien)"
            type="number"
            min={1}
            max={200}
            value={formData.quota}
            onChange={(e) => setFormData({ ...formData, quota: e.target.value })}
            required
          />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={saveMutation.isPending}>
              Simpan Jadwal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
