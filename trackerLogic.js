export const PLUS_THRESHOLD = 5;
export const STAR_THRESHOLD = 5;

const startOfDay = (timestamp) => {
  const day = new Date(timestamp);
  day.setHours(0, 0, 0, 0);
  return day.getTime();
};

export const isStreakIntact = (lastTimestamp, currentTimestamp, requiredDays = []) => {
  const last = new Date(lastTimestamp);
  last.setHours(0, 0, 0, 0);
  const now = new Date(currentTimestamp);
  now.setHours(0, 0, 0, 0);

  if (last.getTime() === now.getTime()) {
    return true;
  }

  let cursor = new Date(last);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor.getTime() < now.getTime()) {
    if (requiredDays.includes(cursor.getDay())) {
      return false;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return true;
};

export const updateStreakAfterPositive = ({
  currentStreak,
  lastActionTimestamp,
  now,
  requiredDays = [],
}) => {
  if (lastActionTimestamp && !isStreakIntact(lastActionTimestamp, now, requiredDays)) {
    return requiredDays.includes(new Date(now).getDay()) ? 1 : 0;
  }

  if (!requiredDays.includes(new Date(now).getDay())) {
    return currentStreak;
  }

  if (!lastActionTimestamp) {
    return 1;
  }

  if (startOfDay(lastActionTimestamp) === startOfDay(now)) {
    return Math.max(1, currentStreak);
  }

  return currentStreak + 1;
};

export const applyPositivePoint = ({ pluses, stars, diamonds }) => {
  let nextPluses = pluses + 1;
  let nextStars = stars;
  let nextDiamonds = diamonds;

  if (nextPluses >= PLUS_THRESHOLD) {
    nextPluses = 0;
    nextStars += 1;
  }

  if (nextStars >= STAR_THRESHOLD) {
    nextStars = 0;
    nextDiamonds += 1;
  }

  return {
    pluses: nextPluses,
    stars: nextStars,
    diamonds: nextDiamonds,
  };
};

export const applyNegativePoint = ({ pluses, stars, diamonds }) => {
  if (pluses > 0) {
    return { pluses: pluses - 1, stars, diamonds };
  }

  if (stars > 0) {
    return { pluses: PLUS_THRESHOLD - 1, stars: stars - 1, diamonds };
  }

  if (diamonds > 0) {
    return {
      pluses: PLUS_THRESHOLD - 1,
      stars: STAR_THRESHOLD - 1,
      diamonds: diamonds - 1,
    };
  }

  return { pluses, stars, diamonds };
};
