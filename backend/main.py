from fastapi import FastAPI
from openai_agent import procesar_supermercados
from typing import List

app = FastAPI()

@app.get("/descuentos")
def obtener_descuentos():
    resultados = procesar_supermercados()
    return resultados