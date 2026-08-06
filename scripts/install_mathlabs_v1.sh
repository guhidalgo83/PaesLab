#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
python3 scripts/apply_mathlabs_branding.py

echo
echo "Archivos instalados. Próximos pasos:"
echo "1. Ejecuta database/08_mathlabs_school_architecture.sql en Supabase."
echo "2. Ejecuta database/09_verify_mathlabs.sql."
echo "3. Ejecuta npx tsc --noEmit"
echo "4. Ejecuta npx eslint . --quiet"
echo "5. Ejecuta npm run build"
