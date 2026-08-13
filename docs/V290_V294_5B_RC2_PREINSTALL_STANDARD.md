# MathLabs v29.0–v29.4 · 5B REVIEWED RC2

            ## Decisión de diseño

            RC2 reemplaza completamente el contenido RC1 y conserva la arquitectura multigrado instalada. Cada OA tiene dos topics distintos: fundamentos/representaciones y modelación/resolución de problemas. Cada respuesta se recalcula desde un contrato matemático independiente.

            ## Estado honesto antes de revisión humana

            - 27 OA oficiales con texto normalizado, URL y huella SHA256.
            - 54 topics; 216 nodos en `partial`, nunca `strong` antes de revisión humana.
            - 1404 ítems con stems y contratos únicos, tres distractores plausibles y cero placeholders.
            - Ejemplos y prácticas guiadas con resultado exacto; validación numérica/simbólica, no por palabras clave.
            - Representaciones y laboratorios en `specification_ready`; no se declaran renderizados ni aptos para estudiantes.
            - Q4 de base de datos deliberadamente provisional: 78; auto gate esperado: 0.
            - `status='staging'`, `is_published=false`, `release_candidate=false`, `live_student_delivery=false`.

            ## Diagnóstico

            El objetivo es una observación por OA: 27 ítems y 29.67 minutos estimados, bajo el máximo de 45 minutos. La RPC usa el target del blueprint cuando `p_limit` es `null`.

            ## Flujo autorizado después de integrar el ZIP

            1. Checker local, lint, TypeScript y build.
            2. SQL read-only `141a_preflight_mathlabs_v290_v294_5b_rc2.sql`.
            3. Una sola ejecución del instalador `141_mathlabs_v290_v294_5b_macroblock_full_install.sql`.
            4. Solo después de `COMMIT`, ejecutar `142_verify_mathlabs_v290_v294_5b_macroblock.sql`.

            `141b_rollback_mathlabs_v290_v294_5b_rc2.sql` no forma parte del flujo normal. Solo se usa tras una decisión explícita de rollback; verifica el staging exacto, protege cursos anteriores y opera dentro de una transacción.

            ## Fuentes oficiales

            - https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/5-basico
            - https://www.curriculumnacional.cl/recursos/programa-estudio-matematica-5-basico
            - https://www.curriculumnacional.cl/actualizacion-curricular

            La revalidación curricular y la certificación humana siguen siendo obligatorias antes de cualquier release.
