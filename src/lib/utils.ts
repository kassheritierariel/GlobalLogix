import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'in-transit': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'delayed': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
    case 'customs': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  }
};
