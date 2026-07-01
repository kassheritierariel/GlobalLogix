import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Globe, CreditCard, User, ChevronRight, Save, PenTool } from 'lucide-react';

const Settings = () => {
  const [signature, setSignature] = useState('Cordialement,\nKass Héritier\nSuper Admin, GlobalLogix');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Configuration Système</h1>
        <p className="text-slate-500">Paramètres opérationnels, sécurité et préférences du terminal.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-8">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 border-b border-white/5 pb-4">Profil Administratif</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nom Complet</label>
                <input type="text" defaultValue="Kass Héritier" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email de Contact</label>
                <input type="email" defaultValue="kassheritier@telgroups.org" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-blue-500/20" />
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                 <PenTool className="w-3 h-3" />
                 Signature Email
               </label>
               <textarea 
                 rows={4}
                 value={signature}
                 onChange={(e) => setSignature(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-blue-500/20 resize-none font-mono"
                 placeholder="Votre signature email..."
               />
               <p className="text-[9px] text-slate-500 italic">Cette signature sera automatiquement ajoutée à la fin de vos correspondances.</p>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="mt-8 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder le Profil'}
            </button>
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-8">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 border-b border-white/5 pb-4">Préférences d'Alerte</h3>
            <div className="space-y-4">
               {[
                 { label: 'Notifications par Email', desc: 'Alertes pour les expéditions critiques et retards.', icon: Bell },
                 { label: 'Protocole de Sécurité S-4', desc: 'Double authentification obligatoire pour les manifestes.', icon: Shield },
                 { label: 'Suivi Satellite Temps Réel', desc: 'Actualisation automatique toutes les 15 secondes.', icon: Globe },
               ].map((pref) => (
                 <div key={pref.label} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                       <div className="p-2 bg-white/5 rounded-lg">
                          <pref.icon className="w-4 h-4 text-slate-400" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-white leading-none mb-1">{pref.label}</p>
                          <p className="text-[10px] text-slate-500 font-bold">{pref.desc}</p>
                       </div>
                    </div>
                    <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-900/20">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16" />
             <h3 className="text-lg font-black italic uppercase tracking-tighter mb-4">Abonnement Enterprise</h3>
             <p className="text-blue-100 text-xs mb-8 leading-relaxed opacity-80">Accès complet au réseau satellite MondialLogix et aux protocoles de fret Priorité Alpha.</p>
             <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between py-2 border-b border-white/10">
                   <span className="text-[10px] font-black uppercase">Statut</span>
                   <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded uppercase">Premium Plus</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/10">
                   <span className="text-[10px] font-black uppercase">Renouvellement</span>
                   <span className="text-[10px] font-black">12/03/2027</span>
                </div>
             </div>
             <button className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-transform active:scale-95">
                Gérer le Plan
             </button>
          </div>

          <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-8">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Support Dédié</h3>
             <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">Besoin d'aide avec votre terminal ? Notre équipe d'experts est disponible 24/7 pour toute assistance technique.</p>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-colors cursor-pointer">
                   <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400">
                      <User className="w-5 h-5" />
                   </div>
                   <div className="flex-1">
                      <p className="text-xs font-black text-white">Support Prioritaire</p>
                      <p className="text-[10px] font-bold text-slate-500">Temps de réponse: &lt; 15 min</p>
                   </div>
                   <ChevronRight className="w-4 h-4 text-slate-700" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
