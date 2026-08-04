-- Asocia automáticamente preguntas existentes a cada lección.
-- Prioriza coincidencias de palabras clave y luego completa con preguntas del mismo eje.

delete from public.lesson_question_links
where lesson_id like 'm1-%';

insert into public.lesson_question_links (
  lesson_id, question_id, purpose, sort_order
)
select
  l.id,
  q.id,
  case when ranked.rn <= 3 then 'mini_quiz' else 'practice' end,
  ranked.rn
from public.lessons l
join public.learning_units u on u.id = l.unit_id
cross join lateral (
  select
    q0.id,
    row_number() over (
      order by
        case when exists (
          select 1
          from jsonb_array_elements_text(
            coalesce(l.question_filter->'keywords','[]'::jsonb)
          ) keyword
          where q0.unit_name ilike '%' || keyword || '%'
             or q0.skill ilike '%' || keyword || '%'
             or q0.prompt ilike '%' || keyword || '%'
        ) then 0 else 1 end,
        q0.id
    ) as rn
  from public.questions q0
  where q0.is_active = true
    and q0.test_type = u.test_type
    and lower(q0.axis) = lower(u.axis)
  limit 12
) ranked
join public.questions q on q.id = ranked.id
where l.is_published = true
on conflict do nothing;

select
  l.title,
  count(*) filter (where ql.purpose='mini_quiz') as mini_quiz,
  count(*) filter (where ql.purpose='practice') as practica
from public.lessons l
left join public.lesson_question_links ql on ql.lesson_id=l.id
where l.id like 'm1-%'
group by l.id,l.title,l.sort_order
order by l.unit_id,l.sort_order;
