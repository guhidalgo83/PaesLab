# Corrección SQL MathLabs V4

Este parche corrige el error PostgreSQL:

`record variable cannot be part of multiple-item INTO list`

## Uso

1. Descomprimir en la raíz del proyecto.
2. Reemplazar `database/14_mathlabs_first_school_unit.sql`.
3. Ejecutar nuevamente el archivo completo en Supabase SQL Editor.

La migración original usa `BEGIN`/`COMMIT`; al fallar antes del `COMMIT`, sus cambios deberían haberse revertido.
