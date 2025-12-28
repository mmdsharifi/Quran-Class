import { MemoryHealth } from '../types';

export const playSound = (url: string) => { 
  if (navigator.onLine) { 
    try { 
      new Audio(url).play().catch(e=>{}); 
    } catch(e){} 
  } 
};

export const getSurahAudioUrl = (id: number, baseUrl: string) => `${baseUrl}${String(id).padStart(3, '0')}.mp3`;

export const calculateMemoryHealth = (lastReviewTimestamp?: number): MemoryHealth => {
    if (!lastReviewTimestamp) return { health: 0, status: 'unknown', color: '', barColor: '' };
    const diffDays = (Date.now() - lastReviewTimestamp) / (1000 * 60 * 60 * 24);
    if (diffDays < 1) return { health: 100, status: 'fresh', color: 'text-green-500', barColor: 'bg-green-500' };
    if (diffDays < 3) return { health: 70, status: 'good', color: 'text-green-400', barColor: 'bg-green-400' };
    if (diffDays < 7) return { health: 40, status: 'warning', color: 'text-yellow-500', barColor: 'bg-yellow-500' };
    return { health: 10, status: 'critical', color: 'text-red-500', barColor: 'bg-red-500' };
};

export const isStreakIntact = (lastTimestamp: number, currentTimestamp: number, requiredDays: number[]) => {
    const oneDay = 24 * 60 * 60 * 1000;
    const last = new Date(lastTimestamp);
    last.setHours(0,0,0,0);
    const now = new Date(currentTimestamp);
    now.setHours(0,0,0,0);
    if (last.getTime() === now.getTime()) return true; 
    let temp = new Date(last.getTime() + oneDay);
    while (temp.getTime() < now.getTime()) {
        const day = temp.getDay(); 
        if (requiredDays.includes(day)) {
            return false;
        }
        temp = new Date(temp.getTime() + oneDay);
    }
    return true;
};

export const calculateNewPoints = (current: {pluses: number, stars: number, diamonds: number}, change: number) => {
    let { pluses, stars, diamonds } = current;
    pluses += change;
    while (pluses >= 5) {
        pluses -= 5;
        stars += 1;
    }
    while (stars >= 5) {
        stars -= 5;
        diamonds += 1;
    }
    if (pluses < 0) pluses = 0; 
    return { pluses, stars, diamonds };
};

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