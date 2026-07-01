import React, { useState, useRef } from 'react';
import { Building2, Plus, Search, MapPin, Phone, Globe, Shield, MoreVertical, X, Palette, Upload, Loader2, Image as ImageIcon, UserPlus, Mail, MessageCircle, Lock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAgency } from '../contexts/AgencyContext';

const MOCK_AGENCIES = [
  { id: 'AGY-001', name: 'GlobalLogix Kinshasa', location: 'Kinshasa, RDC', staff: 24, status: 'Active', zones: ['Afrique Centrale'] },
  { id: 'AGY-002', name: 'Elite Fret Dubai', location: 'Dubai, UAE', staff: 12, status: 'Active', zones: ['Moyen-Orient'] },
  { id: 'AGY-003', name: 'Logix Euro Hub', location: 'Antwerp, BE', staff: 8, status: 'Restructuring', zones: ['Europe'] },
];

const AgencyManagement = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const { branding, setBranding } = useAgency();
  const [selectedAgency, setSelectedAgency] = useState<any>(null);
  
  const [logoPreview, setLogoPreview] = useState<string | null>(branding.logoUrl || null);
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor || '#2563eb');
  const [isSaving, setIsSaving] = useState(false);

  // New Agency State
  const [newAgency, setNewAgency] = useState({ name: '', location: '', zones: '', email: '', phone: '', whatsapp: '' });
  // New Admin State
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '', role: 'agency_admin' });
  
  const handleOpenBranding = (agency: any) => {
    setSelectedAgency(agency);
    setLogoPreview(branding.logoUrl || null);
    setPrimaryColor(branding.primaryColor || '#2563eb');
    setNewAgency({ ...newAgency, name: agency.name, location: agency.location, email: 'contact@' + agency.name.toLowerCase().replace(/\s+/g, '') + '.com', phone: '+123456789', whatsapp: '243810000000' });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setBranding({ logoUrl: logoPreview || undefined, primaryColor });
    setIsSaving(false);
    setSelectedAgency(null);
  };

  const handleCreateAgency = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsSaving(true);
     await new Promise(r => setTimeout(r, 1000));
     setIsSaving(false);
     setActiveTab('list');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Réseau d'Agences</h1>
          <p className="text-slate-500">Supervision de l'infrastructure logistique multi-sites.</p>
        </div>
        {activeTab === 'list' && (
          <button 
            onClick={() => setActiveTab('create')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Ajouter Agence
          </button>
        )}
      </div>

      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {MOCK_AGENCIES.map(agency => (
             <div key={agency.id} className="bg-white/[0.03] border border-white/5 p-8 rounded-[2rem] relative overflow-hidden group hover:border-white/10 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-colors" />
                
                <div className="flex items-start justify-between mb-8">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-500" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    agency.status === 'Active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                  }`}>
                    {agency.status}
                  </span>
                </div>

                <div className="space-y-1 mb-6">
                   <h3 className="text-lg font-black text-white italic uppercase tracking-tight">{agency.name}</h3>
                   <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                      <MapPin className="w-3 h-3" />
                      {agency.location}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-6 mb-6 border-b border-white/5">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Effectifs</p>
                      <p className="text-sm font-black text-white">{agency.staff} Agents</p>
                   </div>
                   <div className="space-y-1 text-right">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Zone Oper.</p>
                      <p className="text-sm font-black text-white">{agency.zones[0]}</p>
                   </div>
                </div>

                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => handleOpenBranding(agency)}
                    className="text-xs font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors flex items-center gap-1"
                  >
                    <Shield className="w-3 h-3" />
                    Configuration & Marque
                  </button>
                  <div className="flex -space-x-2">
                     {[1, 2].map(i => (
                       <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px] font-black text-white">
                          {String.fromCharCode(64 + i)}
                       </div>
                     ))}
                  </div>
                </div>
             </div>
           ))}
        </div>
      ) : (
        <form onSubmit={handleCreateAgency} className="bg-white/5 border border-white/10 rounded-[2rem] p-8 max-w-4xl">
           <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
             <button type="button" onClick={() => setActiveTab('list')} className="p-2 hover:bg-white/5 rounded-full text-slate-400">
                <X className="w-5 h-5" />
             </button>
             <div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Nouvelle Agence & Admin</h2>
                <p className="text-sm text-slate-500 font-medium">Déploiement d'une nouvelle succursale et création du compte administrateur.</p>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Détails de l'Agence
                </h3>
                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Nom de l'Agence</label>
                   <input required type="text" value={newAgency.name} onChange={e => setNewAgency({...newAgency, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="Ex: GlobalLogix Paris" />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Localisation principale</label>
                   <input required type="text" value={newAgency.location} onChange={e => setNewAgency({...newAgency, location: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="Ville, Pays" />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Zone d'Opération</label>
                   <input required type="text" value={newAgency.zones} onChange={e => setNewAgency({...newAgency, zones: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="Ex: Europe de l'Ouest" />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Compte Administrateur
                </h3>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mb-4">
                  <p className="text-xs text-emerald-400 leading-relaxed font-medium">Ce compte permettra à l'administrateur de l'agence de se connecter. Lors de sa première connexion, il devra configurer le logo, le numéro WhatsApp et l'email de l'agence.</p>
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                     <User className="w-3 h-3" /> Identifiant (Username)
                   </label>
                   <input required type="text" value={newAdmin.username} onChange={e => setNewAdmin({...newAdmin, username: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="admin_paris" />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                     <Lock className="w-3 h-3" /> Mot de passe provisoire
                   </label>
                   <input required type="password" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
           </div>

           <div className="mt-8 pt-6 border-t border-white/5 flex justify-end gap-4">
              <button type="button" onClick={() => setActiveTab('list')} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                Annuler
              </button>
              <button disabled={isSaving} type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaving ? 'Création...' : 'Créer Agence & Admin'}
              </button>
           </div>
        </form>
      )}

      <AnimatePresence>
        {selectedAgency && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAgency(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-slate-950 border border-white/10 rounded-3xl p-8 z-[100] shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div>
                   <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Configuration de l'Agence</h2>
                   <div className="flex items-center gap-2 mt-1">
                     <span className="text-sm font-bold text-blue-400 tracking-widest">{selectedAgency.name}</span>
                     <span className="text-slate-600 text-xs">— Configuration de première ligne</span>
                   </div>
                </div>
                <button onClick={() => setSelectedAgency(null)} className="p-2 hover:bg-white/5 rounded-full text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Form Controls */}
                <form onSubmit={handleSaveBranding} className="space-y-8">
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2">Informations de Contact & Communication</h3>
                    
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <MessageCircle className="w-3 h-3 text-[#25D366]" />
                        Numéro WhatsApp Officiel
                      </label>
                      <p className="text-xs text-slate-400 mb-2 font-medium">Ce numéro sera utilisé par {selectedAgency.name} pour envoyer les factures et mises à jour de livraison aux clients.</p>
                      <input 
                        required 
                        type="tel" 
                        value={newAgency.whatsapp} 
                        onChange={(e) => setNewAgency({...newAgency, whatsapp: e.target.value})}
                        className="w-full bg-white/5 border border-[#25D366]/30 focus:border-[#25D366] rounded-xl py-3 px-4 text-white focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                          <Mail className="w-3 h-3" /> Email Contact
                        </label>
                        <input type="email" value={newAgency.email} onChange={(e) => setNewAgency({...newAgency, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                          <Phone className="w-3 h-3" /> Téléphone Bureau
                        </label>
                        <input type="tel" value={newAgency.phone} onChange={(e) => setNewAgency({...newAgency, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2">Identité Visuelle (Marque Blanche)</h3>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <ImageIcon className="w-3 h-3" />
                        Logo de l'Agence
                      </label>
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 relative group">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-8 h-8 text-slate-500" />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Upload className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleLogoChange} />
                          <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors border border-white/10"
                          >
                            <Upload className="w-3 h-3" />
                            Changer le Logo
                          </button>
                          <p className="text-[9px] text-slate-500 italic max-w-[200px]">Format recommandé: PNG ou SVG transparent, ratio 1:1.</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Palette className="w-3 h-3" />
                        Couleur Primaire (Marque)
                      </label>
                      <div className="flex items-center gap-4">
                         <input 
                           type="color" 
                           value={primaryColor}
                           onChange={(e) => setPrimaryColor(e.target.value)}
                           className="w-12 h-12 rounded-xl bg-transparent border-0 cursor-pointer p-0"
                         />
                         <div className="flex-1">
                            <input 
                              type="text" 
                              value={primaryColor}
                              onChange={(e) => setPrimaryColor(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white font-mono focus:outline-none focus:border-blue-500/50"
                            />
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5 flex justify-end gap-4">
                     <button 
                       type="button" 
                       onClick={() => setSelectedAgency(null)}
                       className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                     >
                       Annuler
                     </button>
                     <button 
                       type="submit"
                       disabled={isSaving}
                       style={{ backgroundColor: primaryColor }}
                       className="px-8 py-3 rounded-xl text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                     >
                       {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                       {isSaving ? 'Enregistrement...' : 'Sauvegarder Configuration'}
                     </button>
                  </div>
                </form>

                {/* Live Preview Pane */}
                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-white/5 pb-2">Prévisualisation Document / Facture</h3>
                  
                  <div className="flex-1 bg-white rounded-2xl overflow-hidden pointer-events-none relative" style={{ '--primary-preview': primaryColor } as any}>
                     {/* Preview Header */}
                     <div className="h-20 border-b flex items-center justify-between px-6" style={{ borderColor: `${primaryColor}20` }}>
                        <div className="flex items-center gap-3">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo" className="w-10 h-10 object-contain" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-slate-300" />
                            </div>
                          )}
                          <div>
                            <div className="h-4 w-32 rounded mb-1" style={{ backgroundColor: primaryColor }} />
                            <div className="h-2 w-24 bg-slate-200 rounded" />
                          </div>
                        </div>
                        <div className="text-right">
                           <div className="h-3 w-32 bg-slate-100 rounded mb-1 ml-auto" />
                           <div className="h-3 w-24 bg-slate-100 rounded ml-auto" />
                        </div>
                     </div>
                     
                     {/* Preview Content */}
                     <div className="p-6 space-y-6">
                        <div className="flex justify-between items-start">
                           <div className="h-6 w-32 bg-slate-200 rounded" />
                           <div className="h-10 w-24 rounded-lg opacity-90" style={{ backgroundColor: primaryColor }} />
                        </div>
                        <div className="space-y-3">
                           <div className="h-12 w-full rounded-lg bg-slate-50 border border-slate-100 flex items-center px-4">
                              <div className="h-2 w-full max-w-[200px] bg-slate-200 rounded" />
                           </div>
                           <div className="h-12 w-full rounded-lg bg-slate-50 border border-slate-100 flex items-center px-4">
                              <div className="h-2 w-full max-w-[150px] bg-slate-200 rounded" />
                           </div>
                        </div>
                        <div className="pt-6 mt-6 border-t border-slate-100">
                           <div className="flex items-center justify-center gap-3">
                              <MessageCircle className="w-4 h-4 text-[#25D366]" />
                              <div className="h-3 w-40 bg-slate-200 rounded" />
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgencyManagement;
