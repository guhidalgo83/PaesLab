-- MathLabs V5 — verificación
select
  count(distinct l.id) as lecciones,
  count(lb.id) as bloques,
  count(*) filter (where lb.block_type = 'math_model') as modelos_visuales,
  (
    select count(*)
    from public.school_practice_items spi
    where spi.topic_id in (
      'topic-ma05-oa-07','topic-ma05-oa-08','topic-ma05-oa-09',
      'topic-ma05-oa-10','topic-ma05-oa-11','topic-ma05-oa-12',
      'topic-ma05-oa-13'
    )
  ) as preguntas_practica,
  (
    select count(*)
    from public.lesson_curriculum_links lcl
    where lcl.lesson_id like 'school-5b-frac-%'
  ) as vinculos_curriculares
from public.lessons l
join public.lesson_blocks lb on lb.lesson_id = l.id
where l.unit_id = 'school-5b-fracciones-decimales';

select
  kt.title as tema,
  count(spi.id) as preguntas,
  count(*) filter (where spi.difficulty = 'Fundamental') as fundamentales,
  count(*) filter (where spi.difficulty = 'Intermedio') as intermedias,
  count(*) filter (where spi.difficulty = 'Avanzado') as avanzadas
from public.knowledge_topics kt
left join public.school_practice_items spi
  on spi.topic_id = kt.id and spi.is_published = true
where kt.id in (
  'topic-ma05-oa-07','topic-ma05-oa-08','topic-ma05-oa-09',
  'topic-ma05-oa-10','topic-ma05-oa-11','topic-ma05-oa-12',
  'topic-ma05-oa-13'
)
group by kt.id, kt.title, kt.sort_order
order by kt.sort_order;

select
  l.title,
  l.estimated_minutes,
  count(lb.id) as bloques,
  count(*) filter (where lb.block_type = 'examples') as bloques_ejemplos,
  count(*) filter (where lb.block_type = 'guided_practice') as practica_guiada,
  count(*) filter (where lb.block_type = 'math_model') as modelo_visual
from public.lessons l
join public.lesson_blocks lb on lb.lesson_id = l.id
where l.unit_id = 'school-5b-fracciones-decimales'
group by l.id, l.title, l.estimated_minutes, l.sort_order
order by l.sort_order;
