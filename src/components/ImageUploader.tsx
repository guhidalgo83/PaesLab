"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type ImageUploaderProps = {
  imageUrl: string;
  onImageUrlChange: (value: string) => void;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-teal-300";

function safeFileName(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  const extension =
    lastDot >= 0 ? fileName.slice(lastDot).toLowerCase() : "";
  const rawName =
    lastDot >= 0 ? fileName.slice(0, lastDot) : fileName;

  const normalized = rawName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

  return `${normalized || "imagen"}${extension}`;
}

export default function ImageUploader({
  imageUrl,
  onImageUrlChange,
}: ImageUploaderProps) {
  const supabase = useMemo(() => createClient(), []);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function showMessage(text: string, error = false) {
    setMessage(text);
    setIsError(error);
  }

  async function uploadImage(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      showMessage(
        "Formato no permitido. Usa PNG, JPG, JPEG o WEBP.",
        true,
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showMessage(
        "La imagen supera el límite de 5 MB.",
        true,
      );
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Tu sesión expiró. Vuelve a iniciar sesión.",
        );
      }

      const randomPart =
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);

      const path = `${user.id}/${Date.now()}-${randomPart}-${safeFileName(
        file.name,
      )}`;

      const { error: uploadError } = await supabase.storage
        .from("question-images")
        .upload(path, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("question-images")
        .getPublicUrl(path);

      if (!data.publicUrl) {
        throw new Error(
          "La imagen se cargó, pero no se obtuvo su URL pública.",
        );
      }

      onImageUrlChange(data.publicUrl);
      showMessage("Imagen cargada correctamente.");
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible cargar la imagen.",
        true,
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-black text-teal-200">
            Imagen de la pregunta
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            PNG, JPG o WEBP. Máximo 5 MB.
          </p>
        </div>

        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-xl bg-teal-300 px-4 py-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? "Subiendo..." : "Seleccionar imagen"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => void uploadImage(event)}
          className="hidden"
        />
      </div>

      <label className="mt-5 block">
        <span className="mb-2 block text-xs font-bold text-slate-400">
          URL pública
        </span>
        <input
          value={imageUrl}
          onChange={(event) =>
            onImageUrlChange(event.target.value)
          }
          className={inputClass}
          placeholder="También puedes pegar una URL externa"
        />
      </label>

      {imageUrl && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-indigo-200"
          >
            Abrir imagen
          </a>

          <button
            type="button"
            onClick={() => {
              onImageUrlChange("");
              showMessage(
                "Se quitó la imagen de la pregunta. El archivo almacenado no fue eliminado.",
              );
            }}
            className="rounded-xl border border-rose-300/30 px-4 py-2 text-sm font-bold text-rose-200"
          >
            Quitar de la pregunta
          </button>
        </div>
      )}

      {message && (
        <p
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            isError
              ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
              : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
