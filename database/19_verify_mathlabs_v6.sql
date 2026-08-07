-- MathLabs V6 — verificación de 5.º básico completo
select
  count(*) filter (where test_type='SCHOOL') as unidades_escolares,
  (select count(*) from public.lessons l join public.learning_units u on u.id=l.unit_id where u.test_type='SCHOOL' and l.is_published=true) as lecciones_escolares,
  (select count(*) from public.lesson_blocks lb join public.lessons l on l.id=lb.lesson_id join public.learning_units u on u.id=l.unit_id where u.test_type='SCHOOL') as bloques_escolares,
  (select count(distinct topic_id) from public.lesson_curriculum_links where lesson_id like 'school-5b-%') as temas_con_leccion,
  (select count(distinct topic_id) from public.school_practice_items where course_id='cl-5-basico' and is_published=true) as temas_con_practica,
  (select count(*) from public.school_practice_items where course_id='cl-5-basico' and is_published=true) as preguntas_practica
from public.learning_units;

select u.title as unidad,count(distinct l.id) as lecciones,count(lb.id) as bloques,count(*) filter(where lb.block_type='math_model') as modelos
from public.learning_units u join public.lessons l on l.unit_id=u.id join public.lesson_blocks lb on lb.lesson_id=l.id
where u.test_type='SCHOOL' and u.is_published=true
group by u.id,u.title,u.sort_order order by u.sort_order;

select kt.sort_order,kt.title,count(spi.id) as preguntas,kt.content_status,kt.is_published
from public.knowledge_topics kt left join public.school_practice_items spi on spi.topic_id=kt.id and spi.is_published=true
where kt.course_id='cl-5-basico'
group by kt.id,kt.sort_order,kt.title,kt.content_status,kt.is_published order by kt.sort_order;

select diagnostic_version,count(*) as preguntas,count(distinct topic_id) as temas,count(*) filter(where is_published) as publicadas
from public.school_diagnostic_items where course_id='cl-5-basico'
group by diagnostic_version order by diagnostic_version;

select p.oid::regprocedure as funcion,
 has_function_privilege('anon',p.oid,'EXECUTE') as anon_ejecuta,
 has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_ejecuta,
 has_function_privilege('public',p.oid,'EXECUTE') as public_ejecuta
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='start_school_diagnostic';
