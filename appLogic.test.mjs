import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_SETTINGS,
  applyManualPointForStudent,
  buildNewStudent,
  clearBrokenStreaks,
  deleteStudentById,
  editStudentById,
  filterStudentsByQuery,
  loadJsonFromStorage,
  sortStudentsByScore,
  updateProgressForStudent,
  buildNewClass,
  addClass,
  updateClassInList,
  deleteClassFromList,
  migrateLegacyData,
  importStudentsToClass,
} from "./appLogic.js";

const makeStudent = (overrides = {}) => ({
  id: 1,
  name: "Ali",
  diamonds: 0,
  stars: 0,
  pluses: 0,
  note: "",
  completedSurahs: [],
  ayahProgress: {},
  memorizationProgress: {},
  lastReview: {},
  streak: 0,
  ...overrides,
});

test("DEFAULT_SETTINGS keeps project defaults", () => {
  assert.deepEqual(DEFAULT_SETTINGS, {
    rokhvaniDays: [6, 1, 3],
    hefzDays: [0, 2, 4, 5],
  });
});

test("loadJsonFromStorage returns parsed value when storage has valid JSON", () => {
  const storage = {
    getItem: (key) => (key === "students" ? '{"name":"saved"}' : null),
  };
  assert.deepEqual(loadJsonFromStorage(storage, "students", { name: "fallback" }), {
    name: "saved",
  });
});

test("loadJsonFromStorage returns fallback when value is missing", () => {
  const storage = { getItem: () => null };
  const fallback = { ok: true };
  assert.equal(loadJsonFromStorage(storage, "missing", fallback), fallback);
});

test("loadJsonFromStorage returns fallback on JSON parse errors", () => {
  const storage = { getItem: () => "{bad json}" };
  const fallback = { ok: true };
  assert.equal(loadJsonFromStorage(storage, "bad", fallback), fallback);
});

test("loadJsonFromStorage returns fallback when storage access throws", () => {
  const storage = {
    getItem: () => {
      throw new Error("blocked");
    },
  };
  const fallback = { ok: true };
  assert.equal(loadJsonFromStorage(storage, "bad", fallback), fallback);
});

test("sortStudentsByScore sorts by diamonds then stars then pluses", () => {
  const students = [
    makeStudent({ id: 1, name: "A", diamonds: 1, stars: 1, pluses: 1 }),
    makeStudent({ id: 2, name: "B", diamonds: 2, stars: 0, pluses: 0 }),
    makeStudent({ id: 3, name: "C", diamonds: 1, stars: 3, pluses: 1 }),
    makeStudent({ id: 4, name: "D", diamonds: 1, stars: 3, pluses: 4 }),
  ];
  const sorted = sortStudentsByScore(students);
  assert.deepEqual(
    sorted.map((student) => student.id),
    [2, 4, 3, 1],
  );
  assert.notEqual(sorted, students);
});

test("filterStudentsByQuery matches case-insensitive names", () => {
  const students = [
    makeStudent({ id: 1, name: "Ali Reza" }),
    makeStudent({ id: 2, name: "Sara" }),
  ];
  const filtered = filterStudentsByQuery(students, "ALI");
  assert.deepEqual(
    filtered.map((student) => student.id),
    [1],
  );
});

test("clearBrokenStreaks resets only streaks that are no longer intact", () => {
  const monday = new Date("2025-01-06T09:00:00Z").getTime();
  const nextMonday = new Date("2025-01-13T09:00:00Z").getTime();
  const students = [
    makeStudent({
      id: 1,
      streak: 3,
      lastAction: { type: "positive", timestamp: monday },
    }),
    makeStudent({
      id: 2,
      streak: 0,
      lastAction: { type: "positive", timestamp: monday },
    }),
    makeStudent({ id: 3, streak: 2 }),
  ];

  const updated = clearBrokenStreaks({
    students,
    now: nextMonday,
    requiredDays: [1, 3],
  });

  assert.equal(updated[0].streak, 0);
  assert.equal(updated[1].streak, 0);
  assert.equal(updated[2].streak, 2);
});

