# MathLabs V4 — Corrección ESLint

Corrige tres errores:

1. Reemplaza enlaces internos `<a>` por `Link` de Next.js.
2. Elimina el `any` explícito en la lectura de preguntas vinculadas.
3. No modifica Supabase, preguntas, lecciones ni progreso.

Instalación:

```bash
cd /workspaces/paeslab
unzip -o mathlabs_v4_fix_eslint_links_types.zip -d .
npx eslint . --quiet
npx tsc --noEmit
npm run build
```
