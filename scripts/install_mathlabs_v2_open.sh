#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

python3 scripts/apply_mathlabs_branding.py

cat <<'EOF'
MathLabs V2 abierto instalado en el código.

Siguiente orden:
1. Ejecuta database/08_mathlabs_school_architecture.sql solo si aún no lo hiciste.
2. Ejecuta database/10_mathlabs_student_school_context.sql.
3. Ejecuta database/11_verify_mathlabs_student_school_context.sql.
4. Ejecuta npx tsc --noEmit, npx eslint . --quiet y npm run build.
5. Prueba /configurar-perfil, /agenda-estudio y /mi-colegio.

No ejecutes la migración institucional del ZIP descartado.
EOF
