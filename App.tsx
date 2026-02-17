import React, { useState, useEffect, useRef } from 'react';
import { Plus, BookOpen, ChevronLeft, ChevronRight, Check, Flame, ArrowLeft, ArrowRight, Lock, Pause, ChevronDown, ChevronUp, Volume2, ThumbsUp, ThumbsDown, Clock, RefreshCw, Trash2, StickyNote, Trophy, Book, Edit, UserPlus, X, Minus, Brain, Settings, Search, History, Calendar, CheckSquare, Home } from 'lucide-react';
import { SFX_SUCCESS, SFX_CLICK, SFX_MEMORIZED, SFX_NEGATIVE, QURAN_TEXT, SURAHS, INITIAL_STUDENTS } from './constants';
import { Student, Surah, AppSettings } from './types';
import { calculateMemoryHealth, getSurahAudioUrl, getTimeAgoLabel } from './appUtils';
import { DEFAULT_SETTINGS, applyManualPointForStudent, buildNewStudent, clearBrokenStreaks, deleteStudentById, editStudentById, filterStudentsByQuery, loadJsonFromStorage, sortStudentsByScore, updateProgressForStudent } from './appLogic';

// --- UTILS ---
const playSound = (url: string) => { 
  if (navigator.onLine) { 
    try { 
      new Audio(url).play().catch(e=>{}); 
    } catch(e){} 
  } 
};

const TimeAgo = ({ timestamp, type }: { timestamp: number, type: 'positive' | 'negative' }) => {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const updateLabel = () => {
      setLabel(getTimeAgoLabel(timestamp));
    };
    updateLabel(); 
    const interval = setInterval(updateLabel, 60000); 
    return () => clearInterval(interval);
  }, [timestamp]);
  
  if (!timestamp) return null;
  return (<div className={`text-xs flex items-center gap-1 mt-2 ${type === 'negative' ? 'text-red-400' : 'text-green-500'}`}><Clock size={10} /><span>{type === 'positive' ? 'آخرین تشویق:' : 'آخرین تذکر:'} {label}</span></div>);
};

