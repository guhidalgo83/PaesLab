
-- Verificación de MathLabs V7
select lesson_id,
       count(*) as bloques,
       count(*) filter (where block_type = 'math_model') as modelos,
       count(*) filter (where block_type = 'examples') as ejemplos,
       count(*) filter (where block_type = 'guided_practice') as guiadas,
       max(sort_order) as ultimo_orden
from public.lesson_blocks
where lesson_id in ('school-5b-num-01','school-5b-num-02','school-5b-num-03','school-5b-num-04','school-5b-oa-19','school-5b-oa-20','school-5b-frac-07','school-5b-frac-08','school-5b-frac-09','school-5b-frac-10','school-5b-frac-11','school-5b-frac-12','school-5b-oa-14','school-5b-oa-26')
group by lesson_id
order by lesson_id;

select id, title, estimated_minutes
from public.lessons
where id in ('school-5b-num-01','school-5b-num-02','school-5b-num-03','school-5b-num-04','school-5b-oa-19','school-5b-oa-20','school-5b-frac-07','school-5b-frac-08','school-5b-frac-09','school-5b-frac-10','school-5b-frac-11','school-5b-frac-12','school-5b-oa-14','school-5b-oa-26')
order by id;
