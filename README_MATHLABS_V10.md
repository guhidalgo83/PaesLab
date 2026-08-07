# MathLabs V10 — Learning OS

V10 conecta lo que ya existía en MathLabs en una experiencia personalizada.

## Integración visual

V10 agrega accesos directos desde `/matematica/5-basico` y `/aventura/5-basico` hacia el nuevo centro personalizado.

## Nuevo centro `/hoy`

Combina:

- diagnóstico
- dominio por tema
- recomendaciones
- prácticas
- lecciones
- laboratorios visuales
- desafíos de unidad
- actividad semanal

y entrega una lista de próximos pasos.

## Nuevo mapa `/progreso/5-basico`

Muestra:

- dominio global
- dominio por eje
- temas prioritarios
- evolución semanal
- número de prácticas, lecciones y laboratorios

## Nuevo cuaderno `/mis-errores`

Recupera automáticamente errores de:

- prácticas escolares
- diagnóstico
- repasos de unidad

y muestra:

- pregunta
- respuesta elegida
- respuesta correcta
- explicación
- enlace directo a volver a estudiar/practicar

## Nuevos logros `/logros`

12 hitos basados en evidencia real de aprendizaje. No dependen de rachas diarias.

## Nuevo informe `/informe/5-basico`

Resumen imprimible para estudiante/familia:

- dominio global
- dominio por eje
- evolución de 8 semanas
- prioridades
- métricas de uso y desempeño

El botón del navegador permite imprimirlo o guardarlo como PDF.

## Instalación

```bash
unzip -o mathlabs_v10_learning_os.zip -d .
bash scripts/install_mathlabs_v10.sh
```

En Supabase:

```text
database/26_mathlabs_v10_learning_os.sql
database/27_verify_mathlabs_v10.sql
```

Después:

```bash
npx eslint . --quiet
npx tsc --noEmit
npm run build
```

## Requisito

Este paquete está pensado para instalarse después de V9.
