"use client";

import Link from "next/link";
import QuestionVisual from "@/components/QuestionVisual";
import MathConceptModel from "@/components/mathlabs/MathConceptModel";
import type { LessonBlock } from "@/types/learning";

type Item = {
  title?: string;
  body?: string;
  icon?: string;
};

type ExampleItem = {
  title?: string;
  problem?: string;
  steps?: string[];
  answer?: string;
  skill?: string;
  level?: string;
  strategy?: string;
  verification?: string;
  takeaway?: string;
};

type GuidedItem = {
  title?: string;
  problem?: string;
  hints?: string[];
  steps?: string[];
  answer?: string;
  challenge?: string;
};

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function itemArray(value: unknown): Item[] {
  return Array.isArray(value) ? (value as Item[]) : [];
}

function exampleArray(value: unknown): ExampleItem[] {
  return Array.isArray(value) ? (value as ExampleItem[]) : [];
}

function guidedArray(value: unknown): GuidedItem[] {
  return Array.isArray(value) ? (value as GuidedItem[]) : [];
}

function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-xs font-black uppercase tracking-[0.25em] text-teal-300/90">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">{title}</h2>
    </div>
  );
}

export default function LessonBlockRenderer({ block }: { block: LessonBlock }) {
  const data = (block.data ?? {}) as Record<string, unknown>;
  const variant = asText(data.variant) || "default";
  const emoji = asText(data.emoji) || "✨";

  if (block.block_type === "objective") {
    return (
      <section className="rounded-[2rem] border border-teal-300/20 bg-gradient-to-br from-teal-300/15 via-sky-300/10 to-indigo-300/10 p-6 shadow-[0_10px_40px_rgba(20,184,166,0.08)] sm:p-7">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-white/10 text-3xl shadow-inner shadow-white/5">
            🎯
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-200">{block.title}</p>
            <p className="mt-3 text-lg leading-8 text-slate-100">{block.content}</p>
          </div>
        </div>
      </section>
    );
  }

  if (block.block_type === "text") {
    if (variant === "story") {
      return (
        <section className="rounded-[2rem] border border-amber-300/25 bg-gradient-to-br from-amber-300/10 via-orange-300/10 to-rose-300/10 p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-white/10 text-3xl">{emoji}</div>
            <div className="flex-1">
              <SectionTitle eyebrow="Explora" title={block.title} />
              <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-200">{block.content}</p>
            </div>
          </div>
        </section>
      );
    }

    if (variant === "checkpoint") {
      const prompts = stringArray(data.prompts);
      return (
        <section className="rounded-[2rem] border border-fuchsia-300/20 bg-fuchsia-300/[0.06] p-6 sm:p-7">
          <SectionTitle eyebrow="Piensa" title={block.title} />
          {block.content ? <p className="mt-3 leading-7 text-slate-300">{block.content}</p> : null}
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {prompts.map((prompt, index) => (
              <article key={index} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-sm font-black text-fuchsia-200">Pregunta {index + 1}</p>
                <p className="mt-2 leading-7 text-slate-300">{prompt}</p>
              </article>
            ))}
          </div>
        </section>
      );
    }

    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
        <SectionTitle title={block.title} />
        <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-300">{block.content}</p>
      </section>
    );
  }

  if (block.block_type === "prerequisites") {
    const items = itemArray(data.items);
    return (
      <section className="rounded-[2rem] border border-sky-300/20 bg-sky-300/[0.06] p-6 sm:p-7">
        <SectionTitle eyebrow="Antes de comenzar" title={block.title} />
        {block.content ? <p className="mt-3 leading-7 text-slate-300">{block.content}</p> : null}
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {items.map((item, index) => (
            <article key={index} className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon ?? "🧩"}</span>
                <p className="font-black text-sky-200">{item.title}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (block.block_type === "concepts") {
    const items = itemArray(data.items);
    return (
      <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/70 to-slate-950/60 p-6 sm:p-7">
        <SectionTitle eyebrow="Ideas clave" title={block.title} />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {items.map((item, index) => (
            <article key={index} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon ?? "💡"}</span>
                <h3 className="font-black text-indigo-100">{item.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (block.block_type === "math_model") {
    return (
      <section className="rounded-[2rem] border border-emerald-300/15 bg-emerald-300/[0.04] p-6 sm:p-7">
        <SectionTitle eyebrow="Mira la idea" title={block.title} />
        {block.content ? <p className="mt-3 leading-7 text-slate-300">{block.content}</p> : null}
        <div className="mt-6">
          <MathConceptModel data={data} />
        </div>
      </section>
    );
  }

  if (block.block_type === "formula") {
    const items = stringArray(data.items);
    return (
      <section className="rounded-[2rem] border border-indigo-300/20 bg-indigo-300/[0.07] p-6 sm:p-7">
        <SectionTitle eyebrow="Recuerda" title={block.title} />
        <div className="mt-5 grid gap-3">
          {items.map((item, index) => (
            <div key={index} className="overflow-x-auto rounded-2xl bg-slate-950/65 px-5 py-4 font-mono text-lg text-teal-200">
              {item}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.block_type === "strategy") {
    const steps = itemArray(data.steps);
    return (
      <section className="rounded-[2rem] border border-violet-300/20 bg-violet-300/[0.06] p-6 sm:p-7">
        <SectionTitle eyebrow="Paso a paso" title={block.title} />
        {block.content ? <p className="mt-3 leading-7 text-slate-300">{block.content}</p> : null}
        <div className="mt-6 space-y-3">
          {steps.map((step, index) => (
            <article key={index} className="flex gap-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-2xl bg-violet-300/15 font-black text-violet-200">
                {index + 1}
              </span>
              <div>
                <h3 className="font-black text-white">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-300">{step.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (block.block_type === "visual") {
    const visualType = asText(data.visual_type) || "none";
    const visualData = (data.visual_data ?? {}) as Record<string, unknown>;
    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
        <SectionTitle eyebrow="Observa" title={block.title} />
        <div className="mt-5">
          <QuestionVisual
            visualType={visualType}
            visualData={visualData}
            imageUrl={(data.image_url as string | null) ?? null}
            imageAlt={(data.image_alt as string | null) ?? null}
          />
        </div>
        {block.content ? <p className="mt-4 text-center text-sm leading-6 text-slate-400">{block.content}</p> : null}
      </section>
    );
  }

  if (block.block_type === "examples") {
    const examples = exampleArray(data.examples);
    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
        <SectionTitle eyebrow="Ejemplos resueltos" title={block.title} />
        <div className="mt-6 space-y-6">
          {examples.map((example, index) => (
            <article key={index} className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/[0.04] to-slate-950/35 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-xl bg-teal-300/10 px-3 py-1 text-sm font-black text-teal-200">Ejemplo {index + 1}</span>
                {example.level ? <span className="rounded-xl bg-indigo-300/10 px-3 py-1 text-xs font-black text-indigo-200">{example.level}</span> : null}
                {example.skill ? <span className="rounded-xl bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-200">{example.skill}</span> : null}
              </div>
              {example.title ? <p className="mt-4 text-sm font-black uppercase tracking-wide text-slate-400">{example.title}</p> : null}
              <p className="mt-2 text-lg font-bold leading-8 text-white">{example.problem}</p>
              {example.strategy ? (
                <div className="mt-4 rounded-2xl border border-violet-300/20 bg-violet-300/[0.05] p-4">
                  <p className="text-sm font-black text-violet-200">Cómo pensar</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{example.strategy}</p>
                </div>
              ) : null}
              <ol className="mt-5 space-y-3">
                {(example.steps ?? []).map((step, stepIndex) => (
                  <li key={stepIndex} className="flex gap-3 text-slate-300">
                    <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-indigo-300/15 text-sm font-black text-indigo-200">
                      {stepIndex + 1}
                    </span>
                    <span className="leading-7">{step}</span>
                  </li>
                ))}
              </ol>
              {example.answer ? (
                <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-4">
                  <p className="text-sm font-black text-emerald-200">Respuesta</p>
                  <p className="mt-1 text-lg font-black text-white">{example.answer}</p>
                </div>
              ) : null}
              {example.verification ? (
                <p className="mt-4 text-sm leading-6 text-slate-400"><span className="font-black text-slate-200">Comprobación:</span> {example.verification}</p>
              ) : null}
              {example.takeaway ? (
                <p className="mt-3 text-sm leading-6 text-teal-100"><span className="font-black text-teal-200">Idea importante:</span> {example.takeaway}</p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (block.block_type === "guided_practice") {
    const items = guidedArray(data.items);
    return (
      <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/[0.06] p-6 sm:p-7">
        <SectionTitle eyebrow="Tu turno" title={block.title} />
        {block.content ? <p className="mt-3 leading-7 text-slate-300">{block.content}</p> : null}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {items.map((item, index) => (
            <article key={index} className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
              <p className="text-sm font-black uppercase tracking-wide text-amber-200">Actividad {index + 1}</p>
              {item.title ? <h3 className="mt-2 font-black text-white">{item.title}</h3> : null}
              <p className="mt-2 leading-7 text-slate-200">{item.problem}</p>
              {(item.hints ?? []).length > 0 ? (
                <div className="mt-4 rounded-2xl border border-sky-300/20 bg-sky-300/[0.05] p-4">
                  <p className="text-sm font-black text-sky-200">Pistas</p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
                    {item.hints?.map((hint, hintIndex) => <li key={hintIndex}>• {hint}</li>)}
                  </ul>
                </div>
              ) : null}
              {(item.steps ?? []).length > 0 ? (
                <ol className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                  {item.steps?.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex gap-2">
                      <span className="font-black text-amber-200">{stepIndex + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
              {item.answer ? <p className="mt-4 rounded-xl bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300"><span className="font-black text-white">Respuesta esperada:</span> {item.answer}</p> : null}
              {item.challenge ? <p className="mt-3 text-sm leading-6 text-teal-100"><span className="font-black text-teal-200">Desafío extra:</span> {item.challenge}</p> : null}
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (block.block_type === "common_errors") {
    const errors = itemArray(data.items);
    return (
      <section className="rounded-[2rem] border border-rose-300/20 bg-rose-300/[0.06] p-6 sm:p-7">
        <SectionTitle eyebrow="Ojo" title={block.title} />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {errors.map((item, index) => (
            <article key={index} className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
              <p className="font-black text-rose-200">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (block.block_type === "tip") {
    const tips = stringArray(data.items);
    return (
      <section className="rounded-[2rem] border border-lime-300/20 bg-lime-300/[0.06] p-6 sm:p-7">
        <SectionTitle eyebrow="Trucos útiles" title={block.title} />
        <div className="mt-5 space-y-3">
          {tips.map((tip, index) => (
            <article key={index} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm leading-6 text-slate-200">
              <span className="font-black text-lime-200">Tip {index + 1}.</span> {tip}
            </article>
          ))}
        </div>
      </section>
    );
  }


  if (block.block_type === "lab") {
    const labSlug = asText(data.lab_slug);
    const labCourseSlug = asText(data.course_slug) || "5-basico";
    const labEmoji = asText(data.emoji) || "🧪";
    return (
      <section className="rounded-[2rem] border border-cyan-300/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.13),transparent_32%),linear-gradient(135deg,rgba(8,145,178,0.10),rgba(79,70,229,0.06))] p-6 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-cyan-300/10 text-3xl">
              {labEmoji}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Laboratorio visual</p>
              <h2 className="mt-2 text-2xl font-black text-white">{block.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{block.content}</p>
            </div>
          </div>
          {labSlug ? (
            <Link
              href={`/laboratorio/${labCourseSlug}/${labSlug}`}
              className="rounded-2xl bg-cyan-300 px-5 py-3 text-center font-black text-slate-950"
            >
              Abrir laboratorio →
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  if (block.block_type === "summary") {
    const ideas = stringArray(data.items);
    return (
      <section className="rounded-[2rem] border border-teal-300/20 bg-gradient-to-br from-teal-300/[0.09] to-cyan-300/[0.05] p-6 sm:p-7">
        <SectionTitle eyebrow="Cierre" title={block.title} />
        {block.content ? <p className="mt-3 leading-7 text-slate-300">{block.content}</p> : null}
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {ideas.map((idea, index) => (
            <div key={index} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm leading-6 text-slate-200">
              <span className="font-black text-teal-200">{index + 1}.</span> {idea}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.block_type === "practice") {
    const items = stringArray(data.items);
    return (
      <section className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/[0.06] p-6 sm:p-7">
        <SectionTitle eyebrow="Sigue practicando" title={block.title} />
        <p className="mt-3 leading-7 text-slate-300">{block.content}</p>
        {items.length > 0 ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {items.map((item, index) => (
              <div key={index} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm leading-6 text-slate-200">• {item}</div>
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  return null;
}
