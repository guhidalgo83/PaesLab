#!/usr/bin/env bash
set -euo pipefail

echo "MathLabs V5 — Fracciones y decimales"
echo
echo "Archivos instalados:"
echo "  - database/16_mathlabs_fractions_decimals.sql"
echo "  - database/17_verify_mathlabs_v5.sql"
echo "  - src/components/mathlabs/MathConceptModel.tsx"
echo "  - src/components/learning/LessonBlockRenderer.tsx"
echo
echo "Siguiente paso:"
echo "1. Ejecuta database/16_mathlabs_fractions_decimals.sql en Supabase."
echo "2. Ejecuta database/17_verify_mathlabs_v5.sql."
echo "3. Ejecuta npx eslint . --quiet"
echo "4. Ejecuta npx tsc --noEmit"
echo "5. Ejecuta npm run build"
