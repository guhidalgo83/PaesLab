-- MathLabs v28.0 → v28.4 · 7B REVIEWED RC2 COMPAT3 verification
select public.mathlabs_assert_admin_v22();
select public.refresh_v269_course_assessment_readiness('cl-7-basico');

do $$
begin
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
   raise exception 'Compat1: preservación legado + staging V28.0 no coincide con el contrato esperado';
 end if;
 if (select count(*) from public.deep_learning_paths_v250 where course_id='cl-8-basico' and content_version='v27.5' and status='staging')<>34
    or (select count(*) from public.curriculum_nodes_v254 where course_id='cl-8-basico' and is_active)<>136
    or (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-8-basico')<>884
    or exists(select 1 from public.deep_learning_paths_v250 where course_id='cl-8-basico' and status='published')
    or exists(select 1 from public.multigrade_assessment_items_v261 where course_id='cl-8-basico' and is_published)
    or coalesce((select live_student_delivery from public.multigrade_course_runtime_gate_v269 where course_id='cl-8-basico'),true) then
   raise exception 'Baseline cl-8-basico alterado antes de instalar 7B';
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
           raise exception 'Baseline 1M-4M/V24 alterado para 7B RC2';
         end if;

 if (select count(*) from public.deep_learning_paths_v250 where course_id='cl-7-basico' and content_version='v28.0')<>38
    or (select count(*) from public.curriculum_nodes_v254 where course_id='cl-7-basico' and is_active)<>152
    or (select count(*) from public.curriculum_coverage_v254 where course_id='cl-7-basico' and auto_state='partial')<>152
    or (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-7-basico')<>988
    or (select count(*) from public.multigrade_adaptive_item_metadata_v262 where course_id='cl-7-basico')<>988
    or (select count(*) from public.multigrade_assessment_readiness_v264 where course_id='cl-7-basico' and auto_gate_pass)<>0 then
   raise exception '7B core counts failed';
 end if;
 if exists(select 1 from public.deep_learning_paths_v250 where course_id='cl-7-basico' and status='published')
    or exists(select 1 from public.multigrade_assessment_items_v261 where course_id='cl-7-basico' and is_published)
    or exists(select 1 from public.multigrade_review_sets_v261 where course_id='cl-7-basico' and is_published)
    or coalesce((select live_student_delivery from public.multigrade_course_runtime_gate_v269 where course_id='cl-7-basico'),true)
    or coalesce((select release_candidate from public.multigrade_course_runtime_gate_v269 where course_id='cl-7-basico'),true) then
   raise exception '7B publication/runtime safety failed';
 end if;
 if (select count(*) from (select lower(regexp_replace(btrim(stem),'\s+',' ','g')) s from public.multigrade_assessment_items_v261 where course_id='cl-7-basico' group by 1 having count(*)>1)d)>0 then
   raise exception '7B duplicate stems detected';
 end if;
 if (select count(*) from public.multigrade_assessment_items_v261 i where i.course_id='cl-7-basico' and jsonb_array_length(i.options)<>4)>0 then
   raise exception '7B bad option count detected';
 end if;
if exists(select 1 from public.multigrade_assessment_items_v261 where course_id='cl-7-basico'
     and (stem ilike '%Alternativa no válida%' or options::text ilike '%Alternativa no válida%')) then
  raise exception '7B RC2 placeholder option detected';
end if;
if (select count(*) from public.multigrade_diagnostic_blueprints_v263 where course_id='cl-7-basico'
     and min_items=19 and target_items=19 and max_items=25
     and (stopping_rules->>'max_minutes')::int=45
     and coalesce((stopping_rules->>'default_limit_from_blueprint')::boolean,false))<>1 then
  raise exception '7B RC2 diagnostic blueprint failed';
end if;
if (select count(*) from public.curriculum_coverage_v254 where course_id='cl-7-basico' and auto_state='strong')<>0
   or (select count(*) from public.curriculum_coverage_v254 where course_id='cl-7-basico' and human_review_status='approved')<>0 then
  raise exception '7B RC2 pre-human-review state is inflated';
end if;
end $$;

select
 (select count(*) from public.knowledge_topics where course_id='cl-7-basico' and is_published) as legacy_published_topics,
 (select count(*) from public.knowledge_topics where course_id='cl-7-basico' and id like 'topic-v280-ma07-%' and not is_published) as v280_staging_knowledge_topics,
 (select count(*) from public.multigrade_curriculum_source_snapshot_v269 where course_id='cl-7-basico') as source_snapshot_table,
 (select count(*) from public.multigrade_course_runtime_gate_v269 where course_id='cl-7-basico') as runtime_gate_table,
 (to_regprocedure('public.refresh_v269_course_assessment_readiness(text)') is not null)::int as readiness_rpc,
 (to_regprocedure('public.preview_v267_adaptive_items(text,text,integer,integer)') is not null)::int as adaptive_preview_rpc,
 (to_regprocedure('public.preview_v268_diagnostic(text,integer)') is not null)::int as diagnostic_preview_rpc,
 (to_regprocedure('public.review_v269_assessment_topic(text,text,text,text,text,text,text)') is not null)::int as review_rpc,
 (to_regprocedure('public.assert_v269_course_release_ready(text)') is not null)::int as release_guard_rpc,
 (to_regprocedure('public.get_v284_7b_expansion_overview()') is not null)::int as overview_rpc,
 (select count(distinct oa_code) from public.curriculum_nodes_v254 where course_id='cl-7-basico') as official_oas,
 (select count(*) from public.deep_learning_paths_v250 where course_id='cl-7-basico' and content_version='v28.0') as deep_topics,
 (select count(*) from public.deep_learning_paths_v250 where course_id='cl-7-basico' and content_version='v28.0' and status='staging') as deep_staging,
 (select count(*) from public.deep_learning_paths_v250 where course_id='cl-7-basico' and status='published') as deep_published,
 (select count(*) from public.curriculum_nodes_v254 where course_id='cl-7-basico' and is_active) as curriculum_nodes,
 (select count(*) from public.curriculum_coverage_v254 where course_id='cl-7-basico' and auto_state='strong') as strong_nodes,
 (select count(*) from public.curriculum_coverage_v254 where course_id='cl-7-basico' and auto_state='partial') as partial_nodes,
 (select count(*) from public.curriculum_coverage_v254 where course_id='cl-7-basico' and human_review_status='approved') as human_approved_nodes,
 (select sum(jsonb_array_length(micro_lessons)) from public.deep_learning_paths_v250 where course_id='cl-7-basico' and content_version='v28.0') as micro_lessons,
 (select sum(jsonb_array_length(worked_examples)) from public.deep_learning_paths_v250 where course_id='cl-7-basico' and content_version='v28.0') as worked_examples,
 (select sum(jsonb_array_length(guided_practice)) from public.deep_learning_paths_v250 where course_id='cl-7-basico' and content_version='v28.0') as guided_practice,
 (select sum(jsonb_array_length(representations)) from public.deep_learning_paths_v250 where course_id='cl-7-basico' and content_version='v28.0') as representation_specs,
 (select sum(jsonb_array_length(interactive_specs)) from public.deep_learning_paths_v250 where course_id='cl-7-basico' and content_version='v28.0') as interactive_specs,
 (select count(*) from public.deep_guided_answer_keys_v253 k join public.deep_learning_paths_v250 p on p.topic_id=k.topic_id where p.course_id='cl-7-basico') as answer_contracts,
 (select min(q.total_score) from public.deep_content_quality_v253 q join public.deep_learning_paths_v250 p on p.topic_id=q.topic_id where p.course_id='cl-7-basico') as q4_min,
 (select round(avg(q.total_score),2) from public.deep_content_quality_v253 q join public.deep_learning_paths_v250 p on p.topic_id=q.topic_id where p.course_id='cl-7-basico') as q4_avg,
 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-7-basico') as assessment_items,
 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-7-basico' and kind='practice') as practice_items,
 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-7-basico' and kind='diagnostic') as diagnostic_items,
 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-7-basico' and kind='review') as review_items,
 (select count(*) from public.multigrade_review_sets_v261 where course_id='cl-7-basico') as review_sets,
 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-7-basico' and is_published) as published_items,
 (select count(*) from public.multigrade_review_sets_v261 where course_id='cl-7-basico' and is_published) as published_sets,
 (select count(*) from (select course_id,oa_code,ordinal from public.curriculum_nodes_v254 where course_id='cl-7-basico' group by 1,2,3 having count(*)>1)x) as ordinal_collision_groups,
 (select count(*) from (select oa_code from public.curriculum_nodes_v254 where course_id='cl-7-basico' group by oa_code having min(ordinal)<>1 or max(ordinal)<>8 or count(*)<>8)x) as oa_with_bad_ordinal_span,
 (select count(*) from public.multigrade_adaptive_item_metadata_v262 where course_id='cl-7-basico') as adaptive_metadata,
 (select count(*) from public.multigrade_adaptive_item_metadata_v262 where course_id='cl-7-basico' and calibration_status='heuristic_candidate') as heuristic_metadata,
 (select count(*) from public.multigrade_adaptive_item_metadata_v262 where course_id='cl-7-basico' and calibration_status='calibrated') as calibrated_metadata,
 (select min(evidence_weight) from public.multigrade_adaptive_item_metadata_v262 where course_id='cl-7-basico') as evidence_weight_min,
 (select max(evidence_weight) from public.multigrade_adaptive_item_metadata_v262 where course_id='cl-7-basico') as evidence_weight_max,
 (select count(*) from public.multigrade_diagnostic_blueprints_v263 where course_id='cl-7-basico') as diagnostic_blueprints,
 (select min_items from public.multigrade_diagnostic_blueprints_v263 where course_id='cl-7-basico' limit 1) as diagnostic_min_items,
 (select target_items from public.multigrade_diagnostic_blueprints_v263 where course_id='cl-7-basico' limit 1) as diagnostic_target_items,
 (select max_items from public.multigrade_diagnostic_blueprints_v263 where course_id='cl-7-basico' limit 1) as diagnostic_max_items,
 (select count(distinct topic_id) from public.multigrade_assessment_items_v261 where course_id='cl-7-basico' and kind='diagnostic') as diagnostic_topics_covered,
 (select count(*) from public.multigrade_learning_route_contract_v264 where course_id='cl-7-basico') as route_contracts,
 (select count(*) from public.multigrade_assessment_certification_v264 where course_id='cl-7-basico') as certification_topics,
 (select count(*) from public.multigrade_assessment_certification_v264 where course_id='cl-7-basico' and certified) as certified_topics,
 (select count(*) from public.multigrade_assessment_readiness_v264 where course_id='cl-7-basico') as readiness_topics,
 (select count(*) from public.multigrade_assessment_readiness_v264 where course_id='cl-7-basico' and auto_gate_pass) as auto_gate_topics,
 (select count(*) from public.multigrade_assessment_readiness_v264 where course_id='cl-7-basico' and release_candidate) as release_candidates,
 (select requires_revalidation_before_release from public.multigrade_curriculum_source_snapshot_v269 where course_id='cl-7-basico') as curriculum_revalidation_required,
 (select update_process_status from public.multigrade_curriculum_source_snapshot_v269 where course_id='cl-7-basico') as curriculum_update_status,
 (select live_student_delivery from public.multigrade_course_runtime_gate_v269 where course_id='cl-7-basico') as live_student_delivery,
 (select release_candidate from public.multigrade_course_runtime_gate_v269 where course_id='cl-7-basico') as runtime_release_candidate,
 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-7-basico' and jsonb_array_length(options)<>4) as bad_option_count_items,
 (select count(*) from public.multigrade_assessment_items_v261 i where i.course_id='cl-7-basico' and (select count(*) from (select lower(regexp_replace(btrim(o->>'text'),'\s+',' ','g')) t from jsonb_array_elements(i.options)o group by 1 having count(*)>1)d)>0) as duplicate_option_items,
 (select count(*) from public.multigrade_assessment_items_v261 i where i.course_id='cl-7-basico' and (select count(*) from (select lower(regexp_replace(btrim(o->>'text'),'\s+',' ','g')) t from jsonb_array_elements(i.options)o group by 1 having count(*)>1)d)>0) as semantic_duplicate_option_items,
 (select count(*) from (select lower(regexp_replace(btrim(stem),'\s+',' ','g')) s from public.multigrade_assessment_items_v261 where course_id='cl-7-basico' group by 1 having count(*)>1)d) as duplicate_stem_groups,
 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-7-basico' and correct_option='A') as answer_a,
 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-7-basico' and correct_option='B') as answer_b,
 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-7-basico' and correct_option='C') as answer_c,
 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-7-basico' and correct_option='D') as answer_d,
 has_table_privilege('authenticated','public.multigrade_course_runtime_gate_v269','select') as auth_runtime_gate_select,
 has_table_privilege('anon','public.multigrade_course_runtime_gate_v269','select') as anon_runtime_gate_select,
 has_function_privilege('authenticated','public.get_v284_7b_expansion_overview()','execute') as auth_overview_rpc,
 has_function_privilege('anon','public.get_v284_7b_expansion_overview()','execute') as anon_overview_rpc
 ,
 (select count(*) from public.deep_learning_paths_v250 where course_id='cl-8-basico' and content_version='v27.5' and status='staging') as course_8_basico_topics,
 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-8-basico') as course_8_basico_items,
 (select count(*) from public.school_practice_items where code like '4M-V225-P-%' and is_published) as v24_practice_publicadas,
 (select count(*) from public.school_diagnostic_items where diagnostic_version='4m-fg-v225' and is_published) as v24_diagnostic_publicadas,
 (select count(*) from public.school_review_items where code like '4M-V225-R-%' and is_published) as v24_review_publicadas,
 (select count(*) from public.school_review_sets where id like '4m-fg-v225-%' and is_published) as v24_review_sets_publicados,
 (select count(*) from public.content_releases_v240 where release_key='4m-v240' and status='applied') as v24_release_aplicado;
