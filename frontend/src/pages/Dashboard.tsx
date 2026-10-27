import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { DashboardData, Pendaftaran } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Users,
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  ArrowRight,
  Tv,
  TrendingUp,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();

  const { data, isLoading, error } = useQuery<{ success: boolean; data: DashboardData }>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard'),
    refetchInterval: 15000, // auto-refresh every 15s for live queue tracking
  });

  const dashboard = data?.data;

  // Colors for Clinic Distribution Pie Chart
  const CLINIC_COLORS = ['#2563EB', '#0D9488', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <Activity className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-xs mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Sistem Aktif & Terhubung ke Database
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Selamat Datang, {user?.name}
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 leading-relaxed">
            {user?.role === 'dokter'
              ? `Anda login sebagai dokter spesialis di ${user?.dokter?.poliklinik_name || 'Poliklinik'}. Pantau antrean pasien dan lakukan pemanggilan secara langsung.`
              : 'Pantau operasional registrasi pasien, antrean aktif hari ini, dan statistik kunjungan poliklinik secara realtime.'}
          </p>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2.5 mt-5">
            {hasRole(['admin', 'petugas']) && (
              <>
                <Link to="/pendaftaran-baru">
                  <Button
                    size="sm"
                    className="bg-white text-blue-700 hover:bg-blue-50 border-0 shadow-sm"
                    leftIcon={<UserPlus className="w-4 h-4" />}
                  >
                    Pendaftaran Kunjungan
                  </Button>
                </Link>
                <Link to="/pasiens">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-blue-800/40 text-white border-white/20 hover:bg-blue-800/60"
                    leftIcon={<Users className="w-4 h-4" />}
                  >
                    Data Pasien
                  </Button>
                </Link>
              </>
            )}
            <Link to="/antrean">
              <Button
                size="sm"
                variant="outline"
                className="bg-blue-800/40 text-white border-white/20 hover:bg-blue-800/60"
                leftIcon={<Clock className="w-4 h-4" />}
              >
                Antrean Aktif
              </Button>
            </Link>
            <Link to="/display" target="_blank">
              <Button
                size="sm"
                variant="outline"
                className="bg-blue-800/40 text-white border-white/20 hover:bg-blue-800/60"
                leftIcon={<Tv className="w-4 h-4" />}
              >
                Layar Display TV
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pasien */}
        <Card className="p-5 hoverable">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Pasien Terdaftar
              </p>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mt-1" />
              ) : (
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {dashboard?.metrics.total_patients.toLocaleString('id-ID')}
                </h3>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> Database
            </span>
            <span>seluruh rekam medis</span>
          </div>
        </Card>

        {/* Pendaftaran Hari Ini */}
        <Card className="p-5 hoverable">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pendaftaran Hari Ini
              </p>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mt-1" />
              ) : (
                <h3 className="text-2xl font-black text-blue-600 mt-1">
                  {dashboard?.metrics.today_registrations}
                </h3>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
            <span className="font-semibold text-slate-700">{dashboard?.metrics.in_progress_count || 0}</span>
            <span>sedang dalam konsultasi</span>
          </div>
        </Card>

        {/* Pasien Menunggu */}
        <Card className="p-5 hoverable">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Antrean Menunggu
              </p>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mt-1" />
              ) : (
                <h3 className="text-2xl font-black text-amber-600 mt-1">
                  {dashboard?.metrics.waiting_count}
                </h3>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
            <span className="text-amber-600 font-medium">Di ruang tunggu poli</span>
          </div>
        </Card>

        {/* Kunjungan Selesai */}
        <Card className="p-5 hoverable">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Kunjungan Selesai
              </p>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mt-1" />
              ) : (
                <h3 className="text-2xl font-black text-emerald-600 mt-1">
                  {dashboard?.metrics.completed_count}
                </h3>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
            <span className="text-slate-500">
              Batal: {dashboard?.metrics.cancelled_count || 0} kunjungan
            </span>
          </div>
        </Card>
      </div>

      {/* Visual Analytics Charts (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 14-Day Registration Trend Chart */}
        <Card
          className="lg:col-span-2 p-5"
          header={
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Tren Kunjungan Pasien (14 Hari Terakhir)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Dihitung otomatis dari riwayat transaksi database</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                Data Riil
              </span>
            </div>
          }
        >
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboard?.chart_trend || []}>
                  <defs>
                    <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="completedColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
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
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Terdaftar"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#totalColor)"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Selesai Dilayani"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#completedColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Clinic Distribution Donut Chart */}
        <Card
          className="p-5"
          header={
            <div>
              <h3 className="text-sm font-bold text-slate-900">Distribusi Kunjungan per Poli</h3>
              <p className="text-xs text-slate-500 mt-0.5">Proporsi pasien 30 hari terakhir</p>
            </div>
          }
        >
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-72 w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={dashboard?.clinic_distribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {dashboard?.clinic_distribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CLINIC_COLORS[index % CLINIC_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any, item: any) => [
                      `${value} Kunjungan`,
                      item.payload.name,
                    ]}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Custom Legend */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 w-full text-[11px] mt-2">
                {dashboard?.clinic_distribution.slice(0, 4).map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CLINIC_COLORS[i % CLINIC_COLORS.length] }}
                    />
                    <span className="truncate text-slate-600">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Today's Active Queue Table */}
      <Card
        className="p-5"
        header={
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pendaftaran & Antrean Aktif Hari Ini</h3>
              <p className="text-xs text-slate-500 mt-0.5">Daftar pasien yang sedang berada di loket dan poliklinik</p>
            </div>
            <Link to="/antrean">
              <Button size="sm" variant="ghost" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Buka Meja Antrean
              </Button>
            </Link>
          </div>
        }
      >
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : dashboard?.recent_registrations && dashboard.recent_registrations.length > 0 ? (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 text-slate-500 font-semibold border-y border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-5">No. Antrean</th>
                  <th className="py-2.5 px-4">Nama Pasien & NRM</th>
                  <th className="py-2.5 px-4">Poliklinik</th>
                  <th className="py-2.5 px-4">Dokter</th>
                  <th className="py-2.5 px-4">Jenis</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboard.recent_registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-5 font-bold font-mono text-blue-600 text-sm">
                      {reg.queue_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{reg.patient.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {reg.patient.medical_record_number}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {reg.poliklinik.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{reg.dokter.name}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-slate-600 font-medium">
                        {reg.visit_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={reg.status} />
                    </td>
                    <td className="py-3 px-5 text-right">
                      <Link to={`/antrean?search=${reg.queue_number}`}>
                        <Button size="sm" variant="outline" className="text-xs py-1 px-2.5">
                          Kelola
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            Belum ada pendaftaran pasien untuk hari ini.
          </div>
        )}
      </Card>
    </div>
  );
};
