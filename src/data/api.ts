// Toàn bộ truy cập database nằm ở đây. RLS ở Postgres đảm bảo chỉ thấy dữ liệu của chính mình,
// nên không cần filter user_id ở client.
import { supabase } from '../lib/supabase';
import type {
  AreaId, Project, ProjectInput, ProjectStatus, Task, TaskInput, TaskStatus,
  TimeEntry, TimeEntryInput, WeeklyGoal,
} from '../types';

function check(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

// ---- tasks
export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5000);
  check(error);
  return (data ?? []) as Task[];
}

export async function insertTask(input: TaskInput): Promise<Task> {
  const { data, error } = await supabase.from('tasks').insert(input).select().single();
  check(error);
  return data as Task;
}

export async function updateTask(
  id: string,
  patch: Partial<TaskInput> & { status?: TaskStatus },
): Promise<Task> {
  const { data, error } = await supabase.from('tasks').update(patch).eq('id', id).select().single();
  check(error);
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  check(error);
}

// ---- projects
export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  check(error);
  return (data ?? []) as Project[];
}

export async function insertProject(input: ProjectInput): Promise<Project> {
  const { data, error } = await supabase.from('projects').insert(input).select().single();
  check(error);
  return data as Project;
}

export async function updateProject(
  id: string,
  patch: Partial<Pick<Project, 'name' | 'description'>> & { status?: ProjectStatus },
): Promise<Project> {
  const { data, error } = await supabase.from('projects').update(patch).eq('id', id).select().single();
  check(error);
  return data as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  check(error);
}

// ---- time entries
export async function fetchTimeEntries(sinceISO: string): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from('time_entries')
    .select('id, area_id, project_id, task_id, started_at, ended_at, duration_seconds')
    .gte('started_at', sinceISO)
    .order('started_at', { ascending: false })
    .limit(5000);
  check(error);
  return (data ?? []) as TimeEntry[];
}

export async function insertTimeEntry(input: TimeEntryInput): Promise<TimeEntry> {
  const { data, error } = await supabase
    .from('time_entries')
    .insert(input)
    .select('id, area_id, project_id, task_id, started_at, ended_at, duration_seconds')
    .single();
  check(error);
  return data as TimeEntry;
}

export async function deleteTimeEntry(id: string): Promise<void> {
  const { error } = await supabase.from('time_entries').delete().eq('id', id);
  check(error);
}

// ---- weekly goals
export async function fetchGoals(): Promise<WeeklyGoal[]> {
  const { data, error } = await supabase
    .from('weekly_goals')
    .select('id, area_id, target_minutes, week_start')
    .order('week_start', { ascending: false })
    .limit(2000);
  check(error);
  return (data ?? []) as WeeklyGoal[];
}

export async function upsertGoals(
  userId: string,
  rows: { area_id: AreaId; target_minutes: number; week_start: string }[],
): Promise<WeeklyGoal[]> {
  const { data, error } = await supabase
    .from('weekly_goals')
    .upsert(
      rows.map((r) => ({ ...r, user_id: userId })),
      { onConflict: 'user_id,area_id,week_start' },
    )
    .select('id, area_id, target_minutes, week_start');
  check(error);
  return (data ?? []) as WeeklyGoal[];
}
