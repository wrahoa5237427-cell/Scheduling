import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import { useToast } from '../components/Toast';
import { useAuth } from '../features/auth/AuthProvider';
import { parseISODate, startOfWeek, todayISO, weekStartISO } from '../lib/dates';
import type {
  AreaId, Project, ProjectInput, ProjectStatus, Task, TaskInput, TimeEntry, TimeEntryInput, WeeklyGoal,
} from '../types';
import * as api from './api';

type LoadStatus = 'loading' | 'ready' | 'error';

interface DataValue {
  status: LoadStatus;
  error: string | null;
  reload: () => Promise<void>;
  tasks: Task[];
  projects: Project[];
  entries: TimeEntry[]; // từ thứ Hai của tuần hiện tại trở đi
  goals: WeeklyGoal[];
  today: string;
  weekStart: string;
  createTask: (input: TaskInput) => Promise<Task | null>;
  editTask: (id: string, patch: Partial<TaskInput>) => Promise<boolean>;
  setTaskDone: (id: string, done: boolean) => Promise<boolean>;
  removeTask: (id: string) => Promise<boolean>;
  createProject: (input: ProjectInput) => Promise<Project | null>;
  editProject: (
    id: string,
    patch: Partial<Pick<Project, 'name' | 'description'>> & { status?: ProjectStatus },
  ) => Promise<boolean>;
  removeProject: (id: string) => Promise<boolean>;
  addEntry: (input: TimeEntryInput) => Promise<boolean>;
  removeEntry: (id: string) => Promise<boolean>;
  saveGoals: (rows: { area_id: AreaId; target_minutes: number }[]) => Promise<boolean>;
}

const DataContext = createContext<DataValue | null>(null);

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Lỗi không xác định';
}

export function DataProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const { session } = useAuth();
  const userId = session?.user.id ?? '';

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);

  // "Hôm nay" tự cập nhật nếu để tab mở qua nửa đêm.
  const [today, setToday] = useState(() => todayISO());
  useEffect(() => {
    const id = window.setInterval(() => {
      setToday((prev) => {
        const next = todayISO();
        return next === prev ? prev : next;
      });
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);
  const weekStart = useMemo(() => weekStartISO(parseISODate(today)), [today]);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setStatus('loading');
        setError(null);
      }
      try {
        const since = startOfWeek(new Date()).toISOString();
        const [t, p, e, g] = await Promise.all([
          api.fetchTasks(),
          api.fetchProjects(),
          api.fetchTimeEntries(since),
          api.fetchGoals(),
        ]);
        setTasks(t);
        setProjects(p);
        setEntries(e);
        setGoals(g);
        setStatus('ready');
        setError(null);
      } catch (e) {
        if (silent) {
          toast.error(`Không làm mới được dữ liệu: ${errMsg(e)}`);
        } else {
          setError(errMsg(e));
          setStatus('error');
        }
      }
    },
    [toast],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Quay lại tab (hoặc mở từ thiết bị khác) thì làm mới âm thầm.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  const guard = useCallback(
    async <T,>(label: string, fn: () => Promise<T>): Promise<T | null> => {
      try {
        return await fn();
      } catch (e) {
        toast.error(`${label}: ${errMsg(e)}`);
        return null;
      }
    },
    [toast],
  );

  const createTask = useCallback(
    async (input: TaskInput) => {
      const row = await guard('Không thêm được việc', () => api.insertTask(input));
      if (row) setTasks((prev) => [row, ...prev]);
      return row;
    },
    [guard],
  );

  const patchTask = useCallback(
    async (id: string, patch: Parameters<typeof api.updateTask>[1], label: string) => {
      const row = await guard(label, () => api.updateTask(id, patch));
      if (row) setTasks((prev) => prev.map((t) => (t.id === row.id ? row : t)));
      return row !== null;
    },
    [guard],
  );

  const editTask = useCallback(
    (id: string, patch: Partial<TaskInput>) => patchTask(id, patch, 'Không lưu được việc'),
    [patchTask],
  );

  const setTaskDone = useCallback(
    (id: string, done: boolean) =>
      patchTask(id, { status: done ? 'DONE' : 'TODO' }, 'Không cập nhật được trạng thái'),
    [patchTask],
  );

  const removeTask = useCallback(
    async (id: string) => {
      const ok = await guard('Không xóa được việc', async () => {
        await api.deleteTask(id);
        return true;
      });
      if (!ok) return false;
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setEntries((prev) => prev.map((e) => (e.task_id === id ? { ...e, task_id: null } : e)));
      return true;
    },
    [guard],
  );

  const createProject = useCallback(
    async (input: ProjectInput) => {
      const row = await guard('Không tạo được project', () => api.insertProject(input));
      if (row) setProjects((prev) => [row, ...prev]);
      return row;
    },
    [guard],
  );

  const editProject = useCallback(
    async (id: string, patch: Parameters<typeof api.updateProject>[1]) => {
      const row = await guard('Không lưu được project', () => api.updateProject(id, patch));
      if (row) setProjects((prev) => prev.map((p) => (p.id === row.id ? row : p)));
      return row !== null;
    },
    [guard],
  );

  const removeProject = useCallback(
    async (id: string) => {
      const ok = await guard('Không xóa được project', async () => {
        await api.deleteProject(id);
        return true;
      });
      if (!ok) return false;
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setTasks((prev) => prev.map((t) => (t.project_id === id ? { ...t, project_id: null } : t)));
      setEntries((prev) => prev.map((e) => (e.project_id === id ? { ...e, project_id: null } : e)));
      return true;
    },
    [guard],
  );

  const addEntry = useCallback(
    async (input: TimeEntryInput) => {
      const row = await guard('Không lưu được phiên focus', () => api.insertTimeEntry(input));
      if (row) setEntries((prev) => [row, ...prev]);
      return row !== null;
    },
    [guard],
  );

  const removeEntry = useCallback(
    async (id: string) => {
      const ok = await guard('Không xóa được phiên focus', async () => {
        await api.deleteTimeEntry(id);
        return true;
      });
      if (ok) setEntries((prev) => prev.filter((e) => e.id !== id));
      return ok === true;
    },
    [guard],
  );

  const saveGoals = useCallback(
    async (rows: { area_id: AreaId; target_minutes: number }[]) => {
      const saved = await guard('Không lưu được mục tiêu', () =>
        api.upsertGoals(
          userId,
          rows.map((r) => ({ ...r, week_start: weekStart })),
        ),
      );
      if (!saved) return false;
      setGoals((prev) => {
        const byKey = new Map(prev.map((g) => [`${g.area_id}|${g.week_start}`, g]));
        for (const g of saved) byKey.set(`${g.area_id}|${g.week_start}`, g);
        return [...byKey.values()];
      });
      return true;
    },
    [guard, userId, weekStart],
  );

  const value = useMemo<DataValue>(
    () => ({
      status, error, reload: () => load(false),
      tasks, projects, entries, goals, today, weekStart,
      createTask, editTask, setTaskDone, removeTask,
      createProject, editProject, removeProject,
      addEntry, removeEntry, saveGoals,
    }),
    [
      status, error, load, tasks, projects, entries, goals, today, weekStart,
      createTask, editTask, setTaskDone, removeTask,
      createProject, editProject, removeProject, addEntry, removeEntry, saveGoals,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
