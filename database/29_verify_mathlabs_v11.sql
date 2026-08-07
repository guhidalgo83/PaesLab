-- MathLabs V11 — verificación
select
 (select count(*) from public.curriculum_objectives where course_id='cl-6-basico' and is_published) objetivos_6b,
 (select count(*) from public.knowledge_topics where course_id='cl-6-basico' and is_published) temas_6b,
 (select count(*) from public.learning_units where test_type='SCHOOL' and slug like '6-basico-%' and is_published) unidades_6b,
 (select count(*) from public.lessons where question_filter->>'course_id'='cl-6-basico' and is_published) lecciones_6b,
 (select count(*) from public.lesson_blocks b join public.lessons l on l.id=b.lesson_id where l.question_filter->>'course_id'='cl-6-basico') bloques_6b,
 (select count(*) from public.school_practice_items where course_id='cl-6-basico' and is_published) preguntas_practica_6b,
 (select count(*) from public.school_diagnostic_items where course_id='cl-6-basico' and diagnostic_version='6b-v1' and is_published) preguntas_diagnostico_6b,
 (select count(*) from public.school_review_sets where course_id='cl-6-basico' and is_published) repasos_6b,
 (select count(*) from public.school_review_items i join public.school_review_sets s on s.id=i.review_set_id where s.course_id='cl-6-basico' and i.is_published) preguntas_repaso_6b,
 (select count(*) from public.visual_lab_catalog where course_id='cl-6-basico' and is_published) laboratorios_6b;

select a.name eje,count(distinct o.id) objetivos,count(distinct t.id) temas,
 round(avg(coalesce(q.cnt,0)),1) preguntas_promedio_por_tema
from public.curriculum_axes a
left join public.curriculum_objectives o on o.axis_id=a.id and o.is_published
left join public.knowledge_topics t on t.axis_id=a.id and t.is_published
left join lateral(select count(*)::numeric cnt from public.school_practice_items p where p.topic_id=t.id and p.is_published) q on true
where a.course_id='cl-6-basico'
group by a.id,a.name,a.sort_order order by a.sort_order;

select c.id,c.name,c.is_available,c.curriculum_version
from public.courses c where c.id in('cl-5-basico','cl-6-basico') order by c.sort_order;

select p.oid::regprocedure funcion,
 has_function_privilege('anon',p.oid,'EXECUTE') anon_ejecuta,
 has_function_privilege('authenticated',p.oid,'EXECUTE') authenticated_ejecuta,
 has_function_privilege('public',p.oid,'EXECUTE') public_ejecuta
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in(
 'configure_my_learning_profile','get_my_learning_hub','get_my_active_learning_session',
 'start_my_learning_session','update_my_learning_session_item','complete_my_learning_session',
 'record_visual_lab_result','start_school_diagnostic'
) order by p.proname;

select c.relname tabla,c.relrowsecurity rls_activo
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in('visual_lab_catalog','student_learning_sessions','student_learning_session_items')
order by c.relname;
