import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { IconAlert, IconCheck } from './icons';

interface ToastItem {
  id: number;
  kind: 'error' | 'info';
  text: string;
}

interface ToastApi {
  error: (text: string) => void;
  info: (text: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const push = useCallback((kind: ToastItem['kind'], text: string) => {
    const id = nextId.current++;
    setItems((prev) => [...prev.slice(-2), { id, kind, text }]);
    window.setTimeout(
      () => setItems((prev) => prev.filter((i) => i.id !== id)),
      kind === 'error' ? 8000 : 4000,
    );
  }, []);

  const api = useMemo<ToastApi>(
    () => ({ error: (t) => push('error', t), info: (t) => push('info', t) }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((item) => (
          <div
            key={item.id}
            className={item.kind === 'error' ? 'toast is-error' : 'toast'}
            role={item.kind === 'error' ? 'alert' : 'status'}
          >
            {item.kind === 'error' ? <IconAlert /> : <IconCheck />}
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
