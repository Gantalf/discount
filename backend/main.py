from fastapi import FastAPI
from backend.models import UsuarioInput
from backend.redis_crud import get_top_discounts, update_promotions, get_all_wallets
from backend.openai_agent import procesar_supermercados, get_promotion_by_user_input
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://condescuento.ar", "https://www.condescuento.ar"],  #["http://localhost:5173"]
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


@app.post("/promotions/user")
def descuentos_usuario(input: UsuarioInput):
    return get_promotion_by_user_input(input)

@app.get("/promotions/top")
def get_top_discounts_api():
    result = get_top_discounts()
    return {"top_discounts": result}

@app.get("/wallets")
def get_available_wallets():
    result = get_all_wallets()
    return result


current_dir = os.path.dirname(os.path.realpath(__file__))
frontend_path = os.path.join(current_dir, "..", "frontend", "dist")


app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")

@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    index_path = os.path.join(os.path.dirname(__file__), "../frontend/dist/index.html")
    print("Serving frontend from:", index_path)
    return FileResponse(index_path)