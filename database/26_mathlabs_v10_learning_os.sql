-- MathLabs V10 — Learning OS
-- Centro personalizado, cuaderno de errores, logros, mapa de progreso e informe.
begin;

create table if not exists public.student_learning_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weekly_goal integer not null default 4 check (weekly_goal between 2 and 8),
  preferred_session_minutes integer not null default 20
    check (preferred_session_minutes in (10,15,20,30,45)),
  focus_mode text not null default 'balanced'
    check (focus_mode in ('balanced','reinforcement','challenge')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_achievement_unlocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_code text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_code),
  constraint student_achievement_unlocks_code_check check (
    achievement_code in (
      'DIAGNOSTIC_DONE','FIRST_LESSON','LESSON_EXPLORER',
      'FIRST_PRACTICE','PERFECT_PRACTICE','QUESTION_50',
      'FIRST_MASTERED_TOPIC','FIVE_MASTERED_TOPICS',
      'FIRST_LAB','ALL_LABS','FIRST_REVIEW','TOMO1_MASTER'
    )
  )
);

alter table public.student_learning_preferences enable row level security;
alter table public.student_achievement_unlocks enable row level security;

drop policy if exists "Users read own learning preferences" on public.student_learning_preferences;
create policy "Users read own learning preferences"
on public.student_learning_preferences for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Users read own achievement unlocks" on public.student_achievement_unlocks;
create policy "Users read own achievement unlocks"
on public.student_achievement_unlocks for select to authenticated
using (user_id = auth.uid());

revoke all on table public.student_learning_preferences from anon;
revoke all on table public.student_achievement_unlocks from anon;
revoke insert, update, delete on table public.student_learning_preferences from authenticated;
revoke insert, update, delete on table public.student_achievement_unlocks from authenticated;
grant select on table public.student_learning_preferences to authenticated;
grant select on table public.student_achievement_unlocks to authenticated;

