/* =========================================================
   FINANCIAL CHALLENGE — aplicación principal
   Cuentas con usuario y contraseña, ruta de 7 niveles, corazones y
   repaso, comodines, clase guiada, competencia habilitada por el
   master, ranking y podio.
   ========================================================= */
window.FC = window.FC || {};

FC.App = (() => {
  const SESION_KEY = 'fc-sesion';
  const MASTER_SES = 'fc-master-clave';
  const CORAZONES_MAX = 5;
  const PREMIOS = [150, 100, 50];
  const { fmt, esc } = V;
  const $ = id => document.getElementById(id);

  let P = null;            // participante con sesión: { usuario, clave, nombre, condicion, habilitado, resultados, progreso, demo? }
  let participanteReal = null;
  const ui = { vista: 'ruta', acceso: 'registro', msg: null, nuevaCuenta: null, master: { lista: null, ranking: {}, nivel: 6, error: null, ver: {}, sel: new Set(), top: 4 } };
  let sincronizando = null;

  const progresoVacio = () => ({ xp: 0, corazones: CORAZONES_MAX, lecciones: {}, comodines: {}, guiado: {}, casos: {} });
  const claveMaster = () => { try { return sessionStorage.getItem(MASTER_SES); } catch { return null; } };
  const esMaster = () => Boolean(claveMaster());

  // ---------- Sesión y sincronización ----------
  function guardarSesion() {
    if (!P || P.demo) return;
    try { localStorage.setItem(SESION_KEY, JSON.stringify(P)); } catch { /* */ }
  }
  let temporizador = null;
  function guardarP() {
    if (!P || P.demo) return;
    guardarSesion();
    clearTimeout(temporizador);
    temporizador = setTimeout(() => FC.Datos.guardar(P.usuario, P.clave, P.progreso).catch(() => { /* se reintenta en el próximo guardado */ }), 600);
  }
  function aplicarServidor(d, conProgreso) {
    P.nombre = d.nombre; P.condicion = d.condicion;
    P.habilitado = (d.habilitado || []).map(Number);
    P.resultados = d.resultados || {};
    if (conProgreso) P.progreso = { ...progresoVacio(), ...(d.progreso || {}) };
  }
  async function sincronizar() {
    if (!P || P.demo || sincronizando) return;
    sincronizando = FC.Datos.entrar(P.usuario, P.clave).then(d => {
      const antes = JSON.stringify([P.habilitado, P.resultados]);
      aplicarServidor(d, false);
      guardarSesion();
      reintentarEnvios();
      if (antes !== JSON.stringify([P.habilitado, P.resultados]) && $('caso').hidden && $('leccion').hidden) render();
    }).catch(() => { /* sin conexión: se sigue con lo guardado */ }).finally(() => { sincronizando = null; });
  }

  // ---------- Progreso ----------
  const prog = () => P.progreso;
  const leccionHecha = id => Boolean(P && prog().lecciones[id]?.aprobada);
  const nivelAprobado = n => leccionHecha(`n${n}ex`);
  const nivelLeccionesAbierto = nivel => P?.demo || nivel.n === 1 || nivelAprobado(nivel.n - 1);
  function estadoLeccion(nivel, i) {
    const lec = nivel.lecciones[i];
    if (leccionHecha(lec.id)) return 'completado';
    if (P?.demo) return 'disponible';
    const previaOk = i === 0 || leccionHecha(nivel.lecciones[i - 1].id);
    return nivelLeccionesAbierto(nivel) && previaOk ? 'disponible' : 'bloqueado';
  }
  const habilitado = n => P?.demo || P?.habilitado?.includes(n);
  const casoLocal = n => (prog().casos[n] ||= {});
  const resultadoCaso = n => P.resultados?.[n] || casoLocal(n).resultado;

  // ---------- Navegación ----------
  function ir(vista) {
    ui.vista = vista; ui.msg = null; render(); window.scrollTo(0, 0);
    if (vista === 'master' && esMaster() && !P?.demo) cargarMaster(); // datos frescos al entrar al panel
  }

  function render() {
    $('acceso').hidden = Boolean(P) || ui.vista === 'master';
    if (!$('acceso').hidden) $('acceso-caja').innerHTML = vAcceso();
    document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('activo', b.dataset.vista === ui.vista));
    $('nav-salir').hidden = !P || P.demo;
    const vistas = { ruta: vRuta, progreso: vProgreso, master: vMaster };
    $('vista').innerHTML = bannerDemo() + (vistas[ui.vista] || vRuta)();
    $('panel').innerHTML = vPanel();
    enlazar();
  }

  // ---------- Registro e inicio de sesión ----------
  function vAcceso() {
    const cab = `<header><img src="img/logo-certus.png" alt="CERTUS" width="1148" height="320"><h1>FINANCIAL CHALLENGE</h1>
      <p>El reto de los estados financieros. Aprende con lecciones cortas y compite tomando decisiones empresariales.</p></header>`;
    if (ui.nuevaCuenta) {
      const c = ui.nuevaCuenta;
      return `${cab}<div class="anota"><h2>📝 ¡Cuenta creada! Anota tus datos</h2>
        <p>Los necesitarás para entrar el día del reto desde cualquier computadora.</p>
        <table><tbody><tr><td>Usuario</td><td><b class="dato-cuenta">${esc(c.usuario)}</b></td></tr><tr><td>Contraseña</td><td><b class="dato-cuenta">${esc(c.clave)}</b></td></tr></tbody></table></div>
        <button class="btn btn-certus btn-bloque" data-accion="ya-anote">Ya los anoté, continuar</button>`;
    }
    const registro = ui.acceso === 'registro';
    return `${cab}
      <div class="acceso-pestanas"><button type="button" class="${registro ? 'activa' : ''}" data-accion="pestana" data-p="registro">Crear cuenta</button><button type="button" class="${registro ? '' : 'activa'}" data-accion="pestana" data-p="entrar">Ya tengo cuenta</button></div>
      ${ui.msg?.acceso ? `<p class="mensaje-error">${esc(ui.msg.acceso)}</p>` : ''}
      <form id="form-acceso" class="fila-campos" autocomplete="off">
        ${registro ? `
          <div><label class="etiqueta" for="a-nombre">Nombres y apellidos</label><input class="campo" id="a-nombre" name="nombre" required minlength="5"></div>
          <div><label class="etiqueta" for="a-condicion">Condición</label><select class="campo" id="a-condicion" name="condicion"><option>Estudiante</option><option>Egresado(a)</option></select></div>` : ''}
        <div><label class="etiqueta" for="a-usuario">Usuario</label><input class="campo" id="a-usuario" name="usuario" required minlength="3" placeholder="por ejemplo: maria-torres" autocapitalize="none"></div>
        <div><label class="etiqueta" for="a-clave">Contraseña</label><input class="campo" id="a-clave" name="clave" type="password" required minlength="4"></div>
        ${registro ? '<p class="nota-acceso">📝 <b>Anota tu usuario y contraseña</b>: los necesitarás el día del reto. No uses una contraseña que uses en otros sitios: el facilitador puede verla para ayudarte si la olvidas.</p>' : ''}
        <button class="btn btn-certus btn-bloque" type="submit">${registro ? 'Crear mi cuenta' : 'Entrar'}</button>
      </form>
      <button class="enlace" type="button" data-accion="ir-master" style="align-self:center">Soy el facilitador (master)</button>
      ${FC.Datos.modo === 'local' ? '<p class="nota-acceso">Modo local: las cuentas se guardan solo en esta computadora.</p>' : ''}`;
  }

  async function enviarAcceso(f) {
    const usuario = f.usuario.value.trim(), clave = f.clave.value;
    const boton = f.querySelector('button[type=submit]');
    boton.disabled = true;
    try {
      const d = ui.acceso === 'registro'
        ? await FC.Datos.registrar(usuario, clave, f.nombre.value.trim().replace(/\s+/g, ' '), f.condicion.value)
        : await FC.Datos.entrar(usuario, clave);
      P = { usuario: d.usuario, clave, progreso: progresoVacio() };
      aplicarServidor(d, true);
      guardarSesion();
      ui.msg = null;
      if (ui.acceso === 'registro') { ui.nuevaCuenta = { usuario: d.usuario, clave }; P = null; participantePendiente = { d, clave }; }
      render();
    } catch (e) { ui.msg = { acceso: e.message }; render(); }
  }
  let participantePendiente = null;

  function cerrarSesion() {
    if (!confirm('¿Cerrar sesión en esta computadora?')) return;
    P = null;
    try { localStorage.removeItem(SESION_KEY); } catch { /* */ }
    ui.acceso = 'entrar';
    ir('ruta');
  }

  // ---------- Demostración (solo desde master) ----------
  function iniciarDemo() {
    participanteReal = P;
    P = { usuario: 'demo', clave: '', nombre: 'Participante de demostración', condicion: 'Estudiante', habilitado: [6, 7], resultados: {}, progreso: progresoVacio(), demo: true };
    ir('ruta');
  }
  function salirDemo() { P = participanteReal; participanteReal = null; ir('master'); }
  const bannerDemo = () => (P?.demo ? `<div class="banner-demo"><span class="emoji">🎬</span>
    <p>Modo demostración: todos los niveles están abiertos y nada de lo que hagas se guarda.</p>
    <button class="btn btn-blanco btn-chico" data-accion="salir-demo">Salir de la demostración</button></div>` : '');

  // ---------- Panel derecho ----------
  function vPanel() {
    if (!P) return `<div class="tarjeta panel-tarjeta"><h3>🏆 Financial Challenge</h3><p>Crea tu cuenta o entra para empezar tu ruta.</p></div>`;
    const totalLec = FC.NIVELES.filter(n => n.lecciones).reduce((a, n) => a + n.lecciones.length, 0);
    const hechas = Object.values(prog().lecciones).filter(l => l.aprobada).length;
    const iniciales = P.nombre.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const c = prog().corazones;
    return `
      <div class="tarjeta panel-tarjeta"><div class="perfil"><div class="avatar">${esc(iniciales)}</div><div><h3 style="margin:0">${esc(P.nombre)}</h3><p>${esc(P.condicion)} · @${esc(P.usuario)}</p></div></div></div>
      <div class="stats">
        <div class="stat">⚡ <div><small>XP</small>${prog().xp}</div></div>
        <div class="stat corazones-panel">❤️ <div><small>Corazones</small>${c}/${CORAZONES_MAX}</div></div>
      </div>
      <div class="stats"><div class="stat">📚 <div><small>Lecciones</small>${hechas}/${totalLec}</div></div></div>
      ${c === 0 ? `<div class="tarjeta panel-tarjeta"><h3>💔 Sin corazones</h3><p>Haz una sesión de repaso para recuperar 2.</p><button class="btn btn-chico" data-accion="repaso" style="margin-top:10px">🔁 Sesión de repaso</button></div>` : ''}
      <div class="tarjeta panel-tarjeta"><h3>🃏 Comodines</h3><p>Uno por nivel. ${[1, 2, 3, 4].map(n => `N${n} ${prog().comodines[n] ? '✗' : '✓'}`).join(' · ')}</p></div>
      <div class="tarjeta panel-tarjeta"><h3>🏆 Premios de la final</h3>
        <p>🥇 Gift card de S/ 150<br>🥈 Gift card de S/ 100<br>🥉 Gift card de S/ 50</p></div>`;
  }

  // ---------- Ruta ----------
  const DESPLAZAMIENTO = [0, 55, 85, 55, 0, -55, -85, -55];

  function vRuta() {
    if (!P) return '';
    return `
      <header class="portada">
        <div><small>CERTUS · Área de Finanzas</small><h1>Aprende, decide y compite</h1>
        <p>Niveles 1 a 4: teoría con práctica. Nivel 5: clase guiada con el docente. Niveles 6 y 7: competencia, que habilita el facilitador.</p></div>
        <div class="emoji">📊</div>
      </header>
      ${prog().corazones === 0 && !P.demo ? `<div class="banner-demo"><span class="emoji">💔</span><p>Te quedaste sin corazones. Haz una sesión corta de repaso para recuperar 2 y seguir con tus lecciones.</p><button class="btn btn-chico" data-accion="repaso">🔁 Ir al repaso</button></div>` : ''}
      <div class="ruta">${FC.NIVELES.map(nv => (nv.lecciones ? unidadLecciones(nv) : nv.subniveles ? unidadGuiada(nv) : unidadCaso(nv))).join('')}</div>`;
  }

  function camino(nodos) {
    return `<div class="camino">${nodos.map((x, i) => `<div class="nodo-env${x.actual ? ' actual' : ''}" style="transform:translateX(${DESPLAZAMIENTO[i % 8]}px)">
      ${x.actual ? `<span class="empezar">${i === 0 ? 'Empezar' : 'Siguiente'}</span>` : ''}
      <button class="nodo c-${x.color} ${x.estado}${x.examen ? ' examen' : ''}${x.actual ? ' actual' : ''}" ${x.attr} title="${esc(x.titulo)}">${x.estado === 'bloqueado' ? '🔒' : x.icono}</button>
      <span class="nodo-nombre">${esc(x.titulo)}${x.extra || ''}</span></div>`).join('')}</div>`;
  }

  function unidadLecciones(nv) {
    const abierta = nivelLeccionesAbierto(nv);
    let marcado = false;
    const nodos = nv.lecciones.map((l, i) => {
      const estado = estadoLeccion(nv, i);
      const actual = estado === 'disponible' && !marcado; if (actual) marcado = true;
      const r = prog().lecciones[l.id];
      return { color: nv.color, estado, actual, examen: l.examen, icono: l.icono, titulo: l.titulo, attr: `data-leccion="${l.id}"`, extra: r ? ` · ${r.precision}%` : '' };
    });
    return `<section class="unidad${abierta ? '' : ' bloqueada'}">
      <div class="unidad-cabecera c-${nv.color}"><div><small>Nivel ${nv.n} · Teoría</small><h2>${esc(nv.titulo)}</h2><p>${esc(nv.descripcion)}</p></div><div class="emoji">${nv.icono}</div></div>
      ${abierta ? '' : `<p class="muted" style="text-align:center;margin-top:10px">🔒 Aprueba el examen del nivel ${nv.n - 1} para abrir este nivel.</p>`}
      ${camino(nodos)}</section>`;
  }

  function unidadGuiada(nv) {
    const nodos = nv.subniveles.map(sub => ({ color: nv.color, estado: prog().guiado[sub.id] ? 'completado' : 'disponible', icono: sub.icono, titulo: sub.titulo, attr: `data-guiado="${sub.id}"` }));
    return `<section class="unidad">
      <div class="unidad-cabecera c-${nv.color}"><div><small>Nivel ${nv.n} · ${nv.etapa}</small><h2>${esc(nv.titulo)}</h2><p>${esc(nv.descripcion)}</p></div><div class="emoji">${nv.icono}</div></div>
      ${camino(nodos)}</section>`;
  }

  function unidadCaso(nv) {
    const c = casoLocal(nv.n);
    const r = resultadoCaso(nv.n);
    let acciones;
    if (r && !P.demo) {
      const t = r.segundos;
      acciones = `<span class="chip verde">✓ Completado</span> <span class="chip dorado">🏆 ${r.puntaje} puntos · ⏱️ ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')} · ❤️ ${r.vidas}</span>
        ${c.estado ? `<button class="btn btn-blanco btn-chico" data-caso="${nv.n}">Ver resultado</button>` : ''}
        ${c.pendienteEnvio ? '<button class="btn btn-azul btn-chico" data-accion="reenviar">Reintentar envío</button><span class="mensaje-error">Resultado aún no enviado.</span>' : ''}
        ${nv.n === 7 ? '<button class="btn btn-certus btn-chico" data-accion="podio-participante">🏆 Ver podio</button>' : ''}`;
    } else if (!habilitado(nv.n)) {
      acciones = `<span class="candado">🔒 El facilitador habilitará este nivel el día del reto.</span><button class="btn btn-blanco btn-chico" data-accion="actualizar">↻ Actualizar</button>`;
    } else if (c.estado && !P.demo) {
      acciones = `<button class="btn btn-certus" data-caso="${nv.n}">Continuar caso →</button><span class="muted" style="font-size:13px">El cronómetro sigue corriendo.</span>`;
    } else {
      acciones = `<button class="btn btn-certus" data-caso="${nv.n}">Comenzar caso →</button><span class="muted" style="font-size:13px">Un solo intento · ${FC.VIDAS_COMPETENCIA} vidas · 1 comodín.</span>`;
    }
    return `<section class="unidad">
      <div class="unidad-cabecera c-certus"><div><small>Nivel ${nv.n} · ${nv.etapa}</small><h2>Caso de empresa</h2><p>Una sola empresa, varias decisiones encadenadas. Resultado por puntaje; el tiempo desempata.</p></div><div class="emoji">🏢</div></div>
      <div class="caso-tarjeta"><div class="emoji">${nv.icono}</div>
        <div><span class="chip azul">${nv.etapa}</span><h3>${esc(nv.titulo)}</h3><p>${esc(nv.descripcion)}</p></div>
        <div class="caso-acciones">${acciones}</div></div>
    </section>`;
  }

  // ---------- Mi progreso ----------
  function vProgreso() {
    if (!P) return '';
    return `<h1 class="vista-titulo">Mi progreso</h1>
      <p class="vista-sub">${esc(P.nombre)} · @${esc(P.usuario)} · ⚡ ${prog().xp} XP · ❤️ ${prog().corazones}/${CORAZONES_MAX}</p>
      ${FC.NIVELES.map(nv => {
        if (nv.lecciones) return `<div class="seccion tarjeta"><h2 style="font-size:18px;font-weight:900;margin-bottom:8px">${nv.icono} Nivel ${nv.n}: ${esc(nv.titulo)}</h2>
          <table><tbody>${nv.lecciones.map(l => { const r = prog().lecciones[l.id]; return `<tr><td>${l.icono} ${esc(l.titulo)}</td><td class="num">${r ? `${r.aprobada ? '✅' : '❌'} ${r.precision}%` : '<span class="muted">Pendiente</span>'}</td></tr>`; }).join('')}</tbody></table></div>`;
        if (nv.subniveles) return `<div class="seccion tarjeta"><h2 style="font-size:18px;font-weight:900;margin-bottom:8px">${nv.icono} Nivel ${nv.n}: ${esc(nv.titulo)}</h2>
          <table><tbody>${nv.subniveles.map(sb => `<tr><td>${sb.icono} ${esc(sb.titulo)}</td><td class="num">${prog().guiado[sb.id] ? '✅' : '<span class="muted">Pendiente</span>'}</td></tr>`).join('')}</tbody></table></div>`;
        const r = resultadoCaso(nv.n);
        return `<div class="seccion tarjeta"><h2 style="font-size:18px;font-weight:900;margin-bottom:8px">${nv.icono} Nivel ${nv.n} · ${nv.etapa}: ${esc(nv.titulo)}</h2>
          <p>${r ? `Puntaje <b>${r.puntaje}</b> · tiempo ${Math.floor(r.segundos / 60)}:${String(r.segundos % 60).padStart(2, '0')} · ❤️ ${r.vidas}` : habilitado(nv.n) ? 'Habilitado, pendiente de jugar.' : 'Aún no habilitado.'}</p></div>`;
      }).join('')}`;
  }

  // ---------- Lecciones, repaso y comodín ----------
  function opcionesLeccion(nivelN) {
    return {
      prueba: P.demo,
      corazones: () => prog().corazones,
      perderCorazon: () => { prog().corazones = Math.max(0, prog().corazones - 1); guardarP(); },
      comodin: { disponible: () => !prog().comodines[nivelN], usar: () => { prog().comodines[nivelN] = true; guardarP(); } },
      alSinCorazones: abrirRepaso
    };
  }

  function abrirLeccion(id) {
    const info = FC.leccionPorId(id);
    const i = info.nivel.lecciones.findIndex(l => l.id === id);
    if (estadoLeccion(info.nivel, i) === 'bloqueado') return;
    if (!P.demo && prog().corazones <= 0) { modal('<h2 style="font-size:22px;font-weight:900">💔 Sin corazones</h2><p style="margin:10px 0 16px;font-weight:600">Haz una sesión de repaso para recuperar 2 corazones.</p><button class="btn" data-accion="repaso">🔁 Ir al repaso</button>'); return; }
    FC.Leccion.abrir(id, {
      ...opcionesLeccion(info.nivel.n),
      alTerminar: res => {
        if (res && !P.demo) {
          const previo = prog().lecciones[id];
          if (!previo || res.precision >= previo.precision || (res.aprobada && !previo.aprobada)) {
            prog().lecciones[id] = { precision: res.precision, aprobada: res.aprobada || Boolean(previo?.aprobada), fecha: new Date().toISOString() };
          }
          prog().xp += res.xp;
          guardarP();
        }
        render();
      }
    });
  }

  function abrirRepaso() {
    cerrarModal();
    const vistas = Object.keys(prog().lecciones);
    const fuentes = vistas.length ? vistas : ['n1l1', 'n1l2'];
    const pool = fuentes.flatMap(id => (FC.CONTENIDO[id]?.ejercicios || []).filter(e => e.type !== 'teoria').map(ej => ({ ej, origen: id })));
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    FC.Leccion.abrir('repaso', {
      repaso: true, ejercicios: pool.slice(0, 6),
      alTerminar: res => {
        if (res?.repaso && !P.demo) { prog().corazones = Math.min(CORAZONES_MAX, prog().corazones + 2); prog().xp += res.xp; guardarP(); }
        render();
      }
    });
  }

  // ---------- Clase guiada y casos ----------
  function abrirGuiado(id, deMaster = false) {
    const sub = FC.NIVELES.find(n => n.subniveles).subniveles.find(x => x.id === id);
    FC.Caso.abrir({
      casoId: sub.caso, modo: 'guiado', etiqueta: `Nivel 5 · ${sub.titulo}`,
      alTerminar: () => { if (P && !P.demo && !deMaster) { prog().guiado[id] = true; guardarP(); } },
      alCerrar: render
    });
  }

  function abrirCaso(n) {
    if (!habilitado(n)) return;
    const nv = FC.NIVELES.find(x => x.n === n);
    const c = P.demo ? {} : casoLocal(n);
    const yaTermino = Boolean(resultadoCaso(n)) && !P.demo;
    if (!c.estado && !yaTermino && !confirm(`Vas a iniciar el nivel ${n} (${nv.etapa}).\n\n• Un solo intento y ${FC.VIDAS_COMPETENCIA} vidas.\n• El cronómetro empieza ahora y no se detiene.\n• Cada decisión es definitiva.\n• Tienes 1 comodín.\n\n¿Comenzar?`)) return;
    if (!c.estado) { c.estado = { elecciones: [], inicio: Date.now(), escenas: [], comodinUsado: false }; guardarP(); }
    FC.Caso.abrir({
      casoId: nv.caso, modo: 'competencia', etiqueta: `Nivel ${n} · ${nv.etapa} · ${nv.titulo}${P.demo ? ' · DEMOSTRACIÓN' : ''}`,
      estado: c.estado,
      alGuardar: est => { c.estado = est; guardarP(); },
      alTerminar: res => { if (!P.demo) { c.resultado = { ...res, fecha: new Date().toISOString() }; c.pendienteEnvio = true; guardarP(); enviarResultado(n); } },
      podio: n === 7 ? () => FC.Datos.podio(7) : null,
      alCerrar: render
    });
  }

  async function enviarResultado(n) {
    const c = casoLocal(n);
    if (!c.resultado || !c.pendienteEnvio) return;
    try {
      await FC.Datos.enviarResultado(P.usuario, P.clave, { nivel: n, ...c.resultado, detalle: { sinVidas: c.resultado.sinVidas } });
      c.pendienteEnvio = false; guardarP();
      FC.Caso.avisoEnvio('✅ Tu resultado se envió al facilitador.');
      sincronizar();
    } catch (e) {
      FC.Caso.avisoEnvio(`⚠️ No se pudo enviar tu resultado: ${esc(e.message)} Se reintentará automáticamente.`);
    }
  }
  const reintentarEnvios = () => { for (const n of [6, 7]) if (P?.progreso?.casos?.[n]?.pendienteEnvio) enviarResultado(n); };

  // ---------- Podio ----------
  function podioHTML(lista, titulo = 'Podio') {
    if (!lista?.length) return `<h2 style="font-size:24px;font-weight:900;text-align:center">🏆 ${esc(titulo)}</h2><p class="muted" style="text-align:center;margin-top:10px">Aún no hay resultados registrados.</p>`;
    const orden = [1, 0, 2].filter(i => lista[i]);
    return `<div class="podio-final">
      <h2>🏆 ${esc(titulo)}</h2>
      <div class="podio-escalones">${orden.map(i => `<div class="escalon e${i + 1}">
        <div class="medalla">${['🥇', '🥈', '🥉'][i]}</div>
        <b class="podio-nombre">${esc(lista[i].nombre)}</b>
        <span class="podio-puntos">${lista[i].puntaje} pts · ${Math.floor(lista[i].segundos / 60)}:${String(lista[i].segundos % 60).padStart(2, '0')}</span>
        <div class="bloque"><span>${i + 1}</span><small>Gift card S/ ${PREMIOS[i]}</small></div>
      </div>`).join('')}</div></div>`;
  }

  // ---------- Master ----------
  function vMaster() {
    if (!esMaster()) {
      return `<h1 class="vista-titulo">🔑 Acceso master</h1>
        <p class="vista-sub">Desde aquí el facilitador ve a los participantes, habilita los niveles de competencia, dirige la clase guiada y proyecta el ranking.</p>
        <form id="form-login" class="tarjeta" style="max-width:420px;display:grid;gap:12px" autocomplete="off">
          <div><label class="etiqueta" for="clave">Clave</label><input class="campo" id="clave" type="password" inputmode="numeric" required></div>
          ${ui.msg?.login ? `<p class="mensaje-error">${ui.msg.login === true ? 'Clave incorrecta.' : esc(ui.msg.login)}</p>` : ''}
          <button class="btn btn-certus" type="submit">Ingresar</button>
          ${P ? '' : '<button class="enlace" type="button" data-accion="volver-acceso">Volver al registro de participantes</button>'}
        </form>`;
    }
    if (P?.demo) return '<h1 class="vista-titulo">🔑 Panel master</h1><p class="vista-sub">Estás en la demostración. Sal de ella para volver al panel.</p>';
    const m = ui.master;
    if (!m.lista && !m.error) cargarMaster();
    const lista = m.lista || [];
    const nombreNivel = n => FC.NIVELES.find(x => x.n === n).etapa;
    const filas = lista.map(p => {
      const hechas = Object.values(p.progreso?.lecciones || {}).filter(l => l.aprobada).length;
      const celdaNivel = n => p.resultados?.[n] ? `<span class="chip dorado">${p.resultados[n].puntaje} pts</span>` : p.habilitado.includes(n) ? '<span class="chip verde">Habilitado</span>' : '<span class="chip">—</span>';
      return `<tr>
        <td><input type="checkbox" class="sel" data-id="${p.id}" ${m.sel.has(p.id) ? 'checked' : ''}></td>
        <td><b>${esc(p.nombre)}</b><br><small class="muted">${esc(p.condicion)}</small></td>
        <td>@${esc(p.usuario)}</td>
        <td><code>${m.ver[p.id] || m.ver.todas ? esc(p.clave) : '••••••'}</code> <button class="btn-icono" title="Ver contraseña" data-accion="ver-clave" data-id="${p.id}" style="width:30px;height:30px;font-size:16px">👁</button></td>
        <td class="num">${hechas}/16</td>
        <td>${celdaNivel(6)}</td><td>${celdaNivel(7)}</td>
        <td><button class="btn-icono" title="Eliminar participante" data-accion="borrar-participante" data-id="${p.id}">🗑</button></td>
      </tr>`;
    }).join('');
    const ranking = m.ranking[m.nivel];
    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px">
        <h1 class="vista-titulo" style="margin:0">🔑 Panel master</h1>
        <div class="codigos" style="margin:0"><span class="chip ${FC.Datos.modo === 'nube' ? 'verde' : 'dorado'}">${FC.Datos.modo === 'nube' ? '☁️ Conectado a Supabase' : '💻 Modo local'}</span>
        <button class="btn btn-blanco btn-chico" data-accion="salir-master">Salir del modo master</button></div>
      </div>
      ${m.error ? `<div class="banner-demo"><span class="emoji">⚠️</span><p>${esc(m.error)}</p><button class="btn btn-blanco btn-chico" data-accion="recargar-master">Reintentar</button></div>` : ''}

      <div class="seccion"><h2>👩🏻‍🏫 Nivel 5 · Clase guiada</h2>
        <div class="tarjeta"><p class="muted" style="font-weight:600;margin-bottom:10px">Proyecta y resuelve cada subnivel con la clase. No hay vidas ni puntaje; el comodín se puede usar libremente para mostrar cómo funciona.</p>
          <div class="codigos">${FC.NIVELES.find(n => n.subniveles).subniveles.map(sb => `<button class="btn btn-azul btn-chico" data-accion="guiado-master" data-id="${sb.id}">${sb.icono} ${esc(sb.titulo)}</button>`).join('')}
          <button class="btn btn-certus btn-chico" data-accion="demo">🎬 Demostración completa</button></div></div></div>

      <div class="seccion"><h2>👥 Participantes registrados (${lista.length})</h2>
        <div class="tarjeta">
          <div class="codigos" style="margin:0 0 12px">
            <button class="btn btn-blanco btn-chico" data-accion="sel-todos">${m.sel.size === lista.length && lista.length ? 'Quitar selección' : 'Seleccionar todos'}</button>
            <button class="btn btn-chico" data-accion="habilitar" data-n="6" data-v="1" ${m.sel.size ? '' : 'disabled'}>Habilitar ${nombreNivel(6)} (${m.sel.size})</button>
            <button class="btn btn-blanco btn-chico" data-accion="habilitar" data-n="6" data-v="0" ${m.sel.size ? '' : 'disabled'}>Quitar ${nombreNivel(6)}</button>
            <button class="btn btn-certus btn-chico" data-accion="habilitar" data-n="7" data-v="1" ${m.sel.size ? '' : 'disabled'}>Habilitar ${nombreNivel(7)} (${m.sel.size})</button>
            <button class="btn btn-blanco btn-chico" data-accion="habilitar" data-n="7" data-v="0" ${m.sel.size ? '' : 'disabled'}>Quitar ${nombreNivel(7)}</button>
            <button class="btn btn-blanco btn-chico" data-accion="ver-todas">${m.ver.todas ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}</button>
            <button class="btn btn-blanco btn-chico" data-accion="recargar-master">↻ Actualizar</button>
          </div>
          <p style="font-weight:700;margin-bottom:12px">Seleccionar a los mejores <input class="campo" type="number" min="1" max="50" value="${m.top}" id="top-n" style="width:70px;display:inline-block;padding:6px 8px"> de la competencia (nivel 6) <button class="btn btn-blanco btn-chico" data-accion="sel-top">Seleccionar</button></p>
          ${lista.length ? `<div class="table-wrap"><table><thead><tr><th></th><th>Participante</th><th>Usuario</th><th>Contraseña</th><th class="num">Lecciones</th><th>${nombreNivel(6)}</th><th>${nombreNivel(7)}</th><th></th></tr></thead><tbody>${filas}</tbody></table></div>`
            : `<p class="muted">${m.lista ? 'Aún no hay participantes registrados.' : 'Cargando…'}</p>`}
        </div></div>

      <div class="seccion"><h2>🏆 Ranking en vivo</h2>
        <nav class="tabs">${[6, 7].map(k => `<button class="tab${k === m.nivel ? ' activa' : ''}" data-accion="tab-ranking" data-n="${k}">Nivel ${k} · ${nombreNivel(k)}</button>`).join('')}</nav>
        ${m.nivel === 7 && ranking?.length ? `<div class="tarjeta" style="margin-bottom:14px">${podioHTML(ranking.slice(0, 3), 'Podio de la final')}<div class="codigos" style="justify-content:center"><button class="btn btn-certus" data-accion="proyectar-podio">Proyectar podio en pantalla completa</button></div></div>` : ''}
        ${ranking?.length ? `<div class="table-wrap"><table><thead><tr><th>#</th><th>Participante</th><th class="num">Puntaje</th><th class="num">Tiempo</th><th class="num">Vidas</th><th>Comodín</th><th></th></tr></thead>
          <tbody>${ranking.map((f, i) => `<tr class="${m.nivel === 6 && i < m.top ? 'clasifica' : ''}"><td><b>${i + 1}</b></td><td><b>${esc(f.nombre)}</b><br><small class="muted">@${esc(f.usuario)}</small></td>
            <td class="num"><b>${f.puntaje}</b></td><td class="num">${Math.floor(f.segundos / 60)}:${String(f.segundos % 60).padStart(2, '0')}</td><td class="num">❤️ ${f.vidas}</td><td>${f.comodin ? '🃏 usado' : '—'}</td>
            <td class="num" style="white-space:nowrap"><button class="btn-icono" title="Ver estados" data-accion="ver-resultado" data-i="${i}">📊</button><button class="btn-icono" title="Borrar resultado (permite repetir)" data-accion="borrar-resultado" data-id="${f.id}">🗑</button></td></tr>`).join('')}</tbody></table></div>
          <p class="muted" style="margin-top:8px;font-weight:600;font-size:13px">Orden: mayor puntaje; si hay empate, menor tiempo.${m.nivel === 6 ? ` En verde, los ${m.top} primeros.` : ''}</p>
          <div class="codigos"><button class="btn btn-blanco btn-chico" data-accion="csv">⬇ Exportar ranking (CSV)</button><button class="btn btn-blanco btn-chico" data-accion="recargar-ranking">↻ Actualizar ranking</button></div>`
          : `<p class="muted">${ranking ? 'Aún no hay resultados en este nivel.' : 'Cargando…'}</p>`}
      </div>

      <div class="seccion"><h2>🧪 Modo prueba</h2>
        <div class="tarjeta"><p class="muted" style="font-weight:600;margin-bottom:10px">Recorre cualquier lección o caso sin guardar resultados.</p>
          <div class="codigos">${FC.NIVELES.filter(n => n.lecciones).map(nv => nv.lecciones.map(l => `<button class="btn btn-blanco btn-chico" data-accion="probar-leccion" data-id="${l.id}">N${nv.n} · ${esc(l.titulo)}</button>`).join('')).join('')}
          ${[6, 7].map(n => `<button class="btn btn-certus btn-chico" data-accion="probar-caso" data-n="${n}">N${n} · ${esc(FC.NIVELES.find(x => x.n === n).titulo)}</button>`).join('')}</div></div></div>`;
  }

  async function cargarMaster() {
    const m = ui.master;
    try {
      const [lista, r6, r7] = await Promise.all([FC.Datos.admin.listar(claveMaster()), FC.Datos.admin.ranking(claveMaster(), 6), FC.Datos.admin.ranking(claveMaster(), 7)]);
      m.lista = lista; m.ranking = { 6: r6, 7: r7 }; m.error = null;
      for (const id of [...m.sel]) if (!lista.some(p => p.id === id)) m.sel.delete(id);
    } catch (e) { m.error = e.message; m.lista = m.lista || []; }
    if (ui.vista === 'master') render();
  }

  async function accionMaster(el) {
    const m = ui.master, n = Number(el.dataset.n);
    switch (el.dataset.accion) {
      case 'salir-master': try { sessionStorage.removeItem(MASTER_SES); } catch { /* */ } ui.master.lista = null; ir(P ? 'ruta' : 'master'); break;
      case 'recargar-master': case 'recargar-ranking': m.error = null; await cargarMaster(); break;
      case 'ver-clave': m.ver[el.dataset.id] = !m.ver[el.dataset.id]; render(); break;
      case 'ver-todas': m.ver = { todas: !m.ver.todas }; render(); break;
      case 'sel-todos': if (m.sel.size === m.lista.length) m.sel.clear(); else m.lista.forEach(p => m.sel.add(p.id)); render(); break;
      case 'sel-top': {
        m.top = Math.max(1, Number($('top-n').value) || 4);
        m.sel = new Set((m.ranking[6] || []).slice(0, m.top).map(f => f.participante_id));
        render(); break;
      }
      case 'habilitar': {
        const valor = el.dataset.v === '1';
        if (!confirm(`¿${valor ? 'Habilitar' : 'Quitar'} el nivel ${n} a ${m.sel.size} participante(s)?`)) return;
        try { await FC.Datos.admin.habilitar(claveMaster(), [...m.sel], n, valor); await cargarMaster(); } catch (e) { alert(e.message); }
        break;
      }
      case 'borrar-participante': {
        const p = m.lista.find(x => x.id === el.dataset.id);
        if (!confirm(`¿Eliminar a ${p.nombre} (@${p.usuario}) y todos sus resultados? No se puede deshacer.`)) return;
        try { await FC.Datos.admin.borrarParticipante(claveMaster(), p.id); m.sel.delete(p.id); await cargarMaster(); } catch (e) { alert(e.message); }
        break;
      }
      case 'borrar-resultado': {
        if (!confirm('¿Borrar este resultado? El participante podrá volver a jugar el nivel desde otra computadora.')) return;
        try { await FC.Datos.admin.borrarResultado(claveMaster(), el.dataset.id); await cargarMaster(); } catch (e) { alert(e.message); }
        break;
      }
      case 'tab-ranking': m.nivel = n; render(); cargarMaster(); break;
      case 'proyectar-podio': modal(podioHTML(m.ranking[7].slice(0, 3), 'Podio de la final'), true); FC.Sonido.completado(); FC.Leccion.confeti(); break;
      case 'ver-resultado': verResultado(m.ranking[m.nivel][Number(el.dataset.i)]); break;
      case 'csv': exportarCSV(m.nivel); break;
      case 'guiado-master': abrirGuiado(el.dataset.id, true); break;
      case 'demo': iniciarDemo(); break;
      case 'probar-leccion': FC.Leccion.abrir(el.dataset.id, { prueba: true, alTerminar: render }); break;
      case 'probar-caso': {
        const nv = FC.NIVELES.find(x => x.n === n);
        FC.Caso.abrir({ casoId: nv.caso, modo: 'prueba', etiqueta: `Nivel ${n} · ${nv.titulo}`, alCerrar: render });
        break;
      }
    }
  }

  function verResultado(f) {
    const nv = FC.NIVELES.find(x => x.n === ui.master.nivel);
    const r = FC.Motor.recorrer(FC.CASOS[nv.caso], f.elecciones, FC.VIDAS_COMPETENCIA);
    if (r.error) { modal('<p class="mensaje-error">No se pudo reconstruir este resultado.</p>'); return; }
    const p = FC.Motor.puntaje(r);
    modal(`<h2 style="font-size:22px;font-weight:900">${esc(f.nombre)} · Nivel ${nv.n}</h2>
      <p class="muted" style="margin:4px 0 14px">${f.puntaje} puntos · ${Math.floor(f.segundos / 60)}:${String(f.segundos % 60).padStart(2, '0')} · ❤️ ${f.vidas}${f.comodin ? ' · 🃏 comodín usado' : ''}</p>
      <div class="grid-2" style="margin-bottom:14px">
        <div class="tarjeta"><h3 style="margin-bottom:8px">Puntaje</h3><table><tbody>${p.detalle.map(d => `<tr><td>${esc(d.motivo)}</td><td class="num">${d.puntos > 0 ? '+' : ''}${d.puntos}</td></tr>`).join('')}</tbody></table></div>
        <div class="tarjeta"><h3 style="margin-bottom:8px">Decisiones</h3><ol style="margin:0;padding-left:20px;line-height:1.6;font-weight:600">${r.pasos.filter(x => x.nodo.tipo === 'decision').map(x => `<li>${esc(x.nodo.opciones[x.eleccion].texto)}</li>`).join('')}</ol></div>
      </div>
      ${FC.Caso.tablasEstados(r.actual)}`);
    FC.Caso.activarTabs($('modal-contenido'));
  }

  function exportarCSV(n) {
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const filas = [['Puesto', 'Participante', 'Usuario', 'Condición', 'Puntaje', 'Tiempo (s)', 'Vidas', 'Comodín', n === 7 ? 'Premio' : '']];
    (ui.master.ranking[n] || []).forEach((f, i) => filas.push([i + 1, f.nombre, f.usuario, f.condicion, f.puntaje, f.segundos, f.vidas, f.comodin ? 'Sí' : 'No', n === 7 && PREMIOS[i] ? `S/ ${PREMIOS[i]}` : '']));
    const url = URL.createObjectURL(new Blob(['﻿' + filas.map(f => f.map(q).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `financial-challenge-nivel-${n}.csv` });
    document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  // ---------- Eventos ----------
  function enlazar() {
    document.querySelectorAll('#vista [data-leccion]').forEach(b => b.addEventListener('click', () => abrirLeccion(b.dataset.leccion)));
    document.querySelectorAll('#vista [data-guiado]').forEach(b => b.addEventListener('click', () => abrirGuiado(b.dataset.guiado)));
    document.querySelectorAll('#vista [data-caso]').forEach(b => b.addEventListener('click', () => abrirCaso(Number(b.dataset.caso))));
    document.querySelectorAll('#vista .sel').forEach(c => c.addEventListener('change', () => { c.checked ? ui.master.sel.add(c.dataset.id) : ui.master.sel.delete(c.dataset.id); render(); }));
    $('form-login')?.addEventListener('submit', async e => {
      e.preventDefault();
      const clave = $('clave').value.trim();
      e.target.querySelector('button[type=submit]').disabled = true;
      try {
        // La clave la valida el servidor (o la huella local); no hay copia de ella en el navegador.
        await FC.Datos.admin.listar(clave);
        try { sessionStorage.setItem(MASTER_SES, clave); } catch { /* */ }
        ui.msg = null; ui.master.lista = null;
        ir('master');
      } catch (err) {
        ui.msg = { login: err.codigo === 'MASTER' ? true : err.message };
        render();
      }
    });
    $('form-acceso')?.addEventListener('submit', e => { e.preventDefault(); enviarAcceso(e.target); });
  }

  // Acciones con data-accion en toda la página (vista, panel, acceso y modal)
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-accion]');
    if (!el || el.disabled) return;
    switch (el.dataset.accion) {
      case 'pestana': ui.acceso = el.dataset.p; ui.msg = null; render(); return;
      case 'ya-anote': {
        const { d, clave } = participantePendiente;
        P = { usuario: d.usuario, clave, progreso: progresoVacio() }; aplicarServidor(d, true); guardarSesion();
        ui.nuevaCuenta = null; participantePendiente = null; ir('ruta'); return;
      }
      case 'ir-master': ir('master'); return;
      case 'volver-acceso': ir('ruta'); return;
      case 'salir-demo': salirDemo(); return;
      case 'repaso': abrirRepaso(); return;
      case 'actualizar': sincronizar(); return;
      case 'reenviar': reintentarEnvios(); return;
      case 'podio-participante': modal('<p class="muted">Cargando el podio…</p>'); FC.Datos.podio(7).then(l => modal(podioHTML(l, 'Podio de la final'))).catch(err => modal(`<p class="mensaje-error">${esc(err.message)}</p>`)); return;
      default: if (ui.vista === 'master') accionMaster(el);
    }
  });

  // ---------- Modal ----------
  function modal(html, grande = false) {
    $('modal-contenido').innerHTML = html;
    $('modal').classList.toggle('grande', grande);
    $('modal').hidden = false;
  }
  function cerrarModal() { $('modal').hidden = true; }

  // ---------- Arranque ----------
  function init() {
    FC.Leccion.init();
    FC.Caso.init();
    document.querySelectorAll('#nav button[data-vista]').forEach(b => b.addEventListener('click', () => ir(b.dataset.vista)));
    $('nav-salir').addEventListener('click', cerrarSesion);
    $('modal').addEventListener('click', e => { if (e.target.closest('[data-cerrar]')) cerrarModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('modal').hidden) cerrarModal(); });
    try { P = JSON.parse(localStorage.getItem(SESION_KEY)); } catch { P = null; }
    if (P) { P.progreso = { ...progresoVacio(), ...P.progreso }; ui.acceso = 'entrar'; sincronizar(); }
    setInterval(() => { if (P && !P.demo) sincronizar(); if (ui.vista === 'master' && esMaster() && $('caso').hidden) cargarMaster(); }, 20000);
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
  return { modal, cerrarModal, podioHTML };
})();
