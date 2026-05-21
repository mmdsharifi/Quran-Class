import React, { useState, useEffect, useRef } from 'react';
import { Plus, BookOpen, ChevronRight, ChevronLeft, Check, Flame, ArrowRight, ThumbsUp, ThumbsDown, StickyNote, Trophy, Book, Edit, UserPlus, X, Brain, Settings, Search, Home, RefreshCw } from 'lucide-react';
import { SURAHS, SFX_CLICK } from '../constants';
import { Student, AppSettings, QuranClass } from '../types';
import { calculateMemoryHealth, playSound } from '../utils/helpers';
import { TimeAgo } from '../components/common/TimeAgo';
import { SettingsSheet } from '../components/settings/SettingsSheet';
import { StudentFormSheet } from '../components/student/StudentFormSheet';
import { TeacherSurahItem } from '../components/surah/TeacherSurahItem';
import { ClassManagementSheet } from '../components/class/ClassManagementSheet';
import { ImportStudentSheet } from '../components/student/ImportStudentSheet';

export const TeacherDashboard = ({ 
    classes,
    activeClassId,
    onSelectClass,
    onCreateClass,
    onEditClass,
    onDeleteClass,
    onArchiveClass,
    students, 
    onUpdateProgress, 
    onSelectStudent, 
    activeStudentId, 
    onManualPoint, 
    onResetData, 
    onAddStudent, 
    onEditStudent, 
    onDeleteStudent, 
    onImportStudentsFromClass,
    settings, 
    onUpdateSettings, 
    onImportData, 
    showToast, 
    confirm 
}: { 
    classes: QuranClass[],
    activeClassId: string,
    onSelectClass: (id: string) => void,
    onCreateClass: (name: string, emoji: string, startDate?: string, endDate?: string, firstStudentName?: string) => void,
    onEditClass: (id: string, updatedFields: Partial<QuranClass>) => void,
    onDeleteClass: (id: string) => void,
    onArchiveClass: (id: string, archive: boolean) => void,
    students: Student[], 
    onUpdateProgress: any, 
    onSelectStudent: any, 
    activeStudentId: number | null, 
    onManualPoint: any, 
    onResetData: () => void, 
    onAddStudent: any, 
    onEditStudent: any, 
    onDeleteStudent: any, 
    onImportStudentsFromClass: (selectedStudents: Student[], keepData: boolean) => void,
    settings: AppSettings, 
    onUpdateSettings: (s: AppSettings) => void,
    onImportData: (s: Student[]) => void,
    showToast: any,
    confirm: any
}) => {
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');

  const getPeriodStats = (student: Student, filter: 'all' | 'week' | 'month') => {
    const stats = {
      recitation: 0,
      memorization: 0,
      diamonds: 0,
      stars: 0,
      pluses: 0,
    };

    if (filter === 'all') {
      stats.diamonds = student.diamonds || 0;
      stats.stars = student.stars || 0;
      stats.pluses = student.pluses || 0;
      stats.recitation = Object.values(student.ayahProgress || {}).reduce((sum, arr) => sum + (arr?.length || 0), 0);
      stats.memorization = Object.values(student.memorizationProgress || {}).reduce((sum, arr) => sum + (arr?.length || 0), 0);
      return stats;
    }

    const cutoff = Date.now() - (filter === 'week' ? 7 : 30) * 24 * 60 * 60 * 1000;
    const entries = (student.progressLog || []).filter((e) => e.timestamp >= cutoff);

    for (const e of entries) {
      if (e.type === 'recitation') {
        stats.recitation += (e.added?.length || 0) - (e.removed?.length || 0);
      } else if (e.type === 'memorization') {
        stats.memorization += (e.added?.length || 0) - (e.removed?.length || 0);
      }
      if (e.delta) {
        stats.diamonds += e.delta.diamonds || 0;
        stats.stars += e.delta.stars || 0;
        stats.pluses += e.delta.pluses || 0;
      }
    }

    stats.recitation = Math.max(0, stats.recitation);
    stats.memorization = Math.max(0, stats.memorization);
    return stats;
  };

  const studentStatsMap = React.useMemo(() => {
    const map = new Map<number, ReturnType<typeof getPeriodStats>>();
    for (const student of students) {
      map.set(student.id, getPeriodStats(student, timeFilter));
    }
    return map;
  }, [students, timeFilter]);

  const sortedStudents = [...students].sort((a, b) => {
    const statsA = studentStatsMap.get(a.id)!;
    const statsB = studentStatsMap.get(b.id)!;

    if (statsB.diamonds !== statsA.diamonds) return statsB.diamonds - statsA.diamonds;
    if (statsB.stars !== statsA.stars) return statsB.stars - statsA.stars;
    if (statsB.pluses !== statsA.pluses) return statsB.pluses - statsA.pluses;
    if (statsB.memorization !== statsA.memorization) return statsB.memorization - statsA.memorization;
    return statsB.recitation - statsA.recitation;
  });

  const activeStudentIndex = activeStudentId ? sortedStudents.findIndex(s => s.id === activeStudentId) : -1;
  const activeStudent = activeStudentIndex !== -1 ? sortedStudents[activeStudentIndex] : null;

  const weekStats = activeStudent ? getPeriodStats(activeStudent, 'week') : null;
  const monthStats = activeStudent ? getPeriodStats(activeStudent, 'month') : null;
  const allStats = activeStudent ? getPeriodStats(activeStudent, 'all') : null;

  const [mode, setMode] = useState<'recitation' | 'memorization'>('recitation');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); 
  const [showSettings, setShowSettings] = useState(false);
  const [showClassManagement, setShowClassManagement] = useState(false);
  const [showImportSheet, setShowImportSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  const activeClass = classes.find(c => c.id === activeClassId && !c.archived) || classes.find(c => !c.archived) || classes[0];
  const className = activeClass?.name || 'کلاس بی‌نام';
  const classEmoji = activeClass?.emoji || '🕌';
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const detailContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const today = new Date().getDay(); 
      if (settings.rokhvaniDays.includes(today)) {
          setMode('recitation');
      } else if (settings.hefzDays.includes(today)) {
          setMode('memorization');
      }
  }, [settings]);

  // Handle scroll detection for sticky header animation
  useEffect(() => {
    const handleScroll = () => {
        if (detailContainerRef.current) {
            // Trigger animation when scrolled past a certain threshold (e.g., 50px)
            setIsScrolled(detailContainerRef.current.scrollTop > 50);
        }
    };

    const container = detailContainerRef.current;
    if (container) {
        container.addEventListener('scroll', handleScroll);
    }
    return () => {
        if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, [activeStudentId]);

  // Reset scroll when switching students
  useEffect(() => {
      if (detailContainerRef.current) {
          detailContainerRef.current.scrollTop = 0;
          setIsScrolled(false);
      }
  }, [activeStudentId]);

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

  const filteredStudents = sortedStudents.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.name.includes(searchQuery));
  const activeStudentRank = activeStudentIndex !== -1 ? activeStudentIndex + 1 : 0;
  
  let activeRankStyle = "bg-slate-600 text-slate-200 border-slate-500";
  if (activeStudentRank === 1) activeRankStyle = "bg-yellow-400 text-yellow-900 border-yellow-500 shadow-yellow-500/50";
  else if (activeStudentRank === 2) activeRankStyle = "bg-slate-300 text-slate-900 border-slate-400 shadow-slate-500/50";
  else if (activeStudentRank === 3) activeRankStyle = "bg-orange-400 text-orange-900 border-orange-500 shadow-orange-500/50";

  return (
    <div className="max-w-md mx-auto h-full flex flex-col relative bg-slate-100 min-h-screen overflow-hidden">
      {/* Settings Sheet */}
      {showSettings && (
          <SettingsSheet 
            settings={settings}
            students={students}
            onSave={onUpdateSettings}
            onImport={onImportData}
            onReset={onResetData}
            onClose={() => setShowSettings(false)}
            showToast={showToast}
            confirm={confirm}
          />
      )}

      {/* Student Form Modal */}
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
          onOpenImport={() => {
             setIsAdding(false);
             setShowImportSheet(true);
          }}
          showToast={showToast}
          confirm={confirm}
        />
      )}

      {/* Class Management Sheet */}
      {showClassManagement && (
          <ClassManagementSheet 
            classes={classes}
            activeClassId={activeClassId}
            onSelectClass={onSelectClass}
            onCreateClass={onCreateClass}
            onEditClass={onEditClass}
            onDeleteClass={onDeleteClass}
            onArchiveClass={onArchiveClass}
            onClose={() => setShowClassManagement(false)}
            showToast={showToast}
            confirm={confirm}
          />
      )}

      {/* Import Student Sheet */}
      {showImportSheet && (
          <ImportStudentSheet 
            classes={classes}
            activeClassId={activeClassId}
            onClose={() => setShowImportSheet(false)}
            onImport={(selectedStudents, keepData) => {
              onImportStudentsFromClass(selectedStudents, keepData);
              setShowImportSheet(false);
            }}
            showToast={showToast}
          />
      )}

      {/* Main Content Area with Transitions */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
          {/* List View */}
          <div className={`absolute inset-0 bg-slate-100 overflow-y-auto pb-24 transition-transform duration-300 ease-in-out ${activeStudentId ? '-translate-x-1/4 opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
              <div className="p-4">
                  <div className="flex items-center justify-between mb-6 relative">
                    <button 
                       onClick={() => setShowClassManagement(true)}
                       className="flex flex-col items-start text-right p-2 -m-2 rounded-2xl hover:bg-slate-200/50 active:scale-95 transition-all group focus:outline-none"
                    >
                       <h2 className="text-xl font-black text-slate-700 flex items-center gap-1.5">
                         <span>{classEmoji}</span>
                         <span className="truncate max-w-[180px]">{className}</span>
                         <ChevronRight size={16} className="text-slate-400 rotate-90 group-hover:text-blue-600 transition-colors" />
                       </h2>
                       <div className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                         <span>شاگردان: {students.length} نفر</span>
                         {activeClass?.startDate && (
                           <>
                             <span>•</span>
                             <span>دوره: {activeClass.startDate} {activeClass.endDate ? `تا ${activeClass.endDate}` : ''}</span>
                           </>
                         )}
                       </div>
                    </button>
                    <button 
                       onClick={() => setIsEditMode(!isEditMode)} 
                       className={`p-3 rounded-xl transition-all ${isEditMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}
                    >
                       {isEditMode ? <Check size={20} /> : <Edit size={20} />}
                    </button>
                  </div>

                  <div className="relative mb-6">
                      {searchQuery ? (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          <X size={18} />
                        </button>
                      ) : (
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                      )}
                      <input 
                        ref={searchInputRef}
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="جستجوی نام شاگرد..." 
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 pr-10 pl-4 text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all shadow-sm"
                      />
                  </div>

                  {/* Time Filter Tabs */}
                  <div className="bg-slate-200/60 backdrop-blur-sm p-1 rounded-2xl flex gap-1 mb-6 text-xs font-bold text-slate-500 relative">
                    <button
                      onClick={() => { playSound(SFX_CLICK); setTimeFilter('all'); }}
                      className={`flex-1 py-2.5 rounded-xl transition-all ${timeFilter === 'all' ? 'bg-white text-slate-800 shadow-sm font-black' : 'hover:text-slate-700 active:scale-95'}`}
                    >
                      کل دوره
                    </button>
                    <button
                      onClick={() => { playSound(SFX_CLICK); setTimeFilter('month'); }}
                      className={`flex-1 py-2.5 rounded-xl transition-all ${timeFilter === 'month' ? 'bg-white text-slate-800 shadow-sm font-black' : 'hover:text-slate-700 active:scale-95'}`}
                    >
                      این ماه
                    </button>
                    <button
                      onClick={() => { playSound(SFX_CLICK); setTimeFilter('week'); }}
                      className={`flex-1 py-2.5 rounded-xl transition-all ${timeFilter === 'week' ? 'bg-white text-slate-800 shadow-sm font-black' : 'hover:text-slate-700 active:scale-95'}`}
                    >
                      این هفته
                    </button>
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
                        const stats = studentStatsMap.get(student.id) || { recitation: 0, memorization: 0, diamonds: 0, stars: 0, pluses: 0 };
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
                                        <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                                          {timeFilter === 'all' ? (
                                            <>
                                              {student.diamonds > 0 && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded flex items-center gap-1 border border-blue-100 font-bold"><span className="text-[10px]">💎</span> {student.diamonds}</span>}
                                              {(student.stars > 0 || student.diamonds > 0) && <span className="bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded flex items-center gap-1 border border-yellow-100 font-bold"><span className="text-[10px]">⭐️</span> {student.stars}</span>}
                                              {student.pluses > 0 && <span className="text-green-500 text-[10px] font-bold">+{student.pluses}</span>}
                                            </>
                                          ) : (
                                            <>
                                              {stats.diamonds > 0 && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded flex items-center gap-1 border border-blue-100 font-bold"><span className="text-[10px]">💎</span> {stats.diamonds}</span>}
                                              {stats.stars > 0 && <span className="bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded flex items-center gap-1 border border-yellow-100 font-bold"><span className="text-[10px]">⭐️</span> {stats.stars}</span>}
                                              {stats.pluses > 0 && <span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded flex items-center gap-1 border border-green-100 font-bold"><span className="text-[10px]">+</span>{stats.pluses}</span>}
                                              
                                              {(stats.recitation > 0 || stats.memorization > 0) ? (
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                                  {stats.recitation > 0 && <span>روخوانی: {stats.recitation}</span>}
                                                  {stats.recitation > 0 && stats.memorization > 0 && <span className="text-slate-300">•</span>}
                                                  {stats.memorization > 0 && <span>حفظ: {stats.memorization}</span>}
                                                </span>
                                              ) : (
                                                stats.diamonds === 0 && stats.stars === 0 && stats.pluses === 0 && (
                                                  <span className="text-[10px] text-slate-300 italic">بدون فعالیت</span>
                                                )
                                              )}
                                            </>
                                          )}
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
                  </div>
              </div>
          </div>

          {/* Detail View */}
          <div 
             ref={detailContainerRef}
             className={`absolute inset-0 bg-slate-100 overflow-y-auto pb-24 transition-transform duration-300 ease-in-out ${activeStudentId ? 'translate-x-0' : 'translate-x-full'}`}
          >
              {activeStudent && (
                  <div className="pb-4">
                      {/* Sticky Header */}
                      <div className={`flex items-center justify-between sticky top-0 z-30 py-3 px-4 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200' : 'bg-slate-100'}`}>
                         <div className="flex items-center gap-3 overflow-hidden">
                             <button 
                                onClick={() => { playSound(SFX_CLICK); onSelectStudent(null); }} 
                                className={`flex items-center gap-1 font-bold text-sm bg-white shadow-sm border border-slate-200 hover:text-slate-700 transition-all z-20 overflow-hidden ${isScrolled ? 'text-slate-700 p-2 rounded-full w-9 justify-center' : 'text-slate-500 px-3 py-2 rounded-xl w-24'}`}
                             >
                                <ArrowRight size={16} className="shrink-0" /> 
                                <span className={`whitespace-nowrap transition-all duration-300 ${isScrolled ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>لیست</span>
                             </button>

                             {/* Scrolled Name/Score Display (Aligned Right) */}
                             <div className={`flex flex-col items-start transition-all duration-500 ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
                                 <span className="font-bold text-slate-700 text-sm truncate max-w-[140px]">{activeStudent.name}</span>
                                 <div className="flex gap-2 text-[10px]">
                                    {activeStudent.diamonds > 0 && <span className="text-blue-500 font-bold">💎 {activeStudent.diamonds}</span>}
                                    {activeStudent.stars > 0 && <span className="text-yellow-500 font-bold">⭐️ {activeStudent.stars}</span>}
                                    <span className="text-green-500 font-bold">+{activeStudent.pluses}</span>
                                 </div>
                             </div>
                         </div>

                         <div className="flex items-center gap-2 z-20 shrink-0">
                            <button onClick={goToPrevStudent} disabled={activeStudentIndex === 0} className={`p-2 rounded-xl border ${activeStudentIndex === 0 ? 'bg-slate-200 text-slate-300 border-transparent' : 'bg-white text-slate-600 border-slate-200 shadow-sm'}`}><ChevronRight size={20}/></button>
                            <span className={`text-xs font-bold transition-colors ${isScrolled ? 'text-slate-400' : 'text-slate-400'}`}>{activeStudentIndex + 1} / {students.length}</span>
                            <button onClick={goToNextStudent} disabled={activeStudentIndex === sortedStudents.length - 1} className={`p-2 rounded-xl border ${activeStudentIndex === sortedStudents.length - 1 ? 'bg-slate-200 text-slate-300 border-transparent' : 'bg-white text-slate-600 border-slate-200 shadow-sm'}`}><ChevronLeft size={20}/></button>
                         </div>
                      </div>
                      
                      <div className="px-4">
                        <div className="bg-slate-800 text-white p-4 rounded-2xl mb-6 shadow-lg relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                             
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-black border-2 shadow-lg ${activeRankStyle}`}>{activeStudentRank}</div>
                                <button onClick={() => setEditingStudent(activeStudent)} className="text-right group/edit focus:outline-none">
                                  <h3 className="text-xl font-bold flex items-center gap-2">
                                      {activeStudent.name}
                                      <div className="bg-white/10 p-1 rounded-full opacity-50 group-hover/edit:opacity-100 transition-all">
                                        <Edit size={12} />
                                      </div>
                                  </h3>
                                  <div className="flex gap-2 text-xs text-slate-300 mt-1">
                                     <span className="bg-slate-700 px-2 py-0.5 rounded flex items-center gap-1"><span className="text-sm">💎</span> {activeStudent.diamonds}</span>
                                     <span className="bg-slate-700 px-2 py-0.5 rounded flex items-center gap-1"><span className="text-sm">⭐️</span> {activeStudent.stars}</span>
                                  </div>
                                </button>
                              </div>
                              <div className="text-center mr-8">
                                 <div className="text-2xl font-bold text-orange-400 flex items-center justify-center gap-1">{activeStudent.streak} <Flame size={20} className="fill-current" /></div>
                                 <div className="text-[10px] text-slate-400">زنجیره</div>
                              </div>
                            </div>
                            
                            {/* Edit Note Button */}
                            {activeStudent.note && (
                                <button 
                                    onClick={() => setEditingStudent(activeStudent)}
                                    className="w-full mb-4 bg-slate-900/50 hover:bg-slate-900 p-2 rounded-lg text-xs text-slate-300 flex items-center gap-2 text-right transition-colors group/note"
                                >
                                    <StickyNote size={12} className="shrink-0" />
                                    <span className="flex-1 truncate">{activeStudent.note}</span>
                                    <Edit size={10} className="opacity-0 group-hover/note:opacity-50" />
                                </button>
                            )}

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

                        {/* Progress Report Card */}
                        {activeStudent && weekStats && monthStats && allStats && (
                          <div className="bg-white p-4 rounded-2xl mb-6 shadow-sm border border-slate-200/80 text-right">
                            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                              <Trophy size={16} className="text-yellow-500 shrink-0" />
                              <span>گزارش پیشرفت ({activeStudent.name})</span>
                            </h4>
                            
                            <div className="grid grid-cols-4 gap-2 text-center text-[11px] dir-rtl">
                              {/* Headers */}
                              <div className="text-right text-slate-400 font-medium py-1">دوره</div>
                              <div className="text-slate-400 font-medium py-1">روخوانی</div>
                              <div className="text-slate-400 font-medium py-1">حفظ</div>
                              <div className="text-slate-400 font-medium py-1 font-bold">امتیازات</div>
                              
                              {/* Week Row */}
                              <div className="text-right text-slate-600 font-bold py-2 border-t border-slate-100 flex items-center">این هفته</div>
                              <div className="text-slate-700 py-2 border-t border-slate-100 font-semibold">{weekStats.recitation} آیه</div>
                              <div className="text-slate-700 py-2 border-t border-slate-100 font-semibold">{weekStats.memorization} آیه</div>
                              <div className="py-2 border-t border-slate-100 flex justify-center gap-1 items-center flex-wrap">
                                {weekStats.diamonds > 0 && <span>💎{weekStats.diamonds}</span>}
                                {weekStats.stars > 0 && <span>⭐️{weekStats.stars}</span>}
                                {weekStats.pluses > 0 && <span className="text-green-500 font-bold">+{weekStats.pluses}</span>}
                                {weekStats.diamonds === 0 && weekStats.stars === 0 && weekStats.pluses === 0 && <span className="text-slate-300">-</span>}
                              </div>
                              
                              {/* Month Row */}
                              <div className="text-right text-slate-600 font-bold py-2 border-t border-slate-100 flex items-center">این ماه</div>
                              <div className="text-slate-700 py-2 border-t border-slate-100 font-semibold">{monthStats.recitation} آیه</div>
                              <div className="text-slate-700 py-2 border-t border-slate-100 font-semibold">{monthStats.memorization} آیه</div>
                              <div className="py-2 border-t border-slate-100 flex justify-center gap-1 items-center flex-wrap">
                                {monthStats.diamonds > 0 && <span>💎{monthStats.diamonds}</span>}
                                {monthStats.stars > 0 && <span>⭐️{monthStats.stars}</span>}
                                {monthStats.pluses > 0 && <span className="text-green-500 font-bold">+{monthStats.pluses}</span>}
                                {monthStats.diamonds === 0 && monthStats.stars === 0 && monthStats.pluses === 0 && <span className="text-slate-300">-</span>}
                              </div>
                              
                              {/* All Time Row */}
                              <div className="text-right text-slate-600 font-bold py-2 border-t border-slate-100 flex items-center">کل دوره</div>
                              <div className="text-slate-700 py-2 border-t border-slate-100 font-semibold">{allStats.recitation} آیه</div>
                              <div className="text-slate-700 py-2 border-t border-slate-100 font-semibold">{allStats.memorization} آیه</div>
                              <div className="py-2 border-t border-slate-100 flex justify-center gap-1 items-center flex-wrap">
                                {allStats.diamonds > 0 && <span>💎{allStats.diamonds}</span>}
                                {allStats.stars > 0 && <span>⭐️{allStats.stars}</span>}
                                {allStats.pluses > 0 && <span className="text-green-500 font-bold">+{allStats.pluses}</span>}
                                {allStats.diamonds === 0 && allStats.stars === 0 && allStats.pluses === 0 && <span className="text-slate-300">-</span>}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="bg-slate-200 p-1 rounded-xl flex mb-6 relative">
                            <button onClick={() => setMode('recitation')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all z-10 flex items-center justify-center gap-2 ${mode === 'recitation' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><BookOpen size={18} /> روخوانی</button>
                            <button onClick={() => setMode('memorization')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all z-10 flex items-center justify-center gap-2 ${mode === 'memorization' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Brain size={18} /> حفظ</button>
                        </div>
                        <div className="space-y-3">
                             {SURAHS.map((surah) => <TeacherSurahItem key={surah.id} surah={surah} student={activeStudent} mode={mode} onUpdateProgress={onUpdateProgress} showToast={showToast} />)}
                        </div>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* Persistent Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-between items-center z-50 max-w-md mx-auto shadow-[0_-5px_20px_rgba(0,0,0,0.05)] px-6 py-2">
        <button onClick={() => { setShowSettings(true); }} className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 p-2 active:scale-95 transition-transform">
          <Settings size={22} />
          <span className="text-[10px] font-bold">تنظیمات</span>
        </button>
        
        <button onClick={() => { setIsAdding(true); }} className="flex flex-col items-center justify-center -mt-8">
           <div className="bg-blue-600 text-white rounded-2xl w-14 h-14 flex items-center justify-center border-4 border-slate-100 shadow-xl shadow-blue-200 active:scale-90 transition-transform">
              <UserPlus size={28} />
           </div>
           <span className="text-[10px] font-bold text-slate-500 mt-1">افزودن</span>
        </button>

        <button onClick={() => { if(activeStudentId) { playSound(SFX_CLICK); onSelectStudent(null); } }} className={`flex flex-col items-center gap-1 p-2 active:scale-95 transition-transform ${!activeStudentId ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <Home size={22} />
          <span className="text-[10px] font-bold">خانه</span>
        </button>
      </div>

    </div>
  );
};