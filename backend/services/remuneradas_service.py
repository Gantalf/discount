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
    failed_wallets = []
    
    logger.info("Iniciando actualización de tasas remuneradas...")
    
    async with httpx.AsyncClient(timeout=ARGDAT_TIMEOUT) as session:
        # Try to fetch FCI data
        try:
            logger.info("Obteniendo datos de FCI...")
            ultimo, penultimo = await fetch_fci_latest_and_prev(session)
            logger.info("Datos FCI obtenidos exitosamente")
        except Exception as e:
            logger.error("Fallo al obtener datos de FCI: %s", e)
            ultimo, penultimo = None, None
        
        # Process each wallet
        for wallet in ("mercado_pago", "cocos", "ualintec"):
            try:
                if ultimo is not None:
                    fondo = WALLET_MAP[wallet]["fondo"]
                    resultados[wallet] = resolve_fci_rate(ultimo, penultimo, fondo)
                    logger.info("Tasa resuelta para %s: %s", wallet, resultados[wallet])
                else:
                    logger.warning("No se pueden procesar %s - datos FCI no disponibles", wallet)
                    failed_wallets.append(wallet)
            except Exception as e:
                logger.error("Fallo al resolver tasa para %s: %s", wallet, e)
                failed_wallets.append(wallet)
    
    # Check if we have any successful results
    if not resultados:
        logger.error("No se pudieron obtener NINGUNA tasa remunerada")
        # Try to get cached data as fallback
        cached = await redis.get("rates:remuneradas")
        if cached:
            logger.warning("Usando cache anterior como fallback")
            return json.loads(cached)
        else:
            logger.error("No hay cache disponible, creando respuesta de emergencia")
            # Create emergency response to prevent complete failure
            emergency_response = {
                "mercado_pago": {"rate": 0.0, "status": "error"},
                "cocos": {"rate": 0.0, "status": "error"},
                "ualintec": {"rate": 0.0, "status": "error"},
                "updatedAt": datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")).isoformat(),
                "status": "emergency_fallback"
            }
            return emergency_response
    
    # Log partial successes
    if failed_wallets:
        logger.warning("Fallos parciales en wallets: %s", failed_wallets)
    
    # Build payload with available data
    payload = build_payload(resultados)
    payload["updatedAt"] = datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")).isoformat()
    payload["status"] = "partial" if failed_wallets else "complete"
    
    # Cache the results
    try:
        await redis.set("rates:remuneradas", json.dumps(payload), ex=36 * 3600)
        logger.info("Remuneradas actualizadas y cacheadas para: %s", ", ".join(resultados.keys()))
    except Exception as e:
        logger.error("Error al cachear datos: %s", e)
    
    return payload


async def get_cached_or_refresh(redis) -> dict:
    """Get cached rates or refresh them if needed."""
    try:
        cached = await redis.get("rates:remuneradas")
        if cached:
            logger.info("Usando tasas remuneradas cacheadas")
            return json.loads(cached)
        
        logger.info("No hay cache disponible, refrescando tasas remuneradas...")
        return await refresh_remuneradas(redis)
        
    except Exception as e:
        logger.error("Error en get_cached_or_refresh: %s", e)
        
        # Try to get cached data as last resort
        try:
            cached = await redis.get("rates:remuneradas")
            if cached:
                logger.warning("Usando cache como último recurso debido a error")
                return json.loads(cached)
        except Exception as cache_error:
            logger.error("Error al obtener cache como último recurso: %s", cache_error)
        
        # Return emergency response
        logger.error("Retornando respuesta de emergencia")
        return {
            "mercado_pago": {"rate": 0.0, "status": "emergency"},
            "cocos": {"rate": 0.0, "status": "emergency"},
            "ualintec": {"rate": 0.0, "status": "emergency"},
            "updatedAt": datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")).isoformat(),
            "status": "emergency_fallback"
        }


def schedule_daily_job(redis) -> None:
    """Start scheduler to refresh rates daily."""
    def job():
        try:
            logger.info("Ejecutando job programado de actualización de tasas remuneradas...")
            asyncio.run(refresh_remuneradas(redis))
            logger.info("Job programado completado exitosamente")
        except Exception as e:
            logger.error("Error en job programado: %s", e)
            # Don't let the scheduler crash due to job errors
    
    try:
        scheduler.add_job(job, "cron", hour=13, minute=5)
        scheduler.start()
        logger.info("Scheduler iniciado para refrescar tasas remuneradas diariamente a las 13:05")
    except Exception as e:
        logger.error("Error al iniciar scheduler: %s", e)
        # Try to start without the job
        try:
            scheduler.start()
            logger.info("Scheduler iniciado sin job programado")
        except Exception as scheduler_error:
            logger.error("Error crítico al iniciar scheduler: %s", scheduler_error)
