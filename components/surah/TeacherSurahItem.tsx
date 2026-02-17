import React, { useState } from 'react';
import { Check, RefreshCw, ChevronUp, ChevronDown, Book, History } from 'lucide-react';
import { Surah, Student } from '../../types';
import { QURAN_TEXT, SFX_CLICK, SFX_MEMORIZED, SFX_SUCCESS } from '../../constants';
import { calculateMemoryHealth, playSound } from '../../utils/helpers';
import { AudioPlayer } from './AudioPlayer';

export const TeacherSurahItem: React.FC<{ surah: Surah, student: Student, mode: 'recitation' | 'memorization', onUpdateProgress: any, showToast: any }> = ({ surah, student, mode, onUpdateProgress, showToast }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showText, setShowText] = useState(false);
  const progressData = mode === 'recitation' ? student.ayahProgress : student.memorizationProgress;
  const completedAyahs = progressData?.[surah.id] || [];
  const isFullyCompleted = completedAyahs.length === surah.ayahs;
  const ayahsList = Array.from({ length: surah.ayahs }, (_, i) => i + 1);
  const lastReview = student.lastReview?.[surah.id];
  const memoryStatus = mode === 'memorization' && isFullyCompleted ? calculateMemoryHealth(lastReview) : null;
  const themeText = mode === 'recitation' ? 'text-green-500' : 'text-purple-500';
  const themeBtn = mode === 'recitation' ? 'bg-green-500 border-green-700' : 'bg-purple-500 border-purple-700';

  const reviewHistory = student.reviewHistory?.[surah.id] || (lastReview ? [lastReview] : []);

  const handleAyahToggle = (ayahNum: number) => {
    const isDone = completedAyahs.includes(ayahNum);
    const newCompleted = isDone ? completedAyahs.filter(a => a !== ayahNum) : [...completedAyahs, ayahNum];
    playSound(SFX_CLICK);
    onUpdateProgress(student.id, surah.id, newCompleted, mode);
  };
  const handleFullComplete = () => { 
      playSound(mode === 'memorization' ? SFX_MEMORIZED : SFX_SUCCESS); 
      onUpdateProgress(student.id, surah.id, ayahsList, mode, true); 
      showToast(mode === 'memorization' ? 'حفظ کامل سوره ثبت شد +۱ ✨🤲🏻' : 'روخوانی کامل شد +۱ ✨🤲🏻', 'success');
  };

  return (
    <div className={`rounded-xl border-b-4 transition-colors overflow-hidden ${isFullyCompleted ? (mode === 'recitation' ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200') : 'bg-white border-slate-100'}`}>
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
           <AudioPlayer surahId={surah.id} showToast={showToast} />
           <div>
            <div className="font-bold text-slate-700 text-lg flex items-center gap-2">
              سوره {surah.name}
              {isFullyCompleted && (mode === 'memorization' ? <span className="text-xl">👑</span> : <Check size={16} className="text-green-500" />)}
            </div>
            <div className="text-xs text-slate-400 font-arabic flex gap-2"><span>{surah.nameAr}</span> • <span>{completedAyahs.length}/{surah.ayahs} آیه</span></div>
           </div>
        </div>
        <div className="flex items-center gap-3">
           {memoryStatus && (memoryStatus.status === 'warning' || memoryStatus.status === 'critical') && (<div className="bg-red-100 text-red-500 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1 animate-pulse"><RefreshCw size={10} /> مرور!</div>)}
           {!isFullyCompleted && <div className={`text-xs font-bold ${themeText} bg-white px-2 py-1 rounded-lg border`}>{Math.round((completedAyahs.length / surah.ayahs) * 100)}%</div>}
           {isOpen ? <ChevronUp size={20} className="text-slate-300" /> : <ChevronDown size={20} className="text-slate-300" />}
        </div>
      </div>
      {isOpen && (
        <div className="p-4 bg-slate-50 border-t border-slate-100">
           <div className="flex justify-center mb-4">
              <button onClick={() => setShowText(!showText)} className="flex items-center gap-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full transition-colors font-bold">
                 <Book size={14} /> {showText ? 'مخفی کردن متن' : 'مشاهده متن سوره'}
              </button>
           </div>
           {showText && (
             <div className="mb-4 bg-amber-50 p-4 rounded-xl border border-amber-100 text-center relative">
                <div className="text-2xl text-slate-800 leading-loose font-quran" dir="rtl">{QURAN_TEXT[surah.id] || "..."}</div>
                <div className="text-[10px] text-amber-400 mt-2">رسم‌الخط عثمان‌طه</div>
             </div>
           )}
           {memoryStatus && (
               <div className="mb-3 bg-white p-3 rounded-lg border border-slate-200">
                   <div className="flex items-center justify-between mb-2">
                     <div className="text-xs text-slate-500 flex items-center gap-1">وضعیت حافظه: <span className={`font-bold ${memoryStatus.color}`}>{memoryStatus.health}%</span></div>
                     <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${memoryStatus.barColor}`} style={{width: `${memoryStatus.health}%`}}></div></div>
                   </div>
                   
                   {reviewHistory.length > 0 && (
                      <div className="border-t border-slate-100 pt-2 mt-2">
                          <div className="text-[10px] font-bold text-slate-400 mb-2 flex items-center gap-1">
                              <History size={10} /> تاریخچه مرور:
                          </div>
                          <div className="space-y-1">
                              {reviewHistory.map((ts, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded">
                                      <span className="font-bold">{idx + 1}. {new Date(ts).toLocaleDateString('fa-IR')}</span>
                                      <span className="text-slate-400">{new Date(ts).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                   )}
               </div>
           )}
           <div className="flex justify-between items-center mb-3">
             <span className="text-xs font-bold text-slate-500">{mode === 'recitation' ? 'آیات روخوانی:' : 'آیات حفظ:'}</span>
             <button onClick={(e) => { e.stopPropagation(); handleFullComplete(); }} className={`text-xs px-2 py-1 rounded bg-white border shadow-sm ${themeText} active:scale-95 transition-transform`}>{isFullyCompleted ? 'ثبت مرور مجدد 🔄' : 'تایید کل'}</button>
           </div>
           <div className="grid grid-cols-5 gap-2">
             {ayahsList.map(ayah => (<button key={ayah} onClick={(e) => { e.stopPropagation(); handleAyahToggle(ayah); }} className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold border-b-2 transition-all ${completedAyahs.includes(ayah) ? `${themeBtn} text-white shadow-sm` : 'bg-white text-slate-400 border-slate-200'}`}>{ayah}</button>))}
           </div>
        </div>
      )}
    </div>
  );
};