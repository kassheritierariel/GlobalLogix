import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Search, Plus, Filter, Plane, Ship, Truck, Calendar, MapPin, Weight, ChevronRight, Activity, Trash2, ArrowUpDown, ChevronDown, ChevronLeft, AlertTriangle } from 'lucide-react';
import { cn, getStatusColor } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import ShipmentDetailsPanel from '../components/ShipmentDetailsPanel';

const MOCK_SHIPMENTS = Array.from({ length: 50 }, (_, i) => ({
  id: `GLX-${1000 + i}`,
  trackingNumber: `GLX${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
  sender: 'Global Trading SA',
  receiver: 'African Logistics Ltd',
  origin: 'Dubai, UAE',
  destination: 'Kinshasa, RDC',
  status: ['pending', 'in-transit', 'customs', 'delayed', 'delivered'][Math.floor(Math.random() * 5)] as any,
  type: ['air', 'sea', 'land'][Math.floor(Math.random() * 3)] as any,
  weight: Math.floor(Math.random() * 5000),
  lastUpdate: new Date(Date.now() - Math.random() * 100000000).toISOString(),
}));

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc' | null;
};

const Shipments = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  
  // Modals state
  const [isNewShipmentModalOpen, setIsNewShipmentModalOpen] = useState(false);
  const [shipmentToDelete, setShipmentToDelete] = useState<any>(null);
  
  // Filter state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    origin: '',
    destination: '',
    dateFrom: '',
    dateTo: ''
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'lastUpdate', direction: 'desc' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newShipmentForm, setNewShipmentForm] = useState({
    sender: '',
    receiver: '',
    origin: '',
    destination: '',
    type: 'air',
    weight: ''
  });
  const [shipmentsList, setShipmentsList] = useState(MOCK_SHIPMENTS);

  const handleDeleteShipment = async () => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 800)); // Simulate API
    setShipmentsList(shipmentsList.filter(s => s.id !== shipmentToDelete.id));
    setShipmentToDelete(null);
    setIsSubmitting(false);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedShipments = useMemo(() => {
    let result = shipmentsList.filter(s => 
      s.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.destination.toLowerCase().includes(search.toLowerCase()) ||
      s.origin.toLowerCase().includes(search.toLowerCase()) ||
      s.sender.toLowerCase().includes(search.toLowerCase())
    );

    if (filters.status) result = result.filter(s => s.status === filters.status);
    if (filters.type) result = result.filter(s => s.type === filters.type);
    if (filters.origin) result = result.filter(s => s.origin.toLowerCase().includes(filters.origin.toLowerCase()));
    if (filters.destination) result = result.filter(s => s.destination.toLowerCase().includes(filters.destination.toLowerCase()));
    
    if (filters.dateFrom) {
      result = result.filter(s => new Date(s.lastUpdate).getTime() >= new Date(filters.dateFrom).getTime());
    }
    if (filters.dateTo) {
      result = result.filter(s => new Date(s.lastUpdate).getTime() <= new Date(filters.dateTo).getTime());
    }

    if (sortConfig.key) {
      result.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [search, shipmentsList, filters, sortConfig]);

  const pageCount = Math.ceil(filteredAndSortedShipments.length / itemsPerPage);
  const currentShipments = filteredAndSortedShipments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));

    const newShipment = {
      id: `GLX-${1000 + shipmentsList.length}`,
      trackingNumber: `GLX${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      sender: newShipmentForm.sender,
      receiver: newShipmentForm.receiver,
      origin: newShipmentForm.origin,
      destination: newShipmentForm.destination,
      status: 'pending' as any,
      type: newShipmentForm.type as any,
      weight: parseInt(newShipmentForm.weight, 10) || 0,
      lastUpdate: new Date().toISOString(),
    };
    setShipmentsList([newShipment, ...shipmentsList]);
    setIsSubmitting(false);
    setIsNewShipmentModalOpen(false);
    setNewShipmentForm({
      sender: '',
      receiver: '',
      origin: '',
      destination: '',
      type: 'air',
      weight: ''
    });
  };

  const [isLoadingData, setIsLoadingData] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoadingData(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const SortHeader = ({ label, sortKey }: { label: string, sortKey: string }) => (
    <th 
      className="px-6 py-5 cursor-pointer hover:bg-white/5 transition-colors select-none"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
        <ArrowUpDown className={cn(
          "w-3 h-3 transition-colors", 
          sortConfig.key === sortKey ? "text-blue-500" : "text-slate-600"
        )} />
      </div>
    </th>
  );

  if (isLoadingData) {
    return (
      <div className="h-full flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-1/3">
            <div className="h-8 w-3/4 bg-white/5 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-1/2 bg-white/5 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-12 w-48 bg-white/5 rounded-2xl animate-pulse"></div>
        </div>
        <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] flex-1 flex flex-col min-h-0 relative p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6 relative">
            <div className="h-12 flex-1 bg-white/5 rounded-xl animate-pulse"></div>
            <div className="h-12 w-32 bg-white/5 rounded-xl animate-pulse"></div>
          </div>
          <div className="flex-1 space-y-4">
            <div className="h-10 w-full bg-slate-900 rounded-lg animate-pulse"></div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 w-full bg-white/[0.01] rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">{t('shipments.title')}</h1>
          <p className="text-slate-500">{t('shipments.subtitle')}</p>
        </div>
        <button 
          onClick={() => setIsNewShipmentModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          {t('shipments.new')}
        </button>
      </div>

      <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] flex-1 flex flex-col min-h-0 relative">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text" 
              placeholder={t('shipments.filterPlaceholder') || "Filtre ID, Destination... "}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-white placeholder:text-slate-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all border",
                isFilterPanelOpen 
                  ? "bg-blue-600/20 text-blue-400 border-blue-500/30" 
                  : "bg-white/5 text-slate-400 hover:text-white border-white/5"
              )}
            >
              <Filter className="w-4 h-4" />
              {t('common.filters')}
              <ChevronDown className={cn("w-4 h-4 transition-transform", isFilterPanelOpen && "rotate-180")} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isFilterPanelOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-white/5 bg-slate-950/50 overflow-hidden"
            >
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">{t('form.status')}</label>
                  <select 
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="pending">{t('status.pending')}</option>
                    <option value="in-transit">{t('status.in-transit')}</option>
                    <option value="customs">{t('status.customs')}</option>
                    <option value="delayed">{t('status.delayed')}</option>
                    <option value="delivered">{t('status.delivered')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">{t('form.type')}</label>
                  <select 
                    value={filters.type}
                    onChange={(e) => setFilters({...filters, type: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Tous les vecteurs</option>
                    <option value="air">{t('type.air')}</option>
                    <option value="sea">{t('type.sea')}</option>
                    <option value="land">{t('type.land')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">{t('form.origin')}</label>
                  <input 
                    type="text" 
                    placeholder="Ville, Pays..."
                    value={filters.origin}
                    onChange={(e) => setFilters({...filters, origin: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">{t('form.dateFrom')}</label>
                  <input 
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">{t('form.dateTo')}</label>
                  <input 
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="px-6 pb-6 flex justify-end">
                <button 
                  onClick={() => setFilters({status: '', type: '', origin: '', destination: '', dateFrom: '', dateTo: ''})}
                  className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  {t('common.resetFilters')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-[#0a0a15] shadow-sm">
              <tr className="border-b border-white/5">
                <SortHeader label="ID Unique" sortKey="trackingNumber" />
                <SortHeader label="Status" sortKey="status" />
                <SortHeader label="Type" sortKey="type" />
                <SortHeader label="Destination" sortKey="destination" />
                <SortHeader label="Charge" sortKey="weight" />
                <SortHeader label="Dernière MAJ" sortKey="lastUpdate" />
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {currentShipments.length === 0 && (
                 <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
                       Aucune expédition trouvée.
                    </td>
                 </tr>
              )}
              {currentShipments.map((shipment) => (
                  <tr 
                    key={shipment.id}
                    className={cn(
                      "group transition-colors",
                      selectedShipment?.id === shipment.id ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                    )}
                  >
                    <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedShipment(shipment)}>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white italic">{shipment.trackingNumber}</span>
                        <span className="text-[10px] font-bold text-slate-600 uppercase">{shipment.sender}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedShipment(shipment)}>
                      <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-current", getStatusColor(shipment.status).replace('bg-', 'text-').replace('/10', ''))}>
                        {shipment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedShipment(shipment)}>
                      <div className="flex items-center gap-2 text-slate-400">
                        {shipment.type === 'air' && <Plane className="w-4 h-4" />}
                        {shipment.type === 'sea' && <Ship className="w-4 h-4" />}
                        {shipment.type === 'land' && <Truck className="w-4 h-4" />}
                        <span className="text-xs font-bold uppercase tracking-widest">{t(`type.${shipment.type}` as any) as string}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedShipment(shipment)}>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-slate-600" />
                        <span className="text-xs font-bold text-white">{shipment.destination}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedShipment(shipment)}>
                      <div className="flex items-center gap-2">
                        <Weight className="w-3 h-3 text-slate-600" />
                        <span className="text-xs font-bold text-white">{shipment.weight} Kg</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedShipment(shipment)}>
                      <span className="text-xs font-bold text-slate-500">
                        {new Date(shipment.lastUpdate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShipmentToDelete(shipment);
                          }}
                          className="p-2 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                           onClick={() => setSelectedShipment(shipment)}
                           className="p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                        >
                          <ChevronRight className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-slate-400 text-xs font-bold">
            <div>
               Affichage {currentShipments.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredAndSortedShipments.length)} sur {filteredAndSortedShipments.length} expéditions
            </div>
            <div className="flex items-center gap-2">
               <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1 uppercase tracking-widest text-[10px]"
               >
                 <ChevronLeft className="w-4 h-4" />
                 Précédent
               </button>
               <div className="flex items-center gap-1">
                 {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                    let pageNum = i + 1;
                    if (pageCount > 5 && currentPage > 3) {
                       pageNum = currentPage - 2 + i;
                       if (pageNum > pageCount) pageNum -= (pageNum - pageCount);
                    }
                    return (
                       <button
                         key={pageNum}
                         onClick={() => setCurrentPage(pageNum)}
                         className={cn(
                           "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                           currentPage === pageNum 
                             ? "bg-blue-600 text-white font-black shadow-lg shadow-blue-500/20" 
                             : "hover:bg-white/5 text-slate-400 font-bold"
                         )}
                       >
                         {pageNum}
                       </button>
                    )
                 })}
               </div>
               <button 
                  disabled={currentPage === pageCount || pageCount === 0}
                  onClick={() => setCurrentPage(prev => Math.min(pageCount, prev + 1))}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1 uppercase tracking-widest text-[10px]"
               >
                 Suivant
                 <ChevronRight className="w-4 h-4" />
               </button>
            </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedShipment && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedShipment(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            />
            <ShipmentDetailsPanel 
              shipment={selectedShipment} 
              onClose={() => setSelectedShipment(null)} 
            />
          </>
        )}

        {isNewShipmentModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewShipmentModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-slate-950 border border-white/10 rounded-3xl p-8 z-[100] shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-6">Nouvelle Expédition</h2>
              <form onSubmit={handleCreateShipment} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Expéditeur</label>
                    <input 
                      type="text" 
                      required
                      value={newShipmentForm.sender}
                      onChange={(e) => setNewShipmentForm({ ...newShipmentForm, sender: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Destinataire</label>
                    <input 
                      type="text" 
                      required
                      value={newShipmentForm.receiver}
                      onChange={(e) => setNewShipmentForm({ ...newShipmentForm, receiver: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Origine</label>
                    <input 
                      type="text" 
                      required
                      value={newShipmentForm.origin}
                      onChange={(e) => setNewShipmentForm({ ...newShipmentForm, origin: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Destination</label>
                    <input 
                      type="text" 
                      required
                      value={newShipmentForm.destination}
                      onChange={(e) => setNewShipmentForm({ ...newShipmentForm, destination: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Vecteur (Type)</label>
                    <select
                      value={newShipmentForm.type}
                      onChange={(e) => setNewShipmentForm({ ...newShipmentForm, type: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                    >
                      <option value="air" className="bg-slate-900">Aérien</option>
                      <option value="sea" className="bg-slate-900">Maritime</option>
                      <option value="land" className="bg-slate-900">Terrestre</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Charge (Kg)</label>
                    <input 
                      type="number" 
                      required
                      value={newShipmentForm.weight}
                      onChange={(e) => setNewShipmentForm({ ...newShipmentForm, weight: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="pt-6 flex items-center justify-end gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsNewShipmentModalOpen(false)}
                    className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Traitement...' : 'Créer Expédition'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}

        {shipmentToDelete && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setShipmentToDelete(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-950 border border-red-500/20 rounded-3xl p-8 z-[110] shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-rose-400" />
              
              <div className="flex flex-col items-center text-center">
                 <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                 </div>
                 <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Suppression Définitive</h2>
                 <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                   Vous êtes sur le point de supprimer l'expédition <span className="font-bold text-white">{shipmentToDelete.trackingNumber}</span>. Cette action détruira de manière permanente toutes les données associées. <strong className="text-red-400 block mt-2">Voulez-vous vraiment continuer ?</strong>
                 </p>

                 <div className="flex items-center gap-3 w-full">
                   <button 
                     onClick={() => setShipmentToDelete(null)}
                     disabled={isSubmitting}
                     className="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
                   >
                     Annuler
                   </button>
                   <button 
                     onClick={handleDeleteShipment}
                     disabled={isSubmitting}
                     className="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
                   >
                     {isSubmitting ? 'Destruction...' : 'Confirmer'}
                   </button>
                 </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shipments;
