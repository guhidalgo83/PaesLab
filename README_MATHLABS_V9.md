# MathLabs V9 — Laboratorios visuales

## Objetivo

Esta versión responde directamente a la necesidad de que 5.º básico tenga **menos lectura pasiva y más manipulación visual**.

Agrega **8 laboratorios interactivos** y **24 microdesafíos**.

## Laboratorios

1. Ciudad de los números — valor posicional.
2. Fábrica de multiplicaciones — arreglos de filas y columnas.
3. Estación de reparto — división y resto.
4. Taller de medidas — equivalencia entre mm, cm y m.
5. Piscina de centésimos — cuadrícula decimal.
6. Máquina de patrones — inicio y regla de crecimiento.
7. Muro de fracciones — fracciones y equivalencias.
8. Observatorio de datos — gráfico de barras manipulable.

## Integración

- Nueva ruta `/laboratorio/5-basico`.
- Ruta dinámica `/laboratorio/5-basico/[labSlug]`.
- Acceso desde `/aventura/5-basico`.
- Ocho lecciones incorporan un bloque directo de laboratorio.
- El estudiante puede guardar intentos y mejor puntaje.
- Se considera laboratorio superado desde 70%.

## Instalación

Descomprime directamente en la raíz del proyecto:

```bash
unzip -o mathlabs_v9_laboratorios_visuales.zip -d .
bash scripts/install_mathlabs_v9.sh
```

Luego ejecuta en Supabase:

```text
database/24_mathlabs_v9_visual_labs.sql
database/25_verify_mathlabs_v9.sql
```

Finalmente:

```bash
npx eslint . --quiet
npx tsc --noEmit
npm run build
```
