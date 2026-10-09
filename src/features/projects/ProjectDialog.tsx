import { useState, type FormEvent } from 'react';
import { Dialog } from '../../components/Dialog';
import { IconAlert } from '../../components/icons';
import { useData } from '../../data/DataProvider';
import { areaName } from '../../lib/areas';
import type { Project, ProjectStatus } from '../../types';

export function ProjectDialog({ project, onClose }: { project: Project | null; onClose: () => void }) {
  return (
    <Dialog open={project !== null} onClose={onClose} title="Sửa project">
      {project && <ProjectForm project={project} onClose={onClose} />}
    </Dialog>
  );
}

function ProjectForm({ project, onClose }: { project: Project; onClose: () => void }) {
  const { editProject, removeProject, tasks } = useData();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [nameError, setNameError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const taskCount = tasks.filter((t) => t.project_id === project.id).length;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Hãy nhập tên project.');
      return;
    }
    setNameError(null);
    setBusy(true);
    const ok = await editProject(project.id, {
      name: trimmed,
      description: description.trim() === '' ? null : description.trim(),
      status,
    });
    setBusy(false);
    if (ok) onClose();
  }

  async function onDelete() {
    if (busy) return;
    const extra = taskCount > 0 ? ` ${taskCount} việc trong project sẽ được giữ lại nhưng không còn thuộc project nào.` : '';
    if (!window.confirm(`Xóa project này?${extra}`)) return;
    setBusy(true);
    const ok = await removeProject(project.id);
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="field span-2">
          <label htmlFor="project-name">Tên project</label>
          <input
            id="project-name"
            className="input"
            value={name}
            maxLength={100}
            data-autofocus
            aria-invalid={nameError !== null}
            aria-describedby={nameError ? 'project-name-err' : undefined}
            onChange={(e) => setName(e.target.value)}
          />
          {nameError && (
            <p id="project-name-err" className="field-error" role="alert">
              <IconAlert width={16} height={16} />
              {nameError}
            </p>
          )}
        </div>

        <div className="field">
          <span className="field-label">Lĩnh vực</span>
          <p style={{ minHeight: 'var(--control-h)', display: 'flex', alignItems: 'center' }}>
            {areaName(project.area_id)}
          </p>
        </div>

        <div className="field">
          <label htmlFor="project-status">Trạng thái</label>
          <select
            id="project-status"
            className="select"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          >
            <option value="ACTIVE">Đang làm</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="ARCHIVED">Lưu trữ</option>
          </select>
        </div>

        <div className="field span-2">
          <label htmlFor="project-desc">Mô tả (không bắt buộc)</label>
          <textarea
            id="project-desc"
            className="textarea"
            value={description}
            maxLength={2000}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
        </button>
        <button type="button" className="btn btn-quiet" onClick={onClose}>
          Hủy
        </button>
        <span className="spacer" />
        <button type="button" className="btn btn-danger" onClick={onDelete} disabled={busy}>
          Xóa project
        </button>
      </div>
    </form>
  );
}
