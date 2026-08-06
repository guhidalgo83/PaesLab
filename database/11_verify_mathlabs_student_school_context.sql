-- Verificación MathLabs V2 — Contexto escolar abierto

select count(*) as tablas_v2_encontradas
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'school_directory',
    'student_school_profiles',
    'student_study_events',
    'student_event_topics'
  );

select
  c.relname as tabla,
  c.relrowsecurity as rls_activo
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'school_directory',
    'student_school_profiles',
    'student_study_events',
    'student_event_topics'
  )
order by c.relname;

select
  p.oid::regprocedure as funcion,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_ejecuta,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_ejecuta,
  has_function_privilege('public', p.oid, 'EXECUTE') as public_ejecuta,
  p.prosecdef as security_definer,
  p.proconfig as configuracion
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('suggest_school','set_my_school_context')
order by p.proname;

select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
  and tablename in (
    'school_directory',
    'student_school_profiles',
    'student_study_events',
    'student_event_topics'
  )
order by tablename, policyname;
