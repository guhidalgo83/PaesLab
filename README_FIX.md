# Corrección TypeScript MathLabs V7/V8

Este parche corrige los errores TS2322/TS2677 de `MathConceptModel.tsx` y elimina la carpeta residual `mathlabs_v7_tomo1_didactico` que quedó dentro del repositorio y estaba siendo compilada por TypeScript.

```bash
cd /workspaces/paeslab
unzip -o mathlabs_v7_v8_fix_typescript.zip -d .
bash scripts/fix_v7_v8_typescript.sh
npx tsc --noEmit
npx eslint . --quiet
npm run build
```
