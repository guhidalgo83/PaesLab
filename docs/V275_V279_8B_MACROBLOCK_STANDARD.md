# MathLabs V27.5–V27.9 · 8.º básico

## V27.5 · Curriculum + Deep Learning
- 17 OA oficiales vigentes.
- 34 topics: dos por OA.
- 136 nodos: cuatro por topic.
- 204 microlecciones, 204 worked, 272 guided.
- 102 representaciones renderizadas y 34 labs review_candidate.
- 272 answer contracts.
- Quality estructural objetivo Q4 97.
- Revisión humana pending.

## V27.6 · Assessment
- 680 Practice, 102 Diagnostic, 102 Review.
- 4 Review Sets por unidad.
- 884 stems únicos.
- A/B/C/D = 221/221/221/221.
- 0 published.

## V27.7 · Adaptive Metadata
- 884 filas heuristic_candidate.
- metadata_origin=rule_based_v277.
- evidence weight 0.92–1.14.
- 0 calibrada.

## V27.8 · Diagnostic
- 102 candidatos.
- 34/34 topics.
- min/target/max = 34/34/40.

## V27.9 · Routes + Certification + Governance
- 34 rutas.
- 34 certificaciones humanas pending.
- release_candidate=false.
- live_student_delivery=false.
- revalidación curricular obligatoria.

## Restricción DB
Cada OA usa exactamente ordinales 1..8:
- topic A: 1..4
- topic B: 5..8

El checker valida 136/136 claves únicas `(course_id, oa_code, ordinal)`.
