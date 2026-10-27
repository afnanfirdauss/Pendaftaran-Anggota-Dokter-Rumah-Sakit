import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { PublicDisplayData } from '../types';
import { soundNotifier } from '../lib/chime';
import {
  Volume2,
  VolumeX,
  Maximize,
  Clock,
  Tv,
  Building2,
  Stethoscope,
  Activity,
  ArrowRight,
} from 'lucide-react';

export const PublicDisplay: React.FC = () => {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const lastAnnouncedIdRef = useRef<number | null>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll public display feed every 3 seconds
  const { data } = useQuery<{ success: boolean; data: PublicDisplayData }>({
    queryKey: ['public-display'],
    queryFn: () => api.get('/antrean/public-display'),
    refetchInterval: 3000,
  });

  const displayData = data?.data;
  const recent = displayData?.recently_called;

  // Auto-announce when a new patient is called
  useEffect(() => {
    if (recent && audioEnabled) {
      if (lastAnnouncedIdRef.current !== recent.id) {
        lastAnnouncedIdRef.current = recent.id;
        soundNotifier.announceQueue(recent.queue_number, recent.poliklinik_name);
      }
    }
  }, [recent, audioEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleTestAudio = () => {
    setAudioEnabled(true);
    soundNotifier.announceQueue('A 0 0 1', 'Poliklinik Umum');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none overflow-hidden">
      {/* TV Header Bar */}
      <header className="h-20 bg-slate-900 border-b border-slate-800 px-6 sm:px-10 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
            MQ
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              RS MEDIQUEUE UTAMA
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Layar Antrean Poli
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Sistem Informasi Panggilan Antrean Pasien Rawat Jalan Terpadu
            </p>
          </div>
        </div>

        {/* Clock & Controls */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-400 tracking-wider">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
            <button
              onClick={() => {
                setAudioEnabled(!audioEnabled);
                if (!audioEnabled) {
                  soundNotifier.playChime();
                }
              }}
              className={`p-2.5 rounded-xl border transition-all ${
                audioEnabled
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={audioEnabled ? 'Suara Panggilan Aktif' : 'Aktifkan Suara Panggilan'}
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"
              title="Fullscreen"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Audio permission banner if muted */}
      {!audioEnabled && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-6 py-2 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
          <span>🔊 Suara panggilan belum diaktifkan oleh peramban browser.</span>
          <button
            onClick={handleTestAudio}
            className="underline font-bold hover:text-white"
          >
            Klik di sini untuk aktifkan audio & suara bel
          </button>
        </div>
      )}

      {/* Main Content: Big Highlight Card + Grid of Clinic Boards */}
      <main className="flex-1 p-6 sm:p-8 flex flex-col gap-6 max-w-7xl w-full mx-auto justify-between">
        {/* BIG NOW CALLING HIGHLIGHT */}
        <div className="bg-gradient-to-r from-blue-900/80 via-blue-800/60 to-indigo-950/80 border-2 border-blue-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden animate-in fade-in duration-500">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
            <Activity className="w-80 h-80 text-blue-400" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
                Panggilan Antrean Terakhir
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                {recent ? recent.poliklinik_name : 'Menunggu Panggilan Antrean...'}
              </h2>
              <p className="text-sm text-blue-200 mt-1">
                {recent
                  ? `${recent.poliklinik_floor} • Pasien: ${recent.patient_name} • Dokter: ${recent.dokter_name}`
                  : 'Silakan perhatikan nomor antrean pada karcis Anda.'}
              </p>
            </div>

            <div className="bg-slate-900/90 border border-blue-400/40 rounded-2xl px-10 py-5 text-center shadow-inner">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
                Nomor Antrean
              </span>
              <div className="text-5xl sm:text-7xl font-black font-mono tracking-tight text-yellow-400">
                {recent ? recent.queue_number : '---'}
              </div>
              <span className="text-[11px] text-blue-300 font-medium block mt-1">
                {recent ? `Dipanggil pukul ${recent.called_at}` : 'Standby'}
              </span>
            </div>
          </div>
        </div>

        {/* CLINIC BOARDS GRID */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" /> Status Seluruh Poliklinik
            </h3>
            <span className="text-xs text-slate-500">Update otomatis setiap 3 detik</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {displayData?.clinic_boards.map((board) => (
              <div
                key={board.clinic_id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                      {board.prefix}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {board.floor}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white truncate mb-1">
                    {board.clinic_name}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    {board.current_doctor || 'Dokter Standby'}
                  </p>
                </div>

                <div className="my-4 py-3 bg-slate-950/80 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                    Sedang Dilayani
                  </span>
                  <div
                    className={`text-3xl font-black font-mono ${
                      board.current_queue !== '-' ? 'text-blue-400' : 'text-slate-600'
                    }`}
                  >
                    {board.current_queue}
                  </div>
                  {board.current_patient_masked && (
                    <span className="text-[10px] text-slate-400 block mt-0.5 truncate px-2">
                      {board.current_patient_masked}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  <span>
                    Menunggu: <strong className="text-amber-400">{board.waiting_count}</strong>
                  </span>
                  <span>
                    Selesai: <strong className="text-emerald-400">{board.completed_count}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TV Running Marquee Ticker */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-3 overflow-hidden text-xs">
          <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px] shrink-0 uppercase tracking-wider">
            INFO RS
          </span>
          <div className="overflow-hidden whitespace-nowrap text-slate-300">
            <span className="inline-block animate-marquee">
              Selamat datang di Rumah Sakit MediQueue Utama • Harap menunggu panggilan sesuai nomor karcis antrean poliklinik Anda • Mohon siapkan kartu identitas atau kartu BPJS sebelum memasuki ruang konsultasi dokter • Jaga ketertiban dan kebersihan lingkungan rumah sakit • Terima kasih.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};
