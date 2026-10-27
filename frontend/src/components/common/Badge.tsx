import React from 'react';
import { cn } from '../../lib/utils';
import { QueueStatus } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  status?: QueueStatus | 'active' | 'inactive' | 'admin' | 'petugas' | 'dokter';
  className?: string;
  variant?: 'solid' | 'subtle';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  status,
  className,
  variant = 'subtle',
}) => {
  let label = children;
  let colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (status) {
    switch (status) {
      case 'waiting':
        label = label || 'Menunggu';
        colorStyles = variant === 'subtle' 
          ? 'bg-amber-50 text-amber-700 border-amber-200' 
          : 'bg-amber-500 text-white border-amber-600';
        break;
      case 'called':
        label = label || 'Dipanggil';
        colorStyles = variant === 'subtle' 
          ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' 
          : 'bg-blue-600 text-white border-blue-700';
        break;
      case 'in_progress':
        label = label || 'Sedang Dilayani';
        colorStyles = variant === 'subtle' 
          ? 'bg-purple-50 text-purple-700 border-purple-200' 
          : 'bg-purple-600 text-white border-purple-700';
        break;
      case 'completed':
        label = label || 'Selesai';
        colorStyles = variant === 'subtle' 
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
          : 'bg-emerald-600 text-white border-emerald-700';
        break;
      case 'cancelled':
        label = label || 'Dibatalkan';
        colorStyles = variant === 'subtle' 
          ? 'bg-rose-50 text-rose-700 border-rose-200' 
          : 'bg-rose-600 text-white border-rose-700';
        break;
      case 'active':
        label = label || 'Aktif';
        colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'inactive':
        label = label || 'Nonaktif';
        colorStyles = 'bg-slate-100 text-slate-600 border-slate-200';
        break;
      case 'admin':
        label = label || 'Admin';
        colorStyles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      case 'petugas':
        label = label || 'Petugas';
        colorStyles = 'bg-sky-50 text-sky-700 border-sky-200';
        break;
      case 'dokter':
        label = label || 'Dokter';
        colorStyles = 'bg-teal-50 text-teal-700 border-teal-200';
        break;
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors',
        colorStyles,
        className
      )}
    >
      {label}
    </span>
  );
};
