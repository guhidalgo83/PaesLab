# PAESLab Aprender V2 Integrado

## Qué incorpora
- Progreso automático mientras el alumno lee una lección.
- El 100% se obtiene al completar la mini evaluación.
- Plan personal generado desde errores reales.
- Mayor prioridad para errores respondidos con alta seguridad.
- Práctica específica de 10 preguntas para cada lección.
- Diagnóstico por alternativa en la práctica específica.
- Sincronización automática: completar una lección completa también
  el elemento correspondiente del plan.
- Navegación entre lección anterior y siguiente.
- Acceso “Mi plan” desde el encabezado de Aprender.

## Instalación
1. Ejecuta `database/01_aprender_v2_integration.sql`.
2. Copia o reemplaza los archivos de la carpeta `src`.
3. Guarda con Ctrl+S.
4. Abre `/mi-plan`.
5. Responde algunas preguntas incorrectamente y pulsa
   “Actualizar recomendaciones”.
6. Abre una lección y desplázate para comprobar el progreso.
7. Pulsa “Práctica específica” desde una lección.

## Archivos que reemplaza
- `src/components/learning/LearningHeader.tsx`
- `src/app/aprender/leccion/[slug]/page.tsx`

## Archivos nuevos
- `src/components/learning/LessonProgressTracker.tsx`
- `src/app/mi-plan/page.tsx`
- `src/app/practicar-leccion/[lessonId]/page.tsx`

## Importante
La recomendación depende de que las preguntas estén vinculadas a las
lecciones mediante `lesson_question_links`. Si el plan queda vacío,
ejecuta nuevamente el script de vinculación automática de Aprender V1.
