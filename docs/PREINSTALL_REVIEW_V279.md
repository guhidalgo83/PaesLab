# Pre-install review · V27.5–V27.9 · 8B

Gates locales del paquete:
- 17 OA, 34 topics, 136 nodos.
- 136/136 claves OA/ordinal únicas.
- 204 micro / 204 worked / 272 guided / 102 reps / 34 labs.
- 884 assessment = 680/102/102.
- 4 Review Sets cubren los 102 review exactamente una vez.
- A/B/C/D = 221 cada una.
- 884 stems únicos.
- 0 opciones semánticamente duplicadas.
- 0 distractores genéricos residuales.
- 884 metadata heuristic_candidate; 0 calibrada.
- Diagnóstico 34/34 topics.
- 34 rutas; 34 certificaciones pending.
- SQL 135 con BEGIN/COMMIT y ON_ERROR_STOP previsto.
- Hard preflight/regression para 1M, 2M, 3M, 4M y V24.
- Sin publicación automática y runtime OFF.

Riesgo residual:
la auditoría local no sustituye la ejecución contra el esquema real de Supabase.
Ante cualquier ERROR antes de COMMIT, no ejecutar SQL 136.
