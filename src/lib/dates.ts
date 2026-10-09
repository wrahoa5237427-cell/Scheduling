// Mọi tính toán ngày dùng giờ local của trình duyệt. due_date / week_start là chuỗi YYYY-MM-DD.

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function daysBetween(fromISO: string, toISO: string): number {
  const ms = parseISODate(toISO).getTime() - parseISODate(fromISO).getTime();
  return Math.round(ms / 86_400_000);
}

export function startOfDay(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Thứ Hai 00:00 (local) của tuần chứa `now`. */
export function startOfWeek(now: Date = new Date()): Date {
  const d = startOfDay(now);
  const mondayIndex = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - mondayIndex);
  return d;
}

export function weekStartISO(now: Date = new Date()): string {
  return toISODate(startOfWeek(now));
}

const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEKDAY_LONG = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export function formatDueLabel(due: string, today: string): string {
  const diff = daysBetween(today, due);
  if (diff === 0) return 'Hôm nay';
  if (diff === 1) return 'Ngày mai';
  if (diff === -1) return 'Hôm qua';
  const d = parseISODate(due);
  return `${WEEKDAY_SHORT[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

export function formatDateLong(iso: string): string {
  const d = parseISODate(iso);
  return `${WEEKDAY_LONG[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatWeekRange(weekStart: string): string {
  const a = parseISODate(weekStart);
  const b = parseISODate(addDays(weekStart, 6));
  return `${pad(a.getDate())}/${pad(a.getMonth() + 1)} – ${pad(b.getDate())}/${pad(b.getMonth() + 1)}`;
}

/** `timestamp` (ISO có timezone) có rơi vào ngày local `dayISO` không. */
export function isOnLocalDay(timestamp: string, dayISO: string): boolean {
  return toISODate(new Date(timestamp)) === dayISO;
}

export function formatTimeOfDay(timestamp: string): string {
  const d = new Date(timestamp);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
