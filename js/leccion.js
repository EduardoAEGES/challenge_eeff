/* =========================================================
   MOTOR DE LECCIÓN (niveles 1 a 4) — adaptado de NAF Aprende.
   · Corazones compartidos entre lecciones: cada error quita uno.
   · Con 0 corazones se pasa a una sesión de repaso que devuelve 2.
   · Cada error explica por qué y qué tarjeta de teoría repasar.
   · Un comodín por nivel resuelve el ejercicio actual.
   ========================================================= */
window.FC = window.FC || {};

FC.Leccion = (() => {
  const XP_LECCION = 10, XP_EXAMEN = 25, XP_PERFECTA = 5, APROBAR_EXAMEN = 70;
  const FRASES_OK = ['¡Excelente!', '¡Muy bien!', '¡Correcto!', '¡Así se hace!', '¡Impecable!'];
  const azar = a => a[Math.floor(Math.random() * a.length)];
  const $ = id => document.getElementById(id);
  const dom = {};
  let s = null;

  function init() {
    Object.assign(dom, {
      raiz: $('leccion'), cuerpo: $('lec-cuerpo'), pie: $('lec-pie'), barra: $('lec-barra'), vidas: $('lec-vidas'), titulo: $('lec-titulo'),
      boton: $('lec-boton'), pista: $('lec-pista'), comodin: $('lec-comodin'), feedback: $('lec-feedback'), fbIcono: $('lec-fb-icono'), fbTitulo: $('lec-fb-titulo'), fbTexto: $('lec-fb-texto')
    });
    dom.boton.addEventListener('click', accion);
    dom.pista.addEventListener('click', mostrarPista);
    dom.comodin.addEventListener('click', usarComodin);
    $('lec-salir').addEventListener('click', () => {
      if (!s || s.fase === 'fin' || confirm('Si sales ahora perderás el avance de esta lección (los corazones perdidos no se recuperan). ¿Salir?')) cerrar();
    });
    document.addEventListener('keydown', e => {
      if (!s || dom.raiz.hidden || !$('modal').hidden) return;
      if (e.key === 'Enter') { e.preventDefault(); if (!dom.boton.disabled) accion(); return; }
      if (s.fase === 'respondiendo' && s.actual?.tecla) s.actual.tecla(e.key);
    });
  }

  const teoriasDe = id => (FC.CONTENIDO[id]?.ejercicios || []).filter(e => e.type === 'teoria');

  /* opciones:
     prueba          → no guarda nada ni quita corazones
     repaso          → sesión de repaso: ejercicios dados en «ejercicios», no quita corazones
     corazones()     → corazones actuales; perderCorazon() → quita uno
     comodin         → { disponible(), usar() } del nivel
     alTerminar(res) → al cerrar; alSinCorazones() → ir al repaso */
  function abrir(id, opciones = {}) {
    let items;
    if (opciones.repaso) items = opciones.ejercicios;
    else {
      const contenido = FC.CONTENIDO[id];
      if (!contenido) return;
      items = contenido.ejercicios.map(ej => ({ ej, origen: id }));
    }
    const info = opciones.repaso ? null : FC.leccionPorId(id);
    s = { id, info, opciones, cola: items.slice(), total: items.length, hechos: 0, aciertos: 0, errores: 0, inicio: Date.now(), fase: 'respondiendo', actual: null };
    dom.titulo.textContent = opciones.repaso ? '🔁 Sesión de repaso' : `Nivel ${info.nivel.n} · ${info.leccion.titulo}${opciones.prueba ? ' · MODO PRUEBA' : ''}`;
    dom.raiz.hidden = false; dom.pie.hidden = false;
    document.body.style.overflow = 'hidden';
    cabecera(); siguiente();
  }

  const sinPerdida = () => s.opciones.prueba || s.opciones.repaso;
  const corazones = () => (sinPerdida() ? '∞' : s.opciones.corazones());

  function cabecera() {
    dom.barra.style.width = `${(s.hechos / s.total) * 100}%`;
    dom.vidas.textContent = corazones();
  }

  function siguiente() {
    if (!s.cola.length) return terminar();
    s.fase = 'respondiendo';
    const item = s.cola.shift();
    s.item = item; s.ej = item.ej; s.pistaVista = false;
    s.actual = FC.Ejercicios.render(s.ej, dom.cuerpo, { alCambiar: refrescar, alTerminar: () => comprobar() });
    dom.cuerpo.scrollTop = 0;
    limpiarFeedback();
    dom.pista.hidden = !s.ej.pista;
    const puedeComodin = !s.opciones.repaso && s.actual.resolver && (s.opciones.prueba || s.opciones.comodin?.disponible());
    dom.comodin.hidden = !puedeComodin;
    if (!s.actual.calificable) { dom.boton.textContent = 'Continuar'; dom.boton.disabled = false; s.fase = 'teoria'; dom.comodin.hidden = true; }
    else { dom.boton.textContent = 'Comprobar'; refrescar(); }
  }

  // Un ejercicio puede avisar cambios mientras se dibuja, antes de que exista s.actual.
  const refrescar = () => { if (s?.actual && s.fase === 'respondiendo') dom.boton.disabled = !s.actual.listo(); };

  function mostrarPista() {
    if (!s || s.pistaVista || !s.ej.pista) return;
    s.pistaVista = true;
    const caja = document.createElement('div');
    caja.className = 'pista-caja';
    caja.innerHTML = `💡 <b>Pista:</b> ${s.ej.pista}`;
    dom.cuerpo.querySelector('.contenido')?.append(caja);
    dom.pista.hidden = true;
  }

  function usarComodin() {
    if (!s || s.fase !== 'respondiendo' || !s.actual.resolver) return;
    if (!s.opciones.prueba && !s.opciones.comodin?.disponible()) return;
    if (!s.opciones.prueba && !confirm('🃏 Tienes un solo comodín en este nivel. Resolverá este ejercicio por ti. ¿Usarlo ahora?')) return;
    if (!s.opciones.prueba) s.opciones.comodin.usar();
    s.actual.resolver();
    dom.comodin.hidden = true;
    const caja = document.createElement('div');
    caja.className = 'pista-caja';
    caja.innerHTML = '🃏 <b>Comodín usado:</b> la respuesta correcta ya está marcada. Léela con atención antes de comprobar.';
    dom.cuerpo.querySelector('.contenido')?.append(caja);
    FC.Sonido.comodin();
    refrescar();
  }

  function accion() {
    if (!s) return;
    if (s.fase === 'teoria') { s.hechos++; cabecera(); return siguiente(); }
    if (s.fase === 'respondiendo') return comprobar();
    if (s.fase === 'revisado') return siguiente();
    if (s.fase === 'sin-corazones') return sinCorazones();
  }

  function comprobar() {
    if (!s?.actual || s.fase !== 'respondiendo') return;
    const { correcto, solucion } = s.actual.comprobar();
    s.fase = 'revisado';
    dom.pista.hidden = true; dom.comodin.hidden = true;
    s.errores += s.actual.errores || 0;
    if (correcto) {
      s.aciertos++; s.hechos++;
      if (!s.actual.autoCompleta) FC.Sonido.correcto();
      feedback(true, azar(FRASES_OK), s.ej.explain || '');
    } else {
      s.errores++;
      s.cola.push(s.item); // vuelve al final, como en Duolingo
      FC.Sonido.incorrecto();
      if (!sinPerdida()) s.opciones.perderCorazon();
      golpe();
      const teoria = teoriasDe(s.item.origen)[0];
      const repasa = teoria ? `<br><span class="repasa">📖 Repasa la tarjeta <b>«${teoria.titulo}»</b>. <button type="button" class="enlace" id="lec-ver-teoria">Ver teoría</button></span>` : '';
      feedback(false, 'Por qué no es correcto', `Respuesta correcta: <b>${solucion}</b>${s.ej.explain ? '<br>' + s.ej.explain : ''}${repasa}`);
      $('lec-ver-teoria')?.addEventListener('click', () => verTeoria(s.item.origen));
    }
    cabecera();
    dom.boton.textContent = 'Continuar'; dom.boton.disabled = false; dom.boton.focus();
    if (!sinPerdida() && s.opciones.corazones() <= 0) s.fase = 'sin-corazones';
  }

  function golpe() {
    const caja = dom.vidas.parentElement;
    caja.classList.remove('pierde'); void caja.offsetWidth; caja.classList.add('pierde');
  }

  function verTeoria(origen) {
    const html = teoriasDe(origen).map(t => `<h2 style="font-size:22px;font-weight:900;margin-bottom:8px">${t.titulo}</h2>
      <p style="font-weight:600;line-height:1.5;margin-bottom:12px">${t.intro}</p>
      <div class="teoria-puntos">${t.puntos.map(p => `<div class="tarjeta teoria-punto"><div class="emoji">${p.icono}</div><div><h4>${p.titulo}</h4><p>${p.texto}</p></div></div>`).join('')}</div>`).join('<hr style="margin:18px 0;border:0;border-top:2px solid var(--borde)">');
    FC.App.modal(html);
  }

  function feedback(ok, titulo, texto) {
    dom.pie.classList.add(ok ? 'correcto' : 'incorrecto');
    dom.fbIcono.textContent = ok ? '✅' : '❌';
    dom.fbTitulo.textContent = titulo;
    dom.fbTexto.innerHTML = texto || '';
    dom.feedback.hidden = false;
  }
  function limpiarFeedback() { dom.pie.classList.remove('correcto', 'incorrecto'); dom.feedback.hidden = true; }

  function terminar() {
    s.fase = 'fin';
    const calificados = s.aciertos + s.errores;
    const precision = calificados ? Math.round((s.aciertos / calificados) * 100) : 100;
    const perfecta = s.errores === 0;
    const repaso = Boolean(s.opciones.repaso);
    const examen = !repaso && Boolean(s.info.leccion.examen);
    const aprobada = repaso || !examen || precision >= APROBAR_EXAMEN;
    const xp = repaso ? 5 : aprobada ? (examen ? XP_EXAMEN : XP_LECCION) + (perfecta ? XP_PERFECTA : 0) : 0;
    const seg = Math.round((Date.now() - s.inicio) / 1000);
    const tiempo = `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;
    if (aprobada) { FC.Sonido.completado(); confeti(); } else FC.Sonido.incorrecto();

    dom.pie.hidden = true; dom.barra.style.width = '100%';
    const titulo = repaso ? '¡Repaso completado! +2 ❤️' : !aprobada ? 'Examen no aprobado' : examen ? `¡Nivel ${s.info.nivel.n} superado!` : perfecta ? '¡Lección perfecta!' : '¡Lección completada!';
    const texto = repaso ? 'Recuperaste 2 corazones. Ya puedes volver a tus lecciones.'
      : !aprobada ? `Necesitas al menos ${APROBAR_EXAMEN} % de precisión para pasar al siguiente nivel. Repasa las lecciones y vuelve a intentarlo.`
      : s.info.leccion.titulo;
    dom.cuerpo.innerHTML = `<div class="final${aprobada ? '' : ' mal'}">
      <div class="mascota">${repaso ? '💖' : !aprobada ? '📚' : examen ? '🏆' : '🦙'}</div>
      <h1>${titulo}</h1>
      <p>${texto}${s.opciones.prueba ? '<br><b>Modo prueba: este resultado no se guarda.</b>' : ''}</p>
      <div class="resultados">
        <div class="resultado"><small>XP</small><b>⚡ ${xp}</b></div>
        <div class="resultado verde"><small>${perfecta ? 'Perfecta' : 'Precisión'}</small><b>🎯 ${precision}%</b></div>
        <div class="resultado azul"><small>Tiempo</small><b>⏱️ ${tiempo}</b></div>
      </div>
      <div class="final-acciones"><button class="btn btn-bloque" id="lec-final">Continuar</button></div>
    </div>`;
    const resultado = { id: s.id, precision, xp, aprobada, examen, repaso };
    $('lec-final').addEventListener('click', () => cerrar(resultado));
    $('lec-final').focus();
  }

  function sinCorazones() {
    s.fase = 'fin';
    dom.pie.hidden = true;
    dom.cuerpo.innerHTML = `<div class="final mal">
      <div class="mascota">💔</div>
      <h1>Te quedaste sin corazones</h1>
      <p>Equivocarse es parte de aprender. Haz una sesión corta de repaso para recuperar <b>2 corazones</b> y vuelve a intentarlo.</p>
      <div class="final-acciones">
        <button class="btn btn-bloque" id="lec-repaso">🔁 Ir a la sesión de repaso</button>
        <button class="btn btn-blanco btn-bloque" id="lec-volver">Volver a la ruta</button>
      </div>
    </div>`;
    const cb = s.opciones.alSinCorazones;
    $('lec-repaso').addEventListener('click', () => { cerrar(); cb?.(); });
    $('lec-volver').addEventListener('click', () => cerrar());
  }

  function cerrar(resultado) {
    const cb = s?.opciones.alTerminar;
    s = null;
    dom.raiz.hidden = true;
    document.body.style.overflow = '';
    if (cb) cb(resultado || null);
  }

  function confeti() {
    const colores = ['#58cc02', '#1c6fc4', '#ff9600', '#ffc800', '#a56bf0', '#00205b'];
    const capa = document.createElement('div');
    capa.className = 'confeti';
    for (let i = 0; i < 80; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = colores[i % colores.length];
      p.style.animationDuration = 1.8 + Math.random() * 1.8 + 's';
      p.style.animationDelay = Math.random() * 0.5 + 's';
      capa.append(p);
    }
    document.body.append(capa);
    setTimeout(() => capa.remove(), 4500);
  }

  // ejercicioActual: solo lectura, útil para pruebas automáticas
  return { init, abrir, confeti, APROBAR_EXAMEN, ejercicioActual: () => s?.ej };
})();
