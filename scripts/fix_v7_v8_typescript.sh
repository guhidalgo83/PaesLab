#!/usr/bin/env bash
set -euo pipefail
cd /workspaces/paeslab

if [ -d "mathlabs_v7_tomo1_didactico" ]; then
  echo "Eliminando carpeta residual mathlabs_v7_tomo1_didactico..."
  rm -rf mathlabs_v7_tomo1_didactico
fi

echo "Corrección aplicada."
