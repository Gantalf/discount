from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import hashlib
import json

def extract_promos_cordiez():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://www.cordiez.com.ar/medios-de-pago", timeout=60000)
        page.wait_for_selector("#prom-banc_dias_body", timeout=15000)
        html = page.content()
        browser.close()

    soup = BeautifulSoup(html, "html.parser")
    container = soup.select_one("#prom-banc_dias_body")
    dias = container.select(".prom-banc_dias_body_item")

    seen = set()
    discounts = []

    for dia in dias:
        promos = dia.select(".promo-banca-box__content")
        for promo in promos:
            metodo_pago = promo.select_one(".promo-banca-box__imgtitle")
            metodo_pago = metodo_pago.text.strip() if metodo_pago else ""

            descuento_num = promo.select_one(".promo-banca-box__title-num")
            descuento_txt = promo.select_one(".promo-banca-box__title-text_inner")
            descuento = f"{descuento_num.text.strip() if descuento_num else ''} {descuento_txt.text.strip() if descuento_txt else ''}".strip()

            bajadas = promo.select(".promo-banca-box__bajada")
            detalles = " ".join([b.text.strip() for b in bajadas if b.text.strip()])

            tope = detalles if "tope" in detalles.lower() else ""
            legales = "https://www.cordiez.com.ar/terminos-y-condiciones"

            # Hash para detectar duplicados
            uniq_key = hashlib.md5(f"{metodo_pago}-{descuento}-{tope}".encode()).hexdigest()
            if uniq_key in seen:
                continue
            seen.add(uniq_key)

            discounts.append({
                "medio_pago": metodo_pago,
                "descuento": descuento,
                "tope": "Para Cordiez este valor aparece en detalles",
                "detalles": detalles,
                "aplica_en": "No especifica",
                "legales": legales
            })

    return {
        "supermarket": "CORDIEZ",
        "discounts": discounts
    }

if __name__ == "__main__":
    result = extract_promos_cordiez()
    resultado = {
        "supermarket": "JUMBO",
        "discounts": result
    }
    with open("promociones_cordiez_2.json", "w", encoding="utf-8") as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)

    print("Archivo promociones_cordiez.json generado correctamente.")