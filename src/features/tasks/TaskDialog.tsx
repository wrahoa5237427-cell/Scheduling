import { useState, type FormEvent } from 'react';
import { Dialog } from '../../components/Dialog';
import { IconAlert } from '../../components/icons';
import { useData } from '../../data/DataProvider';
import { AREAS } from '../../lib/areas';
import type { AreaId, Priority, Task, TaskInput } from '../../types';

interface TaskDialogProps {
  open: boolean;
  /** null = tạo mới */
  task: Task | null;
  initial?: Partial<TaskInput>;
  onClose: () => void;
  onSaved?: () => void;
}

export function TaskDialog({ open, task, initial, onClose, onSaved }: TaskDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={task ? 'Sửa việc' : 'Thêm việc'}>
      <TaskForm task={task} initial={initial} onClose={onClose} onSaved={onSaved} />
    </Dialog>
  );
}

interface TaskFormProps {
  task: Task | null;
  initial?: Partial<TaskInput>;
  onClose: () => void;
  onSaved?: () => void;
}

function TaskForm({ task, initial, onClose, onSaved }: TaskFormProps) {
  const { projects, createTask, editTask, removeTask } = useData();

  const [title, setTitle] = useState(task?.title ?? initial?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? initial?.description ?? '');
  const [areaId, setAreaId] = useState<AreaId>(task?.area_id ?? initial?.area_id ?? 'school');
  const [projectId, setProjectId] = useState<string>(task?.project_id ?? initial?.project_id ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? initial?.priority ?? 'MEDIUM');
  const [due, setDue] = useState<string>(task ? (task.due_date ?? '') : (initial?.due_date ?? ''));
  const [estimate, setEstimate] = useState<string>(
    String(task?.estimated_minutes ?? initial?.estimated_minutes ?? ''),
  );
  const [titleError, setTitleError] = useState<string | null>(null);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const projectOptions = projects.filter(
    (p) => p.area_id === areaId && (p.status === 'ACTIVE' || p.id === projectId),
  );

  function onAreaChange(next: AreaId) {
    setAreaId(next);
    const current = projects.find((p) => p.id === projectId);
    if (current && current.area_id !== next) setProjectId('');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const trimmed = title.trim();
    setTitleError(null);
    setEstimateError(null);

    if (!trimmed) {
      setTitleError('Hãy nhập tên việc.');
      return;
    }
    const est = estimate.trim() === '' ? null : Number(estimate);
    if (est !== null && (!Number.isInteger(est) || est < 1 || est > 1440)) {
      setEstimateError('Nhập số phút nguyên từ 1 đến 1440.');
      return;
    }

    const input: TaskInput = {
      title: trimmed,
      description: description.trim() === '' ? null : description.trim(),
      area_id: areaId,
      project_id: projectId === '' ? null : projectId,
      priority,
      due_date: due === '' ? null : due,
      estimated_minutes: est,
    };

    setBusy(true);
    const ok = task ? await editTask(task.id, input) : (await createTask(input)) !== null;
    setBusy(false);
    if (ok) {
      onSaved?.();
      onClose();
    }
  }

  async function onDelete() {
    if (!task || busy) return;
    if (!window.confirm('Xóa việc này? Không thể hoàn tác.')) return;
    setBusy(true);
    const ok = await removeTask(task.id);
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="field span-2">
          <label htmlFor="task-title">Tên việc</label>
          <input
            id="task-title"
            className="input"
            value={title}
            maxLength={200}
            data-autofocus
            aria-invalid={titleError !== null}
            aria-describedby={titleError ? 'task-title-err' : undefined}
            onChange={(e) => setTitle(e.target.value)}
          />
          {titleError && (
            <p id="task-title-err" className="field-error" role="alert">
              <IconAlert width={16} height={16} />
              {titleError}
            </p>
          )}
        </div>

        <div className="field span-2">
          <label htmlFor="task-desc">Ghi chú (không bắt buộc)</label>
          <textarea
            id="task-desc"
            className="textarea"
            value={description}
            maxLength={5000}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="task-area">Lĩnh vực</label>
          <select
            id="task-area"
            className="select"
            value={areaId}
            onChange={(e) => onAreaChange(e.target.value as AreaId)}
          >
            {AREAS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="task-project">Project</label>
          <select
            id="task-project"
            className="select"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">Không thuộc project nào</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="task-due">Hạn</label>
          <input
            id="task-due"
            className="input"
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="task-priority">Ưu tiên</label>
          <select
            id="task-priority"
            className="select"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            <option value="HIGH">Cao</option>
            <option value="MEDIUM">Vừa</option>
            <option value="LOW">Thấp</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="task-est">Ước tính (phút)</label>
          <input
            id="task-est"
            className="input"
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            value={estimate}
            aria-invalid={estimateError !== null}
            aria-describedby={estimateError ? 'task-est-err' : undefined}
            onChange={(e) => setEstimate(e.target.value)}
          />
          {estimateError && (
            <p id="task-est-err" className="field-error" role="alert">
              <IconAlert width={16} height={16} />
              {estimateError}
            </p>
          )}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Đang lưu…' : task ? 'Lưu thay đổi' : 'Thêm việc'}
        </button>
        <button type="button" className="btn btn-quiet" onClick={onClose}>
          Hủy
        </button>
        <span className="spacer" />
        {task && (
          <button type="button" className="btn btn-danger" onClick={onDelete} disabled={busy}>
            Xóa việc
          </button>
        )}
      </div>
    </form>
  );
}
