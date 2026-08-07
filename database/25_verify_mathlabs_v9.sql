-- MathLabs V9 — verificación
select
  to_regclass('public.student_visual_lab_progress') is not null as tabla_progreso_existe,
  (
    select count(*)
    from public.lesson_blocks
    where block_type = 'lab'
      and lesson_id in (
        'school-5b-num-01','school-5b-num-03','school-5b-num-04','school-5b-oa-20',
        'school-5b-frac-10','school-5b-oa-14','school-5b-frac-07','school-5b-oa-26'
      )
  ) as bloques_laboratorio;

select
  c.relname as tabla,
  c.relrowsecurity as rls_activo
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'student_visual_lab_progress';

select
  p.oid::regprocedure as funcion,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_ejecuta,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_ejecuta,
  has_function_privilege('public', p.oid, 'EXECUTE') as public_ejecuta
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'record_visual_lab_result';

select
  lesson_id,
  title,
  data->>'lab_slug' as lab_slug,
  sort_order
from public.lesson_blocks
where block_type = 'lab'
order by lesson_id;
