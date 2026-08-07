"use client";

import { achievementDefinitions } from "@/components/mathlabs/achievement-definitions";
import type { AchievementUnlock } from "@/types/learning-os";

export default function AchievementsGrid({ unlocks }: { unlocks: AchievementUnlock[] }) {
  const unlocked = new Map(unlocks.map((item) => [item.achievement_code, item.unlocked_at]));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {achievementDefinitions.map((achievement) => {
        const date = unlocked.get(achievement.code);
        const active = Boolean(date);
        return (
          <article
            key={achievement.code}
            className={`rounded-[1.75rem] border p-5 ${
              active
                ? "border-amber-300/25 bg-gradient-to-br from-amber-300/[0.09] to-white/[0.025]"
                : "border-white/8 bg-white/[0.02] opacity-55"
            }`}
          >
            <div className={`grid h-14 w-14 place-items-center rounded-2xl text-3xl ${active ? "bg-amber-300/10" : "bg-white/5 grayscale"}`}>
              {achievement.emoji}
            </div>
            <h3 className="mt-4 font-black text-white">{achievement.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{achievement.description}</p>
            <p className={`mt-4 text-xs font-black uppercase tracking-wide ${active ? "text-amber-200" : "text-slate-600"}`}>
              {active ? `Desbloqueado ${new Date(date!).toLocaleDateString("es-CL")}` : "Aún bloqueado"}
            </p>
          </article>
        );
      })}
    </div>
  );
}
