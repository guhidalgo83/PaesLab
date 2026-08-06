-- Verificación MathLabs V3

select
  (select count(*) from public.school_diagnostic_items where diagnostic_version = '5b-v1') as preguntas_diagnostico,
  (select count(distinct topic_id) from public.school_diagnostic_items where diagnostic_version = '5b-v1') as temas_evaluados,
  (select count(*) from information_schema.tables where table_schema = 'public' and table_name in (
    'school_diagnostic_items','school_diagnostic_session_items',
    'school_diagnostic_responses','student_study_recommendations'
  )) as tablas_v3_encontradas;

select
  c.relname as tabla,
  c.relrowsecurity as rls_activo
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'school_diagnostic_items','school_diagnostic_session_items',
    'school_diagnostic_responses','student_study_recommendations'
  )
order by c.relname;

select
  p.oid::regprocedure as funcion,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_ejecuta,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_ejecuta,
  has_function_privilege('public', p.oid, 'EXECUTE') as public_ejecuta,
  p.proconfig as configuracion
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'start_school_diagnostic','get_school_diagnostic_question',
    'submit_school_diagnostic_answer','complete_school_diagnostic'
  )
order by p.proname;

select
  i.code,
  t.title as tema,
  i.difficulty,
  i.sort_order,
  i.is_published
from public.school_diagnostic_items i
join public.knowledge_topics t on t.id = i.topic_id
where i.diagnostic_version = '5b-v1'
order by i.sort_order;