test("clearBrokenStreaks keeps original reference when nothing changes", () => {
  const monday = new Date("2025-01-06T09:00:00Z").getTime();
  const wednesday = new Date("2025-01-08T09:00:00Z").getTime();
  const students = [
    makeStudent({
      id: 1,
      streak: 2,
      lastAction: { type: "positive", timestamp: monday },
    }),
  ];

  const updated = clearBrokenStreaks({
    students,
    now: wednesday,
    requiredDays: [1, 3],
  });

  assert.equal(updated, students);
});

test("updateProgressForStudent updates recitation progress without giving rewards by default", () => {
  const students = [makeStudent(), makeStudent({ id: 2, name: "Reza" })];

  const updated = updateProgressForStudent({
    students,
    studentId: 1,
    surahId: 114,
    completedAyahs: [1, 2],
    mode: "recitation",
    isFullComplete: false,
    requiredDays: [1],
  });

  assert.deepEqual(updated[0].ayahProgress[114], [1, 2]);
  assert.equal(updated[0].pluses, 0);
  assert.equal(updated[0].stars, 0);
  assert.equal(updated[0].diamonds, 0);
  assert.equal(updated[1], students[1]);
});

test("updateProgressForStudent rewards full recitation completions", () => {
  const now = new Date("2025-01-13T09:00:00Z").getTime();
  const previousMonday = new Date("2025-01-06T09:00:00Z").getTime();
  const students = [
    makeStudent({
      pluses: 4,
      stars: 0,
      diamonds: 0,
      streak: 2,
      lastAction: { type: "positive", timestamp: previousMonday },
    }),
  ];

  const updated = updateProgressForStudent({
    students,
    studentId: 1,
    surahId: 114,
    completedAyahs: [1, 2, 3, 4, 5, 6],
    mode: "recitation",
    isFullComplete: true,
    now,
    requiredDays: [1],
  });

  assert.equal(updated[0].pluses, 0);
  assert.equal(updated[0].stars, 1);
  assert.equal(updated[0].diamonds, 0);
  assert.equal(updated[0].streak, 3);
  assert.deepEqual(updated[0].lastAction, { type: "positive", timestamp: now });
});

test("updateProgressForStudent rewards full memorization and caps review history to five", () => {
  const now = new Date("2025-01-06T09:00:00Z").getTime();
  const students = [
    makeStudent({
      diamonds: 2,
      reviewHistory: {
        114: [1, 2, 3, 4, 5],
      },
    }),
  ];

  const updated = updateProgressForStudent({
    students,
    studentId: 1,
    surahId: 114,
    completedAyahs: [1, 2, 3, 4, 5, 6],
    mode: "memorization",
    isFullComplete: true,
    now,
    requiredDays: [1],
  });

  assert.deepEqual(updated[0].memorizationProgress[114], [1, 2, 3, 4, 5, 6]);
  assert.equal(updated[0].lastReview[114], now);
  assert.deepEqual(updated[0].reviewHistory[114], [now, 1, 2, 3, 4]);
  assert.equal(updated[0].diamonds, 3);
  assert.equal(updated[0].streak, 1);
});

test("updateProgressForStudent creates fresh review history when one does not exist", () => {
  const now = new Date("2025-01-07T09:00:00Z").getTime();
  const students = [makeStudent({ diamonds: 0, streak: 7 })];

  const updated = updateProgressForStudent({
    students,
    studentId: 1,
    surahId: 113,
    completedAyahs: [1, 2, 3, 4, 5],
    mode: "memorization",
    isFullComplete: true,
    now,
    requiredDays: [1], // Tuesday is optional
  });

  assert.deepEqual(updated[0].reviewHistory[113], [now]);
  assert.equal(updated[0].streak, 7);
});

test("updateProgressForStudent leaves collection unchanged when student id is not found", () => {
  const students = [makeStudent({ id: 1 }), makeStudent({ id: 2 })];
  const updated = updateProgressForStudent({
    students,
    studentId: 999,
    surahId: 114,
    completedAyahs: [1],
    mode: "recitation",
    requiredDays: [1],
  });
  assert.equal(updated[0], students[0]);
  assert.equal(updated[1], students[1]);
});

