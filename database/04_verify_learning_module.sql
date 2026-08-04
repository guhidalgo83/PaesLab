select
  u.test_type,
  u.axis,
  count(distinct l.id) as lecciones,
  count(distinct b.id) as bloques,
  count(distinct ql.question_id) as preguntas_vinculadas
from public.learning_units u
left join public.lessons l on l.unit_id=u.id
left join public.lesson_blocks b on b.lesson_id=l.id
left join public.lesson_question_links ql on ql.lesson_id=l.id
where u.test_type='M1'
group by u.test_type,u.axis,u.sort_order
order by u.sort_order;

select
  count(*) filter (where status='completed') as lecciones_completadas,
  count(*) filter (where status='in_progress') as lecciones_en_progreso
from public.lesson_progress;
