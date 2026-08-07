# MathLabs V5 — Fracciones y decimales

## Resultado

Esta actualización agrega la segunda unidad completa de 5.º básico:

1. Fracciones propias.
2. Fracciones impropias y números mixtos.
3. Suma y resta de fracciones.
4. Fracciones y decimales equivalentes.
5. Comparación de decimales.
6. Suma y resta de decimales.
7. Problemas con fracciones y decimales.

## Cifras de la entrega

- 7 lecciones profundas.
- 98 bloques pedagógicos.
- 42 ejercicios completamente resueltos.
- 21 ejercicios guiados con pistas.
- 7 modelos matemáticos visuales.
- 84 preguntas de práctica segura.
- 12 preguntas por tema.
- Integración automática con dominio y Mi ruta mediante el motor de V4.

## Requisitos

Debes tener instalados MathLabs V1, V2 abierto, V3 y V4.

## Instalación

1. Descomprime el ZIP en la raíz del proyecto.
2. Ejecuta:

```bash
bash scripts/install_mathlabs_v5.sh
```

3. En Supabase ejecuta:

```text
database/16_mathlabs_fractions_decimals.sql
```

4. Luego ejecuta:

```text
database/17_verify_mathlabs_v5.sql
```

5. Comprueba:

```bash
npx eslint . --quiet
npx tsc --noEmit
npm run build
```

## Rutas principales

```text
/aprender/school/5-basico-fracciones-decimales
/aprender/leccion/5b-fracciones-propias
/aprender/leccion/5b-fracciones-impropias-numeros-mixtos
/aprender/leccion/5b-suma-resta-fracciones
/aprender/leccion/5b-fracciones-decimales-equivalentes
/aprender/leccion/5b-comparacion-decimales
/aprender/leccion/5b-suma-resta-decimales
/aprender/leccion/5b-problemas-fracciones-decimales
```

Práctica:

```text
/practica-escolar/fracciones-propias
/practica-escolar/fracciones-impropias-numeros-mixtos
/practica-escolar/suma-resta-de-fracciones
/practica-escolar/fracciones-decimales-equivalentes
/practica-escolar/comparacion-de-decimales
/practica-escolar/suma-resta-de-decimales
/practica-escolar/problemas-con-fracciones-decimales
```
