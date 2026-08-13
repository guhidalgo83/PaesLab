#!/usr/bin/env python3
"""Deterministic, auditable task engine for MathLabs basic macroblocks RC2.

The engine deliberately stores a machine-readable validation contract with every
task.  The package checker recomputes the answer from that contract; it never
trusts the authored ``correct_option`` field.
"""

from __future__ import annotations

import hashlib
import json
import math
import random
import re
import unicodedata
from dataclasses import dataclass
from fractions import Fraction
from typing import Any


@dataclass(frozen=True)
class Task:
    stem: str
    answer: str
    distractors: tuple[str, str, str]
    solution: str
    steps: tuple[str, ...]
    interpretation: str
    validation: dict[str, Any]
    template_id: str


def fmt_decimal(value: Fraction | float | int, places: int = 3) -> str:
    number = float(value)
    if abs(number - round(number)) < 1e-10:
        return str(int(round(number)))
    return f"{number:.{places}f}".rstrip("0").rstrip(".").replace(".", ",")


def fmt_fraction(value: Fraction) -> str:
    value = Fraction(value)
    return str(value.numerator) if value.denominator == 1 else f"{value.numerator}/{value.denominator}"


def fmt_mixed(value: Fraction) -> str:
    value = Fraction(value)
    sign = "−" if value < 0 else ""
    value = abs(value)
    whole, remainder = divmod(value.numerator, value.denominator)
    if remainder == 0:
        return f"{sign}{whole}"
    if whole == 0:
        return f"{sign}{remainder}/{value.denominator}"
    return f"{sign}{whole} {remainder}/{value.denominator}"


def _fraction(value: Any) -> Fraction:
    if isinstance(value, Fraction):
        return value
    if isinstance(value, int):
        return Fraction(value)
    if isinstance(value, float):
        return Fraction(str(value))
    if isinstance(value, str):
        return Fraction(value.replace(",", "."))
    raise TypeError(value)


def _eval_expr(expr: Any) -> Fraction:
    if isinstance(expr, Fraction):
        return expr
    if isinstance(expr, (int, float, str)):
        return _fraction(expr)
    op = expr[0]
    args = [_eval_expr(value) for value in expr[1:]]
    if op == "add":
        return sum(args, Fraction(0))
    if op == "sub":
        return args[0] - args[1]
    if op == "mul":
        result = Fraction(1)
        for value in args:
            result *= value
        return result
    if op == "div":
        return args[0] / args[1]
    if op == "pow":
        return args[0] ** int(args[1])
    if op == "abs":
        return abs(args[0])
    raise KeyError(op)


