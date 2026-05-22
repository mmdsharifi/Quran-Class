import React, { useState, useEffect, useRef } from 'react';
import { Plus, BookOpen, ChevronRight, ChevronLeft, Check, Flame, ArrowRight, ArrowLeft, ThumbsUp, ThumbsDown, StickyNote, Trophy, Book, Edit, UserPlus, X, Brain, Settings, Search, Home, RefreshCw } from 'lucide-react';
import { SURAHS, SFX_CLICK, SFX_SUCCESS, SFX_NEGATIVE } from '../constants';
import { Student, AppSettings, QuranClass } from '../types';
import { calculateMemoryHealth, playSound, getPraiseText, getWarningText } from '../utils/helpers';
import { TimeAgo } from '../components/common/TimeAgo';
import { SettingsSheet } from '../components/settings/SettingsSheet';
import { StudentFormSheet } from '../components/student/StudentFormSheet';
import { TeacherSurahItem } from '../components/surah/TeacherSurahItem';
import { ClassManagementSheet } from '../components/class/ClassManagementSheet';
import { ImportStudentSheet } from '../components/student/ImportStudentSheet';
import { StudentListItem } from '../components/student/StudentListItem';
import { translate } from '../translations';


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
  const language = settings.language || 'fa';
  const t = (key: Parameters<typeof translate>[0], params?: Record<string, string | number>) => translate(key, language, params);

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
  const className = activeClass?.name || t('unnamedClass');
  const classEmoji = activeClass?.emoji || '🕌';
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const detailContainerRef = useRef<HTMLDivElement>(null);

  const handleLocalManualPoint = (studentId: number, type: 'positive' | 'negative') => {
    onManualPoint(studentId, type);
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    if (type === 'positive') {
      playSound(SFX_SUCCESS);
      const idx = Math.floor(Math.random() * 8);
      const text = t(`praise_${idx}` as any);
      showToast(t('praiseLogged', { text, name: student.name }), 'success');
    } else {
      playSound(SFX_NEGATIVE);
      const idx = Math.floor(Math.random() * 5);
      const text = t(`warning_${idx}` as any);
      showToast(t('warningLogged', { text, name: student.name }), 'error');
    }
  };

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
    <div className="w-full h-full lg:h-screen flex flex-col lg:flex-row relative bg-slate-100 dark:bg-slate-950 min-h-screen lg:min-h-0 overflow-hidden">
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
          language={language}
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
            language={language}
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
            language={language}
            onClose={() => setShowImportSheet(false)}
            onImport={(selectedStudents, keepData) => {
              onImportStudentsFromClass(selectedStudents, keepData);
              setShowImportSheet(false);
            }}
            showToast={showToast}
          />
      )}

      {/* Sidebar (Desktop Only) */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 bg-slate-900 text-slate-100 shrink-0 h-screen border-e border-slate-800 p-6 justify-between select-none">
        <div className="flex flex-col gap-6">
          {/* Header/Branding */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <BookOpen size={22} />
            </div>
            <div>
              <h1 className="text-base font-black bg-gradient-to-r rtl:bg-gradient-to-l from-blue-400 to-indigo-300 bg-clip-text text-transparent">{t('appName')}</h1>
              <p className="text-[9px] font-bold text-slate-500 tracking-wider">{t('appSubtitle')}</p>
            </div>
          </div>

          {/* Active Class Selector / Switcher */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span>{t('activeClasses')}</span>
              <button 
                onClick={() => setShowClassManagement(true)} 
                className="text-[10px] text-blue-400 hover:text-blue-300 font-bold bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded transition-colors"
              >
                {t('manage')}
              </button>
            </div>
            
            <div className="space-y-1 max-h-[220px] overflow-y-auto pe-1 custom-scrollbar">
              {classes.filter(c => !c.archived).map(c => {
                const isActive = c.id === activeClassId;
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelectClass(c.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-start transition-all text-xs font-bold ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    <span className="text-base">{c.emoji || '🕌'}</span>
                    <span className="truncate flex-1">{c.name}</span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 mt-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('quickActions')}</div>
            <button
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-center transition-all bg-gradient-to-r rtl:bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-900/10 text-xs font-bold active:scale-95 cursor-pointer"
            >
              <UserPlus size={16} />
              <span>{t('addNewStudent')}</span>
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-center transition-all bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 text-xs font-bold active:scale-95 cursor-pointer"
            >
              <Settings size={16} />
              <span>{t('settingsAndSchedule')}</span>
            </button>
          </div>
        </div>

        {/* Footer stats */}
        <div className="bg-slate-800 border border-slate-700/30 rounded-2xl p-4 text-[11px] font-bold text-slate-400 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span>{t('classStudentsCount')}</span>
            <span className="text-slate-200">{students.length} {t('persons')}</span>
          </div>
          {activeClass?.startDate && (
            <div className="flex justify-between items-center border-t border-slate-700/30 pt-2">
              <span>{t('courseDuration')}</span>
              <span className="text-slate-200 truncate max-w-[120px]">{activeClass.startDate} {activeClass.endDate ? ` ${t('to')} ${activeClass.endDate}` : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden lg:max-w-none lg:mx-0 max-w-md mx-auto">
          {/* Main Content Area with Transitions */}
          <div className="flex-1 relative w-full h-full overflow-hidden lg:flex lg:flex-row lg:h-full">
              {/* List View */}
              <div className={`absolute inset-0 bg-slate-100 dark:bg-slate-950 overflow-y-auto pb-24 transition-transform duration-300 ease-in-out ${activeStudentId ? '-translate-x-1/4 opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'} lg:relative lg:inset-auto lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto lg:w-[380px] xl:w-[420px] lg:h-full lg:overflow-y-auto lg:pb-6 lg:border-e lg:border-slate-200 lg:dark:border-slate-800`}>
                  <div className="p-4">
                      <div className="flex items-center justify-between mb-6 relative">
                        <button 
                           onClick={() => setShowClassManagement(true)}
                           className="flex flex-col items-start text-start p-2 -m-2 rounded-2xl hover:bg-slate-200/50 dark:hover:bg-slate-900/50 active:scale-95 transition-all group focus:outline-none"
                        >
                           <h2 className="text-xl font-black text-slate-700 dark:text-slate-100 flex items-center gap-1.5">
                             <span>{classEmoji}</span>
                             <span className="truncate max-w-[180px]">{className}</span>
                             <ChevronRight size={16} className="text-slate-400 dark:text-slate-500 rotate-90 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                           </h2>
                           <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1.5">
                             <span>{t('studentsLabel')} {students.length} {t('persons')}</span>
                             {activeClass?.startDate && (
                               <>
                                 <span>•</span>
                                 <span>{t('courseLabel')} {activeClass.startDate} {activeClass.endDate ? ` ${t('to')} ${activeClass.endDate}` : ''}</span>
                               </>
                             )}
                           </div>
                        </button>
                        <button 
                            onClick={() => setIsEditMode(!isEditMode)} 
                            className={`p-3 rounded-xl transition-all ${isEditMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-550 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                         >
                            {isEditMode ? <Check size={20} /> : <Edit size={20} />}
                         </button>
                      </div>

                      <div className="relative mb-6">
                           {searchQuery ? (
                             <button 
                               onClick={() => setSearchQuery('')}
                               className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 p-1"
                             >
                               <X size={18} />
                             </button>
                           ) : (
                             <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                           )}
                           <input 
                             ref={searchInputRef}
                             type="text" 
                             value={searchQuery}
                             onChange={(e) => setSearchQuery(e.target.value)}
                             placeholder={t('searchPlaceholder')} 
                             className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 ps-10 pe-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500 transition-all shadow-sm"
                           />
                      </div>

                      {/* Time Filter Tabs */}
                      <div className="bg-slate-200/60 dark:bg-slate-900/60 backdrop-blur-sm p-1 rounded-2xl flex gap-1 mb-6 text-xs font-bold text-slate-500 dark:text-slate-400 relative">
                        <button
                          onClick={() => { playSound(SFX_CLICK); setTimeFilter('all'); }}
                          className={`flex-1 py-2.5 rounded-xl transition-all ${timeFilter === 'all' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm font-black' : 'hover:text-slate-700 dark:hover:text-slate-200 active:scale-95'}`}
                        >
                          {t('allTime')}
                        </button>
                        <button
                          onClick={() => { playSound(SFX_CLICK); setTimeFilter('month'); }}
                          className={`flex-1 py-2.5 rounded-xl transition-all ${timeFilter === 'month' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm font-black' : 'hover:text-slate-700 dark:hover:text-slate-200 active:scale-95'}`}
                        >
                          {t('thisMonth')}
                        </button>
                        <button
                          onClick={() => { playSound(SFX_CLICK); setTimeFilter('week'); }}
                          className={`flex-1 py-2.5 rounded-xl transition-all ${timeFilter === 'week' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm font-black' : 'hover:text-slate-700 dark:hover:text-slate-200 active:scale-95'}`}
                        >
                          {t('thisWeek')}
                        </button>
                      </div>

                      <div className="grid gap-3">
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 flex items-center gap-2 justify-between">
                           <span className="flex items-center gap-2"><Trophy size={14} className="text-yellow-500"/> {isEditMode ? t('editStudents') : t('classLeaderboard')}</span>
                        </p>
                        {filteredStudents.length === 0 ? (
                           <div className="text-center py-10 text-slate-400">
                              <p>{t('noStudentFound')}</p>
                           </div>
                        ) : filteredStudents.map((student) => {
                            const globalIndex = sortedStudents.findIndex(s => s.id === student.id);
                            const stats = studentStatsMap.get(student.id) || { recitation: 0, memorization: 0, diamonds: 0, stars: 0, pluses: 0 };
                            return (
                              <StudentListItem
                                key={student.id}
                                student={student}
                                globalIndex={globalIndex}
                                stats={stats}
                                isEditMode={isEditMode}
                                timeFilter={timeFilter}
                                activeStudentId={activeStudentId}
                                onSelect={onSelectStudent}
                                onEdit={setEditingStudent}
                                onManualPoint={handleLocalManualPoint}
                                language={settings.language || 'fa'}
                              />
                            );
                        })}
                      </div>
                  </div>
              </div>

              {/* Detail View */}
              <div 
                 ref={detailContainerRef}
                 className={`absolute inset-0 bg-slate-100 dark:bg-slate-950 overflow-y-auto pb-24 transition-transform duration-300 ease-in-out ${activeStudentId ? 'translate-x-0' : 'translate-x-full'} lg:relative lg:inset-auto lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto lg:flex-1 lg:h-full lg:pb-0`}
              >
                  {activeStudent ? (
                      <div className="pb-4">
                          {/* Sticky Header */}
                          <div className={`flex items-center justify-between sticky top-0 z-30 py-3 px-4 transition-all duration-300 ${isScrolled ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800' : 'bg-slate-100 dark:bg-slate-950'}`}>
                             <div className="flex items-center gap-3 overflow-hidden">
                                 <button 
                                    onClick={() => { playSound(SFX_CLICK); onSelectStudent(null); }} 
                                    className={`flex items-center gap-1 font-bold text-sm bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 hover:text-slate-700 dark:hover:text-slate-250 transition-all z-20 overflow-hidden lg:hidden ${isScrolled ? 'text-slate-700 dark:text-slate-200 p-2 rounded-full w-9 justify-center' : 'text-slate-500 dark:text-slate-400 px-3 py-2 rounded-xl w-24'}`}
                                 >
                                    {language === 'fa' ? <ArrowRight size={16} className="shrink-0" /> : <ArrowLeft size={16} className="shrink-0" />} 
                                    <span className={`whitespace-nowrap transition-all duration-300 ${isScrolled ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>{t('list')}</span>
                                 </button>

                                 {/* Scrolled Name/Score Display (Aligned Start) */}
                                 <div className={`flex flex-col items-start transition-all duration-500 ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
                                     <span className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate max-w-[140px]">{activeStudent.name}</span>
                                     <div className="flex gap-2 text-[10px]">
                                        {activeStudent.diamonds > 0 && <span className="text-blue-500 font-bold">💎 {activeStudent.diamonds}</span>}
                                        {activeStudent.stars > 0 && <span className="text-yellow-500 font-bold">⭐️ {activeStudent.stars}</span>}
                                        <span className="text-green-500 font-bold">+{activeStudent.pluses}</span>
                                     </div>
                                 </div>
                             </div>

                             <div className="flex items-center gap-2 z-20 shrink-0">
                                <button onClick={goToPrevStudent} disabled={activeStudentIndex === 0} className={`p-2 rounded-xl border ${activeStudentIndex === 0 ? 'bg-slate-200 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-transparent' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-855'}`}>{language === 'fa' ? <ChevronRight size={20}/> : <ChevronLeft size={20}/>}</button>
                                <span className={`text-xs font-bold transition-colors text-slate-400 dark:text-slate-500`}>{activeStudentIndex + 1} / {students.length}</span>
                                <button onClick={goToNextStudent} disabled={activeStudentIndex === sortedStudents.length - 1} className={`p-2 rounded-xl border ${activeStudentIndex === sortedStudents.length - 1 ? 'bg-slate-200 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-transparent' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-855'}`}>{language === 'fa' ? <ChevronLeft size={20}/> : <ChevronRight size={20}/>}</button>
                             </div>
                          </div>
                          
                          <div className="px-4">
                            <div className="bg-slate-800 text-white p-4 rounded-2xl mb-6 shadow-lg relative overflow-hidden group">
                                 <div className="absolute top-0 end-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 rtl:translate-x-1/2 ltr:-translate-x-1/2 pointer-events-none"></div>
                                 
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-black border-2 shadow-lg ${activeRankStyle}`}>{activeStudentRank}</div>
                                    <button onClick={() => setEditingStudent(activeStudent)} className="text-start group/edit focus:outline-none">
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
                                  <div className="text-center ms-8">
                                     <div className="text-2xl font-bold text-orange-400 flex items-center justify-center gap-1">{activeStudent.streak} <Flame size={20} className="fill-current" /></div>
                                     <div className="text-[10px] text-slate-400">{t('streak')}</div>
                                  </div>
                                </div>
                                
                                {/* Edit Note Button */}
                                {activeStudent.note && (
                                    <button 
                                        onClick={() => setEditingStudent(activeStudent)}
                                        className="w-full mb-4 bg-slate-900/50 hover:bg-slate-900 p-2 rounded-lg text-xs text-slate-300 flex items-center gap-2 text-start transition-colors group/note"
                                    >
                                        <StickyNote size={12} className="shrink-0" />
                                        <span className="flex-1 truncate">{activeStudent.note}</span>
                                        <Edit size={10} className="opacity-0 group-hover/note:opacity-50" />
                                    </button>
                                )}

                                <div className="mb-4">
                                    <div className="flex justify-between text-xs text-slate-400 mb-1"><span>{t('positiveScore')}</span><span>{activeStudent.pluses}/5</span></div>
                                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden"><div className="bg-green-400 h-full transition-all duration-300 ease-out" style={{ width: `${(activeStudent.pluses / 5) * 100}%` }}/></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <button onClick={() => handleLocalManualPoint(activeStudent.id, 'positive')} className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl font-bold text-sm shadow-md border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"><ThumbsUp size={16} /> {t('praise')}</button>
                                    <button onClick={() => handleLocalManualPoint(activeStudent.id, 'negative')} className="bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl font-bold text-sm shadow-md border-b-4 border-red-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"><ThumbsDown size={16} /> {t('warn')}</button>
                                </div>
                                {activeStudent.lastAction && (<div className="bg-slate-900/50 rounded-lg p-2 mt-3 flex justify-center"><TimeAgo timestamp={activeStudent.lastAction.timestamp} type={activeStudent.lastAction.type} language={language} /></div>)}
                            </div>

                            {/* Progress Report Card */}
                            {activeStudent && weekStats && monthStats && allStats && (
                              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl mb-6 shadow-sm border border-slate-200/80 dark:border-slate-800 text-start">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                                  <Trophy size={16} className="text-yellow-500 shrink-0" />
                                  <span>{t('progressReport')} ({activeStudent.name})</span>
                                </h4>
                                
                                <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                                  {/* Headers */}
                                  <div className="text-start text-slate-400 dark:text-slate-500 font-medium py-1">{t('period')}</div>
                                  <div className="text-slate-400 dark:text-slate-500 font-medium py-1">{t('recitation')}</div>
                                  <div className="text-slate-400 dark:text-slate-500 font-medium py-1">{t('memorization')}</div>
                                  <div className="text-slate-400 dark:text-slate-500 font-medium py-1 font-bold">{t('points')}</div>
                                  
                                  {/* Week Row */}
                                  <div className="text-start text-slate-600 dark:text-slate-350 font-bold py-2 border-t border-slate-100 dark:border-slate-800/85 flex items-center">{t('thisWeek')}</div>
                                  <div className="text-slate-700 dark:text-slate-300 py-2 border-t border-slate-100 dark:border-slate-800/85 font-semibold">{weekStats.recitation} {weekStats.recitation === 1 ? t('ayah') : t('ayahs')}</div>
                                  <div className="text-slate-700 dark:text-slate-300 py-2 border-t border-slate-100 dark:border-slate-800/85 font-semibold">{weekStats.memorization} {weekStats.memorization === 1 ? t('ayah') : t('ayahs')}</div>
                                  <div className="py-2 border-t border-slate-100 dark:border-slate-800/85 flex justify-center gap-1 items-center flex-wrap">
                                    {weekStats.diamonds > 0 && <span>💎{weekStats.diamonds}</span>}
                                    {weekStats.stars > 0 && <span>⭐️{weekStats.stars}</span>}
                                    {weekStats.pluses > 0 && <span className="text-green-500 font-bold">+{weekStats.pluses}</span>}
                                    {weekStats.diamonds === 0 && weekStats.stars === 0 && weekStats.pluses === 0 && <span className="text-slate-300 dark:text-slate-700">-</span>}
                                  </div>
                                  
                                  {/* Month Row */}
                                  <div className="text-start text-slate-600 dark:text-slate-350 font-bold py-2 border-t border-slate-100 dark:border-slate-800/85 flex items-center">{t('thisMonth')}</div>
                                  <div className="text-slate-700 dark:text-slate-300 py-2 border-t border-slate-100 dark:border-slate-800/85 font-semibold">{monthStats.recitation} {monthStats.recitation === 1 ? t('ayah') : t('ayahs')}</div>
                                  <div className="text-slate-700 dark:text-slate-300 py-2 border-t border-slate-100 dark:border-slate-800/85 font-semibold">{monthStats.memorization} {monthStats.memorization === 1 ? t('ayah') : t('ayahs')}</div>
                                  <div className="py-2 border-t border-slate-100 dark:border-slate-800/85 flex justify-center gap-1 items-center flex-wrap">
                                    {monthStats.diamonds > 0 && <span>💎{monthStats.diamonds}</span>}
                                    {monthStats.stars > 0 && <span>⭐️{monthStats.stars}</span>}
                                    {monthStats.pluses > 0 && <span className="text-green-500 font-bold">+{monthStats.pluses}</span>}
                                    {monthStats.diamonds === 0 && monthStats.stars === 0 && monthStats.pluses === 0 && <span className="text-slate-300 dark:text-slate-700">-</span>}
                                  </div>
                                  
                                  {/* All Time Row */}
                                  <div className="text-start text-slate-600 dark:text-slate-350 font-bold py-2 border-t border-slate-100 dark:border-slate-800/85 flex items-center">{t('allTime')}</div>
                                  <div className="text-slate-700 dark:text-slate-300 py-2 border-t border-slate-100 dark:border-slate-800/85 font-semibold">{allStats.recitation} {allStats.recitation === 1 ? t('ayah') : t('ayahs')}</div>
                                  <div className="text-slate-700 dark:text-slate-300 py-2 border-t border-slate-100 dark:border-slate-800/85 font-semibold">{allStats.memorization} {allStats.memorization === 1 ? t('ayah') : t('ayahs')}</div>
                                  <div className="py-2 border-t border-slate-100 dark:border-slate-800/85 flex justify-center gap-1 items-center flex-wrap">
                                    {allStats.diamonds > 0 && <span>💎{allStats.diamonds}</span>}
                                    {allStats.stars > 0 && <span>⭐️{allStats.stars}</span>}
                                    {allStats.pluses > 0 && <span className="text-green-500 font-bold">+{allStats.pluses}</span>}
                                    {allStats.diamonds === 0 && allStats.stars === 0 && allStats.pluses === 0 && <span className="text-slate-300 dark:text-slate-700">-</span>}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="sticky top-[60px] z-20 bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur-md py-2 -mx-4 px-4 mb-4 border-b border-slate-200/40 dark:border-slate-800/40">
                                <div className="bg-slate-200 dark:bg-slate-900 p-1 rounded-xl flex">
                                    <button onClick={() => setMode('recitation')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all z-10 flex items-center justify-center gap-2 ${mode === 'recitation' ? 'bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}><BookOpen size={18} /> {t('recitation')}</button>
                                    <button onClick={() => setMode('memorization')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all z-10 flex items-center justify-center gap-2 ${mode === 'memorization' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}><Brain size={18} /> {t('memorization')}</button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                  {SURAHS.map((surah) => <TeacherSurahItem key={surah.id} surah={surah} student={activeStudent} mode={mode} onUpdateProgress={onUpdateProgress} showToast={showToast} language={language} />)}
                            </div>
                          </div>
                      </div>
                  ) : (
                      /* Desktop details placeholder */
                      <div className="hidden lg:flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 p-8 text-center bg-slate-50 dark:bg-slate-950">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-950/20 text-blue-500/80 dark:text-blue-400 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-blue-100 dark:border-blue-900/50">
                          <BookOpen size={40} className="animate-bounce-slow text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">{t('studentProgressDetails')}</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
                          {t('selectStudentPrompt')}
                        </p>
                      </div>
                  )}
              </div>
          </div>

          {/* Persistent Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center z-50 max-w-md mx-auto shadow-[0_-5px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-5px_20px_rgba(0,0,0,0.25)] px-6 py-2 lg:hidden">
            <button onClick={() => { setShowSettings(true); }} className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-2 active:scale-95 transition-transform">
              <Settings size={22} />
              <span className="text-[10px] font-bold">{t('settings')}</span>
            </button>
            
            <button onClick={() => { setIsAdding(true); }} className="flex flex-col items-center justify-center -mt-8">
               <div className="bg-blue-600 text-white rounded-2xl w-14 h-14 flex items-center justify-center border-4 border-slate-100 dark:border-slate-950 shadow-xl shadow-blue-200/50 dark:shadow-none active:scale-90 transition-transform">
                  <UserPlus size={28} />
               </div>
               <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">{t('add')}</span>
            </button>

            <button onClick={() => { if(activeStudentId) { playSound(SFX_CLICK); onSelectStudent(null); } }} className={`flex flex-col items-center gap-1 p-2 active:scale-95 transition-transform ${!activeStudentId ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
              <Home size={22} />
              <span className="text-[10px] font-bold">{t('home')}</span>
            </button>
          </div>
      </div>
    </div>
  );
};