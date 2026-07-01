import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Shield, Building2, UserPlus, Search, History, MoreVertical, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'agency_admin' | 'staff';
  agencyId: string;
  agencyName: string;
  status: 'active' | 'suspended' | 'pending';
  lastLogin: string | null;
  accessCount: number;
  createdAt: string;
}

const MOCK_ADMINS: Admin[] = [
  {
    id: 'ADM-001',
    name: 'Kass Héritier',
    email: 'kassheritier@telgroups.org',
    role: 'super_admin',
    agencyId: 'agency-1',
    agencyName: 'GlobalLogix Kinshasa',
    status: 'active',
    lastLogin: '2026-05-10T14:45:00Z',
    accessCount: 124,
    createdAt: '2026-04-12T10:30:00Z'
  },
  {
    id: 'ADM-002',
    name: 'Sarah Ben',
    email: 's.ben@globallogix.io',
    role: 'agency_admin',
    agencyId: 'agency-2',
    agencyName: 'Elite Fret Dubai',
    status: 'active',
    lastLogin: '2026-05-09T18:20:00Z',
    accessCount: 89,
    createdAt: '2026-05-01T14:20:00Z'
  }
];

const AdminManagement = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>(MOCK_ADMINS);
  const [search, setSearch] = useState('');
  const [isNewAdminModalOpen, setIsNewAdminModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '', role: 'agency_admin', agencyName: '' });

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'super_admin') {
      alert("Accès refusé. Seuls les Super Admins peuvent créer de nouveaux administrateurs.");
      return;
    }
    setIsSubmitting(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1000));

    const newAdmin: Admin = {
      id: `ADM-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      name: newAdminForm.name,
      email: newAdminForm.email,
      role: newAdminForm.role as any,
      agencyId: `agency-${Math.floor(Math.random() * 100)}`,
      agencyName: newAdminForm.agencyName,
      status: 'pending',
      lastLogin: null,
      accessCount: 0,
      createdAt: new Date().toISOString()
    };
    setAdmins([...admins, newAdmin]);
    setIsSubmitting(false);
    setIsNewAdminModalOpen(false);
    setNewAdminForm({ name: '', email: '', role: 'agency_admin', agencyName: '' });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Gestion des Administrateurs</h1>
          <p className="text-slate-500">Contrôle des accès et supervision du personnel administratif.</p>
        </div>
        {user?.role === 'super_admin' && (
          <button 
            onClick={() => setIsNewAdminModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Nouvel Admin
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Total Admins</span>
          </div>
          <h3 className="text-2xl font-black text-white">{admins.length}</h3>
        </div>
        <div className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Super Admins</span>
          </div>
          <h3 className="text-2xl font-black text-white">{admins.filter(a => a.role === 'super_admin').length}</h3>
        </div>
        <div className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-2">
            <History className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Access Totaux (24h)</span>
          </div>
          <h3 className="text-2xl font-black text-white">+42</h3>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.01]">
          <div className="relative group max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400" />
            <input 
              type="text" 
              placeholder="Rechercher par nom, email ou agence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/30">
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Administrateur</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">ID Unique</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Agence Affectée</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Statut</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Dernière Connexion</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Historique</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {admins.map((admin) => (
                <tr key={admin.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center font-black text-slate-400 text-xs">
                        {admin.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white italic">{admin.name}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{admin.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black text-slate-400 font-mono tracking-widest">{admin.id}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3 h-3 text-slate-600" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">{admin.agencyName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      admin.status === 'active' ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' : 
                      admin.status === 'pending' ? 'bg-amber-400/10 border-amber-400/20 text-amber-400' :
                      'bg-rose-400/10 border-rose-400/20 text-rose-400'
                    )}>
                      {admin.status === 'active' ? 'Opérationnel' : admin.status === 'pending' ? 'Attente Code' : 'Suspendu'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">
                        {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString('fr-FR') : 'JAMAIS'}
                      </span>
                      <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                        {admin.lastLogin ? new Date(admin.lastLogin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '---'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[9px] font-black text-slate-500 hover:text-blue-400 hover:border-blue-400/30 transition-all uppercase tracking-widest group">
                      <History className="w-3 h-3 group-hover:rotate-[-45deg] transition-transform" />
                      {admin.accessCount} Évènements
                    </button>
                  </td>
                  <td className="px-8 py-6">
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-slate-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <AnimatePresence>
        {isNewAdminModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewAdminModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-slate-950 border border-white/10 rounded-3xl p-8 z-[100] shadow-2xl"
            >
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-6">Nouvel Administrateur</h2>
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Nom Complet</label>
                  <input 
                    type="text" 
                    required
                    value={newAdminForm.name}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Email Technique</label>
                  <input 
                    type="email" 
                    required
                    value={newAdminForm.email}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Rôle d'Accès</label>
                  <select
                    value={newAdminForm.role}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, role: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="agency_admin">Admin d'Agence</option>
                    <option value="super_admin">Super Administrateur</option>
                    <option value="staff">Staff Opérationnel</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Nom de l'Agence Associée</label>
                  <input 
                    type="text" 
                    required
                    value={newAdminForm.agencyName}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, agencyName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="pt-4 flex items-center justify-end gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsNewAdminModalOpen(false)}
                    className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Traitement...' : "Confirmer l'Action"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminManagement;
