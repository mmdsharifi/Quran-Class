import React from 'react';
import { Check, AlertTriangle, Info } from 'lucide-react';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const ToastContainer = ({ toasts }: { toasts: ToastMessage[] }) => {
  return (
    <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
      {toasts.map(t => (
        <div key={t.id} className={`animate-in slide-in-from-top-2 fade-in duration-300 shadow-xl rounded-full px-4 py-3 flex items-center gap-2 text-sm font-bold pointer-events-auto ${t.type === 'error' ? 'bg-red-500 text-white' : t.type === 'success' ? 'bg-green-600 text-white' : 'bg-slate-800 text-white'}`}>
           {t.type === 'success' ? <Check size={16}/> : t.type === 'error' ? <AlertTriangle size={16}/> : <Info size={16}/>}
           {t.message}
        </div>
      ))}
    </div>
  );
};