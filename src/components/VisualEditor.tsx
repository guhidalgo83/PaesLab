"use client";

import QuestionVisual from "@/components/QuestionVisual";
import ImageUploader from "@/components/ImageUploader";

type VisualEditorProps = {
  visualType: string;
  visualData: Record<string, unknown>;
  imageUrl: string;
  imageAlt: string;
  onVisualTypeChange: (value: string) => void;
  onVisualDataChange: (value: Record<string, unknown>) => void;
  onImageUrlChange: (value: string) => void;
  onImageAltChange: (value: string) => void;
};

function numberValue(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function numberList(value: unknown): number[] {
  return Array.isArray(value)
    ? value.map(Number).filter(Number.isFinite)
    : [];
}

function updateObject(
  current: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  return { ...current, ...patch };
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-teal-300";

export default function VisualEditor({
  visualType,
  visualData,
  imageUrl,
  imageAlt,
  onVisualTypeChange,
  onVisualDataChange,
  onImageUrlChange,
  onImageAltChange,
}: VisualEditorProps) {
  const updateData = (patch: Record<string, unknown>) =>
    onVisualDataChange(updateObject(visualData, patch));

  const labels = stringList(visualData.labels);
  const values = numberList(visualData.values);
  const headers = stringList(visualData.headers);
  const rows = Array.isArray(visualData.rows)
    ? visualData.rows.map((row) =>
        Array.isArray(row) ? row.map(String) : [],
      )
    : [];

  return (
    <section className="rounded-2xl border border-indigo-300/20 bg-indigo-300/[0.05] p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-black text-indigo-200">Recurso visual</h2>
          <p className="mt-2 text-sm text-slate-400">
            Construye el gráfico o figura con controles, sin editar JSON.
          </p>
        </div>
        <span className="rounded-lg bg-slate-950/50 px-3 py-2 text-xs font-bold text-slate-400">
          Vista previa automática
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-2 block text-sm font-bold">Tipo visual</span>
          <select
            value={visualType}
            onChange={(event) => {
              const nextType = event.target.value;
              onVisualTypeChange(nextType);

              if (nextType === "function_graph") {
                onVisualDataChange({
                  kind: "linear",
                  a: 1,
                  b: 0,
                  c: 0,
                  xMin: -5,
                  xMax: 5,
                  yMin: -5,
                  yMax: 5,
                });
              } else if (nextType === "bar_chart") {
                onVisualDataChange({
                  labels: ["A", "B", "C", "D"],
                  values: [4, 7, 5, 9],
                  yMax: 10,
                });
              } else if (nextType === "table") {
                onVisualDataChange({
                  headers: ["Categoría", "Valor"],
                  rows: [
                    ["A", "10"],
                    ["B", "15"],
                  ],
                });
              } else if (nextType === "triangle") {
                onVisualDataChange({
                  sideA: "5 cm",
                  sideB: "12 cm",
                  sideC: "?",
                  rightAngle: true,
                });
              } else {
                onVisualDataChange({});
              }
            }}
            className={inputClass}
          >
            <option value="none">Sin visual</option>
            <option value="function_graph">Gráfico de función</option>
            <option value="bar_chart">Gráfico de barras</option>
            <option value="table">Tabla</option>
            <option value="triangle">Triángulo</option>
            <option value="image">Imagen por URL</option>
          </select>
        </label>

        <label>
          <span className="mb-2 block text-sm font-bold">
            Texto alternativo
          </span>
          <input
            value={imageAlt}
            onChange={(event) => onImageAltChange(event.target.value)}
            className={inputClass}
            placeholder="Describe el recurso para accesibilidad"
          />
        </label>
      </div>

      {visualType === "function_graph" && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <h3 className="font-black text-teal-200">Gráfico de función</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              <span className="mb-2 block text-xs font-bold text-slate-400">
                Tipo
              </span>
              <select
                value={
                  visualData.kind === "quadratic" ? "quadratic" : "linear"
                }
                onChange={(event) => updateData({ kind: event.target.value })}
                className={inputClass}
              >
                <option value="linear">Lineal: ax+b</option>
                <option value="quadratic">Cuadrática: ax²+bx+c</option>
              </select>
            </label>

            {[
              ["a", 1],
              ["b", 0],
              ["c", 0],
              ["xMin", -5],
              ["xMax", 5],
              ["yMin", -5],
              ["yMax", 5],
            ].map(([key, fallback]) => (
              <label key={String(key)}>
                <span className="mb-2 block text-xs font-bold text-slate-400">
                  {String(key)}
                </span>
                <input
                  type="number"
                  step="any"
                  value={numberValue(visualData[String(key)], Number(fallback))}
                  onChange={(event) =>
                    updateData({ [String(key)]: Number(event.target.value) })
                  }
                  className={inputClass}
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {visualType === "bar_chart" && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <h3 className="font-black text-teal-200">Gráfico de barras</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs font-bold text-slate-400">
                Etiquetas separadas por coma
              </span>
              <input
                value={labels.join(", ")}
                onChange={(event) =>
                  updateData({
                    labels: event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean),
                  })
                }
                className={inputClass}
                placeholder="Enero, Febrero, Marzo"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-bold text-slate-400">
                Valores separados por coma
              </span>
              <input
                value={values.join(", ")}
                onChange={(event) =>
                  updateData({
                    values: event.target.value
                      .split(",")
                      .map((value) => Number(value.trim()))
                      .filter(Number.isFinite),
                  })
                }
                className={inputClass}
                placeholder="12, 18, 15"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-bold text-slate-400">
                Máximo del eje vertical
              </span>
              <input
                type="number"
                value={numberValue(
                  visualData.yMax,
                  Math.max(...values, 10),
                )}
                onChange={(event) =>
                  updateData({ yMax: Number(event.target.value) })
                }
                className={inputClass}
              />
            </label>
          </div>
        </div>
      )}

      {visualType === "table" && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <h3 className="font-black text-teal-200">Tabla</h3>
          <div className="mt-4 grid gap-4">
            <label>
              <span className="mb-2 block text-xs font-bold text-slate-400">
                Encabezados separados por coma
              </span>
              <input
                value={headers.join(", ")}
                onChange={(event) =>
                  updateData({
                    headers: event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean),
                  })
                }
                className={inputClass}
                placeholder="Plan, Cargo fijo, Valor por minuto"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-bold text-slate-400">
                Filas: una por línea y columnas separadas por |
              </span>
              <textarea
                rows={5}
                value={rows.map((row) => row.join(" | ")).join("\n")}
                onChange={(event) =>
                  updateData({
                    rows: event.target.value
                      .split("\n")
                      .map((line) =>
                        line.split("|").map((value) => value.trim()),
                      )
                      .filter((row) => row.some(Boolean)),
                  })
                }
                className={inputClass}
                placeholder={"A | $5.000 | $20\nB | $2.000 | $35"}
              />
            </label>
          </div>
        </div>
      )}

      {visualType === "triangle" && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <h3 className="font-black text-teal-200">Triángulo</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              ["sideA", "Base"],
              ["sideB", "Lado vertical"],
              ["sideC", "Hipotenusa"],
            ].map(([key, label]) => (
              <label key={key}>
                <span className="mb-2 block text-xs font-bold text-slate-400">
                  {label}
                </span>
                <input
                  value={String(visualData[key] ?? "")}
                  onChange={(event) =>
                    updateData({ [key]: event.target.value })
                  }
                  className={inputClass}
                  placeholder="5 cm"
                />
              </label>
            ))}
          </div>

          <label className="mt-4 flex items-center gap-3">
            <input
              type="checkbox"
              checked={visualData.rightAngle !== false}
              onChange={(event) =>
                updateData({ rightAngle: event.target.checked })
              }
            />
            <span className="font-bold">Mostrar ángulo recto</span>
          </label>
        </div>
      )}

      {visualType === "image" && (
        <div className="mt-5">
          <ImageUploader
            imageUrl={imageUrl}
            onImageUrlChange={onImageUrlChange}
          />
        </div>
      )}

      {visualType !== "none" && (
        <div className="mt-6 rounded-2xl border border-teal-300/20 bg-slate-950/40 p-4">
          <p className="text-sm font-black uppercase tracking-wide text-teal-200">
            Vista previa
          </p>
          <QuestionVisual
            visualType={visualType}
            visualData={visualData}
            imageUrl={imageUrl}
            imageAlt={imageAlt}
            compact
          />
        </div>
      )}
    </section>
  );
}
