import { useMemo, useState, type ReactNode } from 'react';
import { useData } from '../../data/DataProvider';
import type { Task } from '../../types';
import { TaskDialog } from './TaskDialog';
import { TaskRow } from './TaskRow';

/** Danh sách việc + hộp thoại sửa. Dùng chung cho Dashboard và trang Tasks. */
export function TaskList({ tasks, empty }: { tasks: Task[]; empty: ReactNode }) {
  const { today, projects, setTaskDone } = useData();
  const [editing, setEditing] = useState<Task | null>(null);
  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  return (
    <>
      {tasks.length === 0 ? (
        empty
      ) : (
        <ul className="task-list">
          {tasks.map((t) => (
            <li key={t.id}>
              <TaskRow
                task={t}
                today={today}
                project={t.project_id ? projectById.get(t.project_id) : undefined}
                onToggle={(task) => void setTaskDone(task.id, task.status !== 'DONE')}
                onOpen={setEditing}
              />
            </li>
          ))}
        </ul>
      )}
      <TaskDialog open={editing !== null} task={editing} onClose={() => setEditing(null)} />
    </>
  );
}
