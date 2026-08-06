-- MathLabs V3 — Diagnóstico inicial y ruta personalizada
-- Requiere MathLabs V1 (08) y contexto escolar abierto V2 (10).
-- Crea un diagnóstico seguro de 5.º básico, evidencia de dominio y recomendaciones.

begin;

create extension if not exists pgcrypto;

alter table public.school_diagnostic_sessions
  add column if not exists diagnostic_version text not null default '5b-v1',
  add column if not exists answered_questions integer not null default 0,
  add column if not exists score_percent integer not null default 0
    check (score_percent between 0 and 100),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists school_diagnostic_one_active_idx
  on public.school_diagnostic_sessions(user_id, course_id)
  where status = 'started';

create table if not exists public.school_diagnostic_items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  course_id text not null references public.courses(id) on delete cascade,
  topic_id text not null references public.knowledge_topics(id) on delete cascade,
  prompt text not null check (char_length(trim(prompt)) between 10 and 1000),
  options jsonb not null,
  correct_option text not null check (correct_option in ('A','B','C','D')),
  explanation text not null default '',
  option_feedback jsonb not null default '{}'::jsonb,
  difficulty text not null default 'Fundamental'
    check (difficulty in ('Inicial','Fundamental','Intermedio','Avanzado')),
  diagnostic_version text not null default '5b-v1',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(options) = 'array')
);

create index if not exists school_diagnostic_items_course_version_idx
  on public.school_diagnostic_items(course_id, diagnostic_version, sort_order)
  where is_published = true;

create table if not exists public.school_diagnostic_session_items (
  session_id uuid not null references public.school_diagnostic_sessions(id) on delete cascade,
  item_id uuid not null references public.school_diagnostic_items(id) on delete restrict,
  position integer not null check (position > 0),
  primary key (session_id, item_id),
  unique (session_id, position)
);

create table if not exists public.school_diagnostic_responses (
  session_id uuid not null references public.school_diagnostic_sessions(id) on delete cascade,
  item_id uuid not null references public.school_diagnostic_items(id) on delete restrict,
  selected_option text not null check (selected_option in ('A','B','C','D')),
  is_correct boolean not null,
  confidence_level text not null default 'unsure'
    check (confidence_level in ('guessing','unsure','confident')),
  response_seconds integer check (response_seconds is null or response_seconds between 0 and 7200),
  responded_at timestamptz not null default now(),
  primary key (session_id, item_id)
);

