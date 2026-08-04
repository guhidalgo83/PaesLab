"use client";

import QuestionVisual from "@/components/QuestionVisual";
import type { LessonBlock } from "@/types/learning";

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

type ConceptItem = {
  title?: string;
  body?: string;
};

type ExampleItem = {
  problem?: string;
  steps?: string[];
  answer?: string;
  skill?: string;
  level?: string;
  strategy?: string;
  verification?: string;
};

type GuidedItem = {
  problem?: string;
  hints?: string[];
  steps?: string[];
  answer?: string;
  skill?: string;
};

export default function LessonBlockRenderer({
  block,
}: {
  block: LessonBlock;
}) {
  const data = block.data ?? {};

  if (block.block_type === "objective") {
    return (
      <section className="rounded-3xl border border-teal-300/20 bg-teal-300/[0.07] p-6">
        <p className="text-sm font-black uppercase tracking-wide text-teal-300">
          {block.title}
        </p>
        <p className="mt-3 text-lg leading-8 text-slate-100">
          {block.content}
        </p>
      </section>
    );
  }

  if (block.block_type === "text") {
    return (
      <section>
        <h2 className="text-2xl font-black">{block.title}</h2>
        <p className="mt-4 whitespace-pre-line leading-8 text-slate-300">
          {block.content}
        </p>
      </section>
    );
  }

  if (block.block_type === "prerequisites") {
    const items = Array.isArray(data.items)
      ? (data.items as ConceptItem[])
      : [];

    return (
      <section className="rounded-3xl border border-sky-300/20 bg-sky-300/[0.05] p-6">
        <h2 className="text-2xl font-black text-sky-200">
          {block.title}
        </h2>
        {block.content && (
          <p className="mt-3 leading-7 text-slate-400">
            {block.content}
          </p>
        )}
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {items.map((item, index) => (
            <article
              key={index}
              className="rounded-2xl border border-sky-300/10 bg-slate-950/30 p-5"
            >
              <p className="font-black text-sky-200">
                {index + 1}. {item.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (block.block_type === "concepts") {
    const items = Array.isArray(data.items)
      ? (data.items as ConceptItem[])
      : [];

    return (
      <section>
        <h2 className="text-2xl font-black">{block.title}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {items.map((item, index) => (
            <article
              key={index}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-5"
            >
              <h3 className="font-black text-indigo-200">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (block.block_type === "formula") {
    const items = stringArray(data.items);

    return (
      <section className="rounded-3xl border border-indigo-300/20 bg-indigo-300/[0.06] p-6">
        <h2 className="text-xl font-black text-indigo-200">
          {block.title}
        </h2>
        <div className="mt-4 grid gap-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="overflow-x-auto rounded-xl bg-slate-950/70 px-5 py-4 font-mono text-lg text-teal-200"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.block_type === "strategy") {
    const steps = Array.isArray(data.steps)
      ? (data.steps as ConceptItem[])
      : [];

    return (
      <section className="rounded-3xl border border-violet-300/20 bg-violet-300/[0.05] p-6">
        <h2 className="text-2xl font-black text-violet-200">
          {block.title}
        </h2>
        {block.content && (
          <p className="mt-3 leading-7 text-slate-400">
            {block.content}
          </p>
        )}
        <div className="mt-5 space-y-3">
          {steps.map((step, index) => (
            <article
              key={index}
              className="flex gap-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4"
            >
              <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-violet-300/15 font-black text-violet-200">
                {index + 1}
              </span>
              <div>
                <h3 className="font-black">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  {step.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (block.block_type === "visual") {
    const visualType = String(data.visual_type ?? "none");
    const visualData = (data.visual_data ?? {}) as Record<
      string,
      unknown
    >;

    return (
      <section>
        <h2 className="text-2xl font-black">{block.title}</h2>
        <QuestionVisual
          visualType={visualType}
          visualData={visualData}
          imageUrl={(data.image_url as string | null) ?? null}
          imageAlt={(data.image_alt as string | null) ?? null}
        />
        <p className="mt-3 text-center text-sm text-slate-400">
          {block.content}
        </p>
      </section>
    );
  }

  if (block.block_type === "examples") {
    const examples = Array.isArray(data.examples)
      ? (data.examples as ExampleItem[])
      : [];

    return (
      <section>
        <h2 className="text-2xl font-black">{block.title}</h2>
        <div className="mt-5 space-y-6">
          {examples.map((example, index) => (
            <article
              key={index}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-teal-300/10 px-3 py-1 text-sm font-black text-teal-200">
                  Ejemplo {index + 1}
                </span>
                {example.level && (
                  <span className="rounded-lg bg-indigo-300/10 px-3 py-1 text-xs font-bold text-indigo-200">
                    {example.level}
                  </span>
                )}
                {example.skill && (
                  <span className="rounded-lg bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-200">
                    {example.skill}
                  </span>
                )}
              </div>

              <p className="mt-4 text-lg font-bold leading-8">
                {example.problem}
              </p>

              {example.strategy && (
                <div className="mt-4 rounded-xl border border-violet-300/20 bg-violet-300/[0.05] p-4">
                  <p className="text-sm font-black text-violet-200">
                    Estrategia
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    {example.strategy}
                  </p>
                </div>
              )}

              <ol className="mt-5 space-y-3 text-slate-300">
                {(example.steps ?? []).map((step, stepIndex) => (
                  <li key={stepIndex} className="flex gap-3">
                    <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-indigo-300/15 text-sm font-black text-indigo-200">
                      {stepIndex + 1}
                    </span>
                    <span className="leading-7">{step}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-5 rounded-xl bg-emerald-300/10 px-4 py-3 font-black text-emerald-200">
                Respuesta: {example.answer}
              </div>

              {example.verification && (
                <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/30 p-4">
                  <p className="text-sm font-black text-slate-200">
                    Comprobación
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {example.verification}
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (block.block_type === "guided_practice") {
    const exercises = Array.isArray(data.exercises)
      ? (data.exercises as GuidedItem[])
      : [];

    return (
      <section className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.04] p-6">
        <h2 className="text-2xl font-black text-amber-200">
          {block.title}
        </h2>
        {block.content && (
          <p className="mt-3 leading-7 text-slate-400">
            {block.content}
          </p>
        )}

        <div className="mt-6 space-y-5">
          {exercises.map((exercise, index) => (
            <article
              key={index}
              className="rounded-2xl border border-white/10 bg-slate-950/40 p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-amber-200">
                  Desafío {index + 1}
                </span>
                {exercise.skill && (
                  <span className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                    {exercise.skill}
                  </span>
                )}
              </div>
              <p className="mt-3 text-lg font-bold leading-7">
                {exercise.problem}
              </p>

              <details className="mt-4 rounded-xl border border-sky-300/15 bg-sky-300/[0.04] p-4">
                <summary className="cursor-pointer font-black text-sky-200">
                  Ver pistas progresivas
                </summary>
                <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                  {(exercise.hints ?? []).map((hint, hintIndex) => (
                    <li key={hintIndex}>
                      Pista {hintIndex + 1}: {hint}
                    </li>
                  ))}
                </ol>
              </details>

              <details className="mt-3 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.04] p-4">
                <summary className="cursor-pointer font-black text-emerald-200">
                  Ver resolución completa
                </summary>
                <ol className="mt-4 space-y-3">
                  {(exercise.steps ?? []).map((step, stepIndex) => (
                    <li
                      key={stepIndex}
                      className="flex gap-3 text-slate-300"
                    >
                      <span className="font-black text-emerald-300">
                        {stepIndex + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 rounded-xl bg-emerald-300/10 p-3 font-black text-emerald-200">
                  Respuesta: {exercise.answer}
                </p>
              </details>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (block.block_type === "common_errors") {
    const items = Array.isArray(data.items)
      ? (data.items as Array<{
          title?: string;
          description?: string;
        }>)
      : [];

    return (
      <section className="rounded-3xl border border-rose-300/20 bg-rose-300/[0.05] p-6">
        <h2 className="text-2xl font-black text-rose-200">
          {block.title}
        </h2>
        <div className="mt-5 space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-rose-300/10 bg-slate-950/30 p-4"
            >
              <p className="font-black">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.block_type === "summary") {
    const items = stringArray(data.items);

    return (
      <section className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.05] p-6">
        <h2 className="text-2xl font-black text-amber-200">
          {block.title}
        </h2>
        <ul className="mt-5 space-y-3">
          {items.map((item, index) => (
            <li key={index} className="flex gap-3 text-slate-200">
              <span className="text-teal-300">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (block.block_type === "video") {
    const url = String(data.url ?? "");

    return (
      <section>
        <h2 className="text-2xl font-black">{block.title}</h2>
        {url ? (
          <div className="mt-5 aspect-video overflow-hidden rounded-2xl border border-white/10">
            <iframe
              src={url}
              title={block.title}
              className="h-full w-full"
              allowFullScreen
            />
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-white/10 bg-slate-900/50 p-5 text-slate-400">
            Video pendiente de publicación.
          </p>
        )}
      </section>
    );
  }

  if (block.block_type === "practice") return null;

  return null;
}
