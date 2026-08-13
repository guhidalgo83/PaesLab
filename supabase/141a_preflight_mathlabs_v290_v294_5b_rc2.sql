-- MathLabs v29.0 → v29.4 · 5B RC2 · READ-ONLY PREFLIGHT
-- This file performs no INSERT, UPDATE, DELETE, CREATE, ALTER, DROP or TRUNCATE.
select public.mathlabs_assert_admin_v22();

do $$
begin
 if (select count(*) from public.courses where id='cl-5-basico')<>1 then
   raise exception 'Preflight RC2: cl-5-basico no existe en public.courses';
 end if;
 if to_regclass('public.mathlabs_course_catalog_v259') is null
    or to_regclass('public.deep_learning_paths_v250') is null
    or to_regclass('public.curriculum_nodes_v254') is null
    or to_regclass('public.curriculum_coverage_v254') is null
    or to_regclass('public.multigrade_assessment_items_v261') is null
    or to_regclass('public.multigrade_adaptive_item_metadata_v262') is null
    or to_regclass('public.multigrade_diagnostic_blueprints_v263') is null
    or to_regclass('public.multigrade_learning_route_contract_v264') is null
    or to_regclass('public.multigrade_assessment_certification_v264') is null
    or to_regclass('public.multigrade_assessment_readiness_v264') is null
    or to_regclass('public.multigrade_curriculum_source_snapshot_v269') is null
    or to_regclass('public.multigrade_course_runtime_gate_v269') is null then
   raise exception 'Preflight RC2: falta arquitectura multigrado requerida';
 end if;
 if (select count(*) from public.mathlabs_course_catalog_v259 where course_id='cl-5-basico')<>1 then
   raise exception 'Preflight RC2: cl-5-basico no está registrado en el catálogo';
 end if;
 if exists(select 1 from public.curriculum_sources_v254 where course_id='cl-5-basico')
or exists(select 1 from public.curriculum_oas_v254 where course_id='cl-5-basico')
or exists(select 1 from public.curriculum_axes where course_id='cl-5-basico')
or exists(select 1 from public.curriculum_objectives where course_id='cl-5-basico')
or exists(select 1 from public.knowledge_topics where course_id='cl-5-basico')
or exists(select 1 from public.deep_learning_paths_v250 where course_id='cl-5-basico')
or exists(select 1 from public.curriculum_nodes_v254 where course_id='cl-5-basico')
or exists(select 1 from public.curriculum_coverage_v254 where course_id='cl-5-basico')
or exists(select 1 from public.curriculum_topic_readiness_v254 where course_id='cl-5-basico')
or exists(select 1 from public.multigrade_assessment_items_v261 where course_id='cl-5-basico')
or exists(select 1 from public.multigrade_review_sets_v261 where course_id='cl-5-basico')
or exists(select 1 from public.multigrade_adaptive_item_metadata_v262 where course_id='cl-5-basico')
or exists(select 1 from public.multigrade_diagnostic_blueprints_v263 where course_id='cl-5-basico')
or exists(select 1 from public.multigrade_learning_route_contract_v264 where course_id='cl-5-basico')
or exists(select 1 from public.multigrade_assessment_certification_v264 where course_id='cl-5-basico')
or exists(select 1 from public.multigrade_assessment_readiness_v264 where course_id='cl-5-basico')
or exists(select 1 from public.multigrade_curriculum_source_snapshot_v269 where course_id='cl-5-basico')
or exists(select 1 from public.multigrade_course_runtime_gate_v269 where course_id='cl-5-basico') then
   raise exception 'Preflight RC2: cl-5-basico contiene artefactos previos; no instalar sobre estado parcial';
 end if;

 if (select count(*) from public.deep_learning_paths_v250 where course_id='cl-8-basico' and content_version='v27.5' and status='staging')<>34
   or (select count(*) from public.curriculum_nodes_v254 where course_id='cl-8-basico' and is_active)<>136
   or (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-8-basico')<>884
   or exists(select 1 from public.deep_learning_paths_v250 where course_id='cl-8-basico' and status='published')
   or exists(select 1 from public.multigrade_assessment_items_v261 where course_id='cl-8-basico' and is_published)
   or coalesce((select live_student_delivery from public.multigrade_course_runtime_gate_v269 where course_id='cl-8-basico'),true) then
  raise exception 'Baseline cl-8-basico alterado antes de instalar 5B';
end if;

if (select count(*) from public.deep_learning_paths_v250 where course_id='cl-7-basico' and content_version='v28.0' and status='staging')<>38
   or (select count(*) from public.curriculum_nodes_v254 where course_id='cl-7-basico' and is_active)<>152
   or (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-7-basico')<>988
   or exists(select 1 from public.deep_learning_paths_v250 where course_id='cl-7-basico' and status='published')
   or exists(select 1 from public.multigrade_assessment_items_v261 where course_id='cl-7-basico' and is_published)
   or coalesce((select live_student_delivery from public.multigrade_course_runtime_gate_v269 where course_id='cl-7-basico'),true) then
  raise exception 'Baseline cl-7-basico alterado antes de instalar 5B';
end if;

if (select count(*) from public.deep_learning_paths_v250 where course_id='cl-6-basico' and content_version='v28.5' and status='staging')<>48
   or (select count(*) from public.curriculum_nodes_v254 where course_id='cl-6-basico' and is_active)<>192
   or (select count(*) from public.multigrade_assessment_items_v261 where course_id='cl-6-basico')<>1248
   or exists(select 1 from public.deep_learning_paths_v250 where course_id='cl-6-basico' and status='published')
   or exists(select 1 from public.multigrade_assessment_items_v261 where course_id='cl-6-basico' and is_published)
   or coalesce((select live_student_delivery from public.multigrade_course_runtime_gate_v269 where course_id='cl-6-basico'),true) then
  raise exception 'Baseline cl-6-basico alterado antes de instalar 5B';
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
          raise exception 'Baseline 1M-4M/V24 alterado para 5B RC2';
        end if;
end $$;

select
 'cl-5-basico'::text as course_id,
 true as target_course_clean,
 true as prerequisite_courses_intact,
 true as baseline_1m_4m_v24_intact,
 false as writes_executed;
