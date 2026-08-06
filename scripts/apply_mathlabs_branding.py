from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
replacements = [
    ("PAESLab Aprender", "MathLabs Aprender"),
    ("PAESLab", "MathLabs"),
    ("PAES Lab", "MathLabs"),
]

changed = []
for path in list((root / "src").rglob("*.tsx")) + list((root / "src").rglob("*.ts")):
    text = path.read_text(encoding="utf-8")
    updated = text
    for old, new in replacements:
        updated = updated.replace(old, new)
    if updated != text:
        path.write_text(updated, encoding="utf-8")
        changed.append(path.relative_to(root))

readme_path = root / "README.md"
if readme_path.exists():
    text = readme_path.read_text(encoding="utf-8")
    updated = text
    for old, new in replacements:
        updated = updated.replace(old, new)
    if updated != text:
        readme_path.write_text(updated, encoding="utf-8")
        changed.append(readme_path.relative_to(root))

package_path = root / "package.json"
if package_path.exists():
    package = json.loads(package_path.read_text(encoding="utf-8"))
    if package.get("name") == "paeslab":
        package["name"] = "mathlabs"
        package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        changed.append(package_path.relative_to(root))

print("Branding MathLabs aplicado.")
for path in changed:
    print(f"- {path}")
