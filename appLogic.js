import {
  applyNegativePoint,
  applyPositivePoint,
  isStreakIntact,
  updateStreakAfterPositive,
} from "./trackerLogic.js";

export const DEFAULT_SETTINGS = Object.freeze({
  rokhvaniDays: [6, 1, 3],
  hefzDays: [0, 2, 4, 5],
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

    if (!isFullComplete) {
      return nextStudent;
    }

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

    const nextStudent = { ...student };
    const score =
      type === "positive"
        ? applyPositivePoint(nextStudent)
        : applyNegativePoint(nextStudent);

    nextStudent.pluses = score.pluses;
    nextStudent.stars = score.stars;
    nextStudent.diamonds = score.diamonds;
    nextStudent.lastAction = { type, timestamp: now };
    return nextStudent;
  });

export const buildNewStudent = (studentData, id = Date.now()) => ({
  ...studentData,
  id,
  completedSurahs: [],
  ayahProgress: {},
  memorizationProgress: {},
  lastReview: {},
  streak: 0,
  diamonds: Number(studentData.diamonds || 0),
  stars: Number(studentData.stars || 0),
  pluses: Number(studentData.pluses || 0),
});

export const editStudentById = ({ students, id, data }) =>
  students.map((student) => (student.id === id ? { ...student, ...data } : student));

export const deleteStudentById = ({ students, id }) =>
  students.filter((student) => student.id !== id);
