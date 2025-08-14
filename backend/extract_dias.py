#!/usr/bin/env python3
# -*- coding: utf-8 -*-

#EJEMPLO DE USO: python3 extract_dias.py promociones_carrefour_2.json --out promociones_carrefour_2_con_dias.json --pretty
#Para cordiez no anda, hacerlo a mano

import json, argparse, unicodedata, re, sys
from typing import List, Dict, Any, Optional

DAYS = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"]
DAY_INDEX = {d:i for i,d in enumerate(DAYS)}

# Regex con límites de palabra sobre texto normalizado (sin acentos)
# Acepta nombre completo o abreviatura con punto (lun., mar., mie., jue., vie., sab., dom.)
DAY_TOKEN = r"(?:lunes|martes|miercoles|jueves|viernes|sabados?|domingos?|lun\.|mar\.|mie\.|jue\.|vie\.|sab\.|dom\.)"

# Rango tipo "de lunes a viernes" / "lunes a sábado"
RANGE_RE = re.compile(
    rf"(?:\bde\s+)?\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b\s*(?:a|al)\s*\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b"
)

# Enumeraciones sueltas de días
TOKENS_RE = re.compile(rf"(?<![a-z]){DAY_TOKEN}(?![a-z])")

# "todos los dias" -> los 7 días
ALL_DAYS_RE = re.compile(r"\btodos?\s+los\s+dias\b")

def strip_accents(s: str) -> str:
    if not s:
        return ""
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    return s

def norm(s: str) -> str:
    return strip_accents(s or "").lower()

def expand_range(a: str, b: str) -> List[str]:
    """Incluye ambos extremos en el orden calendario."""
    ia, ib = DAY_INDEX[a], DAY_INDEX[b]
    if ia <= ib:
        return DAYS[ia:ib+1]
    # si el rango 'gira' (ej: de viernes a martes), avanzamos circularmente
    return DAYS[ia:] + DAYS[:ib+1]

def tokens_to_day(word: str) -> Optional[str]:
    """Mapea token a día base."""
    w = word.rstrip(".")  # quita '.' en abreviaturas
    if w in ("sabados",): w = "sabado"
    if w in ("domingos",): w = "domingo"
    # Solo nombres completos o abreviaturas válidas
    mapping = {
        "lun":"lunes","lunes":"lunes",
        "mar":"martes","martes":"martes",
        "mie":"miercoles","miercoles":"miercoles",
        "jue":"jueves","jueves":"jueves",
        "vie":"viernes","viernes":"viernes",
        "sab":"sabado","sabado":"sabado",
        "dom":"domingo","domingo":"domingo",
    }
    return mapping.get(w)

def extract_days_from_text(text: str) -> List[str]:
    t = norm(text)
    if not t:
        return []
    # 1) todos los dias
    if ALL_DAYS_RE.search(t):
        return DAYS[:]

    found: List[str] = []

    # 2) rangos
    for m in RANGE_RE.finditer(t):
        a, b = m.group(1), m.group(2)
        found.extend(expand_range(a, b))

    # 3) tokens sueltos
    for m in TOKENS_RE.finditer(t):
        raw = m.group(0)
        # Normalizamos token (p.ej. 'mie.' -> 'mie')
        tok = raw.rstrip(".")
        # Evitamos 'mar' sin punto (marzo) y 'dom' sin punto (domicilio)
        # -> El patrón ya exige . para abreviaturas, y límites de palabra.
        day = tokens_to_day(tok)
        if day:
            found.append(day)

    # Devolver únicos en orden de aparición
    seen = set()
    ordered = []
    for d in found:
        if d not in seen:
            seen.add(d)
            ordered.append(d)
    return ordered

def extract_dias_for_promo(p: Dict[str, Any]) -> List[str]:
    # Prioridad: detalles -> descuento -> tope -> legales
    for key in ("detalles", "descuento", "tope"):
        days = extract_days_from_text(p.get(key, ""))
        if days:
            return days
    # recién si no hubo nada arriba, miramos legales
    return extract_days_from_text(p.get("legales",""))

def process(data: Dict[str, Any]) -> Dict[str, Any]:
    array_key = None
    for k in ("discounts", "promotions"):
        if isinstance(data.get(k), list):
            array_key = k
            break
    if not array_key:
        raise ValueError("No encuentro un array 'discounts' o 'promotions' en el JSON raíz.")

    out_list = []
    for promo in data[array_key]:
        dias = extract_dias_for_promo(promo)
        # Escribimos 'dias' sólo si encontramos algo
        if dias:
            promo["dias"] = dias
        out_list.append(promo)
    data[array_key] = out_list
    return data

def main():
    ap = argparse.ArgumentParser(description="Extrae y normaliza días de promociones.")
    ap.add_argument("input", nargs="?", help="Archivo JSON de entrada (o STDIN si se omite).")
    ap.add_argument("--out", help="Archivo JSON de salida (o STDOUT si se omite).")
    ap.add_argument("--pretty", action="store_true", help="Salida con indentación linda.")
    args = ap.parse_args()

    # Leer
    if args.input:
        with open(args.input, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = json.load(sys.stdin)

    # Procesar
    data = process(data)

    # Escribir
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2 if args.pretty else None)
    else:
        json.dump(data, sys.stdout, ensure_ascii=False, indent=2 if args.pretty else None)

if __name__ == "__main__":
    main()
