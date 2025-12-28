import { useState, useEffect } from 'react';
import { Student } from '../types';
import { INITIAL_STUDENTS, SFX_SUCCESS, SFX_NEGATIVE } from '../constants';
import { calculateNewPoints, isStreakIntact, playSound } from '../utils/helpers';

export const useStudentData = (settings: { hefzDays: number[] }) => {
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('quran-tracker-students');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.map((s: any) => ({
            ...s,
            diamonds: s.diamonds ?? 0,
            stars: s.stars ?? 0,
            pluses: s.pluses ?? 0,
            streak: s.streak ?? 0,
            ayahProgress: s.ayahProgress ?? {},
            memorizationProgress: s.memorizationProgress ?? {},
            lastReview: s.lastReview ?? {},
            completedSurahs: s.completedSurahs ?? [],
        })) : INITIAL_STUDENTS;
      }
      return INITIAL_STUDENTS;
    } catch (e) {
      console.error("Failed to parse students", e);
      return INITIAL_STUDENTS;
    }
  });

  const [activeStudentId, setActiveStudentId] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('quran-tracker-students', JSON.stringify(students));
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

      if (isFullComplete) {
         const { pluses, stars, diamonds } = calculateNewPoints(updated, 5);
         updated.pluses = pluses;
         updated.stars = stars;
         updated.diamonds = diamonds;

         if (mode === 'memorization') {
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
                 if (lastDate !== todayDate) {
                     newStreak += 1;
                 }
             } else {
                 newStreak = 1;
             }
             updated.streak = newStreak;
             updated.lastAction = { type: 'positive', timestamp: now };
         }
      }
      return updated;
    }));
  };

  const handleManualPoint = (studentId: number, type: 'positive' | 'negative') => {
      setStudents(prev => prev.map(s => {
          if (s.id !== studentId) return s;
          const change = type === 'positive' ? 1 : -1;
          const newPoints = calculateNewPoints(s, change);
          
          if (type === 'positive') playSound(SFX_SUCCESS);
          else playSound(SFX_NEGATIVE);

          return { ...s, ...newPoints, lastAction: { type, timestamp: Date.now() } };
      }));
  };

  const handleAddStudent = (data: any) => {
      const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
      setStudents(prev => [...prev, { ...data, id: newId, completedSurahs: [], ayahProgress: {}, memorizationProgress: {}, lastReview: {}, streak: 0 }]);
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
      setStudents(INITIAL_STUDENTS);
      setActiveStudentId(null);
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