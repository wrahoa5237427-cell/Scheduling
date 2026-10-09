/** 4800 -> "1h 20m", 2700 -> "45m", 0 -> "0m", 30 -> "<1m". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return `${m}m`;
  return s > 0 ? '<1m' : '0m';
}

export function formatMinutes(minutes: number): string {
  return formatDuration(minutes * 60);
}

/** 75 -> "1:15", 3725 -> "1:02:05". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm.padStart(2, '0')}:${ss}`;
}

export function hoursToMinutes(hours: number): number {
  return Math.round(hours * 60);
}

export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}
