# MathLabs v28.5–v28.9 · 6B REVIEWED RC2

            Macrobloque corregido para 6.º básico: 24 OA, 48 topics distintos y 1248 ítems contract-audited.

            ## Gates locales

            ```bash
            python scripts/check_v285_v289_6b_macroblock.py
            npm run lint
            npx tsc --noEmit
            npm run build
            ```

            No ejecutar SQL hasta que los cuatro gates estén verdes. Después: preflight read-only `139a_preflight_mathlabs_v285_v289_6b_rc2.sql`, instalación `139_mathlabs_v285_v289_6b_macroblock_full_install.sql` y verificación `140_verify_mathlabs_v285_v289_6b_macroblock.sql`.

            No publica contenido, no activa estudiantes y no autoriza release. El rollback `139b_rollback_mathlabs_v285_v289_6b_rc2.sql` requiere una decisión explícita y no debe ejecutarse como prueba.
