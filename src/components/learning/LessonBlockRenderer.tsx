"use client";

import QuestionVisual from "@/components/QuestionVisual";
import type { LessonBlock } from "@/types/learning";

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export default function LessonBlockRenderer({ block }: { block: LessonBlock }) {
  const data = block.data ?? {};

  if (block.block_type === "objective") {
    return <section className="rounded-3xl border border-teal-300/20 bg-teal-300/[0.07] p-6"><p className="text-sm font-black uppercase tracking-wide text-teal-300">{block.title}</p><p className="mt-3 text-lg leading-8 text-slate-100">{block.content}</p></section>;
  }

  if (block.block_type === "text") {
    return <section><h2 className="text-2xl font-black">{block.title}</h2><p className="mt-4 whitespace-pre-line leading-8 text-slate-300">{block.content}</p></section>;
  }

  if (block.block_type === "concepts") {
    const items = Array.isArray(data.items) ? data.items as Array<{title?: string; body?: string}> : [];
    return <section><h2 className="text-2xl font-black">{block.title}</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{items.map((item,index)=><article key={index} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5"><h3 className="font-black text-indigo-200">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p></article>)}</div></section>;
  }

  if (block.block_type === "formula") {
    const items = stringArray(data.items);
    return <section className="rounded-3xl border border-indigo-300/20 bg-indigo-300/[0.06] p-6"><h2 className="text-xl font-black text-indigo-200">{block.title}</h2><div className="mt-4 grid gap-3">{items.map((item,index)=><div key={index} className="overflow-x-auto rounded-xl bg-slate-950/70 px-5 py-4 font-mono text-lg text-teal-200">{item}</div>)}</div></section>;
  }

  if (block.block_type === "visual") {
    const visualType = String(data.visual_type ?? "none");
    const visualData = (data.visual_data ?? {}) as Record<string, unknown>;
    return <section><h2 className="text-2xl font-black">{block.title}</h2><QuestionVisual visualType={visualType} visualData={visualData} imageUrl={(data.image_url as string | null) ?? null} imageAlt={(data.image_alt as string | null) ?? null} /><p className="mt-3 text-center text-sm text-slate-400">{block.content}</p></section>;
  }

  if (block.block_type === "examples") {
    const examples = Array.isArray(data.examples) ? data.examples as Array<{problem?: string; steps?: string[]; answer?: string}> : [];
    return <section><h2 className="text-2xl font-black">{block.title}</h2><div className="mt-5 space-y-5">{examples.map((example,index)=><article key={index} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"><p className="font-black text-teal-200">Ejemplo {index+1}</p><p className="mt-3 text-lg font-bold leading-7">{example.problem}</p><ol className="mt-4 space-y-2 text-slate-300">{(example.steps ?? []).map((step,stepIndex)=><li key={stepIndex} className="flex gap-3"><span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-indigo-300/15 text-sm font-black text-indigo-200">{stepIndex+1}</span><span className="leading-7">{step}</span></li>)}</ol><div className="mt-5 rounded-xl bg-emerald-300/10 px-4 py-3 font-black text-emerald-200">Respuesta: {example.answer}</div></article>)}</div></section>;
  }

  if (block.block_type === "common_errors") {
    const items = Array.isArray(data.items) ? data.items as Array<{title?: string; description?: string}> : [];
    return <section className="rounded-3xl border border-rose-300/20 bg-rose-300/[0.05] p-6"><h2 className="text-2xl font-black text-rose-200">{block.title}</h2><div className="mt-5 space-y-4">{items.map((item,index)=><div key={index} className="rounded-xl border border-rose-300/10 bg-slate-950/30 p-4"><p className="font-black">{item.title}</p><p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p></div>)}</div></section>;
  }

  if (block.block_type === "summary") {
    const items = stringArray(data.items);
    return <section className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.05] p-6"><h2 className="text-2xl font-black text-amber-200">{block.title}</h2><ul className="mt-5 space-y-3">{items.map((item,index)=><li key={index} className="flex gap-3 text-slate-200"><span className="text-teal-300">✓</span><span>{item}</span></li>)}</ul></section>;
  }

  if (block.block_type === "video") {
    const url = String(data.url ?? "");
    return <section><h2 className="text-2xl font-black">{block.title}</h2>{url ? <div className="mt-5 aspect-video overflow-hidden rounded-2xl border border-white/10"><iframe src={url} title={block.title} className="h-full w-full" allowFullScreen /></div> : <p className="mt-4 rounded-xl border border-white/10 bg-slate-900/50 p-5 text-slate-400">Video pendiente de publicación.</p>}</section>;
  }

  if (block.block_type === "practice") return null;
  return null;
}
