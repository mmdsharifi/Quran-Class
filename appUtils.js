export const SURAH_AUDIO_BASE_URL = "https://server10.mp3quran.net/minsh/";

export const getSurahAudioUrl = (id) =>
  `${SURAH_AUDIO_BASE_URL}${String(id).padStart(3, "0")}.mp3`;

export const calculateMemoryHealth = (
  lastReviewTimestamp,
  now = Date.now(),
) => {
  if (!lastReviewTimestamp) {
    return { health: 0, status: "unknown", color: "", barColor: "" };
  }

  const diffDays = (now - lastReviewTimestamp) / (1000 * 60 * 60 * 24);
  if (diffDays < 1) {
    return {
      health: 100,
      status: "fresh",
      color: "text-green-500",
      barColor: "bg-green-500",
    };
  }
  if (diffDays < 3) {
    return {
      health: 70,
      status: "good",
      color: "text-green-400",
      barColor: "bg-green-400",
    };
  }
  if (diffDays < 7) {
    return {
      health: 40,
      status: "warning",
      color: "text-yellow-500",
      barColor: "bg-yellow-500",
    };
  }

  return {
    health: 10,
    status: "critical",
    color: "text-red-500",
    barColor: "bg-red-500",
  };
};

export const getTimeAgoLabel = (timestamp, now = Date.now()) => {
  if (!timestamp) {
    return "";
  }
  const diffSeconds = Math.floor((now - timestamp) / 1000);
  if (diffSeconds < 60) return "همین الان";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} دقیقه پیش`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} ساعت پیش`;
  return "چند روز پیش";
};
