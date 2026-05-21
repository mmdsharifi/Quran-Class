import { MemoryHealth } from '../types';
import confetti from 'canvas-confetti';
import { isStreakIntact as jsIsStreakIntact } from '../trackerLogic.js';
import {
  calculateMemoryHealth as jsCalculateMemoryHealth,
  getPraiseText as jsGetPraiseText,
  getWarningText as jsGetWarningText,
} from '../appUtils.js';

export const playSound = (url: string) => { 
  if (navigator.onLine) { 
    try { 
      new Audio(url).play().catch(e=>{}); 
    } catch(e){} 
  } 
};

export const triggerConfetti = () => {
    const colors = ['#EAB308', '#2563EB', '#22C55E']; // Gold, Blue, Green
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors,
        disableForReducedMotion: true
    });
};

export const getSurahAudioUrl = (id: number, baseUrl: string) => `${baseUrl}${String(id).padStart(3, '0')}.mp3`;

export const isStreakIntact = jsIsStreakIntact as (lastTimestamp: number, currentTimestamp: number, requiredDays: number[]) => boolean;

export const calculateMemoryHealth = jsCalculateMemoryHealth as (lastReviewTimestamp?: number) => MemoryHealth;

export const getPraiseText = jsGetPraiseText as (index: number) => string;

export const getWarningText = jsGetWarningText as (index: number) => string;

export function parseCSVLine(text: string) {
    const result = [];
    let startValueIndex = 0;
    let insideQuote = false;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '"') {
            insideQuote = !insideQuote;
        } else if (text[i] === ',' && !insideQuote) {
            let val = text.substring(startValueIndex, i);
            val = val.trim();
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.slice(1, -1).replace(/""/g, '"');
            }
            result.push(val);
            startValueIndex = i + 1;
        }
    }
    let val = text.substring(startValueIndex);
    val = val.trim();
    if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/""/g, '"');
    }
    result.push(val);
    return result;
}