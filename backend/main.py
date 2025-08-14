from fastapi import FastAPI
from backend.models import UsuarioInput, UpdateInfo, SummaryRequest
from backend.redis_crud import (
    get_top_discounts,
    update_promotions,
    get_all_wallets,
    get_all_supermarkets,
    get_promotions_by_wallet_names,
    get_promotions_by_supermarket_names,
)
from backend.openai_agent import procesar_supermercados, get_summary
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins= ["http://localhost:5173", "http://localhost:8000",  "http://localhost:3000"], #["https://condescuento.ar", "https://www.condescuento.ar"], ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/create/promotions")
def obtener_descuentos():
    resultados = procesar_supermercados()
    for supermercado in resultados:
        update_promotions(supermercado.supermercado, [d.model_dump() for d in supermercado.descuentos])
    return resultados

@app.put("/update/promotion")
def update_promotions_endpoint(body: UpdateInfo):
    success = update_promotions(body.supermarket, [p.model_dump() for p in body.discounts])
    return {"success": success}

@app.post("/promotions/user")
def descuentos_usuario(input: UsuarioInput):
    values = (
        input.filter_value
        if isinstance(input.filter_value, list)
        else [input.filter_value]
    )
    if input.filter_type == "wallet":
        result = get_promotions_by_wallet_names(values)
    elif input.filter_type == "supermarket":
        result = get_promotions_by_supermarket_names(values)
    else:
        result = []
    return {"result": result}

@app.get("/promotions/top")
def get_top_discounts_api():
    result = get_top_discounts()
    return {"top_discounts": result}

@app.get("/wallets")
def get_available_wallets():
    result = get_all_wallets()
    return result

@app.get("/supermarkets")
def get_available_supermarkets():
    """
    Devuelve la lista de supermercados disponibles.
    """
    return get_all_supermarkets()

@app.post("/summary")
def summarize_text(body: SummaryRequest):
    result = get_summary(body)
    return {"summary": result}

current_dir = os.path.dirname(os.path.realpath(__file__))
frontend_path = os.path.join(current_dir, "..", "frontend", "dist")


app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")

@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    index_path = os.path.join(os.path.dirname(__file__), "../frontend/dist/index.html")
    print("Serving frontend from:", index_path)
    return FileResponse(index_path)
