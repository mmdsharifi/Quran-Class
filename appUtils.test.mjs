import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateMemoryHealth,
  getPraiseText,
  getSurahAudioUrl,
  getTimeAgoLabel,
  getWarningText,
  SURAH_AUDIO_BASE_URL,
} from "./appUtils.js";

test("getSurahAudioUrl pads surah ids to three digits", () => {
  assert.equal(getSurahAudioUrl(7), `${SURAH_AUDIO_BASE_URL}007.mp3`);
  assert.equal(getSurahAudioUrl(114), `${SURAH_AUDIO_BASE_URL}114.mp3`);
});

test("calculateMemoryHealth returns unknown when there is no review timestamp", () => {
  assert.deepEqual(calculateMemoryHealth(undefined), {
    health: 0,
    status: "unknown",
    color: "",
    barColor: "",
  });
});

test("calculateMemoryHealth returns fresh for reviews under one day old", () => {
  const now = new Date("2026-01-08T12:00:00Z").getTime();
  const reviewTimestamp = now - 12 * 60 * 60 * 1000;
  assert.equal(calculateMemoryHealth(reviewTimestamp, now).status, "fresh");
});

test("calculateMemoryHealth returns good for reviews under three days old", () => {
  const now = new Date("2026-01-08T12:00:00Z").getTime();
  const reviewTimestamp = now - 2 * 24 * 60 * 60 * 1000;
  assert.equal(calculateMemoryHealth(reviewTimestamp, now).status, "good");
});

test("calculateMemoryHealth returns warning for reviews under seven days old", () => {
  const now = new Date("2026-01-08T12:00:00Z").getTime();
  const reviewTimestamp = now - 5 * 24 * 60 * 60 * 1000;
  assert.equal(calculateMemoryHealth(reviewTimestamp, now).status, "warning");
});

test("calculateMemoryHealth returns critical for stale reviews", () => {
  const now = new Date("2026-01-08T12:00:00Z").getTime();
  const reviewTimestamp = now - 8 * 24 * 60 * 60 * 1000;
  assert.equal(calculateMemoryHealth(reviewTimestamp, now).status, "critical");
});

test("getTimeAgoLabel returns empty label when timestamp is missing", () => {
  assert.equal(getTimeAgoLabel(undefined), "");
});

test("getTimeAgoLabel returns 'just now' label for very recent timestamps", () => {
  const now = new Date("2026-01-08T12:00:00Z").getTime();
  assert.equal(getTimeAgoLabel(now - 45 * 1000, now), "همین الان");
});

test("getTimeAgoLabel returns minute-based label", () => {
  const now = new Date("2026-01-08T12:00:00Z").getTime();
  assert.equal(getTimeAgoLabel(now - 9 * 60 * 1000, now), "9 دقیقه پیش");
});

test("getTimeAgoLabel returns hour-based label", () => {
  const now = new Date("2026-01-08T12:00:00Z").getTime();
  assert.equal(getTimeAgoLabel(now - 3 * 60 * 60 * 1000, now), "3 ساعت پیش");
});

test("getTimeAgoLabel returns day-based fallback label", () => {
  const now = new Date("2026-01-08T12:00:00Z").getTime();
  assert.equal(getTimeAgoLabel(now - 3 * 24 * 60 * 60 * 1000, now), "چند روز پیش");
});

test("getPraiseText returns correct praise text based on index", () => {
  assert.equal(getPraiseText(0), "ماشاءالله! 🌟");
  assert.equal(getPraiseText(1), "بارک‌الله! 👏");
  assert.equal(getPraiseText(8), "ماشاءالله! 🌟"); // wraparound
});

test("getWarningText returns correct warning text based on index", () => {
  assert.equal(getWarningText(0), "تذکر ثبت شد. ⚠️");
  assert.equal(getWarningText(1), "مواظب باش و دقتت رو بیشتر کن. 🤫");
  assert.equal(getWarningText(5), "تذکر ثبت شد. ⚠️"); // wraparound
});

