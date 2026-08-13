# MathLabs v28.0–v28.4 · 7B REVIEWED RC2 COMPAT3

            Macrobloque corregido para 7.º básico: 19 OA, 38 topics distintos y 988 ítems contract-audited.

            ## Gates locales

            ```bash
            python scripts/check_v280_v284_7b_macroblock.py
            npm run lint
            npx tsc --noEmit
            npm run build
            ```

            No ejecutar SQL hasta que los cuatro gates estén verdes. Después: preflight read-only `137a_preflight_mathlabs_v280_v284_7b_rc2.sql`, instalación `137_mathlabs_v280_v284_7b_macroblock_full_install.sql` y verificación `138_verify_mathlabs_v280_v284_7b_macroblock.sql`.

            No publica contenido, no activa estudiantes y no autoriza release. El rollback `137b_rollback_mathlabs_v280_v284_7b_rc2.sql` requiere una decisión explícita y no debe ejecutarse como prueba.

## Compatibilidad con el curso legado publicado

COMPAT3 exige y preserva exactamente 4 ejes, 19 objetivos, 35 topics y 35 relaciones publicadas de 7B. Los 38 topics V28.0 se agregan con identificadores versionados, sin publicación ni entrega estudiantil.

## Contrato de dificultad de producción

COMPAT3 valida `knowledge_topics_difficulty_check` antes de instalar y usa los valores de producción `Intermedio` y `Avanzado`. Reemplaza COMPAT1, que fue rechazado de forma transaccional al usar etiquetas en inglés.

## Contratos de validación y profundidad de producción

COMPAT3 usa `mixed` para 232 claves guiadas con respuesta numérica y representación exacta, y `formula` para 72 claves algebraicas. También normaliza `depth` desde la escala desplazada 3/4/5 a la escala de base 1/2/3 en los 988 ítems y sus 988 metadatos adaptativos. El preflight verifica ambos contratos antes de cualquier escritura.
