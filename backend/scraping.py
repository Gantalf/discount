from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time

def extraer_texto_de_url(url: str) -> str:
    options = Options()
    options.add_argument("--headless")  # Ejecuta sin abrir ventana
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1920,1080")

    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        driver.get(url)
        time.sleep(5)  # Espera a que se cargue el JS
        texto = driver.find_element("tag name", "body").text
        driver.quit()
        return texto
    except Exception as e:
        print(f"Error con Selenium en {url}: {e}")
        return ""