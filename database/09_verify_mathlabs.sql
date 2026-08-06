-- Verificación de MathLabs V1
select count(*) as niveles from public.education_levels;
select count(*) as cursos from public.courses;
select count(*) as ejes_5_basico from public.curriculum_axes where course_id = 'cl-5-basico';
select count(*) as objetivos_5_basico from public.curriculum_objectives where course_id = 'cl-5-basico';
select count(*) as temas_5_basico from public.knowledge_topics where course_id = 'cl-5-basico';
select count(*) as prerrequisitos from public.topic_prerequisites;

select
  a.name as eje,
  count(distinct o.id) as objetivos,
  count(distinct t.id) as temas
from public.curriculum_axes a
left join public.curriculum_objectives o on o.axis_id = a.id
left join public.knowledge_topics t on t.axis_id = a.id
where a.course_id = 'cl-5-basico'
group by a.id, a.name, a.sort_order
order by a.sort_order;
