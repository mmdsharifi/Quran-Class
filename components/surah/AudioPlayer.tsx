import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Pause, Volume2 } from 'lucide-react';
import { getSurahAudioUrl } from '../../utils/helpers';
import { AUDIO_BASE_URL } from '../../constants';

export const AudioPlayer = ({ surahId, showToast }: { surahId: number, showToast: any }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const togglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator.onLine) { showToast("برای پخش صوت نیاز به اینترنت است", 'error'); return; }

    if (!audioRef.current) {
        const url = getSurahAudioUrl(surahId, AUDIO_BASE_URL);
        const audio = new Audio(url);
        
        audio.addEventListener('ended', () => {
            setIsPlaying(false);
            setIsLoading(false);
        });
        audio.addEventListener('waiting', () => setIsLoading(true));
        audio.addEventListener('playing', () => setIsLoading(false));
        audio.addEventListener('error', (e) => {
            console.error("Audio error:", e);
            setIsLoading(false);
            setIsPlaying(false);
            showToast("خطا در پخش صوت", 'error');
        });
        
        audioRef.current = audio;
    }

    if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        setIsLoading(false);
    } else {
        setIsLoading(true);
        try {
            await audioRef.current.play();
            setIsPlaying(true);
        } catch (err) {
            console.error("Play error:", err);
            setIsLoading(false);
        }
    }
  };
  
  useEffect(() => {
      return () => {
          if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
          }
      };
  }, []);

  return (
    <button onClick={togglePlay} className={`p-2 rounded-full transition-all ${isPlaying ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-500'}`}>
        {isLoading ? (
            <Loader2 size={18} className="animate-spin text-blue-500" />
        ) : isPlaying ? (
            <Pause size={18} className="animate-pulse" />
        ) : (
            <Volume2 size={18} />
        )}
    </button>
  );
};