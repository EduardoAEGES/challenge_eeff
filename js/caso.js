/* =========================================================
   PANTALLA DEL CASO RAMIFICADO (niveles 5 a 7)
   Modos:
     competencia → 10 vidas, cronómetro, 1 comodín, resultado al servidor
     prueba      → igual que competencia, sin guardar (modo master)
     guiado      → clase con el docente: sin vidas ni cronómetro, comodín libre
   ========================================================= */
window.FC = window.FC || {};

FC.Caso = (() => {
  const $ = id => document.getElementById(id);
  const { fmt, fmtInd, esc, dot } = V;
  const LETRAS = 'ABCD';
  const dom = {};
  let s = null;
  let reloj = null;

  function init() {
    Object.assign(dom, {
      raiz: $('caso'), cuerpo: $('caso-cuerpo'), pie: $('caso-pie'), titulo: $('caso-titulo'), paso: $('caso-paso'), reloj: $('caso-reloj'),
      vidas: $('caso-vidas'), vidasNum: $('caso-vidas-num'), comodin: $('caso-comodin'),
      boton: $('caso-boton'), feedback: $('caso-feedback'), fbIcono: $('caso-fb-icono'), fbTitulo: $('caso-fb-titulo'), fbTexto: $('caso-fb-texto'), aviso: $('caso-aviso')
    });
    dom.boton.addEventListener('click', accion);
    dom.comodin.addEventListener('click', usarComodin);
    $('caso-salir').addEventListener('click', salir);
    document.addEventListener('keydown', e => {
      if (!s || dom.raiz.hidden || !$('modal').hidden) return;
      if (e.key === 'Enter') { e.preventDefault(); if (!dom.boton.disabled) accion(); return; }
      const n = Number(e.key);
      if (s.fase === 'pregunta' && n >= 1) dom.cuerpo.querySelectorAll('.opcion')[n - 1]?.click();
    });
  }

  /* opciones: { casoId, nivelN, etiqueta, modo, estado, alGuardar(estado), alTerminar(resultado), alCerrar(), podio() } */
  function abrir(opciones) {
    const caso = FC.CASOS[opciones.casoId];
    const modo = opciones.modo || 'competencia';
    const estado = opciones.estado || { elecciones: [], inicio: Date.now(), escenas: [], comodinUsado: false };
    s = { caso, opciones, modo, estado, fase: 'pregunta', seleccion: null, vidas: modo === 'guiado' ? null : FC.VIDAS_COMPETENCIA };
    dom.titulo.textContent = `${opciones.etiqueta || caso.titulo}${modo === 'prueba' ? ' · MODO PRUEBA' : modo === 'guiado' ? ' · CLASE GUIADA' : ''}`;
    dom.vidas.hidden = s.vidas == null;
    dom.reloj.hidden = modo === 'guiado';
    dom.raiz.hidden = false;
    document.body.style.overflow = 'hidden';
    clearInterval(reloj);
    if (modo !== 'guiado') { reloj = setInterval(pintarReloj, 1000); pintarReloj(); }
    pintar();
  }

  const segundos = () => Math.floor(((s.estado.fin || Date.now()) - s.estado.inicio) / 1000);
  function pintarReloj() {
    if (!s) return;
    const t = segundos();
    dom.reloj.textContent = `⏱️ ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  }

  const guardar = () => s.opciones.alGuardar?.(s.estado);
  const recorrido = () => FC.Motor.recorrer(s.caso, s.estado.elecciones, s.vidas);
  const comodinDisponible = () => s.modo === 'guiado' || !s.estado.comodinUsado;

  // Mientras toca analizar una decisión, la proyección muestra el escenario anterior a ella.
  function panelProyeccion(r) {
    const pendiente = r.pendiente ? s.caso.nodos[r.pendiente] : null;
    const oculta = pendiente?.tipo === 'analisis';
    const sim = oculta ? r.previa : r.actual;
    const ind = id => sim.ind.find(i => i.id === id);
    const fila = (nombre, valor, i) => `<div class="kpi"><small>${nombre}</small><b>${i ? dot(i.estado) : ''}${valor}</b></div>`;
    return `<aside class="proyeccion">
      <h3>📈 Proyección al cierre del año</h3>
      ${oculta ? '<div class="nota-oculta">La proyección se actualizará cuando respondas el análisis de tu última decisión.</div>' : ''}
      ${fila('Efectivo', fmt(sim.fin.caja))}
      ${fila('Utilidad neta', fmt(sim.er.utilidadNeta))}
      ${fila('Liquidez corriente', fmtInd(ind('liquidez')), ind('liquidez'))}
      ${fila('Endeudamiento', fmtInd(ind('endeudamiento')), ind('endeudamiento'))}
      ${fila('ROE', fmtInd(ind('roe')), ind('roe'))}
      ${sim.sobregiro ? `<div class="nota-oculta" style="color:var(--error-texto)">🚨 Sobregiro bancario proyectado de ${fmt(sim.sobregiro)}</div>` : ''}
      <p class="politicas">Ventas: ${POL_VENTAS[sim.politicas.ventas].nombre}<br>Compras: ${POL_COMPRAS[sim.politicas.compras].nombre}</p>
      <button class="btn btn-blanco btn-chico" id="caso-ver-estados">Ver estados financieros</button>
      <p class="aviso-caso">${esc(s.caso.aviso || '')}</p>
    </aside>`;
  }

  function pintarVidas(r) {
    if (s.vidas == null) return;
    dom.vidasNum.textContent = r.vidas;
  }

  function pintar() {
    const r = recorrido();
    pintarVidas(r);
    if (r.terminado) return final(r);
    const tarjeta = r.pasos.find(p => (p.nodo.tipo === 'escena' || p.nodo.tipo === 'explicacion') && !s.estado.escenas.includes(p.id));
    const respondidos = r.pasos.filter(p => p.eleccion != null).length;
    dom.paso.textContent = `Paso ${respondidos + 1}`;
    s.seleccion = null;
    limpiarFeedback();
    dom.comodin.hidden = true;

    let html;
    if (tarjeta) {
      s.fase = 'escena'; s.escenaId = tarjeta.id;
      const n = tarjeta.nodo;
      if (n.tipo === 'escena') {
        html = `<div class="contenido">
          <div class="ej-etiqueta">🎬 ${esc(n.titulo || 'Escena')}</div>
          <div class="escena"><div class="personaje">${n.personaje}</div><div class="burbuja"><small>${esc(n.nombre)}</small>${esc(n.texto)}</div></div>
          <div class="tarjeta"><p style="font-weight:600;line-height:1.55">${s.modo === 'guiado' ? 'Clase guiada: aquí no hay vidas ni puntaje.' : `Tienes <b>${FC.VIDAS_COMPETENCIA} vidas</b> ❤️ y <b>1 comodín</b> 🃏. Cada decisión es <b>definitiva</b>. Pierdes una vida por cada respuesta incorrecta o decisión de alto riesgo. Gana el mejor puntaje; el tiempo solo desempata.`}</p></div>
          <p class="aviso-caso">${esc(s.caso.aviso || '')}</p>
        </div>`;
      } else {
        html = `<div class="contenido">
          <div class="ej-etiqueta">💡 Explicación</div>
          <h1 class="ej-pregunta">${n.titulo}</h1>
          <div class="teoria-cabecera"><div class="mascota">👩🏻‍🏫</div><div class="burbuja">${n.intro}</div></div>
          <div class="teoria-puntos">${n.puntos.map(p => `<div class="tarjeta teoria-punto"><div class="emoji">${p.icono}</div><div><h4>${p.titulo}</h4><p>${p.texto}</p></div></div>`).join('')}</div>
        </div>`;
      }
      dom.boton.textContent = 'Continuar'; dom.boton.disabled = false;
      dom.aviso.hidden = true;
    } else {
      s.fase = 'pregunta';
      const n = s.caso.nodos[r.pendiente];
      const opciones = FC.Motor.opcionesDe(n);
      const etiqueta = { decision: '🧭 Decisión', analisis: '🔍 Analiza tu decisión', pregunta: '📘 Pregunta de concepto' }[n.tipo];
      const texto = n.texto || (n.tipo === 'analisis' ? 'Revisa lo que acabas de decidir antes de seguir.' : 'Una pregunta rápida antes de seguir.');
      const narrador = n.personaje ? `<div class="escena"><div class="personaje">${n.personaje}</div><div class="burbuja"><small>${esc(n.nombre)}</small>${esc(texto)}</div></div>` : '';
      html = `<div class="contenido">
        <div class="ej-etiqueta">${etiqueta}</div>
        ${narrador}
        <h1 class="ej-pregunta">${esc(n.pregunta)}</h1>
        <div class="opciones">${opciones.map((o, i) => `<button class="opcion" data-i="${i}"><span class="tecla">${LETRAS[i]}</span><span>${esc(o)}</span></button>`).join('')}</div>
        <div id="caso-ayuda"></div>
      </div>`;
      dom.boton.textContent = 'Confirmar'; dom.boton.disabled = true;
      dom.aviso.hidden = n.tipo !== 'decision';
      dom.comodin.hidden = !comodinDisponible();
    }
    dom.cuerpo.innerHTML = `<div class="caso-layout">${html}${panelProyeccion(r)}</div>`;
    dom.cuerpo.scrollTop = 0;
    dom.cuerpo.querySelectorAll('.opcion').forEach(b => b.addEventListener('click', () => {
      if (s.fase !== 'pregunta') return;
      seleccionar(Number(b.dataset.i));
      FC.Sonido.tap();
    }));
    $('caso-ver-estados').addEventListener('click', () => verEstados(r));
  }

  function seleccionar(i) {
    dom.cuerpo.querySelectorAll('.opcion').forEach(x => x.classList.toggle('seleccionada', Number(x.dataset.i) === i));
    s.seleccion = i;
    dom.boton.disabled = false;
  }

  function usarComodin() {
    if (!s || s.fase !== 'pregunta' || !comodinDisponible()) return;
    if (s.modo !== 'guiado' && !confirm('🃏 Tienes un solo comodín en este nivel. ¿Usarlo en esta pregunta?')) return;
    const r = recorrido();
    const nodo = s.caso.nodos[r.pendiente];
    if (s.modo !== 'guiado') { s.estado.comodinUsado = true; guardar(); }
    dom.comodin.hidden = true;
    FC.Sonido.comodin();
    const ayuda = $('caso-ayuda');
    if (nodo.tipo === 'decision') {
      const filas = nodo.opciones.map((op, i) => {
        const sim = FC.Motor.proyectar(s.caso, [...r.efectos, { titulo: op.texto, ...op.efecto }]);
        const ind = id => sim.ind.find(x => x.id === id);
        return `<tr><td><b>${LETRAS[i]}</b> · ${esc(op.texto)}</td><td class="num">${fmt(sim.fin.caja)}</td><td class="num">${fmt(sim.er.utilidadNeta)}</td>
          <td class="num">${dot(ind('liquidez').estado)}${fmtInd(ind('liquidez'))}</td><td class="num">${dot(ind('endeudamiento').estado)}${fmtInd(ind('endeudamiento'))}</td>
          <td class="num">${dot(ind('roe').estado)}${fmtInd(ind('roe'))}</td></tr>`;
      }).join('');
      ayuda.innerHTML = `<div class="comodin-caja"><b>🃏 Comodín: simulación de cada opción al cierre del año</b>
        <div class="table-wrap"><table><thead><tr><th>Opción</th><th class="num">Efectivo</th><th class="num">Utilidad</th><th class="num">Liquidez</th><th class="num">Endeud.</th><th class="num">ROE</th></tr></thead><tbody>${filas}</tbody></table></div>
        <small>Ojo: algunas opciones tienen riesgos que no se ven en los números.</small></div>`;
    } else {
      const correcta = nodo.tipo === 'analisis' ? FC.Motor.respuestaAnalisis(nodo, r.previa, r.actual) : nodo.correcta;
      seleccionar(correcta);
      dom.cuerpo.querySelectorAll('.opcion')[correcta].classList.add('comodin');
      ayuda.innerHTML = '<div class="comodin-caja"><b>🃏 Comodín usado:</b> la respuesta correcta quedó marcada. Confírmala para continuar.</div>';
    }
  }

  function accion() {
    if (!s) return;
    if (s.fase === 'cerrar') return cerrar();
    if (s.fase === 'escena') { s.estado.escenas.push(s.escenaId); guardar(); return pintar(); }
    if (s.fase === 'pregunta') return confirmar();
    if (s.fase === 'revisado') return pintar();
  }

  function confirmar() {
    if (s.seleccion == null) return;
    const antes = recorrido();
    const nodo = s.caso.nodos[antes.pendiente];
    s.estado.elecciones.push(s.seleccion);
    const r = recorrido();
    if (r.terminado) s.estado.fin = Date.now();
    guardar();
    s.fase = 'revisado';
    dom.aviso.hidden = true; dom.comodin.hidden = true;
    const paso = r.pasos.filter(p => p.eleccion != null).at(-1);
    dom.cuerpo.querySelectorAll('.opcion').forEach((b, i) => {
      b.disabled = true; b.classList.remove('seleccionada');
      if (nodo.tipo === 'decision') { if (i === s.seleccion) b.classList.add(paso.error ? 'incorrecta' : 'elegida'); }
      else if (i === paso.correcta) b.classList.add('correcta');
      else if (i === s.seleccion) b.classList.add('incorrecta');
    });
    if (paso.error && s.vidas != null) perderVida(r);
    if (nodo.tipo === 'decision') {
      const op = nodo.opciones[s.seleccion];
      if (paso.error) feedback('incorrecto', '⚠️', s.vidas != null ? 'Decisión de alto riesgo · −1 ❤️' : 'Decisión de alto riesgo', `${esc(op.consecuencia || '')}<br><b>Por qué:</b> ${esc(op.porque || '')}`);
      else { FC.Sonido.tap(); feedback('neutro', '📌', 'Decisión registrada', esc(op.consecuencia || '')); }
    } else {
      const ok = paso.acierto;
      if (ok) FC.Sonido.correcto();
      let texto;
      if (nodo.tipo === 'analisis') {
        const m = FC.Motor.METRICAS[nodo.metrica];
        const f = v => (['caja', 'utilidad'].includes(nodo.metrica) ? fmt(v) : fmtInd({ valor: v, fmt: nodo.metrica === 'liquidez' ? 'ratio' : 'pct' }));
        texto = `Proyección de ${m.nombre.toLowerCase()}: de <b>${f(m.valor(antes.previa))}</b> a <b>${f(m.valor(antes.actual))}</b>.${ok ? '' : ` La respuesta correcta era <b>${FC.Motor.OPC_ANALISIS[paso.correcta]}</b>. Repasa el nivel 4 (indicadores) y abre «Ver estados financieros» para ver por qué.`}`;
      } else {
        texto = `${ok ? '' : `La respuesta correcta era <b>${esc(nodo.opciones[paso.correcta])}</b>. `}${esc(nodo.explicacion || '')}`;
      }
      const titulo = ok ? (s.modo === 'guiado' ? '¡Correcto!' : '¡Correcto! +50 puntos') : (s.vidas != null ? 'No es correcto · −1 ❤️' : 'No es correcto');
      feedback(ok ? 'correcto' : 'incorrecto', ok ? '✅' : '❌', titulo, texto);
    }
    pintarVidas(r);
    dom.boton.textContent = r.terminado ? (r.sinVidas ? 'Ver resultado' : 'Ver resultado') : 'Continuar';
    dom.boton.disabled = false;
    dom.boton.focus();
  }

  function perderVida(r) {
    FC.Sonido.vida();
    dom.vidas.classList.remove('pierde'); void dom.vidas.offsetWidth; dom.vidas.classList.add('pierde');
    const flash = document.createElement('div');
    flash.className = 'flash-error';
    flash.innerHTML = `<span>−1 ❤️</span>`;
    document.body.append(flash);
    setTimeout(() => flash.remove(), 1100);
    if (r.vidas === 0) setTimeout(() => FC.Sonido.incorrecto(), 400);
  }

  function feedback(tipo, icono, titulo, texto) {
    dom.pie.classList.add(tipo);
    dom.fbIcono.textContent = icono;
    dom.fbTitulo.textContent = titulo;
    dom.fbTexto.innerHTML = texto;
    dom.feedback.hidden = false;
  }
  function limpiarFeedback() { dom.pie.classList.remove('correcto', 'incorrecto', 'neutro'); dom.feedback.hidden = true; }

  function verEstados(r, final = false) {
    const pendiente = r.pendiente ? s.caso.nodos[r.pendiente] : null;
    const sim = !final && pendiente?.tipo === 'analisis' ? r.previa : r.actual;
    FC.App.modal(`<h2 style="font-size:22px;font-weight:900;margin-bottom:12px">Estados financieros ${final ? 'al cierre del año' : 'proyectados al cierre'}</h2>${tablasEstados(sim)}`);
    activarTabs(document.getElementById('modal-contenido'));
  }

  function tablasEstados(sim) {
    const tabs = [
      ['esf', 'Situación financiera', V.tablaESF([{ titulo: 'Inicio del año', s: sim.ini }, { titulo: 'Cierre', s: sim.fin }], true)],
      ['er', 'Resultados (NIIF 18)', V.tablaER([{ titulo: 'Año', er: sim.er }])],
      ['efe', 'Flujos de efectivo (NIC 7)', V.tablaEFE([{ titulo: 'Año', efe: sim.efe }])],
      ['ecp', 'Cambios en el patrimonio', V.tablaECP(sim.ecp)],
      ['ind', 'Indicadores', V.tablaIndicadores([{ titulo: 'Inicio', ind: sim.indIni }, { titulo: 'Cierre', ind: sim.ind }])],
      ['diario', 'Libro diario', V.libroDiario(sim.asientos)]
    ];
    return `<div class="caja-tabs"><nav class="tabs">${tabs.map(([id, n], i) => `<button class="tab${i ? '' : ' activa'}" data-tab="${id}">${n}</button>`).join('')}</nav>
      ${tabs.map(([id, , html], i) => `<div class="tab-cuerpo" data-cuerpo="${id}"${i ? ' hidden' : ''}>${html}</div>`).join('')}</div>`;
  }

  function activarTabs(raiz) {
    raiz.querySelectorAll('.caja-tabs').forEach(caja => caja.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
      caja.querySelectorAll('.tab').forEach(x => x.classList.toggle('activa', x === t));
      caja.querySelectorAll('.tab-cuerpo').forEach(c => (c.hidden = c.dataset.cuerpo !== t.dataset.tab));
    })));
  }

  function final(r) {
    clearInterval(reloj);
    const seg = segundos();
    const p = FC.Motor.puntaje(r);
    const resultado = { elecciones: s.estado.elecciones.slice(), segundos: seg, puntaje: p.total, vidas: r.vidas, comodin: Boolean(s.estado.comodinUsado), sinVidas: r.sinVidas };
    if (!s.estado.reportado) {
      s.estado.reportado = true; guardar();
      s.opciones.alTerminar?.(resultado);
      if (r.sinVidas) FC.Sonido.incorrecto(); else { FC.Sonido.completado(); FC.Leccion.confeti(); }
    }
    limpiarFeedback();
    dom.aviso.hidden = true; dom.comodin.hidden = true;
    dom.boton.textContent = 'Volver a la ruta'; dom.boton.disabled = false;
    s.fase = 'cerrar';
    const guiado = s.modo === 'guiado';
    const decisiones = r.pasos.filter(x => x.nodo.tipo === 'decision');
    const t = `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;
    dom.cuerpo.innerHTML = `<div class="contenido" style="width:min(980px,100%)">
      <div class="final${r.sinVidas ? ' mal' : ''}" style="padding:0">
        <div class="mascota">${r.sinVidas ? '💔' : guiado ? '👩🏻‍🏫' : '🏁'}</div>
        <h1>${r.sinVidas ? 'Te quedaste sin vidas' : guiado ? '¡Subnivel completado!' : '¡Caso completado!'}</h1>
        <p>${esc(s.caso.titulo)}${r.sinVidas ? '<br>El caso terminó aquí y se calificó con las decisiones que alcanzaste a tomar.' : ''}${s.modo === 'prueba' ? '<br><b>Modo prueba: este resultado no se guarda.</b>' : ''}</p>
        ${guiado ? '' : `<div class="resultados">
          <div class="resultado certus"><small>Puntaje</small><b>🏆 ${p.total}</b></div>
          <div class="resultado azul"><small>Tiempo</small><b>⏱️ ${t}</b></div>
          <div class="resultado"><small>Vidas</small><b>❤️ ${r.vidas}</b></div>
          <div class="resultado verde"><small>Aciertos</small><b>🎯 ${p.aciertos}/${p.preguntas}</b></div>
        </div>`}
        ${s.opciones.podio ? '<button class="btn btn-certus" id="caso-ver-podio">🏆 Ver podio de la final</button>' : ''}
        <p class="muted" id="caso-envio" style="font-size:14px"></p>
      </div>
      <div class="grid-2">
        ${guiado ? '' : `<div class="tarjeta"><h3 style="margin-bottom:8px">Cómo se calculó tu puntaje</h3>
          <table><tbody>${p.detalle.map(d => `<tr><td>${esc(d.motivo)}</td><td class="num ${d.puntos < 0 ? 'neg' : 'pos'}">${d.puntos > 0 ? '+' : ''}${d.puntos}</td></tr>`).join('')}
          <tr><td><b>Total</b></td><td class="num"><b>${p.total}</b></td></tr></tbody></table></div>`}
        <div class="tarjeta"><h3 style="margin-bottom:8px">Tus decisiones</h3>
          <ol style="margin:0;padding-left:20px;line-height:1.6;font-weight:600">${decisiones.map(d => `<li>${esc(d.nodo.opciones[d.eleccion].texto)}</li>`).join('') || '<li>—</li>'}</ol></div>
      </div>
      <div class="tarjeta"><h3 style="margin-bottom:8px">Estados financieros al cierre del año</h3>${tablasEstados(r.actual)}</div>
    </div>`;
    activarTabs(dom.cuerpo);
    $('caso-ver-podio')?.addEventListener('click', verPodio);
    dom.cuerpo.scrollTop = 0;
  }

  async function verPodio() {
    FC.App.modal('<p class="muted">Cargando el podio…</p>');
    try {
      const lista = await s.opciones.podio();
      FC.App.modal(FC.App.podioHTML(lista, 'Podio de la final'));
    } catch (e) { FC.App.modal(`<p class="mensaje-error">${esc(e.message)}</p>`); }
  }

  // Lo usa la app para mostrar si el resultado se envió.
  const avisoEnvio = texto => { const el = $('caso-envio'); if (el) el.innerHTML = texto; };

  function salir() {
    if (!s) return;
    if (s.fase !== 'cerrar' && s.modo === 'competencia' && !confirm('Tu avance queda guardado, pero el cronómetro sigue corriendo. ¿Salir del caso?')) return;
    cerrar();
  }

  function cerrar() {
    clearInterval(reloj);
    const cb = s?.opciones.alCerrar;
    s = null;
    dom.raiz.hidden = true;
    document.body.style.overflow = '';
    cb?.();
  }

  return { init, abrir, tablasEstados, activarTabs, avisoEnvio };
})();
