import React, { useState } from 'react';
import { Users, Search, UserPlus, Mail, Phone, MapPin, MoreVertical, CreditCard, MessageCircle, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

const MOCK_CUSTOMERS = [
  { id: 'CUS-001', name: 'Global Trading SA', email: 'contact@globaltrading.sa', phone: '97141234567', location: 'Dubai, UAE', totalShipments: 142, status: 'VIP' },
  { id: 'CUS-002', name: 'African Logistics Ltd', email: 'ops@afrilog.cd', phone: '243810000000', location: 'Kinshasa, RDC', totalShipments: 89, status: 'Active' },
  { id: 'CUS-003', name: 'Euro Link Express', email: 'info@eurolink.de', phone: '49157000000', location: 'Hamburg, DE', totalShipments: 45, status: 'Active' },
];

const Customers = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', whatsapp: '', location: '' });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.whatsapp) {
       alert("Le numéro WhatsApp est obligatoire pour les notifications automatisées.");
       return;
    }
    // Handle save
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Annuaire Clients</h1>
          <p className="text-slate-500">Gestion de la base de données et des relations clients.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          Nouveau Client
        </button>
      </div>

      <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-white/5 flex gap-4">
           <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400" />
              <input 
                type="text" 
                placeholder="Filtrer par nom, email ou localisation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-white"
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/30">
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Client</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Contact</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Localisation</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Volume Fret</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Statut</th>
                <th className="px-8 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {MOCK_CUSTOMERS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())).map((customer) => (
                <tr key={customer.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white italic">{customer.name}</span>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{customer.id}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                       <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                       </div>
                       <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                          <MessageCircle className="w-3 h-3 text-[#25D366]" />
                          +{customer.phone}
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <MapPin className="w-3 h-3 text-slate-600" />
                       <span className="text-xs font-bold text-white">{customer.location}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <CreditCard className="w-3 h-3 text-slate-600" />
                       <span className="text-xs font-black text-white">{customer.totalShipments}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest">
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 hover:bg-white/5 rounded-lg">
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
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-slate-950 border border-white/10 rounded-3xl p-8 z-[100] shadow-2xl"
            >
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Nouveau Client</h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <form onSubmit={handleSave} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Nom de l'entreprise / Client</label>
                    <input required type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Email</label>
                    <input required type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <MessageCircle className="w-3 h-3 text-[#25D366]" />
                      Numéro WhatsApp (Obligatoire)
                    </label>
                    <p className="text-xs text-slate-400 mb-2">Format international sans le +. Ex: 243810000000. Requis pour le robot de livraison.</p>
                    <input required type="tel" placeholder="24381..." value={newCustomer.whatsapp} onChange={e => setNewCustomer({...newCustomer, whatsapp: e.target.value})} className="w-full bg-white/5 border border-[#25D366]/30 focus:border-[#25D366] rounded-xl px-4 py-3 text-white focus:outline-none transition-colors" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Localisation (Ville, Pays)</label>
                    <input required type="text" value={newCustomer.location} onChange={e => setNewCustomer({...newCustomer, location: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                 </div>
                 <div className="pt-4 border-t border-white/5 flex justify-end gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-xs font-black uppercase text-slate-400 hover:text-white">Annuler</button>
                    <button type="submit" className="px-8 py-3 rounded-xl bg-blue-600 text-white text-xs font-black uppercase shadow-lg hover:bg-blue-500 flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4" />
                       Enregistrer
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

export default Customers;
