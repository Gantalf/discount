from openai import OpenAI
import json
import time
import re
from logger import guardar_log, log_error
from models import Descuento, InfoSupermercado

client = OpenAI()  # Lee la API key desde la variable de entorno OPENAI_API_KEY

supermercados = {
    #"Dia": "https://diaonline.supermercadosdia.com.ar/medios-de-pago-y-promociones",
    "Carrefour": "https://www.carrefour.com.ar/descuentos-bancarios",
    #"Coto": "https://www.coto.com.ar/promociones",
    #"Jumbo": "https://www.jumbo.com.ar/promociones"
}

def procesar_supermercados() -> list[InfoSupermercado]:
    resultados = []

    for nombre, url in supermercados.items():
        print(f"🔍 Procesando {nombre} con web-search...")

        try:
            response = client.chat.completions.create(
                model="gpt-4o-search-preview",
                web_search_options={
                    "search_context_size": "high",
                },
                messages=[
                    {
                        "role": "user",
                        "content": f"""
                        Visitá la siguiente URL del supermercado {nombre}: {url}

                        Extraé TODAS las promociones bancarias o de billeteras virtuales visibles.

                        Por cada tarjeta de promoción devolveme:

                        - "medio_pago": nombre exacto del banco o billetera virtual (por ejemplo: "Galicia MODO", "Éminent MODO", "Prex", "Mercado Pago", "NaranjaX").
                        - "descuento": texto del beneficio como "25% Dto", "3 cuotas sin interés", etc.
                        - "tope": texto del límite de la promoción (ej: "Tope: $8.000 por semana", "Sin mínimo de compra", "Tope: Nivel 1: $6000/ Nivel 2: $8.000 / Nivel 3: $12.000 por semana")
                        - "aplica_en": "online", "tienda" o "online y tienda"
                        - "detalles": cualquier otro texto importante visible, como fechas de vigencia, días de aplicación, tipo de tarjeta que acepta el descuento como credito o debito, etc.

                        ⚠️ No inventes fechas ni completes campos que no estén explícitamente visibles. Si un dato no está, no lo infieras.

                        Respondé exclusivamente en formato JSON. Sin markdown ni bloques de código.

                        Ejemplo:
                        {{
                        "supermercado": "{nombre}",
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
            print(f"⚠️ La respuesta se truncó {response.choices[0].finish_reason}")
            raw = re.sub(r"^```json\s*|\s*```$", "", raw.strip())
            print(f"✅ Respuesta recibida de {nombre}")

            try:
                parsed = json.loads(raw)
                guardar_log(nombre, raw)

                # Intentar parsear los descuentos de a uno
                items = []
                for i, d in enumerate(parsed.get("descuentos", [])):
                    try:
                        descuento = Descuento(**d)
                        items.append(descuento)
                    except Exception as e:
                        print(f"⚠️ Error en descuento {i}: {e}")
                        continue

                supermercado_info = InfoSupermercado(
                    supermercado=parsed["supermercado"],
                    descuentos=items
                )

                resultados.append(supermercado_info)

            except json.JSONDecodeError as e:
                print(f"⚠️ JSON inválido: {e}")
                guardar_log(nombre, raw)

        except Exception as e:
            print(f"❌ Error al procesar {nombre}: {e}")
            log_error(e)

        time.sleep(2)

    return resultados