test("applyManualPointForStudent applies positive point and action timestamp", () => {
  const now = new Date("2025-01-06T09:00:00Z").getTime();
  const students = [makeStudent({ pluses: 4, stars: 2, diamonds: 1 })];
  const updated = applyManualPointForStudent({
    students,
    studentId: 1,
    type: "positive",
    now,
  });
  assert.deepEqual(
    { pluses: updated[0].pluses, stars: updated[0].stars, diamonds: updated[0].diamonds },
    { pluses: 0, stars: 3, diamonds: 1 },
  );
  assert.deepEqual(updated[0].lastAction, { type: "positive", timestamp: now });
});

test("applyManualPointForStudent applies negative point and action timestamp", () => {
  const now = new Date("2025-01-06T09:00:00Z").getTime();
  const students = [makeStudent({ pluses: 0, stars: 0, diamonds: 1 })];
  const updated = applyManualPointForStudent({
    students,
    studentId: 1,
    type: "negative",
    now,
  });
  assert.deepEqual(
    { pluses: updated[0].pluses, stars: updated[0].stars, diamonds: updated[0].diamonds },
    { pluses: 4, stars: 4, diamonds: 0 },
  );
  assert.deepEqual(updated[0].lastAction, { type: "negative", timestamp: now });
});

test("applyManualPointForStudent preserves entries when student id is not found", () => {
  const students = [makeStudent({ id: 1 }), makeStudent({ id: 2 })];
  const updated = applyManualPointForStudent({
    students,
    studentId: 3,
    type: "positive",
  });

  assert.equal(updated[0], students[0]);
  assert.equal(updated[1], students[1]);
});

test("buildNewStudent adds app defaults and normalizes numeric scores", () => {
  const newStudent = buildNewStudent(
    { name: "New", note: "x", diamonds: "2", stars: "3", pluses: "4" },
    12345,
  );

  assert.equal(newStudent.id, 12345);
  assert.equal(newStudent.name, "New");
  assert.equal(newStudent.diamonds, 2);
  assert.equal(newStudent.stars, 3);
  assert.equal(newStudent.pluses, 4);
  assert.deepEqual(newStudent.ayahProgress, {});
  assert.deepEqual(newStudent.memorizationProgress, {});
  assert.deepEqual(newStudent.lastReview, {});
  assert.equal(newStudent.streak, 0);
});

test("buildNewStudent falls back to zero scores when values are missing", () => {
  const newStudent = buildNewStudent({ name: "No Scores", note: "" }, 88);
  assert.equal(newStudent.diamonds, 0);
  assert.equal(newStudent.stars, 0);
  assert.equal(newStudent.pluses, 0);
});

test("editStudentById updates only the matching student", () => {
  const students = [makeStudent({ id: 1, name: "Old" }), makeStudent({ id: 2, name: "Second" })];
  const updated = editStudentById({
    students,
    id: 1,
    data: { name: "Updated", note: "note" },
  });

  assert.equal(updated[0].name, "Updated");
  assert.equal(updated[0].note, "note");
  assert.equal(updated[1].name, "Second");
});

test("deleteStudentById removes matching student", () => {
  const students = [makeStudent({ id: 1 }), makeStudent({ id: 2 })];
  const updated = deleteStudentById({ students, id: 1 });
  assert.deepEqual(
    updated.map((student) => student.id),
    [2],
  );
});

test("buildNewClass constructs a class object with unique id and defaults", () => {
  const c = buildNewClass({
    name: "New Class",
    emoji: "🕌",
    startDate: "2026-05-21",
    endDate: "2026-08-21",
    id: "test-class-id",
  });

  assert.equal(c.id, "test-class-id");
  assert.equal(c.name, "New Class");
  assert.equal(c.emoji, "🕌");
  assert.equal(c.startDate, "2026-05-21");
  assert.equal(c.endDate, "2026-08-21");
  assert.deepEqual(c.settings, { rokhvaniDays: [6, 1, 3], hefzDays: [0, 2, 4, 5] });
  assert.deepEqual(c.students, []);
  assert.equal(c.archived, false);
});

test("buildNewClass falls back to default values", () => {
  const c = buildNewClass({ name: "Minimal Class", id: "some-id" });
  assert.equal(c.id, "some-id");
  assert.equal(c.emoji, "📖");
  assert.equal(c.startDate, "");
  assert.equal(c.endDate, "");
  assert.deepEqual(c.students, []);
  assert.equal(c.archived, false);
});

