import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { LaporanData } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { formatDate } from '../lib/utils';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Building2,
  Stethoscope,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export const Laporan: React.FC = () => {
  // Date range presets (default 30 days)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { data, isLoading, refetch } = useQuery<{ success: boolean; data: LaporanData }>({
    queryKey: ['laporan-summary', startDate, endDate],
    queryFn: () => api.get(`/laporan/summary?start_date=${startDate}&end_date=${endDate}`),
  });

  const report = data?.data;

  // Handle CSV Download directly from API
  const handleExportCsv = async () => {
    try {
      const token = localStorage.getItem('mediqueue_token');
      const response = await fetch(
        `http://localhost:8000/api/laporan/export-csv?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan_kunjungan_${startDate}_sampai_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      alert('Gagal mendownload laporan CSV.');
    }
  };

  const setPresetRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      {/* Page Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Laporan & Rekapitulasi Kunjungan Pasien</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistik dan evaluasi performa operasional seluruh poliklinik dan dokter
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Cetak Laporan
          </Button>

          <Button
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Ekspor CSV (Excel)
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card className="p-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Tanggal Selesai
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Preset:</span>
            <button
              onClick={() => setPresetRange(0)}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              Hari Ini
            </button>
            <button
              onClick={() => setPresetRange(7)}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              7 Hari
            </button>
            <button
              onClick={() => setPresetRange(30)}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              30 Hari
            </button>
          </div>
        </div>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Pendaftaran</p>
          {isLoading ? (
            <Skeleton className="h-7 w-16 mt-1" />
          ) : (
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {report?.summary.total_registrations.toLocaleString('id-ID')}
            </h3>
          )}
          <span className="text-[11px] text-slate-500 mt-1 block">Dalam periode terpilih</span>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Kunjungan Selesai</p>
          {isLoading ? (
            <Skeleton className="h-7 w-16 mt-1" />
          ) : (
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              {report?.summary.completed_visits.toLocaleString('id-ID')}
            </h3>
          )}
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {report?.summary.completion_rate}% tingkat penyelesaian
          </span>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Kunjungan Dibatalkan</p>
          {isLoading ? (
            <Skeleton className="h-7 w-16 mt-1" />
          ) : (
            <h3 className="text-2xl font-black text-rose-600 mt-1">
              {report?.summary.cancelled_visits.toLocaleString('id-ID')}
            </h3>
          )}
          <span className="text-[11px] text-slate-500 mt-1 block">Pembatalan administratif</span>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Kunjungan Aktif / Berjalan</p>
          {isLoading ? (
            <Skeleton className="h-7 w-16 mt-1" />
          ) : (
            <h3 className="text-2xl font-black text-blue-600 mt-1">
              {report?.summary.active_visits.toLocaleString('id-ID')}
            </h3>
          )}
          <span className="text-[11px] text-slate-500 mt-1 block">Dalam antrean atau konsultasi</span>
        </Card>
      </div>

      {/* Daily Volume Bar Chart */}
      <Card
        className="p-5"
        header={
          <div>
            <h3 className="text-sm font-bold text-slate-900">Grafik Volume Kunjungan Harian</h3>
            <p className="text-xs text-slate-500 mt-0.5">Perbandingan total kunjungan selesai dan dibatalkan per tanggal</p>
          </div>
        }
      >
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="h-64 w-full pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report?.daily_trend || []}>
                <XAxis
                  dataKey="visit_date"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(val) => val.substring(5)}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="completed" name="Kunjungan Selesai" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" name="Kunjungan Dibatalkan" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Breakdown per Poliklinik Table */}
      <Card
        className="p-0 overflow-hidden"
        header={
          <h3 className="text-sm font-bold text-slate-900">
            Rekapitulasi Kunjungan Berdasarkan Poliklinik
          </h3>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-5">Poliklinik</th>
                <th className="py-2.5 px-4">Prefiks Antrean</th>
                <th className="py-2.5 px-4 text-center">Total Kunjungan</th>
                <th className="py-2.5 px-4 text-center">Selesai Dilayani</th>
                <th className="py-2.5 px-4 text-center">Dibatalkan</th>
                <th className="py-2.5 px-5 text-right">% Sukses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report?.clinic_breakdown.map((clinic) => {
                const successRate =
                  clinic.total_visits > 0
                    ? Math.round((clinic.completed_visits / clinic.total_visits) * 100)
                    : 0;

                return (
                  <tr key={clinic.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-5 font-bold text-slate-800">{clinic.clinic_name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      [{clinic.queue_prefix}]
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      {clinic.total_visits}
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-700 font-semibold">
                      {clinic.completed_visits}
                    </td>
                    <td className="py-3 px-4 text-center text-rose-600 font-medium">
                      {clinic.cancelled_visits}
                    </td>
                    <td className="py-3 px-5 text-right font-bold text-slate-800">
                      {successRate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Breakdown per Dokter Table */}
      <Card
        className="p-0 overflow-hidden"
        header={
          <h3 className="text-sm font-bold text-slate-900">
            Rekapitulasi Kunjungan Berdasarkan Dokter
          </h3>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-5">Nama Dokter</th>
                <th className="py-2.5 px-4">Spesialisasi</th>
                <th className="py-2.5 px-4">Poliklinik</th>
                <th className="py-2.5 px-4 text-center">Pasien Terlayani</th>
                <th className="py-2.5 px-4 text-center">Dibatalkan</th>
                <th className="py-2.5 px-5 text-right">Total Pasien</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report?.doctor_breakdown.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-5 font-bold text-slate-900">{doc.doctor_name}</td>
                  <td className="py-3 px-4 text-teal-700 font-medium">{doc.specialization}</td>
                  <td className="py-3 px-4 text-slate-600">{doc.clinic_name}</td>
                  <td className="py-3 px-4 text-center text-emerald-700 font-semibold">
                    {doc.completed_patients}
                  </td>
                  <td className="py-3 px-4 text-center text-rose-600">
                    {doc.cancelled_patients}
                  </td>
                  <td className="py-3 px-5 text-right font-black text-slate-900">
                    {doc.total_patients}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
