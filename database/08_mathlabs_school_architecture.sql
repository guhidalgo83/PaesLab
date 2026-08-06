-- MathLabs V1 — Arquitectura de matemática escolar
-- Mantiene la preparación PAES y agrega una capa curricular general.
-- Fuente curricular de referencia: Currículum Nacional de Chile, Matemática 5.º básico.

begin;

create extension if not exists pgcrypto;

create table if not exists public.education_levels (
  id text primary key,
  name text not null,
  description text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id text primary key,
  level_id text not null references public.education_levels(id) on delete restrict,
  slug text not null unique,
  name text not null,
  short_name text not null,
  grade_number integer not null,
  country_code text not null default 'CL',
  curriculum_version text not null default 'Bases curriculares vigentes',
  curriculum_source_url text,
  description text not null default '',
  sort_order integer not null default 0,
  is_available boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.curriculum_axes (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  slug text not null,
  name text not null,
  description text not null default '',
  icon text not null default 'π',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug)
);

create table if not exists public.curriculum_objectives (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  axis_id text not null references public.curriculum_axes(id) on delete cascade,
  code text not null unique,
  title text not null,
  summary text not null default '',
  official_source_url text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_topics (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  axis_id text not null references public.curriculum_axes(id) on delete cascade,
  slug text not null,
  title text not null,
  summary text not null default '',
  difficulty text not null default 'Inicial'
    check (difficulty in ('Inicial','Fundamental','Intermedio','Avanzado')),
  estimated_minutes integer not null default 30
    check (estimated_minutes between 5 and 240),
  sort_order integer not null default 0,
  content_status text not null default 'mapped'
    check (content_status in ('mapped','draft','review','published')),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug)
);

create table if not exists public.curriculum_objective_topics (
  objective_id text not null references public.curriculum_objectives(id) on delete cascade,
  topic_id text not null references public.knowledge_topics(id) on delete cascade,
  weight numeric(5,2) not null default 1.00 check (weight > 0),
  primary key (objective_id, topic_id)
);

create table if not exists public.topic_prerequisites (
  topic_id text not null references public.knowledge_topics(id) on delete cascade,
  prerequisite_topic_id text not null references public.knowledge_topics(id) on delete cascade,
  relation_type text not null default 'required'
    check (relation_type in ('required','recommended')),
  primary key (topic_id, prerequisite_topic_id),
  check (topic_id <> prerequisite_topic_id)
);

create table if not exists public.lesson_curriculum_links (
  lesson_id text not null references public.lessons(id) on delete cascade,
  objective_id text not null references public.curriculum_objectives(id) on delete cascade,
  topic_id text references public.knowledge_topics(id) on delete cascade,
  alignment_type text not null default 'primary'
    check (alignment_type in ('primary','support','extension')),
  primary key (lesson_id, objective_id)
);

create table if not exists public.question_curriculum_links (
  question_id text not null references public.questions(id) on delete cascade,
  objective_id text not null references public.curriculum_objectives(id) on delete cascade,
  topic_id text references public.knowledge_topics(id) on delete cascade,
  alignment_type text not null default 'primary'
    check (alignment_type in ('primary','support','extension')),
  primary key (question_id, objective_id)
);

