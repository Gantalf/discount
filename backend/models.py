from typing import List, Optional, Union
from pydantic import BaseModel, Field

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
    filter_type: str = Field(..., alias="filterType")
    filter_value: Union[str, List[str]] = Field(..., alias="filterValue")

    class Config:
        populate_by_name = True

class UpdateInfo(BaseModel):
    supermarket: str
    discounts: List[Descuento] 

class SummaryRequest(BaseModel):
    text: str
