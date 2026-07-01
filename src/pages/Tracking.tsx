import React from 'react';
import { MapPin, Navigation, Info, Shield, Plus, Minus, Layers } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Create a custom icon for active shipments
const shipIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div style="position:relative;">
          <div style="position:absolute;inset:0;background-color:#3b82f6;border-radius:9999px;animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width:12px;height:12px;background-color:#2563eb;border-radius:9999px;position:relative;border:2px solid rgba(255,255,255,0.4);z-index:10;"></div>
         </div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const truckIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div style="position:relative;">
          <div style="position:absolute;inset:0;background-color:#6366f1;border-radius:9999px;animation:ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width:12px;height:12px;background-color:#4f46e5;border-radius:9999px;position:relative;border:2px solid rgba(255,255,255,0.4);z-index:10;"></div>
         </div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const MARKERS = [
  { id: 'GLX-801', pos: [25.2048, 55.2708] as [number, number], status: 'En Transit - Dubaï', icon: shipIcon, route: [[25.2048, 55.2708], [19.0760, 72.8777]] },
  { id: 'GLX-802', pos: [40.7128, -74.0060] as [number, number], status: 'Arrivée Imminente - NY', icon: truckIcon, route: [[40.7128, -74.0060], [34.0522, -118.2437]] },
  { id: 'GLX-803', pos: [-4.3224, 15.3070] as [number, number], status: 'Dédouanement - Kinshasa', icon: truckIcon, route: [[-4.3224, 15.3070], [-1.2921, 36.8219]] }
];

const Tracking = () => {
  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Suivi Satellite Live</h1>
          <p className="text-slate-500">Localisation en temps réel des vecteurs de transport mondiaux.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase text-emerald-500">Système Online</span>
          </div>
        </div>
      </div>

      <div className="flex-1 border border-white/5 rounded-[2.5rem] relative overflow-hidden group bg-slate-950 isolate">
        <MapContainer 
          center={[20, 0]} 
          zoom={3} 
          zoomControl={false}
          className="w-full h-full absolute inset-0 z-0 bg-[#020617]"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          <ZoomControl position="bottomleft" />

          {MARKERS.map((marker, i) => (
            <React.Fragment key={marker.id}>
              <Polyline 
                positions={marker.route as [number, number][]} 
                color={i === 0 ? "#3b82f6" : "#6366f1"} 
                weight={2} 
                dashArray="5, 10" 
                opacity={0.5} 
              />
              <Marker position={marker.pos} icon={marker.icon}>
                <Popup className="custom-popup">
                  <div className="bg-slate-900 border border-white/10 p-3 rounded-xl m-0 shadow-xl">
                    <p className="text-xs font-black text-white mb-1">{marker.id}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{marker.status}</p>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}
        </MapContainer>

        {/* Global Network Overlay Header inside map container bounds */}
        <div className="absolute inset-x-0 top-6 text-center pointer-events-none z-[1000] drop-shadow-2xl">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-full">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[8px]">Réseau Global Synchronisé - Flux Actifs: 1,284</p>
            </div>
        </div>

        {/* Right side tracking Panel */}
        <div className="absolute right-6 top-6 w-80 space-y-4 z-[1000]">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Vecteurs Critiques</h3>
            <div className="space-y-3">
               {MARKERS.map(m => (
                 <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-colors cursor-pointer group/item">
                   <div className="flex items-center gap-3">
                     <MapPin className="w-4 h-4 text-blue-500 group-hover/item:text-blue-400 transition-colors" />
                     <div className="flex flex-col">
                        <span className="text-xs font-black text-white">{m.id}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{m.status}</span>
                     </div>
                   </div>
                   <Info className="w-3 h-3 text-slate-600 group-hover/item:text-white transition-colors" />
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Adjusting react-leaflet dark styles programmatically using global CSS or styled components wasn't trivial with this structure.
            Because CARTO dark matter is used, the map renders perfectly in dark mode context out of the box!
        */}
      </div>
    </div>
  );
};

export default Tracking;
