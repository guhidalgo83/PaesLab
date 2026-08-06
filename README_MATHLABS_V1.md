# MathLabs V1 — Arquitectura escolar

Esta actualización transforma la identidad visible de PAESLab en **MathLabs** y mantiene toda la preparación PAES como un módulo interno.

## Qué agrega

- Nueva portada MathLabs.
- Ruta `/matematica` con cursos desde 5.º básico hasta 4.º medio.
- Ruta dinámica `/matematica/[courseSlug]`.
- Perfil académico con selección de curso en `/configurar-perfil`.
- Hub especializado `/paes` que conserva todos los módulos actuales.
- Panel administrativo curricular `/admin/curriculum`.
- Arquitectura Supabase para niveles, cursos, ejes, objetivos, temas, prerrequisitos, progreso y diagnósticos.
- Mapa completo de 5.º básico con 5 ejes, 27 objetivos y 27 temas iniciales.
- Reemplazo de branding visible `PAESLab` por `MathLabs` mediante script.

## Fuente curricular

La estructura de 5.º básico se basa en el portal oficial Currículum Nacional de Chile:
https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico

Los textos almacenados son resúmenes pedagógicos para navegación; los códigos MA05 OA conservan la referencia oficial.

## Instalación

1. Respalda el proyecto en Git.
2. Descomprime el ZIP en `/workspaces/paeslab`.
3. Ejecuta:

```bash
cd /workspaces/paeslab
bash scripts/install_mathlabs_v1.sh
```

4. En Supabase ejecuta `database/08_mathlabs_school_architecture.sql`.
5. Ejecuta `database/09_verify_mathlabs.sql`.
6. Comprueba:

```bash
npx tsc --noEmit
npx eslint . --quiet
npm run build
```

7. Inicia el sitio:

```bash
npm run dev
```

## Rutas nuevas

- `/`
- `/matematica`
- `/matematica/5-basico`
- `/configurar-perfil`
- `/paes`
- `/admin/curriculum`

## Resultado esperado de la verificación SQL

- 2 niveles educativos.
- 8 cursos.
- 5 ejes en 5.º básico.
- 27 objetivos en 5.º básico.
- 27 temas en 5.º básico.
- 17 relaciones de prerrequisito.

## Qué no hace todavía

- No publica lecciones escolares completas de 5.º básico.
- No genera aún el diagnóstico escolar.
- No modifica ni elimina el banco PAES existente.
- No renombra el repositorio ni la carpeta del Codespace.

La siguiente versión debe crear las primeras unidades y lecciones profundas de 5.º básico, comenzando por Números y operaciones.
