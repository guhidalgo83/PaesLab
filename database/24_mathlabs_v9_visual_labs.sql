-- MathLabs V9 — Laboratorios visuales interactivos de 5° básico
begin;

create table if not exists public.student_visual_lab_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lab_slug text not null,
  attempts integer not null default 0 check (attempts >= 0),
  last_score integer not null default 0 check (last_score between 0 and 100),
  best_score integer not null default 0 check (best_score between 0 and 100),
  completed boolean not null default false,
  last_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, lab_slug),
  constraint student_visual_lab_progress_slug_check
    check (lab_slug in ('valor-posicional','multiplicacion-visual','division-grupos','medidas-conversion','decimales-cuadricula','patrones-maquina','muro-fracciones','datos-en-accion'))
);

alter table public.student_visual_lab_progress enable row level security;

drop policy if exists "Users read own visual lab progress" on public.student_visual_lab_progress;
create policy "Users read own visual lab progress"
on public.student_visual_lab_progress
for select
to authenticated
using (user_id = auth.uid());

revoke all on table public.student_visual_lab_progress from anon;
revoke insert, update, delete on table public.student_visual_lab_progress from authenticated;
grant select on table public.student_visual_lab_progress to authenticated;

create or replace function public.record_visual_lab_result(
  p_lab_slug text,
  p_score integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_score integer;
  v_attempts integer;
  v_last_score integer;
  v_best_score integer;
  v_completed boolean;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_lab_slug not in ('valor-posicional','multiplicacion-visual','division-grupos','medidas-conversion','decimales-cuadricula','patrones-maquina','muro-fracciones','datos-en-accion') then
    raise exception 'Unknown visual lab';
  end if;

  v_score := greatest(0, least(100, coalesce(p_score, 0)));

  insert into public.student_visual_lab_progress (
    user_id,
    lab_slug,
    attempts,
    last_score,
    best_score,
    completed,
    last_completed_at,
    updated_at
  )
  values (
    v_user_id,
    p_lab_slug,
    1,
    v_score,
    v_score,
    v_score >= 70,
    case when v_score >= 70 then now() else null end,
    now()
  )
  on conflict (user_id, lab_slug)
  do update set
    attempts = public.student_visual_lab_progress.attempts + 1,
    last_score = excluded.last_score,
    best_score = greatest(public.student_visual_lab_progress.best_score, excluded.best_score),
    completed = public.student_visual_lab_progress.completed or excluded.completed,
    last_completed_at = case
      when excluded.completed then now()
      else public.student_visual_lab_progress.last_completed_at
    end,
    updated_at = now()
  returning attempts, last_score, best_score, completed
  into v_attempts, v_last_score, v_best_score, v_completed;

  return jsonb_build_object(
    'lab_slug', p_lab_slug,
    'attempts', v_attempts,
    'last_score', v_last_score,
    'best_score', v_best_score,
    'completed', v_completed
  );
end;
$$;

revoke all on function public.record_visual_lab_result(text, integer) from public;
revoke all on function public.record_visual_lab_result(text, integer) from anon;
grant execute on function public.record_visual_lab_result(text, integer) to authenticated;

-- Permitir un bloque especial de acceso a laboratorio dentro de las lecciones.
alter table public.lesson_blocks
  drop constraint if exists lesson_blocks_block_type_check;

alter table public.lesson_blocks
  add constraint lesson_blocks_block_type_check
  check (
    block_type in (
      'objective','text','concepts','formula','visual','examples',
      'common_errors','tip','summary','video','practice','prerequisites',
      'strategy','guided_practice','math_model','lab'
    )
  );

delete from public.lesson_blocks
where block_type = 'lab'
  and lesson_id in (
    'school-5b-num-01',
    'school-5b-num-03',
    'school-5b-num-04',
    'school-5b-oa-20',
    'school-5b-frac-10',
    'school-5b-oa-14',
    'school-5b-frac-07',
    'school-5b-oa-26'
  );

insert into public.lesson_blocks (lesson_id, block_type, title, content, data, sort_order)
values
  ('school-5b-num-01','lab','Experimenta con el valor posicional','Construye números de seis cifras y observa cómo cambia el valor de cada dígito.','{"lab_slug":"valor-posicional","emoji":"🏙️"}'::jsonb,14),
  ('school-5b-num-03','lab','Construye una multiplicación','Modifica filas y columnas para comprender la multiplicación como grupos iguales.','{"lab_slug":"multiplicacion-visual","emoji":"🏭"}'::jsonb,14),
  ('school-5b-num-04','lab','Reparte y agrupa','Forma grupos iguales y observa cuándo aparece un resto.','{"lab_slug":"division-grupos","emoji":"📦"}'::jsonb,14),
  ('school-5b-oa-20','lab','Cambia de unidad sin cambiar la longitud','Manipula centímetros y observa su equivalencia en milímetros y metros.','{"lab_slug":"medidas-conversion","emoji":"📏"}'::jsonb,14),
  ('school-5b-frac-10','lab','Pinta centésimos','Conecta una cuadrícula de cien partes con fracciones y decimales.','{"lab_slug":"decimales-cuadricula","emoji":"🟦"}'::jsonb,14),
  ('school-5b-oa-14','lab','Construye patrones','Cambia el inicio y la regla para descubrir cómo crece una secuencia.','{"lab_slug":"patrones-maquina","emoji":"⚙️"}'::jsonb,14),
  ('school-5b-frac-07','lab','Construye fracciones equivalentes','Modifica numerador y denominador y compara representaciones equivalentes.','{"lab_slug":"muro-fracciones","emoji":"🧱"}'::jsonb,14),
  ('school-5b-oa-26','lab','Haz hablar a los datos','Modifica valores y observa cómo cambian las barras del gráfico.','{"lab_slug":"datos-en-accion","emoji":"📊"}'::jsonb,14);

commit;
