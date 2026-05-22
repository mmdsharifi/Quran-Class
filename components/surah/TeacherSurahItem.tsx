import React, { useState } from 'react';
import { Check, RefreshCw, ChevronUp, ChevronDown, Book, History } from 'lucide-react';
import { Surah, Student } from '../../types';
import { QURAN_TEXT, SFX_CLICK, SFX_MEMORIZED, SFX_SUCCESS } from '../../constants';
import { calculateMemoryHealth, playSound } from '../../utils/helpers';
import { AudioPlayer } from './AudioPlayer';
import { translate } from '../../translations';

const TeacherSurahItemComponent: React.FC<{ 
  surah: Surah; 
  student: Student; 
  mode: 'recitation' | 'memorization'; 
  onUpdateProgress: any; 
  showToast: any;
  language?: 'fa' | 'en';
}> = ({ 
  surah, 
  student, 
  mode, 
  onUpdateProgress, 
  showToast,
  language = 'fa'
}) => {
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
  const t = (key: Parameters<typeof translate>[0], params?: Record<string, string | number>) => translate(key, language, params);

  const handleFullComplete = () => { 
      playSound(mode === 'memorization' ? SFX_MEMORIZED : SFX_SUCCESS); 
      onUpdateProgress(student.id, surah.id, ayahsList, mode, true); 
      showToast(mode === 'memorization' ? t('fullMemorizationLogged') : t('fullRecitationLogged'), 'success');
  };

  return (
    <div className={`rounded-xl border-b-4 transition-colors overflow-hidden ${isFullyCompleted ? (mode === 'recitation' ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/40' : 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/40') : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/45 transition-colors" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
           <AudioPlayer surahId={surah.id} showToast={showToast} language={language} />
           <div>
            <div className="font-bold text-slate-700 dark:text-slate-200 text-lg flex items-center gap-2">
              {language === 'en' ? `${t('surahLabel')} ${surah.nameEn}` : `${t('surahLabel')} ${surah.name}`}
              {isFullyCompleted && (mode === 'memorization' ? <span className="text-xl">👑</span> : <Check size={16} className="text-green-500 dark:text-green-400" />)}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-550 font-arabic flex gap-2"><span>{surah.nameAr}</span> • <span>{completedAyahs.length}/{surah.ayahs} {surah.ayahs === 1 ? t('ayah') : t('ayahs')}</span></div>
           </div>
        </div>
        <div className="flex items-center gap-3">
           {memoryStatus && (memoryStatus.status === 'warning' || memoryStatus.status === 'critical') && (<div className="bg-red-100 dark:bg-red-950/30 text-red-500 dark:text-red-400 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1 animate-pulse"><RefreshCw size={10} /> {t('reviewAction')}</div>)}
           {!isFullyCompleted && <div className={`text-xs font-bold ${themeText} bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700`}>{Math.round((completedAyahs.length / surah.ayahs) * 100)}%</div>}
           {isOpen ? <ChevronUp size={20} className="text-slate-300 dark:text-slate-650" /> : <ChevronDown size={20} className="text-slate-300 dark:text-slate-650" />}
        </div>
      </div>
      {isOpen && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
           <div className="flex justify-center mb-4">
              <button onClick={() => setShowText(!showText)} className="flex items-center gap-2 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full transition-colors font-bold">
                 <Book size={14} /> {showText ? t('hideText') : t('viewText')}
              </button>
           </div>
           {showText && (
             <div className="mb-4 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 text-center relative">
                <div className="text-2xl text-slate-800 dark:text-amber-100/90 leading-loose font-quran" dir="rtl">{QURAN_TEXT[surah.id] || "..."}</div>
                <div className="text-[10px] text-amber-500/80 dark:text-amber-500/50 mt-2">{t('uthmaniScript')}</div>
             </div>
           )}
           {memoryStatus && (
               <div className="mb-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                   <div className="flex items-center justify-between mb-2">
                     <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">{t('memoryStatus')} <span className={`font-bold ${memoryStatus.color}`}>{memoryStatus.health}%</span></div>
                     <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className={`h-full ${memoryStatus.barColor}`} style={{width: `${memoryStatus.health}%`}}></div></div>
                   </div>
                   
                   {reviewHistory.length > 0 && (
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
                          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-550 mb-2 flex items-center gap-1">
                              <History size={10} /> {t('reviewHistory')}
                          </div>
                          <div className="space-y-1">
                              {reviewHistory.map((ts, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-1.5 rounded">
                                      <span className="font-bold">{idx + 1}. {new Date(ts).toLocaleDateString(language === 'en' ? 'en-US' : 'fa-IR')}</span>
                                      <span className="text-slate-400 dark:text-slate-500">{new Date(ts).toLocaleTimeString(language === 'en' ? 'en-US' : 'fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                   )}
               </div>
           )}
           <div className="flex justify-between items-center mb-3">
             <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{mode === 'recitation' ? t('recitationAyahs') : t('memorizationAyahs')}</span>
             <button onClick={(e) => { e.stopPropagation(); handleFullComplete(); }} className={`text-xs px-2 py-1 rounded bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 shadow-sm ${themeText} active:scale-95 transition-transform`}>{isFullyCompleted ? t('reviewAgain') : t('markAll')}</button>
           </div>
           <div className="grid grid-cols-5 gap-2">
             {ayahsList.map(ayah => (<button key={ayah} onClick={(e) => { e.stopPropagation(); handleAyahToggle(ayah); }} className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold border-b-2 transition-all ${completedAyahs.includes(ayah) ? `${themeBtn} text-white shadow-sm` : 'bg-white dark:bg-slate-850 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'}`}>{ayah}</button>))}
           </div>
        </div>
      )}
    </div>
  );
};

