import test from "node:test";
import assert from "node:assert/strict";

import {
  applyNegativePoint,
  applyPositivePoint,
  isStreakIntact,
  updateStreakAfterPositive,
} from "./trackerLogic.js";

test("pluses roll into stars at 5", () => {
  const result = applyPositivePoint({ pluses: 4, stars: 2, diamonds: 0 });
  assert.deepEqual(result, { pluses: 0, stars: 3, diamonds: 0 });
});

test("stars roll into diamonds at 5", () => {
  const result = applyPositivePoint({ pluses: 4, stars: 4, diamonds: 1 });
  assert.deepEqual(result, { pluses: 0, stars: 0, diamonds: 2 });
});

test("positive point increments pluses when threshold is not reached", () => {
  const result = applyPositivePoint({ pluses: 2, stars: 1, diamonds: 0 });
  assert.deepEqual(result, { pluses: 3, stars: 1, diamonds: 0 });
});

test("negative point decrements plus when plus is available", () => {
  const result = applyNegativePoint({ pluses: 3, stars: 1, diamonds: 0 });
  assert.deepEqual(result, { pluses: 2, stars: 1, diamonds: 0 });
});

test("negative point borrows from stars when plus is zero", () => {
  const result = applyNegativePoint({ pluses: 0, stars: 2, diamonds: 0 });
  assert.deepEqual(result, { pluses: 4, stars: 1, diamonds: 0 });
});

test("negative point borrows from diamonds when plus and star are zero", () => {
  const result = applyNegativePoint({ pluses: 0, stars: 0, diamonds: 2 });
  assert.deepEqual(result, { pluses: 4, stars: 4, diamonds: 1 });
});

test("negative point keeps values unchanged when all counters are zero", () => {
  const result = applyNegativePoint({ pluses: 0, stars: 0, diamonds: 0 });
  assert.deepEqual(result, { pluses: 0, stars: 0, diamonds: 0 });
});

test("streak remains intact when missing only optional days", () => {
  const monday = new Date("2025-01-06T10:00:00Z").getTime();
  const wednesday = new Date("2025-01-08T10:00:00Z").getTime();
  const requiredDays = [1, 3];
  assert.equal(isStreakIntact(monday, wednesday, requiredDays), true);
});

test("streak is intact for repeated actions in the same day", () => {
  const morning = new Date("2025-01-06T08:00:00Z").getTime();
  const evening = new Date("2025-01-06T19:00:00Z").getTime();
  assert.equal(isStreakIntact(morning, evening, [1, 3]), true);
});

test("streak breaks when a required day is missed", () => {
  const monday = new Date("2025-01-06T10:00:00Z").getTime();
  const nextMonday = new Date("2025-01-13T10:00:00Z").getTime();
  const requiredDays = [1, 3];
  assert.equal(isStreakIntact(monday, nextMonday, requiredDays), false);
});

test("streak updates once per required day even with repeated positives", () => {
  const requiredDays = [1];
  const mondayMorning = new Date("2025-01-06T08:00:00Z").getTime();
  const mondayNoon = new Date("2025-01-06T12:00:00Z").getTime();
  const once = updateStreakAfterPositive({
    currentStreak: 0,
    lastActionTimestamp: undefined,
    now: mondayMorning,
    requiredDays,
  });
  const twice = updateStreakAfterPositive({
    currentStreak: once,
    lastActionTimestamp: mondayMorning,
    now: mondayNoon,
    requiredDays,
  });
  assert.equal(once, 1);
  assert.equal(twice, 1);
});

test("streak does not change on non-required days", () => {
  const tuesday = new Date("2025-01-07T08:00:00Z").getTime();
  const result = updateStreakAfterPositive({
    currentStreak: 4,
    lastActionTimestamp: undefined,
    now: tuesday,
    requiredDays: [1], // Monday only
  });
  assert.equal(result, 4);
});

test("streak resets to 1 when required days were missed", () => {
  const monday = new Date("2025-01-06T08:00:00Z").getTime();
  const nextMonday = new Date("2025-01-13T08:00:00Z").getTime();
  const result = updateStreakAfterPositive({
    currentStreak: 5,
    lastActionTimestamp: monday,
    now: nextMonday,
    requiredDays: [1, 3],
  });
  assert.equal(result, 1);
});

test("streak increments when required days stay intact between actions", () => {
  const monday = new Date("2025-01-06T08:00:00Z").getTime();
  const nextMonday = new Date("2025-01-13T08:00:00Z").getTime();
  const result = updateStreakAfterPositive({
    currentStreak: 2,
    lastActionTimestamp: monday,
    now: nextMonday,
    requiredDays: [1],
  });
  assert.equal(result, 3);
});
