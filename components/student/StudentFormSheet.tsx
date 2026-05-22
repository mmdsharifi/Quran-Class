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
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-50 dark:bg-slate-900 w-full max-w-md rounded-t-3xl lg:rounded-3xl shadow-2xl p-6 relative animate-in slide-in-from-bottom lg:zoom-in-95 duration-300 max-h-[90vh] lg:max-h-[85vh] overflow-y-auto"
      >
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-lg font-black text-slate-700 dark:text-slate-200">{student ? t('editStudentTitle') : t('addStudentTitle')}</h2>
           <button onClick={onClose} className="bg-slate-200 dark:bg-slate-800 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700"><X size={20}/></button>
        </div>
        
        {!student && (
          <button
            type="button"
            onClick={onOpenImport}
            className="w-full bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold py-3.5 rounded-xl border border-blue-200 dark:border-blue-800/40 active:scale-95 transition-all flex items-center justify-center gap-2 mb-4 text-sm"
          >
            {t('importFromOtherClassBtn')}
          </button>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{t('studentName')}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-850 rounded-xl p-3 font-bold text-slate-700 dark:text-slate-200 focus:border-blue-500 dark:focus:border-blue-400 outline-none" placeholder={t('studentNamePlaceholder')} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{t('note')}</label>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-850 rounded-xl p-3 text-slate-600 dark:text-slate-300 focus:border-blue-500 dark:focus:border-blue-400 outline-none" placeholder={t('notePlaceholder')} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm">
             <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-3 text-center">{t('manualPointsSetting')}</label>
             <div className="flex justify-between gap-2">
                <div className="flex-1 flex flex-col items-center gap-2">
                   <span className="text-xl">💎</span>
                   <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                      <button type="button" onClick={() => setDiamonds(Math.max(0, diamonds - 1))} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-850 rounded-md shadow-sm text-slate-500 dark:text-slate-400"><Minus size={14}/></button>
                      <span className="w-8 text-center font-bold text-blue-600 dark:text-blue-400">{diamonds}</span>
                      <button type="button" onClick={() => setDiamonds(diamonds + 1)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-850 rounded-md shadow-sm text-slate-500 dark:text-slate-400"><Plus size={14}/></button>
                   </div>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                   <span className="text-xl">⭐️</span>
                   <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                      <button type="button" onClick={() => setStars(Math.max(0, stars - 1))} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-850 rounded-md shadow-sm text-slate-500 dark:text-slate-400"><Minus size={14}/></button>
                      <span className="w-8 text-center font-bold text-yellow-600 dark:text-yellow-500">{stars}</span>
                      <button type="button" onClick={() => setStars(stars + 1)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-850 rounded-md shadow-sm text-slate-500 dark:text-slate-400"><Plus size={14}/></button>
                   </div>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                   <span className="text-xl text-green-500 font-black">+</span>
                   <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                      <button type="button" onClick={() => setPluses(Math.max(0, pluses - 1))} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-850 rounded-md shadow-sm text-slate-500 dark:text-slate-400"><Minus size={14}/></button>
                      <span className="w-8 text-center font-bold text-green-600 dark:text-green-400">{pluses}</span>
                      <button type="button" onClick={() => setPluses(Math.min(4, pluses + 1))} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-850 rounded-md shadow-sm text-slate-500 dark:text-slate-400"><Plus size={14}/></button>
                   </div>
                </div>
             </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
             <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-transform flex items-center justify-center gap-2 text-lg">
                <Check size={20} /> {t('save')}
             </button>
             
             {student && (
                <button type="button" onClick={() => { 
                    confirm(t('deleteStudentConfirmTitle'), t('deleteStudentConfirmDesc'), () => {
                        onDelete(student.id);
                        showToast(t('studentDeleted'), 'success');
                    }, true);
                }} className="w-full bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 font-bold py-3 rounded-xl border border-red-200 dark:border-red-900/35 active:scale-95 transition-transform flex items-center justify-center gap-2 mt-2">
                   <Trash2 size={18} /> {t('deleteStudent')}
                </button>
             )}
          </div>
        </form>
      </div>
    </div>
  );
};