"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SchoolDirectoryEntry } from "@/types/school";

const CHILE_REGIONS = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Metropolitana de Santiago",
  "O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén",
  "Magallanes",
];

type Props = {
  value: SchoolDirectoryEntry | null;
  onChange: (school: SchoolDirectoryEntry | null) => void;
};

export default function SchoolSelector({ value, onChange }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [region, setRegion] = useState(value?.region ?? "");
  const [commune, setCommune] = useState(value?.commune ?? "");
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<SchoolDirectoryEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [city, setCity] = useState(value?.city ?? "");
  const [message, setMessage] = useState("");

  async function searchSchools() {
    if (query.trim().length < 2) {
      setMessage("Escribe al menos dos caracteres del nombre.");
      return;
    }

    setSearching(true);
    setMessage("");

    let request = supabase
      .from("school_directory")
      .select("*")
      .eq("is_active", true)
      .ilike("name", `%${query.trim()}%`)
      .order("name")
      .limit(20);

    if (region) request = request.eq("region", region);
    if (commune.trim()) request = request.ilike("commune", commune.trim());

    const { data, error } = await request;
    if (error) {
      setMessage(error.message);
      setResults([]);
    } else {
      setResults((data ?? []) as unknown as SchoolDirectoryEntry[]);
      if ((data ?? []).length === 0) {
        setMessage("No encontramos coincidencias. Puedes sugerir tu colegio.");
      }
    }
    setSearching(false);
  }

  async function suggestSchool() {
    if (!region || !commune.trim() || query.trim().length < 3) {
      setMessage("Indica región, comuna y nombre del colegio.");
      return;
    }

    setSearching(true);
    setMessage("");
    const { data: schoolId, error } = await supabase.rpc("suggest_school", {
      p_name: query.trim(),
      p_region: region,
      p_commune: commune.trim(),
      p_city: city.trim(),
    });

    if (error || !schoolId) {
      setMessage(error?.message ?? "No pudimos agregar el colegio.");
      setSearching(false);
      return;
    }

    const { data: school, error: schoolError } = await supabase
      .from("school_directory")
      .select("*")
      .eq("id", String(schoolId))
      .single();

    if (schoolError || !school) {
      setMessage(schoolError?.message ?? "El colegio fue agregado, pero no pudimos cargarlo.");
    } else {
      onChange(school as unknown as SchoolDirectoryEntry);
      setResults([]);
      setShowSuggestion(false);
      setMessage("Colegio seleccionado. Aparecerá como información aportada por la comunidad hasta ser verificado.");
    }
    setSearching(false);
  }

  if (value) {
    return (
      <section className="rounded-2xl border border-teal-300/25 bg-teal-300/[0.06] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-black text-teal-300">Colegio seleccionado</p>
            <h3 className="mt-1 text-xl font-black">{value.name}</h3>
            <p className="mt-2 text-sm text-slate-400">
              {value.commune} · {value.region}
            </p>
            <p className="mt-3 text-xs font-bold text-slate-500">
              {value.verification_status === "verified"
                ? "Perfil verificado"
                : "Información aportada por la comunidad"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setRegion("");
              setCommune("");
              setQuery("");
              setCity("");
              setResults([]);
              setMessage("");
              setShowSuggestion(false);
            }}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-black"
          >
            Cambiar
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
      <div>
        <p className="font-black text-indigo-200">Colegio opcional</p>
        <h2 className="mt-2 text-2xl font-black">Busca tu establecimiento</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Tu colegio sirve como contexto personal. MathLabs seguirá funcionando aunque el establecimiento no participe en la plataforma.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold text-slate-300">
          Región
          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
          >
            <option value="">Todas las regiones</option>
            {CHILE_REGIONS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-bold text-slate-300">
          Comuna
          <input
            value={commune}
            onChange={(event) => setCommune(event.target.value)}
            placeholder="Ej.: Concepción"
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void searchSchools();
            }
          }}
          placeholder="Nombre del colegio"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
        />
        <button
          type="button"
          disabled={searching}
          onClick={() => void searchSchools()}
          className="rounded-xl bg-indigo-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
        >
          {searching ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-5 space-y-3">
          {results.map((school) => (
            <button
              key={school.id}
              type="button"
              onClick={() => onChange(school)}
              className="block w-full rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-left hover:border-teal-300/40"
            >
              <strong className="block">{school.name}</strong>
              <span className="mt-1 block text-sm text-slate-400">
                {school.commune} · {school.region}
              </span>
              <span className="mt-2 block text-xs font-bold text-slate-500">
                {school.verification_status === "verified" ? "Verificado" : "Aportado por la comunidad"}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShowSuggestion((current) => !current)}
          className="text-sm font-black text-teal-200"
        >
          {showSuggestion ? "Ocultar formulario" : "No aparece mi colegio"}
        </button>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-sm font-black text-slate-400"
        >
          Continuar sin colegio
        </button>
      </div>

      {showSuggestion && (
        <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-5">
          <p className="font-black text-amber-200">Sugerir establecimiento</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Se publicará como dato comunitario, no como información oficial del colegio.
          </p>
          <label className="mt-4 block text-sm font-bold text-slate-300">
            Ciudad o localidad, opcional
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
            />
          </label>
          <button
            type="button"
            disabled={searching}
            onClick={() => void suggestSchool()}
            className="mt-4 rounded-xl bg-amber-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
          >
            Agregar y seleccionar
          </button>
        </div>
      )}

      {message && (
        <p className="mt-5 rounded-xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
          {message}
        </p>
      )}
    </section>
  );
}
