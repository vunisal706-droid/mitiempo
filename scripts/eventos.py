"""Genera eventos.json con planes de Granada y su provincia.
Fuentes: agenda del Patronato de Turismo de Granada (turgranada.es) y agenda
de la Junta de Andalucía (datos abiertos). Se ejecuta cada día en GitHub Actions."""
import json, re, html, datetime, unicodedata, urllib.request, urllib.parse, sys

HOY = datetime.date.today()
LIMITE = HOY + datetime.timedelta(days=60)
UA = {'User-Agent': 'Mozilla/5.0 (MiTiempo PWA; agenda de planes)'}
MESES = {'ene':1,'feb':2,'mar':3,'abr':4,'may':5,'jun':6,'jul':7,'ago':8,'sep':9,'set':9,'oct':10,'nov':11,'dic':12}
RANGO = re.compile(r'(\d{1,2})\s+([a-zA-Zé]{3,4})\.?\s+(\d{4})\s+a\s+(\d{1,2})\s+([a-zA-Zé]{3,4})\.?\s+(\d{4})', re.I)

def get(url, binary=False):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=40) as r:
        b = r.read()
    return b if binary else b.decode('utf-8', 'replace')

def norm(t):
    return unicodedata.normalize('NFD', t.lower()).encode('ascii', 'ignore').decode()

def fecha(d, m, y):
    return datetime.date(int(y), MESES[norm(m)[:3]], int(d))

def limpia(t, n=None):
    t = re.sub(r'<[^>]+>', ' ', t or '')
    t = re.sub(r'\s+', ' ', html.unescape(t)).strip()
    if n and len(t) > n:
        t = t[:n].rsplit(' ', 1)[0] + '…'
    return t

TIPOS = [
    ('fiesta',     r'fiesta|feria|romeria|verbena|carnaval|semana santa|navidad|cabalgata|zambomba|patronal'),
    ('teatro',     r'teatro|humor|danza|ballet|circo|magia|monologo|espectaculo|cine'),
    ('musica',     r'concierto|musica|music|festival|banda|orquesta|flamenco|jazz|coro|sinfonic|recital'),
    ('ninos',      r'infantil|ninos|ninas|familia|hinchable|titeres|cuentacuentos'),
    ('naturaleza', r'bosque|ruta|sendero|senderismo|voluntariado|naturaleza|parque natural|observacion|ecosistema|aves|astronom|estrellas|setas'),
    ('mercado',    r'mercado|mercadillo|gastronom|degustacion|vino|tapa|artesania'),
    ('deporte',    r'carrera|maraton|trail|ciclis|deport|torneo'),
    ('expo',       r'exposicion|centenario|patrimonio|ciencia|muestra|retrato|museo|pintura|fotograf|escultura|arte|dibujo|coleccion'),
]
def tipo(t):
    n = norm(t)
    for k, rx in TIPOS:
        if re.search(rx, n):
            return k
    return 'cultura'

# Lo que no es un plan para el finde (jornadas técnicas, cursos, convocatorias…)
NO = re.compile(r'jornada tecnica|riesgo|amianto|formacion|curso|convocatoria|subvencion|webinar|seminario|prevencion|laboral|oposicion|licitacion', re.I)

# ---------- 1) Patronato de Turismo de Granada (la página se pinta con JavaScript) ----------
def turgranada():
    from playwright.sync_api import sync_playwright
    out = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(locale='es-ES')
        pg.goto('https://www.turgranada.es/agenda/', wait_until='networkidle', timeout=90000)
        for _ in range(6):  # por si carga más al hacer scroll
            pg.mouse.wheel(0, 4000); pg.wait_for_timeout(800)
        cards = pg.evaluate(r'''() => {
          const rx = /\d{1,2}\s+[a-zA-Zé]{3,4}\.?\s+\d{4}\s+a\s+\d{1,2}\s+[a-zA-Zé]{3,4}\.?\s+\d{4}/;
          const seen = new Set(), out = [];
          document.querySelectorAll('a[href*="/eventos/"]').forEach(a => {
            let el = a, k = 0;
            while (el && k < 8 && !(rx.test(el.innerText || '') && (el.innerText || '').length < 700)) { el = el.parentElement; k++; }
            if (!el || seen.has(el)) return; seen.add(el);
            const img = el.querySelector('img');
            out.push({href: a.href, text: el.innerText, img: img ? (img.currentSrc || img.src) : ''});
          });
          return out;
        }''')
        b.close()
    for c in cards:
        lines = [l.strip() for l in c['text'].split('\n') if l.strip() and l.strip() not in ('poi-image', '[object Object]')]
        di = next((i for i, l in enumerate(lines) if RANGO.search(l)), None)
        if di is None:
            continue
        m = RANGO.search(lines[di])
        try:
            desde, hasta = fecha(*m.group(1, 2, 3)), fecha(*m.group(4, 5, 6))
        except Exception:
            continue
        titulo = ' '.join(lines[:di]).strip() or c['href'].rstrip('/').split('/')[-1].replace('-', ' ').capitalize()
        resto = [l for l in lines[di+1:] if len(l) < 45]
        lugar = resto[0] if resto else 'Granada'
        out.append({'t': limpia(titulo, 110), 'desde': desde, 'hasta': hasta, 'lugar': lugar,
                    'img': c['img'] if c['img'].startswith('http') and 'flags' not in c['img'] else '',
                    'generico': bool(re.match(r'agenda', norm(titulo))), 'fuente': 'turgranada'})
    return out

