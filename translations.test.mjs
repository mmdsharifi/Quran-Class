import test from "node:test";
import assert from "node:assert/strict";
import { TRANSLATIONS, translate } from "./translations.ts";
import { DEFAULT_SETTINGS } from "./appLogic.js";

test("TRANSLATIONS has identical keys in 'fa' and 'en'", () => {
  const faKeys = Object.keys(TRANSLATIONS.fa).sort();
  const enKeys = Object.keys(TRANSLATIONS.en).sort();

  assert.deepEqual(
    faKeys,
    enKeys,
    "Farsi and English translation objects must have the exact same set of keys"
  );
});

test("translate returns correct translation with and without params", () => {
  // Test basic translation
  assert.equal(translate("appName", "fa"), "کلاس قرآن");
  assert.equal(translate("appName", "en"), "QuClass");

  // Test translation with multiple params
  assert.equal(
    translate("praiseLogged", "fa", { text: "بارک‌الله! 👏", name: "علی" }),
    "بارک‌الله! 👏 تشویق برای علی ثبت شد (+۱ پلاس)"
  );
  assert.equal(
    translate("praiseLogged", "en", { text: "Barakallah! 👏", name: "Ali" }),
    "Barakallah! 👏 praise registered for Ali (+1 plus)"
  );

  // Test warningLogged
  assert.equal(
    translate("warningLogged", "fa", { text: "تذکر ثبت شد. ⚠️", name: "احمد" }),
    "تذکر ثبت شد. ⚠️ تذکر برای احمد ثبت شد (-۱ پلاس)"
  );
  assert.equal(
    translate("warningLogged", "en", { text: "Warning registered. ⚠️", name: "Ahmed" }),
    "Warning registered. ⚠️ warning registered for Ahmed (-1 plus)"
  );
});

test("translate handles missing or extra params gracefully", () => {
  // Missing params: key should still have placeholder text literally if not provided
  assert.equal(
    translate("praiseLogged", "fa", { text: "آفرین! 🎉" }),
    "آفرین! 🎉 تشویق برای {name} ثبت شد (+۱ پلاس)"
  );

  // Extra params: should not affect translation, just ignored
  assert.equal(
    translate("appName", "en", { extra: "param" }),
    "QuClass"
  );
});

test("translate falls back gracefully when key is missing in chosen language", () => {
  // If key is not in English but present in Farsi, we test fallback.
  // We can simulate this by temporarily modifying TRANSLATIONS
  const originalEn = TRANSLATIONS.en;
  try {
    TRANSLATIONS.en = { ...originalEn };
    // delete a key from en to trigger fallback
    delete TRANSLATIONS.en.appName;
    
    assert.equal(translate("appName", "en"), "کلاس قرآن"); // falls back to fa
  } finally {
    TRANSLATIONS.en = originalEn;
  }
});

test("translate returns key if key is completely missing in all languages", () => {
  assert.equal(translate("nonExistentKey", "fa"), "nonExistentKey");
  assert.equal(translate("nonExistentKey", "en"), "nonExistentKey");
});

test("DEFAULT_SETTINGS contains correct theme and language values", () => {
  assert.equal(DEFAULT_SETTINGS.theme, "system");
  assert.equal(DEFAULT_SETTINGS.language, "fa");
});