def solve_contract(contract: dict[str, Any]) -> str:
    """Independently solve one validation contract."""
    ctype = contract["type"]
    if ctype == "rational":
        value = _eval_expr(contract["expr"])
        style = contract.get("style", "integer")
        if style == "fraction":
            text = fmt_fraction(value)
        elif style == "mixed":
            text = fmt_mixed(value)
        elif style == "decimal":
            text = fmt_decimal(value, int(contract.get("places", 3)))
        elif style == "percent":
            text = f"{fmt_decimal(value * 100, 2)}%"
        else:
            if value.denominator != 1:
                raise ValueError(f"Expected integer, got {value}")
            text = str(value.numerator)
        return text + contract.get("unit", "")
    if ctype == "place_value":
        return str(int(contract["digit"]) * 10 ** int(contract["position"]))
    if ctype == "round":
        number = int(contract["number"])
        place = int(contract["place"])
        factor = 10 ** place
        return str(((number + factor // 2) // factor) * factor)
    if ctype == "compare":
        values = [_fraction(value) for value in contract["values"]]
        selected = max(values) if contract.get("mode") == "max" else min(values)
        style = contract.get("style", "decimal")
        return fmt_fraction(selected) if style == "fraction" else fmt_decimal(selected)
    if ctype == "division":
        dividend, divisor = int(contract["dividend"]), int(contract["divisor"])
        quotient, remainder = divmod(dividend, divisor)
        mode = contract.get("mode", "quotient")
        if mode == "quotient_remainder":
            return f"{quotient}, resto {remainder}"
        if mode == "groups_needed":
            return str(math.ceil(dividend / divisor))
        if mode == "remainder":
            return str(remainder)
        return str(quotient)
    if ctype == "mixed":
        return fmt_mixed(Fraction(int(contract["numerator"]), int(contract["denominator"])))
    if ctype == "ratio":
        a, b, factor = int(contract["a"]), int(contract["b"]), int(contract["factor"])
        return f"{a * factor}:{b * factor}"
    if ctype == "sequence":
        start, difference, position = (int(contract[key]) for key in ("start", "difference", "position"))
        return str(start + (position - 1) * difference)
    if ctype == "linear_equation":
        a, b, c = (int(contract[key]) for key in ("a", "b", "c"))
        value = Fraction(c - b, a)
        return fmt_fraction(value)
    if ctype == "linear_inequality":
        a, b, c = (int(contract[key]) for key in ("a", "b", "c"))
        sign = contract["sign"]
        boundary = Fraction(c - b, a)
        if a < 0:
            sign = {"<": ">", ">": "<", "≤": "≥", "≥": "≤"}[sign]
        return f"x {sign} {fmt_fraction(boundary)}"
    if ctype == "algebra":
        op = contract["op"]
        if op == "combine_like":
            coefficient = sum(int(value) for value in contract["coefficients"])
            variable = contract.get("variable", "x")
            return f"{coefficient}{variable}"
        if op == "translate":
            coefficient, constant = int(contract["coefficient"]), int(contract["constant"])
            variable = contract.get("variable", "n")
            sign = "+" if constant >= 0 else "−"
            return f"{coefficient}{variable} {sign} {abs(constant)}"
        raise KeyError(op)
    if ctype == "coordinate":
        x, y = int(contract["x"]), int(contract["y"])
        if contract["op"] == "translate":
            x += int(contract["dx"])
            y += int(contract["dy"])
        elif contract["op"] == "reflect_y":
            x = -x
        elif contract["op"] == "reflect_x":
            y = -y
        return f"({x}, {y})"
    if ctype == "angle_type":
        angle = int(contract["angle"])
        if angle == 0 or angle == 360:
            return "Completo" if angle == 360 else "Nulo"
        if angle < 90:
            return "Agudo"
        if angle == 90:
            return "Recto"
        if angle < 180:
            return "Obtuso"
        if angle == 180:
            return "Extendido"
        return "Cóncavo"
    if ctype == "geometry_rule":
        rule = contract["rule"]
        answers = {
            "parallel": "No se intersectan y mantienen distancia constante.",
            "perpendicular": "Se intersectan formando cuatro ángulos rectos.",
            "translation": "Conserva longitudes, ángulos y orientación.",
            "reflection": "Conserva longitudes y ángulos, pero invierte la orientación.",
            "rotation": "Conserva longitudes y ángulos alrededor de un centro.",
            "tessellation": "Cubre el plano sin huecos ni superposiciones.",
            "bisector": "Divide un ángulo en dos ángulos de igual medida.",
            "perpendicular_bisector": "Es perpendicular al segmento y pasa por su punto medio.",
            "median": "Une un vértice con el punto medio del lado opuesto.",
            "altitude": "Pasa por un vértice y es perpendicular al lado opuesto.",
        }
        return answers[rule]
    if ctype == "statistic":
        data = sorted(int(value) for value in contract["data"])
        rule = contract["rule"]
        if rule == "mean":
            return fmt_decimal(Fraction(sum(data), len(data)), 2)
        if rule == "median":
            middle = len(data) // 2
            value = Fraction(data[middle]) if len(data) % 2 else Fraction(data[middle - 1] + data[middle], 2)
            return fmt_decimal(value, 2)
        if rule == "range":
            return str(data[-1] - data[0])
        if rule == "mode":
            counts = {value: data.count(value) for value in set(data)}
            return str(max(counts, key=lambda value: (counts[value], -value)))
        raise KeyError(rule)
    if ctype == "probability_label":
        favorable, total = int(contract["favorable"]), int(contract["total"])
        if favorable == 0:
            return "Imposible"
        if favorable == total:
            return "Seguro"
        ratio = Fraction(favorable, total)
        if ratio < Fraction(1, 3):
            return "Poco posible"
        if ratio > Fraction(2, 3):
            return "Muy posible"
        return "Posible"
    if ctype == "sample_estimate":
        population = int(contract["population"])
        favorable = int(contract["favorable"])
        sample = int(contract["sample"])
        return str(round(population * favorable / sample))
    if ctype == "stem_leaf":
        stem = int(contract["stem"])
        leaf = int(contract["leaf"])
        return str(stem * 10 + leaf)
    if ctype == "data_choice":
        rule = contract["rule"]
        if rule == "larger_mean":
            means = [Fraction(sum(group), len(group)) for group in contract["groups"]]
            return contract["labels"][means.index(max(means))]
        if rule == "larger_range":
            ranges = [max(group) - min(group) for group in contract["groups"]]
            return contract["labels"][ranges.index(max(ranges))]
        if rule == "representative_sample":
            return contract["labels"][int(contract["best_index"])]
        if rule == "chart_type":
            return {"trend": "Gráfico de líneas", "parts": "Gráfico circular", "compare": "Gráfico de barras"}[contract["purpose"]]
        raise KeyError(rule)
    raise KeyError(ctype)


def normalize_semantic(text: str) -> tuple[Any, ...]:
    """Normalize common mathematical equivalences used in answer options."""
    raw = unicodedata.normalize("NFKC", text).strip().lower().replace("−", "-")
    raw = re.sub(r"\s+", " ", raw)
    unit_match = re.search(r"\s*(cm²|cm³|cm|mm|m|km|°|%)$", raw)
    unit = unit_match.group(1) if unit_match else ""
    core = raw[: unit_match.start()].strip() if unit_match else raw
    core_dot = core.replace(" ", "").replace(",", ".")
    mixed = re.fullmatch(r"(-?\d+)\s+(\d+)/(\d+)", core)
    if mixed:
        whole = int(mixed.group(1))
        value = Fraction(abs(whole)) + Fraction(int(mixed.group(2)), int(mixed.group(3)))
        if whole < 0:
            value = -value
        return ("number", value, unit)
    fraction = re.fullmatch(r"(-?\d+)/(\d+)", core_dot)
    if fraction:
        return ("number", Fraction(int(fraction.group(1)), int(fraction.group(2))), unit)
    decimal = re.fullmatch(r"-?\d+(?:\.\d+)?", core_dot)
    if decimal:
        value = Fraction(decimal.group(0))
        if unit == "%":
            value /= 100
        return ("number", value, unit)
    ratio = re.fullmatch(r"(-?\d+):(-?\d+)", core_dot)
    if ratio:
        return ("ratio", Fraction(int(ratio.group(1)), int(ratio.group(2))))
    coordinate = re.fullmatch(r"\((-?\d+),\s*(-?\d+)\)", core)
    if coordinate:
        return ("coordinate", int(coordinate.group(1)), int(coordinate.group(2)))
    return ("text", raw)


def contract_signature(contract: dict[str, Any]) -> str:
    payload = json.dumps(contract, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _jsonable(value: Any) -> Any:
    if isinstance(value, Fraction):
        return str(value)
    if isinstance(value, list):
        return [_jsonable(item) for item in value]
    if isinstance(value, tuple):
        return [_jsonable(item) for item in value]
    if isinstance(value, dict):
        return {key: _jsonable(item) for key, item in value.items()}
    return value


def _make(
    stem: str,
    distractors: list[str],
    solution: str,
    steps: list[str],
    interpretation: str,
    validation: dict[str, Any],
    template_id: str,
) -> Task:
    validation = {**validation, "skill_template": template_id}
    answer = solve_contract(validation)
    repaired: list[str] = []
    seen = {normalize_semantic(answer)}
    for candidate in map(str, distractors):
        semantic = normalize_semantic(candidate)
        if semantic not in seen:
            repaired.append(candidate)
            seen.add(semantic)
    if len(repaired) < 3:
        semantic_answer = normalize_semantic(answer)
        generated: list[str] = []
        if semantic_answer[0] == "number":
            value, unit = semantic_answer[1], semantic_answer[2]
            raw = answer.lower().replace("−", "-")
            for delta in (Fraction(1), Fraction(-1), Fraction(2), Fraction(-2), Fraction(1, 2), Fraction(-1, 2)):
                candidate_value = value + delta
                if "/" in raw:
                    core = fmt_fraction(candidate_value)
                elif "," in raw or "." in raw:
                    core = fmt_decimal(candidate_value, 3)
                elif candidate_value.denominator == 1:
                    core = str(candidate_value.numerator)
                else:
                    core = fmt_fraction(candidate_value)
                suffix = unit
                if suffix and suffix != "%":
                    suffix = " " + suffix
                generated.append(core + suffix)
        elif semantic_answer[0] == "ratio":
            ratio = semantic_answer[1]
            generated = [f"{ratio.numerator+1}:{ratio.denominator}", f"{ratio.numerator}:{ratio.denominator+1}", f"{ratio.denominator}:{ratio.numerator}"]
        elif semantic_answer[0] == "coordinate":
            x, y = semantic_answer[1], semantic_answer[2]
            generated = [f"({x+1}, {y})", f"({x}, {y+1})", f"({-x}, {y})", f"({y}, {x})"]
        else:
            generated = [
                "Se aplica la relación inversa sin comprobar sus condiciones.",
                "Se conserva solo la apariencia, no la propiedad matemática.",
                "La conclusión depende únicamente del tamaño del dibujo.",
            ]
        for candidate in generated:
            semantic = normalize_semantic(candidate)
            if semantic not in seen:
                repaired.append(candidate)
                seen.add(semantic)
            if len(repaired) == 3:
                break
    values = [answer, *repaired[:3]]
    if len(values) != 4 or len({normalize_semantic(value) for value in values}) != 4:
        raise ValueError(f"Non-distinct options in {template_id}: {values}")
    forbidden = ("alternativa no válida", "tbd", "lorem ipsum")
    if any(token in " ".join(values).lower() for token in forbidden):
        raise ValueError(f"Forbidden placeholder in {template_id}")
    return Task(
        stem=stem,
        answer=answer,
        distractors=tuple(values[1:]),
        solution=solution,
        steps=tuple(steps),
        interpretation=interpretation,
        validation={**validation, "signature": contract_signature(validation)},
        template_id=template_id,
    )


def _numeric_task(
    *,
    stem: str,
    expr: Any,
    wrong_exprs: list[Any],
    style: str,
    template_id: str,
    explanation: str,
    unit: str = "",
    places: int = 3,
    interpretation: str = "El resultado responde a la cantidad solicitada y conserva sus unidades.",
) -> Task:
    contract = {"type": "rational", "expr": _jsonable(expr), "style": style, "unit": unit, "places": places}
    wrong = [solve_contract({**contract, "expr": candidate}) for candidate in wrong_exprs]
    answer = solve_contract(contract)
    steps = [
        "Identifica los datos y la operación que modela la pregunta.",
        explanation,
        f"Comprueba el cálculo: el resultado obtenido es {answer}.",
    ]
    return _make(stem, wrong, explanation, steps, interpretation, contract, template_id)


def _rng(grade: str, oa_number: int, track: str, index: int) -> random.Random:
    seed = int(grade[0]) * 100_000 + oa_number * 1_000 + (0 if track == "a" else 500) + index
    return random.Random(seed)


def _context(grade: str, index: int) -> str:
    choices = {
        "5B": ["una biblioteca escolar", "un huerto del curso", "una campaña de reciclaje", "una feria científica", "un taller de arte"],
        "6B": ["un laboratorio escolar", "una ruta de transporte", "un club deportivo escolar", "una exposición", "un proyecto ambiental"],
        "7B": ["un registro meteorológico", "un proyecto tecnológico", "una cooperativa escolar", "una investigación de aula", "un plano urbano"],
    }
    return choices[grade][index % len(choices[grade])]


def _make_task_core(cfg: dict[str, Any], oa_item: dict[str, Any], track: str, index: int) -> Task:
    """Create one OA-aligned task. Tracks A and B use different task families."""
    kind = oa_item["kind"]
    grade = cfg["grade"]
    oa_number = int(oa_item["n"])
    rng = _rng(grade, oa_number, track, index)
    template = index % 5
    context = _context(grade, index + oa_number)
    tid = f"{grade}-{oa_number:02d}-{track.upper()}-T{template + 1}"

    # Numbers and arithmetic -------------------------------------------------
    if kind == "place_value":
        position = 2 + (index % 6)
        digit = 2 + ((index + oa_number) % 7)
        tail = (137 * (index + 3)) % (10**position)
        number = digit * 10**position + tail
        # Ensure the queried digit occurs only once, removing RC1 ambiguity.
        while str(number).count(str(digit)) != 1:
            tail = (tail + 113) % (10**position)
            number = digit * 10**position + tail
        if track == "a":
            contract = {"type": "place_value", "digit": digit, "position": position}
            wrong = [str(digit * 10 ** max(0, position - 1)), str(digit), str(digit * 10 ** (position + 1))]
            return _make(
                f"En el número {number:,}, el dígito {digit} aparece una sola vez. ¿Cuál es su valor posicional?".replace(",", " "),
                wrong,
                "Ubica el dígito y multiplícalo por la potencia de diez correspondiente.",
                [f"El dígito está en la posición 10^{position}.", f"Calcula {digit}·10^{position}.", f"Se obtiene {solve_contract(contract)}."],
                "Ese valor es el aporte exacto del dígito al número.",
                contract,
                tid,
            )
        place = 2 + index % 5
        number += (index + 4) * 10 ** max(0, place - 1)
        contract = {"type": "round", "number": number, "place": place}
        factor = 10**place
        correct = int(solve_contract(contract))
        wrong = [str((number // factor) * factor), str(number), str(correct + factor)]
        return _make(
            f"En {context} se registraron {number:,} unidades. ¿Cuál es el número redondeado a la posición de {factor:,}?".replace(",", " "),
            wrong,
            "Observa la cifra inmediatamente inferior y aplica la regla de redondeo.",
            [f"La posición solicitada vale {factor}.", "Revisa la cifra situada a su derecha.", f"El redondeo es {correct}."],
            "El valor redondeado aproxima el registro sin cambiar su orden de magnitud.",
            contract,
            tid,
        )

    if kind in {"mental_mult", "multiplication"}:
        a = 12 + oa_number + index
        b = 11 + (index % 9)
        expr = ["mul", a, b]
        if track == "a":
            stem = f"Calcula {a}·{b} descomponiendo {b} como {b-1}+1."
            explanation = f"Aplica {a}·({b-1}+1)={a}·{b-1}+{a}."
        else:
            stem = f"En {context}, {b} equipos reúnen {a} elementos cada uno. ¿Cuántos elementos reúnen en total?"
            explanation = "Multiplica la cantidad de equipos por los elementos de cada equipo."
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=[["add", a, b], ["mul", a, b-1], ["mul", a+1, b]], style="integer", template_id=tid, explanation=explanation)

    if kind == "division":
        divisor = 3 + index % 7
        quotient = 18 + index + oa_number
        remainder = (index + 1) % divisor
        dividend = divisor * quotient + remainder
        mode = "quotient_remainder" if track == "a" else "groups_needed"
        contract = {"type": "division", "dividend": dividend, "divisor": divisor, "mode": mode}
        if track == "a":
            wrong = [f"{quotient+1}, resto {remainder}", f"{quotient}, resto {divisor-remainder}" if remainder else f"{quotient-1}, resto 1", f"{divisor}, resto {remainder}"]
            stem = f"Divide {dividend} entre {divisor}. ¿Cuál es el cociente y el resto?"
            interpretation = "El resto debe ser menor que el divisor y reconstruir el dividendo."
        else:
            needed = math.ceil(dividend / divisor)
            wrong = [str(max(1, needed-1)), str(needed+1), str(divisor)]
            stem = f"En {context} deben distribuir {dividend} objetos en cajas de hasta {divisor}. ¿Cuántas cajas se necesitan como mínimo?"
            interpretation = "Cuando queda un resto, se necesita una caja adicional."
        return _make(stem, wrong, "Usa dividendo = divisor·cociente + resto e interpreta el resto.", [f"Calcula {dividend}÷{divisor}.", f"Cociente {quotient} y resto {remainder}.", f"La respuesta pedida es {solve_contract(contract)}."], interpretation, contract, tid)

    if kind == "operations":
        a = 5 + index
        b = 3 + index % 6
        c = 2 + (index + oa_number) % 5
        if track == "a":
            expr = ["add", a, ["mul", b, c]]
            stem = f"Evalúa {a}+{b}·{c} respetando la prioridad de operaciones."
            wrong = [["mul", ["add", a, b], c], ["add", a, b, c], ["sub", ["mul", b, c], a]]
        else:
            expr = ["sub", ["mul", a, b], c]
            stem = f"En {context}, se preparan {a} grupos de {b} materiales y se descartan {c}. ¿Cuántos quedan?"
            wrong = [["mul", a, ["sub", b, c]], ["add", ["mul", a, b], c], ["add", a, b, c]]
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=wrong, style="integer", template_id=tid, explanation="Resuelve primero la multiplicación y después la adición o sustracción indicada.")

    if kind == "factors":
        factor = 2 + index % 9
        other = 3 + oa_number + index
        number = factor * other
        if track == "a":
            expr = ["div", number, factor]
            stem = f"Si {factor} es factor de {number}, ¿qué otro factor completa el producto?"
            wrong = [["add", factor, other], ["sub", number, factor], factor]
        else:
            expr = ["mul", factor, other]
            stem = f"En {context} se ordenan objetos en {factor} filas de {other}. ¿Qué múltiplo de {factor} representa el total?"
            wrong = [["add", factor, other], ["mul", factor, other-1], ["mul", factor+1, other]]
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=wrong, style="integer", template_id=tid, explanation="Usa la relación entre factores, producto y división exacta.")

    if kind == "integers":
        a = 5 + (index % 13)
        b = 3 + ((index * 3 + oa_number) % 11)
        if track == "a":
            expr = ["add", -a, b]
            stem = f"Calcula (−{a})+{b} usando una recta numérica o reglas de signos."
            wrong = [["sub", -a, b], ["add", a, b], ["sub", a, b]]
        else:
            expr = ["sub", b, a]
            stem = f"Un registro cambia desde {b} unidades sobre la referencia hasta {a} unidades bajo ella. ¿Cuál es el cambio con signo?"
            wrong = [["add", a, b], ["sub", a, b], ["sub", -a, b]]
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=wrong, style="integer", template_id=tid, explanation="Representa cada cantidad con signo y realiza la operación en el orden indicado.", interpretation="El signo indica la dirección del cambio respecto de la referencia.")

    if kind == "powers10":
        exponent = 2 + index % 6
        coefficient = 2 + oa_number + index
        if track == "a":
            expr = ["mul", coefficient, ["pow", 10, exponent]]
            stem = f"¿Qué número representa {coefficient}·10^{exponent}?"
            wrong = [["mul", coefficient, 10, exponent], ["add", coefficient, ["pow", 10, exponent]], ["pow", 10, ["add", exponent, 1]]]
        else:
            expr = ["div", coefficient * 10 ** exponent, ["pow", 10, exponent]]
            stem = f"Una medición se escribe como {coefficient * 10 ** exponent}={coefficient}·10^{exponent}. ¿Cuál es el coeficiente?"
            wrong = [coefficient * 10, exponent, coefficient + exponent]
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=wrong, style="integer", template_id=tid, explanation="Interpreta 10^n como una potencia de base diez y conserva la posición del coeficiente.")

    if kind in {"percentage", "percentage_change"}:
        percent = [10, 20, 25, 40, 50][index % 5]
        base = 40 + 20 * (index + oa_number + int(grade[0]))
        change = ["mul", base, Fraction(percent, 100)]
        if kind == "percentage" and track == "b":
            part = int(_eval_expr(change))
            expr = ["div", part, base]
            stem = f"En una cuadrícula de {base} celdas, {part} están destacadas. ¿Qué porcentaje representan?"
            wrong = [["div", base-part, base], ["div", part, base+1], ["div", base, part]]
            interpretation = "El porcentaje compara la parte destacada con el total de la cuadrícula."
            return _numeric_task(stem=stem, expr=expr, wrong_exprs=wrong, style="percent", template_id=tid, explanation="Divide la parte por el total y expresa la razón sobre 100.", interpretation=interpretation)
        if track == "a":
            expr = change
            stem = f"¿Cuánto es {percent}% de {base}?"
            wrong = [["add", base, percent], percent, ["sub", base, change]]
            interpretation = "El resultado representa la parte correspondiente del total."
        else:
            increase = index % 2 == 0
            expr = ["add" if increase else "sub", base, change]
            action = "aumenta" if increase else "disminuye"
            stem = f"En {context}, una cantidad de {base} {action} {percent}%. ¿Cuál es el nuevo valor?"
            wrong = [change, ["sub" if increase else "add", base, change], ["add", base, percent]]
            interpretation = "Una variación porcentual se aplica al valor inicial antes de sumar o restar el cambio."
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=wrong, style="integer", template_id=tid, explanation="Convierte el porcentaje en una fracción de 100, calcula el cambio y responde lo solicitado.", interpretation=interpretation)

    if kind == "ratio":
        a = 2 + index % 6
        b = a + 2 + oa_number % 4
        factor = 2 + index % 5
        contract = {"type": "ratio", "a": a, "b": b, "factor": factor}
        if track == "a":
            stem = f"Amplifica la razón {a}:{b} por {factor}. ¿Qué razón equivalente obtienes?"
        else:
            stem = f"En {context}, la razón entre dos grupos es {a}:{b}. Si ambos grupos se multiplican por {factor}, ¿qué razón describe la nueva situación?"
        wrong = [f"{a+factor}:{b+factor}", f"{a*factor}:{b}", f"{a}:{b*factor}"]
        return _make(stem, wrong, "Multiplica ambos términos de la razón por el mismo factor.", [f"Razón inicial: {a}:{b}.", f"Factor de amplificación: {factor}.", f"Razón equivalente: {solve_contract(contract)}."], "La razón no cambia porque ambos términos se escalan de la misma manera.", contract, tid)

    # Fractions and decimals -------------------------------------------------
    if kind in {"fraction_equiv", "fraction_mult", "fraction_add", "fraction_decimal", "fraction_decimal_ops", "decimal_add", "decimal_mult", "decimal_compare", "improper_mixed"}:
        return _fraction_decimal_task(cfg, oa_item, track, index, tid, context)

    # Algebra ---------------------------------------------------------------
    if kind in {"sequence", "table_pattern", "generalization", "algebra_language", "algebra_reduce", "equation_add", "linear_equation", "linear_equation_inequality", "proportionality"}:
        return _algebra_task(cfg, oa_item, track, index, tid, context)

    # Geometry and measurement ---------------------------------------------
    if kind in {"coordinates", "coordinates_vectors", "geometry_parallel", "congruence", "tessellation", "geometric_construction", "length", "length_conversion", "rectangle", "area", "triangles", "surface", "volume", "angle_measure", "angle_relations", "angle_sum", "parallel_angles", "polygon_angles", "circle"}:
        return _geometry_task(cfg, oa_item, track, index, tid, context)

    # Data and probability --------------------------------------------------
    if kind in {"mean", "central_tendency", "probability_words", "probability_compare", "sampling", "frequency", "experimental_probability", "theoretical_probability", "chart", "distribution", "stem_leaf"}:
        return _data_task(cfg, oa_item, track, index, tid, context)

    raise KeyError(f"No RC2 task family for {grade} OA{oa_number:02d}: {kind}")


def _fraction_decimal_task(cfg: dict[str, Any], oa: dict[str, Any], track: str, index: int, tid: str, context: str) -> Task:
    kind = oa["kind"]
    grade = cfg["grade"]
    numerator = 2 + index
    denominator = 2 * numerator + 1 + int(oa["n"]) % 3
    if kind == "fraction_equiv":
        factor = 2 + index % 6
        if track == "a":
            expr = Fraction(numerator * factor, denominator * factor)
            stem = f"¿Cuál es el valor simplificado de {numerator*factor}/{denominator*factor}?"
            wrong = [Fraction(numerator+factor, denominator+factor), Fraction(numerator*factor, denominator), Fraction(numerator, denominator*factor)]
        else:
            expr = Fraction(numerator, denominator)
            stem = f"En {context}, se completaron {numerator*factor} de {denominator*factor} partes iguales. ¿Qué fracción irreducible representa el avance?"
            wrong = [Fraction(numerator+1, denominator), Fraction(numerator, denominator+1), Fraction(denominator, numerator)]
        return _numeric_task(stem=stem, expr=str(expr), wrong_exprs=[str(value) for value in wrong], style="fraction", template_id=tid, explanation="Divide numerador y denominador por un factor común y verifica la equivalencia.")
    if kind == "fraction_mult":
        other_num = 1 + index % 5
        other_den = other_num + 4 + index // 5
        if track == "a":
            expr = ["mul", str(Fraction(numerator, denominator)), str(Fraction(other_num, other_den))]
            stem = f"Calcula {numerator}/{denominator}·{other_num}/{other_den} y simplifica."
            wrong = [["add", numerator, other_num], ["div", str(Fraction(numerator, denominator)), str(Fraction(other_num, other_den))], ["mul", str(Fraction(numerator, other_den)), str(Fraction(other_num, denominator))]]
        else:
            expr = ["div", str(Fraction(numerator, denominator)), str(Fraction(other_num, other_den))]
            stem = f"Una porción de {numerator}/{denominator} se reparte en grupos de {other_num}/{other_den}. ¿Cuántos grupos se forman?"
            wrong = [["mul", str(Fraction(numerator, denominator)), str(Fraction(other_num, other_den))], ["div", numerator, other_num], ["div", denominator, other_den]]
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=wrong, style="fraction", template_id=tid, explanation="Para multiplicar opera numeradores y denominadores; para dividir multiplica por el recíproco.")
    if kind == "fraction_add":
        d1 = 5 + index
        d2 = 7 + 2 * index
        n1 = 1 + index % (d1 - 1)
        n2 = 2 + index % (d2 - 2)
        op = "add" if track == "a" else "sub"
        first, second = Fraction(n1, d1), Fraction(n2, d2)
        if op == "sub" and first < second:
            first, second = second, first
        expr = [op, str(first), str(second)]
        symbol = "+" if op == "add" else "−"
        stem = f"Calcula {fmt_fraction(first)}{symbol}{fmt_fraction(second)} y simplifica."
        wrong = [[op, first.numerator, second.numerator], [op, str(first), str(-second)], ["add", str(first), str(second)]]
        if op == "add":
            wrong[2] = ["sub", str(first), str(second)]
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=wrong, style="fraction", template_id=tid, explanation="Busca un denominador común, opera los numeradores equivalentes y simplifica.")
    if kind == "improper_mixed":
        denominator = 3 + index % 7
        whole = 2 + index
        remainder = 1 + (index * 2) % (denominator - 1)
        numerator = whole * denominator + remainder
        contract = {"type": "mixed", "numerator": numerator, "denominator": denominator}
        if track == "a":
            stem = f"Convierte {numerator}/{denominator} en número mixto."
        else:
            stem = f"En {context}, una medida equivale a {numerator}/{denominator} unidades. ¿Cómo se expresa como número mixto?"
        wrong = [f"{whole+1} {remainder}/{denominator}", f"{whole} {denominator-remainder}/{denominator}", f"{whole} {remainder}/{numerator}"]
        return _make(stem, wrong, "Divide el numerador por el denominador; el cociente es la parte entera y el resto queda sobre el denominador.", [f"{numerator}÷{denominator}={whole} con resto {remainder}.", f"La parte fraccionaria es {remainder}/{denominator}.", f"Resultado: {solve_contract(contract)}."], "La fracción impropia y el número mixto representan el mismo punto en la recta numérica.", contract, tid)
    if kind == "fraction_decimal":
        denominator = [2, 4, 5, 10][index % 4]
        numerator = 4 * index + 1
        value = Fraction(numerator, denominator)
        if track == "a":
            stem = f"¿Qué número decimal equivale a {numerator}/{denominator}?"
        else:
            factor = 10 if 10 % denominator == 0 else 100
            factor *= 1 + index // 4
            stem = f"En {context}, una medida corresponde a {numerator*factor}/{denominator*factor}. ¿Qué decimal representa?"
        return _numeric_task(stem=stem, expr=str(value), wrong_exprs=[str(value + Fraction(1,10)), str(Fraction(numerator,10)), str(Fraction(denominator,numerator))], style="decimal", template_id=tid, explanation="Transforma la fracción a denominador 10 o 100, o divide numerador por denominador.")
    if kind == "decimal_compare":
        base = Fraction(10 + index, 10)
        values = [base + Fraction(2,100), base + Fraction(15,1000), base + Fraction(1,100)]
        if track == "b":
            values = [value + Fraction(1,1000) for value in values]
        contract = {"type": "compare", "values": [str(value) for value in values], "mode": "max" if track == "a" else "min", "style": "decimal"}
        mode = "mayor" if track == "a" else "menor"
        answer = solve_contract(contract)
        wrong = [fmt_decimal(value) for value in values if fmt_decimal(value) != answer]
        wrong.append(fmt_decimal(max(values) + Fraction(1,10)))
        return _make(f"¿Cuál es el {mode} de estos decimales: {', '.join(fmt_decimal(v) for v in values)}?", wrong[:3], "Alinea unidades, décimas, centésimas y milésimas antes de comparar.", ["Iguala la cantidad de cifras decimales con ceros.", "Compara de izquierda a derecha.", f"El valor solicitado es {answer}."], "La comparación usa el valor posicional, no la cantidad de cifras escritas.", contract, tid)
    if kind in {"decimal_add", "decimal_mult"}:
        x = Fraction(12 + index, 10)
        y = Fraction(3 + (index * 3) % 8, 10)
        if kind == "decimal_mult":
            if track == "a":
                factor = 2 + index % 7
                expr = ["mul", str(x), factor]
                stem = f"Calcula {fmt_decimal(x)}·{factor}."
                wrong = [["add", str(x), factor], ["mul", str(x), factor+1], ["div", str(x), factor]]
            else:
                divisor = 2 + index % 5
                product = x * divisor
                expr = ["div", str(product), divisor]
                stem = f"En {context}, {fmt_decimal(product)} unidades se reparten en {divisor} partes iguales. ¿Cuánto recibe cada parte?"
                wrong = [["mul", str(product), divisor], ["div", str(product), divisor+1], ["sub", str(product), divisor]]
        else:
            op = "add" if track == "a" else "sub"
            first, second = (x + y, y) if op == "sub" else (x, y)
            expr = [op, str(first), str(second)]
            symbol = "+" if op == "add" else "−"
            stem = f"Calcula {fmt_decimal(first)}{symbol}{fmt_decimal(second)} alineando el valor posicional."
            wrong = [["add", str(first), str(second)] if op == "sub" else ["sub", str(first), str(second)], [op, str(first), str(second + Fraction(1,10))], [op, str(first), str(second + 1)]]
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=wrong, style="decimal", template_id=tid, explanation="Alinea las posiciones decimales y verifica el orden de magnitud con una estimación.")
    # fraction_decimal_ops: operations depend on the official OA and grade.
    first = Fraction(2 + index, 7 + 2 * index)
    second = Fraction(1 + index % 5, 8 + index)
    if grade == "7B":
        op = "mul" if track == "a" else "div"
    else:
        op = "add" if track == "a" else "sub"
        if op == "sub" and first < second:
            first, second = second, first
    symbol = {"mul": "·", "div": "÷", "add": "+", "sub": "−"}[op]
    expr = [op, str(first), str(second)]
    stem = f"En {context}, una cantidad requiere calcular {fmt_fraction(first)}{symbol}{fmt_fraction(second)}. ¿Cuál es el resultado simplificado?"
    alternate = "div" if op == "mul" else "mul" if op == "div" else "sub" if op == "add" else "add"
    wrong = [[alternate, str(first), str(second)], [op, first.numerator, second.numerator], ["add", str(first), str(second)]]
    if op == "add":
        wrong[2] = ["sub", str(first), str(second)]
    return _numeric_task(stem=stem, expr=expr, wrong_exprs=wrong, style="fraction", template_id=tid, explanation="Representa ambas cantidades de forma compatible, realiza la operación y simplifica.")


