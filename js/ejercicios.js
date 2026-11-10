/* =========================================================
   EJERCICIOS — un renderizador por tipo (adaptado de NAF Aprende).
   Cada uno devuelve { listo(), comprobar() → { correcto, solucion }, tecla(k), calificable, autoCompleta }.
   ========================================================= */
window.FC = window.FC || {};

FC.Sonido = (() => {
  let ctx = null;
  function tono(f, inicio, dur, tipo = 'sine', vol = 0.12) {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + inicio;
      o.type = tipo; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + 0.05);
    } catch { /* sin audio */ }
  }
  return {
    correcto() { tono(660, 0, 0.12); tono(990, 0.1, 0.2); },
    incorrecto() { tono(220, 0, 0.18, 'square', 0.05); tono(180, 0.12, 0.25, 'square', 0.05); },
    tap() { tono(520, 0, 0.05, 'triangle', 0.04); },
    completado() { [523, 659, 784, 1047].forEach((f, i) => tono(f, i * 0.12, 0.3)); },
    comodin() { [784, 988, 1175, 1568].forEach((f, i) => tono(f, i * 0.07, 0.18, 'triangle', 0.09)); },
    vida() { tono(330, 0, 0.12, 'sawtooth', 0.07); tono(196, 0.1, 0.35, 'sawtooth', 0.07); }
  };
})();

