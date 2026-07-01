import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Package, MapPin, Calendar, Weight, Plane, Ship, Truck, 
  History, FileText, Download, ShieldCheck, Clock, CheckCircle2,
  AlertTriangle, ArrowRight, ExternalLink, Upload, Loader2, Link, Search as SearchIcon, Filter, Tag,
  FileImage, MessageCircle
} from 'lucide-react';
import { cn, getStatusColor } from '../lib/utils';
import { storage } from '../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL, listAll } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';

interface ShipmentDetailsPanelProps {
  shipment: any;
  onClose: () => void;
}

const DOCUMENT_CATEGORIES = ['Tous', 'Facture', 'Connaissement', 'Douane', 'Autre'];

const ShipmentDetailsPanel = ({ shipment, onClose }: ShipmentDetailsPanelProps) => {
  const { accessToken } = useAuth();
  const [documents, setDocuments] = useState<{name: string, url: string, size?: number, isDrive?: boolean, category?: string}[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [driveLinkInput, setDriveLinkInput] = useState('');
  
  // Document Search & Filter
  const [docSearch, setDocSearch] = useState('');
  const [docFilter, setDocFilter] = useState('Tous');
  const [uploadCategory, setUploadCategory] = useState('Autre');

  // Helper to guess category from filename
  const guessCategory = (filename: string) => {
    const lower = filename.toLowerCase();
    if (lower.includes('invoice') || lower.includes('facture')) return 'Facture';
    if (lower.includes('bol') || lower.includes('bill') || lower.includes('connaissement')) return 'Connaissement';
    if (lower.includes('customs') || lower.includes('douane') || lower.includes('declaration')) return 'Douane';
    return 'Autre';
  };

  const isImageMatch = (filename: string) => {
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(filename);
  };
  
  const isPdfMatch = (filename: string) => {
    return /\.pdf$/i.test(filename);
  };

  useEffect(() => {
    if (!shipment?.id) return;
    const fetchDocs = async () => {
      try {
        const folderRef = ref(storage, `shipments/${shipment.id}`);
        const res = await listAll(folderRef);
        const docs = await Promise.all(res.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return { name: itemRef.name, url, isDrive: false, category: guessCategory(itemRef.name) };
        }));
        setDocuments(docs);
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };
    fetchDocs();
  }, [shipment?.id]);

  const fetchDriveFiles = async () => {
    if (!accessToken) {
      alert("Veuillez vous connecter avec Google pour accéder à Drive.");
      return;
    }
    setLoadingDrive(true);
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/files?q=trashed=false&orderBy=recency desc&pageSize=10&fields=files(id,name,webViewLink)', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.files) {
        setDriveFiles(data.files);
      }
    } catch (error) {
      console.error("Error fetching drive files:", error);
    } finally {
      setLoadingDrive(false);
    }
  };

  const handleOpenDrivePicker = () => {
    setShowDrivePicker(true);
    fetchDriveFiles();
  };

  const handleAttachDriveFile = (file: { name: string, webViewLink: string }) => {
    setDocuments(prev => [...prev, { name: file.name, url: file.webViewLink, isDrive: true, category: guessCategory(file.name) }]);
    setShowDrivePicker(false);
  };

  const handleAttachManualLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveLinkInput) return;
    setDocuments(prev => [...prev, { name: 'Document Google Drive', url: driveLinkInput, isDrive: true, category: 'Autre' }]);
    setDriveLinkInput('');
    setShowDrivePicker(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !shipment?.id) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      const storageRef = ref(storage, `shipments/${shipment.id}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error("Upload failed", error);
          setUploading(false);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setDocuments(prev => [...prev, { name: file.name, url: downloadURL, isDrive: false, category: uploadCategory }]);
          setUploading(false);
        }
      );
    } catch (error) {
      console.error("Upload error", error);
      setUploading(false);
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchSearch = doc.name.toLowerCase().includes(docSearch.toLowerCase());
      const matchCat = docFilter === 'Tous' || doc.category === docFilter;
      return matchSearch && matchCat;
    });
  }, [documents, docSearch, docFilter]);

  const handleSendWhatsAppUpdate = (type: 'status' | 'documents' = 'status') => {
    // Generate a quick pre-filled message with updates and links to documents
    const clientPhone = shipment.clientPhone || "+243810000000"; // fallback
    let message = '';
    
    if (type === 'status') {
      message = `*GlobalLogix - Mise à jour d'expédition*\n\n📦 *Numéro:* ${shipment.trackingNumber}\n📍 *Origine:* ${shipment.origin || 'Dubai / DXB'}\n🎯 *Destination:* ${shipment.destination}\n\n*Statut actuel:* ${shipment.status}\n\nMerci de faire confiance à GlobalLogix!`;
    } else if (type === 'documents') {
      const docLinks = documents.map(d => `- ${d.name}: ${d.url}`).join('\n');
      message = `*GlobalLogix - Vos Documents*\n\n📦 *Expédition:* ${shipment.trackingNumber}\n\nVoici vos documents:\n${docLinks || 'Aucun document pour le moment.'}\n\nConsultez votre portail pour plus de détails.`;
    }

    const url = `https://wa.me/${clientPhone.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const [expandedPackage, setExpandedPackage] = useState<string | null>(null);

  if (!shipment) return null;

  const steps = [
    { label: 'Commande Reçue', status: 'completed', date: '12 Mai, 09:30', icon: CheckCircle2 },
    { label: 'Enlèvement Entrepôt', status: 'completed', date: '13 Mai, 14:15', icon: CheckCircle2 },
    { label: 'Départ Dubai Hub', status: 'completed', date: '14 Mai, 18:00', icon: CheckCircle2 },
    { label: 'Transit International', status: 'active', date: 'En cours', icon: Clock },
    { label: 'Dédouanement Kinshasa', status: 'pending', date: 'Prévu 18 Mai', icon: Package },
    { label: 'Livraison Finale', status: 'pending', date: 'Prévu 20 Mai', icon: ShieldCheck },
  ];

  // Mock packages if not available
  const packages = shipment.packages || [
    { id: 'PKG-001', tracking: 'GLX-801-A', carrier: 'Emirates SkyCargo', status: 'En Transit', weight: '120 Kg', expected: '18 Mai 2026', currentScan: 'Dubai (DXB) - Départ' },
    { id: 'PKG-002', tracking: 'GLX-801-B', carrier: 'Emirates SkyCargo', status: 'Dédouanement', weight: '45 Kg', expected: '19 Mai 2026', currentScan: 'Kinshasa (FIH) - Arrivée' },
    { id: 'PKG-003', tracking: 'GLX-801-C', carrier: 'Local Fleet', status: 'Livré', weight: '15 Kg', expected: '15 Mai 2026', currentScan: 'Entrepôt Client' }
  ];

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-slate-950 border-l border-white/10 z-[100] shadow-2xl flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">{shipment.trackingNumber}</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dossier Logistique Alpha</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
        {/* Quick Status Bar */}
        <section className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -mr-16 -mt-16" />
           <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Statut Terminal</span>
              <span className={cn("px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border", getStatusColor(shipment.status))}>
                {shipment.status}
              </span>
           </div>
           <div className="flex items-center gap-3 relative z-10">
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-2/3 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
              </div>
              <span className="text-xs font-black text-white italic">68%</span>
           </div>
        </section>

        {/* Route & Contact Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-slate-500">
              <MapPin className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Origine</span>
            </div>
            <p className="text-sm font-black text-white uppercase italic truncate">{shipment.origin || 'Dubai / DXB'}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-blue-500">
              <MapPin className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Destination</span>
            </div>
            <p className="text-sm font-black text-white uppercase italic truncate">{shipment.destination}</p>
          </div>
          <div className="bg-[#25D366]/5 border border-[#25D366]/20 p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-[#25D366]">
              <MessageCircle className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Client (WhatsApp)</span>
            </div>
            <p className="text-sm font-black text-[#25D366] uppercase truncate">{shipment.clientPhone || '+243 81 000 0000'}</p>
          </div>
        </div>

        {/* Technical Specs */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" />
            Spécifications Techniques
          </h3>
          <div className="grid grid-cols-3 gap-4">
             {[
               { label: 'Masse Net', value: shipment.weight + ' Kg', icon: Weight },
               { label: 'Vecteur', value: shipment.type, icon: shipment.type === 'air' ? Plane : shipment.type === 'sea' ? Ship : Truck },
               { label: 'Client ID', value: 'REG-842', icon: FileText },
             ].map((spec) => (
               <div key={spec.label} className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                  <spec.icon className="w-4 h-4 text-slate-500 mx-auto mb-2" />
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">{spec.label}</p>
                  <p className="text-[10px] font-black text-white uppercase">{spec.value}</p>
               </div>
             ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <History className="w-3 h-3" />
            Journal d'Expédition
          </h3>
          <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-6 relative group">
                <div className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center relative z-10 transition-transform group-hover:scale-110",
                  step.status === 'completed' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' :
                  step.status === 'active' ? 'bg-blue-600 text-white animate-pulse' :
                  'bg-slate-800 text-slate-500'
                )}>
                  <step.icon className="w-3 h-3" />
                </div>
                <div className="flex-1 pb-1">
                   <div className="flex items-center justify-between mb-1">
                      <p className={cn(
                        "text-xs font-black uppercase tracking-widest italic",
                        step.status === 'pending' ? 'text-slate-500' : 'text-white'
                      )}>{step.label}</p>
                      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">{step.date}</span>
                   </div>
                   {step.status === 'active' && (
                     <p className="text-[9px] font-bold text-blue-500 uppercase animate-pulse">Traitement Satellite Prioritaire...</p>
                   )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Packages Accordion */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <Package className="w-3 h-3" />
            Détails des Colis ({packages.length})
          </h3>
          <div className="space-y-3">
             {packages.map((pkg: any) => (
               <div key={pkg.id} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300">
                  <div 
                    onClick={() => setExpandedPackage(expandedPackage === pkg.id ? null : pkg.id)}
                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-white/[0.04] transition-colors"
                  >
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                         <Package className="w-5 h-5 text-blue-500" />
                       </div>
                       <div>
                         <p className="text-xs font-black text-white italic uppercase">{pkg.tracking}</p>
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{pkg.weight} &bull; {pkg.carrier}</p>
                       </div>
                     </div>
                     <span className={cn(
                       "px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border",
                       pkg.status === 'Livré' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                       pkg.status === 'En Transit' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                       'bg-amber-500/10 text-amber-500 border-amber-500/20'
                     )}>
                       {pkg.status}
                     </span>
                  </div>
                  
                  <AnimatePresence>
                     {expandedPackage === pkg.id && (
                        <motion.div
                           initial={{ height: 0, opacity: 0 }}
                           animate={{ height: 'auto', opacity: 1 }}
                           exit={{ height: 0, opacity: 0 }}
                           transition={{ duration: 0.2 }}
                           className="border-t border-white/5"
                        >
                           <div className="p-4 bg-slate-950/50 flex flex-col gap-3">
                             <div className="flex justify-between">
                               <div className="space-y-1">
                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Dernier Scan</p>
                                  <p className="text-[10px] font-black text-white uppercase">{pkg.currentScan}</p>
                               </div>
                               <div className="space-y-1 text-right">
                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Livraison Est.</p>
                                  <p className="text-[10px] font-black text-white uppercase">{pkg.expected}</p>
                               </div>
                             </div>
                             <div className="flex gap-2 w-full mt-4">
                               <button className="flex-1 py-2 bg-white/5 rounded-xl border border-white/10 text-[9px] font-black text-white hover:bg-white/10 transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                                 <History className="w-3 h-3" />
                                 Historique
                               </button>
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   const msg = `*GlobalLogix - Mise à jour de Colis*\n\n📦 *Colis:* ${pkg.tracking}\n*Statut:* ${pkg.status}\n*Livraison prévue:* ${pkg.expected}\n*Dernier scan:* ${pkg.currentScan}\n\nMerci de faire confiance à GlobalLogix!`;
                                   const phone = shipment.clientPhone || '+243810000000';
                                   window.open(`https://wa.me/${phone.replace(/\+/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                 }}
                                 className="flex-1 py-2 bg-[#25D366]/10 text-[#25D366] rounded-xl border border-[#25D366]/20 text-[9px] font-black hover:bg-[#25D366]/20 transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                                 <MessageCircle className="w-3 h-3" />
                                 WhatsApp
                               </button>
                             </div>
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
             ))}
          </div>
        </section>

        {/* Enhanced Documents Section */}
        <section className="space-y-4 pb-20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <FileText className="w-3 h-3" />
              Centre Documentaire
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleOpenDrivePicker}
                className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 hover:bg-emerald-500/20 transition-colors bg-emerald-500/10 px-3 py-2 rounded-xl"
              >
                <Link className="w-3 h-3" />
                Drive
              </button>
              
              <div className="relative">
                <select 
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  {DOCUMENT_CATEGORIES.filter(c => c !== 'Tous').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1 hover:bg-blue-500/20 transition-colors bg-blue-500/10 px-3 py-2 rounded-xl pointer-events-none">
                  {uploadCategory} <Tag className="w-3 h-3 ml-1" />
                </div>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-[9px] font-black text-white bg-blue-600 uppercase tracking-widest flex items-center gap-1 hover:bg-blue-500 transition-colors px-3 py-2 rounded-xl disabled:opacity-50 shadow-lg shadow-blue-500/20 whitespace-nowrap"
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                {uploading ? 'Upload...' : 'Importer'}
              </button>
            </div>
          </div>
          
          {uploading && (
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
             <div className="relative flex-1">
               <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
               <input
                 type="text"
                 placeholder="Rechercher document..."
                 value={docSearch}
                 onChange={e => setDocSearch(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-blue-500/50"
               />
             </div>
             <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide py-1">
               <Filter className="w-3 h-3 text-slate-600 mr-1 shrink-0" />
               {DOCUMENT_CATEGORIES.map(cat => (
                 <button
                   key={cat}
                   onClick={() => setDocFilter(cat)}
                   className={cn(
                     "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-colors border",
                     docFilter === cat 
                        ? "bg-blue-600/20 text-blue-500 border-blue-500/30" 
                        : "bg-white/5 text-slate-500 border-transparent hover:text-white"
                   )}
                 >
                   {cat}
                 </button>
               ))}
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
             {filteredDocuments.length > 0 ? filteredDocuments.map((doc, idx) => (
               <a 
                 key={idx} 
                 href={doc.url}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex flex-col p-4 bg-white/[0.03] rounded-2xl border border-white/5 group hover:bg-white/[0.08] hover:border-blue-500/30 transition-all cursor-pointer relative overflow-hidden"
               >
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Download className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                     <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {doc.url && isImageMatch(doc.name) && !doc.isDrive ? (
                           <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                        ) : doc.isDrive ? (
                           <Link className="w-5 h-5 text-emerald-500" />
                        ) : isPdfMatch(doc.name) ? (
                           <FileText className="w-5 h-5 text-red-500" />
                        ) : (
                           <FileText className="w-5 h-5 text-blue-500" />
                        )}
                     </div>
                     <div className="flex-1 min-w-0 pr-6">
                        <p className="text-xs font-black text-white truncate">{doc.name}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                           {doc.isDrive ? 'GOOGLE DRIVE' : (doc.name.split('.').pop()?.toUpperCase() || 'DOCUMENT')}
                        </p>
                     </div>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                     <span className={cn(
                       "px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border",
                       doc.category === 'Facture' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                       doc.category === 'Connaissement' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                       doc.category === 'Douane' ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                       "bg-slate-500/10 text-slate-400 border-slate-500/20"
                     )}>
                       {doc.category || 'Autre'}
                     </span>
                     <span className="text-[9px] font-bold text-slate-600">Aujourd'hui</span>
                  </div>
               </a>
             )) : (
               <div className="col-span-full py-12 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border border-dashed border-white/10 rounded-3xl">
                 Aucun document ne correspond aux filtres
               </div>
             )}
          </div>
        </section>

        {/* WhatsApp Communications Section */}
        <section className="bg-slate-950/50 border border-white/5 rounded-3xl p-6 space-y-4">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <MessageCircle className="w-3 h-3" />
              Communication Externe
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={() => handleSendWhatsAppUpdate('status')}
                className="p-4 bg-[#25D366]/5 hover:bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl flex items-center gap-4 transition-colors group"
              >
                 <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 flex items-center justify-center shrink-0">
                    <History className="w-5 h-5 text-[#25D366]" />
                 </div>
                 <div className="text-left flex-1">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Mise à jour</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1">Notifier le nouveau statut</p>
                 </div>
              </button>
              <button 
                onClick={() => handleSendWhatsAppUpdate('documents')}
                className="p-4 bg-[#25D366]/5 hover:bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl flex items-center gap-4 transition-colors group"
              >
                 <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-[#25D366]" />
                 </div>
                 <div className="text-left flex-1">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Documents</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1">Partager les fichiers via lien</p>
                 </div>
              </button>
           </div>
        </section>
      </div>

      {/* Footer Actions */}
      <div className="p-8 border-t border-white/10 bg-black/40 backdrop-blur-xl grid grid-cols-1 md:grid-cols-3 gap-4">
         <button 
            onClick={() => {
              // Simuler génération de facture
              setDocuments(prev => [...prev, { name: `Facture_${shipment.trackingNumber}.pdf`, url: '#', isDrive: false, category: 'Facture' }]);
              alert('Facture générée avec succès');
            }}
            className="flex items-center justify-center gap-2 px-4 py-4 bg-amber-600/10 text-amber-500 border border-amber-600/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600/20 transition-all shadow-lg"
         >
            <FileText className="w-4 h-4" />
            Facture
         </button>
         <button className="flex items-center justify-center gap-2 px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all">
            <ExternalLink className="w-4 h-4" />
            Suivi
         </button>
         <button className="flex items-center justify-center gap-2 px-4 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
            Modifier
            <ArrowRight className="w-4 h-4" />
         </button>
      </div>

      {/* Drive File Picker Modal */}
      <AnimatePresence>
        {showDrivePicker && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrivePicker(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-slate-950 border border-white/10 rounded-3xl p-8 z-[120] shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Fichiers Google Drive</h2>
                 <button onClick={() => setShowDrivePicker(false)} className="p-2 hover:bg-white/5 rounded-full">
                    <X className="w-5 h-5 text-slate-400" />
                 </button>
              </div>

              <div className="space-y-6">
                <div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Fichiers Récents</h3>
                   {loadingDrive ? (
                     <div className="py-8 flex justify-center items-center">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                     </div>
                   ) : driveFiles.length > 0 ? (
                     <div className="space-y-2">
                       {driveFiles.map(file => (
                         <div 
                           key={file.id} 
                           onClick={() => handleAttachDriveFile(file)}
                           className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors"
                         >
                           <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                           <p className="text-xs font-bold text-white truncate">{file.name}</p>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-xs text-slate-500 italic">Aucun fichier récent trouvé.</p>
                   )}
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Lien Manuel</h3>
                  <form onSubmit={handleAttachManualLink} className="flex gap-2">
                    <input 
                      type="url" 
                      required
                      placeholder="https://docs.google.com/..."
                      value={driveLinkInput}
                      onChange={e => setDriveLinkInput(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-xs"
                    />
                    <button 
                      type="submit"
                      className="bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-1"
                    >
                      <Link className="w-3 h-3" />
                      Lier
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ShipmentDetailsPanel;
