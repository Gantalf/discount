from fastapi import FastAPI
from models import UsuarioInput
from redis_crud import get_top_discounts, save_promotions
from openai_agent import procesar_supermercados, get_promotion_by_user_input
from typing import List

app = FastAPI()

@app.post("/create/promotions")
def obtener_descuentos():
    resultados = procesar_supermercados()
    for supermercado in resultados:
        save_promotions(supermercado.supermercado, [d.model_dump() for d in supermercado.descuentos])
    return resultados


@app.post("/promotions/user")
def descuentos_usuario(input: UsuarioInput):
    return get_promotion_by_user_input(input)

@app.get("/promotions/top")
def get_top_discounts_api():
    result = get_top_discounts()
    return {"top_discounts": result}