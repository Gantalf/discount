import os
import json
import logging
import asyncio
from datetime import datetime
from zoneinfo import ZoneInfo

import httpx
from apscheduler.schedulers.background import BackgroundScheduler

from backend.rates.remuneradas import (
    WALLET_MAP,
    fetch_fci_latest_and_prev,
    resolve_fci_rate,
    fetch_rendimiento_entidad,
    build_payload,
)

logger = logging.getLogger(__name__)
ARGDAT_TIMEOUT = float(os.getenv("ARGDAT_TIMEOUT", "6"))

scheduler = BackgroundScheduler(timezone="America/Argentina/Buenos_Aires")


async def refresh_remuneradas(redis) -> dict:
    """Fetch remunerated rates and cache them in Redis."""
    resultados = {}
    failed = False
    async with httpx.AsyncClient(timeout=ARGDAT_TIMEOUT) as session:
        try:
            ultimo, penultimo = await fetch_fci_latest_and_prev(session)
        except Exception as e:  # pragma: no cover
            logger.warning("Fallo al obtener datos de FCI: %s", e)
            failed = True
        if not failed:
            for wallet in ("mercado_pago", "cocos"):
                try:
                    fondo = WALLET_MAP[wallet]["fondo"]
                    resultados[wallet] = resolve_fci_rate(ultimo, penultimo, fondo)
                except Exception as e:
                    logger.warning("Fallo al resolver tasa para %s: %s", wallet, e)
                    failed = True
        try:
            resultados["fiwind"] = await fetch_rendimiento_entidad(session, "fiwind")
        except Exception as e:
            logger.warning("Fallo al obtener rendimiento de fiwind: %s", e)
            failed = True
    if failed:
        cached = await redis.get("rates:remuneradas")
        if cached:
            logger.warning("Manteniendo cache anterior de remuneradas")
            return json.loads(cached)
        raise RuntimeError("No se pudieron obtener tasas remuneradas")

    payload = build_payload(resultados)
    payload["updatedAt"] = datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")).isoformat()
    await redis.set("rates:remuneradas", json.dumps(payload), ex=36 * 3600)
    logger.info("Remuneradas actualizadas para: %s", ", ".join(resultados.keys()))
    return payload


async def get_cached_or_refresh(redis) -> dict:
    cached = await redis.get("rates:remuneradas")
    if cached:
        return json.loads(cached)
    return await refresh_remuneradas(redis)


def schedule_daily_job(redis) -> None:
    """Start scheduler to refresh rates daily."""
    def job():
        asyncio.run(refresh_remuneradas(redis))

    scheduler.add_job(job, "cron", hour=13, minute=5)
    scheduler.start()
    logger.info("Scheduler iniciado para refrescar tasas remuneradas")
