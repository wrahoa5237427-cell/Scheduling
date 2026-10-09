import { IconAlert, IconCheck } from '../../components/icons';
import { areaName } from '../../lib/areas';
import { formatDueLabel } from '../../lib/dates';
import { formatMinutes } from '../../lib/format';
import type { Project, Task } from '../../types';

interface TaskRowProps {
  task: Task;
  today: string;
  project?: Project;
  onToggle: (task: Task) => void;
  onOpen: (task: Task) => void;
}

export function TaskRow({ task, today, project, onToggle, onOpen }: TaskRowProps) {
  const done = task.status === 'DONE';
  const overdue = !done && task.due_date !== null && task.due_date < today;

  return (
    <div className={done ? 'task-row is-done' : 'task-row'}>
      <button
        type="button"
        className="check"
        aria-pressed={done}
        aria-label={`Hoàn thành: ${task.title}`}
        onClick={() => onToggle(task)}
      >
        <span className="check-box">
          <IconCheck />
        </span>
      </button>

      <div className="task-main">
        <button type="button" className="task-title" onClick={() => onOpen(task)}>
          {task.title}
        </button>
        <ul className="meta">
          <li>{areaName(task.area_id)}</li>
          {project && <li>{project.name}</li>}
          {task.due_date !== null && (
            <li className={overdue ? 'is-warn' : undefined}>
              {overdue && <IconAlert />}
              {formatDueLabel(task.due_date, today)}
              {overdue ? ' (quá hạn)' : ''}
            </li>
          )}
          {task.priority === 'HIGH' && <li className="is-high">Ưu tiên cao</li>}
          {task.priority === 'LOW' && <li>Ưu tiên thấp</li>}
          {task.estimated_minutes !== null && <li>Ước tính {formatMinutes(task.estimated_minutes)}</li>}
        </ul>
      </div>
    </div>
  );
}
