import React from 'react';
import { PrintableSlipData } from '../../types';
import { Printer, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';

interface PrintableSlipProps {
  data: PrintableSlipData;
  onClose?: () => void;
}

export const PrintableSlip: React.FC<PrintableSlipProps> = ({ data, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center">
      {/* Action Header (hidden in print) */}
      <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-slate-100 no-print">
        <div className="flex items-center gap-2 text-emerald-600">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-semibold">Pendaftaran Berhasil</span>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Tutup
            </Button>
          )}
          <Button size="sm" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
            Cetak Karcis
          </Button>
        </div>
      </div>

      {/* Printable Thermal Card / Slip */}
      <div
        id="printable-slip"
        className="w-full max-w-[340px] bg-white rounded-xl border border-slate-200 shadow-md p-5 text-slate-800 font-mono text-xs select-text"
      >
        {/* Hospital Header */}
        <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
          <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
            MQ
          </div>
          <h2 className="text-sm font-bold tracking-tight text-slate-900 font-sans">
            {data.hospital_name}
          </h2>
          <p className="text-[10px] text-slate-500 font-sans leading-tight mt-0.5">
            {data.hospital_address}
          </p>
        </div>

        {/* Big Queue Number */}
        <div className="my-4 py-3 bg-slate-50 rounded-lg text-center border border-slate-200/80">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-0.5">
            Nomor Antrean
          </span>
          <div className="text-4xl font-extrabold tracking-tight text-blue-600 font-sans">
            {data.queue_number}
          </div>
          <div className="text-[11px] font-semibold text-slate-700 mt-1">
            {data.poliklinik_name} ({data.poliklinik_floor})
          </div>
        </div>

        {/* Details Table */}
        <div className="space-y-1.5 py-2 border-y border-dashed border-slate-200 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-500">No. Registrasi:</span>
            <span className="font-semibold text-slate-900">{data.registration_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">No. Rekam Medis:</span>
            <span className="font-bold text-blue-700">{data.patient_mrn}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Nama Pasien:</span>
            <span className="font-semibold text-slate-900">{data.patient_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Dokter:</span>
            <span className="font-medium text-slate-800 text-right">{data.dokter_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Jadwal:</span>
            <span className="font-medium text-slate-800">{data.schedule_time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tanggal Kunjungan:</span>
            <span className="font-medium text-slate-800">{data.visit_date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Jenis Kunjungan:</span>
            <span className="font-semibold text-slate-800 uppercase">{data.visit_type}</span>
          </div>
        </div>

        {/* Barcode Graphic Simulation */}
        <div className="mt-4 pt-2 text-center">
          <div className="inline-block py-1 px-3 bg-white border border-slate-200 rounded">
            <div className="flex justify-center items-end h-8 gap-[2px]">
              {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4, 6, 2, 6, 4, 3, 3, 8, 3].map(
                (h, i) => (
                  <div
                    key={i}
                    className="bg-black"
                    style={{
                      width: (i % 3 === 0 ? 2 : 1) + 'px',
                      height: 16 + (h % 5) * 3 + 'px',
                    }}
                  />
                )
              )}
            </div>
            <span className="text-[9px] text-slate-500 tracking-widest block mt-0.5">
              *{data.registration_number}*
            </span>
          </div>
        </div>

        {/* Arrival Instructions */}
        <div className="mt-4 pt-3 border-t border-dashed border-slate-200 text-[10px] text-slate-500 font-sans leading-relaxed">
          <p className="font-bold text-slate-700 mb-1">Petunjuk Pasien:</p>
          <ul className="space-y-0.5 list-none">
            {data.arrival_instructions.map((ins, i) => (
              <li key={i}>{ins}</li>
            ))}
          </ul>
        </div>

        {/* Footer Timestamp */}
        <div className="mt-4 pt-2 border-t border-slate-100 text-center text-[9px] text-slate-400 font-sans">
          Dicetak: {data.registered_at} | Petugas: {data.registered_by}
        </div>
      </div>
    </div>
  );
};
