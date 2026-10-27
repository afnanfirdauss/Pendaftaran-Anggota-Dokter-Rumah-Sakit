import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ShieldCheck, UserCheck, Stethoscope, Eye, EyeOff, Sparkles, Building2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, quickDemoLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<Role | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Email atau password yang Anda masukkan salah.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: Role) => {
    setDemoLoading(role);
    setErrorMessage(null);

    try {
      await quickDemoLogin(role);
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal masuk akun demo.');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Branding Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 mx-auto flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mb-3 font-extrabold text-2xl tracking-tighter">
            MQ
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Medi<span className="text-blue-600">Queue</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sistem Pendaftaran Pasien & Manajemen Antrean Rumah Sakit Modern
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Masuk ke Sistem</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gunakan akun terdaftar atau pilih akun demo di bawah
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="nama@mediqueue.test"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isLoading}
              size="md"
            >
              Masuk
            </Button>
          </form>

          {/* Quick Demo Access Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2.5 font-bold tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Demo Login
              </span>
            </div>
          </div>

          {/* 1-Click Role Buttons */}
          <div className="grid grid-cols-1 gap-2.5">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              disabled={!!demoLoading}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Administrator</div>
                  <div className="text-[11px] text-slate-500">Kelola master data, pengguna, dan laporan</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                {demoLoading === 'admin' ? 'Masuk...' : 'Pilih'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('petugas')}
              disabled={!!demoLoading}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Petugas Pendaftaran</div>
                  <div className="text-[11px] text-slate-500">Daftar pasien, booking kunjungan, cetak karcis</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                {demoLoading === 'petugas' ? 'Masuk...' : 'Pilih'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('dokter')}
              disabled={!!demoLoading}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Dokter Poliklinik</div>
                  <div className="text-[11px] text-slate-500">Lihat antrean, panggil pasien, selesai periksa</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-700">
                {demoLoading === 'dokter' ? 'Masuk...' : 'Pilih'}
              </span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Portfolio Project — Data pasien & dokter bersifat simulasi fiktif.
        </div>
      </div>
    </div>
  );
};
