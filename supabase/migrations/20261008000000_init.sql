-- Lịch học: schema V1
-- Mọi bảng dữ liệu người dùng đều có user_id (mặc định auth.uid()) + RLS: chỉ chủ sở hữu đọc/ghi.

-- ---------------------------------------------------------------- areas
create table public.areas (
  id         text primary key,
  name       text not null,
  sort_order smallint not null
);

insert into public.areas (id, name, sort_order) values
  ('school',   'School',   1),
  ('ielts',    'IELTS',    2),
  ('math_hsg', 'Math HSG', 3),
  ('review',   'Review',   4),
  ('coding',   'Coding',   5);

-- ---------------------------------------------------------------- projects
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 100),
  area_id     text not null references public.areas (id),
  description text check (char_length(description) <= 2000),
  status      text not null default 'ACTIVE' check (status in ('ACTIVE', 'COMPLETED', 'ARCHIVED')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- tasks
create table public.tasks (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title             text not null check (char_length(btrim(title)) between 1 and 200),
  description       text check (char_length(description) <= 5000),
  area_id           text not null references public.areas (id),
  project_id        uuid references public.projects (id) on delete set null,
  status            text not null default 'TODO' check (status in ('TODO', 'DONE')),
  priority          text not null default 'MEDIUM' check (priority in ('LOW', 'MEDIUM', 'HIGH')),
  due_date          date,
  estimated_minutes integer check (estimated_minutes between 1 and 1440),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  completed_at      timestamptz
);

-- ---------------------------------------------------------------- time_entries
create table public.time_entries (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  area_id          text not null references public.areas (id),
  project_id       uuid references public.projects (id) on delete set null,
  task_id          uuid references public.tasks (id) on delete set null,
  started_at       timestamptz not null,
  ended_at         timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  created_at       timestamptz not null default now(),
  check (ended_at >= started_at)
);

-- ---------------------------------------------------------------- weekly_goals
-- target_minutes = mục tiêu (IELTS, Math...) hoặc giới hạn/budget (Coding). 0 = không đặt.
create table public.weekly_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  area_id        text not null references public.areas (id),
  target_minutes integer not null check (target_minutes between 0 and 10080),
  week_start     date not null check (extract(isodow from week_start) = 1), -- thứ Hai
  created_at     timestamptz not null default now(),
  unique (user_id, area_id, week_start)
);

-- ---------------------------------------------------------------- indexes
create index projects_user_status_idx     on public.projects (user_id, status);
create index tasks_user_status_due_idx    on public.tasks (user_id, status, due_date);
create index tasks_project_idx            on public.tasks (project_id);
create index time_entries_user_start_idx  on public.time_entries (user_id, started_at desc);
create index time_entries_task_idx        on public.time_entries (task_id);
create index time_entries_project_idx     on public.time_entries (project_id);

-- ---------------------------------------------------------------- triggers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- completed_at do DB quản lý: client chỉ cần đổi status.
create or replace function public.set_task_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'DONE' then
    if tg_op = 'UPDATE' and old.status = 'DONE' then
      new.completed_at := coalesce(old.completed_at, now());
    else
      new.completed_at := now();
    end if;
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger tasks_set_completed_at before insert or update on public.tasks
  for each row execute function public.set_task_completed_at();

-- ---------------------------------------------------------------- RLS
alter table public.areas        enable row level security;
alter table public.projects     enable row level security;
alter table public.tasks        enable row level security;
alter table public.time_entries enable row level security;
alter table public.weekly_goals enable row level security;

create policy areas_read on public.areas
  for select to authenticated using (true);

create policy projects_owner on public.projects
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy tasks_owner on public.tasks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy time_entries_owner on public.time_entries
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy weekly_goals_owner on public.weekly_goals
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------- grants (explicit; không phụ thuộc default của Supabase)
revoke all on public.areas, public.projects, public.tasks, public.time_entries, public.weekly_goals from anon;
grant select on public.areas to authenticated;
grant select, insert, update, delete
  on public.projects, public.tasks, public.time_entries, public.weekly_goals
  to authenticated;
