# MathLabs V3 — Diagnóstico inicial y ruta personalizada

Esta actualización es **incremental** y requiere que MathLabs V2 — Contexto escolar abierto ya esté instalado.
Incluye también la corrección ESLint de `SchoolSelector.tsx`.

## Avance principal

- Diagnóstico seguro de 5.º básico.
- 24 preguntas originales en 12 temas.
- Retroalimentación específica para cada alternativa.
- Registro de seguridad declarada por el estudiante.
- Informe por tema y eje.
- Estimación inicial de dominio.
- Generación automática de prioridades.
- Página `Mi ruta` para seguir las recomendaciones.
- Panel administrador del diagnóstico.
- Protección de respuestas correctas mediante funciones `SECURITY DEFINER`.

## Instalación

1. Respalda el proyecto:

```bash
cd /workspaces/paeslab
git add .
git commit -m "Respaldo antes de MathLabs V3"
git push
```

2. Descomprime el ZIP en la raíz:

```bash
unzip -o mathlabs_v3_diagnostico_ruta.zip -d .
bash scripts/install_mathlabs_v3.sh
```

3. En Supabase ejecuta:

```text
database/12_mathlabs_diagnostic_path.sql
```

4. Verifica con:

```text
database/13_verify_mathlabs_v3.sql
```

Resultado esperado:

- 24 preguntas.
- 12 temas evaluados.
- 4 tablas V3.
- RLS activo en las 4 tablas.
- Las 4 funciones: `anon=false`, `authenticated=true`, `public=false`.

5. Ejecuta:

```bash
npx tsc --noEmit
npx eslint . --quiet
npm run build
npm run dev
```

## Rutas para probar

```text
/diagnostico-escolar
/mi-ruta
/admin/diagnostico
```

## Prueba recomendada

1. Inicia sesión con un estudiante.
2. Configura 5.º básico en `/configurar-perfil`.
3. Realiza las 24 preguntas.
4. Revisa el informe por tema.
5. Abre `/mi-ruta` y confirma que existan prioridades.
6. Marca una recomendación como iniciada y luego completada.
7. Con cuenta administradora abre `/admin/diagnostico`.

## Seguridad

Las claves correctas no se consultan desde el navegador. El cliente recibe cada pregunta sin respuesta y la corrección se realiza dentro de Supabase. Además, las tablas de dominio y sesiones quedan en lectura directa para estudiantes; sus escrituras se realizan mediante funciones controladas.
