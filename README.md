# 🕌 Smart Quran Class Management (QuClass)

**QuClass** is a smart, modern, and interactive application for managing, tracking, and logging educational activities in Quranic classes (recitation, memorization, points, attendance). Designed as a Progressive Web App (PWA), it dynamically supports RTL (Farsi) and LTR (English) layouts, as well as Light, Dark, and System themes.

![QuClass Main Interface - English](./docs/screenshot-en.png)
![QuClass Main Interface - Farsi](./docs/screenshot-fa.png)

[نسخه فارسی راهنما (readme-fa.md)](./readme-fa.md)

---

## 🌟 Key Features

### 1. Class & Student Management
* **Create & Edit Classes:** Define multiple classes with custom names, start/end dates, and a designated class emoji.
* **Archiving Classes:** Archive older classes to keep your active sidebar clean, with the ability to restore them at any time.
* **Student Directory:** Add students to classes along with specific teacher notes (e.g., parent feedback or individual learning goals).

### 2. Advanced Student Import
* Batch import students from one class to another.
* Import with **full history** (past records, points, and streaks) or as a **new profile** (only name and note).
* Smart collision detection prevents duplicated/conflicting IDs in the destination class.

### 3. Periodic Progress Monitoring (Weekly, Monthly, Overall)
* **Dynamic Time Filtering:** View leaderboard standings and student honors filtered by **This Week**, **This Month**, or **All Time**.
* **Automatic Growth Calculation:** Standings are computed dynamically based on completed recitation/memorization ayahs and point deltas.
* **Detailed Progress Reports:** Interactive charts showing a comprehensive breakdown of each student's progress.

### 4. Gamified Reward System
* **Activity Streaks:** Tracks daily activity with a visual streak flame 🔥 when students practice consistently on required days.
* **Automatic Reward Progression:** Pluses (`+`) automatically convert to Stars (`⭐️`) at 5 points, and Stars convert to Diamonds (`💎`) at 5 stars.
* **Memory Health Tracker:** Automatically estimates retention strength for memorized Surahs (Green: Fresh, Yellow: Good, Orange: Warning, Red: Critical / Needs Review 🔄).

### 5. Surah Audio Player & Text
* View the complete text of Surahs using the clear Uthmani script.
* Stream audio recitations online or offline to facilitate student pronunciation and practice.

### 6. PWA & Offline Support
* **100% Lighthouse PWA Score:** Fully audited and optimized to achieve a 100% PWA compliance score.
* Responsive, mobile-first design that can be installed directly onto your device's home screen with modern splash screens and maskable icons.
* Dedicated **Service Worker** caching assets, audio streams, styles, Google Fonts, and external libraries to enable seamless offline usage.

### 7. Dual-Language & Theme Support
* Dynamic language switching between **Persian (RTL)** and **English (LTR)** with appropriate typography and layout alignment mirroring.
* Native system-aware theme resolution supporting **Light Mode**, **Dark Mode**, and **System Theme** overrides.

---

## 🛠️ Tech Stack

* **Core:** React 19, TypeScript
* **Bundler:** Vite
* **Styling:** Vanilla CSS (enhanced with Tailwind CSS variables and logical properties)
* **Icons:** Lucide React
* **Interactivity:** Canvas Confetti (celebrating milestones 🎉)
* **Storage:** LocalStorage with automated schema migration.
* **Testing:** Node.js native test runner with type-stripping support.

---

## 🚀 Getting Started & Local Development

### Prerequisites
* Node.js (version 18 or higher)

### Installation & Run
1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build the production application bundle:
```bash
npm run build
```

4. Run unit tests and coverage:
```bash
# Run all unit tests
npm test

# Run tests with HTML coverage reports
npm run test:coverage
```

---

## 📦 Deployment

You can deploy QuClass statically to hosting platforms like **Vercel** or **Netlify**. Static bundle output is built into the `dist` folder. All assets (including the PWA `manifest.json` and service worker `sw.js`) are compiled automatically.
