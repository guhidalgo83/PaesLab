# MathLabs V8 — Aventura Matemática Tomo 1

Esta entrega convierte los contenidos principales del Tomo 1 de 5° básico en una experiencia de navegación más visual y motivadora.

## Avances incluidos

### Mapa de aventura
Nueva ruta:

```text
/aventura/5-basico
```

Organiza el Tomo 1 en nueve capítulos:

1. Números grandes.
2. Multiplicación.
3. ¿Cuántas veces?
4. Longitud.
5. División.
6. Números decimales.
7. Patrones.
8. Fracciones.
9. Datos.

El mapa calcula el progreso usando `lesson_progress`, identifica capítulos completados y recomienda el siguiente paso.

### Dos repasos seguros

```text
/repaso-escolar/tomo-1-unidad-1
/repaso-escolar/tomo-1-unidad-2
```

Cada repaso selecciona 12 preguntas de un banco de 18 preguntas originales. Las respuestas correctas no se envían al navegador antes del intento.

Banco total nuevo:

- 18 preguntas para Unidad 1.
- 18 preguntas para Unidad 2.
- 36 preguntas nuevas en total.

### Insignias
Según el resultado del repaso, el estudiante recibe una insignia:

- Maestro del Tomo 1.
- Gran explorador.
- Aventura en progreso.
- Primera expedición.

### Guía visual propia
Se agrega `Mati`, un guía original de MathLabs creado con SVG y CSS. No utiliza personajes ni ilustraciones del texto ministerial.

### Integración con 5° básico
La página `/matematica/5-basico` incorpora un acceso destacado a la nueva aventura.

## Archivos principales

```text
database/22_mathlabs_v8_adventure_review.sql
database/23_verify_mathlabs_v8.sql
scripts/install_mathlabs_v8.sh
src/app/aventura/5-basico/page.tsx
src/app/repaso-escolar/[reviewSlug]/page.tsx
src/app/matematica/[courseSlug]/page.tsx
src/components/mathlabs/FifthGradeAdventureMap.tsx
src/components/mathlabs/MathLabsGuide.tsx
src/components/mathlabs/SchoolReviewQuestionCard.tsx
src/types/school-review.ts
```

## Instalación

Descomprime el ZIP en la raíz del proyecto:

```bash
cd /workspaces/paeslab
unzip -o mathlabs_v8_aventura_tomo1.zip -d .
bash scripts/install_mathlabs_v8.sh
```

Ejecuta en Supabase:

```text
database/22_mathlabs_v8_adventure_review.sql
```

Luego:

```text
database/23_verify_mathlabs_v8.sql
```

Comprobación técnica:

```bash
npx eslint . --quiet
npx tsc --noEmit
npm run build
```

## Resultado esperado de la verificación

- 2 conjuntos de repaso.
- 18 preguntas en `tomo1-unidad1`.
- 18 preguntas en `tomo1-unidad2`.
- 5 tablas nuevas con RLS activo.
- 4 funciones ejecutables por `authenticated`.
- `anon` y `public` sin permiso de ejecución.
