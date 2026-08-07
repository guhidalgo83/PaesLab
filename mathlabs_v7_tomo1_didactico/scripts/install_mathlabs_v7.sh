#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "== MathLabs V7 · 5° básico Tomo 1 didáctico =="
echo "1) Copia los archivos del paquete sobre tu proyecto si aún no los copiaste."
echo "2) Ejecuta la migración SQL: database/20_mathlabs_tomo1_didactico.sql"
echo "3) Verifica con: database/21_verify_mathlabs_v7.sql"
echo "4) Corre: npm run build"
echo "5) Revisa especialmente estas rutas:"
echo "   - /matematica/5-basico"
echo "   - /aprender/leccion/5b-numeros-naturales-valor-posicional"
echo "   - /aprender/leccion/5b-fracciones-propias"
echo "   - /aprender/leccion/5b-tablas-graficos"
echo "\nArchivos incluidos:"
find "$ROOT_DIR" -maxdepth 3 -type f | sed "s#${ROOT_DIR}/##" | sort
