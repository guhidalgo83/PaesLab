# MathLabs v29.0–v29.4 · 5B REVIEWED RC2

            Macrobloque corregido para 5.º básico: 27 OA, 54 topics distintos y 1404 ítems contract-audited.

            ## Gates locales

            ```bash
            python scripts/check_v290_v294_5b_macroblock.py
            npm run lint
            npx tsc --noEmit
            npm run build
            ```

            No ejecutar SQL hasta que los cuatro gates estén verdes. Después: preflight read-only `141a_preflight_mathlabs_v290_v294_5b_rc2.sql`, instalación `141_mathlabs_v290_v294_5b_macroblock_full_install.sql` y verificación `142_verify_mathlabs_v290_v294_5b_macroblock.sql`.

            No publica contenido, no activa estudiantes y no autoriza release. El rollback `141b_rollback_mathlabs_v290_v294_5b_rc2.sql` requiere una decisión explícita y no debe ejecutarse como prueba.