create table if not exists public.student_study_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  topic_id text not null references public.knowledge_topics(id) on delete cascade,
  source_type text not null default 'diagnostic'
    check (source_type in ('diagnostic','agenda','mastery','manual')),
  source_session_id uuid references public.school_diagnostic_sessions(id) on delete set null,
  reason text not null default '',
  priority integer not null default 3 check (priority between 1 and 5),
  status text not null default 'pending'
    check (status in ('pending','in_progress','completed','dismissed')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists study_recommendations_user_status_idx
  on public.student_study_recommendations(user_id, status, priority desc, due_date);

create unique index if not exists study_recommendations_one_open_topic_idx
  on public.student_study_recommendations(user_id, topic_id)
  where status in ('pending','in_progress');

-- Fechas de actualización.
drop trigger if exists school_diagnostic_items_updated_at on public.school_diagnostic_items;
create trigger school_diagnostic_items_updated_at
before update on public.school_diagnostic_items
for each row execute function public.mathlabs_set_updated_at();

drop trigger if exists school_diagnostic_sessions_updated_at on public.school_diagnostic_sessions;
create trigger school_diagnostic_sessions_updated_at
before update on public.school_diagnostic_sessions
for each row execute function public.mathlabs_set_updated_at();

drop trigger if exists student_study_recommendations_updated_at on public.student_study_recommendations;
create trigger student_study_recommendations_updated_at
before update on public.student_study_recommendations
for each row execute function public.mathlabs_set_updated_at();

-- RLS.
alter table public.school_diagnostic_items enable row level security;
alter table public.school_diagnostic_session_items enable row level security;
alter table public.school_diagnostic_responses enable row level security;
alter table public.student_study_recommendations enable row level security;

-- Las respuestas correctas no se exponen directamente. Solo admins leen los ítems completos.
drop policy if exists "Admins manage diagnostic items" on public.school_diagnostic_items;
create policy "Admins manage diagnostic items"
on public.school_diagnostic_items
for all to authenticated
using (public.is_learning_admin())
with check (public.is_learning_admin());

drop policy if exists "Users read own diagnostic session items" on public.school_diagnostic_session_items;
create policy "Users read own diagnostic session items"
on public.school_diagnostic_session_items
for select to authenticated
using (
  exists (
    select 1 from public.school_diagnostic_sessions s
    where s.id = school_diagnostic_session_items.session_id
      and (s.user_id = auth.uid() or public.is_learning_admin())
  )
);

drop policy if exists "Users read own diagnostic responses" on public.school_diagnostic_responses;
create policy "Users read own diagnostic responses"
on public.school_diagnostic_responses
for select to authenticated
using (
  exists (
    select 1 from public.school_diagnostic_sessions s
    where s.id = school_diagnostic_responses.session_id
      and (s.user_id = auth.uid() or public.is_learning_admin())
  )
);

drop policy if exists "Users read own recommendations" on public.student_study_recommendations;
create policy "Users read own recommendations"
on public.student_study_recommendations
for select to authenticated
using (user_id = auth.uid() or public.is_learning_admin());

drop policy if exists "Users update own recommendations" on public.student_study_recommendations;
create policy "Users update own recommendations"
on public.student_study_recommendations
for update to authenticated
using (user_id = auth.uid() or public.is_learning_admin())
with check (user_id = auth.uid() or public.is_learning_admin());

drop policy if exists "Admins manage recommendations" on public.student_study_recommendations;
create policy "Admins manage recommendations"
on public.student_study_recommendations
for all to authenticated
using (public.is_learning_admin())
with check (public.is_learning_admin());

-- Endurece dominio y sesiones: lectura directa; escritura mediante funciones seguras.
drop policy if exists "Users manage own topic mastery" on public.student_topic_mastery;
drop policy if exists "Users read own topic mastery" on public.student_topic_mastery;
create policy "Users read own topic mastery"
on public.student_topic_mastery
for select to authenticated
using (user_id = auth.uid() or public.is_learning_admin());

drop policy if exists "Admins manage topic mastery" on public.student_topic_mastery;
create policy "Admins manage topic mastery"
on public.student_topic_mastery
for all to authenticated
using (public.is_learning_admin())
with check (public.is_learning_admin());

drop policy if exists "Users manage own school diagnostics" on public.school_diagnostic_sessions;
drop policy if exists "Users read own school diagnostics" on public.school_diagnostic_sessions;
create policy "Users read own school diagnostics"
on public.school_diagnostic_sessions
for select to authenticated
using (user_id = auth.uid() or public.is_learning_admin());

drop policy if exists "Admins manage school diagnostics" on public.school_diagnostic_sessions;
create policy "Admins manage school diagnostics"
on public.school_diagnostic_sessions
for all to authenticated
using (public.is_learning_admin())
with check (public.is_learning_admin());

-- Privilegios de tablas.
grant select, insert, update, delete on public.school_diagnostic_items to authenticated;
grant select on public.school_diagnostic_session_items, public.school_diagnostic_responses to authenticated;
grant select, update on public.student_study_recommendations to authenticated;

revoke insert, update, delete on public.school_diagnostic_sessions from authenticated;
grant select on public.school_diagnostic_sessions to authenticated;

revoke insert, update, delete on public.student_topic_mastery from authenticated;
grant select on public.student_topic_mastery to authenticated;


insert into public.school_diagnostic_items (
  code, course_id, topic_id, prompt, options, correct_option,
  explanation, option_feedback, difficulty, diagnostic_version,
  sort_order, is_published
)
values
  ('D5-NUM-001', 'cl-5-basico', 'topic-ma05-oa-01', '¿Cuál es la descomposición correcta del número 507.204?', '[{"id":"A","text":"500.000 + 7.000 + 200 + 4"},{"id":"B","text":"50.000 + 7.000 + 200 + 4"},{"id":"C","text":"500.000 + 70.000 + 20 + 4"},{"id":"D","text":"500.000 + 7.000 + 20 + 4"}]'::jsonb, 'A', 'En 507.204, el 5 ocupa las centenas de mil, el 7 las unidades de mil, el 2 las centenas y el 4 las unidades.', '{"A":"Correcto: cada cifra fue ubicada según su valor posicional.","B":"El 5 representa 500.000, no 50.000.","C":"El 7 representa 7.000 y el 2 representa 200.","D":"El 2 está en la posición de las centenas, por eso representa 200."}'::jsonb, 'Fundamental', '5b-v1', 1, true),
  ('D5-NUM-002', 'cl-5-basico', 'topic-ma05-oa-01', 'Al aproximar 648.321 a la centena de mil más cercana, ¿qué resultado se obtiene?', '[{"id":"A","text":"600.000"},{"id":"B","text":"650.000"},{"id":"C","text":"700.000"},{"id":"D","text":"648.000"}]'::jsonb, 'A', 'Para aproximar a la centena de mil se observa la cifra de las decenas de mil. Es 4, por lo que se mantiene el 6 y el resto se reemplaza por ceros.', '{"A":"Correcto: la cifra siguiente es 4, menor que 5.","B":"650.000 corresponde a aproximar a la decena de mil, no a la centena de mil.","C":"Para subir a 700.000, la cifra de las decenas de mil tendría que ser 5 o mayor.","D":"648.000 es una aproximación a la unidad de mil."}'::jsonb, 'Intermedio', '5b-v1', 2, true),
  ('D5-NUM-003', 'cl-5-basico', 'topic-ma05-oa-02', 'Sin usar algoritmo escrito, ¿cuál es el resultado de 25 × 16?', '[{"id":"A","text":"300"},{"id":"B","text":"350"},{"id":"C","text":"400"},{"id":"D","text":"450"}]'::jsonb, 'C', 'Se puede pensar 16 como 8 × 2. Como 25 × 8 = 200, al duplicar se obtiene 400.', '{"A":"Este resultado no corresponde a multiplicar 25 por 16.","B":"Revisa la estrategia de duplicar: 25 × 8 = 200.","C":"Correcto: 25 × 16 = 25 × 8 × 2 = 400.","D":"El resultado es demasiado alto; estima 25 × 16 como 400."}'::jsonb, 'Fundamental', '5b-v1', 3, true),
  ('D5-NUM-004', 'cl-5-basico', 'topic-ma05-oa-02', '¿Cuál de estas estrategias permite calcular correctamente 48 × 5?', '[{"id":"A","text":"48 × 10 y luego dividir por 2"},{"id":"B","text":"48 × 10 y luego sumar 5"},{"id":"C","text":"48 ÷ 2 y luego sumar 5"},{"id":"D","text":"48 × 4 y luego restar 5"}]'::jsonb, 'A', 'Multiplicar por 5 equivale a multiplicar por 10 y tomar la mitad: 48 × 10 = 480 y 480 ÷ 2 = 240.', '{"A":"Correcto: 5 es la mitad de 10.","B":"Sumar 5 no transforma una multiplicación por 10 en una multiplicación por 5.","C":"Dividir 48 por 2 no conserva el valor de la multiplicación.","D":"48 × 4 − 5 no es equivalente a 48 × 5."}'::jsonb, 'Fundamental', '5b-v1', 4, true),
  ('D5-NUM-005', 'cl-5-basico', 'topic-ma05-oa-03', '¿Cuál es el resultado de 34 × 27?', '[{"id":"A","text":"818"},{"id":"B","text":"884"},{"id":"C","text":"918"},{"id":"D","text":"1.018"}]'::jsonb, 'C', '34 × 27 = 34 × (20 + 7) = 680 + 238 = 918.', '{"A":"Falta considerar correctamente ambos productos parciales.","B":"Revisa 34 × 7: es 238.","C":"Correcto: 680 + 238 = 918.","D":"El resultado supera demasiado la estimación 30 × 30 ≈ 900."}'::jsonb, 'Intermedio', '5b-v1', 5, true),
  ('D5-NUM-006', 'cl-5-basico', 'topic-ma05-oa-03', 'Sin calcular exactamente, ¿cuál es la mejor estimación de 49 × 31?', '[{"id":"A","text":"150"},{"id":"B","text":"500"},{"id":"C","text":"1.500"},{"id":"D","text":"15.000"}]'::jsonb, 'C', '49 es cercano a 50 y 31 es cercano a 30. Entonces 50 × 30 = 1.500.', '{"A":"Es demasiado pequeño para multiplicar números cercanos a 50 y 30.","B":"También es menor que la magnitud esperada.","C":"Correcto: 50 × 30 entrega una estimación razonable.","D":"Es diez veces mayor que la estimación adecuada."}'::jsonb, 'Fundamental', '5b-v1', 6, true),
  ('D5-NUM-007', 'cl-5-basico', 'topic-ma05-oa-04', 'Al dividir 728 entre 6, ¿cuál es el cociente y el resto?', '[{"id":"A","text":"120, resto 8"},{"id":"B","text":"121, resto 2"},{"id":"C","text":"122, resto 4"},{"id":"D","text":"123, resto 0"}]'::jsonb, 'B', '6 × 121 = 726. Al restar 728 − 726 quedan 2 unidades.', '{"A":"El resto debe ser menor que el divisor; 8 no puede ser resto al dividir por 6.","B":"Correcto: 728 = 6 × 121 + 2.","C":"6 × 122 = 732, que supera 728.","D":"6 × 123 = 738, también supera 728."}'::jsonb, 'Intermedio', '5b-v1', 7, true),
  ('D5-NUM-008', 'cl-5-basico', 'topic-ma05-oa-04', 'En una salida participan 95 estudiantes. Cada minibús puede llevar 8 estudiantes. ¿Cuál es el mínimo de minibuses necesarios?', '[{"id":"A","text":"11"},{"id":"B","text":"12"},{"id":"C","text":"13"},{"id":"D","text":"16"}]'::jsonb, 'B', '95 ÷ 8 = 11 con resto 7. Once minibuses no alcanzan, por lo que se necesita uno adicional: 12.', '{"A":"Once minibuses transportan solo 88 estudiantes.","B":"Correcto: el resto obliga a usar un minibús adicional.","C":"Doce son suficientes; no se necesita uno más.","D":"Este número no se obtiene de interpretar la división."}'::jsonb, 'Intermedio', '5b-v1', 8, true),
  ('D5-NUM-009', 'cl-5-basico', 'topic-ma05-oa-05', '¿Cuál es el resultado de 72 − 4 × 9?', '[{"id":"A","text":"36"},{"id":"B","text":"45"},{"id":"C","text":"612"},{"id":"D","text":"648"}]'::jsonb, 'A', 'Primero se resuelve la multiplicación: 4 × 9 = 36. Luego 72 − 36 = 36.', '{"A":"Correcto: se respetó la prioridad de la multiplicación.","B":"Revisa la resta final: 72 − 36.","C":"Este resultado surge de alterar la prioridad de las operaciones.","D":"Aquí se multiplicó todo, pero la expresión incluye una resta."}'::jsonb, 'Fundamental', '5b-v1', 9, true),
  ('D5-NUM-010', 'cl-5-basico', 'topic-ma05-oa-05', '¿Cuál es el valor de (18 + 6) ÷ 3 + 5?', '[{"id":"A","text":"8"},{"id":"B","text":"11"},{"id":"C","text":"13"},{"id":"D","text":"29"}]'::jsonb, 'C', 'Primero: 18 + 6 = 24. Luego 24 ÷ 3 = 8. Finalmente 8 + 5 = 13.', '{"A":"Falta realizar la suma final de 5.","B":"Revisa el valor de 24 ÷ 3.","C":"Correcto: agrupación, división y suma final.","D":"Se sumaron términos sin respetar la división."}'::jsonb, 'Intermedio', '5b-v1', 10, true),
  ('D5-NUM-011', 'cl-5-basico', 'topic-ma05-oa-07', '¿Cuál fracción es equivalente a 3/4?', '[{"id":"A","text":"6/10"},{"id":"B","text":"8/12"},{"id":"C","text":"9/12"},{"id":"D","text":"12/15"}]'::jsonb, 'C', 'Al multiplicar numerador y denominador de 3/4 por 3 se obtiene 9/12.', '{"A":"6/10 se simplifica a 3/5.","B":"8/12 se simplifica a 2/3.","C":"Correcto: 3/4 × 3/3 = 9/12.","D":"12/15 se simplifica a 4/5."}'::jsonb, 'Fundamental', '5b-v1', 11, true),
  ('D5-NUM-012', 'cl-5-basico', 'topic-ma05-oa-07', '¿Cuál de las siguientes comparaciones es correcta?', '[{"id":"A","text":"5/8 > 2/3"},{"id":"B","text":"5/8 = 2/3"},{"id":"C","text":"5/8 < 2/3"},{"id":"D","text":"No se pueden comparar"}]'::jsonb, 'C', 'Con denominador común 24: 5/8 = 15/24 y 2/3 = 16/24. Por eso 5/8 es menor.', '{"A":"Al usar denominador común se obtiene 15/24 y 16/24.","B":"Las fracciones no son equivalentes.","C":"Correcto: 15/24 < 16/24.","D":"Sí se pueden comparar usando fracciones equivalentes o decimales."}'::jsonb, 'Intermedio', '5b-v1', 12, true),
  ('D5-ALG-001', 'cl-5-basico', 'topic-ma05-oa-14', 'La sucesión 4, 9, 14, 19, … sigue una regla constante. ¿Cuál es el siguiente término?', '[{"id":"A","text":"20"},{"id":"B","text":"23"},{"id":"C","text":"24"},{"id":"D","text":"29"}]'::jsonb, 'C', 'Cada término aumenta en 5. Entonces 19 + 5 = 24.', '{"A":"La diferencia entre términos no es 1.","B":"Revisa la diferencia 9 − 4.","C":"Correcto: la regla es sumar 5.","D":"Este valor suma 10 en vez de 5."}'::jsonb, 'Fundamental', '5b-v1', 13, true),
  ('D5-ALG-002', 'cl-5-basico', 'topic-ma05-oa-14', 'Una sucesión comienza en 7 y aumenta 3 en cada paso. ¿Cuál es el décimo término?', '[{"id":"A","text":"30"},{"id":"B","text":"34"},{"id":"C","text":"37"},{"id":"D","text":"40"}]'::jsonb, 'B', 'Desde el primer hasta el décimo término hay 9 aumentos. Entonces 7 + 9 × 3 = 34.', '{"A":"Se aplicó una cantidad incorrecta de aumentos.","B":"Correcto: el primer término ya es 7, por eso hay 9 saltos.","C":"Este resultado usa 10 aumentos en lugar de 9.","D":"No corresponde a la regla sumar 3."}'::jsonb, 'Intermedio', '5b-v1', 14, true),
  ('D5-GEO-001', 'cl-5-basico', 'topic-ma05-oa-16', 'Para ubicar el punto (4, 2) en el primer cuadrante, ¿qué desplazamiento se realiza desde el origen?', '[{"id":"A","text":"4 a la derecha y 2 hacia arriba"},{"id":"B","text":"2 a la derecha y 4 hacia arriba"},{"id":"C","text":"4 a la izquierda y 2 hacia arriba"},{"id":"D","text":"2 a la izquierda y 4 hacia abajo"}]'::jsonb, 'A', 'La primera coordenada indica el desplazamiento horizontal y la segunda el vertical.', '{"A":"Correcto: x = 4 y y = 2.","B":"Las coordenadas fueron intercambiadas.","C":"En el primer cuadrante se avanza hacia la derecha.","D":"Este desplazamiento no queda en el primer cuadrante."}'::jsonb, 'Fundamental', '5b-v1', 15, true),
  ('D5-GEO-002', 'cl-5-basico', 'topic-ma05-oa-16', 'El punto A está en (2, 5). Si se traslada 3 unidades hacia la derecha, ¿cuáles son sus nuevas coordenadas?', '[{"id":"A","text":"(2, 8)"},{"id":"B","text":"(3, 5)"},{"id":"C","text":"(5, 5)"},{"id":"D","text":"(5, 8)"}]'::jsonb, 'C', 'Moverse a la derecha aumenta la primera coordenada: 2 + 3 = 5. La segunda permanece en 5.', '{"A":"Se modificó la coordenada vertical, no la horizontal.","B":"Se reemplazó la primera coordenada por 3 en vez de sumarla.","C":"Correcto: (2 + 3, 5) = (5, 5).","D":"Solo cambia una coordenada al trasladarse horizontalmente."}'::jsonb, 'Intermedio', '5b-v1', 16, true),
  ('D5-MED-001', 'cl-5-basico', 'topic-ma05-oa-20', '¿Cuántos metros corresponden a 3,4 kilómetros?', '[{"id":"A","text":"34"},{"id":"B","text":"340"},{"id":"C","text":"3.400"},{"id":"D","text":"34.000"}]'::jsonb, 'C', 'Un kilómetro equivale a 1.000 metros. Entonces 3,4 × 1.000 = 3.400.', '{"A":"Faltan dos factores de 10.","B":"Falta un factor de 10.","C":"Correcto: 3,4 km = 3.400 m.","D":"Este valor equivale a 34 km."}'::jsonb, 'Fundamental', '5b-v1', 17, true),
  ('D5-MED-002', 'cl-5-basico', 'topic-ma05-oa-20', 'Una cinta mide 2 m y 35 cm. ¿Cuál es su longitud expresada solo en centímetros?', '[{"id":"A","text":"37 cm"},{"id":"B","text":"205 cm"},{"id":"C","text":"235 cm"},{"id":"D","text":"2.350 cm"}]'::jsonb, 'C', 'Dos metros equivalen a 200 cm. Al sumar 35 cm se obtiene 235 cm.', '{"A":"Se sumaron 2 y 35 sin convertir unidades.","B":"Faltan 30 cm.","C":"Correcto: 200 cm + 35 cm = 235 cm.","D":"Este resultado multiplica por 10 de más."}'::jsonb, 'Fundamental', '5b-v1', 18, true),
  ('D5-MED-003', 'cl-5-basico', 'topic-ma05-oa-21', 'Un rectángulo mide 8 cm de largo y 5 cm de ancho. ¿Cuál es su perímetro?', '[{"id":"A","text":"13 cm"},{"id":"B","text":"26 cm"},{"id":"C","text":"40 cm"},{"id":"D","text":"80 cm"}]'::jsonb, 'B', 'El perímetro es la suma de los cuatro lados: 8 + 5 + 8 + 5 = 26 cm.', '{"A":"13 cm corresponde a sumar solo un largo y un ancho.","B":"Correcto: 2 × (8 + 5) = 26.","C":"40 cm² corresponde al área, no al perímetro.","D":"No corresponde ni al perímetro ni al área."}'::jsonb, 'Fundamental', '5b-v1', 19, true),
  ('D5-MED-004', 'cl-5-basico', 'topic-ma05-oa-21', 'Todos estos rectángulos tienen perímetro 24 unidades. ¿Cuál tiene mayor área?', '[{"id":"A","text":"2 × 10"},{"id":"B","text":"4 × 8"},{"id":"C","text":"5 × 7"},{"id":"D","text":"6 × 6"}]'::jsonb, 'D', 'Las áreas son 20, 32, 35 y 36 unidades cuadradas. El cuadrado 6 × 6 tiene la mayor área.', '{"A":"Su área es 20, menor que las demás.","B":"Su área es 32.","C":"Su área es 35, cercana pero no máxima.","D":"Correcto: el cuadrado alcanza 36 unidades cuadradas."}'::jsonb, 'Intermedio', '5b-v1', 20, true),
  ('D5-DAT-001', 'cl-5-basico', 'topic-ma05-oa-23', '¿Cuál es el promedio de 6, 8, 10 y 12?', '[{"id":"A","text":"8"},{"id":"B","text":"9"},{"id":"C","text":"10"},{"id":"D","text":"36"}]'::jsonb, 'B', 'La suma es 36 y hay 4 datos. Entonces 36 ÷ 4 = 9.', '{"A":"Revisa la suma total y la división por 4.","B":"Correcto: el promedio es 9.","C":"Este valor es uno de los datos, pero no el promedio.","D":"36 es la suma, no el promedio."}'::jsonb, 'Fundamental', '5b-v1', 21, true),
  ('D5-DAT-002', 'cl-5-basico', 'topic-ma05-oa-23', 'El promedio de 5 números es 15. Cuatro de ellos suman 62. ¿Cuál es el quinto número?', '[{"id":"A","text":"13"},{"id":"B","text":"15"},{"id":"C","text":"17"},{"id":"D","text":"77"}]'::jsonb, 'A', 'Si el promedio es 15, la suma total es 15 × 5 = 75. El número faltante es 75 − 62 = 13.', '{"A":"Correcto: 62 + 13 = 75.","B":"El promedio no tiene que coincidir con cada dato.","C":"62 + 17 = 79, que daría un promedio distinto.","D":"77 no es la diferencia entre la suma total y 62."}'::jsonb, 'Intermedio', '5b-v1', 22, true),
  ('D5-DAT-003', 'cl-5-basico', 'topic-ma05-oa-26', 'Una tabla registra libros prestados: lunes 12, martes 18 y miércoles 15. ¿Qué día tuvo el mayor número de préstamos?', '[{"id":"A","text":"Lunes"},{"id":"B","text":"Martes"},{"id":"C","text":"Miércoles"},{"id":"D","text":"Los tres días por igual"}]'::jsonb, 'B', 'El mayor valor de la tabla es 18 y corresponde al martes.', '{"A":"El lunes se registraron 12 préstamos.","B":"Correcto: 18 es el valor más alto.","C":"El miércoles hubo 15, menos que el martes.","D":"Los valores son diferentes."}'::jsonb, 'Fundamental', '5b-v1', 23, true),
  ('D5-DAT-004', 'cl-5-basico', 'topic-ma05-oa-26', 'En un gráfico de líneas, una cantidad pasa de 40 a 55 entre dos mediciones. ¿Cuál fue el aumento?', '[{"id":"A","text":"15"},{"id":"B","text":"25"},{"id":"C","text":"40"},{"id":"D","text":"95"}]'::jsonb, 'A', 'El cambio se calcula restando el valor inicial al final: 55 − 40 = 15.', '{"A":"Correcto: aumentó 15 unidades.","B":"No corresponde a la diferencia entre 55 y 40.","C":"40 es el valor inicial.","D":"95 es la suma de ambos valores, no el aumento."}'::jsonb, 'Intermedio', '5b-v1', 24, true)
on conflict (code) do update set
  course_id = excluded.course_id,
  topic_id = excluded.topic_id,
  prompt = excluded.prompt,
  options = excluded.options,
  correct_option = excluded.correct_option,
  explanation = excluded.explanation,
  option_feedback = excluded.option_feedback,
  difficulty = excluded.difficulty,
  diagnostic_version = excluded.diagnostic_version,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published,
  updated_at = now();


-- Inicia un diagnóstico y crea una instantánea ordenada de preguntas.
create or replace function public.start_school_diagnostic(
  p_course_id text default 'cl-5-basico'
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_session uuid;
  v_total integer;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión';
  end if;

  if not exists (
    select 1 from public.courses
    where id = p_course_id and is_published = true
  ) then
    raise exception 'Curso no válido';
  end if;

  update public.school_diagnostic_sessions
  set status = 'abandoned', updated_at = now()
  where user_id = v_user
    and course_id = p_course_id
    and status = 'started';

  select count(*) into v_total
  from public.school_diagnostic_items
  where course_id = p_course_id
    and diagnostic_version = '5b-v1'
    and is_published = true;

  if v_total < 8 then
    raise exception 'El diagnóstico todavía no tiene suficientes preguntas publicadas';
  end if;

  insert into public.school_diagnostic_sessions (
    user_id, course_id, status, total_questions, correct_answers,
    result_summary, diagnostic_version, answered_questions,
    score_percent, started_at, updated_at
  ) values (
    v_user, p_course_id, 'started', v_total, 0,
    '{}'::jsonb, '5b-v1', 0, 0, now(), now()
  ) returning id into v_session;

  insert into public.school_diagnostic_session_items (session_id, item_id, position)
  select v_session, id, row_number() over (order by sort_order, code)::integer
  from public.school_diagnostic_items
  where course_id = p_course_id
    and diagnostic_version = '5b-v1'
    and is_published = true
  order by sort_order, code;

  return jsonb_build_object(
    'session_id', v_session,
    'course_id', p_course_id,
    'total_questions', v_total,
    'diagnostic_version', '5b-v1'
  );
end;
$$;

-- Entrega únicamente la siguiente pregunta pendiente, sin exponer la respuesta.
create or replace function public.get_school_diagnostic_question(
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_status text;
  v_total integer;
  v_answered integer;
  v_item record;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión';
  end if;

  select status, total_questions, answered_questions
  into v_status, v_total, v_answered
  from public.school_diagnostic_sessions
  where id = p_session_id and user_id = v_user;

  if not found then
    raise exception 'Diagnóstico no encontrado';
  end if;

  if v_status = 'completed' then
    return jsonb_build_object(
      'complete', true,
      'session_id', p_session_id,
      'answered_questions', v_answered,
      'total_questions', v_total
    );
  end if;

  if v_status <> 'started' then
    raise exception 'Este diagnóstico ya no está activo';
  end if;

  select
    si.position,
    i.id as item_id,
    i.code,
    i.prompt,
    i.options,
    i.difficulty,
    i.topic_id,
    t.title as topic_title
  into v_item
  from public.school_diagnostic_session_items si
  join public.school_diagnostic_items i on i.id = si.item_id
  join public.knowledge_topics t on t.id = i.topic_id
  left join public.school_diagnostic_responses r
    on r.session_id = si.session_id and r.item_id = si.item_id
  where si.session_id = p_session_id
    and r.item_id is null
  order by si.position
  limit 1;

  if not found then
    return jsonb_build_object(
      'complete', true,
      'session_id', p_session_id,
      'answered_questions', v_answered,
      'total_questions', v_total
    );
  end if;

  return jsonb_build_object(
    'complete', false,
    'session_id', p_session_id,
    'item_id', v_item.item_id,
    'code', v_item.code,
    'prompt', v_item.prompt,
    'options', v_item.options,
    'difficulty', v_item.difficulty,
    'topic_id', v_item.topic_id,
    'topic_title', v_item.topic_title,
    'position', v_item.position,
    'answered_questions', v_answered,
    'total_questions', v_total
  );
end;
$$;

-- Registra una respuesta una sola vez y devuelve retroalimentación inmediata.
create or replace function public.submit_school_diagnostic_answer(
  p_session_id uuid,
  p_item_id uuid,
  p_selected_option text,
  p_confidence_level text default 'unsure',
  p_response_seconds integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_item record;
  v_correct boolean;
  v_answered integer;
  v_correct_count integer;
  v_existing record;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión';
  end if;

  if p_selected_option not in ('A','B','C','D') then
    raise exception 'Alternativa no válida';
  end if;

  if p_confidence_level not in ('guessing','unsure','confident') then
    raise exception 'Nivel de seguridad no válido';
  end if;

  if not exists (
    select 1 from public.school_diagnostic_sessions
    where id = p_session_id and user_id = v_user and status = 'started'
  ) then
    raise exception 'Diagnóstico no disponible';
  end if;

  select i.correct_option, i.explanation, i.option_feedback
  into v_item
  from public.school_diagnostic_session_items si
  join public.school_diagnostic_items i on i.id = si.item_id
  where si.session_id = p_session_id and si.item_id = p_item_id;

  if not found then
    raise exception 'Pregunta no válida para este diagnóstico';
  end if;

  select selected_option, is_correct
  into v_existing
  from public.school_diagnostic_responses
  where session_id = p_session_id and item_id = p_item_id;

  if found then
    return jsonb_build_object(
      'saved', true,
      'already_answered', true,
      'selected_option', v_existing.selected_option,
      'is_correct', v_existing.is_correct,
      'correct_option', v_item.correct_option,
      'explanation', v_item.explanation,
      'feedback', coalesce(v_item.option_feedback ->> v_existing.selected_option, '')
    );
  end if;

  v_correct := p_selected_option = v_item.correct_option;

  insert into public.school_diagnostic_responses (
    session_id, item_id, selected_option, is_correct,
    confidence_level, response_seconds
  ) values (
    p_session_id, p_item_id, p_selected_option, v_correct,
    p_confidence_level, p_response_seconds
  );

  select count(*), count(*) filter (where is_correct)
  into v_answered, v_correct_count
  from public.school_diagnostic_responses
  where session_id = p_session_id;

  update public.school_diagnostic_sessions
  set answered_questions = v_answered,
      correct_answers = v_correct_count,
      score_percent = case
        when total_questions > 0 then round(100.0 * v_correct_count / total_questions)::integer
        else 0
      end,
      updated_at = now()
  where id = p_session_id;

  return jsonb_build_object(
    'saved', true,
    'already_answered', false,
    'selected_option', p_selected_option,
    'is_correct', v_correct,
    'correct_option', v_item.correct_option,
    'explanation', v_item.explanation,
    'feedback', coalesce(v_item.option_feedback ->> p_selected_option, ''),
    'answered_questions', v_answered
  );
end;
$$;

-- Completa el diagnóstico, actualiza dominio inicial y genera la ruta recomendada.
create or replace function public.complete_school_diagnostic(
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_session record;
  v_topics jsonb;
  v_score integer;
  v_summary jsonb;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión';
  end if;

  select * into v_session
  from public.school_diagnostic_sessions
  where id = p_session_id and user_id = v_user;

  if not found then
    raise exception 'Diagnóstico no encontrado';
  end if;

  if v_session.status = 'completed' then
    return jsonb_build_object(
      'session_id', p_session_id,
      'completed', true,
      'score_percent', v_session.score_percent,
      'correct_answers', v_session.correct_answers,
      'total_questions', v_session.total_questions,
      'summary', v_session.result_summary
    );
  end if;

  if v_session.status <> 'started' then
    raise exception 'Este diagnóstico no puede completarse';
  end if;

  if v_session.answered_questions < v_session.total_questions then
    raise exception 'Aún faltan preguntas por responder';
  end if;

  v_score := round(100.0 * v_session.correct_answers / greatest(v_session.total_questions, 1))::integer;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'topic_id', x.topic_id,
      'topic_slug', x.topic_slug,
      'topic_title', x.topic_title,
      'axis_name', x.axis_name,
      'correct', x.correct_count,
      'total', x.total_count,
      'score_percent', x.topic_score,
      'confidence_percent', x.confidence_score,
      'level', case
        when x.topic_score >= 80 then 'fortaleza'
        when x.topic_score >= 50 then 'en_desarrollo'
        else 'prioridad'
      end
    ) order by x.topic_score asc, x.topic_title
  ), '[]'::jsonb)
  into v_topics
  from (
    select
      i.topic_id,
      t.slug as topic_slug,
      t.title as topic_title,
      a.name as axis_name,
      count(*)::integer as total_count,
      count(*) filter (where r.is_correct)::integer as correct_count,
      round(100.0 * count(*) filter (where r.is_correct) / count(*))::integer as topic_score,
      round(avg(case r.confidence_level
        when 'confident' then 90
        when 'unsure' then 55
        else 25
      end))::integer as confidence_score
    from public.school_diagnostic_session_items si
    join public.school_diagnostic_items i on i.id = si.item_id
    join public.school_diagnostic_responses r
      on r.session_id = si.session_id and r.item_id = si.item_id
    join public.knowledge_topics t on t.id = i.topic_id
    join public.curriculum_axes a on a.id = t.axis_id
    where si.session_id = p_session_id
    group by i.topic_id, t.slug, t.title, a.name
  ) x;

  v_summary := jsonb_build_object(
    'course_id', v_session.course_id,
    'diagnostic_version', v_session.diagnostic_version,
    'score_percent', v_score,
    'topics', v_topics,
    'completed_at', now()
  );

  -- Evidencia inicial. El diagnóstico orienta, pero no otorga dominio completo.
  insert into public.student_topic_mastery (
    user_id, topic_id, mastery_percent, confidence_percent,
    attempts_count, correct_count, status,
    last_practiced_at, next_review_at, updated_at
  )
  select
    v_user,
    x.topic_id,
    case
      when x.topic_score >= 80 then 70
      when x.topic_score >= 50 then 42
      else 15
    end,
    x.confidence_score,
    x.total_count,
    x.correct_count,
    case
      when x.topic_score >= 80 then 'practicing'
      when x.topic_score >= 50 then 'learning'
      else 'learning'
    end,
    now(),
    case
      when x.topic_score >= 80 then now() + interval '14 days'
      when x.topic_score >= 50 then now() + interval '7 days'
      else now() + interval '2 days'
    end,
    now()
  from (
    select
      i.topic_id,
      count(*)::integer as total_count,
      count(*) filter (where r.is_correct)::integer as correct_count,
      round(100.0 * count(*) filter (where r.is_correct) / count(*))::integer as topic_score,
      round(avg(case r.confidence_level
        when 'confident' then 90
        when 'unsure' then 55
        else 25
      end))::integer as confidence_score
    from public.school_diagnostic_session_items si
    join public.school_diagnostic_items i on i.id = si.item_id
    join public.school_diagnostic_responses r
      on r.session_id = si.session_id and r.item_id = si.item_id
    where si.session_id = p_session_id
    group by i.topic_id
  ) x
  on conflict (user_id, topic_id) do update set
    mastery_percent = greatest(
      public.student_topic_mastery.mastery_percent,
      excluded.mastery_percent
    ),
    confidence_percent = excluded.confidence_percent,
    attempts_count = public.student_topic_mastery.attempts_count + excluded.attempts_count,
    correct_count = public.student_topic_mastery.correct_count + excluded.correct_count,
    status = case
      when public.student_topic_mastery.status = 'mastered' then 'mastered'
      else excluded.status
    end,
    last_practiced_at = now(),
    next_review_at = excluded.next_review_at,
    updated_at = now();

  -- Cierra recomendaciones diagnósticas anteriores del curso.
  update public.student_study_recommendations
  set status = 'dismissed', updated_at = now()
  where user_id = v_user
    and course_id = v_session.course_id
    and source_type = 'diagnostic'
    and status in ('pending','in_progress');

  insert into public.student_study_recommendations (
    user_id, course_id, topic_id, source_type, source_session_id,
    reason, priority, status, due_date
  )
  select
    v_user,
    v_session.course_id,
    x.topic_id,
    'diagnostic',
    p_session_id,
    case
      when x.topic_score = 0 then
        format('En el diagnóstico no acertaste preguntas de %s. Comienza con la explicación y los ejemplos fundamentales.', x.topic_title)
      else
        format('Obtuviste %s%% en %s. Conviene reforzar el procedimiento antes de avanzar.', x.topic_score, x.topic_title)
    end,
    case when x.topic_score = 0 then 5 else 4 end,
    'pending',
    current_date + case when x.topic_score = 0 then 2 else 5 end
  from (
    select
      i.topic_id,
      t.title as topic_title,
      round(100.0 * count(*) filter (where r.is_correct) / count(*))::integer as topic_score
    from public.school_diagnostic_session_items si
    join public.school_diagnostic_items i on i.id = si.item_id
    join public.school_diagnostic_responses r
      on r.session_id = si.session_id and r.item_id = si.item_id
    join public.knowledge_topics t on t.id = i.topic_id
    where si.session_id = p_session_id
    group by i.topic_id, t.title
    having round(100.0 * count(*) filter (where r.is_correct) / count(*)) < 80
    order by topic_score asc, t.title
    limit 6
  ) x
  on conflict (user_id, topic_id) where status in ('pending','in_progress')
  do update set
    reason = excluded.reason,
    priority = excluded.priority,
    source_session_id = excluded.source_session_id,
    due_date = excluded.due_date,
    status = 'pending',
    updated_at = now();

  update public.school_diagnostic_sessions
  set status = 'completed',
      score_percent = v_score,
      result_summary = v_summary,
      completed_at = now(),
      updated_at = now()
  where id = p_session_id;

  return jsonb_build_object(
    'session_id', p_session_id,
    'completed', true,
    'score_percent', v_score,
    'correct_answers', v_session.correct_answers,
    'total_questions', v_session.total_questions,
    'summary', v_summary
  );
end;
$$;

-- Permisos de ejecución: solo usuarios autenticados.
revoke all on function public.start_school_diagnostic(text) from public, anon, authenticated;
revoke all on function public.get_school_diagnostic_question(uuid) from public, anon, authenticated;
revoke all on function public.submit_school_diagnostic_answer(uuid,uuid,text,text,integer) from public, anon, authenticated;
revoke all on function public.complete_school_diagnostic(uuid) from public, anon, authenticated;

grant execute on function public.start_school_diagnostic(text) to authenticated;
grant execute on function public.get_school_diagnostic_question(uuid) to authenticated;
grant execute on function public.submit_school_diagnostic_answer(uuid,uuid,text,text,integer) to authenticated;
grant execute on function public.complete_school_diagnostic(uuid) to authenticated;

commit;
