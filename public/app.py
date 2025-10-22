import requests
from bs4 import BeautifulSoup
import json
import time

BASE_URL = "https://www.mbi.com.br"
INDEX_URL = f"{BASE_URL}/mbi/biblioteca/simbolopedia/municipios-estado-mato-grosso-br/"
OUTPUT_FILE = "bandeiras_mt.json"

def get_html(url):
    """Faz requisição HTML simples com verificação de status."""
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        print(f"[ERRO] Falha ao acessar {url}: {e}")
        return None

def get_cidades_links():
    """Extrai os links de cada município da página principal do MBI."""
    html = get_html(INDEX_URL)
    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")
    links = []

    for a in soup.select("a[href*='/mbi/biblioteca/simbolopedia/municipio-']"):
        href = a.get("href")
        nome = a.text.strip().title()
        if "mato-grosso" in href or not href.startswith("/mbi/biblioteca/simbolopedia/municipio-"):
            continue
        full_link = BASE_URL + href
        links.append((nome, full_link))

    print(f"➡️ Encontradas {len(links)} cidades para processar.")
    return links

def get_bandeira_url(cidade_url):
    """Visita a página do município e tenta encontrar a URL da bandeira ou brasão."""
    html = get_html(cidade_url)
    if not html:
        return None

    soup = BeautifulSoup(html, "html.parser")
    img = soup.find("img", src=lambda s: s and "bandeira-mini" in s)
    if not img:
        img = soup.find("img", src=lambda s: s and "brasao-mini" in s)
    if img:
        return BASE_URL + img["src"]
    return None

def main():
    cidades = get_cidades_links()
    resultados = {}
    for i, (nome, link) in enumerate(cidades, start=1):
        print(f"[{i}/{len(cidades)}] Buscando imagem de {nome}...")
        url_img = get_bandeira_url(link)
        if url_img:
            resultados[nome] = url_img
            print(f"   ✅ {url_img}")
        else:
            print("   ⚠️ Nenhuma imagem encontrada.")
        time.sleep(1.2)  # evitar bloqueio

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(resultados, f, ensure_ascii=False, indent=2)

    print(f"\n🏁 Finalizado! {len(resultados)} bandeiras salvas em '{OUTPUT_FILE}'.")

if __name__ == "__main__":
    main()
