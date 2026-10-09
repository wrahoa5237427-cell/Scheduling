import type { AreaId, Priority, Task, TimeEntry, WeeklyGoal } from '../types.ts';
import { AREA_IDS } from './areas.ts';
import { addDays, isOnLocalDay } from './dates.ts';

export type AreaTotals = Record<AreaId, number>;

export function emptyTotals(): AreaTotals {
  const totals = {} as AreaTotals;
  for (const id of AREA_IDS) totals[id] = 0;
  return totals;
}

export function totalOf(totals: AreaTotals): number {
  return AREA_IDS.reduce((sum, id) => sum + totals[id], 0);
}

/** Tổng giây theo area cho các entry có started_at trong [from, to). */
export function sumByArea(entries: TimeEntry[], from: Date, to?: Date): AreaTotals {
  const totals = emptyTotals();
  const fromMs = from.getTime();
  const toMs = to ? to.getTime() : Infinity;
  for (const e of entries) {
    const t = new Date(e.started_at).getTime();
    if (t >= fromMs && t < toMs) totals[e.area_id] += e.duration_seconds;
  }
  return totals;
}

/**
 * Mục tiêu hiệu lực của tuần `weekStart` theo area (phút, 0 = chưa đặt).
 * Lấy bản ghi mới nhất có week_start <= weekStart, nên mục tiêu tự "chuyển tiếp" sang tuần sau.
 */
export function effectiveTargets(goals: WeeklyGoal[], weekStart: string): AreaTotals {
  const targets = emptyTotals();
  const chosen: Partial<Record<AreaId, string>> = {};
  for (const g of goals) {
    if (g.week_start > weekStart) continue;
    const current = chosen[g.area_id];
    if (current === undefined || g.week_start > current) {
      chosen[g.area_id] = g.week_start;
      targets[g.area_id] = g.target_minutes;
    }
  }
  return targets;
}

const PRIORITY_RANK: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

/** Việc chưa xong: hạn gần nhất trước (không hạn xuống cuối), rồi ưu tiên, rồi cũ trước. */
export function compareOpen(a: Task, b: Task): number {
  if (a.due_date !== b.due_date) {
    if (a.due_date === null) return 1;
    if (b.due_date === null) return -1;
    return a.due_date < b.due_date ? -1 : 1;
  }
  const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (p !== 0) return p;
  return a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0;
}

function compareDone(a: Task, b: Task): number {
  const x = a.completed_at ?? '';
  const y = b.completed_at ?? '';
  return x < y ? 1 : x > y ? -1 : 0;
}

export interface TaskBuckets {
  today: Task[];
  overdue: Task[];
  upcoming: Task[];
  completed: Task[];
  all: Task[];
}

export const UPCOMING_DAYS = 7;

export function bucketTasks(tasks: Task[], today: string): TaskBuckets {
  const open = tasks.filter((t) => t.status === 'TODO').sort(compareOpen);
  const done = tasks.filter((t) => t.status === 'DONE').sort(compareDone);
  const horizon = addDays(today, UPCOMING_DAYS);

  const overdue = open.filter((t) => t.due_date !== null && t.due_date < today);
  const upcoming = open.filter((t) => t.due_date !== null && t.due_date > today && t.due_date <= horizon);

  const todayOpen = open.filter((t) => t.due_date === today);
  const todayDone = done.filter(
    (t) => t.due_date === today || (t.completed_at !== null && isOnLocalDay(t.completed_at, today)),
  );

  return {
    today: [...todayOpen, ...todayDone],
    overdue,
    upcoming,
    completed: done,
    all: [...open, ...done],
  };
}