// --- COMPONENTS ---
const StatsHeader = ({ student, rank }: { student: Student, rank: number }) => {
  let rankStyle = "bg-slate-100 text-slate-500 border-slate-200";
  if (rank === 1) rankStyle = "bg-yellow-400 text-yellow-900 border-yellow-500 shadow-yellow-200";
  else if (rank === 2) rankStyle = "bg-slate-300 text-slate-800 border-slate-400 shadow-slate-200";
  else if (rank === 3) rankStyle = "bg-orange-300 text-orange-900 border-orange-400 shadow-orange-200";

  return (
    <div className="flex justify-between items-center bg-white p-3 shadow-sm rounded-2xl mb-6 border-b-4 border-slate-100 sticky top-4 z-20">
      <div className="flex items-center gap-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black border-b-4 shadow-sm ${rankStyle}`}>{rank}</div>
        <div className="bg-blue-50 p-2 rounded-xl text-blue-800 font-bold flex items-center gap-1 border-b-2 border-blue-100"><span className="text-xl">💎</span><span>{student.diamonds}</span></div>
        <div className={`p-2 rounded-xl font-bold flex items-center gap-1 border-b-2 ${student.streak > 0 ? 'bg-orange-100 text-orange-500 border-orange-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}><Flame size={18} className={student.streak > 0 ? "fill-current animate-pulse" : ""} /><span>{student.streak}</span></div>
      </div>
      <div className="flex items-center gap-2">
        <div className="bg-green-100 px-3 py-2 rounded-xl text-green-600 font-bold border-b-2 border-green-200 flex items-center gap-1 text-sm"><span>{student.pluses}/5</span><Plus size={14} strokeWidth={4} /></div>
         <div className="bg-yellow-50 p-2 rounded-xl text-yellow-800 font-bold flex items-center gap-1 border-b-2 border-yellow-100"><span className="text-xl">⭐️</span><span>{student.stars}</span></div>
      </div>
    </div>
  );
};

// Settings Sheet
const SettingsSheet = ({ settings, onSave, onClose }: { settings: AppSettings, onSave: (s: AppSettings) => void, onClose: () => void }) => {
    const days = [
        { id: 6, label: 'شنبه' },
        { id: 0, label: 'یک‌شنبه' },
        { id: 1, label: 'دوشنبه' },
        { id: 2, label: 'سه‌شنبه' },
        { id: 3, label: 'چهارشنبه' },
        { id: 4, label: 'پنج‌شنبه' },
        { id: 5, label: 'جمعه' },
    ];

    const [localSettings, setLocalSettings] = useState(settings);

    const toggleDay = (dayId: number, type: 'rokhvani' | 'hefz') => {
        setLocalSettings(prev => {
            const isRokhvani = prev.rokhvaniDays.includes(dayId);
            const isHefz = prev.hefzDays.includes(dayId);

            if (type === 'rokhvani') {
                const newRokhvani = isRokhvani ? prev.rokhvaniDays.filter(d => d !== dayId) : [...prev.rokhvaniDays, dayId];
                return { ...prev, rokhvaniDays: newRokhvani, hefzDays: prev.hefzDays.filter(d => d !== dayId) };
            } else {
                const newHefz = isHefz ? prev.hefzDays.filter(d => d !== dayId) : [...prev.hefzDays, dayId];
                 return { ...prev, hefzDays: newHefz, rokhvaniDays: prev.rokhvaniDays.filter(d => d !== dayId) };
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-50 w-full max-w-md rounded-t-3xl shadow-2xl p-6 relative animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
                <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-6"></div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-black text-slate-700 flex items-center gap-2"><Settings size={20}/> تنظیمات کلاس</h2>
                    <button onClick={onClose} className="bg-slate-200 p-2 rounded-full text-slate-500 hover:bg-slate-300"><X size={20}/></button>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-2"><Calendar size={16}/> برنامه هفتگی</h3>
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            {days.map(day => {
                                const isRokhvani = localSettings.rokhvaniDays.includes(day.id);
                                const isHefz = localSettings.hefzDays.includes(day.id);
                                return (
                                    <div key={day.id} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0">
                                        <span className="text-sm font-bold text-slate-700 w-20">{day.label}</span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => toggleDay(day.id, 'rokhvani')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${isRokhvani ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                                            >
                                                روخوانی
                                            </button>
                                            <button 
                                                onClick={() => toggleDay(day.id, 'hefz')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${isHefz ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                                            >
                                                حفظ
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                            * روزهای <b>روخوانی</b> به عنوان روزهای اجباری برای محاسبه زنجیره (Streak) در نظر گرفته می‌شوند.
                            <br/>
                            * روزهای <b>حفظ</b> اختیاری هستند و عدم فعالیت در آن‌ها زنجیره را قطع نمی‌کند.
                        </p>
                    </div>

                    <button onClick={() => { onSave(localSettings); onClose(); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-transform">
                        ذخیره تنظیمات
                    </button>
                </div>
            </div>
        </div>
    );
};

// Bottom Sheet Modal for Add/Edit Student
const StudentFormSheet = ({ student, onSave, onDelete, onClose }: { student: Student | null, onSave: (s: any) => void, onDelete: (id: number) => void, onClose: () => void }) => {
  const [name, setName] = useState(student ? student.name : '');
  const [note, setNote] = useState(student ? student.note || '' : '');
  const [diamonds, setDiamonds] = useState(student ? student.diamonds : 0);
  const [stars, setStars] = useState(student ? student.stars : 0);
  const [pluses, setPluses] = useState(student ? student.pluses : 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...student, name, note, diamonds: Number(diamonds), stars: Number(stars), pluses: Number(pluses) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full max-w-md rounded-t-3xl shadow-2xl p-6 relative animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-6"></div>
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-lg font-black text-slate-700">{student ? 'ویرایش مشخصات' : 'شاگرد جدید'}</h2>
           <button onClick={onClose} className="bg-slate-200 p-2 rounded-full text-slate-500 hover:bg-slate-300"><X size={20}/></button>
        </div>
        
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
               <button type="button" onClick={() => { if(window.confirm('حذف شود؟')) onDelete(student.id); }} className="w-full bg-red-50 hover:bg-red-100 text-red-500 font-bold py-3 rounded-xl border border-red-200 active:scale-95 transition-transform flex items-center justify-center gap-2 mt-2">
                  <Trash2 size={18} /> حذف شاگرد
               </button>
             )}
          </div>
        </form>
      </div>
    </div>
  );
};

const AudioPlayer = ({ surahId }: { surahId: number }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const togglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator.onLine) { alert("برای پخش صوت نیاز به اینترنت است."); return; }
    if (!audioRef.current) { 
        audioRef.current = new Audio(getSurahAudioUrl(surahId));
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onpause = () => setIsPlaying(false);
    }
    if (isPlaying) { 
        audioRef.current.pause();
        return;
    }
    try {
        await audioRef.current.play();
        setIsPlaying(true);
    } catch (err) {
        setIsPlaying(false);
    }
  };
  
  useEffect(() => () => audioRef.current?.pause(), []);
  return (<button onClick={togglePlay} className={`p-2 rounded-full transition-all ${isPlaying ? 'bg-blue-100 text-blue-600 animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-500'}`}>{isPlaying ? <Pause size={18} /> : <Volume2 size={18} />}</button>);
};

const TeacherSurahItem: React.FC<{ surah: Surah, student: Student, mode: 'recitation' | 'memorization', onUpdateProgress: any }> = ({ surah, student, mode, onUpdateProgress }) => {
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

  // Get review history, fallback to lastReview if history is empty but lastReview exists
  const reviewHistory = student.reviewHistory?.[surah.id] || (lastReview ? [lastReview] : []);

  const handleAyahToggle = (ayahNum: number) => {
    const isDone = completedAyahs.includes(ayahNum);
    const newCompleted = isDone ? completedAyahs.filter(a => a !== ayahNum) : [...completedAyahs, ayahNum];
    playSound(SFX_CLICK);
    onUpdateProgress(student.id, surah.id, newCompleted, mode);
  };
  const handleFullComplete = () => { playSound(mode === 'memorization' ? SFX_MEMORIZED : SFX_SUCCESS); onUpdateProgress(student.id, surah.id, ayahsList, mode, true); };

  return (
    <div className={`rounded-xl border-b-4 transition-colors overflow-hidden ${isFullyCompleted ? (mode === 'recitation' ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200') : 'bg-white border-slate-100'}`}>
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
           <AudioPlayer surahId={surah.id} />
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

const TeacherDashboard = ({ students, onUpdateProgress, onSelectStudent, activeStudentId, onManualPoint, onResetData, onAddStudent, onEditStudent, onDeleteStudent, settings, onUpdateSettings }: { students: Student[], onUpdateProgress: any, onSelectStudent: any, activeStudentId: number | null, onManualPoint: any, onResetData: any, onAddStudent: any, onEditStudent: any, onDeleteStudent: any, settings: AppSettings, onUpdateSettings: (s: AppSettings) => void }) => {
  // Sort students for display and navigation consistency
  const sortedStudents = sortStudentsByScore(students);

  // Find active student index in the sorted list
  const activeStudentIndex = activeStudentId ? sortedStudents.findIndex(s => s.id === activeStudentId) : -1;
  const activeStudent = activeStudentIndex !== -1 ? sortedStudents[activeStudentIndex] : null;

  const [mode, setMode] = useState<'recitation' | 'memorization'>('recitation');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); 
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-set mode based on day of week
  useEffect(() => {
      const today = new Date().getDay(); // 0-6. Sat is 6.
      if (settings.rokhvaniDays.includes(today)) {
          setMode('recitation');
      } else if (settings.hefzDays.includes(today)) {
          setMode('memorization');
      }
  }, [settings]);

  const goToNextStudent = () => { 
      if (activeStudentIndex !== -1 && activeStudentIndex < sortedStudents.length - 1) {
          onSelectStudent(sortedStudents[activeStudentIndex + 1].id);
      }
  };
  
  const goToPrevStudent = () => { 
      if (activeStudentIndex > 0) {
          onSelectStudent(sortedStudents[activeStudentIndex - 1].id);
      }
  };

  const filteredStudents = filterStudentsByQuery(sortedStudents, searchQuery);

  const activeStudentRank = activeStudentIndex !== -1 ? activeStudentIndex + 1 : 0;
  
  let activeRankStyle = "bg-slate-600 text-slate-200 border-slate-500";
  if (activeStudentRank === 1) activeRankStyle = "bg-yellow-400 text-yellow-900 border-yellow-500 shadow-yellow-500/50";
  else if (activeStudentRank === 2) activeRankStyle = "bg-slate-300 text-slate-900 border-slate-400 shadow-slate-500/50";
  else if (activeStudentRank === 3) activeRankStyle = "bg-orange-400 text-orange-900 border-orange-500 shadow-orange-500/50";

  return (
    <div className="max-w-md mx-auto h-full flex flex-col relative bg-slate-100 min-h-screen">
      {/* Settings Sheet */}
      {showSettings && (
          <SettingsSheet 
            settings={settings}
            onSave={onUpdateSettings}
            onClose={() => setShowSettings(false)}
          />
      )}

      {/* Bottom Sheet Modal */}
      {(isAdding || editingStudent) && (
        <StudentFormSheet 
          student={editingStudent} 
          onClose={() => { setIsAdding(false); setEditingStudent(null); }}
          onDelete={(id) => { onDeleteStudent(id); setIsAdding(false); setEditingStudent(null); }}
          onSave={(data) => {
             if (editingStudent) onEditStudent(editingStudent.id, data);
             else onAddStudent(data);
             setIsAdding(false);
             setEditingStudent(null);
          }}
        />
      )}

      {/* Bottom Navigation Bar - Only show in List View */}
      {!activeStudent && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-between items-center z-40 max-w-md mx-auto shadow-[0_-5px_20px_rgba(0,0,0,0.05)] px-6 py-2">
            <button onClick={() => setShowSettings(true)} className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 p-2 active:scale-95 transition-transform">
              <Settings size={22} />
              <span className="text-[10px] font-bold">تنظیمات</span>
            </button>
            <button onClick={() => setIsAdding(true)} className="flex flex-col items-center justify-center -mt-8">
               <div className="bg-blue-600 text-white rounded-2xl w-14 h-14 flex items-center justify-center border-4 border-slate-100 shadow-xl shadow-blue-200 active:scale-90 transition-transform">
                  <Plus size={28} />
               </div>
               <span className="text-[10px] font-bold text-slate-500 mt-1">شاگرد جدید</span>
            </button>
            <button onClick={() => { if(activeStudentId) onSelectStudent(null); }} className="flex flex-col items-center gap-1 text-blue-600 p-2 active:scale-95 transition-transform">
              <Home size={22} />
              <span className="text-[10px] font-bold">خانه</span>
            </button>
          </div>
      )}

      <div className="p-4 flex-1 pb-24">
      {!activeStudent ? (
        <>
          <div className="flex items-center justify-between mb-6 relative">
            <div>
               <h2 className="text-2xl font-black text-slate-700">کلاس ترم پاییز ۴۰۴ 🍁</h2>
               <p className="text-xs text-slate-400 mt-1">تعداد شاگردان: {students.length}</p>
            </div>
            {/* Edit Mode Toggle Button */}
            <button 
               onClick={() => setIsEditMode(!isEditMode)} 
               className={`p-3 rounded-xl transition-all ${isEditMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}
            >
               {isEditMode ? <Check size={20} /> : <Edit size={20} />}
            </button>
          </div>

          <div className="relative mb-6">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام شاگرد..." 
                className="w-full bg-white border border-slate-200 rounded-xl py-3 pr-10 pl-4 text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all shadow-sm"
              />
          </div>

          <div className="grid gap-3">
            <p className="text-slate-500 text-sm mb-2 flex items-center gap-2 justify-between">
               <span className="flex items-center gap-2"><Trophy size={14} className="text-yellow-500"/> {isEditMode ? 'ویرایش شاگردان' : 'رده‌بندی کلاس'}</span>
            </p>
            {filteredStudents.length === 0 ? (
               <div className="text-center py-10 text-slate-400">
                  <p>شاگردی با این نام پیدا نشد.</p>
               </div>
            ) : filteredStudents.map((student) => {
                const globalIndex = sortedStudents.findIndex(s => s.id === student.id);
                let rankStyle = "bg-slate-100 text-slate-500";
                let ringColor = "border-slate-100";
                if (!isEditMode) {
                   if (globalIndex === 0) { rankStyle = "bg-yellow-400 text-yellow-900 border-yellow-500 shadow-yellow-200"; ringColor = "border-yellow-400"; }
                   else if (globalIndex === 1) { rankStyle = "bg-slate-300 text-slate-800 border-slate-400 shadow-slate-200"; ringColor = "border-slate-300"; }
                   else if (globalIndex === 2) { rankStyle = "bg-orange-300 text-orange-900 border-orange-400 shadow-orange-200"; ringColor = "border-orange-300"; }
                }

                return (
                  <div key={student.id} className="relative group">
                    <button 
                      onClick={() => { 
                         if (isEditMode) { setEditingStudent(student); } 
                         else { playSound(SFX_CLICK); onSelectStudent(student.id); }
                      }} 
                      className={`w-full flex flex-col bg-white p-4 rounded-2xl shadow-sm border-2 transition-all relative overflow-hidden ${isEditMode ? 'border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50' : `${globalIndex < 3 ? ringColor : 'border-transparent'} hover:border-green-400`}`}
                    >
                       <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black border-b-2 shadow-sm transition-all ${isEditMode ? 'bg-slate-200 text-slate-400 scale-90' : rankStyle}`}>
                               {isEditMode ? <Edit size={18}/> : globalIndex + 1}
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-slate-700 text-sm text-right">{student.name}</div>
                              {!isEditMode && (
                                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                  {student.diamonds > 0 && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded flex items-center gap-1 border border-blue-100 font-bold"><span className="text-[10px]">💎</span> {student.diamonds}</span>}
                                  {(student.stars > 0 || student.diamonds > 0) && <span className="bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded flex items-center gap-1 border border-yellow-100 font-bold"><span className="text-[10px]">⭐️</span> {student.stars}</span>}
                                   {student.pluses > 0 && <span className="text-green-500 text-[10px] font-bold">+{student.pluses}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                          {isEditMode ? (
                             <div className="bg-slate-100 p-2 rounded-full text-slate-400"><Settings size={16}/></div>
                          ) : (
                             Object.keys(student.memorizationProgress || {}).some(id => calculateMemoryHealth(student.lastReview?.[Number(id)]).status === 'critical') ? (<div className="bg-red-50 text-red-500 p-2 rounded-full animate-pulse"><RefreshCw size={14} /></div>) : (<ChevronRight className="text-slate-300 group-hover:-translate-x-1 transition-transform" />)
                          )}
                       </div>
                       {!isEditMode && student.note && (<div className="mt-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg flex items-start gap-1 w-full text-right border border-slate-100"><StickyNote size={10} className="mt-0.5 text-slate-400 shrink-0" />{student.note}</div>)}
                    </button>
                  </div>
                );
            })}
            
            {/* Add Student Button (Only visible in Edit Mode or if list is empty) */}
            {(isEditMode || students.length === 0) && (
               <button 
                 onClick={() => setIsAdding(true)}
                 className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-500 transition-all"
               >
                 <UserPlus size={20} /> افزودن شاگرد جدید
               </button>
            )}

            <div className="mt-8 pt-4 border-t border-slate-100 pb-8"><button onClick={onResetData} className="w-full flex items-center justify-center gap-2 text-xs text-red-400 p-2 hover:text-red-600"><Trash2 size={12} /> حذف تمام داده‌ها و شروع مجدد</button></div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto pb-20">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-slate-100 z-10 py-2">
             <button onClick={() => { playSound(SFX_CLICK); onSelectStudent(null); }} className="text-slate-500 flex items-center gap-1 text-sm font-bold bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-200 hover:text-slate-700 transition-colors"><ArrowRight size={16} /> لیست</button>
             <div className="flex items-center gap-2">
                <button onClick={goToPrevStudent} disabled={activeStudentIndex === 0} className={`p-2 rounded-xl border ${activeStudentIndex === 0 ? 'bg-slate-200 text-slate-300 border-transparent' : 'bg-white text-slate-600 border-slate-200 shadow-sm'}`}><ChevronRight size={20}/></button>
                <span className="text-xs font-bold text-slate-400">{activeStudentIndex + 1} از {students.length}</span>
                <button onClick={goToNextStudent} disabled={activeStudentIndex === sortedStudents.length - 1} className={`p-2 rounded-xl border ${activeStudentIndex === sortedStudents.length - 1 ? 'bg-slate-200 text-slate-300 border-transparent' : 'bg-white text-slate-600 border-slate-200 shadow-sm'}`}><ChevronLeft size={20}/></button>
             </div>
          </div>
          
          <div className="bg-slate-800 text-white p-4 rounded-2xl mb-6 shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
             
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-black border-2 shadow-lg ${activeRankStyle}`}>{activeStudentRank}</div>
                <div>
                  <h3 className="text-xl font-bold">{activeStudent.name}</h3>
                  <div className="flex gap-2 text-xs text-slate-300 mt-1">
                     <span className="bg-slate-700 px-2 py-0.5 rounded flex items-center gap-1"><span className="text-sm">💎</span> {activeStudent.diamonds}</span>
                     <span className="bg-slate-700 px-2 py-0.5 rounded flex items-center gap-1"><span className="text-sm">⭐️</span> {activeStudent.stars}</span>
                  </div>
                </div>
              </div>
              <div className="text-center mr-8">
                 <div className="text-2xl font-bold text-orange-400 flex items-center justify-center gap-1">{activeStudent.streak} <Flame size={20} className="fill-current" /></div>
                 <div className="text-[10px] text-slate-400">زنجیره</div>
              </div>
            </div>
            {activeStudent.note && (<div className="mb-4 bg-slate-700/50 p-2 rounded-lg text-xs text-slate-300 flex items-center gap-2"><StickyNote size={12} />{activeStudent.note}</div>)}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1"><span>امتیاز مثبت</span><span>{activeStudent.pluses}/5</span></div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden"><div className="bg-green-400 h-full transition-all duration-300 ease-out" style={{ width: `${(activeStudent.pluses / 5) * 100}%` }}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={() => onManualPoint(activeStudent.id, 'positive')} className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl font-bold text-sm shadow-md border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"><ThumbsUp size={16} /> تشویق</button>
                <button onClick={() => onManualPoint(activeStudent.id, 'negative')} className="bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl font-bold text-sm shadow-md border-b-4 border-red-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"><ThumbsDown size={16} /> تذکر</button>
            </div>
            {activeStudent.lastAction && (<div className="bg-slate-900/50 rounded-lg p-2 mt-3 flex justify-center"><TimeAgo timestamp={activeStudent.lastAction.timestamp} type={activeStudent.lastAction.type} /></div>)}
          </div>

          <div className="bg-slate-200 p-1 rounded-xl flex mb-6 relative">
            <button onClick={() => setMode('recitation')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all z-10 flex items-center justify-center gap-2 ${mode === 'recitation' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><BookOpen size={18} /> روخوانی</button>
            <button onClick={() => setMode('memorization')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all z-10 flex items-center justify-center gap-2 ${mode === 'memorization' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Brain size={18} /> حفظ</button>
          </div>
          <div className="space-y-3">
             {SURAHS.map((surah) => <TeacherSurahItem key={surah.id} surah={surah} student={activeStudent} mode={mode} onUpdateProgress={onUpdateProgress} />)}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

const App = () => {
  const [students, setStudents] = useState<Student[]>(() =>
    loadJsonFromStorage(localStorage, 'quran_tracker_students_v1', INITIAL_STUDENTS)
  );

  const [settings, setSettings] = useState<AppSettings>(() =>
    loadJsonFromStorage(localStorage, 'quran_tracker_settings_v1', DEFAULT_SETTINGS)
  );

  const [activeStudentId, setActiveStudentId] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('quran_tracker_students_v1', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('quran_tracker_settings_v1', JSON.stringify(settings));
  }, [settings]);

  // Keep streaks correct while the app is open (including day changes).
  useEffect(() => {
     const refreshStreaks = () => {
       setStudents(currentStudents =>
         clearBrokenStreaks({
           students: currentStudents,
           now: Date.now(),
           requiredDays: settings.rokhvaniDays,
         })
       );
     };

     refreshStreaks();
     const intervalId = window.setInterval(refreshStreaks, 60_000);
     return () => window.clearInterval(intervalId);
  }, [settings.rokhvaniDays]); 

  const handleUpdateProgress = (studentId: number, surahId: number, completedAyahs: number[], mode: 'recitation' | 'memorization', isFullComplete = false) => {
    setStudents(prev =>
      updateProgressForStudent({
        students: prev,
        studentId,
        surahId,
        completedAyahs,
        mode,
        isFullComplete,
        requiredDays: settings.rokhvaniDays,
      })
    );
  };

  const handleManualPoint = (studentId: number, type: 'positive' | 'negative') => {
      setStudents(prev => {
          if (prev.some(s => s.id === studentId)) {
              playSound(type === 'positive' ? SFX_SUCCESS : SFX_NEGATIVE);
          }
          return applyManualPointForStudent({ students: prev, studentId, type });
      });
  };

  const handleAddStudent = (studentData: any) => {
      const newStudent: Student = buildNewStudent(studentData);
      setStudents(prev => [...prev, newStudent]);
  };

  const handleEditStudent = (id: number, data: any) => {
      setStudents(prev => editStudentById({ students: prev, id, data }));
  };

  const handleDeleteStudent = (id: number) => {
      setStudents(prev => deleteStudentById({ students: prev, id }));
      if (activeStudentId === id) setActiveStudentId(null);
  };

  const handleResetData = () => {
      if (window.confirm("آیا مطمئن هستید؟ تمام داده‌ها پاک خواهند شد و قابل بازگشت نیستند.")) {
          setStudents(INITIAL_STUDENTS);
          localStorage.removeItem('quran_tracker_students_v1');
      }
  };

  return (
    <TeacherDashboard 
      students={students}
      activeStudentId={activeStudentId}
      onSelectStudent={setActiveStudentId}
      onUpdateProgress={handleUpdateProgress}
      onManualPoint={handleManualPoint}
      onResetData={handleResetData}
      onAddStudent={handleAddStudent}
      onEditStudent={handleEditStudent}
      onDeleteStudent={handleDeleteStudent}
      settings={settings}
      onUpdateSettings={setSettings}
    />
  );
};

export default App;
