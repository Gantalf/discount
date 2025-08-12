import json
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

from logo_mapper import infer_medio_pago, register_logo


def limpiar_texto(texto):
    return texto.replace("\n", " ").replace("\xa0", " ").strip()

def extraer_texto_normalizado(html):
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text(separator=" ", strip=True)

def obtener_promociones_coto():
    promociones = []

    with sync_playwright() as p:
        navegador = p.chromium.launch(headless=True)
        pagina = navegador.new_page()
        pagina.goto("https://www.coto.com.ar/descuentos/index.asp", timeout=60000)

        tarjetas = pagina.query_selector_all("#discounts li")
        print(f"Se encontraron {len(tarjetas)} promociones.")

        for tarjeta in tarjetas:
            try:
                # Día de la promoción
                dia_el = tarjeta.query_selector("p.alt-font.text-medium-gray.text-small")
                dia = limpiar_texto(dia_el.inner_text()) if dia_el else ""

                # Descuento
                descuento_el = tarjeta.query_selector("p.line-height-normal.font-weight-700")
                descuento = limpiar_texto(descuento_el.inner_text()) if descuento_el else ""

                # Descripción con BeautifulSoup para que mantenga los espacios entre tags
                descripcion_el = tarjeta.query_selector_all("p.line-height-normal.font-weight-600")
                descripcion = ""
                if descripcion_el:
                    html = "".join([p.inner_html() for p in descripcion_el])
                    descripcion = extraer_texto_normalizado(html)

                # detalle bien armado
                detalle = f"{dia} {descripcion}".strip()

                # Imagen del medio de pago
                img_el = tarjeta.query_selector("img")
                logo_url = ""
                if img_el:
                    src = img_el.get_attribute("src")
                    if src and not src.startswith("http"):
                        src = "https://www.coto.com.ar" + src.replace("../", "/")
                    logo_url = src
                medio_pago = infer_medio_pago(logo_url) or ""
                if medio_pago:
                    register_logo(logo_url, medio_pago)

                # Legales
                text_el = tarjeta.query_selector("div.alt-font.text-medium-gray.text-extra-small")
                text = limpiar_texto(text_el.inner_text()) if text_el else ""
                tope = ""
                if "Tope" in text or "tope" in text or "Reintegro" in text:
                    tope = text.strip()
                else:
                    detalle = f"{detalle} {text}".strip()

                promociones.append(
                    {
                        "logo": logo_url,
                        "medio_pago": medio_pago,
                        "descuento": descuento,
                        "tope": tope,
                        "detalles": detalle,
                        "aplica_en": "",
                        "legales": "https://www.coto.com.ar/legales/",
                    }
                )
            except Exception as e:
                print(f"Error procesando tarjeta: {e}")

        navegador.close()
        return promociones

if __name__ == "__main__":
    promos = obtener_promociones_coto()
    resultado = {
        "supermarket": "COTO",
        "discounts": promos
    }

    with open("promociones_coto_2.json", "w", encoding="utf-8") as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)

    print("Archivo promociones_coto_2.json generado correctamente.")
