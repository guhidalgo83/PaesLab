-- MathLabs V2 — Contexto escolar abierto para estudiantes
-- Reemplaza el enfoque institucional de MathLabs V2.
-- No requiere que el colegio contrate ni administre la plataforma.
-- Requiere haber ejecutado database/08_mathlabs_school_architecture.sql.

begin;

create extension if not exists pgcrypto;

create table if not exists public.school_directory (
  id uuid primary key default gen_random_uuid(),
  official_code text,
  name text not null check (char_length(trim(name)) between 3 and 180),
  normalized_name text not null,
  region text not null check (char_length(trim(region)) between 2 and 100),
  commune text not null check (char_length(trim(commune)) between 2 and 100),
  city text not null default '',
  school_type text not null default 'unknown'
    check (school_type in ('municipal','slep','subsidized','private','public','unknown')),
  verification_status text not null default 'community'
    check (verification_status in ('community','verified','inactive')),
  source_type text not null default 'student_submitted'
    check (source_type in ('student_submitted','admin','official_import')),
  created_by uuid references auth.users(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists school_directory_identity_idx
  on public.school_directory (
    normalized_name,
    lower(trim(commune)),
    lower(trim(region))
  );

create index if not exists school_directory_search_idx
  on public.school_directory (lower(name), lower(commune), lower(region));

create table if not exists public.student_school_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid references public.school_directory(id) on delete set null,
  course_id text not null references public.courses(id) on delete restrict,
  study_goal text not null default 'follow_course'
    check (study_goal in ('follow_course','reinforce','prepare_test','free_practice','paes')),
  school_selection_source text not null default 'student'
    check (school_selection_source in ('student','guardian','admin')),
  selected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_study_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_id uuid references public.school_directory(id) on delete set null,
  course_id text not null references public.courses(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 3 and 160),
  event_type text not null default 'test'
    check (event_type in ('test','quiz','homework','guide','class_topic','other')),
  event_date date not null,
  notes text not null default '' check (char_length(notes) <= 2000),
  status text not null default 'pending'
    check (status in ('pending','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_study_events_user_date_idx
  on public.student_study_events(user_id, status, event_date);

create table if not exists public.student_event_topics (
  event_id uuid not null references public.student_study_events(id) on delete cascade,
  topic_id text not null references public.knowledge_topics(id) on delete cascade,
  primary key (event_id, topic_id)
);

-- Triggers de fecha de actualización.
drop trigger if exists school_directory_updated_at on public.school_directory;
create trigger school_directory_updated_at
before update on public.school_directory
for each row execute function public.mathlabs_set_updated_at();

drop trigger if exists student_school_profiles_updated_at on public.student_school_profiles;
create trigger student_school_profiles_updated_at
before update on public.student_school_profiles
for each row execute function public.mathlabs_set_updated_at();

drop trigger if exists student_study_events_updated_at on public.student_study_events;
create trigger student_study_events_updated_at
before update on public.student_study_events
for each row execute function public.mathlabs_set_updated_at();

-- RLS.
alter table public.school_directory enable row level security;
alter table public.student_school_profiles enable row level security;
alter table public.student_study_events enable row level security;
alter table public.student_event_topics enable row level security;

drop policy if exists "Public reads active school directory" on public.school_directory;
create policy "Public reads active school directory"
on public.school_directory
for select
to public
using (
  (is_active and verification_status in ('community','verified'))
  or created_by = auth.uid()
  or public.is_learning_admin()
);

drop policy if exists "Admins manage school directory" on public.school_directory;
create policy "Admins manage school directory"
on public.school_directory
for all
to authenticated
using (public.is_learning_admin())
with check (public.is_learning_admin());

drop policy if exists "Users read own school profile" on public.student_school_profiles;
create policy "Users read own school profile"
on public.student_school_profiles
for select
to authenticated
using (user_id = auth.uid() or public.is_learning_admin());

drop policy if exists "Users insert own school profile" on public.student_school_profiles;
create policy "Users insert own school profile"
on public.student_school_profiles
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users update own school profile" on public.student_school_profiles;
create policy "Users update own school profile"
on public.student_school_profiles
for update
to authenticated
using (user_id = auth.uid() or public.is_learning_admin())
with check (user_id = auth.uid() or public.is_learning_admin());

drop policy if exists "Users delete own school profile" on public.student_school_profiles;
create policy "Users delete own school profile"
on public.student_school_profiles
for delete
to authenticated
using (user_id = auth.uid() or public.is_learning_admin());

drop policy if exists "Users read own study events" on public.student_study_events;
create policy "Users read own study events"
on public.student_study_events
for select
to authenticated
using (user_id = auth.uid() or public.is_learning_admin());

drop policy if exists "Users insert own study events" on public.student_study_events;
create policy "Users insert own study events"
on public.student_study_events
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users update own study events" on public.student_study_events;
create policy "Users update own study events"
on public.student_study_events
for update
to authenticated
using (user_id = auth.uid() or public.is_learning_admin())
with check (user_id = auth.uid() or public.is_learning_admin());

drop policy if exists "Users delete own study events" on public.student_study_events;
create policy "Users delete own study events"
on public.student_study_events
for delete
to authenticated
using (user_id = auth.uid() or public.is_learning_admin());

drop policy if exists "Users read topics from own events" on public.student_event_topics;
create policy "Users read topics from own events"
on public.student_event_topics
for select
to authenticated
using (
  exists (
    select 1
    from public.student_study_events e
    where e.id = student_event_topics.event_id
      and (e.user_id = auth.uid() or public.is_learning_admin())
  )
);

drop policy if exists "Users insert topics into own events" on public.student_event_topics;
create policy "Users insert topics into own events"
on public.student_event_topics
for insert
to authenticated
with check (
  exists (
    select 1
    from public.student_study_events e
    where e.id = student_event_topics.event_id
      and e.user_id = auth.uid()
  )
);

drop policy if exists "Users delete topics from own events" on public.student_event_topics;
create policy "Users delete topics from own events"
on public.student_event_topics
for delete
to authenticated
using (
  exists (
    select 1
    from public.student_study_events e
    where e.id = student_event_topics.event_id
      and (e.user_id = auth.uid() or public.is_learning_admin())
  )
);

-- Sugiere un colegio y reutiliza uno igual si ya existe.
create or replace function public.suggest_school(
  p_name text,
  p_region text,
  p_commune text,
  p_city text default ''
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_name text := regexp_replace(trim(p_name), '\s+', ' ', 'g');
  v_normalized text;
  v_region text := regexp_replace(trim(p_region), '\s+', ' ', 'g');
  v_commune text := regexp_replace(trim(p_commune), '\s+', ' ', 'g');
  v_city text := regexp_replace(trim(coalesce(p_city, '')), '\s+', ' ', 'g');
  v_school_id uuid;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión';
  end if;

  if char_length(v_name) < 3 or char_length(v_name) > 180 then
    raise exception 'El nombre del colegio debe tener entre 3 y 180 caracteres';
  end if;

  if char_length(v_region) < 2 or char_length(v_commune) < 2 then
    raise exception 'Debes indicar región y comuna';
  end if;

  if (
    select count(*)
    from public.school_directory
    where created_by = v_user
      and created_at >= now() - interval '24 hours'
  ) >= 5 then
    raise exception 'Alcanzaste el máximo de sugerencias por hoy';
  end if;

  v_normalized := lower(v_name);

  select id into v_school_id
  from public.school_directory
  where normalized_name = v_normalized
    and lower(trim(region)) = lower(v_region)
    and lower(trim(commune)) = lower(v_commune)
  limit 1;

  if v_school_id is not null then
    return v_school_id;
  end if;

  insert into public.school_directory (
    name, normalized_name, region, commune, city,
    verification_status, source_type, created_by, is_active
  ) values (
    v_name, v_normalized, v_region, v_commune, v_city,
    'community', 'student_submitted', v_user, true
  )
  on conflict do nothing
  returning id into v_school_id;

  if v_school_id is null then
    select id into v_school_id
    from public.school_directory
    where normalized_name = v_normalized
      and lower(trim(region)) = lower(v_region)
      and lower(trim(commune)) = lower(v_commune)
    limit 1;
  end if;

  return v_school_id;
end;
$$;

-- Guarda curso y contexto escolar en una sola operación.
create or replace function public.set_my_school_context(
  p_course_id text,
  p_school_id uuid default null,
  p_study_goal text default 'follow_course'
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión';
  end if;

  if p_study_goal not in ('follow_course','reinforce','prepare_test','free_practice','paes') then
    raise exception 'Objetivo de estudio no válido';
  end if;

  if not exists (
    select 1 from public.courses
    where id = p_course_id and is_published = true
  ) then
    raise exception 'Curso no válido';
  end if;

  if p_school_id is not null and not exists (
    select 1 from public.school_directory
    where id = p_school_id
      and is_active = true
      and (
        verification_status in ('community','verified')
        or created_by = v_user
      )
  ) then
    raise exception 'Colegio no válido';
  end if;

  update public.student_course_enrollments
  set is_primary = false, updated_at = now()
  where user_id = v_user and is_primary = true;

  insert into public.student_course_enrollments (
    user_id, course_id, is_primary, status, updated_at
  ) values (
    v_user, p_course_id, true, 'active', now()
  )
  on conflict (user_id, course_id) do update set
    is_primary = true,
    status = 'active',
    updated_at = now();

  insert into public.student_school_profiles (
    user_id, school_id, course_id, study_goal, selected_at, updated_at
  ) values (
    v_user, p_school_id, p_course_id, p_study_goal, now(), now()
  )
  on conflict (user_id) do update set
    school_id = excluded.school_id,
    course_id = excluded.course_id,
    study_goal = excluded.study_goal,
    selected_at = now(),
    updated_at = now();
end;
$$;

revoke all on function public.suggest_school(text,text,text,text)
  from public, anon, authenticated;
grant execute on function public.suggest_school(text,text,text,text)
  to authenticated;

revoke all on function public.set_my_school_context(text,uuid,text)
  from public, anon, authenticated;
grant execute on function public.set_my_school_context(text,uuid,text)
  to authenticated;

grant select on public.school_directory to anon, authenticated;
grant select, insert, update, delete on public.student_school_profiles to authenticated;
grant select, insert, update, delete on public.student_study_events to authenticated;
grant select, insert, delete on public.student_event_topics to authenticated;

commit;
