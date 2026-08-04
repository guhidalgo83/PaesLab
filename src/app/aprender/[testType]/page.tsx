"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
export default function TestLearningPage(){const params=useParams();const router=useRouter();useEffect(()=>{const type=String(params.testType??'m1').toLowerCase();if(type==='m1')router.replace('/aprender');},[params,router]);return <main className="grid min-h-screen place-items-center bg-slate-950 text-white"><div className="text-center"><h1 className="text-3xl font-black">Contenido en preparación</h1><p className="mt-3 text-slate-400">La ruta de Matemática M2 utilizará la misma estructura de unidades y lecciones.</p><Link href="/aprender" className="mt-6 inline-block rounded-xl bg-teal-300 px-5 py-3 font-black text-slate-950">Volver a M1</Link></div></main>}
