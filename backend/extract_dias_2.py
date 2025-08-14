#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys, json, re, unicodedata
from datetime import date
from argparse import ArgumentParser
from typing import List, Dict, Any

DAYS = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"]
DAY_INDEX = {d:i for i,d in enumerate(DAYS)}

# --- helpers de normalización y fechas ---------------------------------------
def normalize(s: str) -> str:
    if not s: return ""
    s = s.lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    return s

def weekday_from_ddmmyyyy(dd: int, mm: int, yyyy: int) -> str:
    # Monday=0 ... Sunday=6 -> mapea a DAYS
    try:
        idx = date(yyyy, mm, dd).weekday()
        return DAYS[idx]
    except Exception:
        return None

def expand_range(a: str, b: str) -> List[str]:
    if a not in DAY_INDEX or b not in DAY_INDEX:
        return []
    start, end = DAY_INDEX[a], DAY_INDEX[b]
    if start <= end:
        return DAYS[start:end+1]
    # rango que “da la vuelta” (ej. viernes a lunes)
    return DAYS[start:] + DAYS[:end+1]

# --- regex sobre TEXTO NORMALIZADO (sin tildes) -------------------------------
ALL_DAYS_RE = re.compile(r"\btodos\s+los\s+dias\b", re.IGNORECASE)
RANGE_RE    = re.compile(r"de\s+(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s+a\s+(lunes|martes|miercoles|jueves|viernes|sabado|domingo)", re.IGNORECASE)
DAY_RE      = re.compile(r"\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo)s?\b", re.IGNORECASE)
DATE_RE     = re.compile(r"\b(\d{1,2})/(\d{1,2})/(\d{4})\b")
VALID_WIN_RE= re.compile(r"valido\s+desde\s+\d{1,2}/\d{1,2}/\d{4}\s+(?:hasta|al)\s+\d{1,2}/\d{1,2}/\d{4}", re.IGNORECASE)

def extract_dias(text: str) -> List[str]:
    raw = text or ""
    t = normalize(raw)

    # 1) "todos los días"
    if ALL_DAYS_RE.search(t):
        return DAYS.copy()

    found = set()

    # 2) rangos "de ... a ..."
    m = RANGE_RE.search(t)
    if m:
        a, b = normalize(m.group(1)), normalize(m.group(2))
        for d in expand_range(a, b):
            found.add(d)

    # 3) menciones sueltas
    for m in DAY_RE.finditer(t):
        found.add(normalize(m.group(1)))

    # 4) fechas explícitas dd/mm/yyyy -> día de semana
    for m in DATE_RE.finditer(raw):  # usa raw por si el texto tenía ceros a la izquierda
        dd, mm, yyyy = map(int, m.groups())
        dname = weekday_from_ddmmyyyy(dd, mm, yyyy)
        if dname:
            found.add(dname)

    # 5) ventana "válido desde ... hasta ..." sin días -> asumir todos
    if not found and VALID_WIN_RE.search(t):
        return DAYS.copy()

    return sorted(found, key=lambda d: DAY_INDEX[d]) if found else []

def add_dias_to_promo(promo: Dict[str, Any]) -> Dict[str, Any]:
    blob = f"{promo.get('detalles','')} {promo.get('legales','')}"
    dias = extract_dias(blob)
    out = dict(promo)
    out["dias"] = dias
    return out

def transform(data: Any) -> Any:
    if isinstance(data, list):
        return [add_dias_to_promo(p) for p in data]
    if isinstance(data, dict):
        if isinstance(data.get("discounts"), list):
            out = dict(data)
            out["discounts"] = [add_dias_to_promo(p) for p in data["discounts"]]
            return out
        if isinstance(data.get("promotions"), list):
            out = dict(data)
            out["promotions"] = [add_dias_to_promo(p) for p in data["promotions"]]
            return out
    raise SystemExit("No encuentro un array de promociones (discounts/promotions) en el JSON de entrada.")

def read_json(path: str) -> Any:
    if path and path != "-":
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    # stdin
    if sys.stdin.isatty():
        raise SystemExit("No se proporcionó archivo ni datos por stdin. Usá -h para ayuda.")
    return json.load(sys.stdin)

def write_output(obj: Any, out_path: str = None, pretty: bool = False) -> None:
    s = json.dumps(obj, ensure_ascii=False, indent=2 if pretty else None)
    if out_path:
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(s)
            f.write("\n")
    else:
        sys.stdout.write(s + "\n")

def main(argv=None):
    parser = ArgumentParser(
        description="Agrega el campo 'dias' a promociones detectándolo en 'detalles'/'legales'."
    )
    parser.add_argument("input", nargs="?", default="-", help="Archivo JSON de entrada o '-' para stdin (default).")
    parser.add_argument("--out", help="Archivo de salida (si se omite, imprime por stdout).")
    parser.add_argument("--pretty", action="store_true", help="Formatea con indentación.")
    args = parser.parse_args(argv)

    data = read_json(args.input)
    enriched = transform(data)
    write_output(enriched, args.out, args.pretty)

if __name__ == "__main__":
    main()