def _algebra_task(cfg: dict[str, Any], oa: dict[str, Any], track: str, index: int, tid: str, context: str) -> Task:
    kind = oa["kind"]
    if kind in {"sequence", "table_pattern", "generalization"}:
        start = 2 + int(oa["n"]) + index
        difference = 2 + index % 7
        position = 5 + index % 6 if track == "a" else 10 + index % 8
        contract = {"type": "sequence", "start": start, "difference": difference, "position": position}
        first_terms = [start + i * difference for i in range(4)]
        if track == "a":
            stem = f"La sucesión comienza {', '.join(map(str, first_terms))}. ¿Cuál es el término de posición {position}?"
        else:
            stem = f"En {context}, la cantidad inicial es {start} y aumenta {difference} por etapa. ¿Cuál es la cantidad en la etapa {position}?"
        correct = int(solve_contract(contract))
        wrong = [str(correct-difference), str(correct+difference), str(start+position*difference)]
        return _make(stem, wrong, "Usa aₙ=a₁+(n−1)d y verifica con los primeros términos.", [f"a₁={start}, d={difference}, n={position}.", f"Sustituye: {start}+({position}−1)·{difference}.", f"Resultado: {correct}."], "La regla permite predecir cualquier término sin listar toda la sucesión.", contract, tid)
    if kind in {"algebra_language", "algebra_reduce"}:
        a = 2 + index % 7
        b = 3 + (index * 2) % 8
        if kind == "algebra_language" and track == "a":
            contract = {"type": "algebra", "op": "translate", "coefficient": a, "constant": b, "variable": "n"}
            stem = f"¿Qué expresión representa «{a} veces un número n, aumentado en {b}»?"
            wrong = [f"{a+b}n", f"{a}(n+{b})", f"{a}n − {b}"]
            explanation = "Traduce cada relación respetando multiplicación y adición."
        else:
            contract = {"type": "algebra", "op": "combine_like", "coefficients": [a, b], "variable": "x"}
            stem = f"Reduce los términos semejantes {a}x+{b}x."
            wrong = [f"{a*b}x", f"{a+b}x²", str(a+b)]
            explanation = "Suma los coeficientes y conserva la parte literal."
        return _make(stem, wrong, explanation, ["Identifica la operación y la variable.", explanation, f"Resultado: {solve_contract(contract)}."], "La expresión conserva la relación descrita para cualquier valor de la variable.", contract, tid)
    if kind in {"equation_add", "linear_equation"}:
        x = 4 + index + int(oa["n"])
        a = 1 if kind == "equation_add" else 2 + index % 6
        b = 2 + (index * 3) % 9
        c = a*x+b
        contract = {"type": "linear_equation", "a": a, "b": b, "c": c}
        if track == "a":
            stem = f"Resuelve {a}x+{b}={c}."
        else:
            stem = f"En {context}, {a} grupos iguales más {b} elementos suman {c}. ¿Cuántos elementos hay en cada grupo?"
        wrong = [str(x-1), str(x+1), str(c-b)]
        return _make(stem, wrong, "Resta el término constante y divide por el coeficiente, manteniendo el equilibrio.", [f"{a}x={c-b}.", f"x=({c-b})/{a}.", f"x={x}; al sustituir se recupera {c}."], "La solución es el valor que hace verdadera la igualdad.", contract, tid)
    if kind == "linear_equation_inequality":
        x = 4 + index
        a = 2 + index % 5
        b = 1 + index % 6
        c = a*x+b
        if track == "a":
            contract = {"type": "linear_equation", "a": a, "b": b, "c": c}
            stem = f"Resuelve la ecuación {a}x+{b}={c}."
            wrong = [str(x-1), str(x+1), str(c-b)]
        else:
            sign = "<" if index % 2 == 0 else "≤"
            contract = {"type": "linear_inequality", "a": a, "b": b, "c": c, "sign": sign}
            stem = f"Resuelve la inecuación {a}x+{b} {sign} {c}."
            wrong = [f"x > {x}", f"x {sign} {c-b}", f"x = {x}"]
        return _make(stem, wrong, "Aplica operaciones equivalentes en ambos lados y conserva el sentido de la desigualdad porque el coeficiente es positivo.", [f"Aísla {a}x restando {b}.", f"Divide ambos lados por {a}.", f"Solución: {solve_contract(contract)}."], "Una ecuación entrega valores que igualan; una inecuación describe un conjunto ordenado de valores.", contract, tid)
    if kind == "proportionality":
        k = 2 + index % 7
        x = 3 + index
        if track == "a":
            expr = ["mul", k, x]
            stem = f"En la relación directa y={k}x, ¿cuánto vale y cuando x={x}?"
            wrong = [["add", k, x], ["sub", x, k], x]
            explanation = "Multiplica x por la constante de proporcionalidad."
        else:
            total = k * x
            expr = ["div", total, x]
            stem = f"En una relación inversa xy={total}, ¿cuánto vale y cuando x={x}?"
            wrong = [["mul", total, x], ["sub", total, x], ["div", x, total]]
            explanation = "En una relación inversa el producto xy permanece constante."
        style = "integer" if track == "a" else "fraction"
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=wrong, style=style, template_id=tid, explanation=explanation)
    raise KeyError(kind)


