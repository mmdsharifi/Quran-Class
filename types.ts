export interface Surah {
  id: number;
  name: string;
  nameAr: string;
  ayahs: number;
}

export interface ProgressLogEntry {
  timestamp: number;
  type: 'recitation' | 'memorization' | 'point';
  surahId?: number;
  added?: number[];
  removed?: number[];
  pointType?: 'positive' | 'negative';
  delta: {
    diamonds: number;
    stars: number;
    pluses: number;
  };
}

export interface Student {
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
  progressLog?: ProgressLogEntry[];
}

export interface MemoryHealth {
  health: number;
  status: 'fresh' | 'good' | 'warning' | 'critical' | 'unknown';
  color: string;
  barColor: string;
}

export interface AppSettings {
  rokhvaniDays: number[];
  hefzDays: number[];
}

export interface QuranClass {
  id: string;
  name: string;
  emoji?: string;
  startDate?: string;
  endDate?: string;
  settings: AppSettings;
  students: Student[];
  archived?: boolean;
}