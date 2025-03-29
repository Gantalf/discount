from openai import OpenAI
import json
import time
import re
from redis_crud import get_promotions_by_wallet_names
from functions_definitions import Openai_function_definitions
from logger import guardar_log, log_error
from models import Descuento, InfoSupermercado, UsuarioInput

client = OpenAI()  # Lee la API key desde la variable de entorno OPENAI_API_KEY

supermercados = {
    "Dia": "https://diaonline.supermercadosdia.com.ar/medios-de-pago-y-promociones",
    "Carrefour": "https://www.carrefour.com.ar/descuentos-bancarios",
    "Coto": "https://www.coto.com.ar/descuentos/index.asp",
    "Jumbo": "https://www.jumbo.com.ar/descuentos-del-dia?type=por-banco"
}

def procesar_supermercados() -> list[InfoSupermercado]:
    resultados = []
    dias = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]

    for nombre, url in supermercados.items():
        print(f"🔍 Procesando {nombre} con web-search...")

        descuentos_totales = []

        for dia in dias:
            print(f"🕵️‍♂️ Procesando promociones para el día: {dia}...")

            try:
                response = client.chat.completions.create(
                    model="gpt-4o-search-preview",
                    max_tokens=2048,
                    web_search_options={
                        "search_context_size": "high",
                    },
                    messages=[
                        {
                            "role": "user",
                            "content": f"""
                            Visitá la siguiente URL del supermercado {nombre}: {url}

                            Extraé exclusivamente las promociones bancarias o de billeteras virtuales visibles para el día {dia}.

                            Por cada tarjeta de promoción devolveme:

                            - "medio_pago": nombre exacto del banco o billetera virtual (por ejemplo: "Galicia MODO", "Éminent MODO", "Prex", "Mercado Pago", "NaranjaX").
                            - "descuento": texto del beneficio como "25% Dto", "3 cuotas sin interés", etc.
                            - "tope": texto del límite de la promoción (ej: "Tope: $8.000 por semana", "Sin mínimo de compra", etc.)
                            - "aplica_en": "online", "tienda" o "online y tienda"
                            - "detalles": cualquier otro texto importante visible, como fechas de vigencia, días de aplicación, tipo de tarjeta que acepta el descuento, etc.

                            ⚠️ No inventes fechas ni completes campos que no estén explícitamente visibles. Si un dato no está, no lo infieras.

                            Respondé exclusivamente en formato JSON. Sin markdown ni bloques de código.

                            Ejemplo:
                            {{
                            "descuentos": [
                                {{
                                    "medio_pago": "Visa Galicia MODO",
                                    "descuento": "25% Dto",
                                    "tope": "Tope: $15.000 Mensual",
                                    "aplica_en": "online",
                                    "detalles": "Del 01/11/2024 al 31/03/2025. Solo los jueves. VISA crédito y débito mediante MODO"
                                }}
                            ]
                            }}
                            """
                        }
                    ]
                )

                raw = response.choices[0].message.content
                print(f"⚠️ La respuesta se truncó: {response.choices[0].finish_reason}")
                print(f"✅ Respuesta recibida de {nombre} para el día {dia}")

                try:
                    parsed = json.loads(raw)
                    guardar_log(f"{nombre}_{dia}", raw)

                    for i, d in enumerate(parsed.get("descuentos", [])):
                        try:
                            descuento = Descuento(**d)
                            descuentos_totales.append(descuento)
                        except Exception as e:
                            print(f"⚠️ Error en descuento {i} del día {dia}: {e}")
                            continue

                except json.JSONDecodeError as e:
                    print(f"⚠️ JSON inválido en {nombre} ({dia}): {e}")
                    guardar_log(f"{nombre}_{dia}", raw)

            except Exception as e:
                print(f"❌ Error al procesar {nombre} ({dia}): {e}")
                log_error(e)

            time.sleep(1.2)

        supermercado_info = InfoSupermercado(
            supermercado=nombre,
            descuentos=descuentos_totales
        )
        resultados.append(supermercado_info)

    return resultados

def get_promotion_by_user_input(input: UsuarioInput):
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "user", "content": input.prompt}
        ],
        functions=Openai_function_definitions,
        function_call="auto"
    )

    if not response.choices:
        return {"error": "No hubo respuesta del modelo"}

    choice = response.choices[0]
    finish_reason = choice.finish_reason

    if finish_reason == "function_call":
        func_call = choice.message.function_call
        if func_call:
            name = func_call.name
            args = json.loads(func_call.arguments)
            if name == "get_promotions_by_wallet_names":
                resultado = get_promotions_by_wallet_names(**args)
                return {"result": resultado, "func_called": name}
        else:
            return {"error": "No se llamó a ninguna función"}

    return {"message": "No se invocó ninguna función"}