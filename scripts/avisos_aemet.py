"""Descarga los avisos oficiales de AEMET (formato CAP) y genera avisos.json.
La clave se lee del secreto AEMET_API_KEY; nunca se escribe en el repositorio."""
import io, json, os, ssl, sys, tarfile, urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

KEY = os.environ.get("AEMET_API_KEY", "").strip()
AREAS = os.environ.get("AREAS", "61").split(",")
NS = {"c": "urn:oasis:names:tc:emergency:cap:1.2"}
NIVEL = {"amarillo": 1, "naranja": 2, "rojo": 3}

def get(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    try:
        return urllib.request.urlopen(req, timeout=60).read()
    except ssl.SSLError:
        # algunos servidores de AEMET tienen la cadena de certificados incompleta; los datos son públicos
        return urllib.request.urlopen(req, timeout=60, context=ssl._create_unverified_context()).read()

def param(info, name):
    for p in info.findall("c:parameter", NS):
        if (p.findtext("c:valueName", "", NS) or "").strip() == name:
            return (p.findtext("c:value", "", NS) or "").strip()
    return ""

def parse(xml_bytes):
    out = []
    root = ET.fromstring(xml_bytes)
    for info in root.findall("c:info", NS):
        if not (info.findtext("c:language", "", NS) or "").lower().startswith("es"):
            continue
        nivel = param(info, "AEMET-Meteoalerta nivel").lower()
        if nivel not in NIVEL:
            continue
        fen = param(info, "AEMET-Meteoalerta fenomeno")
        fen = fen.split(";", 1)[-1].strip() if fen else (info.findtext("c:event", "", NS) or "")
        for area in info.findall("c:area", NS):
            polys = []
            for pg in area.findall("c:polygon", NS):
                pts = []
                for pair in (pg.text or "").split():
                    try:
                        la, lo = pair.split(",")[:2]
                        pts.append([round(float(la), 4), round(float(lo), 4)])
                    except ValueError:
                        pass
                if len(pts) > 2:
                    polys.append(pts)
            out.append({
                "nivel": NIVEL[nivel],
                "fenomeno": fen,
                "zona": (area.findtext("c:areaDesc", "", NS) or "").strip(),
                "inicio": info.findtext("c:onset", "", NS) or info.findtext("c:effective", "", NS),
                "fin": info.findtext("c:expires", "", NS),
                "titulo": (info.findtext("c:headline", "", NS) or "").strip(),
                "texto": (info.findtext("c:description", "", NS) or "").strip()[:400],
                "poligonos": polys,
            })
    return out

def main():
    if not KEY:
        sys.exit("Falta el secreto AEMET_API_KEY")
    avisos = []
    for area in AREAS:
        meta = json.loads(get(f"https://opendata.aemet.es/opendata/api/avisos_cap/ultimoelaborado/area/{area.strip()}",
                              {"api_key": KEY, "cache-control": "no-cache"}).decode("utf-8", "replace"))
        if meta.get("estado") != 200 or not meta.get("datos"):
            print("AEMET:", meta.get("estado"), meta.get("descripcion")); continue
        raw = get(meta["datos"])
        try:
            with tarfile.open(fileobj=io.BytesIO(raw), mode="r:*") as tar:
                for m in tar.getmembers():
                    if m.isfile() and m.name.lower().endswith(".xml"):
                        avisos += parse(tar.extractfile(m).read())
        except tarfile.ReadError:
            avisos += parse(raw)  # a veces llega un único XML
    # quitar duplicados y los ya caducados
    now = datetime.now(timezone.utc)
    seen, final = set(), []
    for a in avisos:
        try:
            if a["fin"] and datetime.fromisoformat(a["fin"]) < now:
                continue
        except ValueError:
            pass
        k = (a["nivel"], a["fenomeno"], a["zona"], a["inicio"], a["fin"])
        if k not in seen:
            seen.add(k); final.append(a)
    final.sort(key=lambda a: (-a["nivel"], a["inicio"] or ""))
    with open("avisos.json", "w", encoding="utf-8") as f:
        json.dump({"fuente": "AEMET", "avisos": final}, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{len(final)} avisos guardados")

if __name__ == "__main__":
    main()
