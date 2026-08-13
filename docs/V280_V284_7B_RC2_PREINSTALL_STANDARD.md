# MathLabs v28.0–v28.4 · 7B REVIEWED RC2 COMPAT3

            ## Decisión de diseño

            RC2 reemplaza completamente el contenido RC1 y conserva la arquitectura multigrado instalada. Cada OA tiene dos topics distintos: fundamentos/representaciones y modelación/resolución de problemas. Cada respuesta se recalcula desde un contrato matemático independiente.

            ## Estado honesto antes de revisión humana

            - 19 OA oficiales con texto normalizado, URL y huella SHA256.
            - 38 topics; 152 nodos en `partial`, nunca `strong` antes de revisión humana.
            - 988 ítems con stems y contratos únicos, tres distractores plausibles y cero placeholders.
            - Ejemplos y prácticas guiadas con resultado exacto; validación numérica/simbólica, no por palabras clave.
            - Representaciones y laboratorios en `specification_ready`; no se declaran renderizados ni aptos para estudiantes.
            - Q4 de base de datos deliberadamente provisional: 78; auto gate esperado: 0.
            - `status='staging'`, `is_published=false`, `release_candidate=false`, `live_student_delivery=false`.

            ## Diagnóstico

            El objetivo es una observación por OA: 19 ítems y 20.92 minutos estimados, bajo el máximo de 45 minutos. La RPC usa el target del blueprint cuando `p_limit` es `null`.

            ## Flujo autorizado después de integrar el ZIP

            1. Checker local, lint, TypeScript y build.
            2. SQL read-only `137a_preflight_mathlabs_v280_v284_7b_rc2.sql`.
            3. Una sola ejecución del instalador `137_mathlabs_v280_v284_7b_macroblock_full_install.sql`.
            4. Solo después de `COMMIT`, ejecutar `138_verify_mathlabs_v280_v284_7b_macroblock.sql`.

            `137b_rollback_mathlabs_v280_v284_7b_rc2.sql` no forma parte del flujo normal. Solo se usa tras una decisión explícita de rollback; verifica el staging exacto, protege cursos anteriores y opera dentro de una transacción.

            ## Fuentes oficiales

            - https://www.curriculumnacional.cl/curriculum/7o-basico-2o-medio/matematica/7-basico
            - https://www.curriculumnacional.cl/recursos/programa-estudio-matematica-7-basico
            - https://www.curriculumnacional.cl/actualizacion-curricular

            La revalidación curricular y la certificación humana siguen siendo obligatorias antes de cualquier release.

## Compatibilidad con el curso legado publicado

COMPAT3 exige y preserva exactamente 4 ejes, 19 objetivos, 35 topics y 35 relaciones publicadas de 7B. Los 38 topics V28.0 se agregan con identificadores versionados, sin publicación ni entrega estudiantil.

## Contrato de dificultad de producción

COMPAT3 valida `knowledge_topics_difficulty_check` antes de instalar y usa los valores de producción `Intermedio` y `Avanzado`. Reemplaza COMPAT1, que fue rechazado de forma transaccional al usar etiquetas en inglés.

## Contratos de validación y profundidad de producción

COMPAT3 usa `mixed` para 232 claves guiadas con respuesta numérica y representación exacta, y `formula` para 72 claves algebraicas. También normaliza `depth` desde la escala desplazada 3/4/5 a la escala de base 1/2/3 en los 988 ítems y sus 988 metadatos adaptativos. El preflight verifica ambos contratos antes de cualquier escritura.
