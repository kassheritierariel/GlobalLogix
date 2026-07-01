import React from 'react';
import { Search, Bell, User, Globe as GlobeIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

const Header = () => {
  const { user } = useAuth();
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr');
  };

  return (
    <header className="h-20 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-40 px-8 flex items-center justify-between">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text" 
            placeholder={t('header.searchPlaceholder') || "Rechercher une expédition, un client ou un conteneur..."}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-white placeholder-slate-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
        >
          <GlobeIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
          <span className="text-xs font-bold text-white uppercase tracking-widest">{i18n.language}</span>
        </button>

        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-950" />
        </button>

        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
          <div className="text-right">
            <p className="text-sm font-bold text-white leading-none mb-1">{user?.displayName}</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{user?.role?.replace('_', ' ')}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-white/10 shadow-lg">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
