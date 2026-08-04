-- PAESLab Aprender V1
-- Ejecutar antes de cargar contenidos.

create extension if not exists pgcrypto;

create table if not exists public.learning_units (
  id text primary key,
  test_type text not null check (test_type in ('M1','M2')),
  axis text not null,
  slug text not null,
  title text not null,
  description text not null default '',
  icon text not null default 'π',
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (test_type, slug)
);

create table if not exists public.lessons (
  id text primary key,
  unit_id text not null references public.learning_units(id) on delete cascade,
  slug text not null unique,
  title text not null,
  summary text not null default '',
  objective text not null default '',
  estimated_minutes integer not null default 15 check (estimated_minutes between 1 and 240),
  difficulty text not null default 'Básico' check (difficulty in ('Básico','Medio','Avanzado')),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  video_url text,
  thumbnail_url text,
  prerequisites text[] not null default '{}',
  tags text[] not null default '{}',
  question_filter jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_blocks (
  id uuid primary key default gen_random_uuid(),
  lesson_id text not null references public.lessons(id) on delete cascade,
  block_type text not null check (block_type in (
    'objective','text','concepts','formula','visual','examples',
    'common_errors','tip','summary','video','practice'
  )),
  title text not null default '',
  content text not null default '',
  data jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null references public.lessons(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  last_block_order integer not null default 0,
  best_quiz_score integer check (best_quiz_score is null or best_quiz_score between 0 and 100),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.lesson_question_links (
  lesson_id text not null references public.lessons(id) on delete cascade,
  question_id text not null references public.questions(id) on delete cascade,
  purpose text not null default 'practice' check (purpose in ('mini_quiz','practice','challenge')),
  sort_order integer not null default 0,
  primary key (lesson_id, question_id, purpose)
);

create table if not exists public.lesson_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null references public.lessons(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  correct_answers integer not null default 0,
  total_questions integer not null default 0,
  answers jsonb not null default '[]'::jsonb,
  completed_at timestamptz not null default now()
);

create table if not exists public.study_plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null references public.lessons(id) on delete cascade,
  reason text not null default '',
  priority integer not null default 3 check (priority between 1 and 5),
  status text not null default 'pending' check (status in ('pending','in_progress','completed','dismissed')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.learning_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null,
  lesson_id text references public.lessons(id) on delete set null,
  points integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_learning_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp integer not null default 0,
  level integer not null default 1,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date date,
  lessons_completed integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists lessons_unit_sort_idx on public.lessons(unit_id, sort_order);
create index if not exists lesson_blocks_lesson_sort_idx on public.lesson_blocks(lesson_id, sort_order);
create index if not exists lesson_progress_user_status_idx on public.lesson_progress(user_id, status);
create index if not exists study_plan_user_status_idx on public.study_plan_items(user_id, status, priority);

create or replace function public.learning_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists learning_units_updated_at on public.learning_units;
create trigger learning_units_updated_at before update on public.learning_units
for each row execute function public.learning_set_updated_at();

drop trigger if exists lessons_updated_at on public.lessons;
create trigger lessons_updated_at before update on public.lessons
for each row execute function public.learning_set_updated_at();

drop trigger if exists lesson_blocks_updated_at on public.lesson_blocks;
create trigger lesson_blocks_updated_at before update on public.lesson_blocks
for each row execute function public.learning_set_updated_at();

drop trigger if exists lesson_progress_updated_at on public.lesson_progress;
create trigger lesson_progress_updated_at before update on public.lesson_progress
for each row execute function public.learning_set_updated_at();

drop trigger if exists study_plan_items_updated_at on public.study_plan_items;
create trigger study_plan_items_updated_at before update on public.study_plan_items
for each row execute function public.learning_set_updated_at();

create or replace function public.is_learning_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.complete_learning_lesson(
  p_lesson_id text,
  p_quiz_score integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_was_completed boolean := false;
  v_today date := current_date;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión';
  end if;

  select (status = 'completed') into v_was_completed
  from public.lesson_progress
  where user_id = v_user and lesson_id = p_lesson_id;

  insert into public.lesson_progress (
    user_id, lesson_id, status, progress_percent, best_quiz_score,
    started_at, completed_at
  ) values (
    v_user, p_lesson_id, 'completed', 100, p_quiz_score,
    now(), now()
  )
  on conflict (user_id, lesson_id) do update set
    status = 'completed',
    progress_percent = 100,
    best_quiz_score = greatest(
      coalesce(public.lesson_progress.best_quiz_score, 0),
      coalesce(excluded.best_quiz_score, 0)
    ),
    completed_at = coalesce(public.lesson_progress.completed_at, now());

  if not coalesce(v_was_completed, false) then
    insert into public.learning_activity_log (
      user_id, activity_type, lesson_id, points, metadata
    ) values (
      v_user, 'lesson_completed', p_lesson_id, 50,
      jsonb_build_object('quiz_score', p_quiz_score)
    );

    insert into public.user_learning_stats (
      user_id, xp, level, current_streak, longest_streak,
      last_activity_date, lessons_completed
    ) values (
      v_user, 50, 1, 1, 1, v_today, 1
    )
    on conflict (user_id) do update set
      xp = public.user_learning_stats.xp + 50,
      level = floor((public.user_learning_stats.xp + 50) / 250.0)::integer + 1,
      current_streak = case
        when public.user_learning_stats.last_activity_date = v_today then public.user_learning_stats.current_streak
        when public.user_learning_stats.last_activity_date = v_today - 1 then public.user_learning_stats.current_streak + 1
        else 1
      end,
      longest_streak = greatest(
        public.user_learning_stats.longest_streak,
        case
          when public.user_learning_stats.last_activity_date = v_today then public.user_learning_stats.current_streak
          when public.user_learning_stats.last_activity_date = v_today - 1 then public.user_learning_stats.current_streak + 1
          else 1
        end
      ),
      last_activity_date = v_today,
      lessons_completed = public.user_learning_stats.lessons_completed + 1,
      updated_at = now();
  end if;
end;
$$;

grant execute on function public.complete_learning_lesson(text, integer) to authenticated;

alter table public.learning_units enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_blocks enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.lesson_question_links enable row level security;
alter table public.lesson_quiz_attempts enable row level security;
alter table public.study_plan_items enable row level security;
alter table public.learning_activity_log enable row level security;
alter table public.user_learning_stats enable row level security;

-- Lectura pública de contenido publicado.
drop policy if exists "Public reads published units" on public.learning_units;
create policy "Public reads published units" on public.learning_units
for select to public using (is_published or public.is_learning_admin());

drop policy if exists "Public reads published lessons" on public.lessons;
create policy "Public reads published lessons" on public.lessons
for select to public using (is_published or public.is_learning_admin());

drop policy if exists "Public reads published lesson blocks" on public.lesson_blocks;
create policy "Public reads published lesson blocks" on public.lesson_blocks
for select to public using (
  exists (
    select 1 from public.lessons l
    where l.id = lesson_blocks.lesson_id
      and (l.is_published or public.is_learning_admin())
  )
);

drop policy if exists "Public reads lesson question links" on public.lesson_question_links;
create policy "Public reads lesson question links" on public.lesson_question_links
for select to public using (
  exists (
    select 1 from public.lessons l
    where l.id = lesson_question_links.lesson_id
      and (l.is_published or public.is_learning_admin())
  )
);

-- Administración completa de contenido.
do $$
declare t text;
begin
  foreach t in array array['learning_units','lessons','lesson_blocks','lesson_question_links'] loop
    execute format('drop policy if exists "Admins manage %s" on public.%I', t, t);
    execute format('create policy "Admins manage %s" on public.%I for all to authenticated using (public.is_learning_admin()) with check (public.is_learning_admin())', t, t);
  end loop;
end $$;

-- Datos personales de aprendizaje.
drop policy if exists "Users manage own lesson progress" on public.lesson_progress;
create policy "Users manage own lesson progress" on public.lesson_progress
for all to authenticated using (user_id = auth.uid() or public.is_learning_admin())
with check (user_id = auth.uid() or public.is_learning_admin());

drop policy if exists "Users manage own quiz attempts" on public.lesson_quiz_attempts;
create policy "Users manage own quiz attempts" on public.lesson_quiz_attempts
for all to authenticated using (user_id = auth.uid() or public.is_learning_admin())
with check (user_id = auth.uid() or public.is_learning_admin());

drop policy if exists "Users manage own study plan" on public.study_plan_items;
create policy "Users manage own study plan" on public.study_plan_items
for all to authenticated using (user_id = auth.uid() or public.is_learning_admin())
with check (user_id = auth.uid() or public.is_learning_admin());

drop policy if exists "Users read own learning activity" on public.learning_activity_log;
create policy "Users read own learning activity" on public.learning_activity_log
for select to authenticated using (user_id = auth.uid() or public.is_learning_admin());

drop policy if exists "Users read own learning stats" on public.user_learning_stats;
create policy "Users read own learning stats" on public.user_learning_stats
for select to authenticated using (user_id = auth.uid() or public.is_learning_admin());

-- La función de completar lecciones escribe actividad y estadísticas.
grant select, insert, update, delete on public.learning_units, public.lessons,
  public.lesson_blocks, public.lesson_progress, public.lesson_question_links,
  public.lesson_quiz_attempts, public.study_plan_items, public.learning_activity_log,
  public.user_learning_stats to authenticated;
grant select on public.learning_units, public.lessons, public.lesson_blocks,
  public.lesson_question_links to anon;

notify pgrst, 'reload schema';
