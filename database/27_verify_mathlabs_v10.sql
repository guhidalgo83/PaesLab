-- MathLabs V10 — verificación

select
  to_regclass('public.student_learning_preferences') is not null as preferencias_existe,
  to_regclass('public.student_achievement_unlocks') is not null as logros_existe;

select
  c.relname as tabla,
  c.relrowsecurity as rls_activo
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('student_learning_preferences','student_achievement_unlocks')
order by c.relname;

select
  p.oid::regprocedure as funcion,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_ejecuta,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_ejecuta,
  has_function_privilege('public', p.oid, 'EXECUTE') as public_ejecuta
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'set_my_learning_preferences',
    'refresh_my_achievements',
    'get_my_error_notebook',
    'get_my_learning_trend',
    'get_my_learning_hub'
  )
order by p.proname;

select
  to_regprocedure('public.get_my_learning_hub(text)') is not null as hub_existe,
  to_regprocedure('public.get_my_error_notebook(integer)') is not null as cuaderno_errores_existe,
  to_regprocedure('public.refresh_my_achievements()') is not null as logros_rpc_existe;
