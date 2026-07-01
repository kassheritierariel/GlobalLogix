import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Map, BarChart3, Users, Building2, Settings, LogOut, Globe, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAgency } from '../contexts/AgencyContext';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { branding } = useAgency();
  const { t } = useTranslation();

  const menuItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/' },
    { icon: Package, label: t('nav.shipments'), path: '/shipments' },
    { icon: Map, label: t('nav.tracking'), path: '/tracking' },
    { icon: BarChart3, label: t('nav.analytics'), path: '/analytics' },
    { icon: Users, label: t('nav.customers'), path: '/customers' },
    { icon: Building2, label: t('nav.agencies'), path: '/agencies', roles: ['super_admin'] },
    { icon: Shield, label: t('nav.admin'), path: '/admin-management', roles: ['super_admin'] },
    { icon: Settings, label: t('nav.settings'), path: '/settings' },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3 group">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
          style={{ backgroundColor: branding.logoUrl ? 'transparent' : 'var(--primary-color, #2563eb)' }}
        >
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <Globe className="w-5 h-5 text-white" />
          )}
        </div>
        <span className="text-xl font-black italic tracking-tighter uppercase text-white truncate">
          GlobalLogix
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
        {menuItems.map((item) => {
          if (item.roles && !item.roles.includes(user?.role || '')) return null;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => isActive && branding.primaryColor ? {
                backgroundColor: `${branding.primaryColor}15`,
                borderColor: `${branding.primaryColor}30`,
                color: branding.primaryColor
              } : {}}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                isActive 
                  ? "text-blue-400 bg-blue-600/10 border-blue-600/20" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="bg-white/5 rounded-2xl p-4 mb-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('nav.session')}</p>
          <p className="text-sm font-bold text-white truncate">{user?.email}</p>
          <p 
            className="text-[10px] font-bold uppercase"
            style={{ color: branding.primaryColor || '#3b82f6' }}
          >
            {user?.role?.replace('_', ' ')}
          </p>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-rose-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
