import {
  applyNegativePoint,
  applyPositivePoint,
  isStreakIntact,
  updateStreakAfterPositive,
} from "./trackerLogic.js";

export const DEFAULT_SETTINGS = Object.freeze({
  rokhvaniDays: [6, 1, 3],
  hefzDays: [0, 2, 4, 5],
  theme: 'system',
  language: 'fa',
});

export const loadJsonFromStorage = (storage, key, fallback) => {
  try {
    const saved = storage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (_error) {
    return fallback;
  }
};

export const sortStudentsByScore = (students) =>
  [...students].sort((a, b) => {
    if (b.diamonds !== a.diamonds) return b.diamonds - a.diamonds;
    if (b.stars !== a.stars) return b.stars - a.stars;
    return b.pluses - a.pluses;
  });

export const filterStudentsByQuery = (students, query) => {
  const normalized = query.toLowerCase();
  return students.filter(
    (student) =>
      student.name.toLowerCase().includes(normalized) ||
      student.name.includes(query),
  );
};

export const clearBrokenStreaks = ({ students, now, requiredDays }) => {
  let changed = false;
  const updated = students.map((student) => {
    if (student.lastAction?.timestamp) {
      const intact = isStreakIntact(
        student.lastAction.timestamp,
        now,
        requiredDays,
      );
      if (!intact && student.streak > 0) {
        changed = true;
        return { ...student, streak: 0 };
      }
    }
    return student;
  });

  return changed ? updated : students;
};

export const updateProgressForStudent = ({
  students,
  studentId,
  surahId,
  completedAyahs,
  mode,
  isFullComplete = false,
  now = Date.now(),
  requiredDays = [],
}) =>
  students.map((student) => {
    if (student.id !== studentId) return student;

    const prevDiamonds = student.diamonds || 0;
    const prevStars = student.stars || 0;
    const prevPluses = student.pluses || 0;

    const prevAyahs = (mode === "recitation" ? student.ayahProgress[surahId] : student.memorizationProgress[surahId]) || [];
    const added = completedAyahs.filter((x) => !prevAyahs.includes(x));
    const removed = prevAyahs.filter((x) => !completedAyahs.includes(x));

    const nextStudent = { ...student };
    if (mode === "recitation") {
      nextStudent.ayahProgress = {
        ...nextStudent.ayahProgress,
        [surahId]: completedAyahs,
      };
    } else {
      nextStudent.memorizationProgress = {
        ...nextStudent.memorizationProgress,
        [surahId]: completedAyahs,
      };
    }

    if (isFullComplete) {
      if (mode === "memorization") {
        nextStudent.lastReview = { ...nextStudent.lastReview, [surahId]: now };
        const history = nextStudent.reviewHistory || {};
        const surahHistory = history[surahId] || [];
        nextStudent.reviewHistory = {
          ...history,
          [surahId]: [now, ...surahHistory].slice(0, 5),
        };
        nextStudent.diamonds += 1;
      } else {
        const score = applyPositivePoint(nextStudent);
        nextStudent.pluses = score.pluses;
        nextStudent.stars = score.stars;
        nextStudent.diamonds = score.diamonds;
      }

      nextStudent.streak = updateStreakAfterPositive({
        currentStreak: nextStudent.streak,
        lastActionTimestamp: nextStudent.lastAction?.timestamp,
        now,
        requiredDays,
      });
      nextStudent.lastAction = { type: "positive", timestamp: now };
    }

    const delta = {
      diamonds: (nextStudent.diamonds || 0) - prevDiamonds,
      stars: (nextStudent.stars || 0) - prevStars,
      pluses: (nextStudent.pluses || 0) - prevPluses,
    };

    if (added.length > 0 || removed.length > 0 || delta.diamonds !== 0 || delta.stars !== 0 || delta.pluses !== 0) {
      nextStudent.progressLog = [
        ...(nextStudent.progressLog || []),
        {
          timestamp: now,
          type: mode,
          surahId,
          added,
          removed,
          delta,
        },
      ];
    }

    return nextStudent;
  });

export const applyManualPointForStudent = ({
  students,
  studentId,
  type,
  now = Date.now(),
}) =>
  students.map((student) => {
    if (student.id !== studentId) return student;

    const prevDiamonds = student.diamonds || 0;
    const prevStars = student.stars || 0;
    const prevPluses = student.pluses || 0;

    const nextStudent = { ...student };
    const score =
      type === "positive"
        ? applyPositivePoint(nextStudent)
        : applyNegativePoint(nextStudent);

    nextStudent.pluses = score.pluses;
    nextStudent.stars = score.stars;
    nextStudent.diamonds = score.diamonds;
    nextStudent.lastAction = { type, timestamp: now };

    const delta = {
      diamonds: (nextStudent.diamonds || 0) - prevDiamonds,
      stars: (nextStudent.stars || 0) - prevStars,
      pluses: (nextStudent.pluses || 0) - prevPluses,
    };

    nextStudent.progressLog = [
      ...(nextStudent.progressLog || []),
      {
        timestamp: now,
        type: "point",
        pointType: type,
        delta,
      },
    ];

    return nextStudent;
  });

export const buildNewStudent = (studentData, id = Date.now()) => ({
  completedSurahs: [],
  ayahProgress: {},
  memorizationProgress: {},
  lastReview: {},
  streak: 0,
  ...studentData,
  id,
  diamonds: Number(studentData.diamonds || 0),
  stars: Number(studentData.stars || 0),
  pluses: Number(studentData.pluses || 0),
  progressLog: studentData.progressLog || [],
});

export const editStudentById = ({ students, id, data }) =>
  students.map((student) => (student.id === id ? { ...student, ...data } : student));

export const deleteStudentById = ({ students, id }) =>
  students.filter((student) => student.id !== id);

export const buildNewClass = ({
  name,
  emoji = "📖",
  startDate = "",
  endDate = "",
  settings = DEFAULT_SETTINGS,
  students = [],
  id = `class-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  archived = false,
}) => ({
  id,
  name,
  emoji,
  startDate,
  endDate,
  settings,
  students,
  archived,
});

export const addClass = (classes, newClass) => [...classes, newClass];

export const updateClassInList = (classes, classId, updatedFields) =>
  classes.map((c) => (c.id === classId ? { ...c, ...updatedFields } : c));

export const deleteClassFromList = (classes, classId) =>
  classes.filter((c) => c.id !== classId);

export const migrateLegacyData = (storage) => {
  const oldStudents = loadJsonFromStorage(storage, "quran-tracker-students", null);
  const oldSettings = loadJsonFromStorage(storage, "quran-tracker-settings", null);

  if (oldStudents) {
    const migrated = buildNewClass({
      name: "کلاس ترم پاییز ۴۰۴ 🍁",
      emoji: "🍁",
      settings: oldSettings || DEFAULT_SETTINGS,
      students: oldStudents,
      id: "default-class",
    });
    try {
      storage.removeItem("quran-tracker-students");
      storage.removeItem("quran-tracker-settings");
    } catch (_e) {}
    return [migrated];
  }
  return [];
};

export const importStudentsToClass = ({
  destinationStudents,
  sourceStudentsToImport,
  keepData,
  startId = Date.now(),
}) => {
  let currentId = startId;
  const newStudents = sourceStudentsToImport.map((sourceStudent) => {
    currentId += 1;
    if (keepData) {
      return {
        ...sourceStudent,
        id: currentId,
      };
    } else {
      return buildNewStudent({
        name: sourceStudent.name,
        note: sourceStudent.note || '',
      }, currentId);
    }
  });
  return [...destinationStudents, ...newStudents];
};


