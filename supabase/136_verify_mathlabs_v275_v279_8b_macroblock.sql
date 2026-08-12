-- MathLabs V27.5–V27.9 · 8B COMPLETE STAGING · VERIFICATION
select
 (to_regclass('public.multigrade_curriculum_source_snapshot_v269') is not null)::int as source_snapshot_table,
 (to_regclass('public.multigrade_course_runtime_gate_v269') is not null)::int as runtime_gate_table,
 (to_regprocedure('public.recompute_deep_content_quality_v275_8b(text)') is not null)::int as quality_rpc,
 (to_regprocedure('public.refresh_v269_course_assessment_readiness(text)') is not null)::int as readiness_rpc,
 (to_regprocedure('public.preview_v267_adaptive_items(text,text,integer,integer)') is not null)::int as adaptive_preview_rpc,
 (to_regprocedure('public.preview_v268_diagnostic(text,integer)') is not null)::int as diagnostic_preview_rpc,
 (to_regprocedure('public.review_v269_assessment_topic(text,text,text,text,text,text,text)') is not null)::int as review_rpc,
 (to_regprocedure('public.assert_v269_course_release_ready(text)') is not null)::int as release_guard_rpc,
 (to_regprocedure('public.get_v279_8b_expansion_overview()') is not null)::int as overview_rpc,

 (select count(distinct n.oa_code) from public.curriculum_nodes_v254 n join public.deep_learning_paths_v250 p on p.topic_id=n.topic_id where p.course_id='cl-8-basico' and p.content_version='v27.5') as official_oas,
 (select count(*) from public.deep_learning_paths_v250 where course_id='cl-8-basico' and content_version='v27.5') as deep_topics,
 (select count(*) from public.deep_learning_paths_v250 where course_id='cl-8-basico' and content_version='v27.5' and status='staging') as deep_staging,
 (select count(*) from public.deep_learning_paths_v250 where course_id='cl-8-basico' and status='published') as deep_published,

 (select count(*) from public.curriculum_nodes_v254 n
  join public.deep_learning_paths_v250 p on p.topic_id=n.topic_id
  where p.course_id='cl-8-basico' and p.content_version='v27.5' and n.is_active) as curriculum_nodes,
 (select count(*) from public.curriculum_coverage_v254 c
  join public.deep_learning_paths_v250 p on p.topic_id=c.topic_id
  where p.course_id='cl-8-basico' and p.content_version='v27.5' and c.auto_state='strong') as strong_nodes,
 (select count(*) from public.curriculum_coverage_v254 c
  join public.deep_learning_paths_v250 p on p.topic_id=c.topic_id
  where p.course_id='cl-8-basico' and p.content_version='v27.5' and c.human_review_status='approved') as human_approved_nodes,

 (select sum(jsonb_array_length(micro_lessons)) from public.deep_learning_paths_v250
  where course_id='cl-8-basico' and content_version='v27.5') as micro_lessons,
 (select sum(jsonb_array_length(worked_examples)) from public.deep_learning_paths_v250
  where course_id='cl-8-basico' and content_version='v27.5') as worked_examples,
 (select sum(jsonb_array_length(guided_practice)) from public.deep_learning_paths_v250
  where course_id='cl-8-basico' and content_version='v27.5') as guided_practice,
 (select sum((select count(*) from jsonb_array_elements(representations)r where r->>'render_status'='rendered'))
  from public.deep_learning_paths_v250 where course_id='cl-8-basico' and content_version='v27.5') as rendered_representations,
 (select sum(jsonb_array_length(interactive_specs)) from public.deep_learning_paths_v250
  where course_id='cl-8-basico' and content_version='v27.5') as interactive_labs,
 (select count(*) from public.deep_guided_answer_keys_v253 k
  join public.deep_learning_paths_v250 p on p.topic_id=k.topic_id
  where p.course_id='cl-8-basico' and p.content_version='v27.5') as answer_contracts,

 (select min(q.total_score) from public.deep_content_quality_v253 q
  join public.deep_learning_paths_v250 p on p.topic_id=q.topic_id
  where p.course_id='cl-8-basico' and p.content_version='v27.5') as q4_min,
 (select round(avg(q.total_score),2) from public.deep_content_quality_v253 q
  join public.deep_learning_paths_v250 p on p.topic_id=q.topic_id
  where p.course_id='cl-8-basico' and p.content_version='v27.5') as q4_avg,
 (select count(*) from public.deep_content_quality_v253 q
  join public.deep_learning_paths_v250 p on p.topic_id=q.topic_id
  where p.course_id='cl-8-basico' and p.content_version='v27.5' and q.student_ready) as student_ready_topics,

 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-8-basico') as assessment_items,
 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-8-basico' and kind='practice') as practice_items,
 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-8-basico' and kind='diagnostic') as diagnostic_items,
 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-8-basico' and kind='review') as review_items,
 (select count(*) from public.multigrade_review_sets_v261 where course_id='cl-8-basico') as review_sets,
 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-8-basico' and is_published) as published_items,
 (select count(*) from public.multigrade_review_sets_v261 where course_id='cl-8-basico' and is_published) as published_sets,

 (select count(*) from (
   select course_id,oa_code,ordinal,count(*) c
   from public.curriculum_nodes_v254
   where course_id='cl-8-basico'
   group by course_id,oa_code,ordinal
   having count(*)>1
  )x) as ordinal_collision_groups,
 (select count(*) from (
   select oa_code,array_agg(ordinal order by ordinal) ords
   from public.curriculum_nodes_v254
   where course_id='cl-8-basico'
   group by oa_code
   having array_agg(ordinal order by ordinal)<>array[1,2,3,4,5,6,7,8]
  )x) as oa_with_bad_ordinal_span,

 (select count(*) from public.multigrade_adaptive_item_metadata_v262 where course_id='cl-8-basico') as adaptive_metadata,
 (select count(*) from public.multigrade_adaptive_item_metadata_v262
  where course_id='cl-8-basico' and calibration_status='heuristic_candidate') as heuristic_metadata,
 (select count(*) from public.multigrade_adaptive_item_metadata_v262
  where course_id='cl-8-basico' and calibration_status='calibrated') as calibrated_metadata,
 (select min(evidence_weight) from public.multigrade_adaptive_item_metadata_v262 where course_id='cl-8-basico') as evidence_weight_min,
 (select max(evidence_weight) from public.multigrade_adaptive_item_metadata_v262 where course_id='cl-8-basico') as evidence_weight_max,

 (select count(*) from public.multigrade_diagnostic_blueprints_v263 where course_id='cl-8-basico') as diagnostic_blueprints,
 (select min_items from public.multigrade_diagnostic_blueprints_v263 where course_id='cl-8-basico' limit 1) as diagnostic_min_items,
 (select target_items from public.multigrade_diagnostic_blueprints_v263 where course_id='cl-8-basico' limit 1) as diagnostic_target_items,
 (select max_items from public.multigrade_diagnostic_blueprints_v263 where course_id='cl-8-basico' limit 1) as diagnostic_max_items,
 (select count(distinct topic_id) from public.multigrade_assessment_items_v261
  where course_id='cl-8-basico' and kind='diagnostic') as diagnostic_topics_covered,

 (select count(*) from public.multigrade_learning_route_contract_v264 where course_id='cl-8-basico') as route_contracts,
 (select count(*) from public.multigrade_assessment_certification_v264 where course_id='cl-8-basico') as certification_topics,
 (select count(*) from public.multigrade_assessment_certification_v264 where course_id='cl-8-basico' and certified) as certified_topics,
 (select count(*) from public.multigrade_assessment_readiness_v264 where course_id='cl-8-basico') as readiness_topics,
 (select count(*) from public.multigrade_assessment_readiness_v264 where course_id='cl-8-basico' and auto_gate_pass) as auto_gate_topics,
 (select count(*) from public.multigrade_assessment_readiness_v264 where course_id='cl-8-basico' and release_candidate) as release_candidates,

 (select requires_revalidation_before_release from public.multigrade_curriculum_source_snapshot_v269 where course_id='cl-8-basico') as curriculum_revalidation_required,
 (select update_process_status from public.multigrade_curriculum_source_snapshot_v269 where course_id='cl-8-basico') as curriculum_update_status,
 (select live_student_delivery from public.multigrade_course_runtime_gate_v269 where course_id='cl-8-basico') as live_student_delivery,
 (select release_candidate from public.multigrade_course_runtime_gate_v269 where course_id='cl-8-basico') as runtime_release_candidate,

 (select count(*) from public.multigrade_assessment_items_v261 i
  where i.course_id='cl-8-basico' and jsonb_array_length(i.options)<>4) as bad_option_count_items,
 (select count(*) from public.multigrade_assessment_items_v261 i
  where i.course_id='cl-8-basico'
   and (select count(distinct lower(regexp_replace(o->>'text','\s+','','g')))
        from jsonb_array_elements(i.options)o)<>4) as duplicate_option_items,
 (select count(*) from public.multigrade_assessment_items_v261 i
  where i.course_id='cl-8-basico'
   and (select count(distinct
          case
           when btrim(replace(o->>'text',',','.')) ~ '^-?[0-9]+([.][0-9]+)?$'
            then '#N#'||(replace(btrim(o->>'text'),',','.')::numeric)::text
           else '#T#'||lower(regexp_replace(btrim(o->>'text'),'\s+','','g'))
          end)
        from jsonb_array_elements(i.options)o)<>4) as semantic_duplicate_option_items,
 (select count(*) from public.multigrade_assessment_items_v261 i
  cross join lateral jsonb_array_elements(i.options)o
  where i.course_id='cl-8-basico' and i.oa_code='MA1M OA 14'
    and btrim(replace(o->>'text',',','.')) ~ '^-?[0-9]+([.][0-9]+)?$'
    and (replace(btrim(o->>'text'),',','.')::numeric < 0
         or replace(btrim(o->>'text'),',','.')::numeric > 1)) as probability_option_out_of_domain,
 (select count(*) from public.multigrade_assessment_items_v261 i
  where i.course_id='cl-8-basico' and i.stem ~* '^(Caso|Variante)[[:space:]]') as artificial_case_prefixes,
 (select count(*) from (
   select lower(btrim(stem)),count(*) c from public.multigrade_assessment_items_v261
   where course_id='cl-8-basico' group by 1 having count(*)>1
  )d) as duplicate_stem_groups,

 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-8-basico' and correct_option='A') as answer_a,
 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-8-basico' and correct_option='B') as answer_b,
 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-8-basico' and correct_option='C') as answer_c,
 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-8-basico' and correct_option='D') as answer_d,

 (select topics from public.mathlabs_course_architecture_snapshot_v259 where course_id='cl-8-basico') as arch_topics,
 (select curriculum_nodes from public.mathlabs_course_architecture_snapshot_v259 where course_id='cl-8-basico') as arch_nodes,
 (select practice_items from public.mathlabs_course_architecture_snapshot_v259 where course_id='cl-8-basico') as arch_practice,
 (select diagnostic_items from public.mathlabs_course_architecture_snapshot_v259 where course_id='cl-8-basico') as arch_diagnostic,
 (select review_items from public.mathlabs_course_architecture_snapshot_v259 where course_id='cl-8-basico') as arch_review,
 (select count(*) from public.mathlabs_course_module_readiness_v259
  where course_id='cl-8-basico' and readiness_status in ('ready','staging','production')) as modules_ready_or_staging,
 (select count(*) from public.mathlabs_course_module_readiness_v259
  where course_id='cl-8-basico' and readiness_status='partial') as modules_partial,

 has_table_privilege('authenticated','public.multigrade_course_runtime_gate_v269','SELECT') as auth_runtime_gate_select,
 has_table_privilege('anon','public.multigrade_course_runtime_gate_v269','SELECT') as anon_runtime_gate_select,
 has_function_privilege('authenticated','public.get_v279_8b_expansion_overview()','EXECUTE') as auth_overview_rpc,
 has_function_privilege('anon','public.get_v279_8b_expansion_overview()','EXECUTE') as anon_overview_rpc,
 has_function_privilege('authenticated','public.preview_v267_adaptive_items(text,text,integer,integer)','EXECUTE') as auth_adaptive_preview_rpc,
 has_function_privilege('anon','public.preview_v267_adaptive_items(text,text,integer,integer)','EXECUTE') as anon_adaptive_preview_rpc,
 has_function_privilege('authenticated','public.preview_v268_diagnostic(text,integer)','EXECUTE') as auth_diagnostic_preview_rpc,
 has_function_privilege('anon','public.preview_v268_diagnostic(text,integer)','EXECUTE') as anon_diagnostic_preview_rpc,
 has_function_privilege('authenticated','public.review_v269_assessment_topic(text,text,text,text,text,text,text)','EXECUTE') as auth_review_rpc,
 has_function_privilege('anon','public.review_v269_assessment_topic(text,text,text,text,text,text,text)','EXECUTE') as anon_review_rpc,
 has_function_privilege('authenticated','public.assert_v269_course_release_ready(text)','EXECUTE') as auth_release_guard_rpc,
 has_function_privilege('anon','public.assert_v269_course_release_ready(text)','EXECUTE') as anon_release_guard_rpc,

 (select count(*) from public.deep_learning_paths_v250 where course_id='cl-1-medio' and content_version='v27.0') as v274_1m_deep_topics,
 (select count(*) from public.deep_learning_paths_v250 where course_id='cl-1-medio' and content_version='v27.0' and status='staging') as v274_1m_staging,
 (select count(*) from public.deep_learning_paths_v250 where course_id='cl-1-medio' and status='published') as v274_1m_published,
 (select count(*) from public.curriculum_nodes_v254 where course_id='cl-1-medio' and is_active) as v274_1m_nodes,
 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-1-medio') as v274_1m_assessment_items,
 (select count(*) from public.multigrade_adaptive_item_metadata_v262 where course_id='cl-1-medio') as v274_1m_adaptive_metadata,
 (select count(*) from public.multigrade_assessment_readiness_v264 where course_id='cl-1-medio' and auto_gate_pass) as v274_1m_auto_gate_topics,
 (select count(*) from public.multigrade_assessment_readiness_v264 where course_id='cl-1-medio' and release_candidate) as v274_1m_release_candidates,
 (select requires_revalidation_before_release from public.multigrade_curriculum_source_snapshot_v269 where course_id='cl-1-medio') as v274_1m_revalidation_required,
 (select live_student_delivery from public.multigrade_course_runtime_gate_v269 where course_id='cl-1-medio') as v274_1m_live_student_delivery,

 (select count(*) from public.deep_learning_paths_v250 where course_id='cl-2-medio' and content_version='v26.5') as v269_2m_deep_topics,
 (select count(*) from public.deep_learning_paths_v250 where course_id='cl-2-medio' and content_version='v26.5' and status='staging') as v269_2m_staging,
 (select count(*) from public.deep_learning_paths_v250 where course_id='cl-2-medio' and status='published') as v269_2m_published,
 (select count(*) from public.curriculum_nodes_v254 where course_id='cl-2-medio' and is_active) as v269_2m_nodes,
 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-2-medio') as v269_2m_assessment_items,
 (select count(*) from public.multigrade_adaptive_item_metadata_v262 where course_id='cl-2-medio') as v269_2m_adaptive_metadata,
 (select count(*) from public.multigrade_assessment_readiness_v264 where course_id='cl-2-medio' and auto_gate_pass) as v269_2m_auto_gate_topics,
 (select count(*) from public.multigrade_assessment_readiness_v264 where course_id='cl-2-medio' and release_candidate) as v269_2m_release_candidates,
 (select requires_revalidation_before_release from public.multigrade_curriculum_source_snapshot_v269 where course_id='cl-2-medio') as v269_2m_revalidation_required,
 (select live_student_delivery from public.multigrade_course_runtime_gate_v269 where course_id='cl-2-medio') as v269_2m_live_student_delivery,

 (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-3-medio') as v264_3m_assessment_items,
 (select count(*) from public.multigrade_assessment_readiness_v264 where course_id='cl-3-medio' and auto_gate_pass) as v264_3m_auto_gate_topics,
 (select count(*) from public.deep_learning_paths_v250 where course_id='cl-3-medio' and status='published') as v260_3m_published,

 (select count(*) from public.deferred_review_queue_v258) as v258_4m_review_tasks,
 (select count(*) from public.deep_learning_paths_v250 where course_id='cl-4-medio' and status='staging') as v25_4m_staging,
 (select count(*) from public.deep_learning_paths_v250 where course_id='cl-4-medio' and status='published') as v25_4m_published,
 (select count(*) from public.school_practice_items where code like '4M-V225-P-%' and is_published) as v24_practice_publicadas,
 (select count(*) from public.school_diagnostic_items where diagnostic_version='4m-fg-v225' and is_published) as v24_diagnostic_publicadas,
 (select count(*) from public.school_review_items where code like '4M-V225-R-%' and is_published) as v24_review_publicadas,
 (select count(*) from public.school_review_sets where id like '4m-fg-v225-%' and is_published) as v24_review_sets_publicados,
 (select count(*) from public.content_releases_v240 where release_key='4m-v240' and status='applied') as v24_release_aplicado;
