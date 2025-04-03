from typing import List, Optional, Union
from pydantic import BaseModel

class Descuento(BaseModel):
    medio_pago: str
    descuento: str
    aplica_en: Optional[Union[str, List[str]]] = None
    tope: str
    detalles: str
    legales: Optional[str]


class InfoSupermercado(BaseModel):
    supermercado: str
    descuentos: List[Descuento]

class UsuarioInput(BaseModel):
    prompt: str

class UpdateInfo(BaseModel):
    supermarket: str
    discounts: List[Descuento] 

class SummaryRequest(BaseModel):
    text: str