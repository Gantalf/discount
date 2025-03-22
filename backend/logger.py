import json
import os
from datetime import datetime

def guardar_log(nombre_super, raw_response):
    os.makedirs("logs", exist_ok=True)

    filename = f"logs/{nombre_super.lower()}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(raw_response)

def log_error(msj):
    os.makedirs("logs", exist_ok=True)

    filename = f"logs/error_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(msj, f, indent=2, ensure_ascii=False)

