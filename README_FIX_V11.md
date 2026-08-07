# MathLabs V11 — parche de compatibilidad V10/V11

Corrige la sobrescritura de `src/types/learning-os.ts`.

Restaura los tipos de V10:
- ErrorNotebookItem
- AchievementUnlock
- AchievementDefinition

y conserva los tipos nuevos de V11:
- LearningSessionItem
- LearningSession
- `course.slug` dentro de LearningHubData

También repone `scripts/install_mathlabs_v11.sh`.

No modifica Supabase ni requiere ejecutar SQL.

Después de copiar el parche:

```bash
npx tsc --noEmit
npm run build
```
