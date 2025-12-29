import { useState, useEffect } from 'react';
import { Student } from '../types';
import { INITIAL_STUDENTS, SFX_SUCCESS, SFX_NEGATIVE, SURAHS } from '../constants';
import { calculateNewPoints, isStreakIntact, playSound, triggerConfetti } from '../utils/helpers';

export const useStudentData = (settings: { hefzDays: number[] }) => {
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('quran-tracker-students');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
            // Ensure all loaded students have the correct structure
            return parsed.map((s: any) => ({
                ...s,
                id: Number(s.id),
                diamonds: s.diamonds ?? 0,
                stars: s.stars ?? 0,
                pluses: s.pluses ?? 0,
                streak: s.streak ?? 0,
                ayahProgress: s.ayahProgress ?? {},
                memorizationProgress: s.memorizationProgress ?? {},
                lastReview: s.lastReview ?? {},
                completedSurahs: s.completedSurahs ?? [],
                // Preserve review history if exists
                reviewHistory: s.reviewHistory ?? {},
                lastAction: s.lastAction ?? undefined
            }));
        }
      }
      return INITIAL_STUDENTS;
    } catch (e) {
      console.error("Failed to load students from storage, reverting to default:", e);
      return INITIAL_STUDENTS;
    }
  });

  const [activeStudentId, setActiveStudentId] = useState<number | null>(null);

  // Save to localStorage whenever students state changes
  useEffect(() => {
    if (students && students.length > 0) {
        try {
            localStorage.setItem('quran-tracker-students', JSON.stringify(students));
        } catch (e) {
            console.error("Failed to save students:", e);
        }
    }
  }, [students]);

  const handleUpdateProgress = (studentId: number, surahId: number, newCompleted: number[], mode: 'recitation' | 'memorization', isFullComplete: boolean = false) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      
      const updated = { ...s };
      if (mode === 'recitation') {
        updated.ayahProgress = { ...updated.ayahProgress, [surahId]: newCompleted };
      } else {
        updated.memorizationProgress = { ...updated.memorizationProgress, [surahId]: newCompleted };
      }

      // -- NEW LOGIC: Dynamic Plus for 100% completion --
      const surah = SURAHS.find(x => x.id === surahId);
      if (surah) {
          const totalAyahs = surah.ayahs;
          const oldList = mode === 'recitation' ? (s.ayahProgress[surahId] || []) : (s.memorizationProgress[surahId] || []);
          const wasComplete = oldList.length === totalAyahs;
          const isNowComplete = newCompleted.length === totalAyahs;

          if (!wasComplete && isNowComplete) {
              triggerConfetti();
              const newScore = calculateNewPoints(updated, 1);
              updated.pluses = newScore.pluses;
              updated.stars = newScore.stars;
              updated.diamonds = newScore.diamonds;
          } else if (wasComplete && !isNowComplete) {
              updated.pluses = Math.max(updated.pluses - 1, 0);
          }
      }

      if (mode === 'memorization' && newCompleted.length === (surah?.ayahs || 0) && surah) {
             const now = Date.now();
             updated.lastReview = { ...updated.lastReview, [surahId]: now };
             const history = updated.reviewHistory?.[surahId] || [];
             updated.reviewHistory = { ...updated.reviewHistory, [surahId]: [...history, now].slice(-10) };
             
             const lastActionTimestamp = s.lastAction?.timestamp || 0;
             let newStreak = s.streak;
             const intact = isStreakIntact(lastActionTimestamp, now, settings.hefzDays);
             
             if (intact) {
                 const lastDate = new Date(lastActionTimestamp).setHours(0,0,0,0);
                 const todayDate = new Date(now).setHours(0,0,0,0);
                 if (lastDate !== todayDate) newStreak += 1;
             } else {
                 newStreak = 1;
             }
             updated.streak = newStreak;
             updated.lastAction = { type: 'positive', timestamp: now };
      }
      return updated;
    }));
  };

  const handleManualPoint = (studentId: number, type: 'positive' | 'negative') => {
      setStudents(prev => prev.map(s => {
          if (s.id !== studentId) return s;
          const change = type === 'positive' ? 1 : -1;
          const newPoints = calculateNewPoints(s, change);
          if (type === 'positive') {
             playSound(SFX_SUCCESS);
             triggerConfetti();
          } else {
             playSound(SFX_NEGATIVE);
          }
          return { ...s, ...newPoints, lastAction: { type, timestamp: Date.now() } };
      }));
  };

  const handleAddStudent = (data: any) => {
      // Calculate a safe new ID
      const maxId = students.length > 0 ? Math.max(...students.map(s => s.id)) : 0;
      const newId = maxId + 1;
      
      const newStudent: Student = { 
          ...data, 
          id: newId, 
          completedSurahs: [], 
          ayahProgress: {}, 
          memorizationProgress: {}, 
          lastReview: {},
          reviewHistory: {}, 
          streak: 0,
          diamonds: Number(data.diamonds || 0),
          stars: Number(data.stars || 0),
          pluses: Number(data.pluses || 0)
      };
      
      setStudents(prev => [...prev, newStudent]);
  };

  const handleEditStudent = (id: number, data: any) => {
      setStudents(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const handleDeleteStudent = (id: number) => {
      setStudents(prev => prev.filter(s => s.id !== id));
      if (activeStudentId === id) setActiveStudentId(null);
  };

  const handleImportData = (data: Student[]) => {
      setStudents(data);
  };

  const handleResetData = () => {
      if (window.confirm("آیا مطمئن هستید؟ تمام داده‌ها به حالت اولیه برمی‌گردد.")) {
        setStudents(INITIAL_STUDENTS);
        setActiveStudentId(null);
      }
  };

  return {
    students,
    activeStudentId,
    setActiveStudentId,
    handleUpdateProgress,
    handleManualPoint,
    handleAddStudent,
    handleEditStudent,
    handleDeleteStudent,
    handleImportData,
    handleResetData
  };
};