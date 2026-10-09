import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';
import { IconPlus } from '../../components/icons';
import { useData } from '../../data/DataProvider';
import { AREAS, areaName } from '../../lib/areas';
import { readLastArea, rememberArea } from '../../lib/lastArea';
import type { AreaId, Project, ProjectStatus } from '../../types';
import { ProjectDialog } from './ProjectDialog';

const GROUPS: { status: ProjectStatus; title: string }[] = [
  { status: 'ACTIVE', title: 'Đang làm' },
  { status: 'COMPLETED', title: 'Đã hoàn thành' },
  { status: 'ARCHIVED', title: 'Lưu trữ' },
];

export function ProjectsPage() {
  const { projects, tasks, createProject } = useData();
  const [name, setName] = useState('');
  const [areaId, setAreaId] = useState<AreaId>(readLastArea);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const counts = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    for (const t of tasks) {
      if (!t.project_id) continue;
      const c = map.get(t.project_id) ?? { total: 0, done: 0 };
      c.total += 1;
      if (t.status === 'DONE') c.done += 1;
      map.set(t.project_id, c);
    }
    return map;
  }, [tasks]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    const row = await createProject({ name: trimmed, area_id: areaId, description: null });
    setBusy(false);
    if (row) {
      setName('');
      rememberArea(areaId);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dự án</h1>
          <p className="page-sub">Nhóm các việc cùng một mục tiêu lớn, ví dụ ôn thi IELTS hay StudyPlace.</p>
        </div>
      </div>

      <form className="inline-form" onSubmit={onSubmit}>
        <div className="field grow">
          <label htmlFor="new-project-name">Tên project mới</label>
          <input
            id="new-project-name"
            className="input"
            value={name}
            maxLength={100}
            required
            placeholder="Ví dụ: Ôn đề thi thử IELTS"
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="new-project-area">Lĩnh vực</label>
          <select
            id="new-project-area"
            className="select"
            value={areaId}
            onChange={(e) => setAreaId(e.target.value as AreaId)}
          >
            {AREAS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          <IconPlus width={18} height={18} />
          Tạo project
        </button>
      </form>

      {projects.length === 0 ? (
        <EmptyState
          title="Chưa có project nào."
          hint="Tạo project đầu tiên ở biểu mẫu phía trên, rồi gắn việc vào đó khi thêm hoặc sửa việc."
        />
      ) : (
        <div className="stack" style={{ marginTop: 'var(--s6)' }}>
          {GROUPS.map((group) => {
            const list = projects.filter((p) => p.status === group.status);
            if (list.length === 0) return null;
            return (
              <section key={group.status} aria-label={group.title}>
                <div className="section-head">
                  <h2>{group.title}</h2>
                  <span className="section-note">{list.length}</span>
                </div>
                <ul className="project-list">
                  {list.map((p) => {
                    const c = counts.get(p.id) ?? { total: 0, done: 0 };
                    return (
                      <li key={p.id}>
                        <div>
                          <Link className="project-name" to={`/tasks?view=all&project=${p.id}`}>
                            {p.name}
                          </Link>
                          <ul className="meta">
                            <li>{areaName(p.area_id)}</li>
                            <li>
                              {c.total === 0 ? 'Chưa có việc' : `${c.done}/${c.total} việc đã xong`}
                            </li>
                          </ul>
                        </div>
                        <button type="button" className="btn btn-quiet" onClick={() => setEditing(p)}>
                          Sửa
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <ProjectDialog project={editing} onClose={() => setEditing(null)} />
    </>
  );
}
