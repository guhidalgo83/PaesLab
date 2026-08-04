-- Verificación PAESLab V3 - Números
select
  l.title,
  l.estimated_minutes,
  count(lb.id) as bloques,
  count(*) filter (where lb.block_type = 'examples') as bloques_ejemplos,
  count(*) filter (where lb.block_type = 'guided_practice') as practica_guiada
from public.lessons l
join public.lesson_blocks lb on lb.lesson_id = l.id
where l.id in (
  'm1-num-enteros',
  'm1-num-fracciones',
  'm1-num-razones',
  'm1-num-porcentajes',
  'm1-num-potencias',
  'm1-num-financiera'
)
group by l.id, l.title, l.estimated_minutes
order by l.sort_order;

select
  count(*) as total_bloques_numeros
from public.lesson_blocks
where lesson_id in (
  'm1-num-enteros',
  'm1-num-fracciones',
  'm1-num-razones',
  'm1-num-porcentajes',
  'm1-num-potencias',
  'm1-num-financiera'
);
