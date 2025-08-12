from openai import OpenAI
import json
import time
from backend.models import Descuento, InfoSupermercado, SummaryRequest

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

                    for i, d in enumerate(parsed.get("descuentos", [])):
                        try:
                            descuento = Descuento(**d)
                            descuentos_totales.append(descuento)
                        except Exception as e:
                            print(f"⚠️ Error en descuento {i} del día {dia}: {e}")
                            continue

                except json.JSONDecodeError as e:
                    print(f"⚠️ JSON inválido en {nombre} ({dia}): {e}")

            except Exception as e:
                print(f"❌ Error al procesar {nombre} ({dia}): {e}")

            time.sleep(1.2)

        supermercado_info = InfoSupermercado(
            supermercado=nombre,
            descuentos=descuentos_totales
        )
        resultados.append(supermercado_info)

    return resultados


def get_summary(body: SummaryRequest):
    prompt = f"Resumí en pocas palabras este texto legal para un consumidor: {body.text}"
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"❌ Error en resumen: {e}")
        return {"error": "No se pudo generar el resumen"}