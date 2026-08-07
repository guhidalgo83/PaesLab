#!/usr/bin/env bash
set -euo pipefail

echo "MathLabs V11 — Student Experience + Curriculum Engine + 6° básico"
echo
node scripts/validate_curriculum.mjs src/content/curriculum/6-basico/course.json
echo
echo "Después ejecuta en Supabase:"
echo "  database/28_mathlabs_v11_student_experience_curriculum_engine_6b.sql"
echo "  database/29_verify_mathlabs_v11.sql"
echo
echo "Luego:"
echo "  npx eslint . --quiet"
echo "  npx tsc --noEmit"
echo "  npm run build"