def _geometry_task(cfg: dict[str, Any], oa: dict[str, Any], track: str, index: int, tid: str, context: str) -> Task:
    kind = oa["kind"]
    if kind in {"coordinates", "coordinates_vectors"}:
        x = 2 + index
        y = 3 + (index * 2) % 11
        if track == "a" and kind == "coordinates":
            contract = {"type": "coordinate", "op": "identity", "x": x, "y": y}
            stem = f"¿Qué par ordenado ubica un punto con coordenada horizontal {x} y vertical {y}?"
        else:
            dx = 1 + index % 5
            dy = 1 + (index * 3) % 5
            contract = {"type": "coordinate", "op": "translate", "x": x, "y": y, "dx": dx, "dy": dy}
            stem = f"El punto ({x}, {y}) se traslada por el vector ({dx}, {dy}). ¿Cuál es su imagen?"
        wrong = [f"({y}, {x})", f"({x-y}, {y-x})", f"({x+1}, {y+1})"]
        answer = solve_contract(contract)
        wrong = [value if normalize_semantic(value) != normalize_semantic(answer) else f"({x-1}, {y-1})" for value in wrong]
        return _make(stem, wrong, "En un par ordenado se escribe x antes que y; una traslación suma componente a componente.", ["Identifica x e y.", "Aplica el desplazamiento a cada coordenada.", f"Resultado: {answer}."], "El punto resultante conserva el desplazamiento descrito por el vector.", contract, tid)
    if kind == "geometry_parallel":
        angle = 25 + index * 5
        if track == "a":
            expr = angle
            stem = f"Dos rectas paralelas son cortadas por una transversal. Si un ángulo correspondiente mide {angle}°, ¿cuánto mide el otro?"
            wrong = [180-angle, 90-angle, angle+5]
            explanation = "Los ángulos correspondientes entre paralelas tienen igual medida."
        else:
            acute = 20 + index * 2
            expr = ["sub", 90, acute]
            stem = f"Dos rectas perpendiculares forman un ángulo recto. Si una semirrecta lo divide dejando {acute}°, ¿cuánto mide la parte restante?"
            wrong = [acute, 180-acute, 90+acute]
            explanation = "Las partes de un ángulo recto suman 90°."
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=wrong, style="integer", unit="°", template_id=tid, explanation=explanation)
    if kind == "congruence":
        x, y = 2+index, 3+(index*2)%13
        if track == "a":
            dx, dy = 1+index%5, 2+(index*3)%5
            contract = {"type":"coordinate","op":"translate","x":x,"y":y,"dx":dx,"dy":dy}
            stem = f"Una figura congruente se obtiene trasladando el vértice ({x}, {y}) por ({dx}, {dy}). ¿Cuál es la imagen del vértice?"
        else:
            contract = {"type":"coordinate","op":"reflect_y","x":x,"y":y}
            stem = f"Una reflexión respecto del eje y conserva la congruencia. ¿Cuál es la imagen de ({x}, {y})?"
        answer = solve_contract(contract)
        wrong = [f"({y}, {x})",f"({-x}, {-y})",f"({x+1}, {y-1})"]
        return _make(stem,wrong,"Aplica la transformación a las coordenadas y verifica que las distancias se conservan.",["Identifica la transformación.","Opera cada coordenada según la regla.",f"Imagen: {answer}."],"La transformación conserva forma y tamaño, por eso produce una figura congruente.",contract,tid)
    if kind == "tessellation":
        count = 3 + index
        angle = Fraction(360, count)
        if track == "a":
            expr = ["mul", count, str(angle)]
            stem = f"En un vértice de una teselación se reúnen {count} ángulos iguales de {fmt_fraction(angle)}°. ¿Qué suma angular completan?"
            wrong = [180, 360-angle, 360+angle]
        else:
            used = count-1
            expr = ["sub", 360, ["mul", used, str(angle)]]
            stem = f"Alrededor de un punto ya se ubicaron {used} ángulos de {fmt_fraction(angle)}°. ¿Qué ángulo falta para cerrar la teselación?"
            wrong = [angle, 180-angle, 360-angle]
        return _numeric_task(stem=stem,expr=expr,wrong_exprs=wrong,style="fraction",unit="°",template_id=tid,explanation="Los ángulos que rodean completamente un punto suman 360°.")
    if kind == "geometric_construction":
        if track == "a" and index % 2 == 0:
            angle = 40 + 4*index
            expr = ["div",angle,2]
            stem = f"Se construye la bisectriz de un ángulo de {angle}°. ¿Cuánto mide cada ángulo resultante?"
            wrong = [angle,90-angle,angle+2]
            explanation = "La bisectriz divide el ángulo en dos partes iguales."
            unit = "°"
        elif track == "a":
            length = 10 + 2*index
            expr = ["div",length,2]
            stem = f"Se construye la mediatriz de un segmento de {length} cm. ¿A qué distancia de cada extremo queda el punto medio?"
            wrong = [length,length-2,length+2]
            explanation = "La mediatriz pasa por el punto medio del segmento."
            unit = " cm"
        else:
            length = 12 + 2*index
            expr = ["div",length,2]
            stem = f"Una mediana llega al punto medio de un lado de {length} cm. ¿Cuánto mide cada parte de ese lado?"
            wrong = [length,length-1,length+2]
            explanation = "La mediana une un vértice con el punto medio del lado opuesto."
            unit = " cm"
        return _numeric_task(stem=stem,expr=expr,wrong_exprs=wrong,style="integer",unit=unit,template_id=tid,explanation=explanation)
    if kind in {"length", "length_conversion"}:
        metres = 2 + index + int(oa["n"]) % 5
        if track == "a":
            expr = ["mul", metres, 100]
            stem = f"Convierte {metres} m a centímetros."
            unit = " cm"
            wrong = [["mul", metres, 10], ["mul", metres, 1000], metres]
        else:
            centimetres = metres * 100 + 50
            expr = ["div", centimetres, 100]
            stem = f"Una longitud de {centimetres} cm se expresa en metros. ¿Cuál es su medida?"
            unit = " m"
            wrong = [["div", centimetres, 10], ["div", centimetres, 1000], centimetres]
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=wrong, style="decimal", unit=unit, template_id=tid, explanation="Usa 1 m=100 cm y decide si debes multiplicar o dividir.")
    if kind == "rectangle":
        length = 5 + index
        width = 3 + (index * 2) % 8
        if track == "a":
            expr = ["mul", length, width]
            stem = f"Un rectángulo mide {length} cm por {width} cm. ¿Cuál es su área?"
            unit = " cm²"
            wrong = [["mul", 2, ["add", length, width]], ["add", length, width], ["mul", length+1, width]]
        else:
            expr = ["mul", 2, ["add", length, width]]
            stem = f"En {context} se diseña un rectángulo de {length} cm por {width} cm. ¿Cuál es su perímetro?"
            unit = " cm"
            wrong = [["mul", length, width], ["add", length, width], ["mul", 2, length, width]]
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=wrong, style="integer", unit=unit, template_id=tid, explanation="Distingue el atributo pedido: área multiplica dimensiones; perímetro suma las longitudes del contorno.")
    if kind == "area":
        base = 6 + index
        height = 3 + (index * 2) % 9
        if track == "a":
            expr = ["div", ["mul", base, height], 2]
            stem = f"Un triángulo tiene base {base} cm y altura {height} cm. ¿Cuál es su área?"
            wrong = [["mul", base, height], ["add", base, height], ["div", ["add", base, height], 2]]
        else:
            top = 2 + index % 5
            expr = ["div", ["mul", ["add", base, top], height], 2]
            stem = f"Un trapecio tiene bases {base} cm y {top} cm, y altura {height} cm. ¿Cuál es su área?"
            wrong = [["mul", base, height], ["mul", ["add", base, top], height], ["div", ["mul", base, top], 2]]
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=wrong, style="fraction", unit=" cm²", template_id=tid, explanation="Selecciona la fórmula de la figura y usa la altura perpendicular.")
    if kind == "triangles":
        a = 35 + (index * 7) % 50
        b = 45 + (index * 5) % 50
        if a+b >= 170:
            b = 40
        expr = ["sub", 180, ["add", a, b]]
        stem = f"Un triángulo tiene ángulos de {a}° y {b}°. ¿Cuánto mide el tercero?" if track == "a" else f"En una construcción, dos ángulos interiores de un triángulo miden {a}° y {b}°. ¿Qué medida completa la figura?"
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=[["add", a, b], ["sub", 360, ["add", a, b]], ["sub", 180, a]], style="integer", unit="°", template_id=tid, explanation="La suma de los ángulos interiores de un triángulo es 180°.")
    if kind == "surface":
        if track == "a":
            side = 3 + index
            expr = ["mul", 6, ["pow", side, 2]]
            stem = f"¿Cuál es el área total de un cubo de arista {side} cm?"
            wrong = [["pow", side, 3], ["mul", 4, ["pow", side, 2]], ["mul", 6, side]]
        else:
            l, w, h = 4+index, 3+index%5, 2+(index*2)%4
            expr = ["mul", 2, ["add", ["mul", l, w], ["mul", l, h], ["mul", w, h]]]
            stem = f"Un paralelepípedo mide {l} cm×{w} cm×{h} cm. ¿Cuál es su superficie total?"
            wrong = [["mul", l, w, h], ["mul", 2, ["add", l, w, h]], ["add", ["mul", l, w], ["mul", l, h], ["mul", w, h]]]
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=wrong, style="integer", unit=" cm²", template_id=tid, explanation="Suma el área de todas las caras; las caras opuestas son iguales.")
    if kind == "volume":
        l, w, h = 3+index, 2+index%5, 2+(index*3)%4
        expr = ["mul", l, w, h]
        stem = f"Un paralelepípedo mide {l} cm×{w} cm×{h} cm. ¿Cuál es su volumen?" if track == "a" else f"En {context}, una caja rectangular mide {l} cm de largo, {w} cm de ancho y {h} cm de alto. ¿Qué volumen contiene?"
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=[["add", l, w, h], ["mul", 2, ["add", l, w, h]], ["mul", l, w]], style="integer", unit=" cm³", template_id=tid, explanation="Multiplica largo, ancho y altura; el volumen se expresa en unidades cúbicas.")
    if kind == "angle_measure":
        angle = 25 + index * 5
        if track == "a":
            contract = {"type": "angle_type", "angle": angle}
            stem = f"Se construirá un ángulo de {angle}°. ¿Qué tipo de ángulo es?"
            wrong = [name for name in ["Agudo", "Recto", "Obtuso", "Extendido", "Completo"] if name != solve_contract(contract)][:3]
            return _make(stem, wrong, "Clasifica comparando la medida con 90° y 180°.", [f"Medida: {angle}°.", "Compara con los ángulos de referencia.", f"Clasificación: {solve_contract(contract)}."], "La clasificación permite anticipar la abertura que debe construirse con el transportador.", contract, tid)
        # The 60-value cycle is coprime with the step, so every authored index
        # in the 0–48 range receives a distinct, valid acute angle.
        given = 20 + ((index * 7 + int(oa["n"]) * 3) % 60)
        expr = ["sub", 180, given]
        return _numeric_task(stem=f"Para construir un ángulo suplementario de {given}°, ¿qué medida debe tener el otro ángulo?", expr=expr, wrong_exprs=[["sub", 90, given], given, ["sub", 360, given]], style="integer", unit="°", template_id=tid, explanation="Los ángulos suplementarios suman 180°.")
    if kind in {"angle_relations", "angle_sum", "parallel_angles"}:
        angle = 25 + index * 3 + int(oa["n"])
        if kind == "angle_relations" and track == "a":
            total = 90
            expr = ["sub", total, angle]
            stem = f"Dos ángulos complementarios suman 90°. Si uno mide {angle}°, ¿cuánto mide el otro?"
            explanation = "Los ángulos complementarios suman 90°."
        elif kind == "angle_relations":
            expr = angle
            stem = f"Dos rectas se cruzan. Si un ángulo mide {angle}°, ¿cuánto mide su opuesto por el vértice?"
            explanation = "Los ángulos opuestos por el vértice tienen la misma medida."
            total = 180
        elif kind == "angle_sum" and track == "a":
            second = 40 + index
            if angle + second >= 170:
                second = 35
            expr = ["sub", 180, ["add", angle, second]]
            stem = f"Un triángulo tiene ángulos de {angle}° y {second}°. ¿Cuánto mide el tercero?"
            explanation = "Los ángulos interiores de un triángulo suman 180°."
            total = 180
        elif kind == "angle_sum":
            b, c = 70 + index, 80 - index % 10
            expr = ["sub", 360, ["add", angle, b, c]]
            stem = f"Un cuadrilátero tiene tres ángulos de {angle}°, {b}° y {c}°. ¿Cuánto mide el cuarto?"
            explanation = "Los ángulos interiores de un cuadrilátero suman 360°."
            total = 360
        elif track == "a":
            expr = angle
            stem = f"Dos paralelas son cortadas por una transversal. Un ángulo correspondiente mide {angle}°. ¿Cuánto mide el correspondiente?"
            explanation = "Los ángulos correspondientes entre paralelas son iguales."
            total = 180
        else:
            expr = ["sub", 180, angle]
            stem = f"Dos paralelas son cortadas por una transversal. Un ángulo interior mide {angle}°. ¿Cuánto mide el interior del mismo lado?"
            explanation = "Los ángulos interiores del mismo lado suman 180°."
            total = 180
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=[["add", total, angle], angle+5, ["sub", 360, angle]], style="integer", unit="°", template_id=tid, explanation=explanation)
    if kind == "polygon_angles":
        sides = 3 + index
        if track == "a":
            expr = ["mul", ["sub", sides, 2], 180]
            stem = f"¿Cuál es la suma de los ángulos interiores de un polígono de {sides} lados?"
            wrong = [["mul", sides, 180], ["mul", ["sub", sides, 1], 180], 360]
        else:
            expr = ["div", ["mul", ["sub", sides, 2], 180], sides]
            stem = f"Un polígono regular tiene {sides} lados. ¿Cuánto mide cada ángulo interior?"
            wrong = [["div", 360, sides], ["mul", ["sub", sides, 2], 180], ["div", 180, sides]]
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=wrong, style="fraction", unit="°", template_id=tid, explanation="Triangula el polígono: la suma interior es (n−2)·180°; en un polígono regular se divide por n.")
    if kind == "circle":
        radius = 3 + index
        if track == "a":
            expr = ["mul", 2, Fraction(314,100), radius]
            stem = f"Usa π≈3,14. ¿Cuál es la longitud de una circunferencia de radio {radius} cm?"
            unit = " cm"
            wrong = [["mul", Fraction(314,100), ["pow", radius,2]], ["mul", Fraction(314,100), radius], ["mul", 2, radius]]
        else:
            expr = ["mul", Fraction(314,100), ["pow", radius, 2]]
            stem = f"Usa π≈3,14. ¿Cuál es el área de un círculo de radio {radius} cm?"
            unit = " cm²"
            wrong = [["mul", 2, Fraction(314,100), radius], ["mul", Fraction(314,100), radius], ["pow", ["mul", Fraction(314,100), radius], 2]]
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=wrong, style="decimal", unit=unit, places=2, template_id=tid, explanation="Distingue C=2πr para longitud y A=πr² para superficie.")
    raise KeyError(kind)


