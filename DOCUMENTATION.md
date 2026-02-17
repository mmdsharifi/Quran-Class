# QuClass - Quran Class Management System

A comprehensive web application for managing Quran memorization and recitation classes. This application helps teachers track student progress, manage class schedules, and monitor student achievements through an intuitive interface.

## 🎯 Purpose

QuClass is designed to simplify the management of Quran classes by providing:
- Student progress tracking for both recitation and memorization
- Gamification elements (diamonds, stars, streaks) to motivate students
- Audio support for Quranic verses
- Class scheduling with flexible day assignments
- Memory health tracking and review reminders

## 🚀 Features

### Student Management
- **Student Profiles**: Complete profile system with notes and achievements
- **Performance Tracking**: Real-time progress monitoring with visual indicators
- **Gamification**: 
  - 💎 Diamonds for memorization achievements
  - ⭐ Stars earned through consistent performance
  - 🔥 Streak tracking to encourage consistency
  - ➕ Plus points for positive reinforcement

### Quran Tracking
- **Dual Mode Support**: Separate tracking for:
  - روخوانی (Recitation) - Green themed
  - حفظ (Memorization) - Purple themed
- **Verse-by-Verse Progress**: Individual tracking for each ayah
- **Audio Integration**: Built-in audio player for each surah
- **Memory Health System**: 
  - Visual indicators for retention status
  - Automatic review reminders based on elapsed time
  - Review history tracking

### Class Management
- **Flexible Scheduling**: 
  - Required days (روخوانی) that affect streak calculations
  - Optional days (حفظ) that don't break streaks if missed
- **Teacher Tools**:
  - Manual point assignment (encouragement/warnings)
  - Student notes and observations
  - Bulk operations and data management

### User Interface
- **Responsive Design**: Mobile-first approach with touch-friendly interface
- **RTL Support**: Full right-to-left support for Arabic/Farsi text
- **Visual Feedback**: Sound effects and animations for user interactions
- **Search & Navigation**: Quick student search and smooth navigation

## 🛠️ Technology Stack

### Frontend
- **React 19.2.3** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast development and build tool
- **Tailwind CSS** - Utility-first CSS framework (via CDN/style tags)

### Data Management
- **LocalStorage** - Client-side persistence for student data and settings
- **React Hooks** - State management and side effects

### External Services
- **MP3 Quran** - Audio files from `server10.mp3quran.net`
- **Mixkit** - Sound effect assets for user feedback

## 📁 Project Structure

```
QuClass/
├── App.tsx              # Main application component (773 lines)
├── constants.ts         # Application constants and data
├── types.ts             # TypeScript type definitions
├── index.html           # HTML entry point
├── index.tsx            # React application entry point
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite build configuration
├── .gitignore          # Git ignore rules
└── README.md           # This documentation
```

## 🎨 Core Components

### Main Application (`App.tsx`)
The heart of the application containing:
- **TeacherDashboard**: Main interface with list and detail views
- **StudentFormSheet**: Modal for adding/editing students
- **SettingsSheet**: Configuration for class schedules
- **TeacherSurahItem**: Individual surah progress tracking
- **AudioPlayer**: Integrated Quran audio playback
- **StatsHeader**: Student achievement display

### Data Models (`types.ts`)
```typescript
interface Student {
  id: number;
  name: string;
  diamonds: number;
  stars: number;
  pluses: number;
  note: string;
  completedSurahs: number[];
  ayahProgress: Record<number, number[]>;
  memorizationProgress: Record<number, number[]>;
  lastReview: Record<number, number>;
  reviewHistory?: Record<number, number[]>;
  streak: number;
  lastAction?: {
    type: 'positive' | 'negative';
    timestamp: number;
  };
}
```

### Constants (`constants.ts`)
- Quran surah data (114-78 with names and verse counts)
- Arabic Quran text for selected surahs
- Audio URLs and sound effects
- Initial student data (31 students)

