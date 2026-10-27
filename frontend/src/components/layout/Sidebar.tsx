import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Clock,
  Tv,
  Building2,
  Stethoscope,
  CalendarDays,
  BarChart3,
  ShieldCheck,
  LogOut,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, hasRole } = useAuth();

  const navItems = [
    {
      label: 'Menu Utama',
      items: [
        {
          name: 'Dashboard',
          to: '/',
          icon: LayoutDashboard,
          show: true,
        },
        {
          name: 'Antrean Pasien',
          to: '/antrean',
          icon: Clock,
          show: true,
        },
        {
          name: 'Pendaftaran Baru',
          to: '/pendaftaran-baru',
          icon: UserPlus,
          show: hasRole(['admin', 'petugas']),
        },
        {
          name: 'Data Pasien',
          to: '/pasiens',
          icon: Users,
          show: hasRole(['admin', 'petugas']),
        },
        {
          name: 'Layar Antrean (TV)',
          to: '/display',
          icon: Tv,
          show: true,
          badge: 'Live',
        },
      ],
    },
    {
      label: 'Laporan & Statistik',
      items: [
        {
          name: 'Laporan Kunjungan',
          to: '/laporan',
          icon: BarChart3,
          show: hasRole(['admin', 'petugas']),
        },
      ],
    },
    {
      label: 'Master Data & Akses',
      items: [
        {
          name: 'Data Poliklinik',
          to: '/polikliniks',
          icon: Building2,
          show: hasRole(['admin']),
        },
        {
          name: 'Data Dokter',
          to: '/dokters',
          icon: Stethoscope,
          show: hasRole(['admin']),
        },
        {
          name: 'Jadwal Praktik',
          to: '/jadwals',
          icon: CalendarDays,
          show: hasRole(['admin', 'dokter']),
        },
        {
          name: 'Manajemen Pengguna',
          to: '/users',
          icon: ShieldCheck,
          show: hasRole(['admin']),
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 font-bold text-base">
            <span className="tracking-tighter">MQ</span>
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-slate-900">
              Medi<span className="text-blue-600">Queue</span>
            </div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider -mt-0.5">
              Hospital System
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {navItems.map((group, gIdx) => {
            const visibleItems = group.items.filter((i) => i.show);
            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {group.label}
                </div>
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => onClose()}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <item.icon
                            className={cn(
                              'w-4 h-4 transition-colors',
                              isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                            )}
                          />
                          <span>{item.name}</span>
                        </div>
                        {item.badge ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-blue-600 text-white animate-pulse">
                            {item.badge}
                          </span>
                        ) : isActive ? (
                          <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
                        ) : null}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                {user?.name.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium truncate">
                  {user?.role}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Keluar / Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
