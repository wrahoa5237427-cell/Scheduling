import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';
import { IconClose } from '../../components/icons';
import { useData } from '../../data/DataProvider';
import { AREAS, AREA_IDS } from '../../lib/areas';
import { bucketTasks } from '../../lib/stats';
import type { AreaId } from '../../types';
import { QuickAdd } from './QuickAdd';
import { TaskList } from './TaskList';

const VIEWS = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'overdue', label: 'Quá hạn' },
  { key: 'all', label: 'Tất cả' },
  { key: 'done', label: 'Đã xong' },
] as const;

type ViewKey = (typeof VIEWS)[number]['key'];

const EMPTY: Record<ViewKey, { title: string; hint?: string }> = {
  today: { title: 'Hôm nay chưa có việc nào.', hint: 'Lịch trống, tận hưởng nhé.' },
  upcoming: { title: 'Chưa có việc nào có hạn trong 7 ngày tới.' },
  overdue: { title: 'Không có việc nào quá hạn.', hint: 'Mọi thứ đang đúng hạn.' },
  all: { title: 'Chưa có việc nào.', hint: 'Thêm việc đầu tiên ở ô phía trên.' },
  done: { title: 'Chưa có việc nào hoàn thành.' },
};

function isViewKey(v: string | null): v is ViewKey {
  return VIEWS.some((x) => x.key === v);
}

export function TasksPage() {
  const { tasks, projects, today } = useData();
  const [params, setParams] = useSearchParams();

  const rawView = params.get('view');
  const view: ViewKey = isViewKey(rawView) ? rawView : 'today';
  const rawArea = params.get('area');
  const area = rawArea && (AREA_IDS as string[]).includes(rawArea) ? (rawArea as AreaId) : null;
  const projectId = params.get('project');
  const project = projectId ? projects.find((p) => p.id === projectId) : undefined;

  const filtered = useMemo(
    () =>
      tasks.filter(
        (t) => (area === null || t.area_id === area) && (!project || t.project_id === project.id),
      ),
    [tasks, area, project],
  );
  const buckets = useMemo(() => bucketTasks(filtered, today), [filtered, today]);

  const lists: Record<ViewKey, typeof buckets.today> = {
    today: buckets.today,
    upcoming: buckets.upcoming,
    overdue: buckets.overdue,
    all: buckets.all,
    done: buckets.completed,
  };

  function linkFor(key: ViewKey): string {
    const next = new URLSearchParams(params);
    next.set('view', key);
    return `/tasks?${next.toString()}`;
  }

  function setParam(name: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  }

  const canAdd = view !== 'overdue' && view !== 'done';

  return (
    <>
      <div className="page-head">
        <h1>Công việc</h1>
      </div>

      <nav className="tabs" aria-label="Chế độ xem">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            to={linkFor(v.key)}
            aria-current={v.key === view ? 'page' : undefined}
          >
            {v.label}
            <span className="count">{lists[v.key].length}</span>
          </Link>
        ))}
      </nav>

      <div className="toolbar">
        <label className="opt">
          <span>Lĩnh vực</span>
          <select
            className="select"
            value={area ?? ''}
            onChange={(e) => setParam('area', e.target.value || null)}
          >
            <option value="">Tất cả</option>
            {AREAS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>

        {project && (
          <span className="filter-chip">
            Project: {project.name}
            <button type="button" aria-label="Bỏ lọc project" onClick={() => setParam('project', null)}>
              <IconClose />
            </button>
          </span>
        )}
      </div>

      {canAdd && <QuickAdd key={view} defaultDue={view === 'today' ? today : null} />}

      <TaskList
        tasks={lists[view]}
        empty={<EmptyState title={EMPTY[view].title} hint={EMPTY[view].hint} />}
      />
    </>
  );
}
