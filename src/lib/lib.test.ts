import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Task, TimeEntry, WeeklyGoal } from '../types.ts';
import {
  addDays, daysBetween, formatDueLabel, formatWeekRange, isOnLocalDay, startOfWeek, toISODate, weekStartISO,
} from './dates.ts';
import { formatClock, formatDuration, hoursToMinutes, minutesToHours } from './format.ts';
import { bucketTasks, effectiveTargets, sumByArea, totalOf } from './stats.ts';
import { elapsedSeconds, parseStoredTimer, pauseTimer, resumeTimer, startTimer } from './timer.ts';

const task = (over: Partial<Task>): Task => ({
  id: Math.random().toString(36).slice(2),
  title: 't', description: null, area_id: 'school', project_id: null,
  status: 'TODO', priority: 'MEDIUM', due_date: null, estimated_minutes: null,
  created_at: '2026-10-01T00:00:00Z', completed_at: null, ...over,
});

test('dates: week starts on Monday', () => {
  assert.equal(weekStartISO(new Date(2026, 9, 8)), '2026-10-05'); // Thursday 08/10/2026
  assert.equal(weekStartISO(new Date(2026, 9, 11)), '2026-10-05'); // Sunday
  assert.equal(weekStartISO(new Date(2026, 9, 12)), '2026-10-12'); // Monday
  assert.equal(toISODate(startOfWeek(new Date(2026, 9, 8, 23, 59))), '2026-10-05');
});

test('dates: add/diff/labels', () => {
  assert.equal(addDays('2026-10-30', 3), '2026-11-02');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
  assert.equal(daysBetween('2026-10-08', '2026-10-10'), 2);
  assert.equal(formatDueLabel('2026-10-08', '2026-10-08'), 'Hôm nay');
  assert.equal(formatDueLabel('2026-10-09', '2026-10-08'), 'Ngày mai');
  assert.equal(formatDueLabel('2026-10-07', '2026-10-08'), 'Hôm qua');
  assert.equal(formatDueLabel('2026-10-12', '2026-10-08'), 'T2 12/10');
  assert.equal(formatWeekRange('2026-10-05'), '05/10 – 11/10');
  assert.equal(isOnLocalDay(new Date(2026, 9, 8, 14, 0).toISOString(), '2026-10-08'), true);
});

test('format: durations and clock', () => {
  assert.equal(formatDuration(4800), '1h 20m');
  assert.equal(formatDuration(7200), '2h');
  assert.equal(formatDuration(2700), '45m');
  assert.equal(formatDuration(30), '<1m');
  assert.equal(formatDuration(0), '0m');
  assert.equal(formatClock(1500), '25:00');
  assert.equal(formatClock(59), '00:59');
  assert.equal(formatClock(3725), '1:02:05');
  assert.equal(hoursToMinutes(7.5), 450);
  assert.equal(minutesToHours(450), 7.5);
});

test('stats: sumByArea respects range', () => {
  const e = (area: TimeEntry['area_id'], iso: string, sec: number): TimeEntry => ({
    id: iso, area_id: area, project_id: null, task_id: null,
    started_at: iso, ended_at: iso, duration_seconds: sec,
  });
  const entries = [
    e('coding', new Date(2026, 9, 5, 9).toISOString(), 3600),
    e('coding', new Date(2026, 9, 8, 20).toISOString(), 1800),
    e('ielts', new Date(2026, 9, 8, 7).toISOString(), 600),
    e('ielts', new Date(2026, 9, 4, 23).toISOString(), 999), // tuần trước
  ];
  const week = sumByArea(entries, new Date(2026, 9, 5));
  assert.equal(week.coding, 5400);
  assert.equal(week.ielts, 600);
  assert.equal(totalOf(week), 6000);
  const day = sumByArea(entries, new Date(2026, 9, 8), new Date(2026, 9, 9));
  assert.equal(day.coding, 1800);
  assert.equal(day.ielts, 600);
});

test('stats: weekly targets carry forward and can be zeroed', () => {
  const g = (area: WeeklyGoal['area_id'], week: string, min: number): WeeklyGoal => ({
    id: area + week, area_id: area, week_start: week, target_minutes: min,
  });
  const goals = [g('coding', '2026-09-28', 480), g('coding', '2026-10-12', 0), g('ielts', '2026-10-05', 300)];
  const t = effectiveTargets(goals, '2026-10-05');
  assert.equal(t.coding, 480);
  assert.equal(t.ielts, 300);
  assert.equal(t.math_hsg, 0);
  assert.equal(effectiveTargets(goals, '2026-10-12').coding, 0);
  assert.equal(effectiveTargets(goals, '2026-09-21').coding, 0);
});

test('stats: task buckets', () => {
  const today = '2026-10-08';
  const tasks = [
    task({ id: 'a', due_date: '2026-10-07' }), // overdue
    task({ id: 'b', due_date: today, priority: 'LOW' }),
    task({ id: 'c', due_date: today, priority: 'HIGH' }),
    task({ id: 'd', due_date: '2026-10-10' }), // upcoming
    task({ id: 'e', due_date: '2026-10-20' }), // quá xa
    task({ id: 'f' }), // không hạn
    task({ id: 'g', status: 'DONE', due_date: today, completed_at: new Date(2026, 9, 8, 9).toISOString() }),
    task({ id: 'h', status: 'DONE', due_date: '2026-10-01', completed_at: new Date(2026, 9, 8, 10).toISOString() }),
    task({ id: 'i', status: 'DONE', due_date: '2026-10-01', completed_at: new Date(2026, 9, 2, 10).toISOString() }),
  ];
  const b = bucketTasks(tasks, today);
  assert.deepEqual(b.overdue.map((t) => t.id), ['a']);
  assert.deepEqual(b.today.map((t) => t.id).slice(0, 2), ['c', 'b']); // HIGH trước LOW
  assert.deepEqual(b.today.map((t) => t.id).slice(2).sort(), ['g', 'h']);
  assert.deepEqual(b.upcoming.map((t) => t.id), ['d']);
  assert.equal(b.completed.length, 3);
  assert.equal(b.all.length, tasks.length);
  assert.equal(b.all[b.all.length - 1].status, 'DONE');
});

test('timer: pause/resume accounting', () => {
  const t0 = startTimer({ area_id: 'coding', project_id: null, task_id: null, plannedSeconds: 1500 }, 1_000_000);
  assert.equal(elapsedSeconds(t0, 1_000_000 + 10_500), 10);
  const paused = pauseTimer(t0, 1_000_000 + 20_000);
  assert.equal(elapsedSeconds(paused, 1_000_000 + 999_999), 20); // pause thì không chạy tiếp
  const resumed = resumeTimer(paused, 2_000_000);
  assert.equal(elapsedSeconds(resumed, 2_000_000 + 5_000), 25);
  assert.equal(pauseTimer(paused, 3_000_000), paused);
});

test('timer: stored value validation', () => {
  const t = startTimer({ area_id: 'ielts', project_id: null, task_id: 'x', plannedSeconds: 60 }, Date.now());
  assert.deepEqual(parseStoredTimer(JSON.stringify(t)), t);
  assert.equal(parseStoredTimer(null), null);
  assert.equal(parseStoredTimer('not json'), null);
  assert.equal(parseStoredTimer(JSON.stringify({ ...t, area_id: 'cooking' })), null);
  assert.equal(parseStoredTimer(JSON.stringify({ ...t, accumulatedMs: -5 })), null);
});
