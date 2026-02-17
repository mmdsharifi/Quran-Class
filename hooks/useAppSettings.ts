import { useState, useEffect } from 'react';
import { AppSettings } from '../types';

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('quran-tracker-settings');
      return saved ? JSON.parse(saved) : { rokhvaniDays: [6, 1, 3], hefzDays: [0, 2, 4, 5] };
    } catch (e) {
      return { rokhvaniDays: [6, 1, 3], hefzDays: [0, 2, 4, 5] };
    }
  });

  useEffect(() => {
    localStorage.setItem('quran-tracker-settings', JSON.stringify(settings));
  }, [settings]);

  return { settings, setSettings };
};