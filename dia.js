/* Mi Tiempo · «Un día a fondo»: se elige cualquier día de la previsión (hasta 16 días) y sale toda la
   información posible de ese día con gráficas hora a hora. Solo se descarga y se dibuja si se pide. */
(function(){
  const MAXD = 15;                         // Open-Meteo da 16 días (hoy + 15)
  const C1 = '#2a78d6', C2 = '#eb6834', C3 = '#1baf7a', C4 = '#6250d6', GRID = '#e2e8f0', INK = '#475569';
  const pad2 = n => String(n).padStart(2,'0');
  const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; };
  const masDias = (ds, n) => { const d = new Date(ds+'T12:00'); d.setDate(d.getDate()+n); return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; };
  const MES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const largo = ds => { const d = new Date(ds+'T12:00'); return `${DAYS[d.getDay()]} ${d.getDate()} de ${MES[d.getMonth()]}`; };
  const r0 = v => v==null||isNaN(v) ? '—' : Math.round(v);
  const r1 = v => v==null||isNaN(v) ? '—' : (Math.round(v*10)/10).toLocaleString('es-ES');
  const hm = iso => iso ? iso.slice(11,16) : '—';
  const dur = s => { if (s==null) return '—'; const h = Math.floor(s/3600), m = Math.round((s%3600)/60); return `${h} h ${pad2(m)} min`; };

  // ---------- estilos ----------
  const css = document.createElement('style');
  css.textContent = `
  .dia-pick{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end}
  .dia-pick input{font:inherit;font-weight:700;border:2px solid #bae6fd;border-radius:12px;min-height:44px;padding:0 10px;background:#fff;color:#0f172a;width:100%}
  .dia-chips{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;margin-bottom:6px;scrollbar-width:thin}
  .dia-chips button{flex:0 0 auto;border:2px solid #e0f2fe;background:#fff;border-radius:12px;font:inherit;font-weight:800;font-size:.8rem;padding:4px 9px;cursor:pointer;color:#0369a1;line-height:1.2}
  .dia-chips button small{display:block;font-weight:700;color:#64748b;font-size:.72rem}
  .dia-chips button[aria-current=true]{background:#0284c7;color:#fff;border-color:#0284c7}
  .dia-chips button[aria-current=true] small{color:#e0f2fe}
  .dia-top{display:flex;gap:14px;align-items:center}
  .dia-top .ico{font-size:3.4rem;line-height:1}
  .dia-top .t{font-size:2.2rem;font-weight:900;line-height:1}
  .dia-top .t em{font-style:normal;color:#64748b;font-size:1.4rem}
  .dia-top .d{font-weight:800;color:#334155}
  .dia-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
  .dia-grid .stat b{font-size:1rem}
  .dia-mom{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  .dia-mom div{background:#fff;border-radius:14px;padding:8px 4px;text-align:center;font-size:.8rem;font-weight:700;color:#475569}
  .dia-mom b{display:block;font-size:1.1rem;color:#0f172a}
  .dia-mom .i{font-size:1.6rem;line-height:1.3}
  .dia-ch{position:relative;background:#fff;border-radius:14px;padding:8px 6px 4px}
  .dia-ch svg{display:block;width:100%;height:auto;touch-action:pan-y}
  .dia-ch .tip{position:absolute;top:6px;pointer-events:none;background:#0f172a;color:#fff;border-radius:10px;padding:6px 9px;font-size:.78rem;font-weight:700;line-height:1.35;white-space:nowrap;display:none;z-index:2;box-shadow:0 6px 16px rgba(0,0,0,.2)}
  .dia-ch .tip i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:5px;vertical-align:-1px}
  .dia-leg{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:.8rem;font-weight:800;color:#475569;margin:0 0 6px 4px}
  .dia-leg i{display:inline-block;width:14px;height:4px;border-radius:2px;margin-right:6px;vertical-align:middle}
  .dia-sum{font-size:.86rem;color:#334155;font-weight:700;margin:8px 4px 0}
  .dia-tab{width:100%;border-collapse:collapse;font-size:.8rem;background:#fff;border-radius:14px;overflow:hidden}
  .dia-tab th,.dia-tab td{padding:6px 4px;text-align:center;border-bottom:1px solid #f1f5f9;white-space:nowrap}
  .dia-tab th{background:#f0f9ff;color:#0369a1;font-weight:900;position:sticky;top:0}
  .dia-scroll{overflow-x:auto;border-radius:14px}
  .dia-pol{display:grid;grid-template-columns:1fr auto;gap:6px 10px;font-size:.88rem;font-weight:700}
  .dia-pol span.lv{border-radius:999px;padding:1px 9px;font-size:.78rem;font-weight:900}
  .dia-back{margin-bottom:12px}
  .dia-sun{display:flex;align-items:center;gap:12px}
  .dia-sun svg{flex:0 0 160px}
  @media(max-width:520px){.dia-grid{grid-template-columns:repeat(2,1fr)}.dia-mom{grid-template-columns:repeat(2,1fr)}.dia-sun{flex-direction:column}}
  `;
  document.head.appendChild(css);

  // ---------- tarjeta para elegir el día (en cada localidad) ----------
  window.diaPickerHtml = function(p){
    const hoy = hoyISO(), max = masDias(hoy, MAXD);
    const chips = Array.from({length:MAXD+1}, (_,k)=>{ const ds = masDias(hoy,k), d = new Date(ds+'T12:00');
      return `<button type="button" data-dia="${ds}">${k===0?'Hoy':k===1?'Mañana':DAYS[d.getDay()].slice(0,3)}<small>${d.getDate()} ${MES[d.getMonth()].slice(0,3)}</small></button>`; }).join('');
    return `<section class="card"><h2>📅 Un día a fondo</h2>
      <p style="font-size:.88rem;color:#475569;font-weight:700;margin:-4px 0 10px">Elige un día de los próximos ${MAXD+1} y verás todo: gráficas hora a hora, lluvia, viento, nubes, sol, aire${p.sea?', mar':''}…</p>
      <div class="dia-chips">${chips}</div>
      <div class="dia-pick"><label class="lab" for="diaFecha">O elige la fecha<input type="date" id="diaFecha" min="${hoy}" max="${max}" value="${hoy}"></label>
      <button class="btn ok-b" type="button" onclick="abrirDia('${p.id}', document.getElementById('diaFecha').value)">Ver el día</button></div></section>`;
  };
  document.addEventListener('click', e => { const b = e.target.closest('.dia-chips button[data-dia]'); if (!b) return;
    const t = document.getElementById('tabs'), sel = t && t.querySelector('.tab[aria-selected=true]'); abrirDia(sel ? sel.dataset.id : current, b.dataset.dia); });

  // ---------- datos ----------
  const H = ['temperature_2m','apparent_temperature','dew_point_2m','relative_humidity_2m','precipitation_probability','precipitation','rain','showers','snowfall',
    'weather_code','cloud_cover','cloud_cover_low','cloud_cover_mid','cloud_cover_high','pressure_msl','wind_speed_10m','wind_gusts_10m','wind_direction_10m',
    'uv_index','visibility','is_day','sunshine_duration','shortwave_radiation','freezing_level_height','cape'];
  const D = ['weather_code','temperature_2m_max','temperature_2m_min','apparent_temperature_max','apparent_temperature_min','sunrise','sunset','daylight_duration',
    'sunshine_duration','uv_index_max','precipitation_sum','rain_sum','snowfall_sum','precipitation_hours','precipitation_probability_max','wind_speed_10m_max',
    'wind_gusts_10m_max','wind_direction_10m_dominant','shortwave_radiation_sum'];
  const AQ = ['european_aqi','pm10','pm2_5','dust','ozone','nitrogen_dioxide','alder_pollen','birch_pollen','grass_pollen','mugwort_pollen','olive_pollen','ragweed_pollen'];
  const J = u => fetch(u, {cache:'no-store'}).then(r => { if (!r.ok) throw r.status; return r.json(); });
  async function datos(p, ds){
    const q = `latitude=${p.lat}&longitude=${p.lon}&timezone=${encodeURIComponent(TZ)}&start_date=${ds}&end_date=${ds}`;
    const reqs = [
      J(`https://api.open-meteo.com/v1/forecast?${q}&hourly=${H.join(',')}&daily=${D.join(',')}`),
      J(`https://air-quality-api.open-meteo.com/v1/air-quality?${q}&hourly=${AQ.join(',')}`).catch(()=>null)];
    if (p.sea) reqs.push(J(`https://marine-api.open-meteo.com/v1/marine?latitude=${p.sea.lat}&longitude=${p.sea.lon}&timezone=${encodeURIComponent(TZ)}&start_date=${ds}&end_date=${ds}&hourly=wave_height,wave_period,wave_direction,sea_surface_temperature`).catch(()=>null));
    const [w, a, m] = await Promise.all(reqs);
    return {w, a, m};
  }

  // ---------- gráficas SVG (una escala por gráfica, con tooltip) ----------
  const STORE = {}; let NID = 0;
  function niceRange(min, max, zero){
    if (zero) min = Math.min(0, min);
    if (min === max){ max = min + 1; min = zero ? 0 : min - 1; }
    const span = max - min, step0 = span / 4, mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const step = [1,2,2.5,5,10].map(x=>x*mag).find(x=>x>=step0) || step0;
    return {lo: Math.floor(min/step)*step, hi: Math.ceil(max/step)*step, step};
  }
  function chart(o){
    // o: {labels[], series:[{n,c,v[],t:'line'|'bar'|'area'}], unit, dec, zero, max, min, colorsBar(v)}
    const id = 'dch'+(++NID), W = 520, Hh = o.h || 200, L = 40, R = 10, T = 12, B = 26, n = o.labels.length;
    const vals = o.series.flatMap(s=>s.v.filter(v=>v!=null));
    if (!vals.length) return '';
    let {lo, hi, step} = niceRange(o.min!=null ? Math.min(o.min, ...vals) : Math.min(...vals), o.max!=null ? Math.max(o.max, ...vals) : Math.max(...vals), o.zero);
    const sw = (W-L-R)/n, X = i => L + (i+.5)*sw, Y = v => T + (hi - v)/(hi - lo)*(Hh-T-B);
    let g = '';
    for (let v = lo; v <= hi + 1e-9; v += step){ const y = Y(v);
      g += `<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="${GRID}" stroke-width="1"/><text x="${L-6}" y="${y+4}" text-anchor="end" font-size="13" fill="${INK}" font-weight="700">${(Math.round(v*100)/100).toLocaleString('es-ES')}</text>`; }
    for (let i = 0; i < n; i += 3) g += `<text x="${X(i)}" y="${Hh-7}" text-anchor="middle" font-size="13" fill="${INK}" font-weight="700">${o.labels[i]}</text>`;
    if (o.ahora != null) g += `<line x1="${X(o.ahora)}" x2="${X(o.ahora)}" y1="${T}" y2="${Hh-B}" stroke="#94a3b8" stroke-dasharray="3 3"/><text x="${X(o.ahora)+4}" y="${T+10}" font-size="12" fill="#64748b" font-weight="800">ahora</text>`;
    const bars = o.series.filter(s=>s.t==='bar'), nb = bars.length;
    o.series.forEach((s, k) => {
      if (s.t === 'bar'){
        const bi = bars.indexOf(s), bw = Math.max(2, sw*0.7/nb - 2), y0 = Y(Math.max(lo,0));
        s.v.forEach((v,i)=>{ if (v==null || v===0) return; const x = X(i) - (sw*0.7)/2 + bi*(bw+2), y = Y(v), h = Math.max(1, y0 - y), r = Math.min(4, bw/2, h);
          const col = o.colorsBar ? o.colorsBar(v) : s.c;
          g += `<path d="M${x} ${y0} V${y+r} Q${x} ${y} ${x+r} ${y} H${x+bw-r} Q${x+bw} ${y} ${x+bw} ${y+r} V${y0} Z" fill="${col}"/>`; });
      } else {
        const pts = s.v.map((v,i)=>v==null?null:[X(i), Y(v)]).filter(Boolean);
        if (!pts.length) return;
        const d = 'M' + pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' L');
        if (s.t === 'area') g += `<path d="${d} L${pts[pts.length-1][0]} ${Y(Math.max(lo,0))} L${pts[0][0]} ${Y(Math.max(lo,0))} Z" fill="${s.c}" opacity=".16"/>`;
        g += `<path d="${d}" fill="none" stroke="${s.c}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"${s.dash?' stroke-dasharray="5 4"':''}/>`;
      }
    });
    // máximos/mínimos rotulados en la primera serie de línea
    const s0 = o.series.find(s=>s.t!=='bar');
    if (s0 && o.marcas !== false){ const v = s0.v; let iM = -1, im = -1;
      v.forEach((x,i)=>{ if (x==null) return; if (iM<0||x>v[iM]) iM=i; if (im<0||x<v[im]) im=i; });
      if (iM>=0) g += `<circle cx="${X(iM)}" cy="${Y(v[iM])}" r="4" fill="${s0.c}" stroke="#fff" stroke-width="2"/><text x="${X(iM)}" y="${Y(v[iM])-8}" text-anchor="middle" font-size="13" font-weight="900" fill="#0f172a">${fmt(v[iM], o.dec)}${o.unit}</text>`;
      if (im>=0 && im!==iM && o.min0lab!==false) g += `<circle cx="${X(im)}" cy="${Y(v[im])}" r="4" fill="${s0.c}" stroke="#fff" stroke-width="2"/><text x="${X(im)}" y="${Y(v[im])+16}" text-anchor="middle" font-size="13" font-weight="900" fill="#0f172a">${fmt(v[im], o.dec)}${o.unit}</text>`;
    }
    g += `<line class="cx" x1="0" x2="0" y1="${T}" y2="${Hh-B}" stroke="#0f172a" stroke-width="1" opacity="0"/>`;
    g += `<rect x="${L}" y="${T}" width="${W-L-R}" height="${Hh-T-B}" fill="transparent" class="hit"/>`;
    STORE[id] = {o, L, R, W, sw, X};
    const leg = o.series.length > 1 ? `<div class="dia-leg">${o.series.map(s=>`<span><i style="background:${s.c}"></i>${s.n}</span>`).join('')}</div>` : '';
    return `${leg}<div class="dia-ch" data-ch="${id}"><svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${o.series.map(s=>s.n).join(', ')} por horas">${g}</svg><div class="tip"></div></div>`;
  }
  const fmt = (v, dec) => v==null ? '—' : dec ? (Math.round(v*Math.pow(10,dec))/Math.pow(10,dec)).toLocaleString('es-ES') : Math.round(v).toLocaleString('es-ES');
  function hover(e){
    const box = e.target.closest('.dia-ch'); if (!box) return;
    const S = STORE[box.dataset.ch]; if (!S) return;
    const svg = box.querySelector('svg'), r = svg.getBoundingClientRect(), x = (e.clientX - r.left) * S.W / r.width;
    const i = Math.max(0, Math.min(S.o.labels.length-1, Math.floor((x - S.L) / S.sw)));
    const cx = svg.querySelector('.cx'); cx.setAttribute('x1', S.X(i)); cx.setAttribute('x2', S.X(i)); cx.setAttribute('opacity', '.35');
    const tip = box.querySelector('.tip');
    tip.innerHTML = `${S.o.labels[i]}:00<br>` + S.o.series.map(s=>`<i style="background:${S.o.colorsBar && s.t==='bar' ? S.o.colorsBar(s.v[i]) : s.c}"></i>${s.n}: <b>${fmt(s.v[i], S.o.dec)}${S.o.unit}</b>`).join('<br>') + (S.o.extra ? '<br>'+S.o.extra(i) : '');
    tip.style.display = 'block';
    const px = S.X(i) / S.W * r.width, tw = tip.offsetWidth;
    tip.style.left = Math.max(4, Math.min(r.width - tw - 4, px + 12)) + 'px';
  }
  function fuera(e){ const box = e.target.closest('.dia-ch'); if (!box) return;
    box.querySelector('.tip').style.display = 'none'; const cx = box.querySelector('.cx'); if (cx) cx.setAttribute('opacity','0'); }
  document.addEventListener('pointermove', hover);
  document.addEventListener('pointerdown', hover);
  document.addEventListener('pointerout', e => { if (e.target.classList && e.target.classList.contains('hit')) fuera(e); });

  // ---------- pequeñas piezas ----------
  const uvCol = v => v < 3 ? '#16a34a' : v < 6 ? '#eab308' : v < 8 ? '#f97316' : v < 11 ? '#dc2626' : '#7e22ce';
  const uvTxt = v => v < 3 ? 'bajo' : v < 6 ? 'moderado' : v < 8 ? 'alto' : v < 11 ? 'muy alto' : 'extremo';
  const aqiCol = v => v < 20 ? '#22c55e' : v < 40 ? '#84cc16' : v < 60 ? '#eab308' : v < 80 ? '#f97316' : v < 100 ? '#dc2626' : '#7e22ce';
  const aqiTxt = v => v < 20 ? 'buena' : v < 40 ? 'razonable' : v < 60 ? 'regular' : v < 80 ? 'mala' : v < 100 ? 'muy mala' : 'extrema';
  const flecha = deg => `<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" style="transform:rotate(${deg+180}deg)"><path d="M10 2 L15 14 L10 11 L5 14 Z" fill="#0369a1"/></svg>`;
  function fase(ds){ // fase lunar aproximada a mediodía
    const t = new Date(ds+'T12:00:00Z').getTime(), ref = Date.UTC(2000,0,6,18,14), syn = 29.530588853;
    const age = (((t - ref)/864e5) % syn + syn) % syn, f = age/syn, ilum = Math.round((1 - Math.cos(2*Math.PI*f))/2*100);
    const N = [['🌑','Luna nueva'],['🌒','Creciente'],['🌓','Cuarto creciente'],['🌔','Gibosa creciente'],['🌕','Luna llena'],['🌖','Gibosa menguante'],['🌗','Cuarto menguante'],['🌘','Menguante']];
    return {e:N[Math.round(f*8)%8][0], n:N[Math.round(f*8)%8][1], ilum};
  }
  function arcoSol(sr, ss, ds){
    const toMin = iso => +iso.slice(11,13)*60 + +iso.slice(14,16);
    const a = toMin(sr), b = toMin(ss); let sol = '';
    if (ds === hoyISO()){ const n = new Date(), m = n.getHours()*60+n.getMinutes();
      if (m > a && m < b){ const f = (m-a)/(b-a), ang = Math.PI*(1-f), x = 80 + 66*Math.cos(ang), y = 78 - 62*Math.sin(ang);
        sol = `<circle cx="${x}" cy="${y}" r="9" fill="#facc15" stroke="#f59e0b" stroke-width="2"/>`; } }
    return `<svg viewBox="0 0 160 96" width="160" height="96" aria-hidden="true"><path d="M14 78 A66 62 0 0 1 146 78" fill="none" stroke="#fcd34d" stroke-width="3" stroke-dasharray="4 5"/>
      <line x1="4" y1="78" x2="156" y2="78" stroke="#94a3b8" stroke-width="2"/>${sol}
      <text x="14" y="93" font-size="13" font-weight="800" fill="#475569" text-anchor="middle">${hm(sr)}</text><text x="146" y="93" font-size="13" font-weight="800" fill="#475569" text-anchor="middle">${hm(ss)}</text></svg>`;
  }
  const POL = {grass_pollen:'Gramíneas', olive_pollen:'Olivo', birch_pollen:'Abedul', alder_pollen:'Aliso', mugwort_pollen:'Artemisa', ragweed_pollen:'Ambrosía'};
  const polNiv = (k, v) => { const t = k==='grass_pollen' ? [5,20,50] : k==='olive_pollen' ? [20,100,400] : [10,50,200];
    return v < 1 ? ['Nada','#f1f5f9','#64748b'] : v < t[0] ? ['Bajo','#dcfce7','#166534'] : v < t[1] ? ['Moderado','#fef3c7','#92400e'] : v < t[2] ? ['Alto','#ffedd5','#9a3412'] : ['Muy alto','#fee2e2','#991b1b']; };

  // ---------- vista del día ----------
  window.abrirDia = async function(placeId, ds){
    const p = PLACES.find(x=>x.id===placeId) || PLACES[0];
    const hoy = hoyISO(); if (!ds || ds < hoy) ds = hoy; if (ds > masDias(hoy, MAXD)) ds = masDias(hoy, MAXD);
    const main = document.getElementById('main');
    main.innerHTML = '<div class="sk"></div><div class="sk"></div><div class="sk"></div>';
    window.scrollTo({top: main.offsetTop - 10, behavior: 'smooth'});
    let d;
    try { d = await datos(p, ds); } catch(e){
      main.innerHTML = `<button class="btn dia-back" onclick="show()">← Volver</button><div class="err">⚠️ No se han podido cargar los datos de ese día. Prueba otra vez.</div>`; return; }
    if (current !== placeId) return;
    main.innerHTML = vista(p, ds, d);
  };

  function vista(p, ds, {w, a, m}){
    const h = w.hourly, dd = w.daily, n = h.time.length, lab = h.time.map(t=>t.slice(11,13));
    const ahora = ds === hoyISO() ? new Date().getHours() : null;
    const [desc, ico] = wmo(dd.weather_code[0]);
    const sum = arr => arr.reduce((s,v)=>s+(v||0),0), mx = arr => Math.max(...arr.filter(v=>v!=null)), mn = arr => Math.min(...arr.filter(v=>v!=null));
    const hoy = hoyISO(), chips = Array.from({length:MAXD+1}, (_,k)=>{ const x = masDias(hoy,k), dt = new Date(x+'T12:00');
      return `<button type="button" data-dia="${x}" aria-current="${x===ds}">${k===0?'Hoy':k===1?'Mañana':DAYS[dt.getDay()].slice(0,3)}<small>${dt.getDate()} ${MES[dt.getMonth()].slice(0,3)}</small></button>`; }).join('');
    let o = `<button class="btn dia-back" onclick="show()">← Volver a ${esc(p.name)}</button><div class="dia-chips">${chips}</div>`;

    // Resumen
    const lluvia = dd.precipitation_sum[0] || 0, nieve = dd.snowfall_sum[0] || 0;
    o += `<section class="card"><h2>${esc(p.name)} · ${largo(ds)}</h2>
      <div class="dia-top"><div class="ico" aria-hidden="true">${ico}</div><div><div class="t">${r0(dd.temperature_2m_max[0])}° <em>${r0(dd.temperature_2m_min[0])}°</em></div>
      <div class="d">${desc}</div><div style="font-size:.85rem;color:#64748b;font-weight:700">Sensación de ${r0(dd.apparent_temperature_min[0])}° a ${r0(dd.apparent_temperature_max[0])}°</div></div></div>
      <div class="dia-grid">
        <div class="stat"><b>💧 ${dd.precipitation_probability_max[0] ?? 0}%</b><span>Prob. de lluvia</span></div>
        <div class="stat"><b>${r1(lluvia)} mm</b><span>Lluvia${dd.precipitation_hours[0]?` · ${r0(dd.precipitation_hours[0])} h`:''}</span></div>
        <div class="stat"><b>💨 ${r0(dd.wind_speed_10m_max[0])} km/h</b><span>Viento ${windDir(dd.wind_direction_10m_dominant[0])} · rachas ${r0(dd.wind_gusts_10m_max[0])}</span></div>
        <div class="stat"><b style="color:${uvCol(dd.uv_index_max[0]||0)}">☀️ ${r1(dd.uv_index_max[0])}</b><span>UV ${uvTxt(dd.uv_index_max[0]||0)}</span></div>
        <div class="stat"><b>${r0(mn(h.relative_humidity_2m))}–${r0(mx(h.relative_humidity_2m))}%</b><span>Humedad</span></div>
        <div class="stat"><b>${r0(sum(h.cloud_cover)/n)}%</b><span>Nubes (media)</span></div>
        ${nieve ? `<div class="stat"><b>❄️ ${r1(nieve)} cm</b><span>Nieve</span></div>` : ''}
        <div class="stat"><b>${r0(mn(h.pressure_msl))}–${r0(mx(h.pressure_msl))}</b><span>Presión (hPa)</span></div>
        <div class="stat"><b>${dur(dd.sunshine_duration[0])}</b><span>Horas de sol</span></div>
        <div class="stat"><b>${r1(dd.shortwave_radiation_sum[0])} MJ/m²</b><span>Radiación solar</span></div>
      </div></section>`;

    // Momentos del día
    const tramo = (a, b, nom) => { const ix = []; for (let i=a;i<=b;i++) if (i<n) ix.push(i);
      const t = ix.map(i=>h.temperature_2m[i]), pr = ix.map(i=>h.precipitation_probability[i]||0), c = ix.map(i=>h.weather_code[i]);
      const peor = c.reduce((x,y)=>y>x?y:x, 0), [ds2, ic] = wmo(peor, a>=21||b<=6);
      return `<div><span class="i" aria-hidden="true">${ic}</span>${nom}<b>${r0(Math.min(...t))}°–${r0(Math.max(...t))}°</b>💧${Math.max(...pr)}%</div>`; };
    o += `<section class="card"><h2>Por momentos del día</h2><div class="dia-mom">${tramo(0,6,'Madrugada')}${tramo(7,13,'Mañana')}${tramo(14,20,'Tarde')}${tramo(21,23,'Noche')}</div>`;
    // Qué me pongo ese día
    if (typeof wearAt === 'function' && typeof svg === 'function'){
      const mo = [[8,'A las 8'],[14,'A las 14'],[20,'A las 20']].map(([hh,t])=>{ const f = h.apparent_temperature[hh], wr = wearAt(f), wet = (h.precipitation_probability[hh]||0) >= 50;
        return `<div class="mom"><div class="mn">${t}</div><div class="mi">${svg(wr.k,52)}${wet?`<span class="mu">${svg('paraguas',30)}</span>`:''}</div><div class="mf">${r0(f)}°</div><div class="mw">${wr.t}</div></div>`; }).join('');
      o += `<h2 style="margin-top:14px">Qué ponerse</h2><div class="moments">${mo}</div>`;
    }
    o += `</section>`;

    // Temperatura
    o += `<section class="card"><h2>🌡️ Temperatura y sensación (°C)</h2>${chart({labels:lab, unit:'°', ahora,
      series:[{n:'Temperatura', c:C1, v:h.temperature_2m, t:'line'}, {n:'Sensación térmica', c:C2, v:h.apparent_temperature, t:'line', dash:true}]})}
      <p class="dia-sum">Máxima ${r0(dd.temperature_2m_max[0])}° y mínima ${r0(dd.temperature_2m_min[0])}°. Punto de rocío entre ${r0(mn(h.dew_point_2m))}° y ${r0(mx(h.dew_point_2m))}°.</p></section>`;

    // Lluvia
    o += `<section class="card"><h2>💧 Probabilidad de lluvia (%)</h2>${chart({labels:lab, unit:'%', zero:true, max:100, ahora, marcas:false,
      series:[{n:'Probabilidad', c:C1, v:h.precipitation_probability, t:'bar'}]})}`;
    if (sum(h.precipitation) > 0 || sum(h.snowfall) > 0){
      const ser = [{n:'Lluvia (mm)', c:C1, v:h.precipitation, t:'bar'}];
      if (sum(h.snowfall) > 0) ser.push({n:'Nieve (cm)', c:C4, v:h.snowfall, t:'bar'});
      o += `<h2 style="margin-top:14px">Cantidad por hora</h2>${chart({labels:lab, unit:'', dec:1, zero:true, ahora, series:ser})}`;
    }
    o += `<p class="dia-sum">${lluvia ? `Total previsto: ${r1(lluvia)} mm${nieve?` y ${r1(nieve)} cm de nieve`:''}.` : 'No se espera lluvia.'}</p></section>`;

    // Viento
    o += `<section class="card"><h2>💨 Viento y rachas (km/h)</h2>${chart({labels:lab, unit:'', zero:true, ahora,
      series:[{n:'Viento', c:C1, v:h.wind_speed_10m, t:'line'}, {n:'Rachas', c:C2, v:h.wind_gusts_10m, t:'line', dash:true}],
      extra:i=>`Dirección: ${windDir(h.wind_direction_10m[i])}`})}
      <div style="display:flex;justify-content:space-between;padding:6px 6px 0 40px">${lab.filter((_,i)=>i%3===0).map((l,k)=>`<div style="text-align:center;font-size:.7rem;font-weight:800;color:#475569">${flecha(h.wind_direction_10m[k*3])}<br>${windDir(h.wind_direction_10m[k*3])}</div>`).join('')}</div></section>`;

    // Nubes
    o += `<section class="card"><h2>☁️ Nubes (%)</h2>${chart({labels:lab, unit:'%', zero:true, max:100, ahora, marcas:false,
      series:[{n:'Bajas', c:C1, v:h.cloud_cover_low, t:'line'}, {n:'Medias', c:C2, v:h.cloud_cover_mid, t:'line'}, {n:'Altas', c:C3, v:h.cloud_cover_high, t:'line'}]})}</section>`;

    // Sol, UV y luna
    const lu = fase(ds);
    o += `<section class="card"><h2>☀️ Sol y luna</h2><div class="dia-sun">${arcoSol(dd.sunrise[0], dd.sunset[0], ds)}
      <div class="dia-grid" style="flex:1;margin-top:0">
        <div class="stat"><b>🌅 ${hm(dd.sunrise[0])}</b><span>Amanecer</span></div>
        <div class="stat"><b>🌇 ${hm(dd.sunset[0])}</b><span>Atardecer</span></div>
        <div class="stat"><b>${dur(dd.daylight_duration[0])}</b><span>De luz</span></div>
        <div class="stat"><b>${lu.e} ${lu.ilum}%</b><span>${lu.n}</span></div></div></div>
      <h2 style="margin-top:14px">Índice UV</h2>${chart({labels:lab, unit:'', dec:1, zero:true, ahora, marcas:false, colorsBar:v=>uvCol(v||0),
        series:[{n:'Índice UV', c:'#eab308', v:h.uv_index, t:'bar'}], extra:i=>`Nivel ${uvTxt(h.uv_index[i]||0)}`})}
      <h2 style="margin-top:14px">Radiación solar (W/m²)</h2>${chart({labels:lab, unit:'', zero:true, ahora, series:[{n:'Radiación', c:'#eab308', v:h.shortwave_radiation, t:'area'}]})}</section>`;

    // Humedad, presión y visibilidad
    o += `<section class="card"><h2>💦 Humedad relativa (%)</h2>${chart({labels:lab, unit:'%', zero:true, max:100, ahora, series:[{n:'Humedad', c:C1, v:h.relative_humidity_2m, t:'area'}]})}
      <h2 style="margin-top:14px">🧭 Presión (hPa)</h2>${chart({labels:lab, unit:'', ahora, series:[{n:'Presión', c:C4, v:h.pressure_msl, t:'line'}]})}
      <h2 style="margin-top:14px">👁️ Visibilidad (km)</h2>${chart({labels:lab, unit:' km', dec:1, zero:true, ahora, series:[{n:'Visibilidad', c:C3, v:h.visibility.map(v=>v==null?null:v/1000), t:'area'}]})}`;
    if (mx(h.cape) >= 300) o += `<h2 style="margin-top:14px">⛈️ Energía para tormentas (CAPE, J/kg)</h2>${chart({labels:lab, unit:'', zero:true, ahora, series:[{n:'CAPE', c:C2, v:h.cape, t:'area'}]})}<p class="dia-sum">Por encima de 1000 J/kg hay ambiente para tormentas.</p>`;
    if (mn(h.freezing_level_height) < 2500) o += `<h2 style="margin-top:14px">❄️ Cota de nieve aproximada (m)</h2>${chart({labels:lab, unit:' m', zero:true, ahora, series:[{n:'Nivel de congelación', c:C1, v:h.freezing_level_height, t:'line'}]})}`;
    o += `</section>`;

    // Aire y polen
    if (a && a.hourly && a.hourly.european_aqi && a.hourly.european_aqi.some(v=>v!=null)){
      const A = a.hourly, aq = A.european_aqi, top = mx(aq);
      o += `<section class="card"><h2>🌫️ Calidad del aire</h2><p class="dia-sum" style="margin:0 4px 8px">Peor momento: <b style="color:${aqiCol(top)}">${aqiTxt(top)}</b> (índice europeo ${r0(top)}).</p>
        ${chart({labels:lab, unit:'', zero:true, ahora, marcas:false, colorsBar:v=>aqiCol(v||0), series:[{n:'Índice de calidad', c:'#84cc16', v:aq, t:'bar'}], extra:i=>`Aire ${aqiTxt(aq[i]||0)}`})}
        <h2 style="margin-top:14px">Partículas y polvo (µg/m³)</h2>${chart({labels:lab, unit:'', zero:true, ahora, series:[{n:'PM10', c:C1, v:A.pm10, t:'line'}, {n:'PM2,5', c:C2, v:A.pm2_5, t:'line'}, {n:'Polvo (calima)', c:C3, v:A.dust, t:'line'}]})}`;
      const pol = Object.keys(POL).filter(k=>A[k] && A[k].some(v=>v!=null)).map(k=>{ const v = mx(A[k]), [t,bg,fg] = polNiv(k, v); return `<span>🌼 ${POL[k]}</span><span class="lv" style="background:${bg};color:${fg}">${t}</span>`; });
      if (pol.length) o += `<h2 style="margin-top:14px">Polen</h2><div class="dia-pol">${pol.join('')}</div>`;
      o += `</section>`;
    }

    // Mar
    if (m && m.hourly && m.hourly.wave_height && m.hourly.wave_height.some(v=>v!=null)){
      o += `<section class="card"><h2>🌊 Mar</h2>${chart({labels:lab, unit:' m', dec:1, zero:true, ahora, series:[{n:'Altura de ola', c:C1, v:m.hourly.wave_height, t:'area'}],
        extra:i=>`Periodo ${r0(m.hourly.wave_period[i])} s`})}
        <p class="dia-sum">Agua del mar: ${r0(mn(m.hourly.sea_surface_temperature))}°–${r0(mx(m.hourly.sea_surface_temperature))}°.</p></section>`;
    }

    // Tabla hora a hora
    let filas = '';
    for (let i = 0; i < n; i++){ const [, ic] = wmo(h.weather_code[i], !h.is_day[i]);
      filas += `<tr${i===ahora?' style="background:#fef9c3"':''}><td><b>${lab[i]}:00</b></td><td>${ic}</td><td><b>${r0(h.temperature_2m[i])}°</b></td><td>${r0(h.apparent_temperature[i])}°</td><td>${h.precipitation_probability[i]??0}%</td><td>${r1(h.precipitation[i])}</td><td>${r0(h.wind_speed_10m[i])} ${windDir(h.wind_direction_10m[i])}</td><td>${r0(h.wind_gusts_10m[i])}</td><td>${r0(h.relative_humidity_2m[i])}%</td><td>${r0(h.cloud_cover[i])}%</td><td>${r1(h.uv_index[i])}</td></tr>`; }
    o += `<section class="card"><details><summary style="cursor:pointer;font-weight:900;color:#0369a1">📋 Tabla hora a hora</summary><div class="dia-scroll" style="margin-top:10px"><table class="dia-tab">
      <thead><tr><th>Hora</th><th></th><th>Temp.</th><th>Sens.</th><th>Lluvia</th><th>mm</th><th>Viento</th><th>Rachas</th><th>Hum.</th><th>Nubes</th><th>UV</th></tr></thead><tbody>${filas}</tbody></table></div></details>
      <p class="dia-sum" style="margin-top:10px">Cuanto más lejos está el día, menos fiable es la previsión. Datos: Open-Meteo${a?' · Copernicus CAMS':''}.</p></section>`;
    o += `<button class="btn" style="width:100%" onclick="show()">← Volver a ${esc(p.name)}</button>`;
    return o;
  }
})();
