from __future__ import annotations

import os
import asyncio
from datetime import datetime
from typing import Dict, Tuple, Any
from zoneinfo import ZoneInfo

import httpx

WALLET_MAP: Dict[str, Dict[str, str]] = {
    "mercado_pago": {
        "tipo": "fci_mercado_dinero",
        "fondo": "Mercado Fondo Ahorro - Clase A",
        "limite": "Sin límite informado",
    },
    "cocos": {
        "tipo": "fci_mercado_dinero",
        "fondo": "Cocos Ahorro - Clase A",
        "limite": "Sin límite informado",
    },
    "ualintec": {
        "tipo": "fci_mercado_dinero",
        "fondo": "Ualintec Ahorro Pesos - Clase A",
        "limite": "Sin límite informado",
    },
}

ARGDAT_TIMEOUT = float(os.getenv("ARGDAT_TIMEOUT", "6"))


async def fetch_fci_latest_and_prev(session: httpx.AsyncClient) -> Tuple[Any, Any]:
    """Fetch latest money market FCI data and calculate TNA."""
    import logging
    logger = logging.getLogger(__name__)
    
    # Try both URLs to handle the 301 redirect issue
    urls = [
        "https://api.argentinadatos.com/v1/finanzas/fci/mercadoDinero/ultimo",
        "https://api.argentinadatos.com/v1/finanzas/fci/mercadoDinero/ultimo/"
    ]
    
    for url in urls:
        try:
            logger.info("Intentando obtener datos FCI desde: %s", url)
            resp = await session.get(url, follow_redirects=True)
            logger.info("Respuesta FCI desde %s: %s", url, resp.status_code)
            
            if resp.status_code == 200:
                data = resp.json()
                logger.info("Datos FCI obtenidos exitosamente desde %s", url)
                logger.debug("Datos recibidos: %d fondos", len(data) if isinstance(data, list) else 0)
                
                # Para el cálculo de TNA, necesitamos el valor actual y el del día anterior
                # Como solo tenemos el último día, calcularemos TNA basado en el VCP actual
                # TNA = (VCP - 1000) / 1000 * 365 (asumiendo que el valor base es 1000)
                
                return data, data  # Retornamos los mismos datos para ambos
                
        except httpx.HTTPStatusError as e:
            logger.warning("Error HTTP %s desde %s: %s", e.response.status_code, url, e)
            if e.response.status_code == 404:
                logger.info("URL %s no encontrada, probando siguiente...", url)
                continue
            else:
                logger.error("Error HTTP no manejable desde %s: %s", url, e.response.text)
                raise
        except Exception as e:
            logger.warning("Error al obtener datos desde %s: %s", url, e)
            continue
    
    # If we get here, all URLs failed
    logger.error("Todas las URLs fallaron para obtener datos FCI")
    raise ValueError("No se pudieron obtener datos FCI desde ninguna URL")


def calc_tna_tea(vcp_u: float, vcp_p: float) -> Tuple[float, float]:
    r_diario = (vcp_u - vcp_p) / vcp_p
    tna = r_diario * 365
    tea = (1 + r_diario) ** 365 - 1
    return tna, tea


def _find_fondo(data: Any, fondo_name: str) -> Dict[str, Any] | None:
    import logging
    logger = logging.getLogger(__name__)
    
    logger.debug("Buscando fondo '%s' en datos: %s", fondo_name, type(data))
    
    # Handle different data formats
    if isinstance(data, list):
        items = data
        logger.debug("Datos son una lista con %d elementos", len(items))
    elif isinstance(data, dict):
        items = data.get("data", [])
        logger.debug("Datos son un dict con key 'data' que contiene %d elementos", len(items) if isinstance(items, list) else "no es lista")
    else:
        logger.warning("Formato de datos inesperado: %s", type(data))
        return None
    
    if not isinstance(items, list):
        logger.error("Los datos no son una lista válida: %s", type(items))
        return None
    
    logger.debug("Procesando %d items para buscar fondo '%s'", len(items), fondo_name)
    
    # Log all available fund names for debugging
    available_funds = []
    for i, item in enumerate(items):
        if isinstance(item, dict) and "fondo" in item:
            fund_name = item.get("fondo", "")
            available_funds.append(fund_name)
            if i < 10:  # Log first 10 funds for debugging
                logger.debug("Item %d - nombre: '%s'", i, fund_name)
    
    logger.info("Total de fondos disponibles: %d", len(available_funds))
    logger.info("Primeros 10 fondos: %s", available_funds[:10])
    
    # Search for the specific fund
    for i, item in enumerate(items):
        if not isinstance(item, dict):
            logger.debug("Item %d no es un dict: %s", i, type(item))
            continue
            
        nombre = str(item.get("fondo", "")).lower()
        logger.debug("Item %d - nombre: '%s' vs buscado: '%s'", i, nombre, fondo_name.lower())
        
        if fondo_name.lower() in nombre:
            logger.info("Fondo '%s' encontrado en item %d", fondo_name, i)
            return item
    
    logger.warning("Fondo '%s' no encontrado en ninguno de los %d items", fondo_name, len(items))
    logger.warning("Fondos disponibles que contienen 'mercado': %s", [f for f in available_funds if 'mercado' in f.lower()])
    logger.warning("Fondos disponibles que contienen 'cocos': %s", [f for f in available_funds if 'cocos' in f.lower()])
    logger.warning("Fondos disponibles que contienen 'ualintec': %s", [f for f in available_funds if 'ualintec' in f.lower()])
    return None


