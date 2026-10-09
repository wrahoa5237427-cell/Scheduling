import { useRef, useState, type FormEvent } from 'react';
import { useData } from '../../data/DataProvider';
import { AREAS } from '../../lib/areas';
import { readLastArea, rememberArea } from '../../lib/lastArea';
import type { AreaId } from '../../types';
import { IconPlus } from '../../components/icons';
import { TaskDialog } from './TaskDialog';

/** Thêm việc trong vài giây: gõ tên, Enter. Muốn thêm chi tiết thì mở hộp thoại đầy đủ. */
export function QuickAdd({ defaultDue }: { defaultDue: string | null }) {
  const { createTask } = useData();
  const [title, setTitle] = useState('');
  const [areaId, setAreaId] = useState<AreaId>(readLastArea);
  const [due, setDue] = useState(defaultDue ?? '');
  const [busy, setBusy] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || busy) {
      inputRef.current?.focus();
      return;
    }
    setBusy(true);
    const row = await createTask({
      title: trimmed,
      description: null,
      area_id: areaId,
      project_id: null,
      priority: 'MEDIUM',
      due_date: due === '' ? null : due,
      estimated_minutes: null,
    });
    setBusy(false);
    if (row) {
      setTitle('');
      inputRef.current?.focus();
    }
  }

  return (
    <>
      <form className="quick-add" onSubmit={onSubmit}>
        <div className="quick-add-main">
          <label className="visually-hidden" htmlFor="quick-title">
            Tên việc mới
          </label>
          <input
            id="quick-title"
            ref={inputRef}
            className="input"
            value={title}
            maxLength={200}
            placeholder="Ví dụ: Làm bài hình học"
            autoComplete="off"
            onChange={(e) => setTitle(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            <IconPlus width={18} height={18} />
            Thêm việc
          </button>
        </div>
        <div className="quick-add-opts">
          <label className="opt">
            <span>Lĩnh vực</span>
            <select
              className="select"
              value={areaId}
              onChange={(e) => {
                const next = e.target.value as AreaId;
                setAreaId(next);
                rememberArea(next);
              }}
            >
              {AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="opt">
            <span>Hạn</span>
            <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </label>
          <button type="button" className="btn btn-quiet" onClick={() => setDetailOpen(true)}>
            Thêm chi tiết
          </button>
        </div>
      </form>

      <TaskDialog
        open={detailOpen}
        task={null}
        initial={{ title, area_id: areaId, due_date: due === '' ? null : due }}
        onClose={() => setDetailOpen(false)}
        onSaved={() => setTitle('')}
      />
    </>
  );
}
