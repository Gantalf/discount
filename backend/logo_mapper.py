import hashlib
import json
import os
from typing import Dict, Optional

import requests
from dotenv import load_dotenv
import redis

load_dotenv()

redis_host = os.getenv("REDIS_HOST")
redis_port = os.getenv("REDIS_PORT")
redis_username = os.getenv("REDIS_USER_NAME")
redis_password = os.getenv("PASS_REDIS")

r = redis.Redis(
    host=redis_host,
    port=int(redis_port),
    decode_responses=True,
    username=redis_username,
    password=redis_password,
)


def _hash_logo(url: str) -> Optional[str]:
    """Download image from URL and return its SHA256 hash."""
    if not url:
        return None
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return hashlib.sha256(response.content).hexdigest()
    except Exception:
        return None


def build_logo_map() -> Dict[str, str]:
    """Scan Redis promotions and build a hash→medio_pago mapping."""
    mapping: Dict[str, str] = {}
    for key in r.scan_iter("promo:*"):
        data = r.hget(key, "promotions")
        if not data:
            continue
        try:
            promos = json.loads(data)
        except Exception:
            continue
        for promo in promos:
            logo = promo.get("logo")
            medio_pago = promo.get("medio_pago")
            if not logo or not medio_pago:
                continue
            h = _hash_logo(logo)
            if h:
                mapping[h] = medio_pago
    if mapping:
        r.hset("logo_mapper", mapping=mapping)
    return mapping


LOGO_MAP = build_logo_map()


def infer_medio_pago(logo_url: str) -> Optional[str]:
    """Return medio_pago for a logo URL if known."""
    h = _hash_logo(logo_url)
    if not h:
        return None
    return LOGO_MAP.get(h)


def register_logo(logo_url: str, medio_pago: str) -> None:
    """Persist a logo→medio_pago mapping in Redis."""
    if not logo_url or not medio_pago:
        return
    h = _hash_logo(logo_url)
    if not h:
        return
    if h not in LOGO_MAP:
        LOGO_MAP[h] = medio_pago
        r.hset("logo_mapper", h, medio_pago)
