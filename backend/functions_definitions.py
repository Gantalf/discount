Openai_function_definitions = [
    {
        "name": "get_promotions_by_wallet_names",
        "description": "Obtiene los descuentos disponibles según billeteras virtuales o bancos del usuario.",
        "parameters": {
            "type": "object",
            "properties": {
                "billeteras": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Lista de billeteras virtuales o bancos que el usuario tiene"
                }
            },
            "required": ["billeteras"]
        }
    },
    {
        "name": "get_promotions_by_supermarket",
        "description": "Obtiene los descuentos disponibles para un supermercado en particular.",
        "parameters": {
            "type": "object",
            "properties": {
                "supermarket": {
                    "type": "string",
                    "description": "Nombre del supermercado del cual se desean obtener los descuentos"
                }
            },
            "required": ["supermarket"]
        }
    }
]
