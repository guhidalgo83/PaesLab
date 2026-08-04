from pathlib import Path
import re

replacements = {
    "src/app/adaptativo/page.tsx": [
        (
            "(bankResult.data ?? []) as Question[]",
            "(bankResult.data ?? []) as unknown as Question[]",
        ),
    ],
    "src/app/dashboard/page.tsx": [
        (
            "(attemptsResult.data ?? []) as AttemptRow[]",
            "(attemptsResult.data ?? []) as unknown as AttemptRow[]",
        ),
    ],
    "src/app/entrenar/page.tsx": [
        (
            "[...(data ?? [])]",
            "[...((data ?? []) as unknown as Question[])]",
        ),
    ],
    "src/app/historial/page.tsx": [
        (
            "(sessionData ?? []) as SessionRow[]",
            "(sessionData ?? []) as unknown as SessionRow[]",
        ),
    ],
    "src/app/mi-plan/page.tsx": [
        (
            "(data ?? []) as PlanItem[]",
            "(data ?? []) as unknown as PlanItem[]",
        ),
    ],
    "src/app/practicar-leccion/[lessonId]/page.tsx": [
        (
            "let linked = (linkData ?? [])",
            (
                "let linked = ((linkData ?? []) as unknown as "
                "Array<{ questions: Question | Question[] | null }>)"
            ),
        ),
        (
            "(fallback ?? []) as Question[]",
            "(fallback ?? []) as unknown as Question[]",
        ),
    ],
    "src/app/simulacro/page.tsx": [
        (
            "(data ?? []) as Question[]",
            "(data ?? []) as unknown as Question[]",
        ),
    ],
}

changed = 0

for file_name, changes in replacements.items():
    path = Path(file_name)

    if not path.exists():
        print(f"FALTA: {file_name}")
        continue

    text = path.read_text(encoding="utf-8")
    modified = False

    for old, new in changes:
        count = text.count(old)

        if count == 1:
            text = text.replace(old, new, 1)
            modified = True
            print(f"OK: {file_name}")
        elif count == 0:
            print(f"YA CORREGIDO O PATRÓN NO ENCONTRADO: {file_name}")
        else:
            print(f"REVISAR: patrón aparece {count} veces en {file_name}")

    if modified:
        path.write_text(text, encoding="utf-8")
        changed += 1

dashboard = Path("src/app/dashboard/page.tsx")

if dashboard.exists():
    dashboard_text = dashboard.read_text(encoding="utf-8")
    lines = dashboard_text.splitlines(keepends=True)

    matches = [
        index
        for index, line in enumerate(lines)
        if re.match(r"^\s*invierte_razon\s*:", line)
    ]

    if len(matches) == 2:
        removed = lines.pop(matches[1])
        dashboard.write_text("".join(lines), encoding="utf-8")
        print(f"OK: propiedad duplicada eliminada: {removed.strip()}")
        changed += 1
    elif len(matches) == 1:
        print("OK: invierte_razon aparece una sola vez")
    else:
        print(f"REVISAR: invierte_razon aparece {len(matches)} veces")

print(f"\nProceso terminado. Archivos corregidos: {changed}")
