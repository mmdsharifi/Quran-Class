import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const TimeAgo = ({ timestamp, type }: { timestamp: number, type: 'positive' | 'negative' }) => {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const updateLabel = () => {
      if (!timestamp) { setLabel(''); return; }
      const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
      if (diffSeconds < 60) setLabel('همین الان');
      else if (diffSeconds < 3600) setLabel(`${Math.floor(diffSeconds / 60)} دقیقه پیش`);
      else if (diffSeconds < 86400) setLabel(`${Math.floor(diffSeconds / 3600)} ساعت پیش`);
      else {
        const date = new Date(timestamp);
        setLabel(`${date.toLocaleDateString('fa-IR')} ${date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`);
      }
    };
    updateLabel(); 
    const interval = setInterval(updateLabel, 60000); 
    return () => clearInterval(interval);
  }, [timestamp]);
  
  if (!timestamp) return null;
  return (<div className={`text-xs flex items-center gap-1 mt-2 ${type === 'negative' ? 'text-red-400' : 'text-green-500'}`}><Clock size={10} /><span>{type === 'positive' ? 'آخرین تشویق:' : 'آخرین تذکر:'} {label}</span></div>);
};