## 🔄 Key Algorithms

### Memory Health Calculation
Calculates retention status based on time since last review:
- **Fresh** (< 1 day): 100% health, green status
- **Good** (1-3 days): 70% health, light green
- **Warning** (3-7 days): 40% health, yellow
- **Critical** (> 7 days): 10% health, red

### Streak Calculation
Maintains student motivation streaks:
- Only breaks on missed required days (روخوانی)
- Optional days (حفظ) don't affect streak
- Continuous tracking with daily validation

## 🎮 User Interactions

### Teacher Workflow
1. **Class Overview**: View all students ranked by performance
2. **Student Selection**: Tap to view detailed progress
3. **Progress Tracking**: 
   - Individual ayah selection for recitation/memorization
   - Bulk completion with "تایید کل" button
   - Audio playback support
4. **Points Management**: 
   - Manual encouragement (+) or warning (-)
   - Automatic points for achievements
5. **Settings**: Configure class schedule and requirements

### Gamification Elements
- **Audio Feedback**: Success, click, memorization, and negative sounds
- **Visual Indicators**: Progress bars, achievement badges, status colors
- **Animations**: Smooth transitions and micro-interactions

## 🗂️ Data Persistence

### LocalStorage Structure
```javascript
// Student data
quran_tracker_students_v1: JSON.stringify(students)

// Application settings
quran_tracker_settings_v1: JSON.stringify(settings)
```

### Data Recovery
- Initial student data serves as fallback
- Settings reset to default schedule if corrupted
- Graceful handling of localStorage failures

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd QuClass

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Commands
```bash
npm run dev    # Start development server (localhost:3000)
npm run build  # Build for production
npm run preview # Preview production build
```

### Environment Setup
Create `.env.local` file if using external APIs:
```
GEMINI_API_KEY=your_api_key_here
```

## 🔧 Configuration

### Default Settings
- **Required Days**: Saturday (6), Monday (1), Wednesday (3)
- **Optional Days**: Sunday (0), Tuesday (2), Thursday (4), Friday (5)
- **Development Server**: localhost:3000
- **Build Output**: `dist/` folder

### Customization
- Modify `INITIAL_STUDENTS` in `constants.ts` for default student list
- Update `SURAHS` array for different surah selection
- Adjust scoring logic in `handleUpdateProgress` function

## 🌱 Development Notes

### Code Style
- **TypeScript**: Strict mode enabled
- **Component Structure**: Functional components with hooks
- **State Management**: Local state with localStorage persistence
- **CSS**: Inline styles with Tailwind-style utilities

### Key Patterns
- **Modal Sheets**: Bottom-up modal design for mobile
- **Responsive Grids**: 5-column grid for ayah selection
- **RTL Support**: Persian/Arabic text with proper direction
- **Sound Integration**: Conditional audio playback with online detection

### Performance Considerations
- **Debounced Updates**: Optimized localStorage writes
- **Lazy Loading**: Quran text loaded as needed
- **Audio Preloading**: Dynamic audio element creation
- **Streak Calculation**: Optimized daily checks

## 🎯 Future Enhancements

### Potential Features
- **Cloud Sync**: Multi-device synchronization
- **Analytics Dashboard**: Detailed class statistics
- **Parent Portal**: Student progress viewing for parents
- **Advanced Scheduling**: Holiday and exception handling
- **Export Features**: PDF reports and data export
- **Multi-Language**: Arabic, English, and Persian support

### Technical Improvements
- **PWA Support**: Offline functionality
- **Database Integration**: Backend API for scalability
- **Real-time Updates**: WebSocket support for live tracking
- **Accessibility**: Enhanced screen reader support

## 📄 License

This project is private and intended for educational use in Quran class management.

---

**Note**: This application is designed specifically for Persian/Arabic-speaking users managing Quran memorization classes. The interface and documentation are primarily in Persian to serve the target audience effectively.