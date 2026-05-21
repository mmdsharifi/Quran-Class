import React, { useState } from 'react';
import { X, Minus, Plus, Check, Trash2 } from 'lucide-react';
import { Student } from '../../types';

export const StudentFormSheet = ({ student, onSave, onDelete, onClose, onOpenImport, showToast, confirm }: { student: Student | null, onSave: (s: any) => void, onDelete: (id: number) => void, onClose: () => void, onOpenImport: () => void, showToast: any, confirm: any }) => {
  const [name, setName] = useState(student ? student.name : '');
  const [note, setNote] = useState(student ? student.note || '' : '');
  const [diamonds, setDiamonds] = useState(student ? student.diamonds : 0);
  const [stars, setStars] = useState(student ? student.stars : 0);
  const [pluses, setPluses] = useState(student ? student.pluses : 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...student, name, note, diamonds: Number(diamonds), stars: Number(stars), pluses: Number(pluses) });
    showToast(student ? 'تغییرات ذخیره شد' : 'شاگرد جدید افزوده شد', 'success');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full max-w-md rounded-t-3xl shadow-2xl p-6 relative animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-6"></div>
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-lg font-black text-slate-700">{student ? 'ویرایش مشخصات' : 'شاگرد جدید'}</h2>
           <button onClick={onClose} className="bg-slate-200 p-2 rounded-full text-slate-500 hover:bg-slate-300"><X size={20}/></button>
        </div>
        
        {!student && (
          <button
            type="button"
            onClick={onOpenImport}
            className="w-full bg-blue-50/80 hover:bg-blue-100 text-blue-600 font-bold py-3.5 rounded-xl border border-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 mb-4 text-sm"
          >
            📥 ورود شاگرد از کلاس‌های دیگر
          </button>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">نام کامل</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 font-bold text-slate-700 focus:border-blue-500 outline-none" placeholder="نام شاگرد" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">یادداشت مربی</label>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-slate-600 focus:border-blue-500 outline-none" placeholder="توضیحات..." />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
             <label className="block text-xs font-bold text-slate-400 mb-3 text-center">تنظیم دستی امتیازات</label>
             <div className="flex justify-between gap-2">
                <div className="flex-1 flex flex-col items-center gap-2">
                   <span className="text-xl">💎</span>
                   <div className="flex items-center bg-slate-100 rounded-lg p-1">
                      <button type="button" onClick={() => setDiamonds(Math.max(0, diamonds - 1))} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-500"><Minus size={14}/></button>
                      <span className="w-8 text-center font-bold text-blue-600">{diamonds}</span>
                      <button type="button" onClick={() => setDiamonds(diamonds + 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-500"><Plus size={14}/></button>
                   </div>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                   <span className="text-xl">⭐️</span>
                   <div className="flex items-center bg-slate-100 rounded-lg p-1">
                      <button type="button" onClick={() => setStars(Math.max(0, stars - 1))} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-500"><Minus size={14}/></button>
                      <span className="w-8 text-center font-bold text-yellow-600">{stars}</span>
                      <button type="button" onClick={() => setStars(stars + 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-500"><Plus size={14}/></button>
                   </div>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                   <span className="text-xl text-green-500 font-black">+</span>
                   <div className="flex items-center bg-slate-100 rounded-lg p-1">
                      <button type="button" onClick={() => setPluses(Math.max(0, pluses - 1))} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-500"><Minus size={14}/></button>
                      <span className="w-8 text-center font-bold text-green-600">{pluses}</span>
                      <button type="button" onClick={() => setPluses(Math.min(4, pluses + 1))} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-500"><Plus size={14}/></button>
                   </div>
                </div>
             </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
             <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-transform flex items-center justify-center gap-2 text-lg">
                <Check size={20} /> ذخیره تغییرات
             </button>
             
             {student && (
               <button type="button" onClick={() => { 
                   confirm('حذف شاگرد', 'آیا مطمئن هستید؟ تمام سوابق این شاگرد حذف می‌شود.', () => {
                       onDelete(student.id);
                       showToast('شاگرد حذف شد', 'success');
                   }, true);
               }} className="w-full bg-red-50 hover:bg-red-100 text-red-500 font-bold py-3 rounded-xl border border-red-200 active:scale-95 transition-transform flex items-center justify-center gap-2 mt-2">
                  <Trash2 size={18} /> حذف شاگرد
               </button>
             )}
          </div>
        </form>
      </div>
    </div>
  );
};