-- PAESLab Aprender V2
-- Conecta errores recientes, progreso de lecciones y plan de estudio.

-- Permite registrar sesiones de práctica específicas por lección.
alter table public.practice_sessions
drop constraint if exists practice_sessions_mode_check;

alter table public.practice_sessions
add constraint practice_sessions_mode_check
check (mode in ('practice', 'adaptive', 'simulation', 'lesson'));

-- Al completar una lección, también completa el elemento del plan personal.
create or replace function public.sync_completed_lesson_to_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed'
     and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    update public.study_plan_items
    set
      status = 'completed',
      updated_at = now()
    where user_id = new.user_id
      and lesson_id = new.lesson_id
      and status <> 'completed';
  end if;

  return new;
end;
$$;

drop trigger if exists lesson_progress_sync_plan
on public.lesson_progress;

create trigger lesson_progress_sync_plan
after insert or update of status
on public.lesson_progress
for each row
execute function public.sync_completed_lesson_to_plan();

-- Genera o actualiza recomendaciones usando errores recientes.
create or replace function public.refresh_my_study_plan(
  p_days integer default 45,
  p_max_items integer default 8
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_affected integer := 0;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión';
  end if;

  if p_days < 1 or p_days > 365 then
    raise exception 'p_days debe estar entre 1 y 365';
  end if;

  if p_max_items < 1 or p_max_items > 24 then
    raise exception 'p_max_items debe estar entre 1 y 24';
  end if;

  with error_scores as (
    select
      lql.lesson_id,
      l.title as lesson_title,
      u.axis,
      count(*)::integer as error_count,
      sum(
        case
          when qa.confidence_level = 'muy_seguro' then 3
          when qa.confidence_level = 'algo_seguro' then 2
          else 1
        end
      )::integer as weighted_errors,
      max(qa.created_at) as last_error_at
    from public.question_attempts qa
    join public.lesson_question_links lql
      on lql.question_id = qa.question_id
    join public.lessons l
      on l.id = lql.lesson_id
     and l.is_published = true
    join public.learning_units u
      on u.id = l.unit_id
     and u.is_published = true
    where qa.user_id = v_user
      and qa.is_correct = false
      and qa.created_at >= now() - make_interval(days => p_days)
      and not exists (
        select 1
        from public.lesson_progress lp
        where lp.user_id = v_user
          and lp.lesson_id = l.id
          and lp.status = 'completed'
      )
    group by lql.lesson_id, l.title, u.axis
  ),
  ranked as (
    select
      *,
      row_number() over (
        order by weighted_errors desc, error_count desc, last_error_at desc
      ) as rn
    from error_scores
  )
  insert into public.study_plan_items (
    user_id,
    lesson_id,
    reason,
    priority,
    status,
    due_date
  )
  select
    v_user,
    lesson_id,
    format(
      'Detectamos %s errores recientes vinculados con %s. Conviene estudiar esta lección antes de seguir practicando.',
      error_count,
      axis
    ),
    case
      when weighted_errors >= 10 then 5
      when weighted_errors >= 6 then 4
      when weighted_errors >= 3 then 3
      else 2
    end,
    'pending',
    current_date + case
      when weighted_errors >= 10 then 2
      when weighted_errors >= 6 then 4
      else 7
    end
  from ranked
  where rn <= p_max_items
  on conflict (user_id, lesson_id) do update set
    reason = excluded.reason,
    priority = greatest(
      public.study_plan_items.priority,
      excluded.priority
    ),
    due_date = least(
      coalesce(public.study_plan_items.due_date, excluded.due_date),
      excluded.due_date
    ),
    status = case
      when public.study_plan_items.status = 'in_progress'
        then 'in_progress'
      else 'pending'
    end,
    updated_at = now()
  where public.study_plan_items.status <> 'completed'
    and (
      public.study_plan_items.status <> 'dismissed'
      or public.study_plan_items.updated_at < now() - interval '14 days'
    );

  get diagnostics v_affected = row_count;
  return v_affected;
end;
$$;

grant execute on function public.refresh_my_study_plan(integer, integer)
to authenticated;

-- Estadística útil para comprobar el módulo.
select
  conname,
  pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.practice_sessions'::regclass
  and conname = 'practice_sessions_mode_check';
