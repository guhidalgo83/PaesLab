# MathLabs V6 — 5.º básico completo

Esta entrega completa los 27 objetivos curriculares que ya estaban mapeados en MathLabs.

## Agrega

- 4 unidades nuevas: Patrones y álgebra, Geometría, Medición, Datos y probabilidades.
- 14 lecciones profundas.
- 196 bloques pedagógicos.
- 84 ejercicios resueltos.
- 42 ejercicios guiados.
- 14 modelos visuales.
- 168 preguntas seguras nuevas.
- Diagnóstico V2 de 27 preguntas: una por cada objetivo del curso.

## Resultado acumulado esperado

- 6 unidades escolares.
- 27 lecciones escolares.
- 27 temas con material y práctica.
- 324 preguntas de práctica escolar.
- Diagnóstico completo de 27 temas.

## Instalación

```bash
cd /workspaces/paeslab
unzip -o mathlabs_v6_quinto_basico_completo.zip -d .
bash scripts/install_mathlabs_v6.sh
```

Luego ejecuta en Supabase:

```text
database/18_mathlabs_complete_fifth_grade.sql
database/19_verify_mathlabs_v6.sql
```

Finalmente:

```bash
npx eslint . --quiet
npx tsc --noEmit
npm run build
```
