from fastapi import FastAPI
from models import UsuarioInput
from redis_crud import get_top_discounts, update_promotions, get_all_wallets
from openai_agent import procesar_supermercados, get_promotion_by_user_input
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  #["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="static")

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