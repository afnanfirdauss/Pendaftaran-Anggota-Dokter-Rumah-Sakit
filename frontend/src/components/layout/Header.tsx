import React from 'react';
import { Menu, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

interface HeaderProps {
  onToggleSidebar: () => void;
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  title,
  subtitle,
}) => {
  const { user, quickDemoLogin } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          {title && <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{title}</h1>}
          {subtitle && <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Quick Switcher for Portfolio Demonstration */}
        <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200/60 text-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase px-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Demo Switch:
          </span>
          <button
            onClick={() => quickDemoLogin('admin')}
            className={`px-2 py-0.5 rounded font-medium transition-all ${
              user?.role === 'admin'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => quickDemoLogin('petugas')}
            className={`px-2 py-0.5 rounded font-medium transition-all ${
              user?.role === 'petugas'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Petugas
          </button>
          <button
            onClick={() => quickDemoLogin('dokter')}
            className={`px-2 py-0.5 rounded font-medium transition-all ${
              user?.role === 'dokter'
                ? 'bg-white text-teal-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dokter
          </button>
        </div>

        {/* Current User Badge */}
        {user && (
          <div className="flex items-center gap-2 pl-2 sm:border-l border-slate-200">
            <Badge status={user.role} />
            <div className="hidden xl:block text-right">
              <span className="text-xs font-semibold text-slate-800 block leading-tight">{user.name}</span>
              {user.dokter && (
                <span className="text-[10px] text-teal-600 font-medium block">
                  {user.dokter.specialization}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
