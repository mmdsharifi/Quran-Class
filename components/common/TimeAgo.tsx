import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { translate } from '../../translations';

export const TimeAgo = ({ 
  timestamp, 
  type,
  language = 'fa'
}: { 
  timestamp: number; 
  type: 'positive' | 'negative';
  language?: 'fa' | 'en';
}) => {
  const [label, setLabel] = useState('');

  const t = (key: Parameters<typeof translate>[0], params?: Record<string, string | number>) => translate(key, language, params);

  useEffect(() => {
    const updateLabel = () => {
      if (!timestamp) { setLabel(''); return; }
      const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
      if (diffSeconds < 60) {
        setLabel(t('justNow'));
      } else if (diffSeconds < 3600) {
        setLabel(t('minutesAgo', { minutes: Math.floor(diffSeconds / 60) }));
      } else if (diffSeconds < 86400) {
        setLabel(t('hoursAgo', { hours: Math.floor(diffSeconds / 3600) }));
      } else {
        const date = new Date(timestamp);
        const localeCode = language === 'en' ? 'en-US' : 'fa-IR';
        setLabel(`${date.toLocaleDateString(localeCode)} ${date.toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}`);
      }
    };
    updateLabel(); 
    const interval = setInterval(updateLabel, 60000); 
    return () => clearInterval(interval);
  }, [timestamp, language]);
  
  if (!timestamp) return null;
  return (
    <div className={`text-xs flex items-center gap-1 mt-2 ${type === 'negative' ? 'text-red-400' : 'text-green-500'}`}>
      <Clock size={10} />
      <span>
        {type === 'positive' ? t('lastPraise') : t('lastWarning')} {label}
      </span>
    </div>
  );
};