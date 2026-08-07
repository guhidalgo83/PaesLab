import type { AchievementDefinition } from "@/types/learning-os";

export const achievementDefinitions: AchievementDefinition[] = [
  { code: "DIAGNOSTIC_DONE", emoji: "🧭", title: "Punto de partida", description: "Completaste tu primer diagnóstico.", group: "inicio" },
  { code: "FIRST_LESSON", emoji: "📖", title: "Primera lección", description: "Completaste una lección de MathLabs.", group: "inicio" },
  { code: "LESSON_EXPLORER", emoji: "🗺️", title: "Explorador", description: "Completaste al menos 5 lecciones.", group: "inicio" },
  { code: "FIRST_PRACTICE", emoji: "✏️", title: "Manos a la obra", description: "Terminaste tu primera práctica escolar.", group: "practica" },
  { code: "PERFECT_PRACTICE", emoji: "🎯", title: "Precisión total", description: "Lograste 100% en una práctica.", group: "practica" },
  { code: "QUESTION_50", emoji: "🧠", title: "50 desafíos", description: "Respondiste al menos 50 preguntas de práctica.", group: "practica" },
  { code: "FIRST_MASTERED_TOPIC", emoji: "🌱", title: "Primer dominio", description: "Alcanzaste dominio alto en un tema.", group: "dominio" },
  { code: "FIVE_MASTERED_TOPICS", emoji: "🌳", title: "Base sólida", description: "Dominaste al menos 5 temas.", group: "dominio" },
  { code: "FIRST_LAB", emoji: "🧪", title: "Científico matemático", description: "Superaste tu primer laboratorio visual.", group: "visual" },
  { code: "ALL_LABS", emoji: "🔬", title: "Maestro de laboratorio", description: "Superaste los 8 laboratorios visuales.", group: "visual" },
  { code: "FIRST_REVIEW", emoji: "🏁", title: "Desafío superado", description: "Aprobaste un repaso de unidad.", group: "desafio" },
  { code: "TOMO1_MASTER", emoji: "🏆", title: "Conquistador del Tomo 1", description: "Aprobaste los dos desafíos de unidad.", group: "desafio" },
];
