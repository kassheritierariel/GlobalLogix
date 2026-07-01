import React from 'react';
import { motion } from 'motion/react';
import { Package, TrendingUp, Ship, Plane, Truck, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { cn } from '../lib/utils';

const MOCK_STATS = [
  { label: 'Total Expéditions', value: '1,284', icon: Package, color: 'text-blue-500', trend: '+12%' },
  { label: 'Revenu Mensuel', value: '€42.5k', icon: TrendingUp, color: 'text-emerald-500', trend: '+8.4%' },
  { label: 'En Transit', value: '342', icon: Plane, color: 'text-amber-500', trend: '-2.1%' },
  { label: 'Retards Critiques', value: '12', icon: AlertTriangle, color: 'text-rose-500', trend: '+5' },
];

const MOCK_DATA = [
  { name: 'Jan', air: 400, sea: 240, land: 500 },
  { name: 'Feb', air: 300, sea: 139, land: 480 },
  { name: 'Mar', air: 200, sea: 980, land: 390 },
  { name: 'Apr', air: 278, sea: 390, land: 190 },
  { name: 'May', air: 189, sea: 480, land: 480 },
  { name: 'Jun', air: 239, sea: 380, land: 380 },
];

const Dashboard = () => {
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoadingData(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoadingData) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="w-1/3">
            <div className="h-8 w-3/4 bg-white/5 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-1/2 bg-white/5 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="h-40 bg-white/[0.03] rounded-3xl animate-pulse border border-white/5"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[400px] bg-white/[0.03] rounded-[2rem] animate-pulse border border-white/5"></div>
          <div className="h-[400px] bg-white/[0.03] rounded-[2rem] animate-pulse border border-white/5"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Centre de Commandement</h1>
          <p className="text-slate-500">Vue d'ensemble opérationnelle et métriques de performance globales.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-white/10 transition-colors"
          >
            <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-[0.03] -mr-8 -mt-8 transition-transform group-hover:scale-110", stat.color)}>
              <stat.icon className="w-full h-full" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("p-2 rounded-xl bg-white/5", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</span>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-white">{stat.value}</h3>
              <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5", 
                stat.trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'
              )}>
                {stat.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[2rem]">
          <h3 className="text-lg font-black text-white uppercase tracking-widest mb-8">Volume d'Expédition par Vecteur</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                />
                <Bar dataKey="air" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sea" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="land" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[2rem] relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-white uppercase tracking-widest">Performance Opérationnelle</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Line type="monotone" dataKey="air" stroke="#3b82f6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="sea" stroke="#6366f1" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
