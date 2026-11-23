/* =========================================================
   PILOTO AUTOMÁTICO (solo modo prueba del master)
   Juega una lección o un caso como si fuera un estudiante: elige
   cada respuesta con un clic visible, confirma y avanza solo.
   · Experto: responde todo bien y en los casos toma el camino de
     máximo puntaje.
   · Estudiante: se equivoca a veces (unas 3 de cada 4 bien).
   No guarda nada: solo se usa con pantallas abiertas en modo prueba.
   ========================================================= */
window.FC = window.FC || {};

FC.Piloto = (() => {
  const VELOCIDADES = { lento: 1800, normal: 1000, rapido: 380 };
  const ACIERTO = { experto: 1, estudiante: 0.75 };
  const $ = id => document.getElementById(id);
  const espera = ms => new Promise(res => setTimeout(res, ms));
  const azar = n => Math.floor(Math.random() * n);
  let c = null; // corrida actual

  // ---------- Panel flotante ----------
  function panel() {
    let el = $('piloto');
    if (!el) {
      el = document.createElement('div');
      el.id = 'piloto';
      el.className = 'piloto';
      document.body.append(el);
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-piloto]');
        if (!b || !c) return;
        if (b.dataset.piloto === 'pausa') { c.pausado = !c.pausado; pintarPanel(); }
        if (b.dataset.piloto === 'detener') detener();
      });
      el.addEventListener('change', e => { if (e.target.name === 'piloto-vel' && c) { c.vel = e.target.value; } });
    }
    return el;
  }
  function pintarPanel() {
    if (!c) return;
    const el = panel();
    el.hidden = false;
    el.innerHTML = `<span class="piloto-ic">${FC.ico('play')}</span>
      <div class="piloto-texto"><b>Piloto automático · ${c.modo === 'experto' ? 'experto' : 'como estudiante'}</b><span>${c.pausado ? 'En pausa' : c.estado}</span></div>
      <select name="piloto-vel" aria-label="Velocidad">${Object.keys(VELOCIDADES).map(v => `<option value="${v}" ${v === c.vel ? 'selected' : ''}>${{ lento: 'Lento', normal: 'Normal', rapido: 'Rápido' }[v]}</option>`).join('')}</select>
      <button type="button" class="btn btn-blanco btn-chico" data-piloto="pausa">${c.pausado ? 'Reanudar' : 'Pausar'}</button>
      <button type="button" class="btn btn-rojo btn-chico" data-piloto="detener">Detener</button>`;
  }
  const estado = texto => { if (c) { c.estado = texto; pintarPanel(); } };

  // ---------- Acciones visibles ----------
  async function pulsar(el, c0) {
    if (!el || c0 !== c) return false;
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    el.classList.add('piloto-toque');
    await espera(Math.min(450, VELOCIDADES[c0.vel] * 0.45));
    if (c0 !== c) return false;
    el.click();
    setTimeout(() => el.classList.remove('piloto-toque'), 500);
    return true;
  }
  const pausaEntreAcciones = async c0 => { do { await espera(VELOCIDADES[c0.vel]); } while (c0 === c && c0.pausado); };
  const acierta = () => Math.random() < c.acierto;
  const otra = (n, buena) => { const malas = [...Array(n).keys()].filter(i => i !== buena); return malas[azar(malas.length)]; };

  // ---------- Lecciones ----------
  async function responderEjercicio(ej, c0) {
    const cuerpo = $('lec-cuerpo');
    const ok = acierta();
    if (ej.type === 'choice' || ej.type === 'fill') {
      const k = ok ? ej.answer : otra(ej.options.length, ej.answer);
      estado(ok ? 'Elige la respuesta' : 'Elige… (se equivoca a propósito)');
      await pulsar(cuerpo.querySelector(`.opcion[data-i="${k}"]`), c0);
    } else if (ej.type === 'tf') {
      const v = ok ? ej.answer : !ej.answer;
      estado('Verdadero o falso');
      await pulsar(cuerpo.querySelector(`.opcion.tf[data-v="${v}"]`), c0);
    } else if (ej.type === 'match') {
      estado('Empareja');
      if (!ok && ej.pairs.length > 1) { // un intento equivocado y luego los correctos
        await pulsar(cuerpo.querySelector('[data-lado="izq"][data-i="0"]'), c0);
        await pulsar(cuerpo.querySelector('[data-lado="der"][data-i="1"]'), c0);
        await espera(600);
      }
      for (let i = 0; i < ej.pairs.length && c0 === c; i++) {
        await pulsar(cuerpo.querySelector(`[data-lado="izq"][data-i="${i}"]`), c0);
        await pulsar(cuerpo.querySelector(`[data-lado="der"][data-i="${i}"]`), c0);
        await espera(250);
      }
      return 'auto'; // se comprueba solo al terminar
    } else if (ej.type === 'clasificar') {
      estado('Clasifica cada ficha');
      const mal = ok ? -1 : azar(ej.items.length);
      for (let i = 0; i < ej.items.length && c0 === c; i++) {
        const grupo = i === mal ? otra(ej.grupos.length, ej.items[i].grupo) : ej.items[i].grupo;
        await pulsar(cuerpo.querySelector(`.ficha[data-i="${i}"]`), c0);
        await pulsar(cuerpo.querySelector(`.grupo[data-g="${grupo}"]`), c0);
      }
    }
    return 'listo';
  }
  async function pasoLeccion(c0) {
    if ($('leccion').hidden) return 'salio';
    const e = FC.Leccion.estado();
    if (!e) return 'salio';
    const boton = $('lec-boton');
    if (e.fase === 'fin') return 'fin';
    if (e.fase === 'teoria') { estado('Lee la teoría'); await pulsar(boton, c0); return; }
    if (e.fase === 'revisado') { estado('Continúa'); await pulsar(boton, c0); return; }
    if (e.fase === 'respondiendo') {
      const r = await responderEjercicio(e.ej, c0);
      if (r === 'auto') { await espera(900); return; }
      await pausaEntreAcciones(c0);
      if (!boton.disabled) { estado('Comprueba'); await pulsar(boton, c0); }
    }
  }

  // ---------- Casos ----------
  // Mejor combinación de decisiones (máximo puntaje con todo respondido bien)
  function mejorCamino(caso, vidas) {
    let mejor = null;
    (function explorar(el, combo) {
      const r = FC.Motor.recorrer(caso, el, vidas);
      if (r.error) return;
      if (r.terminado) { const p = FC.Motor.puntaje(r).total; if (!mejor || p > mejor.p) mejor = { p, combo }; return; }
      const nodo = caso.nodos[r.pendiente];
      if (nodo.tipo === 'decision') nodo.opciones.forEach((_, k) => explorar([...el, k], { ...combo, [r.pendiente]: k }));
      else explorar([...el, nodo.tipo === 'analisis' ? FC.Motor.respuestaAnalisis(nodo, r.previa, r.actual) : nodo.correcta], combo);
    })([], {});
    return mejor?.combo || {};
  }
  function elegirEnCaso(e) {
    const nodo = e.caso.nodos[e.r.pendiente];
    if (nodo.tipo === 'decision') {
      c.mejor ||= mejorCamino(e.caso, e.modo === 'guiado' ? null : FC.VIDAS_COMPETENCIA);
      const mejor = c.mejor[e.r.pendiente] ?? 0;
      if (c.modo === 'experto') return { k: mejor, texto: 'Toma la mejor decisión' };
      const riesgosa = nodo.opciones.findIndex(o => o.error);
      if (riesgosa >= 0 && Math.random() < 0.2) return { k: riesgosa, texto: 'Decide… (toma el riesgo)' };
      const k = Math.random() < 0.6 ? mejor : azar(nodo.opciones.length);
      return { k, texto: 'Decide' };
    }
    const correcta = nodo.tipo === 'analisis' ? FC.Motor.respuestaAnalisis(nodo, e.r.previa, e.r.actual) : nodo.correcta;
    const n = nodo.tipo === 'analisis' ? 3 : nodo.opciones.length;
    const ok = acierta();
    return { k: ok ? correcta : otra(n, correcta), texto: nodo.tipo === 'analisis' ? 'Analiza la proyección' : 'Responde la pregunta' };
  }
  async function pasoCaso(c0) {
    if ($('caso').hidden) return 'salio';
    const e = FC.Caso.estado();
    if (!e) return 'salio';
    const boton = $('caso-boton');
    if (e.fase === 'cerrar') return 'fin';
    if (e.fase === 'escena') { estado('Lee la escena'); await pulsar(boton, c0); return; }
    if (e.fase === 'revisado') { estado('Continúa'); await pulsar(boton, c0); return; }
    if (e.fase === 'pregunta' && e.r.pendiente) {
      const { k, texto } = elegirEnCaso(e);
      estado(texto);
      await pulsar($('caso-cuerpo').querySelector(`.opcion[data-i="${k}"]`), c0);
      await pausaEntreAcciones(c0);
      if (!boton.disabled) { estado('Confirma'); await pulsar(boton, c0); }
    }
  }

  // ---------- Ciclo ----------
  async function ciclo(c0) {
    await espera(700);
    while (c0 === c) {
      if (c0.pausado) { await espera(200); continue; }
      const r = c0.tipo === 'leccion' ? await pasoLeccion(c0) : await pasoCaso(c0);
      if (c0 !== c) return;
      if (r === 'fin') { estado('¡Terminado! Revisa el resultado'); c0.pausado = false; panel().querySelector('[data-piloto="pausa"]')?.remove(); setTimeout(() => { if (c === c0) detener(); }, 6000); return; }
      if (r === 'salio') { detener(); return; }
      await pausaEntreAcciones(c0);
    }
  }

  /** tipo: 'leccion' | 'caso'; opciones: { vel: 'lento'|'normal'|'rapido', modo: 'experto'|'estudiante' } */
  function iniciar(tipo, { vel = 'normal', modo = 'experto' } = {}) {
    detener();
    c = { tipo, vel: VELOCIDADES[vel] ? vel : 'normal', modo, acierto: ACIERTO[modo] ?? 1, pausado: false, estado: 'Empezando…', mejor: null };
    pintarPanel();
    ciclo(c);
  }
  function detener() {
    c = null;
    const el = $('piloto');
    if (el) el.hidden = true;
  }

  return { iniciar, detener, activo: () => Boolean(c) };
})();
