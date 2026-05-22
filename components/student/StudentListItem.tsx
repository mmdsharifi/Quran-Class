import React, { useRef } from 'react';
import { Edit, Settings, ThumbsUp, ThumbsDown, ChevronRight, StickyNote, RefreshCw } from 'lucide-react';
import { playSound, calculateMemoryHealth } from '../../utils/helpers';
import { SFX_CLICK } from '../../constants';
import { Student } from '../../types';
import { translate } from '../../translations';

interface StudentListItemProps {
  student: Student;
  globalIndex: number;
  stats: {
    recitation: number;
    memorization: number;
    diamonds: number;
    stars: number;
    pluses: number;
  };
  isEditMode: boolean;
  timeFilter: 'all' | 'month' | 'week';
  activeStudentId: number | null;
  onSelect: (studentId: number) => void;
  onEdit: (student: Student) => void;
  onManualPoint: (studentId: number, type: 'positive' | 'negative') => void;
  language: 'fa' | 'en';
}

export const StudentListItem: React.FC<StudentListItemProps> = ({
  student,
  globalIndex,
  stats,
  isEditMode,
  timeFilter,
  activeStudentId,
  onSelect,
  onEdit,
  onManualPoint,
  language,
}) => {
  const t = (key: Parameters<typeof translate>[0]) => translate(key, language);
  const cardRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const leftBgRef = useRef<HTMLDivElement>(null);
  const rightBgRef = useRef<HTMLDivElement>(null);

  const dragInfo = useRef({
    startX: 0,
    startY: 0,
    currentX: 0,
    isSwipeGesture: false,
    isScrollGesture: false,
    isMouseDown: false,
  });

  // Ranking and ring styles
  let rankStyle = 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
  let ringColor = 'border-slate-100 dark:border-slate-900';
  if (!isEditMode) {
    if (globalIndex === 0) {
      rankStyle = 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow-yellow-200/50';
      ringColor = 'border-yellow-400';
    } else if (globalIndex === 1) {
      rankStyle = 'bg-slate-300 text-slate-800 border-slate-400 shadow-slate-200/50';
      ringColor = 'border-slate-300';
    } else if (globalIndex === 2) {
      rankStyle = 'bg-orange-300 text-orange-900 border-orange-400 shadow-orange-200/50';
      ringColor = 'border-orange-300';
    }
  }

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditMode) return;
    const touch = e.touches[0];
    dragInfo.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: 0,
      isSwipeGesture: false,
      isScrollGesture: false,
      isMouseDown: false,
    };

    if (cardRef.current) {
      cardRef.current.style.transition = 'none';
    }
    if (bgRef.current) {
      bgRef.current.style.opacity = '1';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isEditMode || dragInfo.current.isScrollGesture) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - dragInfo.current.startX;
    const diffY = touch.clientY - dragInfo.current.startY;

    if (!dragInfo.current.isSwipeGesture) {
      // Determine if vertical scroll or horizontal swipe
      if (Math.abs(diffY) > Math.abs(diffX)) {
        dragInfo.current.isScrollGesture = true;
        return;
      }
      if (Math.abs(diffX) > 10) {
        dragInfo.current.isSwipeGesture = true;
      }
    }

    if (dragInfo.current.isSwipeGesture) {
      if (e.cancelable) {
        e.preventDefault();
      }

      // Add elastic damping to swipe limits
      let dragX = diffX;
      const limit = 90;
      if (dragX > limit) {
        dragX = limit + (dragX - limit) * 0.25;
      } else if (dragX < -limit) {
        dragX = -limit + (dragX + limit) * 0.25;
      }

      dragInfo.current.currentX = dragX;

      if (cardRef.current) {
        cardRef.current.style.transform = `translateX(${dragX}px)`;
      }

      // Fade in/out left and right action overlays
      if (leftBgRef.current) {
        leftBgRef.current.style.opacity = dragX > 0 ? String(Math.min(dragX / 40, 1)) : '0';
      }
      if (rightBgRef.current) {
        rightBgRef.current.style.opacity = dragX < 0 ? String(Math.min(-dragX / 40, 1)) : '0';
      }
    }
  };

  const handleTouchEnd = () => {
    if (isEditMode) return;

    if (cardRef.current) {
      // Apply playful spring-back curve
      cardRef.current.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      cardRef.current.style.transform = 'translateX(0px)';
    }

    if (dragInfo.current.isSwipeGesture) {
      const threshold = 60;
      if (dragInfo.current.currentX > threshold) {
        onManualPoint(student.id, 'positive');
      } else if (dragInfo.current.currentX < -threshold) {
        onManualPoint(student.id, 'negative');
      }
    }

    // Reset backgrounds opacity
    setTimeout(() => {
      if (bgRef.current) bgRef.current.style.opacity = '0';
    }, 200);
  };

  const handleTouchCancel = () => {
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      cardRef.current.style.transform = 'translateX(0px)';
    }
    setTimeout(() => {
      if (bgRef.current) bgRef.current.style.opacity = '0';
    }, 200);
  };

  // Mouse drag handlers (for desktop testing/interactions)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditMode) return;
    dragInfo.current = {
      startX: e.clientX,
      startY: e.clientY,
      currentX: 0,
      isSwipeGesture: false,
      isScrollGesture: false,
      isMouseDown: true,
    };

    if (cardRef.current) {
      cardRef.current.style.transition = 'none';
    }
    if (bgRef.current) {
      bgRef.current.style.opacity = '1';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isEditMode || !dragInfo.current.isMouseDown) return;
    const diffX = e.clientX - dragInfo.current.startX;
    const diffY = e.clientY - dragInfo.current.startY;

    if (!dragInfo.current.isSwipeGesture) {
      if (Math.abs(diffX) > 10) {
        dragInfo.current.isSwipeGesture = true;
      }
    }

    if (dragInfo.current.isSwipeGesture) {
      let dragX = diffX;
      const limit = 90;
      if (dragX > limit) {
        dragX = limit + (dragX - limit) * 0.25;
      } else if (dragX < -limit) {
        dragX = -limit + (dragX + limit) * 0.25;
      }

      dragInfo.current.currentX = dragX;

      if (cardRef.current) {
        cardRef.current.style.transform = `translateX(${dragX}px)`;
      }

      if (leftBgRef.current) {
        leftBgRef.current.style.opacity = dragX > 0 ? String(Math.min(dragX / 40, 1)) : '0';
      }
      if (rightBgRef.current) {
        rightBgRef.current.style.opacity = dragX < 0 ? String(Math.min(-dragX / 40, 1)) : '0';
      }
    }
  };

  const handleMouseUp = () => {
    if (!dragInfo.current.isMouseDown) return;
    dragInfo.current.isMouseDown = false;

    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      cardRef.current.style.transform = 'translateX(0px)';
    }

    if (dragInfo.current.isSwipeGesture) {
      const threshold = 60;
      if (dragInfo.current.currentX > threshold) {
        onManualPoint(student.id, 'positive');
      } else if (dragInfo.current.currentX < -threshold) {
        onManualPoint(student.id, 'negative');
      }
    }

    setTimeout(() => {
      if (bgRef.current) bgRef.current.style.opacity = '0';
    }, 200);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl w-full select-none">
      <div
        ref={bgRef}
        className="absolute inset-0 rounded-2xl flex items-center justify-between pointer-events-none opacity-0 transition-opacity duration-200"
        dir="ltr"
      >
        {/* Right Action Overlay (Green praise for positive points) - swipe right */}
        <div
          ref={leftBgRef}
          className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-start px-6 text-white font-bold opacity-0 transition-opacity duration-150"
        >
          <div className="flex items-center gap-2">
            <ThumbsUp size={24} className="animate-bounce" />
            <span className="text-sm font-bold">{t('praise')}</span>
          </div>
        </div>

        {/* Left Action Overlay (Red warning for negative points) - swipe left */}
        <div
          ref={rightBgRef}
          className="absolute inset-0 bg-gradient-to-l from-red-500 to-red-400 flex items-center justify-end px-6 text-white font-bold opacity-0 transition-opacity duration-150"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">{t('warn')}</span>
            <ThumbsDown size={24} className="animate-bounce" />
          </div>
        </div>
      </div>

      {/* Card Content Wrapper */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative z-10 cursor-grab active:cursor-grabbing touch-pan-y"
      >
        <button
          onClick={() => {
            // Click action is only processed if it wasn't a swipe/drag gesture
            if (!dragInfo.current.isSwipeGesture) {
              if (isEditMode) {
                onEdit(student);
              } else {
                playSound(SFX_CLICK);
                onSelect(student.id);
              }
            }
          }}
          className={`w-full flex flex-col bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border-2 transition-all relative overflow-hidden ${
            isEditMode
              ? 'border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20'
              : `${
                  globalIndex < 3 ? ringColor : 'border-transparent dark:border-transparent'
                } hover:border-green-400 dark:hover:border-green-500`
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black border-b-2 shadow-sm transition-all ${
                  isEditMode ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 scale-90' : rankStyle
                }`}
              >
                {isEditMode ? <Edit size={18} /> : globalIndex + 1}
              </div>
              <div className="text-start">
                <div className="font-bold text-slate-700 dark:text-slate-200 text-sm text-start">
                  {student.name}
                </div>
                {!isEditMode && (
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                    {timeFilter === 'all' ? (
                      <>
                        {student.diamonds > 0 && (
                          <span className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1 border border-blue-100 dark:border-blue-900/40 font-bold">
                            <span className="text-[10px]">💎</span> {student.diamonds}
                          </span>
                        )}
                        {(student.stars > 0 || student.diamonds > 0) && (
                          <span className="bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded flex items-center gap-1 border border-yellow-100 dark:border-yellow-900/40 font-bold">
                            <span className="text-[10px]">⭐️</span> {student.stars}
                          </span>
                        )}
                        {student.pluses > 0 && (
                          <span className="text-green-500 dark:text-green-400 text-[10px] font-bold">
                            +{student.pluses}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {stats.diamonds > 0 && (
                          <span className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1 border border-blue-100 dark:border-blue-900/40 font-bold">
                            <span className="text-[10px]">💎</span> {stats.diamonds}
                          </span>
                        )}
                        {stats.stars > 0 && (
                          <span className="bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded flex items-center gap-1 border border-yellow-100 dark:border-yellow-900/40 font-bold">
                            <span className="text-[10px]">⭐️</span> {stats.stars}
                          </span>
                        )}
                        {stats.pluses > 0 && (
                          <span className="bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded flex items-center gap-1 border border-green-100 dark:border-green-900/40 font-bold">
                            <span className="text-[10px]">+</span>
                            {stats.pluses}
                          </span>
                        )}

                        {stats.recitation > 0 || stats.memorization > 0 ? (
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            {stats.recitation > 0 && <span>{t('recitation')}: {stats.recitation}</span>}
                            {stats.recitation > 0 && stats.memorization > 0 && (
                              <span className="text-slate-300 dark:text-slate-700">•</span>
                            )}
                            {stats.memorization > 0 && <span>{t('memorization')}: {stats.memorization}</span>}
                          </span>
                        ) : (
                          stats.diamonds === 0 &&
                          stats.stars === 0 &&
                          stats.pluses === 0 && (
                            <span className="text-[10px] text-slate-300 dark:text-slate-600 italic">
                              {t('noActivity')}
                            </span>
                          )
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            {isEditMode ? (
              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-400 dark:text-slate-500">
                <Settings size={16} />
              </div>
            ) : Object.keys(student.memorizationProgress || {}).some(
                (id) =>
                  calculateMemoryHealth(student.lastReview?.[Number(id)]).status ===
                  'critical'
              ) ? (
              <div className="bg-red-50 dark:bg-red-950/35 text-red-500 dark:text-red-400 p-2 rounded-full animate-pulse">
                <RefreshCw size={14} />
              </div>
            ) : (
              <ChevronRight className="text-slate-300 dark:text-slate-600 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 transition-transform" />
            )}
          </div>
          {!isEditMode && student.note && (
            <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg flex items-start gap-1 w-full text-start border border-slate-100 dark:border-slate-800/80">
              <StickyNote size={10} className="mt-0.5 text-slate-400 dark:text-slate-500 shrink-0" />
              {student.note}
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
