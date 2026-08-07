-- MathLabs V4 — Verificación
select
  (select count(*) from public.lessons where unit_id='school-5b-numeros-operaciones') as lecciones,
  (select count(*) from public.lesson_blocks where lesson_id like 'school-5b-num-%') as bloques,
  (select count(*) from public.school_practice_items where course_id='cl-5-basico' and is_published) as preguntas_practica,
  (select count(distinct topic_id) from public.school_practice_items where course_id='cl-5-basico' and is_published) as temas_con_practica,
  (select count(*) from public.lesson_curriculum_links where lesson_id like 'school-5b-num-%') as vinculos_curriculares;

select l.title,l.estimated_minutes,count(lb.id) as bloques
from public.lessons l left join public.lesson_blocks lb on lb.lesson_id=l.id
where l.unit_id='school-5b-numeros-operaciones'
group by l.id,l.title,l.estimated_minutes,l.sort_order order by l.sort_order;

select t.title,count(i.id) as preguntas
from public.knowledge_topics t left join public.school_practice_items i on i.topic_id=t.id and i.is_published
where t.id in ('topic-ma05-oa-01','topic-ma05-oa-02','topic-ma05-oa-03','topic-ma05-oa-04','topic-ma05-oa-05','topic-ma05-oa-06')
group by t.id,t.title,t.sort_order order by t.sort_order;

select c.relname as tabla,c.relrowsecurity as rls_activo
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('school_practice_items','school_practice_sessions','school_practice_session_items','school_practice_responses') order by c.relname;

select p.oid::regprocedure as funcion,
 has_function_privilege('anon',p.oid,'EXECUTE') as anon_ejecuta,
 has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_ejecuta,
 has_function_privilege('public',p.oid,'EXECUTE') as public_ejecuta
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('start_school_practice','get_school_practice_question','submit_school_practice_answer','complete_school_practice','sync_school_lesson_to_mastery')
order by p.proname;
