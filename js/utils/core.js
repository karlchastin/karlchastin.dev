export const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export const formatTime = (s) =>
  isNaN(s)
    ? "0:00"
    : `${Math.floor(s / 60)}:${Math.floor(s % 60)
        .toString()
        .padStart(2, "0")}`;

export const formatElapsed = (ms) => {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSecs % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
};

export const getCache = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
};

export const setCache = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
};
