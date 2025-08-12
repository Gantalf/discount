import json
from playwright.sync_api import sync_playwright
import time

def limpiar_texto(texto):
    return texto.replace("\\n", " ").replace("\\xa0", " ").strip()

def obtener_promociones_jumbo():
    promociones = []
    promociones_vistas = set()

    with sync_playwright() as p:
        navegador = p.chromium.launch(headless=False)
        pagina = navegador.new_page()

        for dia in range(1, 7):
            url = f"https://www.jumbo.com.ar/descuentos-del-dia?type=por-dia&day={dia}"
            pagina.goto(url, timeout=60000)
            pagina.wait_for_selector("li[class^='jumboargentinaio-store-theme-']")

            tarjetas = pagina.query_selector_all("li[class^='jumboargentinaio-store-theme-']")
            print(f"Día {dia}: {len(tarjetas)} tarjetas encontradas.")

            for tarjeta in tarjetas:
                try:
                    # Logo
                    logo_el = tarjeta.query_selector("img")
                    logo = logo_el.get_attribute("src") if logo_el else ""

                    # Descuento
                    descuento_el = tarjeta.query_selector("h4")
                    descuento = limpiar_texto(descuento_el.inner_text()) if descuento_el else ""

                    # Detalle
                    detalle_el = tarjeta.query_selector("h6")
                    detalle = limpiar_texto(detalle_el.inner_text()) if detalle_el else ""

                    # Info adicional (posible tope y días)
                    info_el = tarjeta.query_selector("p[class^='jumboargentinaio-store-theme']")
                    info = limpiar_texto(info_el.inner_text()) if info_el else ""

                    # Ver más → legales
                    boton = tarjeta.query_selector("div >> text='Ver más'")
                    legales = ""
                    if boton:
                        boton.click()
                        pagina.wait_for_selector("div.jumboargentinaio-store-theme-GIZVxZXl8Eov5s5D3zZRv p", timeout=10000)
                        legales_el = pagina.query_selector("div.jumboargentinaio-store-theme-GIZVxZXl8Eov5s5D3zZRv p")
                        if legales_el:
                            legales = limpiar_texto(legales_el.inner_text())
                        # Cerrar el legal (click fuera o scroll)
                        pagina.keyboard.press("Escape")
                        time.sleep(0.3)

                    clave = (logo, descuento, detalle, info)
                    if clave in promociones_vistas:
                        continue
                    promociones_vistas.add(clave)

                    promociones.append({
                        "logo": logo,
                        "descuento": descuento,
                        "tope": "Para Jumbo este valor aparece en detalles",
                        "detalles": f"{detalle} {info}".strip(),
                        "aplica_en": "",
                        "legales": legales
                    })
                except Exception as e:
                    print(f"Error procesando tarjeta: {e}")

        navegador.close()
        return promociones

if __name__ == "__main__":
    promos = obtener_promociones_jumbo()
    resultado = {
        "supermarket": "JUMBO",
        "discounts": promos
    }

    with open("promociones_jumbo_2.json", "w", encoding="utf-8") as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)

    print("Archivo promociones_jumbo_2.json generado correctamente.")