create table if not exists public.student_course_enrollments (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  is_primary boolean not null default false,
  status text not null default 'active'
    check (status in ('active','completed','paused')),
  enrolled_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create unique index if not exists student_one_primary_course_idx
  on public.student_course_enrollments(user_id)
  where is_primary = true and status = 'active';

create table if not exists public.student_topic_mastery (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text not null references public.knowledge_topics(id) on delete cascade,
  mastery_percent integer not null default 0
    check (mastery_percent between 0 and 100),
  confidence_percent integer not null default 0
    check (confidence_percent between 0 and 100),
  attempts_count integer not null default 0 check (attempts_count >= 0),
  correct_count integer not null default 0 check (correct_count >= 0),
  status text not null default 'not_started'
    check (status in ('not_started','learning','practicing','mastered','review')),
  last_practiced_at timestamptz,
  next_review_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

create table if not exists public.school_diagnostic_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  status text not null default 'started'
    check (status in ('started','completed','abandoned')),
  total_questions integer not null default 0,
  correct_answers integer not null default 0,
  result_summary jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists curriculum_objectives_course_axis_idx
  on public.curriculum_objectives(course_id, axis_id, sort_order);
create index if not exists knowledge_topics_course_axis_idx
  on public.knowledge_topics(course_id, axis_id, sort_order);
create index if not exists student_topic_mastery_user_status_idx
  on public.student_topic_mastery(user_id, status, mastery_percent);
create index if not exists school_diagnostic_user_course_idx
  on public.school_diagnostic_sessions(user_id, course_id, started_at desc);

create or replace function public.mathlabs_set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers idempotentes.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'education_levels','courses','curriculum_axes','curriculum_objectives',
    'knowledge_topics','student_course_enrollments','student_topic_mastery'
  ] loop
    execute format('drop trigger if exists %I_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger %I_updated_at before update on public.%I for each row execute function public.mathlabs_set_updated_at()',
      table_name, table_name
    );
  end loop;
end $$;

-- RLS.
alter table public.education_levels enable row level security;
alter table public.courses enable row level security;
alter table public.curriculum_axes enable row level security;
alter table public.curriculum_objectives enable row level security;
alter table public.knowledge_topics enable row level security;
alter table public.curriculum_objective_topics enable row level security;
alter table public.topic_prerequisites enable row level security;
alter table public.lesson_curriculum_links enable row level security;
alter table public.question_curriculum_links enable row level security;
alter table public.student_course_enrollments enable row level security;
alter table public.student_topic_mastery enable row level security;
alter table public.school_diagnostic_sessions enable row level security;

-- Lectura pública del mapa curricular publicado.
drop policy if exists "Public reads education levels" on public.education_levels;
create policy "Public reads education levels" on public.education_levels
for select to public using (is_active or public.is_learning_admin());

drop policy if exists "Public reads courses" on public.courses;
create policy "Public reads courses" on public.courses
for select to public using (is_published or public.is_learning_admin());

drop policy if exists "Public reads curriculum axes" on public.curriculum_axes;
create policy "Public reads curriculum axes" on public.curriculum_axes
for select to public using (is_published or public.is_learning_admin());

drop policy if exists "Public reads curriculum objectives" on public.curriculum_objectives;
create policy "Public reads curriculum objectives" on public.curriculum_objectives
for select to public using (is_published or public.is_learning_admin());

drop policy if exists "Public reads knowledge topics" on public.knowledge_topics;
create policy "Public reads knowledge topics" on public.knowledge_topics
for select to public using (is_published or public.is_learning_admin());

drop policy if exists "Public reads objective topic links" on public.curriculum_objective_topics;
create policy "Public reads objective topic links" on public.curriculum_objective_topics
for select to public using (true);

drop policy if exists "Public reads topic prerequisites" on public.topic_prerequisites;
create policy "Public reads topic prerequisites" on public.topic_prerequisites
for select to public using (true);

drop policy if exists "Public reads lesson curriculum links" on public.lesson_curriculum_links;
create policy "Public reads lesson curriculum links" on public.lesson_curriculum_links
for select to public using (true);

drop policy if exists "Public reads question curriculum links" on public.question_curriculum_links;
create policy "Public reads question curriculum links" on public.question_curriculum_links
for select to public using (true);

-- Administración curricular.
drop policy if exists "Admins manage education levels" on public.education_levels;
create policy "Admins manage education levels" on public.education_levels
for all to authenticated using (public.is_learning_admin()) with check (public.is_learning_admin());

drop policy if exists "Admins manage courses" on public.courses;
create policy "Admins manage courses" on public.courses
for all to authenticated using (public.is_learning_admin()) with check (public.is_learning_admin());

drop policy if exists "Admins manage curriculum axes" on public.curriculum_axes;
create policy "Admins manage curriculum axes" on public.curriculum_axes
for all to authenticated using (public.is_learning_admin()) with check (public.is_learning_admin());

drop policy if exists "Admins manage curriculum objectives" on public.curriculum_objectives;
create policy "Admins manage curriculum objectives" on public.curriculum_objectives
for all to authenticated using (public.is_learning_admin()) with check (public.is_learning_admin());

drop policy if exists "Admins manage knowledge topics" on public.knowledge_topics;
create policy "Admins manage knowledge topics" on public.knowledge_topics
for all to authenticated using (public.is_learning_admin()) with check (public.is_learning_admin());

drop policy if exists "Admins manage objective topic links" on public.curriculum_objective_topics;
create policy "Admins manage objective topic links" on public.curriculum_objective_topics
for all to authenticated using (public.is_learning_admin()) with check (public.is_learning_admin());

drop policy if exists "Admins manage topic prerequisites" on public.topic_prerequisites;
create policy "Admins manage topic prerequisites" on public.topic_prerequisites
for all to authenticated using (public.is_learning_admin()) with check (public.is_learning_admin());

drop policy if exists "Admins manage lesson curriculum links" on public.lesson_curriculum_links;
create policy "Admins manage lesson curriculum links" on public.lesson_curriculum_links
for all to authenticated using (public.is_learning_admin()) with check (public.is_learning_admin());

drop policy if exists "Admins manage question curriculum links" on public.question_curriculum_links;
create policy "Admins manage question curriculum links" on public.question_curriculum_links
for all to authenticated using (public.is_learning_admin()) with check (public.is_learning_admin());

-- Datos privados de estudiantes.
drop policy if exists "Users manage own course enrollments" on public.student_course_enrollments;
create policy "Users manage own course enrollments" on public.student_course_enrollments
for all to authenticated
using (user_id = auth.uid() or public.is_learning_admin())
with check (user_id = auth.uid() or public.is_learning_admin());

drop policy if exists "Users manage own topic mastery" on public.student_topic_mastery;
create policy "Users manage own topic mastery" on public.student_topic_mastery
for all to authenticated
using (user_id = auth.uid() or public.is_learning_admin())
with check (user_id = auth.uid() or public.is_learning_admin());

drop policy if exists "Users manage own school diagnostics" on public.school_diagnostic_sessions;
create policy "Users manage own school diagnostics" on public.school_diagnostic_sessions
for all to authenticated
using (user_id = auth.uid() or public.is_learning_admin())
with check (user_id = auth.uid() or public.is_learning_admin());

-- Privilegios mínimos.
grant select on public.education_levels, public.courses, public.curriculum_axes,
  public.curriculum_objectives, public.knowledge_topics,
  public.curriculum_objective_topics, public.topic_prerequisites,
  public.lesson_curriculum_links, public.question_curriculum_links
  to anon;

grant select, insert, update, delete on public.education_levels, public.courses,
  public.curriculum_axes, public.curriculum_objectives, public.knowledge_topics,
  public.curriculum_objective_topics, public.topic_prerequisites,
  public.lesson_curriculum_links, public.question_curriculum_links
  to authenticated;

grant select, insert, update, delete on public.student_course_enrollments,
  public.student_topic_mastery, public.school_diagnostic_sessions
  to authenticated;

-- Nivel y cursos disponibles o planificados.
insert into public.education_levels (id, name, description, sort_order, is_active)
values
  ('basica', 'Educación básica', 'Trayectoria escolar desde 5.º a 8.º básico.', 1, true),
  ('media', 'Educación media', 'Trayectoria escolar desde 1.º a 4.º medio.', 2, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.courses (
  id, level_id, slug, name, short_name, grade_number, country_code,
  curriculum_version, curriculum_source_url, description,
  sort_order, is_available, is_published
)
values
  ('cl-5-basico','basica','5-basico','5.º básico','5.º básico',5,'CL','Bases curriculares vigentes',
   'https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',
   'Primer curso escolar habilitado en MathLabs.',1,true,true),
  ('cl-6-basico','basica','6-basico','6.º básico','6.º básico',6,'CL','Planificado',null,'Próxima expansión curricular.',2,false,true),
  ('cl-7-basico','basica','7-basico','7.º básico','7.º básico',7,'CL','Planificado',null,'Próxima expansión curricular.',3,false,true),
  ('cl-8-basico','basica','8-basico','8.º básico','8.º básico',8,'CL','Planificado',null,'Próxima expansión curricular.',4,false,true),
  ('cl-1-medio','media','1-medio','1.º medio','1.º medio',1,'CL','Planificado',null,'Próxima expansión curricular.',5,false,true),
  ('cl-2-medio','media','2-medio','2.º medio','2.º medio',2,'CL','Planificado',null,'Próxima expansión curricular.',6,false,true),
  ('cl-3-medio','media','3-medio','3.º medio','3.º medio',3,'CL','Planificado',null,'Próxima expansión curricular.',7,false,true),
  ('cl-4-medio','media','4-medio','4.º medio','4.º medio',4,'CL','Planificado',null,'Preparación escolar y conexión con PAES.',8,false,true)
on conflict (id) do update set
  level_id = excluded.level_id,
  slug = excluded.slug,
  name = excluded.name,
  short_name = excluded.short_name,
  grade_number = excluded.grade_number,
  curriculum_version = excluded.curriculum_version,
  curriculum_source_url = excluded.curriculum_source_url,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_available = excluded.is_available,
  is_published = excluded.is_published;

-- Ejes de 5.º básico.
insert into public.curriculum_axes (id, course_id, slug, name, description, icon, sort_order, is_published) values
  ('ma05-num','cl-5-basico','numeros-y-operaciones','Números y operaciones','Desarrollo del sentido numérico, cálculo, fracciones y decimales.','123',1,true),
  ('ma05-alg','cl-5-basico','patrones-y-algebra','Patrones y álgebra','Regularidades, predicciones, ecuaciones e inecuaciones de un paso.','x',2,true),
  ('ma05-geo','cl-5-basico','geometria','Geometría','Coordenadas, relaciones geométricas y transformaciones.','△',3,true),
  ('ma05-med','cl-5-basico','medicion','Medición','Longitud, conversiones, perímetro y área.','↔',4,true),
  ('ma05-datos','cl-5-basico','datos-y-probabilidades','Datos y probabilidades','Promedio, azar, tablas y gráficos.','▥',5,true)
on conflict (id) do update set name=excluded.name, description=excluded.description, icon=excluded.icon, sort_order=excluded.sort_order, is_published=excluded.is_published;

-- Objetivos curriculares y temas iniciales.
insert into public.curriculum_objectives (id,course_id,axis_id,code,title,summary,official_source_url,sort_order,is_published) values
  ('ma05-oa-01','cl-5-basico','ma05-num','MA05 OA 01','Números naturales y valor posicional','Representar, componer, descomponer, aproximar, comparar y ordenar números naturales menores que mil millones.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',1,true),
  ('ma05-oa-02','cl-5-basico','ma05-num','MA05 OA 02','Estrategias de cálculo mental','Aplicar estrategias de multiplicación mental usando múltiplos de 10, dobles, mitades y propiedades de las operaciones.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',2,true),
  ('ma05-oa-03','cl-5-basico','ma05-num','MA05 OA 03','Multiplicación de dos dígitos','Comprender y resolver multiplicaciones de dos dígitos por dos dígitos mediante estimación, estrategias y algoritmo.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',3,true),
  ('ma05-oa-04','cl-5-basico','ma05-num','MA05 OA 04','División e interpretación del resto','Resolver divisiones con dividendos de tres dígitos y divisores de un dígito, interpretando el resto según el contexto.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',4,true),
  ('ma05-oa-05','cl-5-basico','ma05-num','MA05 OA 05','Operatoria combinada','Realizar cálculos con las cuatro operaciones respetando paréntesis y prioridad operacional.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',5,true),
  ('ma05-oa-06','cl-5-basico','ma05-num','MA05 OA 06','Problemas con las cuatro operaciones','Resolver problemas rutinarios y no rutinarios, incluidos contextos de dinero, usando combinaciones de operaciones.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',6,true),
  ('ma05-oa-07','cl-5-basico','ma05-num','MA05 OA 07','Fracciones propias','Representar, amplificar, simplificar y comparar fracciones propias con igual o distinto denominador.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',7,true),
  ('ma05-oa-08','cl-5-basico','ma05-num','MA05 OA 08','Fracciones impropias y números mixtos','Representar fracciones impropias y números mixtos, establecer equivalencias y ubicarlos en la recta numérica.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',8,true),
  ('ma05-oa-09','cl-5-basico','ma05-num','MA05 OA 09','Suma y resta de fracciones','Resolver adiciones y sustracciones de fracciones propias con denominadores hasta 12.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',9,true),
  ('ma05-oa-10','cl-5-basico','ma05-num','MA05 OA 10','Fracciones y decimales equivalentes','Determinar el decimal asociado a fracciones con denominadores 2, 4, 5 y 10.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',10,true),
  ('ma05-oa-11','cl-5-basico','ma05-num','MA05 OA 11','Comparación de decimales','Comparar y ordenar números decimales hasta la milésima.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',11,true),
  ('ma05-oa-12','cl-5-basico','ma05-num','MA05 OA 12','Suma y resta de decimales','Resolver adiciones y sustracciones de decimales usando valor posicional hasta la milésima.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',12,true),
  ('ma05-oa-13','cl-5-basico','ma05-num','MA05 OA 13','Problemas con fracciones y decimales','Resolver problemas que involucren sumas y restas de fracciones propias o decimales hasta la milésima.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',13,true),
  ('ma05-oa-14','cl-5-basico','ma05-alg','MA05 OA 14','Reglas y sucesiones','Descubrir reglas de sucesiones y utilizarlas para realizar predicciones.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',14,true),
  ('ma05-oa-15','cl-5-basico','ma05-alg','MA05 OA 15','Ecuaciones e inecuaciones de un paso','Resolver problemas con ecuaciones e inecuaciones de un paso que involucren adición y sustracción.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',15,true),
  ('ma05-oa-16','cl-5-basico','ma05-geo','MA05 OA 16','Plano cartesiano','Identificar y dibujar puntos del primer cuadrante a partir de coordenadas naturales.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',16,true),
  ('ma05-oa-17','cl-5-basico','ma05-geo','MA05 OA 17','Paralelismo y perpendicularidad','Reconocer y describir elementos paralelos, secantes y perpendiculares en figuras 2D y 3D.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',17,true),
  ('ma05-oa-18','cl-5-basico','ma05-geo','MA05 OA 18','Congruencia y transformaciones','Comprender la congruencia mediante traslaciones, reflexiones y rotaciones en cuadrículas.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',18,true),
  ('ma05-oa-19','cl-5-basico','ma05-med','MA05 OA 19','Medición de longitudes','Medir longitudes con metros, centímetros y milímetros en problemas contextualizados.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',19,true),
  ('ma05-oa-20','cl-5-basico','ma05-med','MA05 OA 20','Conversión de unidades de longitud','Transformar entre kilómetros, metros, centímetros y milímetros.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',20,true),
  ('ma05-oa-21','cl-5-basico','ma05-med','MA05 OA 21','Rectángulos, perímetro y área','Diseñar rectángulos a partir del perímetro, el área o ambos, y extraer conclusiones.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',21,true),
  ('ma05-oa-22','cl-5-basico','ma05-med','MA05 OA 22','Áreas de figuras','Calcular áreas de triángulos, paralelogramos y trapecios, y estimar áreas de figuras irregulares.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',22,true),
  ('ma05-oa-23','cl-5-basico','ma05-datos','MA05 OA 23','Promedio e interpretación','Calcular el promedio de un conjunto de datos e interpretarlo en su contexto.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',23,true),
  ('ma05-oa-24','cl-5-basico','ma05-datos','MA05 OA 24','Posibilidad de ocurrencia','Describir eventos aleatorios como seguros, posibles, poco posibles o imposibles.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',24,true),
  ('ma05-oa-25','cl-5-basico','ma05-datos','MA05 OA 25','Comparación cualitativa de probabilidades','Comparar la probabilidad de distintos eventos sin necesidad de calcularla numéricamente.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',25,true),
  ('ma05-oa-26','cl-5-basico','ma05-datos','MA05 OA 26','Tablas y gráficos','Leer, interpretar y completar tablas, gráficos de barras y gráficos de líneas, comunicando conclusiones.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',26,true),
  ('ma05-oa-27','cl-5-basico','ma05-datos','MA05 OA 27','Diagramas de tallo y hojas','Representar datos de muestras mediante diagramas de tallo y hojas.','https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico',27,true)
on conflict (id) do update set axis_id=excluded.axis_id, title=excluded.title, summary=excluded.summary, official_source_url=excluded.official_source_url, sort_order=excluded.sort_order, is_published=excluded.is_published;
insert into public.knowledge_topics (id,course_id,axis_id,slug,title,summary,difficulty,estimated_minutes,sort_order,content_status,is_published) values
  ('topic-ma05-oa-01','cl-5-basico','ma05-num','numeros-naturales-valor-posicional','Números naturales y valor posicional','Representar, componer, descomponer, aproximar, comparar y ordenar números naturales menores que mil millones.','Fundamental',35,1,'mapped',true),
  ('topic-ma05-oa-02','cl-5-basico','ma05-num','estrategias-de-calculo-mental','Estrategias de cálculo mental','Aplicar estrategias de multiplicación mental usando múltiplos de 10, dobles, mitades y propiedades de las operaciones.','Fundamental',35,2,'mapped',true),
  ('topic-ma05-oa-03','cl-5-basico','ma05-num','multiplicacion-de-dos-digitos','Multiplicación de dos dígitos','Comprender y resolver multiplicaciones de dos dígitos por dos dígitos mediante estimación, estrategias y algoritmo.','Fundamental',35,3,'mapped',true),
  ('topic-ma05-oa-04','cl-5-basico','ma05-num','division-e-interpretacion-del-resto','División e interpretación del resto','Resolver divisiones con dividendos de tres dígitos y divisores de un dígito, interpretando el resto según el contexto.','Fundamental',35,4,'mapped',true),
  ('topic-ma05-oa-05','cl-5-basico','ma05-num','operatoria-combinada','Operatoria combinada','Realizar cálculos con las cuatro operaciones respetando paréntesis y prioridad operacional.','Fundamental',35,5,'mapped',true),
  ('topic-ma05-oa-06','cl-5-basico','ma05-num','problemas-con-las-cuatro-operaciones','Problemas con las cuatro operaciones','Resolver problemas rutinarios y no rutinarios, incluidos contextos de dinero, usando combinaciones de operaciones.','Fundamental',35,6,'mapped',true),
  ('topic-ma05-oa-07','cl-5-basico','ma05-num','fracciones-propias','Fracciones propias','Representar, amplificar, simplificar y comparar fracciones propias con igual o distinto denominador.','Fundamental',35,7,'mapped',true),
  ('topic-ma05-oa-08','cl-5-basico','ma05-num','fracciones-impropias-numeros-mixtos','Fracciones impropias y números mixtos','Representar fracciones impropias y números mixtos, establecer equivalencias y ubicarlos en la recta numérica.','Fundamental',35,8,'mapped',true),
  ('topic-ma05-oa-09','cl-5-basico','ma05-num','suma-resta-de-fracciones','Suma y resta de fracciones','Resolver adiciones y sustracciones de fracciones propias con denominadores hasta 12.','Fundamental',35,9,'mapped',true),
  ('topic-ma05-oa-10','cl-5-basico','ma05-num','fracciones-decimales-equivalentes','Fracciones y decimales equivalentes','Determinar el decimal asociado a fracciones con denominadores 2, 4, 5 y 10.','Fundamental',35,10,'mapped',true),
  ('topic-ma05-oa-11','cl-5-basico','ma05-num','comparacion-de-decimales','Comparación de decimales','Comparar y ordenar números decimales hasta la milésima.','Fundamental',35,11,'mapped',true),
  ('topic-ma05-oa-12','cl-5-basico','ma05-num','suma-resta-de-decimales','Suma y resta de decimales','Resolver adiciones y sustracciones de decimales usando valor posicional hasta la milésima.','Fundamental',35,12,'mapped',true),
  ('topic-ma05-oa-13','cl-5-basico','ma05-num','problemas-con-fracciones-decimales','Problemas con fracciones y decimales','Resolver problemas que involucren sumas y restas de fracciones propias o decimales hasta la milésima.','Fundamental',35,13,'mapped',true),
  ('topic-ma05-oa-14','cl-5-basico','ma05-alg','reglas-sucesiones','Reglas y sucesiones','Descubrir reglas de sucesiones y utilizarlas para realizar predicciones.','Fundamental',35,14,'mapped',true),
  ('topic-ma05-oa-15','cl-5-basico','ma05-alg','ecuaciones-e-inecuaciones-de-un-paso','Ecuaciones e inecuaciones de un paso','Resolver problemas con ecuaciones e inecuaciones de un paso que involucren adición y sustracción.','Fundamental',35,15,'mapped',true),
  ('topic-ma05-oa-16','cl-5-basico','ma05-geo','plano-cartesiano','Plano cartesiano','Identificar y dibujar puntos del primer cuadrante a partir de coordenadas naturales.','Fundamental',35,16,'mapped',true),
  ('topic-ma05-oa-17','cl-5-basico','ma05-geo','paralelismo-perpendicularidad','Paralelismo y perpendicularidad','Reconocer y describir elementos paralelos, secantes y perpendiculares en figuras 2D y 3D.','Fundamental',35,17,'mapped',true),
  ('topic-ma05-oa-18','cl-5-basico','ma05-geo','congruencia-transformaciones','Congruencia y transformaciones','Comprender la congruencia mediante traslaciones, reflexiones y rotaciones en cuadrículas.','Fundamental',35,18,'mapped',true),
  ('topic-ma05-oa-19','cl-5-basico','ma05-med','medicion-de-longitudes','Medición de longitudes','Medir longitudes con metros, centímetros y milímetros en problemas contextualizados.','Fundamental',35,19,'mapped',true),
  ('topic-ma05-oa-20','cl-5-basico','ma05-med','conversion-de-unidades-de-longitud','Conversión de unidades de longitud','Transformar entre kilómetros, metros, centímetros y milímetros.','Fundamental',35,20,'mapped',true),
  ('topic-ma05-oa-21','cl-5-basico','ma05-med','rectangulos-perimetro-area','Rectángulos, perímetro y área','Diseñar rectángulos a partir del perímetro, el área o ambos, y extraer conclusiones.','Fundamental',35,21,'mapped',true),
  ('topic-ma05-oa-22','cl-5-basico','ma05-med','areas-de-figuras','Áreas de figuras','Calcular áreas de triángulos, paralelogramos y trapecios, y estimar áreas de figuras irregulares.','Fundamental',35,22,'mapped',true),
  ('topic-ma05-oa-23','cl-5-basico','ma05-datos','promedio-e-interpretacion','Promedio e interpretación','Calcular el promedio de un conjunto de datos e interpretarlo en su contexto.','Fundamental',35,23,'mapped',true),
  ('topic-ma05-oa-24','cl-5-basico','ma05-datos','posibilidad-de-ocurrencia','Posibilidad de ocurrencia','Describir eventos aleatorios como seguros, posibles, poco posibles o imposibles.','Fundamental',35,24,'mapped',true),
  ('topic-ma05-oa-25','cl-5-basico','ma05-datos','comparacion-cualitativa-de-probabilidades','Comparación cualitativa de probabilidades','Comparar la probabilidad de distintos eventos sin necesidad de calcularla numéricamente.','Fundamental',35,25,'mapped',true),
  ('topic-ma05-oa-26','cl-5-basico','ma05-datos','tablas-graficos','Tablas y gráficos','Leer, interpretar y completar tablas, gráficos de barras y gráficos de líneas, comunicando conclusiones.','Fundamental',35,26,'mapped',true),
  ('topic-ma05-oa-27','cl-5-basico','ma05-datos','diagramas-de-tallo-hojas','Diagramas de tallo y hojas','Representar datos de muestras mediante diagramas de tallo y hojas.','Fundamental',35,27,'mapped',true)
on conflict (id) do update set axis_id=excluded.axis_id, slug=excluded.slug, title=excluded.title, summary=excluded.summary, difficulty=excluded.difficulty, estimated_minutes=excluded.estimated_minutes, sort_order=excluded.sort_order, content_status=excluded.content_status, is_published=excluded.is_published;
insert into public.curriculum_objective_topics (objective_id,topic_id,weight) values
  ('ma05-oa-01','topic-ma05-oa-01',1.00),
  ('ma05-oa-02','topic-ma05-oa-02',1.00),
  ('ma05-oa-03','topic-ma05-oa-03',1.00),
  ('ma05-oa-04','topic-ma05-oa-04',1.00),
  ('ma05-oa-05','topic-ma05-oa-05',1.00),
  ('ma05-oa-06','topic-ma05-oa-06',1.00),
  ('ma05-oa-07','topic-ma05-oa-07',1.00),
  ('ma05-oa-08','topic-ma05-oa-08',1.00),
  ('ma05-oa-09','topic-ma05-oa-09',1.00),
  ('ma05-oa-10','topic-ma05-oa-10',1.00),
  ('ma05-oa-11','topic-ma05-oa-11',1.00),
  ('ma05-oa-12','topic-ma05-oa-12',1.00),
  ('ma05-oa-13','topic-ma05-oa-13',1.00),
  ('ma05-oa-14','topic-ma05-oa-14',1.00),
  ('ma05-oa-15','topic-ma05-oa-15',1.00),
  ('ma05-oa-16','topic-ma05-oa-16',1.00),
  ('ma05-oa-17','topic-ma05-oa-17',1.00),
  ('ma05-oa-18','topic-ma05-oa-18',1.00),
  ('ma05-oa-19','topic-ma05-oa-19',1.00),
  ('ma05-oa-20','topic-ma05-oa-20',1.00),
  ('ma05-oa-21','topic-ma05-oa-21',1.00),
  ('ma05-oa-22','topic-ma05-oa-22',1.00),
  ('ma05-oa-23','topic-ma05-oa-23',1.00),
  ('ma05-oa-24','topic-ma05-oa-24',1.00),
  ('ma05-oa-25','topic-ma05-oa-25',1.00),
  ('ma05-oa-26','topic-ma05-oa-26',1.00),
  ('ma05-oa-27','topic-ma05-oa-27',1.00)
on conflict (objective_id,topic_id) do update set weight=excluded.weight;
insert into public.topic_prerequisites (topic_id,prerequisite_topic_id,relation_type) values
  ('topic-ma05-oa-03','topic-ma05-oa-02','required'),
  ('topic-ma05-oa-05','topic-ma05-oa-03','required'),
  ('topic-ma05-oa-05','topic-ma05-oa-04','required'),
  ('topic-ma05-oa-06','topic-ma05-oa-05','required'),
  ('topic-ma05-oa-08','topic-ma05-oa-07','required'),
  ('topic-ma05-oa-09','topic-ma05-oa-07','required'),
  ('topic-ma05-oa-10','topic-ma05-oa-07','required'),
  ('topic-ma05-oa-11','topic-ma05-oa-10','required'),
  ('topic-ma05-oa-12','topic-ma05-oa-11','required'),
  ('topic-ma05-oa-13','topic-ma05-oa-09','required'),
  ('topic-ma05-oa-13','topic-ma05-oa-12','required'),
  ('topic-ma05-oa-15','topic-ma05-oa-14','required'),
  ('topic-ma05-oa-20','topic-ma05-oa-19','required'),
  ('topic-ma05-oa-21','topic-ma05-oa-20','required'),
  ('topic-ma05-oa-22','topic-ma05-oa-21','required'),
  ('topic-ma05-oa-25','topic-ma05-oa-24','required'),
  ('topic-ma05-oa-27','topic-ma05-oa-26','required')
on conflict (topic_id,prerequisite_topic_id) do update set relation_type=excluded.relation_type;

commit;