def _data_task(cfg: dict[str, Any], oa: dict[str, Any], track: str, index: int, tid: str, context: str) -> Task:
    kind = oa["kind"]
    if kind in {"mean", "central_tendency"}:
        center = 8 + index + int(oa["n"]) % 5
        data = [center-3, center-1, center, center+1, center+3]
        rule = "mean" if track == "a" else ["median", "range", "mode"][index % 3]
        if rule == "mode":
            data[-1] = center
        contract = {"type": "statistic", "rule": rule, "data": data}
        names = {"mean":"promedio", "median":"mediana", "range":"rango", "mode":"moda"}
        answer = solve_contract(contract)
        wrong = [str(center-1), str(center+1), str(sum(data))]
        wrong = [value for value in wrong if normalize_semantic(value) != normalize_semantic(answer)]
        while len(wrong)<3:
            wrong.append(str(center+len(wrong)+4))
        return _make(f"Los datos son {', '.join(map(str,data))}. ¿Cuál es su {names[rule]}?", wrong[:3], f"Ordena los datos y aplica la definición de {names[rule]}.", ["Organiza los datos.", f"Aplica la regla de {names[rule]}.", f"Resultado: {answer}."], "La medida calculada resume una característica específica de la distribución.", contract, tid)
    if kind == "probability_words":
        total = 10 + index % 8
        favorable = [0, total, 2, total-2, total//2][index % 5]
        contract = {"type": "probability_label", "favorable": favorable, "total": total}
        answer = solve_contract(contract)
        wrong = [value for value in ["Seguro", "Muy posible", "Posible", "Poco posible", "Imposible"] if value != answer][:3]
        return _make(f"De {total} resultados equiprobables, {favorable} favorecen un evento. ¿Cómo se describe su posibilidad?", wrong, "Compara los resultados favorables con el total de resultados posibles.", [f"Favorables: {favorable}; total: {total}.", "Calcula o estima la proporción favorable.", f"Descripción: {answer}."], "La descripción cualitativa es coherente con la proporción de resultados favorables.", contract, tid)
    if kind == "probability_compare":
        total = 12 + index % 7
        fav_a = 2 + index % 4
        fav_b = fav_a + 2
        expr = ["sub", str(Fraction(fav_b,total)), str(Fraction(fav_a,total))]
        stem = f"Dos eventos tienen probabilidades {fav_a}/{total} y {fav_b}/{total}. ¿En cuánto supera la segunda a la primera?"
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=[["add", str(Fraction(fav_a,total)), str(Fraction(fav_b,total))], str(Fraction(fav_a,total)), str(Fraction(fav_b,total))], style="fraction", template_id=tid, explanation="Con el mismo total, compara o resta los resultados favorables.")
    if kind == "sampling":
        population = 400 + index*20
        sample = 40 + (index % 5)*10
        favorable = 10 + index % max(11, sample//2)
        if track == "a":
            contract = {"type": "sample_estimate", "population": population, "sample": sample, "favorable": favorable}
            answer = int(solve_contract(contract))
            wrong = [str(favorable), str(population-favorable), str(answer+sample)]
            stem = f"En una muestra aleatoria de {sample} personas, {favorable} cumplen una condición. ¿Cuántas se estiman en una población de {population}?"
            explanation = "Multiplica la proporción muestral por el tamaño de la población."
        else:
            labels = ["Muestra A", "Muestra B", "Muestra C"]
            best = index % 3
            population_label = ["cursos", "jornadas", "barrios", "edades", "talleres"][index % 5]
            sample_size = 30 + index * 3
            contract = {"type": "data_choice", "rule": "representative_sample", "labels": labels, "best_index": best, "population_label": population_label, "sample_size": sample_size}
            descriptions = ["seleccionada al azar en distintos horarios", "seleccionada solo entre voluntarios de un curso", "seleccionada solo en una actividad específica"]
            descriptions[best] = "seleccionada al azar en todos los grupos de la población"
            stem = f"Se estudiarán {population_label} con una muestra de {sample_size} casos. ¿Qué diseño es más representativo? " + "; ".join(f"{label}: {desc}" for label,desc in zip(labels,descriptions)) + "."
            wrong = [label for label in labels if label != solve_contract(contract)] + ["Todas por igual"]
            explanation = "Prefiere una selección aleatoria que cubra los grupos relevantes de la población."
        return _make(stem, wrong[:3], explanation, ["Identifica población y procedimiento de selección.", explanation, f"Respuesta: {solve_contract(contract)}."], "La representatividad depende del diseño de la muestra, no solo de su tamaño.", contract, tid)
    if kind in {"frequency", "experimental_probability", "theoretical_probability"}:
        offset = int(oa["n"]) + int(cfg["grade"][0]) * 3
        total = 20 + index + offset
        favorable = 4 + (index * 3 + offset) % (total-5)
        if kind == "theoretical_probability" and track == "b":
            theoretical = Fraction(1, 2)
            observed = Fraction(favorable, total)
            expr = ["abs", ["sub", str(observed), str(theoretical)]]
            stem = f"La probabilidad teórica es 1/2 y en {total} ensayos hubo {favorable} éxitos. ¿Cuál es la diferencia absoluta entre frecuencia relativa y probabilidad teórica?"
            wrong = [["add", str(observed), str(theoretical)], str(observed), str(theoretical)]
            style = "fraction"
        elif kind == "theoretical_probability":
            faces = 6 + index
            favorable_theoretical = 1 + index % max(2, faces//2)
            expr = ["div", favorable_theoretical, faces]
            stem = f"Un modelo tiene {faces} resultados equiprobables y {favorable_theoretical} favorecen el evento. ¿Cuál es su probabilidad teórica?"
            wrong = [["div", faces-favorable_theoretical, faces], ["div", favorable_theoretical, faces+1], ["div", faces, favorable_theoretical]]
            style = "fraction"
        elif kind == "experimental_probability" and track == "b":
            expr = ["div", favorable, total]
            stem = f"En {total} ensayos, un evento ocurrió {favorable} veces. ¿Qué porcentaje experimental representa?"
            wrong = [["div", total-favorable, total], ["div", favorable, total+1], ["div", total, favorable]]
            style = "percent"
        elif kind == "frequency" and track == "a":
            expr = favorable
            stem = f"Una tabla de frecuencias registra {total} datos y señala que una categoría aparece {favorable} veces. ¿Cuál es su frecuencia absoluta?"
            wrong = [total-favorable,total,favorable+1]
            style = "integer"
        else:
            expr = ["div", favorable, total]
            label = "frecuencia relativa" if kind == "frequency" else "probabilidad experimental"
            stem = f"En {total} observaciones, un resultado ocurrió {favorable} veces. ¿Cuál es su {label}?"
            wrong = [["div", total-favorable, total], ["div", favorable, total+1], ["div", total, favorable]]
            style = "fraction"
        return _numeric_task(stem=stem, expr=expr, wrong_exprs=wrong, style=style, template_id=tid, explanation="Relaciona la frecuencia favorable con el total y compara con la referencia cuando corresponda.")
    if kind == "chart":
        if track == "a":
            values = [8+index, 12+index, 9+index]
            expr = ["sub", max(values), min(values)]
            stem = f"Un gráfico registra {values[0]}, {values[1]} y {values[2]} unidades. ¿Cuál es la diferencia entre el mayor y el menor valor?"
            return _numeric_task(stem=stem, expr=expr, wrong_exprs=[["add", max(values), min(values)], max(values), min(values)], style="integer", template_id=tid, explanation="Lee la escala, identifica máximo y mínimo y calcula la diferencia.")
        purpose = ["trend", "parts", "compare"][index % 3]
        periods = 4 + index + int(oa["n"]) + int(cfg["grade"][0])
        contract = {"type": "data_choice", "rule": "chart_type", "purpose": purpose, "periods_or_categories": periods}
        descriptions = {"trend":"mostrar cambios a lo largo del tiempo", "parts":"mostrar cómo se reparte un total", "compare":"comparar categorías"}
        wrong = [value for value in ["Gráfico de líneas", "Gráfico circular", "Gráfico de barras", "Diagrama de dispersión"] if value != solve_contract(contract)][:3]
        return _make(f"Se registrarán {periods} periodos o categorías. ¿Qué representación es más adecuada para {descriptions[purpose]}?", wrong, "Relaciona el propósito de comunicación con la estructura del gráfico.", [f"Propósito: {descriptions[purpose]}.", "Compara lo que muestra cada tipo de gráfico.", f"Elección: {solve_contract(contract)}."], "La elección del gráfico debe facilitar la comparación o tendencia que se desea comunicar.", contract, tid)
    if kind == "distribution":
        group_a = [5+index, 7+index, 9+index, 11+index]
        group_b = [6+index, 6+index, 10+index, 14+index]
        rule = "larger_mean" if track == "a" else "larger_range"
        contract = {"type": "data_choice", "rule": rule, "groups": [group_a, group_b], "labels": ["Grupo A", "Grupo B"]}
        answer = solve_contract(contract)
        wrong = [value for value in ["Grupo A", "Grupo B", "Tienen el mismo valor", "No se puede decidir"] if value != answer][:3]
        measure = "promedio" if rule == "larger_mean" else "rango"
        return _make(f"Grupo A: {group_a}; Grupo B: {group_b}. ¿Qué grupo tiene mayor {measure}?", wrong, f"Calcula el {measure} de cada distribución y compara.", ["Organiza ambos grupos.", f"Calcula el {measure} de cada uno.", f"Conclusión: {answer}."], "La comparación se fundamenta en una medida calculada sobre ambas distribuciones.", contract, tid)
    if kind == "stem_leaf":
        stem = 2 + index % 7
        leaf = (index * 3 + int(oa["n"])) % 10
        contract = {"type": "stem_leaf", "stem": stem, "leaf": leaf}
        if track == "a":
            prompt = f"En un diagrama de tallo y hojas, aparece {stem} | {leaf}. ¿Qué dato representa?"
        else:
            prompt = f"Una muestra contiene el dato {stem*10+leaf}. Si las decenas son tallos, ¿qué valor representa la entrada {stem} | {leaf}?"
        answer = int(solve_contract(contract))
        wrong = [str(stem+leaf), str(leaf*10+stem), str(stem*100+leaf)]
        return _make(prompt, wrong, "El tallo contiene las decenas y la hoja las unidades.", [f"Tallo: {stem} decenas.", f"Hoja: {leaf} unidades.", f"Dato: {answer}."], "Cada hoja conserva un dato de la muestra y permite reconstruir la distribución.", contract, tid)
    raise KeyError(kind)


def make_task(cfg: dict[str, Any], oa_item: dict[str, Any], track: str, index: int) -> Task:
    """Public task factory with an explicit, substantive curriculum focus."""
    task = _make_task_core(cfg, oa_item, track, index)
    if track == "a":
        focus = f"Comprueba la elección con una representación de {oa_item['title'].lower()} propia de {cfg['grade_label']}."
    else:
        focus = f"Interpreta la elección como una aplicación de {oa_item['title'].lower()} en {cfg['grade_label']}."
    validation = {key: value for key, value in task.validation.items() if key != "signature"}
    validation["curriculum_focus"] = {"course_id": cfg["course_id"], "oa_number": int(oa_item["n"]), "track": track}
    validation["signature"] = contract_signature(validation)
    return Task(
        stem=f"{task.stem} {focus}",
        answer=task.answer,
        distractors=task.distractors,
        solution=task.solution,
        steps=task.steps,
        interpretation=task.interpretation,
        validation=validation,
        template_id=task.template_id,
    )
from collections import Counter, defaultdict
from pathlib import Path

# ---- Package audit ---------------------------------------------------------
PACKAGE_ROOT=Path(__file__).resolve().parents[1]

def load(name):
    return json.loads((PACKAGE_ROOT/name).read_text(encoding="utf-8"))

def gate(ok,msg):
    if not ok:
        raise AssertionError(msg)

master=load("content_specs/curriculum_master_5b_v290.json")
coverage=load("content_specs/curriculum_coverage_5b_v290.json")
deep=load("content_specs/deep_content_5b_v290.json")
keys=load("content_specs/guided_answer_keys_5b_v290.json")
items=load("content_specs/assessment_items_5b_v291.json")
review_sets=load("content_specs/review_sets_5b_v291.json")
metadata=load("content_specs/adaptive_metadata_5b_v292.json")
diagnostic=load("content_specs/diagnostic_blueprint_5b_v293.json")
routes=load("content_specs/learning_routes_5b_v294.json")
cert=load("content_specs/assessment_certification_5b_v294.json")
snapshot=load("content_specs/curriculum_source_snapshot_5b_v294.json")
manifest=load("MANIFEST_V290_V294.json")

# Manifest and package bytes.
gate(manifest["release"]=="REVIEWED_RC2","manifest release")
gate(len(manifest["files"])==21,"manifest must list 21 non-manifest artifacts")
listed={record["path"] for record in manifest["files"]}
actual={path.relative_to(PACKAGE_ROOT).as_posix() for path in PACKAGE_ROOT.rglob("*") if path.is_file() and not path.name.startswith("MANIFEST_")}
gate(listed==actual,"manifest file set")
for record in manifest["files"]:
    payload=(PACKAGE_ROOT/record["path"]).read_bytes()
    gate(len(payload)==record["bytes"],f"manifest bytes {record['path']}")
    gate(hashlib.sha256(payload).hexdigest()==record["sha256"],f"manifest sha256 {record['path']}")

# Curriculum provenance and two genuinely different tracks per OA.
gate(master["course_id"]=="cl-5-basico","course_id")
gate(len(master["oas"])==27,"OA count")
for oa in master["oas"]:
    gate(len(oa["official_text"])>=45,"official statement too short")
    gate(hashlib.sha256(oa["official_text"].encode("utf-8")).hexdigest()==oa["official_text_sha256"],"OA text fingerprint")
gate(snapshot["official_text_status"]=="normalized_official_statement","official text status")
gate(len(snapshot["source_fingerprints"])==27,"source fingerprints")
gate(snapshot["requires_revalidation_before_release"] is True,"curriculum release revalidation")

topics_by_oa=defaultdict(list)
for topic in deep["topics"]:
    topics_by_oa[topic["curriculum_alignment"]["oa_code"]].append(topic)
gate(len(deep["topics"])==54,"topic count")
gate(all(len(value)==2 for value in topics_by_oa.values()),"two topics per OA")
for oa_code,pair in topics_by_oa.items():
    gate({topic["track"] for topic in pair}=={"a","b"},f"tracks {oa_code}")
    gate(pair[0]["title"]!=pair[1]["title"],f"distinct titles {oa_code}")
    gate(set(pair[0]["focus_tags"]).isdisjoint(set(pair[1]["focus_tags"])),f"distinct focus tags {oa_code}")

gate(len(master["nodes"])==216 and len(coverage)==216,"node/coverage count")
gate(all(row["auto_state"]=="partial" and row["auto_score"]==85 and row["human_review_status"]=="pending" for row in coverage),"honest coverage state")
gate(not any(row["representation_hit"] or row["lab_hit"] for row in coverage),"unimplemented visual evidence must not count")

# Exact worked and guided answers.
gate(len(keys)==432,"guided contracts")
key_by_id={row["item_id"]:row for row in keys}
worked_signatures=[]
guided_signatures=[]
for topic in deep["topics"]:
    gate(len(topic["micro_lessons"])==6,"micro lessons")
    gate(len(topic["worked_examples"])==6,"worked examples")
    gate(len(topic["guided_practice"])==8,"guided practice")
    gate(len(topic["representations"])==3,"representation specs")
    gate(len(topic["interactive_specs"])==1,"lab spec")
    for example in topic["worked_examples"]:
        contract={k:v for k,v in example["validation_contract"].items() if k!="signature"}
        gate(contract_signature(contract)==example["validation_contract"]["signature"],"worked signature")
        gate(solve_contract(example["validation_contract"])==example["answer"],"worked exact answer")
        gate(len(example["steps"])>=3 and example["presentation"]["interpretation"],"worked concrete solution")
        gate("Respuesta razonada: aplicar" not in example["answer"],"generic worked answer")
        worked_signatures.append(example["validation_contract"]["signature"])
    for guided in topic["guided_practice"]:
        key=key_by_id[guided["item_id"]]
        gate(key["validation_type"]=="exact_numeric_or_symbolic","guided validation type")
        gate(key["expected_keywords"]==[],"keyword-only validation forbidden")
        gate(solve_contract(guided["validation_contract"])==guided["answer"]==key["expected_text"],"guided exact answer")
        guided_signatures.append(guided["validation_contract"]["signature"])
    rep_payloads=[]
    for rep in topic["representations"]:
        gate(rep["render_status"]=="specification_ready","representation must not claim rendered")
        gate(rep["accessibility"]["data_table_fallback"] and rep["accessibility"]["color_not_only_signal"],"representation accessibility")
        rep_payloads.append(json.dumps(rep["payload"],ensure_ascii=False,sort_keys=True))
    gate(len(set(rep_payloads))==3,"representation payload diversity")
    lab=topic["interactive_specs"][0]
    gate(lab["implementation_status"]=="specification_ready","lab must not claim implementation")
    labels={control["label"].lower() for control in lab["controls"]}
    gate("parámetro a" not in labels and "parámetro b" not in labels,"generic lab controls")
gate(len(set(worked_signatures))==len(worked_signatures),"duplicate worked contracts")
gate(len(set(guided_signatures))==len(guided_signatures),"duplicate guided contracts")

# Assessment: independent key recomputation, semantic options and diversity.
gate(len(items)==1404,"assessment count")
by_kind=Counter(row["kind"] for row in items)
gate(by_kind=={"practice":1080,"diagnostic":162,"review":162},"assessment mix")
stems=[];signatures=[];signatures_by_oa_track=defaultdict(set)
for row in items:
    contract={k:v for k,v in row["validation_contract"].items() if k!="signature"}
    gate(contract_signature(contract)==row["task_signature"]==row["validation_contract"]["signature"],f"task signature {row['item_id']}")
    expected=solve_contract(row["validation_contract"])
    selected=next(option["text"] for option in row["options"] if option["key"]==row["correct_option"])
    gate(selected==expected,f"independent key {row['item_id']}")
    gate(len(row["options"])==4 and len({normalize_semantic(option["text"]) for option in row["options"]})==4,f"semantic options {row['item_id']}")
    gate("alternativa no válida" not in json.dumps(row,ensure_ascii=False).lower(),f"placeholder {row['item_id']}")
    wrong={option["text"] for option in row["options"] if option["key"]!=row["correct_option"]}
    gate(len(row["distractor_rationales"])==3 and {d["option_text"] for d in row["distractor_rationales"]}==wrong,f"distractor rationale {row['item_id']}")
    gate(all(d["misconception_code"] and d["rationale"] for d in row["distractor_rationales"]),"misconception rationale")
    stem=re.sub(r"\s+"," ",row["stem"].strip().lower())
    stems.append(stem);signatures.append(row["task_signature"])
    oa_track=(row["oa_code"],row["topic_id"][-1])
    signatures_by_oa_track[oa_track].add(row["task_signature"])
gate(len(set(stems))==len(stems),"duplicate semantic stems")
gate(len(set(signatures))==len(signatures),"duplicate task contracts")
for oa_code in topics_by_oa:
    gate(signatures_by_oa_track[(oa_code,"a")].isdisjoint(signatures_by_oa_track[(oa_code,"b")]),f"A/B bank duplication {oa_code}")
answers=Counter(row["correct_option"] for row in items)
gate(answers=={"A":351,"B":351,"C":351,"D":351},"answer balance")

# Metadata, diagnostic duration and publication safety.
gate(len(metadata)==len(items) and {m["item_id"] for m in metadata}=={i["item_id"] for i in items},"metadata parity")
gate(all(m["calibration_status"]=="heuristic_candidate" and m["status"]=="staging" for m in metadata),"metadata staging")
gate(len(diagnostic["candidate_item_ids"])==162,"diagnostic candidates")
gate(diagnostic["min_items"]==27 and diagnostic["target_items"]==27 and diagnostic["default_limit"]==27,"diagnostic OA target/default")
gate(diagnostic["estimated_target_seconds"]<=2700 and diagnostic["stopping_rules"]["max_minutes"]==45,"diagnostic 45 minute gate")
gate(diagnostic["selection_contract"]["stratify_by"]=="oa_code","diagnostic stratification")
gate(len(review_sets)==4 and len(routes)==54 and len(cert)==54,"routes/review/certification")
gate(all(not row["is_published"] and row["status"]=="staging" for row in items),"assessment staging")
gate(all(not row["certified"] for row in cert),"human certification pending")

# SQL safety and lifecycle scripts.
preflight=(PACKAGE_ROOT/"supabase/141a_preflight_mathlabs_v290_v294_5b_rc2.sql").read_text(encoding="utf-8")
installer=(PACKAGE_ROOT/"supabase/141_mathlabs_v290_v294_5b_macroblock_full_install.sql").read_text(encoding="utf-8")
rollback=(PACKAGE_ROOT/"supabase/141b_rollback_mathlabs_v290_v294_5b_rc2.sql").read_text(encoding="utf-8")
verify=(PACKAGE_ROOT/"supabase/142_verify_mathlabs_v290_v294_5b_macroblock.sql").read_text(encoding="utf-8")
preflight_code=re.sub(r"--.*","",preflight).lower()
gate(not re.search(r"(insert|update|delete|create|alter|drop|truncate)",preflight_code),"preflight must be read-only")
installer_code=re.sub(r"--.*","",installer).lower()
gate(installer.rstrip().lower().endswith("commit;") and "begin;" in installer_code,"installer transaction")
gate(not re.search(r"(delete|truncate|alter\s+table|drop\s+table)",installer_code),"destructive installer SQL")
gate("live_student_delivery=false" in installer.replace(" ","") and "release_candidate=false" in installer.replace(" ",""),"installer release safety")
gate("default null" in installer and "coalesce(p_limit,target_allowed)" in installer.replace(" ",""),"diagnostic default derives from blueprint")
gate("TARGETED ROLLBACK" in rollback and "begin;" in rollback.lower() and rollback.rstrip().lower().endswith("commit;"),"targeted rollback")
gate("estado distinto del staging exacto esperado" in rollback and "transaction will roll back" in rollback,"rollback hard guards")
gate("Baseline 1M-4M/V24 alterado" in verify and "RC2 diagnostic blueprint failed" in verify,"hard verification gates")

# TypeScript artifacts are real route/type files; RC1's no-op nav patch is gone.
page=(PACKAGE_ROOT/"src/app/admin/expansion-5b-v294/page.tsx").read_text(encoding="utf-8")
types=(PACKAGE_ROOT/"src/types/expansion-5b-v294.ts").read_text(encoding="utf-8")
gate("REVIEWED RC2" in page and "get_v294_5b_expansion_overview" in page,"admin page")
gate("export type V294Overview" in types,"types")

print("MathLabs v29.0–v29.4 · 5B REVIEWED RC2 gate OK")
print("27 OA · 54 topics distintos · 216 nodos partial/pending human review")
print("1404 ítems · 1404 stems únicos · 1404 contratos únicos · claves recalculadas")
print("A/B/C/D = 351/351/351/351 · 0 placeholders · 0 opciones equivalentes")
print("Worked exactos 324 · Guided exactos 432 · specs visuales 162 · specs labs 54")
print("Diagnóstico objetivo 27 OA · {:.2f} min / 45 min".format(diagnostic["estimated_target_minutes"]))
print("Q4 DB provisional 78 · 0 auto gate · 0 release candidates · live delivery OFF")
