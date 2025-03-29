from typing import List, Optional
from pydantic import BaseModel

class Descuento(BaseModel):
    medio_pago: str
    descuento: str
    aplica_en: Optional[str]   # puede ser: online, tienda, ambos
    tope: str
    detalles: str

class InfoSupermercado(BaseModel):
    supermercado: str
    descuentos: List[Descuento]

class UsuarioInput(BaseModel):
    prompt: str