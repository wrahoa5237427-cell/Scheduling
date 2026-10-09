import type { AreaId } from '../types.ts';
import { AREA_IDS } from './areas.ts';

/** Timer đang chạy/tạm dừng, lưu ở localStorage để reload trang không mất. */
export interface ActiveTimer {
  area_id: AreaId;
  project_id: string | null;
  task_id: string | null;
  startedAt: string; // ISO, lúc bấm Start lần đầu
  plannedSeconds: number;
  accumulatedMs: number; // thời gian đã chạy trước các lần pause
  runningSince: number | null; // epoch ms; null = đang pause
}

export interface TimerStartInput {
  area_id: AreaId;
  project_id: string | null;
  task_id: string | null;
  plannedSeconds: number;
}

export function startTimer(input: TimerStartInput, nowMs: number): ActiveTimer {
  return {
    ...input,
    startedAt: new Date(nowMs).toISOString(),
    accumulatedMs: 0,
    runningSince: nowMs,
  };
}

export function elapsedSeconds(t: ActiveTimer, nowMs: number): number {
  const running = t.runningSince === null ? 0 : Math.max(0, nowMs - t.runningSince);
  return Math.floor((t.accumulatedMs + running) / 1000);
}

export function pauseTimer(t: ActiveTimer, nowMs: number): ActiveTimer {
  if (t.runningSince === null) return t;
  return { ...t, accumulatedMs: t.accumulatedMs + Math.max(0, nowMs - t.runningSince), runningSince: null };
}

export function resumeTimer(t: ActiveTimer, nowMs: number): ActiveTimer {
  if (t.runningSince !== null) return t;
  return { ...t, runningSince: nowMs };
}

/** Đọc & kiểm tra dữ liệu lưu trữ; trả null nếu hỏng. */
export function parseStoredTimer(raw: string | null): ActiveTimer | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<ActiveTimer>;
    const ok =
      typeof v.area_id === 'string' &&
      (AREA_IDS as string[]).includes(v.area_id) &&
      typeof v.startedAt === 'string' &&
      !Number.isNaN(Date.parse(v.startedAt)) &&
      typeof v.plannedSeconds === 'number' &&
      typeof v.accumulatedMs === 'number' &&
      v.accumulatedMs >= 0 &&
      (v.runningSince === null || typeof v.runningSince === 'number') &&
      (v.project_id === null || typeof v.project_id === 'string') &&
      (v.task_id === null || typeof v.task_id === 'string');
    return ok ? (v as ActiveTimer) : null;
  } catch {
    return null;
  }
}
