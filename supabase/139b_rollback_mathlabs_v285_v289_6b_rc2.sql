-- MathLabs v28.5 → v28.9 · 6B RC2 · TARGETED ROLLBACK
-- Run only after an explicit rollback decision. It refuses published/live or unexpected states.
begin;
select public.mathlabs_assert_admin_v22();

do $$
begin
 if (select count(*) from public.deep_learning_paths_v250 where course_id='cl-6-basico' and content_version='v28.5' and status='staging')<>48
    or (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-6-basico' and status='staging' and not is_published)<>1248
    or exists(select 1 from public.deep_learning_paths_v250 where course_id='cl-6-basico' and status='published')
    or exists(select 1 from public.multigrade_assessment_items_v261 where course_id='cl-6-basico' and is_published)
    or coalesce((select live_student_delivery from public.multigrade_course_runtime_gate_v269 where course_id='cl-6-basico'),true)
    or coalesce((select release_candidate from public.multigrade_course_runtime_gate_v269 where course_id='cl-6-basico'),true) then
   raise exception 'Rollback 6B RC2 rechazado: estado distinto del staging exacto esperado';
 end if;

 if (select count(*) from public.deep_learning_paths_v250 where course_id='cl-8-basico' and content_version='v27.5' and status='staging')<>34
   or (select count(*) from public.curriculum_nodes_v254 where course_id='cl-8-basico' and is_active)<>136
   or (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-8-basico')<>884
   or exists(select 1 from public.deep_learning_paths_v250 where course_id='cl-8-basico' and status='published')
   or exists(select 1 from public.multigrade_assessment_items_v261 where course_id='cl-8-basico' and is_published)
   or coalesce((select live_student_delivery from public.multigrade_course_runtime_gate_v269 where course_id='cl-8-basico'),true) then
  raise exception 'Baseline cl-8-basico alterado antes de instalar 6B';
end if;

if (select count(*) from public.deep_learning_paths_v250 where course_id='cl-7-basico' and content_version='v28.0' and status='staging')<>38
   or (select count(*) from public.curriculum_nodes_v254 where course_id='cl-7-basico' and is_active)<>152
   or (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-7-basico')<>988
   or exists(select 1 from public.deep_learning_paths_v250 where course_id='cl-7-basico' and status='published')
   or exists(select 1 from public.multigrade_assessment_items_v261 where course_id='cl-7-basico' and is_published)
   or coalesce((select live_student_delivery from public.multigrade_course_runtime_gate_v269 where course_id='cl-7-basico'),true) then
  raise exception 'Baseline cl-7-basico alterado antes de instalar 6B';
end if;

        if (select count(*) from public.deep_learning_paths_v250 where course_id='cl-1-medio' and content_version='v27.0' and status='staging')<>30
           or (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-1-medio')<>780
           or (select count(*) from public.deep_learning_paths_v250 where course_id='cl-2-medio' and content_version='v26.5' and status='staging')<>24
           or (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-2-medio')<>624
           or (select count(*) from public.deep_learning_paths_v250 where course_id='cl-3-medio' and content_version='v26.0' and status='staging')<>24
           or (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-3-medio')<>624
           or (select count(*) from public.deep_learning_paths_v250 where course_id='cl-4-medio' and status='staging')<>24
           or (select count(*) from public.school_practice_items where code like '4M-V225-P-%' and is_published)<>480
           or (select count(*) from public.school_diagnostic_items where diagnostic_version='4m-fg-v225' and is_published)<>72
           or (select count(*) from public.school_review_items where code like '4M-V225-R-%' and is_published)<>72
           or (select count(*) from public.school_review_sets where id like '4m-fg-v225-%' and is_published)<>4
           or (select count(*) from public.content_releases_v240 where release_key='4m-v240' and status='applied')<>1 then
          raise exception 'Baseline 1M-4M/V24 alterado para 6B RC2';
        end if;
end $$;

create temporary table rc2_topics on commit drop as
select topic_id from public.deep_learning_paths_v250 where course_id='cl-6-basico' and content_version='v28.5';
create temporary table rc2_objectives on commit drop as
select id from public.curriculum_objectives where course_id='cl-6-basico';

delete from public.multigrade_assessment_readiness_v264 where course_id='cl-6-basico';
delete from public.multigrade_assessment_certification_invalidation_v264 where topic_id in (select topic_id from rc2_topics);
delete from public.multigrade_assessment_certification_v264 where course_id='cl-6-basico';
delete from public.multigrade_learning_route_contract_v264 where course_id='cl-6-basico';
delete from public.multigrade_diagnostic_blueprints_v263 where course_id='cl-6-basico';
delete from public.multigrade_adaptive_item_metadata_v262 where course_id='cl-6-basico';
delete from public.multigrade_review_sets_v261 where course_id='cl-6-basico';
delete from public.multigrade_assessment_items_v261 where course_id='cl-6-basico';
delete from public.deep_guided_answer_keys_v253 where topic_id in (select topic_id from rc2_topics);
delete from public.curriculum_topic_readiness_v254 where course_id='cl-6-basico';
delete from public.curriculum_coverage_v254 where course_id='cl-6-basico';
delete from public.curriculum_nodes_v254 where course_id='cl-6-basico';
delete from public.deep_content_quality_v253 where topic_id in (select topic_id from rc2_topics);
delete from public.deep_learning_paths_v250 where course_id='cl-6-basico';
delete from public.curriculum_objective_topics where objective_id in (select id from rc2_objectives);
delete from public.knowledge_topics where course_id='cl-6-basico';
delete from public.curriculum_objectives where course_id='cl-6-basico';
delete from public.curriculum_axes where course_id='cl-6-basico';
delete from public.curriculum_oas_v254 where course_id='cl-6-basico';
delete from public.curriculum_sources_v254 where course_id='cl-6-basico';
delete from public.multigrade_curriculum_source_snapshot_v269 where course_id='cl-6-basico';
delete from public.multigrade_course_runtime_gate_v269 where course_id='cl-6-basico';

update public.mathlabs_course_catalog_v259 set lifecycle_status='planned',content_version=null,updated_at=now() where course_id='cl-6-basico';
update public.mathlabs_course_import_contract_v259 set curriculum_import_status='pending',expected_oa_count=null,expected_topic_count=null,
 source_reference=null,next_action='Regenerar o reinstalar 6B RC2 después de nueva revisión.',updated_at=now() where course_id='cl-6-basico';
update public.mathlabs_course_module_readiness_v259 set readiness_status='planned',refreshed_at=now() where course_id='cl-6-basico';

drop function if exists public.get_v289_6b_expansion_overview();
drop function if exists public.recompute_deep_content_quality_v285_6b(text);

do $$
begin
 if exists(select 1 from public.curriculum_sources_v254 where course_id='cl-6-basico')
or exists(select 1 from public.curriculum_oas_v254 where course_id='cl-6-basico')
or exists(select 1 from public.curriculum_axes where course_id='cl-6-basico')
or exists(select 1 from public.curriculum_objectives where course_id='cl-6-basico')
or exists(select 1 from public.knowledge_topics where course_id='cl-6-basico')
or exists(select 1 from public.deep_learning_paths_v250 where course_id='cl-6-basico')
or exists(select 1 from public.curriculum_nodes_v254 where course_id='cl-6-basico')
or exists(select 1 from public.curriculum_coverage_v254 where course_id='cl-6-basico')
or exists(select 1 from public.curriculum_topic_readiness_v254 where course_id='cl-6-basico')
or exists(select 1 from public.multigrade_assessment_items_v261 where course_id='cl-6-basico')
or exists(select 1 from public.multigrade_review_sets_v261 where course_id='cl-6-basico')
or exists(select 1 from public.multigrade_adaptive_item_metadata_v262 where course_id='cl-6-basico')
or exists(select 1 from public.multigrade_diagnostic_blueprints_v263 where course_id='cl-6-basico')
or exists(select 1 from public.multigrade_learning_route_contract_v264 where course_id='cl-6-basico')
or exists(select 1 from public.multigrade_assessment_certification_v264 where course_id='cl-6-basico')
or exists(select 1 from public.multigrade_assessment_readiness_v264 where course_id='cl-6-basico')
or exists(select 1 from public.multigrade_curriculum_source_snapshot_v269 where course_id='cl-6-basico')
or exists(select 1 from public.multigrade_course_runtime_gate_v269 where course_id='cl-6-basico') then
   raise exception 'Rollback 6B RC2 incompleto; transaction will roll back';
 end if;
 if (select count(*) from public.deep_learning_paths_v250 where course_id='cl-8-basico' and content_version='v27.5' and status='staging')<>34
   or (select count(*) from public.curriculum_nodes_v254 where course_id='cl-8-basico' and is_active)<>136
   or (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-8-basico')<>884
   or exists(select 1 from public.deep_learning_paths_v250 where course_id='cl-8-basico' and status='published')
   or exists(select 1 from public.multigrade_assessment_items_v261 where course_id='cl-8-basico' and is_published)
   or coalesce((select live_student_delivery from public.multigrade_course_runtime_gate_v269 where course_id='cl-8-basico'),true) then
  raise exception 'Baseline cl-8-basico alterado antes de instalar 6B';
end if;

if (select count(*) from public.deep_learning_paths_v250 where course_id='cl-7-basico' and content_version='v28.0' and status='staging')<>38
   or (select count(*) from public.curriculum_nodes_v254 where course_id='cl-7-basico' and is_active)<>152
   or (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-7-basico')<>988
   or exists(select 1 from public.deep_learning_paths_v250 where course_id='cl-7-basico' and status='published')
   or exists(select 1 from public.multigrade_assessment_items_v261 where course_id='cl-7-basico' and is_published)
   or coalesce((select live_student_delivery from public.multigrade_course_runtime_gate_v269 where course_id='cl-7-basico'),true) then
  raise exception 'Baseline cl-7-basico alterado antes de instalar 6B';
end if;

        if (select count(*) from public.deep_learning_paths_v250 where course_id='cl-1-medio' and content_version='v27.0' and status='staging')<>30
           or (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-1-medio')<>780
           or (select count(*) from public.deep_learning_paths_v250 where course_id='cl-2-medio' and content_version='v26.5' and status='staging')<>24
           or (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-2-medio')<>624
           or (select count(*) from public.deep_learning_paths_v250 where course_id='cl-3-medio' and content_version='v26.0' and status='staging')<>24
           or (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-3-medio')<>624
           or (select count(*) from public.deep_learning_paths_v250 where course_id='cl-4-medio' and status='staging')<>24
           or (select count(*) from public.school_practice_items where code like '4M-V225-P-%' and is_published)<>480
           or (select count(*) from public.school_diagnostic_items where diagnostic_version='4m-fg-v225' and is_published)<>72
           or (select count(*) from public.school_review_items where code like '4M-V225-R-%' and is_published)<>72
           or (select count(*) from public.school_review_sets where id like '4m-fg-v225-%' and is_published)<>4
           or (select count(*) from public.content_releases_v240 where release_key='4m-v240' and status='applied')<>1 then
          raise exception 'Baseline 1M-4M/V24 alterado para 6B RC2';
        end if;
end $$;

commit;
