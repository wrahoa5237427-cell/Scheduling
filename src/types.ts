export type AreaId = 'school' | 'ielts' | 'math_hsg' | 'review' | 'coding';

export interface Area {
  id: AreaId;
  name: string;
}

export type TaskStatus = 'TODO' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

// Các type bám sát tên cột trong Postgres (snake_case) để không cần lớp mapping.
export interface Task {
  id: string;
  title: string;
  description: string | null;
  area_id: AreaId;
  project_id: string | null;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null; // YYYY-MM-DD
  estimated_minutes: number | null;
  created_at: string;
  completed_at: string | null;
}

export type TaskInput = Pick<
  Task,
  'title' | 'description' | 'area_id' | 'project_id' | 'priority' | 'due_date' | 'estimated_minutes'
>;

export interface Project {
  id: string;
  name: string;
  area_id: AreaId;
  description: string | null;
  status: ProjectStatus;
  created_at: string;
}

export type ProjectInput = Pick<Project, 'name' | 'area_id' | 'description'>;

export interface TimeEntry {
  id: string;
  area_id: AreaId;
  project_id: string | null;
  task_id: string | null;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
}

export type TimeEntryInput = Omit<TimeEntry, 'id'>;

export interface WeeklyGoal {
  id: string;
  area_id: AreaId;
  target_minutes: number;
  week_start: string; // YYYY-MM-DD (thứ Hai)
}
