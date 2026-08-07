-- MathLabs V8 — Aventura Tomo 1 y repasos seguros
begin;

create table if not exists public.school_review_sets (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text not null default '',
  icon text not null default '★',
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.school_review_items (
  id uuid primary key default gen_random_uuid(),
  review_set_id text not null references public.school_review_sets(id) on delete cascade,
  code text not null unique,
  prompt text not null,
  options jsonb not null check (jsonb_typeof(options)='array'),
  correct_option text not null check (correct_option in ('A','B','C','D')),
  explanation text not null default '',
  feedback_by_option jsonb not null default '{}'::jsonb,
  difficulty text not null check (difficulty in ('Fundamental','Intermedio','Avanzado')),
  skill text not null check (skill in ('Resolver problemas','Modelar','Representar','Argumentar')),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.school_review_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  review_set_id text not null references public.school_review_sets(id) on delete cascade,
  status text not null default 'active' check (status in ('active','completed','abandoned')),
  total_questions integer not null default 0,
  correct_answers integer not null default 0,
  score_percent integer not null default 0 check (score_percent between 0 and 100),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.school_review_session_items (
  session_id uuid not null references public.school_review_sessions(id) on delete cascade,
  item_id uuid not null references public.school_review_items(id) on delete cascade,
  position integer not null,
  primary key (session_id,item_id),
  unique (session_id,position)
);

create table if not exists public.school_review_responses (
  session_id uuid not null references public.school_review_sessions(id) on delete cascade,
  item_id uuid not null references public.school_review_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  selected_option text not null check (selected_option in ('A','B','C','D')),
  is_correct boolean not null,
  confidence_level text not null default 'unsure' check (confidence_level in ('unsure','somewhat','confident')),
  time_seconds integer not null default 0 check (time_seconds between 0 and 7200),
  answered_at timestamptz not null default now(),
  primary key (session_id,item_id)
);

create index if not exists school_review_items_set_idx on public.school_review_items(review_set_id,is_published,sort_order);
create index if not exists school_review_sessions_user_idx on public.school_review_sessions(user_id,started_at desc);

alter table public.school_review_sets enable row level security;
alter table public.school_review_items enable row level security;
alter table public.school_review_sessions enable row level security;
alter table public.school_review_session_items enable row level security;
alter table public.school_review_responses enable row level security;

drop policy if exists "Authenticated read published review sets" on public.school_review_sets;
create policy "Authenticated read published review sets" on public.school_review_sets for select to authenticated using (is_published or public.is_learning_admin());
drop policy if exists "Admins manage review sets" on public.school_review_sets;
create policy "Admins manage review sets" on public.school_review_sets for all to authenticated using (public.is_learning_admin()) with check (public.is_learning_admin());

drop policy if exists "Admins manage review items" on public.school_review_items;
create policy "Admins manage review items" on public.school_review_items for all to authenticated using (public.is_learning_admin()) with check (public.is_learning_admin());

drop policy if exists "Users read own review sessions" on public.school_review_sessions;
create policy "Users read own review sessions" on public.school_review_sessions for select to authenticated using (user_id=auth.uid() or public.is_learning_admin());
drop policy if exists "Users read own review session items" on public.school_review_session_items;
create policy "Users read own review session items" on public.school_review_session_items for select to authenticated using (exists (select 1 from public.school_review_sessions s where s.id=session_id and (s.user_id=auth.uid() or public.is_learning_admin())));
drop policy if exists "Users read own review responses" on public.school_review_responses;
create policy "Users read own review responses" on public.school_review_responses for select to authenticated using (user_id=auth.uid() or public.is_learning_admin());

insert into public.school_review_sets(id,course_id,slug,title,description,icon,sort_order,is_published) values
('tomo1-unidad1','cl-5-basico','tomo-1-unidad-1','Gran desafío · Unidad 1','Números grandes, multiplicación, división y longitud.','🚀',1,true),
('tomo1-unidad2','cl-5-basico','tomo-1-unidad-2','Gran desafío · Unidad 2','Decimales, patrones, fracciones y datos.','🌟',2,true)
on conflict (id) do update set course_id=excluded.course_id,slug=excluded.slug,title=excluded.title,description=excluded.description,icon=excluded.icon,sort_order=excluded.sort_order,is_published=excluded.is_published,updated_at=now();

insert into public.school_review_items(code,review_set_id,prompt,options,correct_option,explanation,feedback_by_option,difficulty,skill,sort_order,is_published)
select code,review_set_id,prompt,options,correct_option,explanation,feedback_by_option,difficulty,skill,sort_order,is_published
from jsonb_to_recordset($items$[{"code":"U1-001","review_set_id":"tomo1-unidad1","prompt":"¿Cómo se lee 4 205 018?","options":[{"id":"A","text":"Cuatro millones doscientos cinco mil dieciocho"},{"id":"B","text":"Cuatro millones veinticinco mil dieciocho"},{"id":"C","text":"Cuarenta y dos millones cinco mil dieciocho"},{"id":"D","text":"Cuatro millones doscientos cincuenta mil dieciocho"}],"correct_option":"A","explanation":"Separa el número en grupos: 4 | 205 | 018.","feedback_by_option":{"A":"¡Muy bien! Separa el número en grupos: 4 | 205 | 018.","B":"Revisa tu estrategia. Separa el número en grupos: 4 | 205 | 018.","C":"Revisa tu estrategia. Separa el número en grupos: 4 | 205 | 018.","D":"Revisa tu estrategia. Separa el número en grupos: 4 | 205 | 018."},"difficulty":"Fundamental","skill":"Representar","sort_order":1,"is_published":true},{"code":"U1-002","review_set_id":"tomo1-unidad1","prompt":"¿Cuál es la descomposición correcta de 7 040 306?","options":[{"id":"A","text":"7 000 000 + 40 000 + 300 + 6"},{"id":"B","text":"7 000 000 + 400 000 + 30 + 6"},{"id":"C","text":"700 000 + 40 000 + 300 + 6"},{"id":"D","text":"7 000 000 + 4 000 + 300 + 6"}],"correct_option":"A","explanation":"El 4 está en las decenas de mil y el 3 en las centenas.","feedback_by_option":{"A":"¡Muy bien! El 4 está en las decenas de mil y el 3 en las centenas.","B":"Revisa tu estrategia. El 4 está en las decenas de mil y el 3 en las centenas.","C":"Revisa tu estrategia. El 4 está en las decenas de mil y el 3 en las centenas.","D":"Revisa tu estrategia. El 4 está en las decenas de mil y el 3 en las centenas."},"difficulty":"Intermedio","skill":"Representar","sort_order":2,"is_published":true},{"code":"U1-003","review_set_id":"tomo1-unidad1","prompt":"¿Cuál es el número mayor?","options":[{"id":"A","text":"39 999 999"},{"id":"B","text":"40 000 001"},{"id":"C","text":"39 990 999"},{"id":"D","text":"4 000 001"}],"correct_option":"B","explanation":"40 000 001 supera los cuarenta millones; los otros son menores.","feedback_by_option":{"A":"Revisa tu estrategia. 40 000 001 supera los cuarenta millones; los otros son menores.","B":"¡Muy bien! 40 000 001 supera los cuarenta millones; los otros son menores.","C":"Revisa tu estrategia. 40 000 001 supera los cuarenta millones; los otros son menores.","D":"Revisa tu estrategia. 40 000 001 supera los cuarenta millones; los otros son menores."},"difficulty":"Fundamental","skill":"Argumentar","sort_order":3,"is_published":true},{"code":"U1-004","review_set_id":"tomo1-unidad1","prompt":"Ordena de menor a mayor: 8 900 000; 8 090 000; 8 009 000.","options":[{"id":"A","text":"8 009 000 < 8 090 000 < 8 900 000"},{"id":"B","text":"8 900 000 < 8 090 000 < 8 009 000"},{"id":"C","text":"8 090 000 < 8 009 000 < 8 900 000"},{"id":"D","text":"8 009 000 < 8 900 000 < 8 090 000"}],"correct_option":"A","explanation":"Compara desde la izquierda y observa centenas y decenas de mil.","feedback_by_option":{"A":"¡Muy bien! Compara desde la izquierda y observa centenas y decenas de mil.","B":"Revisa tu estrategia. Compara desde la izquierda y observa centenas y decenas de mil.","C":"Revisa tu estrategia. Compara desde la izquierda y observa centenas y decenas de mil.","D":"Revisa tu estrategia. Compara desde la izquierda y observa centenas y decenas de mil."},"difficulty":"Intermedio","skill":"Argumentar","sort_order":4,"is_published":true},{"code":"U1-005","review_set_id":"tomo1-unidad1","prompt":"Calcula mentalmente 8 × 30.","options":[{"id":"A","text":"24"},{"id":"B","text":"240"},{"id":"C","text":"2 400"},{"id":"D","text":"38"}],"correct_option":"B","explanation":"8 × 30 equivale a 8 × 3 decenas = 24 decenas = 240.","feedback_by_option":{"A":"Revisa tu estrategia. 8 × 30 equivale a 8 × 3 decenas = 24 decenas = 240.","B":"¡Muy bien! 8 × 30 equivale a 8 × 3 decenas = 24 decenas = 240.","C":"Revisa tu estrategia. 8 × 30 equivale a 8 × 3 decenas = 24 decenas = 240.","D":"Revisa tu estrategia. 8 × 30 equivale a 8 × 3 decenas = 24 decenas = 240."},"difficulty":"Fundamental","skill":"Resolver problemas","sort_order":5,"is_published":true},{"code":"U1-006","review_set_id":"tomo1-unidad1","prompt":"¿Qué estrategia es útil para 16 × 25?","options":[{"id":"A","text":"Doblar ambos factores"},{"id":"B","text":"Mitad de 16 y doble de 25"},{"id":"C","text":"Sumar 16 + 25"},{"id":"D","text":"Dividir ambos factores por 2"}],"correct_option":"B","explanation":"16 × 25 = 8 × 50 = 4 × 100.","feedback_by_option":{"A":"Revisa tu estrategia. 16 × 25 = 8 × 50 = 4 × 100.","B":"¡Muy bien! 16 × 25 = 8 × 50 = 4 × 100.","C":"Revisa tu estrategia. 16 × 25 = 8 × 50 = 4 × 100.","D":"Revisa tu estrategia. 16 × 25 = 8 × 50 = 4 × 100."},"difficulty":"Intermedio","skill":"Argumentar","sort_order":6,"is_published":true},{"code":"U1-007","review_set_id":"tomo1-unidad1","prompt":"Calcula 23 × 14 usando productos parciales.","options":[{"id":"A","text":"242"},{"id":"B","text":"322"},{"id":"C","text":"372"},{"id":"D","text":"462"}],"correct_option":"B","explanation":"23 × 10 = 230 y 23 × 4 = 92; 230 + 92 = 322.","feedback_by_option":{"A":"Revisa tu estrategia. 23 × 10 = 230 y 23 × 4 = 92; 230 + 92 = 322.","B":"¡Muy bien! 23 × 10 = 230 y 23 × 4 = 92; 230 + 92 = 322.","C":"Revisa tu estrategia. 23 × 10 = 230 y 23 × 4 = 92; 230 + 92 = 322.","D":"Revisa tu estrategia. 23 × 10 = 230 y 23 × 4 = 92; 230 + 92 = 322."},"difficulty":"Intermedio","skill":"Resolver problemas","sort_order":7,"is_published":true},{"code":"U1-008","review_set_id":"tomo1-unidad1","prompt":"Una caja tiene 28 cuadernos. ¿Cuántos cuadernos hay en 15 cajas?","options":[{"id":"A","text":"420"},{"id":"B","text":"430"},{"id":"C","text":"280"},{"id":"D","text":"415"}],"correct_option":"A","explanation":"28 × 15 = 28 × 10 + 28 × 5 = 280 + 140 = 420.","feedback_by_option":{"A":"¡Muy bien! 28 × 15 = 28 × 10 + 28 × 5 = 280 + 140 = 420.","B":"Revisa tu estrategia. 28 × 15 = 28 × 10 + 28 × 5 = 280 + 140 = 420.","C":"Revisa tu estrategia. 28 × 15 = 28 × 10 + 28 × 5 = 280 + 140 = 420.","D":"Revisa tu estrategia. 28 × 15 = 28 × 10 + 28 × 5 = 280 + 140 = 420."},"difficulty":"Avanzado","skill":"Modelar","sort_order":8,"is_published":true},{"code":"U1-009","review_set_id":"tomo1-unidad1","prompt":"¿Cuál estimación es razonable para 49 × 21?","options":[{"id":"A","text":"Cerca de 100"},{"id":"B","text":"Cerca de 500"},{"id":"C","text":"Cerca de 1 000"},{"id":"D","text":"Cerca de 10 000"}],"correct_option":"C","explanation":"49 ≈ 50 y 21 ≈ 20; 50 × 20 = 1 000.","feedback_by_option":{"A":"Revisa tu estrategia. 49 ≈ 50 y 21 ≈ 20; 50 × 20 = 1 000.","B":"Revisa tu estrategia. 49 ≈ 50 y 21 ≈ 20; 50 × 20 = 1 000.","C":"¡Muy bien! 49 ≈ 50 y 21 ≈ 20; 50 × 20 = 1 000.","D":"Revisa tu estrategia. 49 ≈ 50 y 21 ≈ 20; 50 × 20 = 1 000."},"difficulty":"Intermedio","skill":"Argumentar","sort_order":9,"is_published":true},{"code":"U1-010","review_set_id":"tomo1-unidad1","prompt":"37 lápices se guardan en cajas de 5. ¿Cuántas cajas completas se llenan y cuántos lápices sobran?","options":[{"id":"A","text":"7 cajas y sobran 2"},{"id":"B","text":"8 cajas y sobra 1"},{"id":"C","text":"6 cajas y sobran 7"},{"id":"D","text":"7 cajas exactas"}],"correct_option":"A","explanation":"5 × 7 = 35 y quedan 2 lápices.","feedback_by_option":{"A":"¡Muy bien! 5 × 7 = 35 y quedan 2 lápices.","B":"Revisa tu estrategia. 5 × 7 = 35 y quedan 2 lápices.","C":"Revisa tu estrategia. 5 × 7 = 35 y quedan 2 lápices.","D":"Revisa tu estrategia. 5 × 7 = 35 y quedan 2 lápices."},"difficulty":"Fundamental","skill":"Modelar","sort_order":10,"is_published":true},{"code":"U1-011","review_set_id":"tomo1-unidad1","prompt":"Se trasladan 41 estudiantes en vehículos con 9 cupos. ¿Cuántos vehículos se necesitan?","options":[{"id":"A","text":"4"},{"id":"B","text":"5"},{"id":"C","text":"6"},{"id":"D","text":"9"}],"correct_option":"B","explanation":"Con 4 vehículos viajan 36 y quedan 5 estudiantes; se necesita uno más.","feedback_by_option":{"A":"Revisa tu estrategia. Con 4 vehículos viajan 36 y quedan 5 estudiantes; se necesita uno más.","B":"¡Muy bien! Con 4 vehículos viajan 36 y quedan 5 estudiantes; se necesita uno más.","C":"Revisa tu estrategia. Con 4 vehículos viajan 36 y quedan 5 estudiantes; se necesita uno más.","D":"Revisa tu estrategia. Con 4 vehículos viajan 36 y quedan 5 estudiantes; se necesita uno más."},"difficulty":"Intermedio","skill":"Modelar","sort_order":11,"is_published":true},{"code":"U1-012","review_set_id":"tomo1-unidad1","prompt":"Comprueba 86 ÷ 4 = 21 y resto 2.","options":[{"id":"A","text":"21 + 4 + 2 = 27"},{"id":"B","text":"21 × 4 + 2 = 86"},{"id":"C","text":"86 × 4 = 344"},{"id":"D","text":"21 × 2 + 4 = 46"}],"correct_option":"B","explanation":"Divisor × cociente + resto debe dar el dividendo.","feedback_by_option":{"A":"Revisa tu estrategia. Divisor × cociente + resto debe dar el dividendo.","B":"¡Muy bien! Divisor × cociente + resto debe dar el dividendo.","C":"Revisa tu estrategia. Divisor × cociente + resto debe dar el dividendo.","D":"Revisa tu estrategia. Divisor × cociente + resto debe dar el dividendo."},"difficulty":"Fundamental","skill":"Argumentar","sort_order":12,"is_published":true},{"code":"U1-013","review_set_id":"tomo1-unidad1","prompt":"¿Qué unidad conviene para medir el largo de un lápiz?","options":[{"id":"A","text":"Kilómetros"},{"id":"B","text":"Metros"},{"id":"C","text":"Centímetros"},{"id":"D","text":"Litros"}],"correct_option":"C","explanation":"Un lápiz es un objeto pequeño que se mide cómodamente en centímetros.","feedback_by_option":{"A":"Revisa tu estrategia. Un lápiz es un objeto pequeño que se mide cómodamente en centímetros.","B":"Revisa tu estrategia. Un lápiz es un objeto pequeño que se mide cómodamente en centímetros.","C":"¡Muy bien! Un lápiz es un objeto pequeño que se mide cómodamente en centímetros.","D":"Revisa tu estrategia. Un lápiz es un objeto pequeño que se mide cómodamente en centímetros."},"difficulty":"Fundamental","skill":"Representar","sort_order":13,"is_published":true},{"code":"U1-014","review_set_id":"tomo1-unidad1","prompt":"Convierte 3 m a centímetros.","options":[{"id":"A","text":"30 cm"},{"id":"B","text":"300 cm"},{"id":"C","text":"3 000 cm"},{"id":"D","text":"0,3 cm"}],"correct_option":"B","explanation":"1 m = 100 cm, por eso 3 × 100 = 300.","feedback_by_option":{"A":"Revisa tu estrategia. 1 m = 100 cm, por eso 3 × 100 = 300.","B":"¡Muy bien! 1 m = 100 cm, por eso 3 × 100 = 300.","C":"Revisa tu estrategia. 1 m = 100 cm, por eso 3 × 100 = 300.","D":"Revisa tu estrategia. 1 m = 100 cm, por eso 3 × 100 = 300."},"difficulty":"Fundamental","skill":"Resolver problemas","sort_order":14,"is_published":true},{"code":"U1-015","review_set_id":"tomo1-unidad1","prompt":"Convierte 2,5 km a metros.","options":[{"id":"A","text":"25 m"},{"id":"B","text":"250 m"},{"id":"C","text":"2 500 m"},{"id":"D","text":"25 000 m"}],"correct_option":"C","explanation":"1 km = 1 000 m; 2,5 × 1 000 = 2 500.","feedback_by_option":{"A":"Revisa tu estrategia. 1 km = 1 000 m; 2,5 × 1 000 = 2 500.","B":"Revisa tu estrategia. 1 km = 1 000 m; 2,5 × 1 000 = 2 500.","C":"¡Muy bien! 1 km = 1 000 m; 2,5 × 1 000 = 2 500.","D":"Revisa tu estrategia. 1 km = 1 000 m; 2,5 × 1 000 = 2 500."},"difficulty":"Intermedio","skill":"Resolver problemas","sort_order":15,"is_published":true},{"code":"U1-016","review_set_id":"tomo1-unidad1","prompt":"Una cinta roja mide 15 cm y una azul 3 cm. ¿Cuántas veces cabe la azul en la roja?","options":[{"id":"A","text":"3 veces"},{"id":"B","text":"5 veces"},{"id":"C","text":"12 veces"},{"id":"D","text":"18 veces"}],"correct_option":"B","explanation":"15 ÷ 3 = 5.","feedback_by_option":{"A":"Revisa tu estrategia. 15 ÷ 3 = 5.","B":"¡Muy bien! 15 ÷ 3 = 5.","C":"Revisa tu estrategia. 15 ÷ 3 = 5.","D":"Revisa tu estrategia. 15 ÷ 3 = 5."},"difficulty":"Fundamental","skill":"Modelar","sort_order":16,"is_published":true},{"code":"U1-017","review_set_id":"tomo1-unidad1","prompt":"Una ruta mide 4 km y ya se recorrieron 1 250 m. ¿Cuántos metros faltan?","options":[{"id":"A","text":"2 750 m"},{"id":"B","text":"3 750 m"},{"id":"C","text":"2 850 m"},{"id":"D","text":"1 246 m"}],"correct_option":"A","explanation":"4 km = 4 000 m; 4 000 − 1 250 = 2 750.","feedback_by_option":{"A":"¡Muy bien! 4 km = 4 000 m; 4 000 − 1 250 = 2 750.","B":"Revisa tu estrategia. 4 km = 4 000 m; 4 000 − 1 250 = 2 750.","C":"Revisa tu estrategia. 4 km = 4 000 m; 4 000 − 1 250 = 2 750.","D":"Revisa tu estrategia. 4 km = 4 000 m; 4 000 − 1 250 = 2 750."},"difficulty":"Avanzado","skill":"Modelar","sort_order":17,"is_published":true},{"code":"U1-018","review_set_id":"tomo1-unidad1","prompt":"¿Cuál afirmación es correcta?","options":[{"id":"A","text":"500 cm es más largo que 5 m"},{"id":"B","text":"5 m = 500 cm"},{"id":"C","text":"1 km = 100 m"},{"id":"D","text":"10 mm = 10 cm"}],"correct_option":"B","explanation":"5 m y 500 cm representan la misma longitud.","feedback_by_option":{"A":"Revisa tu estrategia. 5 m y 500 cm representan la misma longitud.","B":"¡Muy bien! 5 m y 500 cm representan la misma longitud.","C":"Revisa tu estrategia. 5 m y 500 cm representan la misma longitud.","D":"Revisa tu estrategia. 5 m y 500 cm representan la misma longitud."},"difficulty":"Intermedio","skill":"Argumentar","sort_order":18,"is_published":true},{"code":"U2-001","review_set_id":"tomo1-unidad2","prompt":"¿Qué valor tiene el 7 en 3,472?","options":[{"id":"A","text":"7 unidades"},{"id":"B","text":"7 décimos"},{"id":"C","text":"7 centésimos"},{"id":"D","text":"7 milésimos"}],"correct_option":"C","explanation":"En 3,472, el 7 está en la posición de los centésimos.","feedback_by_option":{"A":"Revisa tu estrategia. En 3,472, el 7 está en la posición de los centésimos.","B":"Revisa tu estrategia. En 3,472, el 7 está en la posición de los centésimos.","C":"¡Muy bien! En 3,472, el 7 está en la posición de los centésimos.","D":"Revisa tu estrategia. En 3,472, el 7 está en la posición de los centésimos."},"difficulty":"Fundamental","skill":"Representar","sort_order":1,"is_published":true},{"code":"U2-002","review_set_id":"tomo1-unidad2","prompt":"Compara 2,5 y 2,45.","options":[{"id":"A","text":"2,5 < 2,45"},{"id":"B","text":"2,5 > 2,45"},{"id":"C","text":"Son iguales"},{"id":"D","text":"No se puede comparar"}],"correct_option":"B","explanation":"2,5 = 2,50, que es mayor que 2,45.","feedback_by_option":{"A":"Revisa tu estrategia. 2,5 = 2,50, que es mayor que 2,45.","B":"¡Muy bien! 2,5 = 2,50, que es mayor que 2,45.","C":"Revisa tu estrategia. 2,5 = 2,50, que es mayor que 2,45.","D":"Revisa tu estrategia. 2,5 = 2,50, que es mayor que 2,45."},"difficulty":"Fundamental","skill":"Argumentar","sort_order":2,"is_published":true},{"code":"U2-003","review_set_id":"tomo1-unidad2","prompt":"Calcula 3,4 + 1,25.","options":[{"id":"A","text":"4,29"},{"id":"B","text":"4,65"},{"id":"C","text":"4,125"},{"id":"D","text":"5,65"}],"correct_option":"B","explanation":"Alinea las comas: 3,40 + 1,25 = 4,65.","feedback_by_option":{"A":"Revisa tu estrategia. Alinea las comas: 3,40 + 1,25 = 4,65.","B":"¡Muy bien! Alinea las comas: 3,40 + 1,25 = 4,65.","C":"Revisa tu estrategia. Alinea las comas: 3,40 + 1,25 = 4,65.","D":"Revisa tu estrategia. Alinea las comas: 3,40 + 1,25 = 4,65."},"difficulty":"Fundamental","skill":"Resolver problemas","sort_order":3,"is_published":true},{"code":"U2-004","review_set_id":"tomo1-unidad2","prompt":"Calcula 6,8 − 2,35.","options":[{"id":"A","text":"4,45"},{"id":"B","text":"4,55"},{"id":"C","text":"4,35"},{"id":"D","text":"3,45"}],"correct_option":"A","explanation":"6,80 − 2,35 = 4,45.","feedback_by_option":{"A":"¡Muy bien! 6,80 − 2,35 = 4,45.","B":"Revisa tu estrategia. 6,80 − 2,35 = 4,45.","C":"Revisa tu estrategia. 6,80 − 2,35 = 4,45.","D":"Revisa tu estrategia. 6,80 − 2,35 = 4,45."},"difficulty":"Intermedio","skill":"Resolver problemas","sort_order":4,"is_published":true},{"code":"U2-005","review_set_id":"tomo1-unidad2","prompt":"Una botella tiene 1,5 L y se usan 0,375 L. ¿Cuánto queda?","options":[{"id":"A","text":"1,125 L"},{"id":"B","text":"1,875 L"},{"id":"C","text":"0,125 L"},{"id":"D","text":"1,135 L"}],"correct_option":"A","explanation":"1,500 − 0,375 = 1,125.","feedback_by_option":{"A":"¡Muy bien! 1,500 − 0,375 = 1,125.","B":"Revisa tu estrategia. 1,500 − 0,375 = 1,125.","C":"Revisa tu estrategia. 1,500 − 0,375 = 1,125.","D":"Revisa tu estrategia. 1,500 − 0,375 = 1,125."},"difficulty":"Avanzado","skill":"Modelar","sort_order":5,"is_published":true},{"code":"U2-006","review_set_id":"tomo1-unidad2","prompt":"Completa el patrón: 4, 7, 10, 13, __.","options":[{"id":"A","text":"14"},{"id":"B","text":"15"},{"id":"C","text":"16"},{"id":"D","text":"17"}],"correct_option":"C","explanation":"La regla es sumar 3.","feedback_by_option":{"A":"Revisa tu estrategia. La regla es sumar 3.","B":"Revisa tu estrategia. La regla es sumar 3.","C":"¡Muy bien! La regla es sumar 3.","D":"Revisa tu estrategia. La regla es sumar 3."},"difficulty":"Fundamental","skill":"Representar","sort_order":6,"is_published":true},{"code":"U2-007","review_set_id":"tomo1-unidad2","prompt":"Una figura comienza con 5 palitos y cada figura agrega 2. ¿Cuántos palitos tiene la figura 6?","options":[{"id":"A","text":"12"},{"id":"B","text":"13"},{"id":"C","text":"15"},{"id":"D","text":"17"}],"correct_option":"C","explanation":"Los valores son 5, 7, 9, 11, 13, 15.","feedback_by_option":{"A":"Revisa tu estrategia. Los valores son 5, 7, 9, 11, 13, 15.","B":"Revisa tu estrategia. Los valores son 5, 7, 9, 11, 13, 15.","C":"¡Muy bien! Los valores son 5, 7, 9, 11, 13, 15.","D":"Revisa tu estrategia. Los valores son 5, 7, 9, 11, 13, 15."},"difficulty":"Intermedio","skill":"Modelar","sort_order":7,"is_published":true},{"code":"U2-008","review_set_id":"tomo1-unidad2","prompt":"¿Qué expresión representa una secuencia que comienza en 1 y agrega 3 por figura?","options":[{"id":"A","text":"3x + 1"},{"id":"B","text":"x + 3"},{"id":"C","text":"3 + 1"},{"id":"D","text":"x ÷ 3"}],"correct_option":"A","explanation":"Para la figura x, tres grupos por figura más una unidad inicial se expresa 3x + 1.","feedback_by_option":{"A":"¡Muy bien! Para la figura x, tres grupos por figura más una unidad inicial se expresa 3x + 1.","B":"Revisa tu estrategia. Para la figura x, tres grupos por figura más una unidad inicial se expresa 3x + 1.","C":"Revisa tu estrategia. Para la figura x, tres grupos por figura más una unidad inicial se expresa 3x + 1.","D":"Revisa tu estrategia. Para la figura x, tres grupos por figura más una unidad inicial se expresa 3x + 1."},"difficulty":"Avanzado","skill":"Representar","sort_order":8,"is_published":true},{"code":"U2-009","review_set_id":"tomo1-unidad2","prompt":"¿Qué fracción representa 3 partes tomadas de 8 partes iguales?","options":[{"id":"A","text":"8/3"},{"id":"B","text":"3/8"},{"id":"C","text":"5/8"},{"id":"D","text":"3/5"}],"correct_option":"B","explanation":"El numerador cuenta las partes tomadas y el denominador el total de partes iguales.","feedback_by_option":{"A":"Revisa tu estrategia. El numerador cuenta las partes tomadas y el denominador el total de partes iguales.","B":"¡Muy bien! El numerador cuenta las partes tomadas y el denominador el total de partes iguales.","C":"Revisa tu estrategia. El numerador cuenta las partes tomadas y el denominador el total de partes iguales.","D":"Revisa tu estrategia. El numerador cuenta las partes tomadas y el denominador el total de partes iguales."},"difficulty":"Fundamental","skill":"Representar","sort_order":9,"is_published":true},{"code":"U2-010","review_set_id":"tomo1-unidad2","prompt":"Convierte 7/4 a número mixto.","options":[{"id":"A","text":"1 3/4"},{"id":"B","text":"2 1/4"},{"id":"C","text":"1 1/4"},{"id":"D","text":"3 1/4"}],"correct_option":"A","explanation":"7 ÷ 4 = 1 y sobran 3.","feedback_by_option":{"A":"¡Muy bien! 7 ÷ 4 = 1 y sobran 3.","B":"Revisa tu estrategia. 7 ÷ 4 = 1 y sobran 3.","C":"Revisa tu estrategia. 7 ÷ 4 = 1 y sobran 3.","D":"Revisa tu estrategia. 7 ÷ 4 = 1 y sobran 3."},"difficulty":"Fundamental","skill":"Representar","sort_order":10,"is_published":true},{"code":"U2-011","review_set_id":"tomo1-unidad2","prompt":"¿Cuál fracción es equivalente a 2/3?","options":[{"id":"A","text":"4/5"},{"id":"B","text":"4/6"},{"id":"C","text":"6/8"},{"id":"D","text":"2/6"}],"correct_option":"B","explanation":"Multiplica numerador y denominador por 2.","feedback_by_option":{"A":"Revisa tu estrategia. Multiplica numerador y denominador por 2.","B":"¡Muy bien! Multiplica numerador y denominador por 2.","C":"Revisa tu estrategia. Multiplica numerador y denominador por 2.","D":"Revisa tu estrategia. Multiplica numerador y denominador por 2."},"difficulty":"Fundamental","skill":"Representar","sort_order":11,"is_published":true},{"code":"U2-012","review_set_id":"tomo1-unidad2","prompt":"Compara 2/3 y 3/4.","options":[{"id":"A","text":"2/3 > 3/4"},{"id":"B","text":"2/3 < 3/4"},{"id":"C","text":"Son iguales"},{"id":"D","text":"No se puede comparar"}],"correct_option":"B","explanation":"2/3 = 8/12 y 3/4 = 9/12.","feedback_by_option":{"A":"Revisa tu estrategia. 2/3 = 8/12 y 3/4 = 9/12.","B":"¡Muy bien! 2/3 = 8/12 y 3/4 = 9/12.","C":"Revisa tu estrategia. 2/3 = 8/12 y 3/4 = 9/12.","D":"Revisa tu estrategia. 2/3 = 8/12 y 3/4 = 9/12."},"difficulty":"Intermedio","skill":"Argumentar","sort_order":12,"is_published":true},{"code":"U2-013","review_set_id":"tomo1-unidad2","prompt":"¿Qué decimal equivale a 3/4?","options":[{"id":"A","text":"0,34"},{"id":"B","text":"0,4"},{"id":"C","text":"0,75"},{"id":"D","text":"0,8"}],"correct_option":"C","explanation":"3/4 = 75/100 = 0,75.","feedback_by_option":{"A":"Revisa tu estrategia. 3/4 = 75/100 = 0,75.","B":"Revisa tu estrategia. 3/4 = 75/100 = 0,75.","C":"¡Muy bien! 3/4 = 75/100 = 0,75.","D":"Revisa tu estrategia. 3/4 = 75/100 = 0,75."},"difficulty":"Fundamental","skill":"Representar","sort_order":13,"is_published":true},{"code":"U2-014","review_set_id":"tomo1-unidad2","prompt":"En una tabla, Deportes tiene 14 participantes y Arte 10. ¿Cuál es la diferencia?","options":[{"id":"A","text":"4"},{"id":"B","text":"14"},{"id":"C","text":"24"},{"id":"D","text":"40"}],"correct_option":"A","explanation":"14 − 10 = 4.","feedback_by_option":{"A":"¡Muy bien! 14 − 10 = 4.","B":"Revisa tu estrategia. 14 − 10 = 4.","C":"Revisa tu estrategia. 14 − 10 = 4.","D":"Revisa tu estrategia. 14 − 10 = 4."},"difficulty":"Fundamental","skill":"Resolver problemas","sort_order":14,"is_published":true},{"code":"U2-015","review_set_id":"tomo1-unidad2","prompt":"¿Para qué situación conviene un gráfico de líneas?","options":[{"id":"A","text":"Frutas favoritas de un curso"},{"id":"B","text":"Temperatura registrada cada hora"},{"id":"C","text":"Tipos de mascotas"},{"id":"D","text":"Cantidad de lápices por color"}],"correct_option":"B","explanation":"Un gráfico de líneas muestra cambios a lo largo del tiempo.","feedback_by_option":{"A":"Revisa tu estrategia. Un gráfico de líneas muestra cambios a lo largo del tiempo.","B":"¡Muy bien! Un gráfico de líneas muestra cambios a lo largo del tiempo.","C":"Revisa tu estrategia. Un gráfico de líneas muestra cambios a lo largo del tiempo.","D":"Revisa tu estrategia. Un gráfico de líneas muestra cambios a lo largo del tiempo."},"difficulty":"Fundamental","skill":"Argumentar","sort_order":15,"is_published":true},{"code":"U2-016","review_set_id":"tomo1-unidad2","prompt":"Un gráfico muestra 12 °C, 15 °C y 18 °C en tres horas. ¿Qué tendencia hay?","options":[{"id":"A","text":"Disminuye"},{"id":"B","text":"No cambia"},{"id":"C","text":"Aumenta"},{"id":"D","text":"No se puede saber"}],"correct_option":"C","explanation":"Los valores aumentan de 12 a 15 y luego a 18.","feedback_by_option":{"A":"Revisa tu estrategia. Los valores aumentan de 12 a 15 y luego a 18.","B":"Revisa tu estrategia. Los valores aumentan de 12 a 15 y luego a 18.","C":"¡Muy bien! Los valores aumentan de 12 a 15 y luego a 18.","D":"Revisa tu estrategia. Los valores aumentan de 12 a 15 y luego a 18."},"difficulty":"Intermedio","skill":"Argumentar","sort_order":16,"is_published":true},{"code":"U2-017","review_set_id":"tomo1-unidad2","prompt":"¿Qué elemento no debe faltar en un gráfico?","options":[{"id":"A","text":"Un dibujo decorativo"},{"id":"B","text":"Título y etiquetas"},{"id":"C","text":"Una fracción"},{"id":"D","text":"Una multiplicación"}],"correct_option":"B","explanation":"El título y las etiquetas explican qué representan los datos.","feedback_by_option":{"A":"Revisa tu estrategia. El título y las etiquetas explican qué representan los datos.","B":"¡Muy bien! El título y las etiquetas explican qué representan los datos.","C":"Revisa tu estrategia. El título y las etiquetas explican qué representan los datos.","D":"Revisa tu estrategia. El título y las etiquetas explican qué representan los datos."},"difficulty":"Fundamental","skill":"Representar","sort_order":17,"is_published":true},{"code":"U2-018","review_set_id":"tomo1-unidad2","prompt":"Una tarea está 0,45 completada y luego se avanza 2/5. ¿Cuánto falta?","options":[{"id":"A","text":"0,05"},{"id":"B","text":"0,10"},{"id":"C","text":"0,15"},{"id":"D","text":"0,25"}],"correct_option":"C","explanation":"2/5 = 0,4; 0,45 + 0,40 = 0,85 y falta 0,15.","feedback_by_option":{"A":"Revisa tu estrategia. 2/5 = 0,4; 0,45 + 0,40 = 0,85 y falta 0,15.","B":"Revisa tu estrategia. 2/5 = 0,4; 0,45 + 0,40 = 0,85 y falta 0,15.","C":"¡Muy bien! 2/5 = 0,4; 0,45 + 0,40 = 0,85 y falta 0,15.","D":"Revisa tu estrategia. 2/5 = 0,4; 0,45 + 0,40 = 0,85 y falta 0,15."},"difficulty":"Avanzado","skill":"Modelar","sort_order":18,"is_published":true}]$items$::jsonb) as x(
 code text, review_set_id text, prompt text, options jsonb, correct_option text,
 explanation text, feedback_by_option jsonb, difficulty text, skill text,
 sort_order integer, is_published boolean
)
on conflict (code) do update set review_set_id=excluded.review_set_id,prompt=excluded.prompt,options=excluded.options,correct_option=excluded.correct_option,explanation=excluded.explanation,feedback_by_option=excluded.feedback_by_option,difficulty=excluded.difficulty,skill=excluded.skill,sort_order=excluded.sort_order,is_published=excluded.is_published,updated_at=now();

create or replace function public.start_school_review(p_review_slug text,p_question_count integer default 12)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
 v_user uuid:=auth.uid();
 v_set public.school_review_sets%rowtype;
 v_session uuid;
 v_count integer;
begin
 if v_user is null then raise exception 'Debes iniciar sesión'; end if;
 select * into v_set from public.school_review_sets where slug=p_review_slug and is_published=true;
 if not found then raise exception 'Repaso no encontrado'; end if;
 update public.school_review_sessions set status='abandoned' where user_id=v_user and review_set_id=v_set.id and status='active';
 insert into public.school_review_sessions(user_id,review_set_id,status) values(v_user,v_set.id,'active') returning id into v_session;
 insert into public.school_review_session_items(session_id,item_id,position)
 select v_session,id,row_number() over(order by random())::integer
 from (select id from public.school_review_items where review_set_id=v_set.id and is_published=true order by random() limit greatest(1,least(coalesce(p_question_count,12),18))) q;
 select count(*) into v_count from public.school_review_session_items where session_id=v_session;
 update public.school_review_sessions set total_questions=v_count where id=v_session;
 return jsonb_build_object('session_id',v_session,'review_set_id',v_set.id,'review_title',v_set.title,'total_questions',v_count);
end;
$$;

create or replace function public.get_school_review_question(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
 v_user uuid:=auth.uid();
 v_session public.school_review_sessions%rowtype;
 v_item public.school_review_items%rowtype;
 v_item_id uuid;
 v_position integer;
 v_answered integer;
begin
 if v_user is null then raise exception 'Debes iniciar sesión'; end if;
 select * into v_session from public.school_review_sessions where id=p_session_id and user_id=v_user;
 if not found then raise exception 'Sesión no encontrada'; end if;
 select si.item_id,si.position into v_item_id,v_position
 from public.school_review_session_items si
 where si.session_id=p_session_id and not exists(select 1 from public.school_review_responses r where r.session_id=si.session_id and r.item_id=si.item_id)
 order by si.position limit 1;
 select count(*) into v_answered from public.school_review_responses where session_id=p_session_id;
 if v_item_id is null then return jsonb_build_object('complete',true,'answered_questions',v_answered,'total_questions',v_session.total_questions); end if;
 select * into v_item from public.school_review_items where id=v_item_id;
 return jsonb_build_object('complete',false,'item_id',v_item.id,'position',v_position,'total_questions',v_session.total_questions,'answered_questions',v_answered,'prompt',v_item.prompt,'options',v_item.options,'difficulty',v_item.difficulty,'skill',v_item.skill);
end;
$$;

create or replace function public.submit_school_review_answer(p_session_id uuid,p_item_id uuid,p_selected_option text,p_confidence_level text default 'unsure',p_time_seconds integer default 0)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
 v_user uuid:=auth.uid();
 v_item public.school_review_items%rowtype;
 v_correct boolean;
 v_feedback text;
begin
 if v_user is null then raise exception 'Debes iniciar sesión'; end if;
 if p_selected_option not in ('A','B','C','D') then raise exception 'Alternativa inválida'; end if;
 if p_confidence_level not in ('unsure','somewhat','confident') then raise exception 'Confianza inválida'; end if;
 if not exists(select 1 from public.school_review_sessions s where s.id=p_session_id and s.user_id=v_user and s.status='active') then raise exception 'Sesión no disponible'; end if;
 select i.* into v_item from public.school_review_items i join public.school_review_session_items si on si.item_id=i.id where si.session_id=p_session_id and i.id=p_item_id;
 if not found then raise exception 'Pregunta no pertenece a la sesión'; end if;
 v_correct:=p_selected_option=v_item.correct_option;
 v_feedback:=coalesce(v_item.feedback_by_option->>p_selected_option,v_item.explanation);
 insert into public.school_review_responses(session_id,item_id,user_id,selected_option,is_correct,confidence_level,time_seconds)
 values(p_session_id,p_item_id,v_user,p_selected_option,v_correct,p_confidence_level,greatest(0,least(coalesce(p_time_seconds,0),7200)))
 on conflict(session_id,item_id) do nothing;
 return jsonb_build_object('is_correct',v_correct,'correct_option',v_item.correct_option,'feedback',v_feedback,'explanation',v_item.explanation);
end;
$$;

create or replace function public.complete_school_review(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
 v_user uuid:=auth.uid();
 v_session public.school_review_sessions%rowtype;
 v_total integer;
 v_correct integer;
 v_score integer;
begin
 if v_user is null then raise exception 'Debes iniciar sesión'; end if;
 select * into v_session from public.school_review_sessions where id=p_session_id and user_id=v_user;
 if not found then raise exception 'Sesión no encontrada'; end if;
 select count(*),count(*) filter(where is_correct) into v_total,v_correct from public.school_review_responses where session_id=p_session_id;
 v_score:=case when v_session.total_questions>0 then round(100.0*v_correct/v_session.total_questions)::integer else 0 end;
 update public.school_review_sessions set status='completed',correct_answers=v_correct,score_percent=v_score,completed_at=now() where id=p_session_id;
 return jsonb_build_object('session_id',p_session_id,'review_set_id',v_session.review_set_id,'total_questions',v_session.total_questions,'answered_questions',v_total,'correct_answers',v_correct,'score_percent',v_score);
end;
$$;

revoke all on function public.start_school_review(text,integer) from public,anon;
revoke all on function public.get_school_review_question(uuid) from public,anon;
revoke all on function public.submit_school_review_answer(uuid,uuid,text,text,integer) from public,anon;
revoke all on function public.complete_school_review(uuid) from public,anon;
grant execute on function public.start_school_review(text,integer) to authenticated;
grant execute on function public.get_school_review_question(uuid) to authenticated;
grant execute on function public.submit_school_review_answer(uuid,uuid,text,text,integer) to authenticated;
grant execute on function public.complete_school_review(uuid) to authenticated;

commit;