test("buildNewClass respects archived field when provided", () => {
  const c = buildNewClass({ name: "Archived Class", id: "some-id", archived: true });
  assert.equal(c.archived, true);
});

test("addClass adds a class to the classes array", () => {
  const classes = [{ id: "c1", name: "Class 1" }];
  const newClass = { id: "c2", name: "Class 2" };
  const updated = addClass(classes, newClass);
  assert.deepEqual(updated, [
    { id: "c1", name: "Class 1" },
    { id: "c2", name: "Class 2" },
  ]);
  assert.notEqual(updated, classes); // immutable
});

test("updateClassInList updates class fields", () => {
  const classes = [
    { id: "c1", name: "Class 1", emoji: "📖" },
    { id: "c2", name: "Class 2", emoji: "🌸" },
  ];
  const updated = updateClassInList(classes, "c2", {
    name: "Updated Class 2",
    emoji: "🕌",
  });
  assert.deepEqual(updated[0], classes[0]);
  assert.equal(updated[1].name, "Updated Class 2");
  assert.equal(updated[1].emoji, "🕌");
});

test("deleteClassFromList removes matching class", () => {
  const classes = [
    { id: "c1", name: "Class 1" },
    { id: "c2", name: "Class 2" },
  ];
  const updated = deleteClassFromList(classes, "c1");
  assert.deepEqual(updated, [{ id: "c2", name: "Class 2" }]);
});

test("migrateLegacyData migrates students and settings", () => {
  const mockStorage = {
    getItem: (key) => {
      if (key === "quran-tracker-students") {
        return JSON.stringify([{ id: 1, name: "Ali" }]);
      }
      if (key === "quran-tracker-settings") {
        return JSON.stringify({ rokhvaniDays: [1], hefzDays: [2] });
      }
      return null;
    },
    removeItem: () => {},
  };

  const migrated = migrateLegacyData(mockStorage);
  assert.equal(migrated.length, 1);
  assert.equal(migrated[0].name, "کلاس ترم پاییز ۴۰۴ 🍁");
  assert.equal(migrated[0].emoji, "🍁");
  assert.deepEqual(migrated[0].students, [{ id: 1, name: "Ali" }]);
  assert.deepEqual(migrated[0].settings, { rokhvaniDays: [1], hefzDays: [2] });
});

test("buildNewStudent initializes progressLog as an empty array", () => {
  const s = buildNewStudent({ name: "Ali", diamonds: 1, stars: 2, pluses: 3 }, 1);
  assert.deepEqual(s.progressLog, []);
});

test("updateProgressForStudent logs progress additions, removals, and point deltas", () => {
  const now = 1000000;
  const students = [
    makeStudent({
      id: 1,
      ayahProgress: {
        114: [1, 2],
      },
      diamonds: 0,
      stars: 0,
      pluses: 0,
      progressLog: [],
    }),
  ];

  // Recitation progress update (checking ayahs 3 and 4)
  const updated1 = updateProgressForStudent({
    students,
    studentId: 1,
    surahId: 114,
    completedAyahs: [1, 2, 3, 4],
    mode: "recitation",
    isFullComplete: false,
    now,
    requiredDays: [1],
  });

  assert.equal(updated1[0].progressLog.length, 1);
  assert.deepEqual(updated1[0].progressLog[0], {
    timestamp: now,
    type: "recitation",
    surahId: 114,
    added: [3, 4],
    removed: [],
    delta: { diamonds: 0, stars: 0, pluses: 0 },
  });

  // Recitation progress update with reward
  // Starts with pluses=4, completes surah, rolls over to stars=1
  const studentsWithPluses = [
    makeStudent({
      id: 1,
      ayahProgress: { 114: [1, 2, 3, 4] },
      pluses: 4,
      stars: 0,
      diamonds: 0,
      progressLog: [],
    }),
  ];

  const updated2 = updateProgressForStudent({
    students: studentsWithPluses,
    studentId: 1,
    surahId: 114,
    completedAyahs: [1, 2, 3, 4, 5, 6],
    mode: "recitation",
    isFullComplete: true,
    now,
    requiredDays: [1],
  });

  assert.equal(updated2[0].progressLog.length, 1);
  assert.deepEqual(updated2[0].progressLog[0], {
    timestamp: now,
    type: "recitation",
    surahId: 114,
    added: [5, 6],
    removed: [],
    delta: { diamonds: 0, stars: 1, pluses: -4 },
  });
});

