from datetime import datetime, timezone
import json
import redis
import os
from dotenv import load_dotenv
from typing import Optional, List, Dict
from collections import defaultdict
import re

load_dotenv()

# Configuración de la conexión a Redis
redis_host = os.getenv("REDIS_HOST")
redis_port = os.getenv("REDIS_PORT")
redis_username = os.getenv("REDIS_USER_NAME")
redis_password = os.getenv("PASS_REDIS")

try:
    r = redis.Redis(
        host=redis_host,
        port=int(redis_port),
        decode_responses=True,
        username=redis_username,
        password=redis_password,
    )
    r.ping()  # Verificar si Redis está disponible
    print("✅ Conectado a Redis correctamente.")

except Exception as e:
    print(f"❌ Error al conectar con Redis: {e}")

# 📥 Save promotions for a supermarket
def save_promotions(supermarket: str, promotions: List[dict]) -> None:
    """
    Stores promotions for a supermarket in a structured Redis key.
    Fields:
      - promotions: JSON string
      - updated_at: ISO 8601 timestamp
    """
    key = f"promo:{supermarket.lower()}"
    payload = {
        "promotions": json.dumps(promotions),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    r.hset(key, mapping=payload)
    print(f"✅ Promotions saved for '{supermarket}'")


# 📤 Retrieve all promotions (all supermarkets)
def get_all_promotions() -> List[Dict]:
    """
    Retrieves promotions from all supermarkets stored in Redis.
    """
    results = []
    for key in r.scan_iter("promo:*"):
        data = r.hgetall(key)
        if data:
            try:
                promotions = json.loads(data.get("promotions", "[]"))
                results.append({
                    "supermarket": key.replace("promo:", ""),
                    "updated_at": data.get("updated_at"),
                    "promotions": promotions
                })
            except Exception as e:
                print(f"⚠️ Error parsing {key}: {e}")
    return results


# 🔍 Get promotions by supermarket
def get_promotions_by_supermarket(supermarket: str) -> Optional[Dict]:
    """
    Returns promotions for a given supermarket name.
    """
    key = f"promo:{supermarket.lower()}"
    data = r.hgetall(key)
    if data:
        try:
            promotions = json.loads(data.get("promotions", "[]"))
            return {
                "supermarket": supermarket,
                "updated_at": data.get("updated_at"),
                "promotions": promotions
            }
        except Exception as e:
            print(f"⚠️ Error parsing data for {supermarket}: {e}")
    return None


# 🔄 Update promotions (overwrite only if exists)
def update_promotions(supermarket: str, new_promotions: List[dict]) -> bool:
    """
    Updates the promotions list for a given supermarket.
    Returns True if key exists and was updated, False otherwise.
    """
    key = f"promo:{supermarket.lower()}"
    if r.exists(key):
        payload = {
            "promotions": json.dumps(new_promotions),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        r.hset(key, mapping=payload)
        print(f"🔄 Promotions updated for '{supermarket}'")
        return True
    else:
        print(f"⚠️ Cannot update: '{supermarket}' not found in Redis.")
        return False
    
def get_promotions_by_wallet_names(billeteras: List[str]) -> List[dict]:
    resultados = []
    keys = r.keys("promo:*")

    for key in keys:
        data = r.hget(key, "promotions")
        if not data:
            continue

        promociones = json.loads(data)

        filtradas = [
            p for p in promociones
            if any(b.lower() in p["medio_pago"].lower() for b in billeteras)
        ]

        if filtradas:
            supermercado = key.split(":")[1]
            resultados.append({
                "supermarket": supermercado,
                "discounts": filtradas
            })

    return resultados

def extract_percentage(discount: str) -> int:
    match = re.search(r"(\d+)\s*%", discount)
    return int(match.group(1)) if match else 0

def extract_tope_value(tope: str) -> int:
    # Handles "Tope: $10.000" or similar
    match = re.search(r"\$?\s*([\d\.]+)", tope.replace(".", "").replace(",", "."))
    try:
        return int(float(match.group(1))) if match else 0
    except:
        return 0

def has_installments(discount: str, details: str) -> bool:
    return "cuotas sin interés" in discount.lower() or "cuotas sin interés" in details.lower()

def is_no_limit(tope: str) -> bool:
    return "sin tope" in tope.lower() or "sin límite" in tope.lower()

def get_top_discounts(limit=5) -> list[dict]:
    keys = r.keys("promo:*")
    scored_discounts = []

    for key in keys:
        data = r.hget(key, "promotions")
        if not data:
            continue

        promotions = json.loads(data)
        supermarket = key.split(":")[1]

        for promo in promotions:
            percent = extract_percentage(promo.get("descuento", ""))
            tope_val = extract_tope_value(promo.get("tope", ""))
            cuotas = has_installments(promo.get("descuento", ""), promo.get("detalles", ""))
            no_limit = is_no_limit(promo.get("tope", ""))

            score = 0
            if no_limit:
                score += 30
            else:
                score += min(tope_val / 1000, 30)  # Up to 30 pts

            score += min(percent, 30)  # Max 30 for high discount
            if cuotas:
                score += 10

            scored_discounts.append({
                "score": round(score, 2),
                "supermarket": supermarket,
                "discount": promo
            })

    # Sort by score and take top N
    top = sorted(scored_discounts, key=lambda x: x["score"], reverse=True)[:limit]

    # Group into the desired structure
    grouped = defaultdict(list)
    for item in top:
        grouped[item["supermarket"]].append(item["discount"])

    result = []
    for supermarket, discounts in grouped.items():
        result.append({
            "supermarket": supermarket,
            "discounts": discounts
        })

    return result

def get_all_wallets() -> List[str]:
    wallets_set = set()
    keys = r.keys("promo:*")

    for key in keys:
        data = r.hget(key, "promotions")
        if not data:
            continue

        promociones = json.loads(data)

        for promo in promociones:
            medio = promo.get("medio_pago")
            if medio:
                wallets_set.add(medio.strip())

    return sorted(wallets_set)