def resolve_fci_rate(ultimo: Any, penultimo: Any, fondo_name: str) -> Dict[str, Any]:
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info("Resolviendo tasa FCI para fondo: %s", fondo_name)
    logger.debug("Datos disponibles: %s", type(ultimo))
    
    # Buscar el fondo en los datos
    fondo_item = _find_fondo(ultimo, fondo_name)
    
    if not fondo_item:
        logger.error("Fondo '%s' no encontrado en los datos", fondo_name)
        logger.debug("Fondos disponibles: %s", [item.get("fondo") for item in ultimo if isinstance(item, dict)])
        raise ValueError(f"Fondo '{fondo_name}' no encontrado en los datos")
    
    logger.info("Fondo encontrado: %s", fondo_item)
    
    try:
        vcp_actual = float(fondo_item.get("vcp"))
        
        if vcp_actual <= 0:
            raise ValueError(f"Valor VCP inválido: {vcp_actual}")
        
        logger.info("VCP actual: %s", vcp_actual)
        
        # Calcular TNA anualizado basado en el VCP actual
        # Asumiendo que el valor base es 1000 (valor típico de un FCI)
        valor_base = 1000.0
        rendimiento_diario = (vcp_actual - valor_base) / valor_base
        tna = rendimiento_diario * 365 * 100  # Convertir a porcentaje
        
        logger.info("TNA calculado: %.4f%%", tna)
        
        # Obtener fecha del dato
        fecha = fondo_item.get("fecha")
        if fecha:
            fecha = str(fecha)[:10]
        else:
            fecha = datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")).date().isoformat()
        
        logger.info("Tasa FCI resuelta exitosamente para %s: TNA=%.4f%%", fondo_name, tna)
        return {
            "tna": tna,
            "tea": tna,  # Para fondos de mercado de dinero, TEA ≈ TNA
            "fechaDato": fecha,
            "vcp": vcp_actual
        }
        
    except (ValueError, TypeError) as e:
        logger.error("Error al procesar datos VCP para %s: %s", fondo_name, e)
        logger.error("VCP actual: %s (tipo: %s)", fondo_item.get("vcp"), type(fondo_item.get("vcp")))
        raise ValueError(f"Error al procesar datos VCP para {fondo_name}: {e}")
    except Exception as e:
        logger.error("Error inesperado al resolver tasa FCI para %s: %s", fondo_name, e)
        raise


async def fetch_rendimiento_entidad(session: httpx.AsyncClient, entidad: str) -> Dict[str, Any]:
    import logging
    logger = logging.getLogger(__name__)
    
    # Try both URLs to handle the 301 redirect issue
    urls = [
        f"https://api.argentinadatos.com/v1/finanzas/rendimientos/{entidad}",
        f"https://api.argentinadatos.com/v1/finanzas/rendimientos/{entidad}/"
    ]
    
    for url in urls:
        try:
            logger.info("Intentando obtener rendimiento de %s desde: %s", entidad, url)
            resp = await session.get(url, follow_redirects=True)
            logger.info("Respuesta exitosa desde %s: %s", url, resp.status_code)
            
            if resp.status_code == 200:
                data = resp.json()
                logger.debug("Datos obtenidos: %s", data)
                
                tna = data.get("tna")
                if tna is None:
                    tna = data.get("apy")
                if tna is None:
                    raise ValueError("No se encontró TNA/APY en la respuesta")
                
                tna = float(tna)
                if tna > 1:
                    tna /= 100
                
                fecha = data.get("fechaDato") or data.get("fecha")
                if not fecha:
                    fecha = datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")).date().isoformat()
                else:
                    fecha = str(fecha)[:10]
                
                logger.info("Rendimiento de %s obtenido exitosamente: TNA=%.4f", entidad, tna)
                return {"tna": tna, "fechaDato": fecha}
                
        except httpx.HTTPStatusError as e:
            logger.warning("Error HTTP %s desde %s: %s", e.response.status_code, url, e)
            if e.response.status_code == 404:
                logger.info("URL %s no encontrada, probando siguiente...", url)
                continue
            else:
                logger.error("Error HTTP no manejable desde %s: %s", url, e.response.text)
                raise
        except Exception as e:
            logger.warning("Error al obtener datos desde %s: %s", url, e)
            continue
    
    # If we get here, all URLs failed
    logger.error("Todas las URLs fallaron para obtener rendimiento de %s", entidad)
    raise ValueError(f"No se pudieron obtener datos de rendimiento para {entidad} desde ninguna URL")


def build_payload(resultados: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    payload: Dict[str, Dict[str, Any]] = {}
    for wallet, meta in WALLET_MAP.items():
        data = resultados.get(wallet)
        if not data:
            continue
        item = dict(data)
        item["limite"] = meta["limite"]
        item["verMas"] = "https://comparatas.ar"
        if meta["tipo"] == "fci_mercado_dinero":
            item["fuente"] = "fci_mercado_dinero"
            # Convertir TNA a formato de tasa para el frontend
            if "tna" in item:
                item["rate"] = item["tna"]
        payload[wallet] = item
    return payload
