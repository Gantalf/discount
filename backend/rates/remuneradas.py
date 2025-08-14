from __future__ import annotations

import os
import asyncio
from datetime import datetime
from typing import Dict, Tuple, Any
from zoneinfo import ZoneInfo

import httpx

WALLET_MAP: Dict[str, Dict[str, str]] = {
    "mercado_pago": {
        "tipo": "fci_money_market",
        "fondo": "Mercado Fondo - Clase A",
        "limite": "Sin límite informado",
    },
    "cocos": {
        "tipo": "fci_money_market",
        "fondo": "Cocos Ahorro",
        "limite": "Sin límite informado",
    },
    "fiwind": {
        "tipo": "rendimientos_entidad",
        "entidad": "fiwind",
        "limite": "Sin límite informado",
    },
}

ARGDAT_TIMEOUT = float(os.getenv("ARGDAT_TIMEOUT", "6"))


async def fetch_fci_latest_and_prev(session: httpx.AsyncClient) -> Tuple[Any, Any]:
    """Fetch latest and previous fixed-income FCI data."""
    ultimo_url = "https://api.argentinadatos.com/v1/finanzas/fci/rentaFija/ultimo"
    penultimo_url = "https://api.argentinadatos.com/v1/finanzas/fci/rentaFija/penultimo"
    ultimo_resp = await session.get(ultimo_url)
    penultimo_resp = await session.get(penultimo_url)
    ultimo_resp.raise_for_status()
    penultimo_resp.raise_for_status()
    return ultimo_resp.json(), penultimo_resp.json()


def calc_tna_tea(vcp_u: float, vcp_p: float) -> Tuple[float, float]:
    r_diario = (vcp_u - vcp_p) / vcp_p
    tna = r_diario * 365
    tea = (1 + r_diario) ** 365 - 1
    return tna, tea


def _find_fondo(data: Any, fondo_name: str) -> Dict[str, Any] | None:
    items = data if isinstance(data, list) else data.get("data", [])
    for item in items:
        nombre = str(item.get("fondo", "")).lower()
        if fondo_name.lower() in nombre:
            return item
    return None


def resolve_fci_rate(ultimo: Any, penultimo: Any, fondo_name: str) -> Dict[str, Any]:
    u_item = _find_fondo(ultimo, fondo_name)
    p_item = _find_fondo(penultimo, fondo_name)
    if not u_item or not p_item:
        raise ValueError(f"Fondo '{fondo_name}' no encontrado")
    vcp_u = float(u_item.get("vcp"))
    vcp_p = float(p_item.get("vcp"))
    tna, tea = calc_tna_tea(vcp_u, vcp_p)
    fecha = u_item.get("fechaDato") or u_item.get("fecha")
    if fecha:
        fecha = str(fecha)[:10]
    else:
        fecha = datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")).date().isoformat()
    return {"tna": tna, "tea": tea, "fechaDato": fecha}


async def fetch_rendimiento_entidad(session: httpx.AsyncClient, entidad: str) -> Dict[str, Any]:
    url = f"https://api.argentinadatos.com/v1/finanzas/rendimientos/{entidad}"
    resp = await session.get(url)
    resp.raise_for_status()
    data = resp.json()
    tna = data.get("tna")
    if tna is None:
        tna = data.get("apy")
    if tna is None:
        raise ValueError("No se encontró TNA/APY")
    tna = float(tna)
    if tna > 1:
        tna /= 100
    fecha = data.get("fechaDato") or data.get("fecha")
    if not fecha:
        fecha = datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")).date().isoformat()
    else:
        fecha = str(fecha)[:10]
    return {"tna": tna, "fechaDato": fecha}


def build_payload(resultados: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    payload: Dict[str, Dict[str, Any]] = {}
    for wallet, meta in WALLET_MAP.items():
        data = resultados.get(wallet)
        if not data:
            continue
        item = dict(data)
        item["limite"] = meta["limite"]
        item["verMas"] = "https://comparatas.ar"
        if meta["tipo"] == "rendimientos_entidad":
            item["fuente"] = "rendimientos"
        payload[wallet] = item
    return payload
