# MathLabs V2 — Contexto escolar abierto para estudiantes

Esta actualización **reemplaza** el ZIP `mathlabs_v2_nucleo_institucional.zip`.
No instales ni ejecutes la migración institucional anterior.

La nueva dirección permite que cualquier estudiante:

- seleccione su curso;
- busque o sugiera su colegio;
- continúe sin colegio si lo prefiere;
- registre pruebas, controles, guías y contenidos vistos en clases;
- relacione esas actividades con temas curriculares;
- reciba recomendaciones desde su agenda y progreso;
- acceda a una página por tema con objetivos, prerrequisitos y lecciones vinculadas.

El colegio funciona como **contexto personal**, no como cliente obligatorio ni como administrador del alumno.

## Archivos incluidos

El ZIP es acumulativo respecto de MathLabs V1. Incluye nuevamente:

- `database/08_mathlabs_school_architecture.sql`
- arquitectura curricular de 5.º básico;
- identidad MathLabs;
- páginas de cursos y PAES.

Agrega:

- `database/10_mathlabs_student_school_context.sql`
- `database/11_verify_mathlabs_student_school_context.sql`
- `/mi-colegio`
- `/agenda-estudio`
- `/colegios`
- `/matematica/tema/[topicSlug]`
- `/admin/colegios`
- selector comunitario de establecimientos.

## Instalación

### 1. Respaldo

```bash
cd /workspaces/paeslab
git add .
git commit -m "Respaldo antes de MathLabs V2 abierto"
git push
```

### 2. Descomprimir

Sube el ZIP a la raíz del proyecto y ejecuta:

```bash
cd /workspaces/paeslab
unzip -o mathlabs_v2_contexto_escolar_abierto.zip -d .
```

### 3. Aplicar identidad

```bash
bash scripts/install_mathlabs_v2_open.sh
```

### 4. Supabase

Si aún no ejecutaste MathLabs V1, ejecuta primero:

```text
database/08_mathlabs_school_architecture.sql
```

Luego ejecuta:

```text
database/10_mathlabs_student_school_context.sql
```

No ejecutes:

```text
database/10_mathlabs_institutional_core.sql
```

Ese archivo pertenece al ZIP descartado y no forma parte de esta entrega.

### 5. Verificación

Ejecuta:

```text
database/11_verify_mathlabs_student_school_context.sql
```

Resultados esperados:

- `tablas_v2_encontradas = 4`
- RLS activo en las cuatro tablas
- `suggest_school` y `set_my_school_context`:
  - `anon_ejecuta = false`
  - `authenticated_ejecuta = true`
  - `public_ejecuta = false`

### 6. Comprobación técnica

```bash
npx tsc --noEmit
npx eslint . --quiet
npm run build
```

### 7. Iniciar

```bash
npm run dev
```

## Prueba funcional recomendada

1. Inicia sesión como estudiante.
2. Abre `/configurar-perfil`.
3. Selecciona 5.º básico.
4. Busca tu colegio por nombre, región y comuna.
5. Si no existe, agrégalo como sugerencia comunitaria.
6. Guarda el perfil.
7. Abre `/agenda-estudio`.
8. Registra una prueba y selecciona uno o más temas.
9. Abre `/mi-colegio`.
10. Comprueba que esos temas aparezcan recomendados.
11. Abre uno mediante `/matematica/tema/...`.

## Transparencia

Un colegio aportado por un estudiante se muestra como **información comunitaria**. Esto no implica que el establecimiento use, administre o respalde MathLabs.

El administrador general puede revisar el directorio en:

```text
/admin/colegios
```

## Lo que no incorpora todavía

- importación masiva del directorio oficial de establecimientos;
- lectura automática de guías o temarios;
- calendario compartido entre estudiantes del mismo colegio;
- publicación oficial de materiales por profesores;
- lecciones profundas para los 27 temas de 5.º básico.

Estas funciones pueden agregarse gradualmente sin cambiar la arquitectura de esta versión.
