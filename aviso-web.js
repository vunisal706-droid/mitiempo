/* Tarjeta de avisos oficiales de AEMET para la web del CEIP Capitulaciones (Santa Fe).
   Uso en la web:  <div id="avisoAemet"></div>
                   <script src="https://vunisal706-droid.github.io/mitiempo/aviso-web.js" defer></script>
   Lee avisos.json (lo actualiza GitHub Actions cada media hora desde AEMET) y muestra solo
   los avisos que afectan a Santa Fe. Si no hay ninguno, enseña una línea verde discreta. */
(function(){
  var URL = 'https://vunisal706-droid.github.io/mitiempo/avisos.json';
  var LUGAR = {nombre:'Santa Fe', lat:37.1886, lon:-3.7185};
  var NIV = {1:'Amarillo', 2:'Naranja', 3:'Rojo'};
  var COL = {1:{b:'#eab308', f:'#fefce8', t:'#713f12', s:'#fde68a'}, 2:{b:'#f97316', f:'#fff7ed', t:'#7c2d12', s:'#fed7aa'}, 3:{b:'#dc2626', f:'#fef2f2', t:'#7f1d1d', s:'#fecaca'}};
  var TR = {
    es:{dias:['domingo','lunes','martes','miércoles','jueves','viernes','sábado'], hoy:'Hoy', man:'Mañana', de:'de', a:'a', niv:{1:'amarillo',2:'naranja',3:'rojo'}, tit:'Aviso {n} en Santa Fe', of:'AEMET · oficial', uno:'1 aviso activo', var:'{k} avisos activos', ok:'Sin avisos meteorológicos de AEMET para Santa Fe.', fu:'Fuente', zo:'zona', loc:'es-ES',
      fen:{lluv:'Lluvias',torm:'Tormentas',max:'Temperaturas máximas',min:'Temperaturas mínimas',vien:'Viento',niev:'Nieve',nieb:'Niebla',polv:'Polvo en suspensión',cost:'Fenómenos costeros'}, nivel:'nivel',
      c:{lluv:'Mejor chubasquero o impermeable: el paraguas no puede entrar en el colegio, se lo lleva la familia. Los días de lluvia, Infantil y el aula TEA entran por el patio de Infantil y Primaria sube directamente a clase.', calor:'Agua, gorra y ropa fresca. En el recreo buscamos la sombra.', frio:'Abrigad bien al alumnado: chaquetón, gorro y guantes.', vien:'Precaución en la entrada y la salida por el viento.', otro:'Seguid las indicaciones de AEMET y del centro.'}},
    en:{dias:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], hoy:'Today', man:'Tomorrow', de:'from', a:'to', niv:{1:'yellow',2:'orange',3:'red'}, tit:'{N} weather warning in Santa Fe', of:'AEMET · official', uno:'1 active warning', var:'{k} active warnings', ok:'No AEMET weather warnings for Santa Fe.', fu:'Source', zo:'area', loc:'en-GB',
      fen:{lluv:'Rain',torm:'Thunderstorms',max:'High temperatures',min:'Low temperatures',vien:'Wind',niev:'Snow',nieb:'Fog',polv:'Dust',cost:'Coastal events'}, nivel:'level',
      c:{lluv:'A raincoat is better: umbrellas are not allowed inside the school, the family takes it home. On rainy days, Infant and ASD classroom pupils go in through the Infant playground and Primary pupils go straight up to class.', calor:'Water, a cap and light clothes. At break time we look for shade.', frio:'Dress pupils warmly: coat, hat and gloves.', vien:'Take care at drop-off and pick-up because of the wind.', otro:'Follow AEMET and school instructions.'}},
    ar:{dias:['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'], hoy:'اليوم', man:'غدًا', de:'من', a:'إلى', niv:{1:'أصفر',2:'برتقالي',3:'أحمر'}, tit:'تنبيه {n} في سانتا في', of:'AEMET · رسمي', uno:'تنبيه واحد نشط', var:'{k} تنبيهات نشطة', ok:'لا توجد تنبيهات جوية من AEMET لسانتا في.', fu:'المصدر', zo:'المنطقة', loc:'ar',
      fen:{lluv:'أمطار',torm:'عواصف رعدية',max:'درجات حرارة مرتفعة',min:'درجات حرارة منخفضة',vien:'رياح',niev:'ثلوج',nieb:'ضباب',polv:'غبار',cost:'ظواهر ساحلية'}, nivel:'مستوى',
      c:{lluv:'الأفضل معطف واقٍ من المطر: لا يُسمح بإدخال المظلة إلى المدرسة، تأخذها العائلة. في أيام المطر يدخل تلاميذ رياض الأطفال وقسم التوحد من ساحة رياض الأطفال ويصعد تلاميذ الابتدائي مباشرة إلى القسم.', calor:'ماء وقبعة وملابس خفيفة. في الاستراحة نبحث عن الظل.', frio:'ألبسوا التلاميذ ملابس دافئة: معطف وقبعة وقفازات.', vien:'انتبهوا عند الدخول والخروج بسبب الرياح.', otro:'اتبعوا تعليمات AEMET والمدرسة.'}},
    ro:{dias:['duminică','luni','marți','miercuri','joi','vineri','sâmbătă'], hoy:'Azi', man:'Mâine', de:'de la', a:'la', niv:{1:'galben',2:'portocaliu',3:'roșu'}, tit:'Avertizare {n} în Santa Fe', of:'AEMET · oficial', uno:'1 avertizare activă', var:'{k} avertizări active', ok:'Fără avertizări meteo AEMET pentru Santa Fe.', fu:'Sursa', zo:'zona', loc:'ro-RO',
      fen:{lluv:'Ploi',torm:'Furtuni',max:'Temperaturi maxime',min:'Temperaturi minime',vien:'Vânt',niev:'Ninsoare',nieb:'Ceață',polv:'Praf',cost:'Fenomene costiere'}, nivel:'nivel',
      c:{lluv:'Mai bine pelerină de ploaie: umbrela nu are voie în școală, o ia familia. În zilele ploioase, grădinița și clasa TEA intră prin curtea grădiniței, iar elevii de la primar urcă direct în clasă.', calor:'Apă, șapcă și haine răcoroase. În pauză căutăm umbra.', frio:'Îmbrăcați copiii gros: geacă, căciulă și mănuși.', vien:'Atenție la intrare și la ieșire din cauza vântului.', otro:'Urmați indicațiile AEMET și ale școlii.'}}};
  function lang(){ var l = 'es'; try { l = (window.capiLang ? window.capiLang() : document.documentElement.lang) || 'es'; } catch(e){} l = String(l).slice(0,2); return TR[l] ? l : 'es'; }
  function tipo(f){ f = (f||'').toLowerCase();
    return /torment/.test(f)?'torm': /lluv|precip/.test(f)?'lluv': /máx|max/.test(f)?'max': /mín|min/.test(f)?'min': /niev|nev/.test(f)?'niev': /vient/.test(f)?'vien': /niebla/.test(f)?'nieb': /polvo|calima/.test(f)?'polv': /coster/.test(f)?'cost':''; }

  function esc(t){ return String(t||'').replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function dentro(lat, lon, p){ var ins = false;
    for (var i=0, j=p.length-1; i<p.length; j=i++){ var yi=p[i][0], xi=p[i][1], yj=p[j][0], xj=p[j][1];
      if (((yi>lat)!==(yj>lat)) && (lon < (xj-xi)*(lat-yi)/(yj-yi)+xi)) ins = !ins; }
    return ins; }
  function icono(f){ f = (f||'').toLowerCase();
    return /máx|max|calor/.test(f)?'🌡️': /mín|min|frío|frio/.test(f)?'🥶': /torment/.test(f)?'⛈️': /lluv|precip/.test(f)?'🌧️':
      /niev|nev/.test(f)?'❄️': /vient/.test(f)?'💨': /niebla/.test(f)?'🌫️': /polvo|calima/.test(f)?'🟤':'⚠️'; }
  // Consejo práctico para las familias según el fenómeno
  function consejo(tipos, X){
    if (tipos.indexOf('lluv')>=0 || tipos.indexOf('torm')>=0) return X.c.lluv;
    if (tipos.indexOf('max')>=0) return X.c.calor;
    if (tipos.indexOf('min')>=0 || tipos.indexOf('niev')>=0) return X.c.frio;
    if (tipos.indexOf('vien')>=0) return X.c.vien;
    return X.c.otro; }
  function cuando(ini, fin, X){
    if (!ini) return '';
    var d = new Date(ini), h = new Date(); h.setHours(0,0,0,0);
    var k = Math.round((new Date(d).setHours(0,0,0,0) - h)/864e5);
    var dia = k<=0 ? X.hoy : k===1 ? X.man : X.dias[d.getDay()].replace(/^./, function(c){ return c.toUpperCase(); });
    var hh = function(x){ return x.toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit', timeZone:'Europe/Madrid'}); };
    var txt = dia + ', ' + X.de + ' ' + hh(d);
    if (fin){ var e = new Date(fin); txt += ' ' + X.a + ' ' + (e.toDateString()===d.toDateString() ? hh(e) : X.dias[e.getDay()] + ' ' + hh(e)); }
    return txt; }

  function estilos(){
    if (document.getElementById('avisoAemetCss')) return;
    var s = document.createElement('style'); s.id = 'avisoAemetCss';
    s.textContent = '.aem{font-family:inherit;border-radius:16px;border:1.5px solid var(--s);border-left:7px solid var(--b);background:var(--f);color:var(--t);padding:14px 16px;margin:12px 0;box-shadow:0 6px 18px rgba(0,0,0,.06);text-align:left}'+
      '.aem-h{display:flex;gap:12px;align-items:center}.aem-i{font-size:2rem;line-height:1}.aem-t{font-weight:800;font-size:1.1rem}'+
      '.aem-s{font-size:.82rem;opacity:.85;margin-top:2px}.aem-b{display:inline-block;background:var(--b);color:#fff;border-radius:999px;padding:1px 9px;font-weight:800;font-size:.75rem;margin-right:6px}'+
      '.aem ul{list-style:none;margin:10px 0 0;padding:0}.aem li{background:rgba(255,255,255,.7);border-radius:10px;padding:8px 10px;margin-top:6px;line-height:1.4;font-size:.93rem}'+
      '.aem li b{display:block}.aem li span{font-size:.85rem;opacity:.85}.aem-c{margin-top:10px;font-size:.88rem;background:rgba(255,255,255,.55);border-radius:10px;padding:8px 10px}'+
      '.aem-n{margin-top:8px;font-size:.75rem;opacity:.75}.aem-n a{color:inherit}'+
      '.aem-ok{display:flex;gap:8px;align-items:center;border-radius:12px;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;padding:8px 12px;margin:12px 0;font-size:.9rem;font-family:inherit;text-align:left}';
    document.head.appendChild(s); }

  function pintar(caja, avisos){
    estilos();
    var L = lang(), X = TR[L], dir = L==='ar' ? ' dir="rtl" style="text-align:right"' : '';
    if (!avisos.length){
      caja.innerHTML = '<div class="aem-ok" role="status"'+dir+'>✅ <span>'+esc(X.ok)+'</span></div>';
      return; }
    var top = Math.max.apply(null, avisos.map(function(a){ return a.nivel; })), c = COL[top];
    var tipos = avisos.map(function(a){ return tipo(a.fenomeno); });
    var n = X.niv[top], tit = X.tit.replace('{n}', n).replace('{N}', n.replace(/^./, function(x){ return x.toUpperCase(); }));
    caja.innerHTML = '<div class="aem" role="alert"'+(L==='ar'?' dir="rtl"':'')+' style="--b:'+c.b+';--f:'+c.f+';--t:'+c.t+';--s:'+c.s+(L==='ar'?';text-align:right;border-left:1.5px solid var(--s);border-right:7px solid var(--b)':'')+'">'+
      '<div class="aem-h"><span class="aem-i" aria-hidden="true">'+icono(avisos[0].fenomeno)+'</span><div>'+
      '<div class="aem-t">'+esc(tit)+'</div>'+
      '<div class="aem-s"><span class="aem-b">'+esc(X.of)+'</span>'+esc(avisos.length===1?X.uno:X.var.replace('{k}', avisos.length))+'</div></div></div>'+
      '<ul>'+avisos.slice(0,4).map(function(a){
        var t = tipo(a.fenomeno), nom = t ? X.fen[t] + ' · ' + X.nivel + ' ' + X.niv[a.nivel] : a.fenomeno;
        return '<li><b>'+icono(a.fenomeno)+' '+esc(nom)+'</b>'+
          '<span>'+esc(cuando(a.inicio, a.fin, X))+(a.texto && L==='es'?' · '+esc(a.texto):'')+'</span></li>'; }).join('')+'</ul>'+
      '<div class="aem-c">💡 '+esc(consejo(tipos, X))+'</div>'+
      '<div class="aem-n">'+esc(X.fu)+': <a href="https://www.aemet.es/es/eltiempo/prediccion/avisos" target="_blank" rel="noopener">AEMET</a> · '+esc(X.zo)+' '+esc(avisos[0].zona)+'</div></div>';
  }

  function cargar(){
    var caja = document.getElementById('avisoAemet'); if (!caja) return;
    fetch(URL + '?_=' + Date.now(), {cache:'no-store'}).then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(j){
      var ahora = Date.now();
      var av = (j.avisos||[]).filter(function(a){
        if (a.fin && new Date(a.fin).getTime() < ahora) return false;
        return (a.poligonos||[]).some(function(p){ return dentro(LUGAR.lat, LUGAR.lon, p); });
      }).sort(function(a,b){ return b.nivel-a.nivel || String(a.inicio).localeCompare(String(b.inicio)); });
      pintar(caja, av);
    }).catch(function(){ caja.innerHTML = ''; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cargar); else cargar();
  document.addEventListener('capi:langchange', function(){ setTimeout(cargar, 50); });
  setInterval(cargar, 30*60*1000);
})();
