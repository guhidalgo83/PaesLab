-- MathLabs v28.0 → v28.4 · 7B RC2 COMPAT3 · TARGETED ROLLBACK
-- Run only after an explicit rollback decision. It preserves the published 4/19/35 legacy baseline.
begin;
select public.mathlabs_assert_admin_v22();

do $$
begin
 if (select count(*) from public.deep_learning_paths_v250 where course_id='cl-7-basico' and content_version='v28.0' and status='staging')<>38
    or (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-7-basico' and status='staging' and not is_published)<>988
    or exists(select 1 from public.deep_learning_paths_v250 where course_id='cl-7-basico' and status='published')
    or exists(select 1 from public.multigrade_assessment_items_v261 where course_id='cl-7-basico' and is_published)
    or coalesce((select live_student_delivery from public.multigrade_course_runtime_gate_v269 where course_id='cl-7-basico'),true)
    or coalesce((select release_candidate from public.multigrade_course_runtime_gate_v269 where course_id='cl-7-basico'),true) then
   raise exception 'Rollback 7B RC2 COMPAT3 rechazado: estado distinto del staging exacto esperado';
 end if;
 if (select count(*) from public.curriculum_axes where course_id='cl-7-basico')<>8
    or (select count(*) from public.curriculum_axes where course_id='cl-7-basico' and is_published)<>4
    or (select count(*) from public.curriculum_axes where course_id='cl-7-basico'
        and id like 'axis-v280-7b-%' and not is_published)<>4
    or (select count(*) from public.curriculum_objectives where course_id='cl-7-basico')<>19
    or (select count(*) from public.curriculum_objectives where course_id='cl-7-basico' and is_published)<>19
    or exists(select 1 from public.curriculum_objectives where course_id='cl-7-basico'
              and id like 'obj-v280-ma07-%')
    or (select count(*) from public.knowledge_topics where course_id='cl-7-basico')<>73
    or (select count(*) from public.knowledge_topics where course_id='cl-7-basico' and is_published)<>35
    or (select count(*) from public.knowledge_topics where course_id='cl-7-basico'
        and id like 'topic-v280-ma07-%' and slug like 'v280-7b-%' and not is_published)<>38
    or (select count(*) from public.knowledge_topics where course_id='cl-7-basico'
        and id like 'topic-v280-ma07-%' and difficulty in ('Intermedio','Avanzado'))<>38
    or (select count(*) from public.deep_guided_answer_keys_v253
        where topic_id like 'topic-v280-ma07-%' and validation_type='mixed')<>232
    or (select count(*) from public.deep_guided_answer_keys_v253
        where topic_id like 'topic-v280-ma07-%' and validation_type='formula')<>72
    or (select count(*) from public.multigrade_assessment_items_v261
        where course_id='cl-7-basico' and depth between 1 and 3)<>988
    or (select count(*) from public.multigrade_adaptive_item_metadata_v262
        where course_id='cl-7-basico' and depth between 1 and 3)<>988
    or (select count(*) from public.curriculum_objective_topics link
        join public.curriculum_objectives objective on objective.id=link.objective_id
        where objective.course_id='cl-7-basico')<>73
    or (select count(*) from public.mathlabs_course_catalog_v259
        where course_id='cl-7-basico' and lifecycle_status='staging' and content_version='v28.0')<>1 then
   raise exception 'Compat3: preservación legado + staging V28.0 no coincide con el contrato esperado';
 end if;
end $$;

create temporary table rc2_topics on commit drop as
select topic_id from public.deep_learning_paths_v250
where course_id='cl-7-basico' and content_version='v28.0';

create temporary table rc2_knowledge_topics on commit drop as
select id from public.knowledge_topics
where course_id='cl-7-basico' and id like 'topic-v280-ma07-%' and slug like 'v280-7b-%';

delete from public.multigrade_assessment_readiness_v264 where course_id='cl-7-basico';
delete from public.multigrade_assessment_certification_invalidation_v264 where topic_id in (select topic_id from rc2_topics);
delete from public.multigrade_assessment_certification_v264 where course_id='cl-7-basico';
delete from public.multigrade_learning_route_contract_v264 where course_id='cl-7-basico';
delete from public.multigrade_diagnostic_blueprints_v263 where course_id='cl-7-basico';
delete from public.multigrade_adaptive_item_metadata_v262 where course_id='cl-7-basico';
delete from public.multigrade_review_sets_v261 where course_id='cl-7-basico';
delete from public.multigrade_assessment_items_v261 where course_id='cl-7-basico';
delete from public.deep_guided_answer_keys_v253 where topic_id in (select topic_id from rc2_topics);
delete from public.curriculum_topic_readiness_v254 where course_id='cl-7-basico';
delete from public.curriculum_coverage_v254 where course_id='cl-7-basico';
delete from public.curriculum_nodes_v254 where course_id='cl-7-basico';
delete from public.deep_content_quality_v253 where topic_id in (select topic_id from rc2_topics);
delete from public.deep_learning_paths_v250 where course_id='cl-7-basico' and content_version='v28.0';
delete from public.curriculum_objective_topics where topic_id in (select id from rc2_knowledge_topics);
delete from public.knowledge_topics where id in (select id from rc2_knowledge_topics);
delete from public.curriculum_axes where course_id='cl-7-basico' and id like 'axis-v280-7b-%' and not is_published;
delete from public.curriculum_oas_v254 where course_id='cl-7-basico';
delete from public.curriculum_sources_v254 where course_id='cl-7-basico';
delete from public.multigrade_curriculum_source_snapshot_v269 where course_id='cl-7-basico';
delete from public.multigrade_course_runtime_gate_v269 where course_id='cl-7-basico';

update public.mathlabs_course_catalog_v259
set lifecycle_status='planned',content_version=null,updated_at=now()
where course_id='cl-7-basico';

drop function if exists public.get_v284_7b_expansion_overview();
drop function if exists public.recompute_deep_content_quality_v280_7b(text);

select public.refresh_v259_course_architecture();

do $$
begin
 if (select count(*) from public.curriculum_axes where course_id='cl-7-basico')<>4
    or (select count(*) from public.curriculum_axes where course_id='cl-7-basico' and is_published)<>4
    or exists(select 1 from public.curriculum_axes where course_id='cl-7-basico' and id like 'axis-v280-7b-%')
    or (select count(*) from public.curriculum_objectives where course_id='cl-7-basico')<>19
    or (select count(*) from public.curriculum_objectives where course_id='cl-7-basico' and is_published)<>19
    or exists(select 1 from public.curriculum_objectives where course_id='cl-7-basico' and id like 'obj-v280-ma07-%')
    or (select array_agg(code order by code) from public.curriculum_objectives where course_id='cl-7-basico')
       <> array['MA07 OA 01','MA07 OA 02','MA07 OA 03','MA07 OA 04','MA07 OA 05','MA07 OA 06','MA07 OA 07','MA07 OA 08','MA07 OA 09','MA07 OA 10','MA07 OA 11','MA07 OA 12','MA07 OA 13','MA07 OA 14','MA07 OA 15','MA07 OA 16','MA07 OA 17','MA07 OA 18','MA07 OA 19']::text[]
    or (select count(*) from public.knowledge_topics where course_id='cl-7-basico')<>35
    or (select count(*) from public.knowledge_topics where course_id='cl-7-basico' and is_published)<>35
    or exists(select 1 from public.knowledge_topics where course_id='cl-7-basico'
              and (id like 'topic-v280-ma07-%' or slug like 'v280-7b-%'))
    or (select count(*) from public.curriculum_objective_topics link
        join public.curriculum_objectives objective on objective.id=link.objective_id
        where objective.course_id='cl-7-basico')<>35 then
   raise exception 'Compat3: baseline legado publicado de cl-7-basico no coincide con 4/19/35/35';
 end if;

 if exists(select 1 from public.curriculum_sources_v254 where course_id='cl-7-basico')
 or exists(select 1 from public.curriculum_oas_v254 where course_id='cl-7-basico')
 or exists(select 1 from public.deep_learning_paths_v250 where course_id='cl-7-basico')
 or exists(select 1 from public.curriculum_nodes_v254 where course_id='cl-7-basico')
 or exists(select 1 from public.curriculum_coverage_v254 where course_id='cl-7-basico')
 or exists(select 1 from public.curriculum_topic_readiness_v254 where course_id='cl-7-basico')
 or exists(select 1 from public.multigrade_assessment_items_v261 where course_id='cl-7-basico')
 or exists(select 1 from public.multigrade_review_sets_v261 where course_id='cl-7-basico')
 or exists(select 1 from public.multigrade_adaptive_item_metadata_v262 where course_id='cl-7-basico')
 or exists(select 1 from public.multigrade_diagnostic_blueprints_v263 where course_id='cl-7-basico')
 or exists(select 1 from public.multigrade_learning_route_contract_v264 where course_id='cl-7-basico')
 or exists(select 1 from public.multigrade_assessment_certification_v264 where course_id='cl-7-basico')
 or exists(select 1 from public.multigrade_assessment_readiness_v264 where course_id='cl-7-basico')
 or exists(select 1 from public.multigrade_curriculum_source_snapshot_v269 where course_id='cl-7-basico')
 or exists(select 1 from public.multigrade_course_runtime_gate_v269 where course_id='cl-7-basico') then
   raise exception 'Compat3: namespace multigrado V28.0 de cl-7-basico no está limpio';
 end if;

 if (select count(*) from public.mathlabs_course_catalog_v259
     where course_id='cl-7-basico' and lifecycle_status='planned' and content_version is null)<>1 then
   raise exception 'Compat3: catálogo legado de cl-7-basico no está en planned sin versión';
 end if;
 if (select count(*) from public.mathlabs_course_catalog_v259
     where course_id='cl-7-basico' and lifecycle_status='planned' and content_version is null)<>1 then
   raise exception 'Rollback 7B RC2 COMPAT3 incompleto; transaction will roll back';
 end if;
end $$;

commit;
