from datetime import datetime, timezone
import json
import redis
import os
from fastapi import HTTPException
from dotenv import load_dotenv
from typing import Optional, List, Dict

load_dotenv()

# Configuración de la conexión a Redis
redis_host = os.getenv("REDIS_HOST")
redis_port = os.getenv("REDIS_PORT")
redis_username = os.getenv("REDIS_USER_NAME")
redis_password = os.getenv("REDIS_PASSWORD")


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