FC.Ejercicios = (() => {
  const h = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const mezclar = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const etiqueta = (texto, icono = '✨') => `<div class="ej-etiqueta">${icono} ${texto}</div>`;

  function teoria(ej, cont) {
    cont.append(h(`<div class="contenido">
      ${etiqueta('Nuevo concepto', '💡')}
      <h1 class="ej-pregunta">${ej.titulo}</h1>
      <div class="teoria-cabecera"><div class="mascota">🦙</div><div class="burbuja">${ej.intro}</div></div>
      <div class="teoria-puntos">${ej.puntos.map(p => `
        <div class="tarjeta teoria-punto"><div class="emoji">${p.icono}</div><div><h4>${p.titulo}</h4><p>${p.texto}</p></div></div>`).join('')}</div>
    </div>`));
    return { calificable: false, listo: () => true, comprobar: () => ({ correcto: true }) };
  }

  function choice(ej, cont, { alCambiar }) {
    const orden = mezclar(ej.options.map((o, i) => ({ ...o, i })));
    let elegido = null;
    const escena = ej.escena ? `<div class="escena"><div class="personaje">${ej.escena.personaje}</div><div class="burbuja"><small>${ej.escena.nombre}</small>${ej.escena.texto}</div></div>` : '';
    const el = h(`<div class="contenido">
      ${etiqueta(ej.escena ? 'Caso práctico' : 'Elige la respuesta correcta', ej.escena ? '🎭' : '✨')}
      ${escena}
      <h1 class="ej-pregunta">${ej.prompt}</h1>
      <div class="opciones">${orden.map((o, k) => `
        <button class="opcion" data-i="${o.i}"><span class="tecla">${k + 1}</span>${o.icono ? `<span class="emoji">${o.icono}</span>` : ''}<span>${o.text}</span></button>`).join('')}</div>
    </div>`);
    cont.append(el);
    const botones = [...el.querySelectorAll('.opcion')];
    const elegir = b => { botones.forEach(x => x.classList.remove('seleccionada')); b.classList.add('seleccionada'); elegido = Number(b.dataset.i); FC.Sonido.tap(); alCambiar(); };
    botones.forEach(b => b.addEventListener('click', () => elegir(b)));
    return {
      calificable: true,
      listo: () => elegido !== null,
      tecla(k) { const n = Number(k); if (n >= 1 && n <= botones.length) elegir(botones[n - 1]); },
      resolver() { elegir(botones.find(b => Number(b.dataset.i) === ej.answer)); },
      comprobar() {
        botones.forEach(b => {
          b.disabled = true; b.classList.remove('seleccionada');
          const i = Number(b.dataset.i);
          if (i === ej.answer) b.classList.add('correcta'); else if (i === elegido) b.classList.add('incorrecta');
        });
        return { correcto: elegido === ej.answer, solucion: ej.options[ej.answer].text };
      }
    };
  }

  function tf(ej, cont, { alCambiar }) {
    let elegido = null;
    const el = h(`<div class="contenido">
      ${etiqueta('¿Verdadero o falso?', '⚖️')}
      <div class="tarjeta afirmacion">${ej.statement}</div>
      <div class="opciones dos-col">
        <button class="opcion tf" data-v="true"><span class="emoji">👍</span>Verdadero</button>
        <button class="opcion tf" data-v="false"><span class="emoji">👎</span>Falso</button>
      </div>
    </div>`);
    cont.append(el);
    const botones = [...el.querySelectorAll('.opcion')];
    const elegir = b => { botones.forEach(x => x.classList.remove('seleccionada')); b.classList.add('seleccionada'); elegido = b.dataset.v === 'true'; FC.Sonido.tap(); alCambiar(); };
    botones.forEach(b => b.addEventListener('click', () => elegir(b)));
    return {
      calificable: true,
      listo: () => elegido !== null,
      tecla(k) { if (k === '1' || k.toLowerCase() === 'v') elegir(botones[0]); if (k === '2' || k.toLowerCase() === 'f') elegir(botones[1]); },
      resolver() { elegir(botones[ej.answer ? 0 : 1]); },
      comprobar() {
        botones.forEach(b => {
          b.disabled = true; b.classList.remove('seleccionada');
          const v = b.dataset.v === 'true';
          if (v === ej.answer) b.classList.add('correcta'); else if (v === elegido) b.classList.add('incorrecta');
        });
        return { correcto: elegido === ej.answer, solucion: ej.answer ? 'Verdadero' : 'Falso' };
      }
    };
  }

  function fill(ej, cont, { alCambiar }) {
    const orden = mezclar(ej.options.map((text, i) => ({ text, i })));
    let elegido = null;
    const [antes, despues] = ej.sentence.split('___');
    const el = h(`<div class="contenido">
      ${etiqueta(ej.prompt, '✏️')}
      <div class="tarjeta oracion">${antes}<span class="hueco">&nbsp;</span>${despues}</div>
      <div class="opciones chips">${orden.map(o => `<button class="opcion" data-i="${o.i}">${o.text}</button>`).join('')}</div>
    </div>`);
    cont.append(el);
    const hueco = el.querySelector('.hueco');
    const botones = [...el.querySelectorAll('.opcion')];
    const elegir = b => { botones.forEach(x => x.classList.remove('seleccionada')); b.classList.add('seleccionada'); elegido = Number(b.dataset.i); hueco.textContent = ej.options[elegido]; FC.Sonido.tap(); alCambiar(); };
    botones.forEach(b => b.addEventListener('click', () => elegir(b)));
    return {
      calificable: true,
      listo: () => elegido !== null,
      tecla(k) { const n = Number(k); if (n >= 1 && n <= botones.length) elegir(botones[n - 1]); },
      resolver() { elegir(botones.find(b => Number(b.dataset.i) === ej.answer)); },
      comprobar() {
        botones.forEach(b => {
          b.disabled = true; b.classList.remove('seleccionada');
          const i = Number(b.dataset.i);
          if (i === ej.answer) b.classList.add('correcta'); else if (i === elegido) b.classList.add('incorrecta');
        });
        return { correcto: elegido === ej.answer, solucion: ej.sentence.replace('___', ej.options[ej.answer]) };
      }
    };
  }

  function match(ej, cont, { alTerminar }) {
    const izq = mezclar(ej.pairs.map((p, i) => ({ text: p[0], i })));
    const der = mezclar(ej.pairs.map((p, i) => ({ text: p[1], i })));
    let sel = { izq: null, der: null }, hechos = 0, errores = 0;
    const col = (items, lado) => items.map(o => `<button class="opcion" data-i="${o.i}" data-lado="${lado}">${o.text}</button>`).join('');
    const el = h(`<div class="contenido">
      ${etiqueta('Emparejar', '🔗')}
      <h1 class="ej-pregunta">${ej.prompt}</h1>
      <div class="emparejar"><div class="columna">${col(izq, 'izq')}</div><div class="columna">${col(der, 'der')}</div></div>
    </div>`);
    cont.append(el);
    el.querySelectorAll('.opcion').forEach(b => b.addEventListener('click', () => {
      const lado = b.dataset.lado;
      el.querySelectorAll(`[data-lado="${lado}"]`).forEach(x => x.classList.remove('seleccionada'));
      b.classList.add('seleccionada'); sel[lado] = b; FC.Sonido.tap();
      if (sel.izq && sel.der) {
        const a = sel.izq, c = sel.der; sel = { izq: null, der: null };
        if (ej.pairs[a.dataset.i][1] === ej.pairs[c.dataset.i][1]) {
          [a, c].forEach(x => { x.classList.remove('seleccionada'); x.classList.add('correcta'); x.disabled = true; });
          setTimeout(() => [a, c].forEach(x => { x.classList.remove('correcta'); x.classList.add('hecha'); }), 350);
          FC.Sonido.correcto();
          if (++hechos === ej.pairs.length) setTimeout(alTerminar, 450);
        } else {
          errores++;
          [a, c].forEach(x => { x.classList.remove('seleccionada'); x.classList.add('incorrecta'); });
          setTimeout(() => [a, c].forEach(x => x.classList.remove('incorrecta')), 450);
          FC.Sonido.incorrecto();
        }
      }
    }));
    return { calificable: true, autoCompleta: true, get errores() { return errores; }, listo: () => hechos === ej.pairs.length, comprobar: () => ({ correcto: true }) };
  }

  // Clasificar: se elige una ficha y luego el grupo donde va. Se puede devolver una ficha tocándola en su grupo.
  function clasificar(ej, cont, { alCambiar }) {
    const items = mezclar(ej.items.map((it, i) => ({ ...it, i })));
    const ubicacion = {}; // i → grupo
    let activa = null, bloqueado = false;
    const el = h(`<div class="contenido">
      ${etiqueta('Clasificar', '🗂️')}
      <h1 class="ej-pregunta">${ej.prompt}</h1>
      <div class="clasif-items"></div>
      <div class="grupos">${ej.grupos.map((g, k) => `<button type="button" class="grupo" data-g="${k}"><h4>${g}</h4><div class="lista"></div></button>`).join('')}</div>
      <p class="muted" style="text-align:center;font-weight:600;font-size:14px">Toca una ficha y luego el grupo donde va.</p>
    </div>`);
    cont.append(el);
    const zonaItems = el.querySelector('.clasif-items');
    const grupos = [...el.querySelectorAll('.grupo')];

    function pintar() {
      zonaItems.innerHTML = items.filter(it => ubicacion[it.i] == null)
        .map(it => `<button type="button" class="ficha${activa === it.i ? ' seleccionada' : ''}" data-i="${it.i}">${it.text}</button>`).join('');
      grupos.forEach((g, k) => {
        g.querySelector('.lista').innerHTML = items.filter(it => ubicacion[it.i] === k)
          .map(it => `<span class="en-grupo" data-i="${it.i}">${it.text}</span>`).join('');
      });
      zonaItems.querySelectorAll('.ficha').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation(); if (bloqueado) return;
        activa = Number(b.dataset.i); FC.Sonido.tap(); pintar();
      }));
      alCambiar();
    }
    grupos.forEach((g, k) => g.addEventListener('click', e => {
      if (bloqueado) return;
      const devuelta = e.target.closest('.en-grupo');
      if (devuelta) { delete ubicacion[devuelta.dataset.i]; FC.Sonido.tap(); return pintar(); }
      if (activa == null) return;
      ubicacion[activa] = k; activa = null; FC.Sonido.tap(); pintar();
    }));
    pintar();

    return {
      calificable: true,
      listo: () => items.every(it => ubicacion[it.i] != null),
      resolver() { items.forEach(it => { ubicacion[it.i] = it.grupo; }); activa = null; pintar(); },
      comprobar() {
        bloqueado = true;
        let correcto = true;
        el.querySelectorAll('.en-grupo').forEach(s => {
          const it = ej.items[s.dataset.i];
          const ok = ubicacion[s.dataset.i] === it.grupo;
          s.classList.add(ok ? 'bien' : 'mal');
          if (!ok) correcto = false;
        });
        grupos.forEach(g => (g.disabled = true));
        const solucion = ej.grupos.map((g, k) => `${g}: ${ej.items.filter(it => it.grupo === k).map(it => it.text).join(', ')}`).join(' · ');
        return { correcto, solucion };
      }
    };
  }

  const TIPOS = { teoria, choice, tf, fill, match, clasificar };
  return {
    render(ej, contenedor, eventos) {
      contenedor.innerHTML = '';
      const fn = TIPOS[ej.type];
      if (!fn) throw new Error(`Tipo de ejercicio desconocido: ${ej.type}`);
      return fn(ej, contenedor, eventos);
    }
  };
})();
