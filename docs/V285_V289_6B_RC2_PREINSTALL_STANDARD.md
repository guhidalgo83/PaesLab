# MathLabs v28.5–v28.9 · 6B REVIEWED RC2

            ## Decisión de diseño

            RC2 reemplaza completamente el contenido RC1 y conserva la arquitectura multigrado instalada. Cada OA tiene dos topics distintos: fundamentos/representaciones y modelación/resolución de problemas. Cada respuesta se recalcula desde un contrato matemático independiente.

            ## Estado honesto antes de revisión humana

            - 24 OA oficiales con texto normalizado, URL y huella SHA256.
            - 48 topics; 192 nodos en `partial`, nunca `strong` antes de revisión humana.
            - 1248 ítems con stems y contratos únicos, tres distractores plausibles y cero placeholders.
            - Ejemplos y prácticas guiadas con resultado exacto; validación numérica/simbólica, no por palabras clave.
            - Representaciones y laboratorios en `specification_ready`; no se declaran renderizados ni aptos para estudiantes.
            - Q4 de base de datos deliberadamente provisional: 78; auto gate esperado: 0.
            - `status='staging'`, `is_published=false`, `release_candidate=false`, `live_student_delivery=false`.

            ## Diagnóstico

            El objetivo es una observación por OA: 24 ítems y 26.42 minutos estimados, bajo el máximo de 45 minutos. La RPC usa el target del blueprint cuando `p_limit` es `null`.

            ## Flujo autorizado después de integrar el ZIP

            1. Checker local, lint, TypeScript y build.
            2. SQL read-only `139a_preflight_mathlabs_v285_v289_6b_rc2.sql`.
            3. Una sola ejecución del instalador `139_mathlabs_v285_v289_6b_macroblock_full_install.sql`.
            4. Solo después de `COMMIT`, ejecutar `140_verify_mathlabs_v285_v289_6b_macroblock.sql`.

            `139b_rollback_mathlabs_v285_v289_6b_rc2.sql` no forma parte del flujo normal. Solo se usa tras una decisión explícita de rollback; verifica el staging exacto, protege cursos anteriores y opera dentro de una transacción.

            ## Fuentes oficiales

            - https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/6-basico
            - https://www.curriculumnacional.cl/recursos/programa-estudio-matematica-6-basico
            - https://www.curriculumnacional.cl/actualizacion-curricular

            La revalidación curricular y la certificación humana siguen siendo obligatorias antes de cualquier release.
