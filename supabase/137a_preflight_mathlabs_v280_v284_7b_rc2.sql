-- MathLabs v28.0 → v28.4 · 7B RC2 COMPAT3 · READ-ONLY PREFLIGHT
-- This file performs no INSERT, UPDATE, DELETE, CREATE, ALTER, DROP or TRUNCATE.
select public.mathlabs_assert_admin_v22();

do $$
begin
 if (select count(*) from public.courses where id='cl-7-basico')<>1 then
   raise exception 'Preflight RC2: cl-7-basico no existe en public.courses';
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
 if (select count(*) from public.mathlabs_course_catalog_v259 where course_id='cl-7-basico')<>1 then
   raise exception 'Preflight RC2: cl-7-basico no está registrado en el catálogo';
 end if;
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

 if (select count(*)
     from pg_constraint c
     where c.conrelid='public.knowledge_topics'::regclass
       and c.conname='knowledge_topics_difficulty_check'
       and position('''Inicial''' in pg_get_constraintdef(c.oid))>0
       and position('''Fundamental''' in pg_get_constraintdef(c.oid))>0
       and position('''Intermedio''' in pg_get_constraintdef(c.oid))>0
       and position('''Avanzado''' in pg_get_constraintdef(c.oid))>0)<>1 then
   raise exception 'Compat3: knowledge_topics_difficulty_check no admite Inicial/Fundamental/Intermedio/Avanzado';
 end if;

 if (select count(*) from pg_constraint c
     where c.conrelid='public.deep_guided_answer_keys_v253'::regclass
       and c.conname='deep_guided_answer_keys_v253_validation_type_check'
       and position('''numeric''' in pg_get_constraintdef(c.oid))>0
       and position('''mixed''' in pg_get_constraintdef(c.oid))>0
       and position('''formula''' in pg_get_constraintdef(c.oid))>0
       and position('''keywords''' in pg_get_constraintdef(c.oid))>0)<>1 then
   raise exception 'Compat3: contrato validation_type de deep_guided_answer_keys_v253 incompatible';
 end if;

 if (select count(*) from pg_constraint c
     where c.conrelid='public.multigrade_assessment_items_v261'::regclass
       and c.conname='multigrade_assessment_items_v261_depth_check'
       and position('depth >= 1' in pg_get_constraintdef(c.oid))>0
       and position('depth <= 3' in pg_get_constraintdef(c.oid))>0)<>1
    or (select count(*) from pg_constraint c
        where c.conrelid='public.multigrade_adaptive_item_metadata_v262'::regclass
          and c.conname='multigrade_adaptive_item_metadata_v262_depth_check'
          and position('depth >= 1' in pg_get_constraintdef(c.oid))>0
          and position('depth <= 3' in pg_get_constraintdef(c.oid))>0)<>1 then
   raise exception 'Compat3: contrato depth 1..3 de assessment/adaptive incompatible';
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
end $$;

select
 'cl-7-basico'::text as course_id,
 true as legacy_published_baseline_intact,
 true as target_rc2_namespace_clean,
 true as knowledge_topics_difficulty_contract_compatible,
 true as guided_validation_contract_compatible,
 true as assessment_depth_contract_compatible,
 true as prerequisite_courses_intact,
 true as baseline_1m_4m_v24_intact,
 false as writes_executed;
