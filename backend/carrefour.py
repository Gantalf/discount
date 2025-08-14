import json
from playwright.sync_api import sync_playwright, expect
import time

from logo_mapper import infer_medio_pago, register_logo

def limpiar_texto(texto):
    texto = texto.replace("\\", "")  # elimina barras invertidas
    texto = texto.replace("\"", "'")  # reemplaza comillas dobles escapadas por simples
    return texto

def obtener_promociones():
    promociones = []

    with sync_playwright() as p:
        navegador = p.chromium.launch(headless=False)
        pagina = navegador.new_page()
        pagina.goto("https://www.carrefour.com.ar/descuentos-bancarios", timeout=60000)

        # Intentamos cerrar el modal si aparece
        try:
            pagina.wait_for_selector(".vtex-modal__close-icon", timeout=10000)
            pagina.click(".vtex-modal__close-icon")
            print("Modal cerrado correctamente.")
        except:
            print("No se encontró el modal, continuando...")

        tarjetas = pagina.query_selector_all(".valtech-carrefourar-bank-promotions-0-x-cardBox")
        print(len(tarjetas))
        for tarjeta in tarjetas:
            try:
                
                aplica_en_urls = []
                icon_containers = tarjeta.query_selector_all("div.valtech-carrefourar-bank-promotions-0-x-iconItem")
                for icon_container in icon_containers:
                    logos = icon_container.query_selector_all("div.valtech-carrefourar-bank-promotions-0-x-logoIcon")
                    for logo in logos:
                        style_attr = logo.get_attribute("style")
                        if style_attr and "url(" in style_attr:
                            start = style_attr.find("url(") + 4
                            end = style_attr.find(")", start)
                            url = style_attr[start:end].strip().strip('"').strip("'")
                            aplica_en_urls.append(url)

                
                detalles_el = tarjeta.query_selector(".valtech-carrefourar-bank-promotions-0-x-dateText")
                detalles = detalles_el.inner_text().strip() if detalles_el else ""
                # Imagen (medio de pago)
                img_logo = tarjeta.query_selector(
                    "div.valtech-carrefourar-bank-promotions-0-x-ColRightCard img"
                )
                logo = ""
                if img_logo:
                    src = img_logo.get_attribute("src")
                    logo = f"https://www.carrefour.com.ar{src}" if src else ""
                medio_pago = infer_medio_pago(logo) or ""
                if medio_pago:
                    register_logo(logo, medio_pago)

                # Textos visibles

                descuento_el = tarjeta.query_selector(".valtech-carrefourar-bank-promotions-0-x-ColRightTittle")
                descuento = descuento_el.inner_text().strip() if descuento_el else ""
                tope_el = tarjeta.query_selector(".valtech-carrefourar-bank-promotions-0-x-ColRightText")
                tope = tope_el.inner_text().strip() if tope_el else ""
                 

                # Legales
                boton_legales = tarjeta.query_selector('div.flex.flex-row.items-center.pointer[role="button"]')
                legales = ""
                if boton_legales:
                    boton_legales.click()
                    try:
                        tarjeta.wait_for_selector("div.valtech-carrefourar-bank-promotions-0-x-legalContent.pa3", timeout=10000)
                        text = tarjeta.query_selector("div.valtech-carrefourar-bank-promotions-0-x-legalContent.pa3")
                        legales = limpiar_texto(text.inner_text())
                        
                    except Exception as e:
                        print(f"No se encontró el texto de legales: {e}")
                  

                    

                promociones.append(
                    {
                        "logo": logo,
                        "medio_pago": medio_pago,
                        "descuento": descuento,
                        "tope": tope,
                        "aplica_en": aplica_en_urls,
                        "detalles": detalles,
                        "legales": legales.strip(),
                    }
                )
            except Exception as e:
                print(f"Error procesando tarjeta: {e}")

        navegador.close()
        return promociones

if __name__ == "__main__":
    promos = obtener_promociones()
    print(promos)
    resultado = {
        "supermarket": "CARREFOUR",
        "discounts": promos
    }

    with open("promociones_carrefour_2.json", "w", encoding="utf-8") as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)

    print("Archivo promociones_carrefour.json generado correctamente.")
