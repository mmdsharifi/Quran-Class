/**
 * Sets up a swipe-to-back gesture on a container element.
 *
 * - LTR (left-to-right layout): swipe RIGHT → go back  (positive translateX)
 * - RTL (right-to-left layout): swipe LEFT  → go back  (negative translateX)
 *
 * The container is physically dragged with translateX during the gesture and
 * either flies off-screen (triggering onBack) or snaps back on release.
 */
export function setupSwipeBack(
  container: any,
  options: {
    onBack: () => void;
    playSound: (sfx: string) => void;
    sfxClick: string;
    /** 'ltr' = swipe right to go back (default). 'rtl' = swipe left to go back. */
    direction?: 'ltr' | 'rtl';
    getThreshold?: () => number;
    getWindowWidth?: () => number;
    animationDuration?: number;
  }
): () => void {
  const direction = options.direction ?? 'ltr';
  const getThreshold = options.getThreshold ?? (() => 80);
  const getWindowWidth =
    options.getWindowWidth ??
    (() => (typeof window !== 'undefined' ? window.innerWidth : 375));
  const animationDuration =
    options.animationDuration !== undefined ? options.animationDuration : 300;

  const dragInfo = {
    startX: 0,
    startY: 0,
    /** Raw signed drag delta in the back-swipe direction (always positive when going "back"). */
    currentDrag: 0,
    isSwipeGesture: false,
    isScrollGesture: false,
    isMouseDown: false,
  };

  const handleTouchStart = (e: any) => {
    if (getWindowWidth() >= 1024) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragInfo.startX = clientX;
    dragInfo.startY = clientY;
    dragInfo.currentDrag = 0;
    dragInfo.isSwipeGesture = false;
    dragInfo.isScrollGesture = false;
    dragInfo.isMouseDown = true;

    container.style.transition = 'none';
  };

  const handleTouchMove = (e: any) => {
    if (getWindowWidth() >= 1024 || !dragInfo.isMouseDown) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const diffX = clientX - dragInfo.startX;
    const diffY = clientY - dragInfo.startY;

    // Determine gesture type on first significant movement
    if (!dragInfo.isSwipeGesture && !dragInfo.isScrollGesture) {
      if (Math.abs(diffY) > Math.abs(diffX)) {
        dragInfo.isScrollGesture = true;
      } else if (Math.abs(diffX) > 10) {
        dragInfo.isSwipeGesture = true;
      }
    }

    if (!dragInfo.isSwipeGesture) return;

    if (e.cancelable && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    // In LTR: "back" means dragging right  → diffX is positive → translateX positive
    // In RTL: "back" means dragging left   → diffX is negative → translateX negative
    // We clamp so the user can't drag in the wrong direction.
    let dragX: number;
    if (direction === 'rtl') {
      // Allow only leftward drag (negative diffX)
      dragX = Math.min(diffX, 0); // clamp to ≤ 0
    } else {
      // Allow only rightward drag (positive diffX)
      dragX = Math.max(diffX, 0); // clamp to ≥ 0
    }

    dragInfo.currentDrag = dragX;
    container.style.transform = `translateX(${dragX}px)`;
  };

  const handleTouchEnd = () => {
    if (!dragInfo.isMouseDown) return;
    dragInfo.isMouseDown = false;

    container.style.transition = `transform ${animationDuration}ms ease-out`;

    const threshold = getThreshold();
    // Magnitude of drag in the "back" direction
    const dragMagnitude = Math.abs(dragInfo.currentDrag);

    if (dragInfo.isSwipeGesture && dragMagnitude > threshold) {
      // Fly the container off-screen in the back direction
      const width = container.offsetWidth || getWindowWidth();
      const flyTo = direction === 'rtl' ? -width : width;
      container.style.transform = `translateX(${flyTo}px)`;

      setTimeout(() => {
        options.playSound(options.sfxClick);
        options.onBack();
        if (container) {
          container.style.transform = '';
        }
      }, animationDuration);
    } else {
      // Snap back to resting position
      container.style.transform = 'translateX(0px)';
      setTimeout(() => {
        if (container) {
          container.style.transform = '';
        }
      }, animationDuration);
    }
  };

  // Attach touch listeners to the container
  container.addEventListener('touchstart', handleTouchStart, { passive: true });
  container.addEventListener('touchmove', handleTouchMove, { passive: false });
  container.addEventListener('touchend', handleTouchEnd, { passive: true });
  container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

  // Attach mouse listeners for dev/desktop testing
  container.addEventListener('mousedown', handleTouchStart);

  const win = typeof window !== 'undefined' ? window : null;
  if (win) {
    win.addEventListener('mousemove', handleTouchMove, { passive: false });
    win.addEventListener('mouseup', handleTouchEnd);
  } else {
    container.addEventListener('mousemove', handleTouchMove, { passive: false });
    container.addEventListener('mouseup', handleTouchEnd);
  }

  // Return cleanup function
  return () => {
    container.removeEventListener('touchstart', handleTouchStart);
    container.removeEventListener('touchmove', handleTouchMove);
    container.removeEventListener('touchend', handleTouchEnd);
    container.removeEventListener('touchcancel', handleTouchEnd);
    container.removeEventListener('mousedown', handleTouchStart);

    if (win) {
      win.removeEventListener('mousemove', handleTouchMove);
      win.removeEventListener('mouseup', handleTouchEnd);
    } else {
      container.removeEventListener('mousemove', handleTouchMove);
      container.removeEventListener('mouseup', handleTouchEnd);
    }
  };
}
