import { useState, useEffect } from 'react';
import { QuranClass, Student, AppSettings } from '../types';
import { INITIAL_STUDENTS } from '../constants';
import {
  buildNewClass,
  addClass,
  updateClassInList,
  deleteClassFromList,
  migrateLegacyData,
  updateProgressForStudent,
  applyManualPointForStudent,
  buildNewStudent,
  editStudentById,
  deleteStudentById,
  loadJsonFromStorage,
  DEFAULT_SETTINGS,
  importStudentsToClass,
  clearBrokenStreaks,
} from '../appLogic.js';

export const useClassData = () => {
  const [classes, setClasses] = useState<QuranClass[]>(() => {
    const savedClasses = loadJsonFromStorage(localStorage, 'quran-tracker-classes', null);
    if (savedClasses && Array.isArray(savedClasses) && savedClasses.length > 0) {
      return savedClasses;
    }

    // Try migrating legacy data
    const migrated = migrateLegacyData(localStorage);
    if (migrated && migrated.length > 0) {
      return migrated;
    }

    // Seed default class
    const seedClass = buildNewClass({
      name: 'کلاس ترم پاییز ۴۰۴ 🍁',
      emoji: '🍁',
      settings: DEFAULT_SETTINGS,
      students: INITIAL_STUDENTS,
      id: 'default-class',
    });
    return [seedClass];
  });

  const [activeClassId, setActiveClassId] = useState<string>(() => {
    const savedActiveId = localStorage.getItem('quran-tracker-active-class-id');
    if (savedActiveId && classes.some((c) => c.id === savedActiveId && !c.archived)) {
      return savedActiveId;
    }
    const firstActive = classes.find((c) => !c.archived);
    return firstActive?.id || classes[0]?.id || 'default-class';
  });

  const [activeStudentId, setActiveStudentId] = useState<number | null>(null);

  // Sync classes to localStorage
  useEffect(() => {
    if (classes && classes.length > 0) {
      localStorage.setItem('quran-tracker-classes', JSON.stringify(classes));
    }
  }, [classes]);

  // Sync active class id to localStorage
  useEffect(() => {
    localStorage.setItem('quran-tracker-active-class-id', activeClassId);
    // Reset active student when class switches
    setActiveStudentId(null);
  }, [activeClassId]);

  // Clear broken streaks on mount
  useEffect(() => {
    const now = Date.now();
    setClasses((prev) =>
      prev.map((c) => {
        const updatedStudents = clearBrokenStreaks({
          students: c.students,
          now,
          requiredDays: c.settings.rokhvaniDays,
        });
        return { ...c, students: updatedStudents };
      })
    );
  }, []);

  const activeClass = classes.find((c) => c.id === activeClassId && !c.archived) || classes.find((c) => !c.archived) || classes[0];
  const students = activeClass ? activeClass.students : [];
  const settings = activeClass ? activeClass.settings : DEFAULT_SETTINGS;

  const handleSelectClass = (classId: string) => {
    setActiveClassId(classId);
  };

  const handleCreateClass = (
    name: string,
    emoji: string,
    startDate?: string,
    endDate?: string,
    firstStudentName?: string
  ) => {
    let initialStudents: Student[] = [];
    if (firstStudentName && firstStudentName.trim() !== '') {
      initialStudents = [buildNewStudent({ name: firstStudentName.trim(), note: '' }, 1) as any];
    }

    const newClass = buildNewClass({
      name,
      emoji,
      startDate,
      endDate,
      settings: DEFAULT_SETTINGS,
      students: initialStudents,
    });

    setClasses((prev) => addClass(prev, newClass));
    setActiveClassId(newClass.id);
  };

  const handleEditClass = (classId: string, updatedFields: Partial<QuranClass>) => {
    setClasses((prev) => updateClassInList(prev, classId, updatedFields));
  };

  const handleDeleteClass = (classId: string) => {
    setClasses((prev) => {
      if (prev.length <= 1) {
        return prev; // Cannot delete the last class
      }
      const nextClasses = deleteClassFromList(prev, classId);
      if (activeClassId === classId) {
        const remainingActive = nextClasses.find((c) => !c.archived);
        if (remainingActive) {
          setActiveClassId(remainingActive.id);
        } else if (nextClasses.length > 0) {
          setActiveClassId(nextClasses[0].id);
        }
      }
      return nextClasses;
    });
  };

  const handleArchiveClass = (classId: string, archive: boolean) => {
    setClasses((prev) => {
      const nextClasses = updateClassInList(prev, classId, { archived: archive });
      if (archive && activeClassId === classId) {
        const nextActive = nextClasses.find((c) => !c.archived);
        if (nextActive) {
          setActiveClassId(nextActive.id);
        }
      }
      return nextClasses;
    });
  };

  const handleUpdateProgress = (
    studentId: number,
    surahId: number,
    newCompleted: number[],
    mode: 'recitation' | 'memorization',
    isFullComplete: boolean = false
  ) => {
    setClasses((prev) => {
      const activeC = prev.find((c) => c.id === activeClassId) || prev[0];
      if (!activeC) return prev;
      const currentStudents = activeC.students || [];
      const currentSettings = activeC.settings || DEFAULT_SETTINGS;
      const updatedStudents = updateProgressForStudent({
        students: currentStudents,
        studentId,
        surahId,
        completedAyahs: newCompleted,
        mode,
        isFullComplete,
        requiredDays: currentSettings.rokhvaniDays,
      }) as Student[];
      return updateClassInList(prev, activeClassId, { students: updatedStudents });
    });
  };

  const handleManualPoint = (studentId: number, type: 'positive' | 'negative') => {
    setClasses((prev) => {
      const activeC = prev.find((c) => c.id === activeClassId) || prev[0];
      if (!activeC) return prev;
      const currentStudents = activeC.students || [];
      const updatedStudents = applyManualPointForStudent({
        students: currentStudents,
        studentId,
        type,
      }) as Student[];
      return updateClassInList(prev, activeClassId, { students: updatedStudents });
    });
  };

  const handleAddStudent = (data: any) => {
    setClasses((prev) => {
      const activeC = prev.find((c) => c.id === activeClassId) || prev[0];
      if (!activeC) return prev;
      const currentStudents = activeC.students || [];
      const maxId = currentStudents.length > 0 ? Math.max(...currentStudents.map((s) => s.id)) : 0;
      const newId = maxId + 1;
      const newStudent = buildNewStudent(data, newId) as Student;
      return updateClassInList(prev, activeClassId, { students: [...currentStudents, newStudent] });
    });
  };

  const handleEditStudent = (id: number, data: any) => {
    setClasses((prev) => {
      const activeC = prev.find((c) => c.id === activeClassId) || prev[0];
      if (!activeC) return prev;
      const currentStudents = activeC.students || [];
      const updatedStudents = editStudentById({ students: currentStudents, id, data }) as Student[];
      return updateClassInList(prev, activeClassId, { students: updatedStudents });
    });
  };

  const handleDeleteStudent = (id: number) => {
    setClasses((prev) => {
      const activeC = prev.find((c) => c.id === activeClassId) || prev[0];
      if (!activeC) return prev;
      const currentStudents = activeC.students || [];
      const updatedStudents = deleteStudentById({ students: currentStudents, id }) as Student[];
      return updateClassInList(prev, activeClassId, { students: updatedStudents });
    });
    if (activeStudentId === id) setActiveStudentId(null);
  };

  const handleImportStudentsFromClass = (
    selectedStudents: Student[],
    keepData: boolean
  ) => {
    setClasses((prev) => {
      const activeC = prev.find((c) => c.id === activeClassId) || prev[0];
      if (!activeC) return prev;
      const currentStudents = activeC.students || [];
      const maxId = currentStudents.length > 0 ? Math.max(...currentStudents.map((s) => s.id)) : 0;
      const updatedStudents = importStudentsToClass({
        destinationStudents: currentStudents,
        sourceStudentsToImport: selectedStudents,
        keepData,
        startId: maxId,
      }) as Student[];
      return updateClassInList(prev, activeClassId, { students: updatedStudents });
    });
  };

  const handleImportData = (data: Student[]) => {
    setClasses((prev) =>
      updateClassInList(prev, activeClassId, { students: data })
    );
  };

  const handleResetData = () => {
    setClasses((prev) =>
      updateClassInList(prev, activeClassId, { students: INITIAL_STUDENTS })
    );
    setActiveStudentId(null);
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setClasses((prev) =>
      updateClassInList(prev, activeClassId, { settings: newSettings })
    );
  };

  return {
    classes,
    activeClassId,
    activeClass,
    students,
    settings,
    activeStudentId,
    setActiveStudentId,
    handleSelectClass,
    handleCreateClass,
    handleEditClass,
    handleDeleteClass,
    handleUpdateProgress,
    handleManualPoint,
    handleAddStudent,
    handleEditStudent,
    handleDeleteStudent,
    handleImportData,
    handleResetData,
    handleUpdateSettings,
    handleArchiveClass,
    handleImportStudentsFromClass,
  };
};
