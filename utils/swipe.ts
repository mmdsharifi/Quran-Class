export function setupSwipeBack(
  container: any,
  options: {
    onBack: () => void;
    playSound: (sfx: string) => void;
    sfxClick: string;
    getThreshold?: () => number;
    getWindowWidth?: () => number;
    animationDuration?: number;
  }
): () => void {
  const getThreshold = options.getThreshold || (() => 80);
  const getWindowWidth = options.getWindowWidth || (() => typeof window !== "undefined" ? window.innerWidth : 375);
  const animationDuration = options.animationDuration !== undefined ? options.animationDuration : 300;

  const dragInfo = {
    startX: 0,
    startY: 0,
    currentX: 0,
    isSwipeGesture: false,
    isScrollGesture: false,
    isMouseDown: false,
  };

  const handleTouchStart = (e: any) => {
    if (getWindowWidth() >= 1024) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    dragInfo.startX = clientX;
    dragInfo.startY = clientY;
    dragInfo.currentX = 0;
    dragInfo.isSwipeGesture = false;
    dragInfo.isScrollGesture = false;
    dragInfo.isMouseDown = true;

    container.style.transition = "none";
  };

  const handleTouchMove = (e: any) => {
    if (getWindowWidth() >= 1024 || !dragInfo.isMouseDown) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const diffX = clientX - dragInfo.startX;
    const diffY = clientY - dragInfo.startY;

    if (!dragInfo.isSwipeGesture && !dragInfo.isScrollGesture) {
      if (Math.abs(diffY) > Math.abs(diffX)) {
        dragInfo.isScrollGesture = true;
      } else if (Math.abs(diffX) > 10) {
        dragInfo.isSwipeGesture = true;
      }
    }

    if (dragInfo.isSwipeGesture) {
      if (e.cancelable && typeof e.preventDefault === "function") {
        e.preventDefault();
      }

      let dragX = diffX;
      if (dragX < 0) {
        dragX = 0; // Don't let swipe go off-screen to the left
      }

      dragInfo.currentX = dragX;
      container.style.transform = `translateX(${dragX}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!dragInfo.isMouseDown) return;
    dragInfo.isMouseDown = false;

    container.style.transition = `transform ${animationDuration}ms ease-out`;

    const threshold = getThreshold();
    if (dragInfo.isSwipeGesture && dragInfo.currentX > threshold) {
      const width = container.offsetWidth || getWindowWidth();
      container.style.transform = `translateX(${width}px)`;

      setTimeout(() => {
        options.playSound(options.sfxClick);
        options.onBack();
        if (container) {
          container.style.transform = "";
        }
      }, animationDuration);
    } else {
      container.style.transform = "translateX(0px)";
      setTimeout(() => {
        if (container) {
          container.style.transform = "";
        }
      }, animationDuration);
    }
  };

  // Add listeners
  container.addEventListener("touchstart", handleTouchStart, { passive: true });
  container.addEventListener("touchmove", handleTouchMove, { passive: false });
  container.addEventListener("touchend", handleTouchEnd, { passive: true });
  container.addEventListener("touchcancel", handleTouchEnd, { passive: true });

  container.addEventListener("mousedown", handleTouchStart);

  const win = typeof window !== "undefined" ? window : null;
  if (win) {
    win.addEventListener("mousemove", handleTouchMove, { passive: false });
    win.addEventListener("mouseup", handleTouchEnd);
  } else {
    container.addEventListener("mousemove", handleTouchMove, { passive: false });
    container.addEventListener("mouseup", handleTouchEnd);
  }

  // Return cleanup function
  return () => {
    container.removeEventListener("touchstart", handleTouchStart);
    container.removeEventListener("touchmove", handleTouchMove);
    container.removeEventListener("touchend", handleTouchEnd);
    container.removeEventListener("touchcancel", handleTouchEnd);
    container.removeEventListener("mousedown", handleTouchStart);

    if (win) {
      win.removeEventListener("mousemove", handleTouchMove);
      win.removeEventListener("mouseup", handleTouchEnd);
    } else {
      container.removeEventListener("mousemove", handleTouchMove);
      container.removeEventListener("mouseup", handleTouchEnd);
    }
  };
}