create or replace function public.set_my_learning_preferences(
  p_weekly_goal integer,
  p_preferred_session_minutes integer,
  p_focus_mode text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_goal integer;
  v_minutes integer;
  v_mode text;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión';
  end if;

  v_goal := greatest(2, least(8, coalesce(p_weekly_goal, 4)));

  if p_preferred_session_minutes not in (10,15,20,30,45) then
    v_minutes := 20;
  else
    v_minutes := p_preferred_session_minutes;
  end if;

  if p_focus_mode not in ('balanced','reinforcement','challenge') then
    v_mode := 'balanced';
  else
    v_mode := p_focus_mode;
  end if;

  insert into public.student_learning_preferences (
    user_id, weekly_goal, preferred_session_minutes, focus_mode, updated_at
  )
  values (v_user, v_goal, v_minutes, v_mode, now())
  on conflict (user_id) do update set
    weekly_goal = excluded.weekly_goal,
    preferred_session_minutes = excluded.preferred_session_minutes,
    focus_mode = excluded.focus_mode,
    updated_at = now();

  return jsonb_build_object(
    'weekly_goal', v_goal,
    'preferred_session_minutes', v_minutes,
    'focus_mode', v_mode
  );
end;
$$;

create or replace function public.refresh_my_achievements()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión';
  end if;

  if exists (
    select 1 from public.school_diagnostic_sessions
    where user_id = v_user and status = 'completed'
  ) then
    insert into public.student_achievement_unlocks(user_id, achievement_code)
    values (v_user, 'DIAGNOSTIC_DONE') on conflict do nothing;
  end if;

  if exists (
    select 1 from public.lesson_progress
    where user_id = v_user and status = 'completed'
  ) then
    insert into public.student_achievement_unlocks(user_id, achievement_code)
    values (v_user, 'FIRST_LESSON') on conflict do nothing;
  end if;

  if (
    select count(*) from public.lesson_progress
    where user_id = v_user and status = 'completed'
  ) >= 5 then
    insert into public.student_achievement_unlocks(user_id, achievement_code)
    values (v_user, 'LESSON_EXPLORER') on conflict do nothing;
  end if;

  if exists (
    select 1 from public.school_practice_sessions
    where user_id = v_user and status = 'completed'
  ) then
    insert into public.student_achievement_unlocks(user_id, achievement_code)
    values (v_user, 'FIRST_PRACTICE') on conflict do nothing;
  end if;

  if exists (
    select 1 from public.school_practice_sessions
    where user_id = v_user and status = 'completed' and score_percent = 100
  ) then
    insert into public.student_achievement_unlocks(user_id, achievement_code)
    values (v_user, 'PERFECT_PRACTICE') on conflict do nothing;
  end if;

  if (
    select count(*) from public.school_practice_responses
    where user_id = v_user
  ) >= 50 then
    insert into public.student_achievement_unlocks(user_id, achievement_code)
    values (v_user, 'QUESTION_50') on conflict do nothing;
  end if;

  if exists (
    select 1 from public.student_topic_mastery
    where user_id = v_user and mastery_percent >= 80
  ) then
    insert into public.student_achievement_unlocks(user_id, achievement_code)
    values (v_user, 'FIRST_MASTERED_TOPIC') on conflict do nothing;
  end if;

  if (
    select count(*) from public.student_topic_mastery
    where user_id = v_user and mastery_percent >= 80
  ) >= 5 then
    insert into public.student_achievement_unlocks(user_id, achievement_code)
    values (v_user, 'FIVE_MASTERED_TOPICS') on conflict do nothing;
  end if;

  if exists (
    select 1 from public.student_visual_lab_progress
    where user_id = v_user and completed
  ) then
    insert into public.student_achievement_unlocks(user_id, achievement_code)
    values (v_user, 'FIRST_LAB') on conflict do nothing;
  end if;

  if (
    select count(*) from public.student_visual_lab_progress
    where user_id = v_user and completed
  ) >= 8 then
    insert into public.student_achievement_unlocks(user_id, achievement_code)
    values (v_user, 'ALL_LABS') on conflict do nothing;
  end if;

  if exists (
    select 1 from public.school_review_sessions
    where user_id = v_user and status = 'completed' and score_percent >= 70
  ) then
    insert into public.student_achievement_unlocks(user_id, achievement_code)
    values (v_user, 'FIRST_REVIEW') on conflict do nothing;
  end if;

  if (
    select count(distinct review_set_id)
    from public.school_review_sessions
    where user_id = v_user and status = 'completed' and score_percent >= 70
      and review_set_id in ('tomo1-unidad1','tomo1-unidad2')
  ) >= 2 then
    insert into public.student_achievement_unlocks(user_id, achievement_code)
    values (v_user, 'TOMO1_MASTER') on conflict do nothing;
  end if;

  return (
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'achievement_code', achievement_code,
        'unlocked_at', unlocked_at
      )
      order by unlocked_at
    ), '[]'::jsonb)
    from public.student_achievement_unlocks
    where user_id = v_user
  );
end;
$$;

create or replace function public.get_my_error_notebook(
  p_limit integer default 80
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_limit integer := greatest(1, least(200, coalesce(p_limit, 80)));
  v_result jsonb;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión';
  end if;

  select coalesce(jsonb_agg(row_data order by answered_at desc), '[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object(
      'source', source,
      'source_label', source_label,
      'answered_at', answered_at,
      'prompt', prompt,
      'options', options,
      'selected_option', selected_option,
      'correct_option', correct_option,
      'explanation', explanation,
      'topic_slug', topic_slug,
      'topic_title', topic_title,
      'attempt_count', attempt_count
    ) as row_data,
    answered_at
    from (
      select
        'practice'::text as source,
        'Práctica escolar'::text as source_label,
        max(r.answered_at) as answered_at,
        i.prompt,
        i.options,
        (array_agg(r.selected_option order by r.answered_at desc))[1] as selected_option,
        i.correct_option,
        i.explanation,
        t.slug as topic_slug,
        t.title as topic_title,
        count(*)::integer as attempt_count
      from public.school_practice_responses r
      join public.school_practice_items i on i.id = r.item_id
      join public.knowledge_topics t on t.id = i.topic_id
      where r.user_id = v_user and not r.is_correct
      group by i.id, i.prompt, i.options, i.correct_option, i.explanation, t.slug, t.title

      union all

      select
        'diagnostic'::text,
        'Diagnóstico'::text,
        max(r.responded_at),
        i.prompt,
        i.options,
        (array_agg(r.selected_option order by r.responded_at desc))[1],
        i.correct_option,
        i.explanation,
        t.slug,
        t.title,
        count(*)::integer
      from public.school_diagnostic_responses r
      join public.school_diagnostic_sessions s on s.id = r.session_id
      join public.school_diagnostic_items i on i.id = r.item_id
      join public.knowledge_topics t on t.id = i.topic_id
      where s.user_id = v_user and not r.is_correct
      group by i.id, i.prompt, i.options, i.correct_option, i.explanation, t.slug, t.title

      union all

      select
        'review'::text,
        'Repaso de unidad'::text,
        max(r.answered_at),
        i.prompt,
        i.options,
        (array_agg(r.selected_option order by r.answered_at desc))[1],
        i.correct_option,
        i.explanation,
        null::text,
        rs.title,
        count(*)::integer
      from public.school_review_responses r
      join public.school_review_items i on i.id = r.item_id
      join public.school_review_sets rs on rs.id = i.review_set_id
      where r.user_id = v_user and not r.is_correct
      group by i.id, i.prompt, i.options, i.correct_option, i.explanation, rs.title
    ) errors
    order by answered_at desc
    limit v_limit
  ) limited;

  return v_result;
