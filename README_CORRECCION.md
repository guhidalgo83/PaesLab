# Corrección ESLint — MathLabs V3

Este parche corrige cinco errores informados por ESLint:

- cuatro llamadas de carga ejecutadas directamente dentro de `useEffect`;
- una llamada a `Date.now()` durante el render inicial.

## Instalación

Descomprime el ZIP en la raíz del proyecto:

```bash
cd /workspaces/paeslab
unzip -o mathlabs_v3_fix_react_hooks.zip -d .
```

Después ejecuta:

```bash
npx eslint . --quiet
npx tsc --noEmit
npm run build
```

No es necesario volver a ejecutar las migraciones de Supabase.
