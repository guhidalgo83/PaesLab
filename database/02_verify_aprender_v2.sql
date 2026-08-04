-- Verificación de Aprender V2

select
  count(*) as planes_personales
from public.study_plan_items;

select
  count(*) filter (where status = 'in_progress') as lecciones_en_progreso,
  count(*) filter (where status = 'completed') as lecciones_completadas
from public.lesson_progress;

select
  proname
from pg_proc
where proname in (
  'refresh_my_study_plan',
  'sync_completed_lesson_to_plan'
)
order by proname;