export const TeacherSurahItem = React.memo(TeacherSurahItemComponent, (prevProps, nextProps) => {
  if (prevProps.surah.id !== nextProps.surah.id) return false;
  if (prevProps.mode !== nextProps.mode) return false;
  if (prevProps.onUpdateProgress !== nextProps.onUpdateProgress) return false;
  if (prevProps.showToast !== nextProps.showToast) return false;
  if (prevProps.language !== nextProps.language) return false;

  const prevStudent = prevProps.student;
  const nextStudent = nextProps.student;
  if (prevStudent.id !== nextStudent.id) return false;

  const prevProgress = prevProps.mode === 'recitation'
    ? prevStudent.ayahProgress?.[prevProps.surah.id]
    : prevStudent.memorizationProgress?.[prevProps.surah.id];
  const nextProgress = nextProps.mode === 'recitation'
    ? nextStudent.ayahProgress?.[nextProps.surah.id]
    : nextStudent.memorizationProgress?.[nextProps.surah.id];

  if (prevProgress !== nextProgress) {
    if (!prevProgress || !nextProgress) return false;
    if (prevProgress.length !== nextProgress.length) return false;
    for (let i = 0; i < prevProgress.length; i++) {
      if (prevProgress[i] !== nextProgress[i]) return false;
    }
  }

  const prevLastReview = prevStudent.lastReview?.[prevProps.surah.id];
  const nextLastReview = nextStudent.lastReview?.[nextProps.surah.id];
  if (prevLastReview !== nextLastReview) return false;

  const prevReviewHistory = prevStudent.reviewHistory?.[prevProps.surah.id];
  const nextReviewHistory = nextStudent.reviewHistory?.[nextProps.surah.id];
  if (prevReviewHistory !== nextReviewHistory) {
    if (!prevReviewHistory || !nextReviewHistory) return false;
    if (prevReviewHistory.length !== nextReviewHistory.length) return false;
    for (let i = 0; i < prevReviewHistory.length; i++) {
      if (prevReviewHistory[i] !== nextReviewHistory[i]) return false;
    }
  }

  return true;
});