end;
$$;

create or replace function public.get_my_learning_trend(
  p_course_id text default 'cl-5-basico',
  p_weeks integer default 8
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_weeks integer := greatest(2, least(16, coalesce(p_weeks, 8)));
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión';
  end if;

  return (
    with weeks as (
      select generate_series(
        date_trunc('week', now()) - ((v_weeks - 1) * interval '1 week'),
        date_trunc('week', now()),
        interval '1 week'
      ) as week_start
    ),
    practice as (
      select
        date_trunc('week', completed_at) as week_start,
        count(*)::integer as sessions,
        round(avg(score_percent))::integer as avg_score
      from public.school_practice_sessions
      where user_id = v_user
        and course_id = p_course_id
        and status = 'completed'
        and completed_at >= date_trunc('week', now()) - ((v_weeks - 1) * interval '1 week')
      group by 1
    ),
    questions as (
      select
        date_trunc('week', r.answered_at) as week_start,
        count(*)::integer as questions
      from public.school_practice_responses r
      join public.school_practice_sessions s on s.id = r.session_id
      where r.user_id = v_user
        and s.course_id = p_course_id
        and r.answered_at >= date_trunc('week', now()) - ((v_weeks - 1) * interval '1 week')
      group by 1
    ),
    lesson_activity as (
      select
        date_trunc('week', lp.completed_at) as week_start,
        count(*)::integer as lessons
      from public.lesson_progress lp
      join public.lessons l on l.id = lp.lesson_id
      join public.learning_units u on u.id = l.unit_id
      where lp.user_id = v_user
        and lp.status = 'completed'
        and u.test_type = 'SCHOOL'
        and lp.completed_at >= date_trunc('week', now()) - ((v_weeks - 1) * interval '1 week')
      group by 1
    ),
    lab_activity as (
      select
        date_trunc('week', last_completed_at) as week_start,
        count(*)::integer as labs
      from public.student_visual_lab_progress
      where user_id = v_user
        and completed
        and last_completed_at >= date_trunc('week', now()) - ((v_weeks - 1) * interval '1 week')
      group by 1
    )
    select jsonb_agg(
      jsonb_build_object(
        'week_start', w.week_start,
        'practice_sessions', coalesce(p.sessions, 0),
        'average_score', coalesce(p.avg_score, 0),
        'questions_answered', coalesce(q.questions, 0),
        'lessons_completed', coalesce(l.lessons, 0),
        'labs_completed', coalesce(lb.labs, 0)
      )
      order by w.week_start
    )
    from weeks w
    left join practice p using (week_start)
    left join questions q using (week_start)
    left join lesson_activity l using (week_start)
    left join lab_activity lb using (week_start)
  );
end;
$$;

create or replace function public.get_my_learning_hub(
  p_course_id text default 'cl-5-basico'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_course jsonb;
  v_preferences jsonb;
  v_summary jsonb;
  v_axes jsonb;
  v_priority_topics jsonb;
  v_actions jsonb;
  v_recent jsonb;
  v_focus text;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión';
  end if;

  if not exists (select 1 from public.courses where id = p_course_id) then
    raise exception 'Curso no encontrado';
  end if;

  insert into public.student_learning_preferences(user_id)
  values (v_user)
  on conflict (user_id) do nothing;

  select jsonb_build_object('id', id, 'name', name, 'short_name', short_name)
  into v_course
  from public.courses
  where id = p_course_id;

  select jsonb_build_object(
    'weekly_goal', weekly_goal,
    'preferred_session_minutes', preferred_session_minutes,
    'focus_mode', focus_mode
  ), focus_mode
  into v_preferences, v_focus
  from public.student_learning_preferences
  where user_id = v_user;

  select jsonb_build_object(
    'mastery_percent',
      coalesce(round(avg(coalesce(m.mastery_percent, 0))), 0)::integer,
    'mastered_topics',
      count(*) filter (where coalesce(m.mastery_percent, 0) >= 80)::integer,
    'total_topics',
      count(*)::integer,
    'lessons_completed',
      (
        select count(*)::integer
        from public.lesson_progress lp
        join public.lessons l on l.id = lp.lesson_id
        join public.learning_units u on u.id = l.unit_id
        where lp.user_id = v_user and lp.status = 'completed' and u.test_type = 'SCHOOL'
      ),
    'practice_sessions',
      (
        select count(*)::integer from public.school_practice_sessions
        where user_id = v_user and course_id = p_course_id and status = 'completed'
      ),
    'practice_accuracy',
      coalesce((
        select round(100.0 * count(*) filter (where r.is_correct) / nullif(count(*), 0))::integer
        from public.school_practice_responses r
        join public.school_practice_sessions s on s.id = r.session_id
        where r.user_id = v_user and s.course_id = p_course_id
      ), 0),
    'questions_answered',
      (
        select count(*)::integer
        from public.school_practice_responses r
        join public.school_practice_sessions s on s.id = r.session_id
        where r.user_id = v_user and s.course_id = p_course_id
      ),
    'labs_completed',
      (
        select count(*)::integer from public.student_visual_lab_progress
        where user_id = v_user and completed
      ),
    'labs_total', 8,
    'reviews_completed',
      (
        select count(*)::integer from public.school_review_sessions
        where user_id = v_user and status = 'completed'
      ),
    'latest_diagnostic_score',
      (
        select score_percent
        from public.school_diagnostic_sessions
        where user_id = v_user and course_id = p_course_id and status = 'completed'
        order by completed_at desc nulls last
        limit 1
      ),
    'activities_this_week',
      (
        select
          (
            select count(*) from public.school_practice_sessions
            where user_id = v_user and course_id = p_course_id and status = 'completed'
              and completed_at >= date_trunc('week', now())
          )
          +
          (
            select count(*) from public.lesson_progress
            where user_id = v_user and status = 'completed'
              and completed_at >= date_trunc('week', now())
          )
          +
          (
            select count(*) from public.student_visual_lab_progress
            where user_id = v_user and completed
              and last_completed_at >= date_trunc('week', now())
          )
      )::integer
  )
  into v_summary
  from public.knowledge_topics t
  left join public.student_topic_mastery m
    on m.topic_id = t.id and m.user_id = v_user
  where t.course_id = p_course_id and t.is_published;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'axis_id', x.axis_id,
      'axis_name', x.axis_name,
      'axis_icon', x.axis_icon,
      'mastery_percent', x.mastery_percent,
      'mastered_topics', x.mastered_topics,
      'total_topics', x.total_topics
    ) order by x.sort_order
  ), '[]'::jsonb)
  into v_axes
  from (
    select
      a.id as axis_id,
      a.name as axis_name,
      a.icon as axis_icon,
      a.sort_order,
      coalesce(round(avg(coalesce(m.mastery_percent, 0))), 0)::integer as mastery_percent,
      count(*) filter (where coalesce(m.mastery_percent, 0) >= 80)::integer as mastered_topics,
      count(*)::integer as total_topics
    from public.curriculum_axes a
    join public.knowledge_topics t on t.axis_id = a.id and t.course_id = p_course_id and t.is_published
    left join public.student_topic_mastery m on m.topic_id = t.id and m.user_id = v_user
    where a.course_id = p_course_id and a.is_published
    group by a.id, a.name, a.icon, a.sort_order
  ) x;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'topic_id', x.topic_id,
      'topic_slug', x.topic_slug,
      'topic_title', x.topic_title,
      'axis_name', x.axis_name,
      'mastery_percent', x.mastery_percent,
      'status', x.status,
      'reason', x.reason,
      'priority', x.priority,
      'lesson_slug', x.lesson_slug
    ) order by
      case when v_focus = 'challenge' then -x.mastery_percent else x.mastery_percent end,
      x.priority desc,
      x.sort_order
  ), '[]'::jsonb)
  into v_priority_topics
  from (
    select
      t.id as topic_id,
      t.slug as topic_slug,
      t.title as topic_title,
      a.name as axis_name,
      coalesce(m.mastery_percent, 0)::integer as mastery_percent,
      coalesce(m.status, 'not_started') as status,
      coalesce(
        (
          select r.reason
          from public.student_study_recommendations r
          where r.user_id = v_user and r.topic_id = t.id
            and r.status in ('pending','in_progress')
          order by r.priority desc, r.created_at desc
          limit 1
        ),
        case
          when coalesce(m.mastery_percent, 0) = 0 then 'Tema aún sin evidencia suficiente.'
          when coalesce(m.mastery_percent, 0) < 50 then 'Conviene reforzar este tema.'
          when coalesce(m.mastery_percent, 0) < 80 then 'Está en desarrollo; una práctica puede consolidarlo.'
          else 'Buen dominio. Puedes usarlo como desafío.'
        end
      ) as reason,
      coalesce((
        select max(r.priority)
        from public.student_study_recommendations r
        where r.user_id = v_user and r.topic_id = t.id
          and r.status in ('pending','in_progress')
      ), 1)::integer as priority,
      (
        select l.slug
        from public.lesson_curriculum_links lcl
        join public.lessons l on l.id = lcl.lesson_id
        where lcl.topic_id = t.id and l.is_published
        order by l.sort_order
        limit 1
      ) as lesson_slug,
      t.sort_order
    from public.knowledge_topics t
    join public.curriculum_axes a on a.id = t.axis_id
    left join public.student_topic_mastery m on m.topic_id = t.id and m.user_id = v_user
    where t.course_id = p_course_id and t.is_published
      and (
        v_focus = 'challenge'
        or coalesce(m.mastery_percent, 0) < 80
        or exists (
          select 1 from public.student_study_recommendations r
          where r.user_id = v_user and r.topic_id = t.id
            and r.status in ('pending','in_progress')
        )
      )
    order by
      case when v_focus = 'challenge' then coalesce(m.mastery_percent, 0) end desc nulls last,
      case when v_focus <> 'challenge' then coalesce(m.mastery_percent, 0) end asc nulls last,
      t.sort_order
    limit 8
  ) x;

  with candidates as (
    select
      100 + coalesce(r.priority, 1) as priority,
      'practice'::text as action_type,
      'Practica ' || t.title as title,
      case
        when coalesce(m.mastery_percent,0) < 50 then 'Es una de tus brechas principales.'
        else 'Una práctica puede consolidar este tema.'
      end as description,
      '/practica-escolar/' || t.slug as href,
      '✏️'::text as emoji
    from public.knowledge_topics t
    left join public.student_topic_mastery m on m.topic_id = t.id and m.user_id = v_user
    left join lateral (
      select priority
      from public.student_study_recommendations sr
      where sr.user_id = v_user and sr.topic_id = t.id
        and sr.status in ('pending','in_progress')
      order by priority desc, created_at desc
      limit 1
    ) r on true
    where t.course_id = p_course_id and t.is_published
      and coalesce(m.mastery_percent,0) < 80

    union all

    select
      80,
      'lab',
      'Explora un laboratorio visual',
      'Aprende manipulando modelos antes de volver a los ejercicios.',
      '/laboratorio/5-basico',
      '🧪'
    where (select count(*) from public.student_visual_lab_progress where user_id = v_user and completed) < 8

    union all

    select
      70,
      'review',
      'Desafío de la Unidad 1',
      'Comprueba si los aprendizajes principales de la primera unidad están firmes.',
      '/repaso-escolar/tomo-1-unidad-1',
      '🏁'
    where not exists (
      select 1 from public.school_review_sessions
      where user_id = v_user and review_set_id = 'tomo1-unidad1'
        and status = 'completed' and score_percent >= 70
    )

    union all

    select
      65,
      'review',
      'Desafío de la Unidad 2',
      'Integra decimales, patrones, fracciones y datos.',
      '/repaso-escolar/tomo-1-unidad-2',
      '🏁'
    where not exists (
      select 1 from public.school_review_sessions
      where user_id = v_user and review_set_id = 'tomo1-unidad2'
        and status = 'completed' and score_percent >= 70
    )

    union all

    select
      110,
      'diagnostic',
      'Realiza tu diagnóstico',
      'Necesitamos un punto de partida para personalizar mejor tu ruta.',
      '/diagnostico-escolar',
      '🧭'
    where not exists (
      select 1 from public.school_diagnostic_sessions
      where user_id = v_user and course_id = p_course_id and status = 'completed'
    )
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'action_type', action_type,
      'title', title,
      'description', description,
      'href', href,
      'emoji', emoji,
      'priority', priority
    ) order by priority desc
  ), '[]'::jsonb)
  into v_actions
  from (
    select *
    from candidates
    order by priority desc
    limit 5
  ) selected;

  with activity as (
    select
      'practice'::text as kind,
      'Práctica · ' || t.title as title,
      s.score_percent::integer as score,
      s.completed_at as happened_at
    from public.school_practice_sessions s
    join public.knowledge_topics t on t.id = s.topic_id
    where s.user_id = v_user and s.course_id = p_course_id and s.status = 'completed'

    union all

    select
      'review',
      rs.title,
      s.score_percent::integer,
      s.completed_at
    from public.school_review_sessions s
    join public.school_review_sets rs on rs.id = s.review_set_id
    where s.user_id = v_user and s.status = 'completed'

    union all

    select
      'diagnostic',
      'Diagnóstico de 5° básico',
      s.score_percent::integer,
      s.completed_at
    from public.school_diagnostic_sessions s
    where s.user_id = v_user and s.course_id = p_course_id and s.status = 'completed'

    union all

    select
      'lesson',
      'Lección · ' || l.title,
      lp.best_quiz_score,
      lp.completed_at
    from public.lesson_progress lp
    join public.lessons l on l.id = lp.lesson_id
    join public.learning_units u on u.id = l.unit_id
    where lp.user_id = v_user and lp.status = 'completed' and u.test_type = 'SCHOOL'

    union all

    select
      'lab',
      'Laboratorio · ' || replace(initcap(replace(lab_slug, '-', ' ')), '  ', ' '),
      best_score,
      last_completed_at
    from public.student_visual_lab_progress
    where user_id = v_user and completed
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'kind', kind,
      'title', title,
      'score', score,
      'happened_at', happened_at
    ) order by happened_at desc
  ), '[]'::jsonb)
  into v_recent
  from (
    select * from activity
    where happened_at is not null
    order by happened_at desc
    limit 8
  ) x;

  return jsonb_build_object(
    'course', v_course,
    'preferences', v_preferences,
    'summary', v_summary,
    'axes', v_axes,
    'priority_topics', v_priority_topics,
    'next_actions', v_actions,
    'recent_activity', v_recent
  );
end;
$$;

revoke all on function public.set_my_learning_preferences(integer,integer,text) from public;
revoke all on function public.set_my_learning_preferences(integer,integer,text) from anon;
grant execute on function public.set_my_learning_preferences(integer,integer,text) to authenticated;

revoke all on function public.refresh_my_achievements() from public;
revoke all on function public.refresh_my_achievements() from anon;
grant execute on function public.refresh_my_achievements() to authenticated;

revoke all on function public.get_my_error_notebook(integer) from public;
revoke all on function public.get_my_error_notebook(integer) from anon;
grant execute on function public.get_my_error_notebook(integer) to authenticated;

revoke all on function public.get_my_learning_trend(text,integer) from public;
revoke all on function public.get_my_learning_trend(text,integer) from anon;
grant execute on function public.get_my_learning_trend(text,integer) to authenticated;

revoke all on function public.get_my_learning_hub(text) from public;
revoke all on function public.get_my_learning_hub(text) from anon;
grant execute on function public.get_my_learning_hub(text) to authenticated;

commit;