test("applyManualPointForStudent logs manual point addition and subtraction with deltas", () => {
  const now = 2000000;
  const students = [
    makeStudent({
      id: 1,
      pluses: 1,
      stars: 0,
      diamonds: 0,
      progressLog: [],
    }),
  ];

  const updatedPositive = applyManualPointForStudent({
    students,
    studentId: 1,
    type: "positive",
    now,
  });

  assert.equal(updatedPositive[0].progressLog.length, 1);
  assert.deepEqual(updatedPositive[0].progressLog[0], {
    timestamp: now,
    type: "point",
    pointType: "positive",
    delta: { diamonds: 0, stars: 0, pluses: 1 },
  });

  const updatedNegative = applyManualPointForStudent({
    students,
    studentId: 1,
    type: "negative",
    now,
  });

  assert.equal(updatedNegative[0].progressLog.length, 1);
  assert.deepEqual(updatedNegative[0].progressLog[0], {
    timestamp: now,
    type: "point",
    pointType: "negative",
    delta: { diamonds: 0, stars: 0, pluses: -1 },
  });
});

test("importStudentsToClass imports students and keeps all past data when keepData is true", () => {
  const destinationStudents = [makeStudent({ id: 1, name: "Ali" })];
  const sourceStudents = [
    makeStudent({
      id: 10,
      name: "Reza",
      note: "Smart",
      diamonds: 3,
      stars: 2,
      pluses: 1,
      completedSurahs: [114],
      ayahProgress: { 114: [1, 2, 3] },
      memorizationProgress: { 114: [1, 2] },
      streak: 5,
      progressLog: [{ timestamp: 100, type: "point", delta: { diamonds: 1, stars: 0, pluses: 0 } }],
    }),
  ];

  const result = importStudentsToClass({
    destinationStudents,
    sourceStudentsToImport: sourceStudents,
    keepData: true,
    startId: 5,
  });

  assert.equal(result.length, 2);
  assert.equal(result[0].name, "Ali");
  
  const imported = result[1];
  assert.equal(imported.id, 6);
  assert.equal(imported.name, "Reza");
  assert.equal(imported.note, "Smart");
  assert.equal(imported.diamonds, 3);
  assert.equal(imported.stars, 2);
  assert.equal(imported.pluses, 1);
  assert.deepEqual(imported.completedSurahs, [114]);
  assert.deepEqual(imported.ayahProgress, { 114: [1, 2, 3] });
  assert.deepEqual(imported.memorizationProgress, { 114: [1, 2] });
  assert.equal(imported.streak, 5);
  assert.equal(imported.progressLog.length, 1);
});

test("importStudentsToClass imports students and resets past data when keepData is false", () => {
  const destinationStudents = [makeStudent({ id: 1, name: "Ali" })];
  const sourceStudents = [
    makeStudent({
      id: 10,
      name: "Reza",
      note: "Smart",
      diamonds: 3,
      stars: 2,
      pluses: 1,
      completedSurahs: [114],
      ayahProgress: { 114: [1, 2, 3] },
      memorizationProgress: { 114: [1, 2] },
      streak: 5,
      progressLog: [{ timestamp: 100, type: "point", delta: { diamonds: 1, stars: 0, pluses: 0 } }],
    }),
  ];

  const result = importStudentsToClass({
    destinationStudents,
    sourceStudentsToImport: sourceStudents,
    keepData: false,
    startId: 12,
  });

  assert.equal(result.length, 2);
  
  const imported = result[1];
  assert.equal(imported.id, 13);
  assert.equal(imported.name, "Reza");
  assert.equal(imported.note, "Smart");
  
  assert.equal(imported.diamonds, 0);
  assert.equal(imported.stars, 0);
  assert.equal(imported.pluses, 0);
  assert.deepEqual(imported.completedSurahs, []);
  assert.deepEqual(imported.ayahProgress, {});
  assert.deepEqual(imported.memorizationProgress, {});
  assert.equal(imported.streak, 0);
  assert.deepEqual(imported.progressLog, []);
});



