import React, { useState } from 'react';
import { BarChart3, TrendingUp, PieChart, Download, Calendar, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { cn } from '../lib/utils';

const DATA_DISTRIBUTION = [
  { name: 'Air', value: 45, color: '#3b82f6' },
  { name: 'Sea', value: 30, color: '#6366f1' },
  { name: 'Road', value: 25, color: '#8b5cf6' },
];

const TRENDS_DATA = {
  daily: [
    { time: '00:00', volume: 120 }, { time: '04:00', volume: 90 }, { time: '08:00', volume: 300 },
    { time: '12:00', volume: 450 }, { time: '16:00', volume: 380 }, { time: '20:00', volume: 210 }
  ],
  weekly: [
    { time: 'Lun', volume: 1500 }, { time: 'Mar', volume: 1800 }, { time: 'Mer', volume: 1600 },
    { time: 'Jeu', volume: 2100 }, { time: 'Ven', volume: 2400 }, { time: 'Sam', volume: 900 }, { time: 'Dim', volume: 700 }
  ],
  monthly: [
    { time: 'S1', volume: 8500 }, { time: 'S2', volume: 9200 }, { time: 'S3', volume: 8800 }, { time: 'S4', volume: 10500 }
  ]
};

type Timeframe = 'daily' | 'weekly' | 'monthly';

const Analytics = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly');
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoadingData(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoadingData) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-1/3">
            <div className="h-8 w-3/4 bg-white/5 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-1/2 bg-white/5 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-12 w-40 bg-white/5 rounded-2xl animate-pulse"></div>
        </div>
        <div className="h-[400px] bg-white/[0.03] rounded-[2.5rem] animate-pulse border border-white/5"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-[400px] bg-white/[0.03] rounded-[2.5rem] animate-pulse border border-white/5"></div>
          <div className="h-[400px] bg-white/[0.03] rounded-[2.5rem] animate-pulse border border-white/5"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Analyses Stratégiques</h1>
          <p className="text-slate-500">Intelligence opérationnelle et prévisions du marché logistique.</p>
        </div>
        <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-white/10">
          <Download className="w-4 h-4" />
          Exporter Données
        </button>
      </div>

      <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-3xl rounded-full -mr-40 -mt-40 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 relative z-10">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                 <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                 <h3 className="text-sm font-black text-white uppercase tracking-widest">Évolution des Volumes</h3>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Flux logistiques globaux</p>
              </div>
           </div>

           <div className="flex bg-slate-900 border border-white/10 rounded-xl p-1">
             {(['daily', 'weekly', 'monthly'] as Timeframe[]).map((tf) => (
               <button
                 key={tf}
                 onClick={() => setTimeframe(tf)}
                 className={cn(
                   "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                   timeframe === tf 
                     ? "bg-blue-600 text-white shadow-lg" 
                     : "text-slate-500 hover:text-white"
                 )}
               >
                 {tf === 'daily' ? 'Jour' : tf === 'weekly' ? 'Semaine' : 'Mois'}
               </button>
             ))}
           </div>
        </div>

        <div className="h-[300px] relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={TRENDS_DATA[timeframe]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                dx={-10} 
              />
              <Tooltip 
                cursor={{ stroke: '#ffffff10', strokeWidth: 2 }} 
                contentStyle={{ backgroundColor: '#020617', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff' }} 
              />
              <Line 
                type="monotone" 
                dataKey="volume" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#0a0a1a', stroke: '#3b82f6', strokeWidth: 2 }} 
                activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[2.5rem]">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Distribution du Fret</h3>
              <PieChart className="w-5 h-5 text-slate-500" />
           </div>
           <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={DATA_DISTRIBUTION} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 900 }} />
                 <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#020617', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                 <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                   {DATA_DISTRIBUTION.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-center">
            <div className="space-y-8">
                {DATA_DISTRIBUTION.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm font-black text-white uppercase tracking-widest">{item.name} Vector</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-white">{item.value}%</span>
                            <span className="text-[10px] font-bold text-emerald-500 uppercase">+2.4%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