# ---------- 2) Agenda de la Junta de Andalucía (datos abiertos) ----------
def junta():
    q = urllib.parse.urlencode({'province': 'Granada', 'organism': '-', 'theme': '-', 'order_by': 'start_date_registration',
                                'mode': 'DESC', 'size': 150, 'format': 'json'})
    data = json.loads(get('https://datos.juntadeandalucia.es/api/v0/schedule/search?' + q))
    if isinstance(data, dict):
        data = next((v for v in data.values() if isinstance(v, list)), [])
    out = []
    for e in data:
        t = limpia(e.get('title'))
        if not t or NO.search(norm(t)):
            continue
        fs = e.get('date_registration') or []
        try:
            ini = min(datetime.date.fromisoformat(f['start_date_registration']) for f in fs)
            fin = max(datetime.date.fromisoformat(f.get('end_date_registration') or f['start_date_registration']) for f in fs)
        except Exception:
            continue
        lugar = limpia(e.get('location') or '').title() or 'Granada'
        hora = limpia(e.get('schedule') or '', 40)
        out.append({'t': limpia(t, 110), 'desde': ini, 'hasta': fin, 'lugar': lugar,
                    'hora': hora if re.search(r'\d', hora) else '', 'precio': limpia(e.get('cost') or '', 40),
                    'desc': limpia(e.get('description') or '', 170), 'img': '', 'generico': False, 'fuente': 'junta'})
    return out

# ---------- Coordenadas de cada municipio (para calcular la distancia) ----------
GEO = {}
def coords(lugar):
    k = norm(lugar)
    if k in GEO:
        return GEO[k]
    res = None
    try:
        j = json.loads(get('https://geocoding-api.open-meteo.com/v1/search?' + urllib.parse.urlencode(
            {'name': lugar, 'count': 10, 'language': 'es', 'countryCode': 'ES'})))
        for r in j.get('results') or []:
            if norm(r.get('admin2', '')) == 'granada':
                res = (round(r['latitude'], 4), round(r['longitude'], 4)); break
    except Exception:
        pass
    GEO[k] = res
    return res

def main():
    eventos, errores = [], []
    for nombre, f in (('turgranada', turgranada), ('junta', junta)):
        try:
            r = f(); eventos += r; print(f'{nombre}: {len(r)} eventos')
        except Exception as ex:
            errores.append(nombre); print(f'{nombre}: ERROR {ex}', file=sys.stderr)
    final, vistos = [], set()
    for e in eventos:
        if e['hasta'] < HOY or e['desde'] > LIMITE:
            continue
        clave = norm(e['t'])[:40]
        if clave in vistos:
            continue
        vistos.add(clave)
        c = coords(e['lugar'])
        e.update({'desde': e['desde'].isoformat(), 'hasta': e['hasta'].isoformat(), 'tipo': tipo(e['t'] + ' ' + e.get('desc', '')),
                  'lat': c[0] if c else None, 'lon': c[1] if c else None})
        final.append({k: v for k, v in e.items() if v not in ('', None, False) or k in ('lat', 'lon')})
    final.sort(key=lambda e: e['desde'])
    if not final and errores:
        print('Sin datos nuevos: se mantiene el eventos.json anterior'); return
    with open('eventos.json', 'w', encoding='utf-8') as fh:
        json.dump({'actualizado': datetime.datetime.now().isoformat(timespec='minutes'), 'eventos': final}, fh, ensure_ascii=False, indent=1)
    print(f'eventos.json: {len(final)} eventos')

if __name__ == '__main__':
    main()
