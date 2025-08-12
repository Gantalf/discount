import json
from playwright.sync_api import sync_playwright
import time

from logo_mapper import infer_medio_pago, register_logo

def limpiar_texto(texto):
    texto = texto.replace("\\", "")  # elimina barras invertidas
    texto = texto.replace("\"", "'")  # reemplaza comillas dobles escapadas por simples
    return texto

def obtener_promociones():
    promociones = []

    with sync_playwright() as p:
        navegador = p.chromium.launch(headless=True)
        pagina = navegador.new_page()
        pagina.goto("https://diaonline.supermercadosdia.com.ar/medios-de-pago-y-promociones", timeout=60000)

        # Intentamos cerrar el modal si aparece
        try:
            pagina.wait_for_selector(".vtex-modal__close-icon", timeout=10000)
            pagina.click(".vtex-modal__close-icon")
            print("Modal cerrado correctamente.")
        except:
            print("No se encontró el modal, continuando...")

        tarjetas = pagina.query_selector_all(".diaio-custom-bank-promotions-0-x-list-by-days__item")
        print(len(tarjetas))
        for tarjeta in tarjetas:
            try:
                # Imagen (medio de pago)
                img = tarjeta.query_selector(
                    "img.diaio-custom-bank-promotions-0-x-list-by-days__img-logo"
                )
                logo = img.get_attribute("src") if img else ""
                medio_pago = infer_medio_pago(logo) or ""
                if medio_pago:
                    register_logo(logo, medio_pago)

                # Textos visibles
                texto = tarjeta.inner_text().split("\n")
                descuento = next((t for t in texto if "%" in t or "cuotas" in t.lower()), "")
                tope = next((t for t in texto if "Tope" in t or "Sin mínimo" in t), "")
                aplica_en = "online y tienda"
                if "APLICA ONLINE" in texto and "APLICA TIENDA" not in texto:
                    aplica_en = "online"
                elif "APLICA TIENDA" in texto and "APLICA ONLINE" not in texto:
                    aplica_en = "tienda"

                # Legales
                boton_legales = tarjeta.query_selector(".diaio-custom-bank-promotions-0-x-bank-modal__button")
                legales = ""
                if boton_legales:
                    boton_legales.click()
                    text = pagina.query_selector(".diaio-custom-bank-promotions-0-x-bank-modal__text")
                   
                    legales = limpiar_texto(text.inner_text())
                    
                    pagina.keyboard.press("Escape")

                promociones.append(
                    {
                        "logo": logo,
                        "medio_pago": medio_pago,
                        "descuento": descuento,
                        "tope": tope,
                        "aplica_en": aplica_en,
                        "detalles": " ".join(texto),
                        "legales": legales.strip(),
                    }
                )
            except Exception as e:
                print(f"Error procesando tarjeta: {e}")

        navegador.close()
        return promociones

if __name__ == "__main__":
    promos = obtener_promociones()
    resultado = {
        "supermarket": "DIA",
        "discounts": promos
    }

    with open("promociones_dia_2.json", "w", encoding="utf-8") as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)

    print("Archivo promociones_dia.json generado correctamente.")
