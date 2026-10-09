import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import { useData } from '../../data/DataProvider';
import { formatClock } from '../../lib/format';
import {
  elapsedSeconds, parseStoredTimer, pauseTimer, resumeTimer, startTimer,
  type ActiveTimer, type TimerStartInput,
} from '../../lib/timer';
import { useAuth } from '../auth/AuthProvider';

interface TimerValue {
  timer: ActiveTimer | null;
  /** Số giây đã chạy (không tính lúc pause). */
  elapsed: number;
  isRunning: boolean;
  start: (input: TimerStartInput) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  /** Lưu TimeEntry rồi xóa timer. Trả false nếu lưu thất bại (timer được giữ lại, ở trạng thái pause). */
  finish: () => Promise<boolean>;
}

const TimerContext = createContext<TimerValue | null>(null);

function readStored(key: string): ActiveTimer | null {
  try {
    return parseStoredTimer(window.localStorage.getItem(key));
  } catch {
    return null;
  }
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { addEntry } = useData();
  const storageKey = `lichhoc.timer.${session?.user.id ?? 'anon'}`;

  const [timer, setTimer] = useState<ActiveTimer | null>(() => readStored(storageKey));
  const [now, setNow] = useState(() => Date.now());

  // Lưu để reload trang không làm mất phiên đang chạy.
  useEffect(() => {
    try {
      if (timer) window.localStorage.setItem(storageKey, JSON.stringify(timer));
      else window.localStorage.removeItem(storageKey);
    } catch {
      /* localStorage bị chặn: timer vẫn chạy trong phiên này */
    }
  }, [timer, storageKey]);

  const isRunning = timer !== null && timer.runningSince !== null;

  useEffect(() => {
    if (!isRunning) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [isRunning]);

  const elapsed = timer ? elapsedSeconds(timer, now) : 0;

  // Hiện đồng hồ trên tiêu đề tab khi đang chạy.
  useEffect(() => {
    if (!timer) {
      document.title = 'Lịch học';
      return;
    }
    document.title = `${formatClock(elapsed)} · Lịch học`;
  }, [timer, elapsed]);

  const start = useCallback((input: TimerStartInput) => {
    const t = Date.now();
    setNow(t);
    setTimer(startTimer(input, t));
  }, []);

  const pause = useCallback(() => {
    setTimer((prev) => (prev ? pauseTimer(prev, Date.now()) : prev));
  }, []);

  const resume = useCallback(() => {
    setNow(Date.now());
    setTimer((prev) => (prev ? resumeTimer(prev, Date.now()) : prev));
  }, []);

  const cancel = useCallback(() => setTimer(null), []);

  const finish = useCallback(async () => {
    if (!timer) return false;
    const endMs = Date.now();
    const seconds = elapsedSeconds(timer, endMs);
    if (seconds < 1) {
      setTimer(null);
      return true;
    }
    // Dừng đồng hồ ngay để không trôi thêm trong lúc chờ mạng.
    setTimer(pauseTimer(timer, endMs));
    const ok = await addEntry({
      area_id: timer.area_id,
      project_id: timer.project_id,
      task_id: timer.task_id,
      started_at: timer.startedAt,
      ended_at: new Date(endMs).toISOString(),
      duration_seconds: seconds,
    });
    if (ok) setTimer(null);
    return ok;
  }, [timer, addEntry]);

  const value = useMemo<TimerValue>(
    () => ({ timer, elapsed, isRunning, start, pause, resume, cancel, finish }),
    [timer, elapsed, isRunning, start, pause, resume, cancel, finish],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer(): TimerValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used inside TimerProvider');
  return ctx;
}
