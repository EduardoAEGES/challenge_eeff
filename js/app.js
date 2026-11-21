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
  const PREMIOS = [150, 100, 60, 30]; // gift cards en soles para los puestos 1.º a 4.º
  const { fmt, esc } = V;
  const $ = id => document.getElementById(id);

  let P = null;            // participante con sesión: { usuario, clave, nombre, condicion, habilitado, resultados, progreso, demo? }
  let participanteReal = null;
  const ui = { vista: 'ruta', acceso: 'registro', msg: null, nuevaCuenta: null, master: { lista: null, ranking: {}, nivel: 6, error: null, ver: {}, sel: new Set(), top: 4 } };
  let sincronizando = null;

  const MASTER_REFRESCO = 5000; // ms entre actualizaciones del panel master
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
    else if (P.progreso) { // la respuesta a la invitación vive en el servidor (el master puede quitarla)
      if (d.progreso?.invitacion) P.progreso.invitacion = d.progreso.invitacion; else delete P.progreso.invitacion;
    }
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
    renderEncuesta();
    enlazar();
  }

  // ---------- Registro e inicio de sesión ----------
  function vAcceso() {
    const cab = `<header><img src="img/logo-certus.png" alt="CERTUS" width="1148" height="320"><h1>FINANCIAL CHALLENGE</h1>
      <p>El reto de los estados financieros. Aprende con lecciones cortas y compite tomando decisiones empresariales.</p></header>`;
    if (ui.nuevaCuenta) {
      const c = ui.nuevaCuenta;
      return `${cab}<div class="anota"><h2>${FC.ico('notas')} ¡Cuenta creada! Anota tus datos</h2>
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
        ${registro ? `<p class="nota-acceso">${FC.ico('notas')} <b>Anota tu usuario y contraseña</b>: los necesitarás el día del reto. No uses una contraseña que uses en otros sitios: el facilitador puede verla para ayudarte si la olvidas.</p>` : ''}
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

  async function cerrarSesion() {
    if (!await FC.confirmar({ icono: FC.ico('salir'), titulo: '¿Cerrar sesión?', texto: 'Tu avance queda guardado. Podrás entrar de nuevo con tu usuario y contraseña.', aceptar: 'Cerrar sesión', cancelar: 'Seguir aquí' })) return;
    P = null;
    try { localStorage.removeItem(SESION_KEY); } catch { /* */ }
    ui.acceso = 'entrar';
    ir('ruta');
  }

  // ---------- Demostración (solo desde master) ----------
  let comodinesPrueba = {}; // modo prueba del master: un comodín por nivel mientras dure la sesión
  function iniciarDemo({ previaCompleta = false } = {}) {
    participanteReal = P;
    P = { usuario: 'demo', clave: '', nombre: 'Participante de demostración', condicion: 'Estudiante', habilitado: [6, 7], resultados: {}, progreso: progresoVacio(), demo: true };
    // Simulación: niveles 1 a 4 aprobados, como si terminara la etapa previa
    if (previaCompleta) FC.NIVELES.filter(nv => nv.lecciones && nv.n <= 4).forEach(nv => nv.lecciones.forEach(l => { P.progreso.lecciones[l.id] = { precision: 100, aprobada: true, fecha: new Date().toISOString() }; }));
    ir('ruta');
  }
  function salirDemo() { P = participanteReal; participanteReal = null; ir('master'); }
  const bannerDemo = () => (P?.demo ? `<div class="banner-demo"><span class="emoji">${FC.ico('play')}</span>
    <p>Modo demostración (master): todos los niveles están abiertos y nada de lo que hagas se guarda.</p>
    <button class="btn btn-blanco btn-chico" data-accion="salir-demo">Salir de la demostración</button></div>` : '');

  // ---------- Panel derecho ----------
  function vPanel() {
    if (!P) return `<div class="tarjeta panel-tarjeta"><h3>${FC.ico('trofeo')} Financial Challenge</h3><p>Crea tu cuenta o entra para empezar tu ruta.</p></div>`;
    const totalLec = FC.NIVELES.filter(n => n.lecciones).reduce((a, n) => a + n.lecciones.length, 0);
    const hechas = IDS_LECCIONES.filter(id => prog().lecciones[id]?.aprobada).length;
    const iniciales = P.nombre.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const c = prog().corazones;
    return `
      <div class="tarjeta panel-tarjeta"><div class="perfil"><div class="avatar">${esc(iniciales)}</div><div><h3 style="margin:0">${esc(P.nombre)}</h3><p>${esc(P.condicion)} · @${esc(P.usuario)}</p></div></div></div>
      <div class="stats">
        <div class="stat"><span class="stat-ic t-dorado">${FC.ico('rayo')}</span><div><small>XP</small>${prog().xp}</div></div>
        <div class="stat corazones-panel"><span class="stat-ic t-rojo">${FC.ico('corazon')}</span><div><small>Corazones</small>${c}/${CORAZONES_MAX}</div></div>
      </div>
      <div class="stats"><div class="stat"><span class="stat-ic t-azul">${FC.ico('libro')}</span><div><small>Lecciones</small>${hechas}/${totalLec}</div></div></div>
      ${c === 0 ? `<div class="tarjeta panel-tarjeta"><h3>${FC.ico('corazonRoto')} Sin corazones</h3><p>Haz una sesión de repaso para recuperar 2.</p><button class="btn btn-chico" data-accion="repaso" style="margin-top:10px">${FC.ico('repetir')} Sesión de repaso</button></div>` : ''}
      <div class="tarjeta panel-tarjeta"><h3>${FC.ico('comodin')} Comodines</h3><p>Uno por nivel. ${[1, 2, 3, 4].map(n => `<span class="comodin-n${prog().comodines[n] ? ' usado' : ''}">N${n}</span>`).join(' ')}</p></div>
      <div class="tarjeta panel-tarjeta"><h3>${FC.ico('regalo')} Premios de la final</h3>
        <p class="premios">${PREMIOS.map((m, i) => `${FC.medalla(i)} Gift card de S/ ${m}`).join('<br>')}</p></div>`;
  }

  // ---------- Ruta ----------
  const DESPLAZAMIENTO = [0, 55, 85, 55, 0, -55, -85, -55];

  function vRuta() {
    if (!P) return '';
    return `
      <header class="portada">
        <div><small>CERTUS · Área de Finanzas</small><h1>Aprende, decide y compite</h1>
        <p>Niveles 1 a 4: teoría con práctica. Nivel 5: clase guiada con el docente. Niveles 6 y 7: competencia, que habilita el facilitador.</p></div>
        <div class="emoji">${FC.ico('barras')}</div>
      </header>
      ${prog().corazones === 0 && !P.demo ? `<div class="banner-demo"><span class="emoji">${FC.ico('corazonRoto')}</span><p>Te quedaste sin corazones. Haz una sesión corta de repaso para recuperar 2 y seguir con tus lecciones.</p><button class="btn btn-chico" data-accion="repaso">${FC.ico('repetir')} Ir al repaso</button></div>` : ''}
      ${bannerInvitacion()}
      <div class="ruta">${FC.NIVELES.map(nv => (nv.lecciones ? unidadLecciones(nv) : nv.subniveles ? unidadGuiada(nv) : unidadCaso(nv))).join('')}</div>`;
  }

  function camino(nodos) {
    return `<div class="camino">${nodos.map((x, i) => `<div class="nodo-env${x.actual ? ' actual' : ''}" style="transform:translateX(${DESPLAZAMIENTO[i % 8]}px)">
      ${x.actual ? `<span class="empezar">${i === 0 ? 'Empezar' : 'Siguiente'}</span>` : ''}
      <button class="nodo c-${x.color} ${x.estado}${x.examen ? ' examen' : ''}${x.actual ? ' actual' : ''}" ${x.attr} title="${esc(x.titulo)}">${x.estado === 'bloqueado' ? FC.ico('candado') : FC.icono(x.icono)}</button>
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
      <div class="unidad-cabecera c-${nv.color}"><div><small>Nivel ${nv.n} · Teoría</small><h2>${esc(nv.titulo)}</h2><p>${esc(nv.descripcion)}</p></div><div class="emoji">${FC.icono(nv.icono)}</div></div>
      ${abierta ? '' : `<p class="muted" style="text-align:center;margin-top:10px">${FC.ico('candado')} Aprueba el examen del nivel ${nv.n - 1} para abrir este nivel.</p>`}
      ${camino(nodos)}</section>`;
  }

  function unidadGuiada(nv) {
    const nodos = nv.subniveles.map(sub => ({ color: nv.color, estado: prog().guiado[sub.id] ? 'completado' : 'disponible', icono: sub.icono, titulo: sub.titulo, attr: `data-guiado="${sub.id}"` }));
    return `<section class="unidad">
      <div class="unidad-cabecera c-${nv.color}"><div><small>Nivel ${nv.n} · ${nv.etapa}</small><h2>${esc(nv.titulo)}</h2><p>${esc(nv.descripcion)}</p></div><div class="emoji">${FC.icono(nv.icono)}</div></div>
      ${camino(nodos)}</section>`;
  }

  function unidadCaso(nv) {
    const c = casoLocal(nv.n);
    const r = resultadoCaso(nv.n);
    let acciones;
    if (r && !P.demo) {
      const t = r.segundos;
      acciones = `<span class="chip verde">${FC.ico('check')} Completado</span> <span class="chip dorado">${FC.ico('trofeo')} ${r.puntaje} puntos · ${FC.ico('reloj')} ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')} · ${FC.ico('corazon', 't-rojo')} ${r.vidas}</span>
        ${c.estado ? `<button class="btn btn-blanco btn-chico" data-caso="${nv.n}">Ver resultado</button>` : ''}
        ${c.pendienteEnvio ? '<button class="btn btn-azul btn-chico" data-accion="reenviar">Reintentar envío</button><span class="mensaje-error">Resultado aún no enviado.</span>' : ''}
        ${nv.n === 7 ? `<button class="btn btn-certus btn-chico" data-accion="podio-participante">${FC.ico('trofeo')} Ver podio</button>` : ''}`;
    } else if (!habilitado(nv.n)) {
      acciones = `<span class="candado">${FC.ico('candado')} El facilitador habilitará este nivel el día del reto.</span><button class="btn btn-blanco btn-chico" data-accion="actualizar">${FC.ico('actualizar')} Actualizar</button>`;
    } else if (c.estado && !P.demo) {
      acciones = `<button class="btn btn-certus" data-caso="${nv.n}">Continuar caso →</button><span class="muted" style="font-size:13px">El cronómetro sigue corriendo.</span>`;
    } else {
      acciones = `<button class="btn btn-certus" data-caso="${nv.n}">Comenzar caso →</button><span class="muted" style="font-size:13px">Un solo intento · ${FC.VIDAS_COMPETENCIA} vidas · 1 comodín.</span>`;
    }
    return `<section class="unidad">
      <div class="unidad-cabecera c-certus"><div><small>Nivel ${nv.n} · ${nv.etapa}</small><h2>Caso de empresa</h2><p>Una sola empresa, varias decisiones encadenadas. Resultado por puntaje; el tiempo desempata.</p></div><div class="emoji">${FC.ico('edificio')}</div></div>
      <div class="caso-tarjeta"><div class="emoji">${FC.icono(nv.icono)}</div>
        <div><span class="chip azul">${nv.etapa}</span><h3>${esc(nv.titulo)}</h3><p>${esc(nv.descripcion)}</p></div>
        <div class="caso-acciones">${acciones}</div></div>
    </section>`;
  }

  // ---------- Mi progreso ----------
  function vProgreso() {
    if (!P) return '';
    return `<h1 class="vista-titulo">Mi progreso</h1>
      <p class="vista-sub">${esc(P.nombre)} · @${esc(P.usuario)} · ${FC.ico('rayo', 't-dorado')} ${prog().xp} XP · ${FC.ico('corazon', 't-rojo')} ${prog().corazones}/${CORAZONES_MAX}</p>
      ${FC.NIVELES.map(nv => {
        if (nv.lecciones) return `<div class="seccion tarjeta"><h2 style="font-size:18px;font-weight:900;margin-bottom:8px">${FC.icono(nv.icono)} Nivel ${nv.n}: ${esc(nv.titulo)}</h2>
          <table><tbody>${nv.lecciones.map(l => { const r = prog().lecciones[l.id]; return `<tr><td>${FC.icono(l.icono)} ${esc(l.titulo)}</td><td class="num">${r ? `${r.aprobada ? FC.ico('check', 't-verde') : FC.ico('equis', 't-rojo')} ${r.precision}%` : '<span class="muted">Pendiente</span>'}</td></tr>`; }).join('')}</tbody></table></div>`;
        if (nv.subniveles) return `<div class="seccion tarjeta"><h2 style="font-size:18px;font-weight:900;margin-bottom:8px">${FC.icono(nv.icono)} Nivel ${nv.n}: ${esc(nv.titulo)}</h2>
          <table><tbody>${nv.subniveles.map(sb => `<tr><td>${FC.icono(sb.icono)} ${esc(sb.titulo)}</td><td class="num">${prog().guiado[sb.id] ? FC.ico('check', 't-verde') : '<span class="muted">Pendiente</span>'}</td></tr>`).join('')}</tbody></table></div>`;
        const r = resultadoCaso(nv.n);
        return `<div class="seccion tarjeta"><h2 style="font-size:18px;font-weight:900;margin-bottom:8px">${FC.icono(nv.icono)} Nivel ${nv.n} · ${nv.etapa}: ${esc(nv.titulo)}</h2>
          <p>${r ? `Puntaje <b>${r.puntaje}</b> · tiempo ${Math.floor(r.segundos / 60)}:${String(r.segundos % 60).padStart(2, '0')} · ${FC.ico('corazon', 't-rojo')} ${r.vidas}` : habilitado(nv.n) ? 'Habilitado, pendiente de jugar.' : 'Aún no habilitado.'}</p></div>`;
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

  // ---------- Invitación a la etapa presencial (al terminar los niveles 1 a 4) ----------
  const EVENTO = { dia: 'Miércoles', fecha: '25 de noviembre', lugar: 'Laboratorio 8', sede: 'Sede Arequipa', cupos: 25, premiados: 4 };
  const etapaPreviaCompleta = () => Boolean(P) && nivelAprobado(4);
  const invitacion = () => prog().invitacion || null;
  const inv = { editando: false, cupos: null, error: null };

  function htmlCupos() {
    const c = inv.cupos;
    if (!c) return '<p class="invita-cupos muted">Consultando cupos disponibles…</p>';
    const libres = Math.max(0, c.limite - c.confirmados);
    return `<div class="invita-cupos ${libres ? '' : 'lleno'}"><div><b>${libres ? `Quedan ${libres} de ${c.limite} cupos` : 'Cupos agotados'}</b>
      <span>${c.confirmados} confirmado(s)</span></div><div class="barra"><div style="width:${Math.min(100, (c.confirmados / c.limite) * 100)}%"></div></div></div>`;
  }

  // ---------- Antes de la invitación: encuesta NPS y foto opcional ----------
  // Orden: 1) NPS  2) foto (o la omite)  3) invitación con el formulario de inscripción
  function abrirEtapaFinal(primeraVez = false) {
    if (!P) return;
    if (!prog().nps) return abrirNps(primeraVez);
    if (!prog().fotoPaso) return abrirFoto();
    abrirInvitacion(primeraVez && !prog().invitacion);
  }

  const nps = { valor: null, motivo: '', error: null };
  function abrirNps(celebrar = false) {
    const nombre = esc((P.nombre || '').split(' ')[0] || P.usuario);
    modal(`<div class="paso-final">
      <div class="pasos-indicador"><span class="activo">1. Tu opinión</span><span>2. Foto</span><span>3. Inscripción</span></div>
      <div class="nps-cab">${FC.ico('trofeo')}<div><small>¡Completaste la etapa previa, ${nombre}!</small><h2>Antes de tu invitación, una pregunta rápida</h2></div></div>
      <form id="form-nps" class="nps-form">
        <p class="nps-pregunta">Del 0 al 10, ¿qué tan probable es que recomiendes el Financial Challenge a un compañero?</p>
        <div class="nps-escala" role="radiogroup" aria-label="Puntaje del 0 al 10">
          ${Array.from({ length: 11 }, (_, i) => `<label class="nps-n n${i <= 6 ? 'd' : i <= 8 ? 'p' : 'r'}"><input type="radio" name="nps" value="${i}" ${nps.valor === i ? 'checked' : ''}><span>${i}</span></label>`).join('')}
        </div>
        <div class="nps-extremos"><span>Nada probable</span><span>Muy probable</span></div>
        <div><label class="etiqueta" for="nps-motivo">¿Por qué diste esa nota? (opcional)</label>
          <textarea class="campo" id="nps-motivo" name="motivo" rows="2" maxlength="400" placeholder="Cuéntanos qué te gustó o qué mejorarías">${esc(nps.motivo)}</textarea></div>
        ${nps.error ? `<p class="mensaje-error">${esc(nps.error)}</p>` : ''}
        <button class="btn btn-certus btn-bloque" type="submit">Continuar</button>
      </form></div>`);
    if (celebrar) { FC.Sonido?.completado?.(); FC.Leccion.confeti(); }
  }
  function responderNps(f) {
    nps.motivo = f.motivo.value;
    if (!f.nps.value) { nps.error = 'Elige un número del 0 al 10.'; abrirNps(); return; }
    nps.error = null;
    prog().nps = { valor: Number(f.nps.value), motivo: f.motivo.value.trim().slice(0, 400), fecha: new Date().toISOString() };
    guardarP();
    abrirEtapaFinal();
  }

  // Cámara: se apaga siempre al cerrar el modal o al terminar
  let camara = null, fotoTomada = null;
  function apagarCamara() { camara?.getTracks().forEach(t => t.stop()); camara = null; }
  function abrirFoto(error = null) {
    const puedeCamara = Boolean(navigator.mediaDevices?.getUserMedia);
    modal(`<div class="paso-final">
      <div class="pasos-indicador"><span class="hecho">1. Tu opinión</span><span class="activo">2. Foto</span><span>3. Inscripción</span></div>
      <div class="nps-cab">${FC.ico('usuarios')}<div><small>Opcional</small><h2>Foto para tu identificación el día del evento</h2></div></div>
      <div class="foto-zona">
        <div class="foto-marco">${fotoTomada ? `<img src="${fotoTomada}" alt="Tu foto">` : `<video id="foto-video" autoplay playsinline muted></video><div class="foto-vacia" id="foto-vacia">${FC.ico('usuarios')}<span>${puedeCamara ? 'Activa la cámara para tomar tu foto' : 'Tu navegador no permite usar la cámara'}</span></div>`}</div>
        <label class="foto-consentimiento"><input type="checkbox" id="foto-acepto" ${fotoTomada ? 'checked' : ''}>
          <span>Autorizo a CERTUS a guardar mi foto solo para identificarme durante el Financial Challenge. Será visible únicamente para el facilitador.</span></label>
        ${error ? `<p class="mensaje-error">${esc(error)}</p>` : ''}
        <div class="foto-botones">
          ${fotoTomada
            ? `<button class="btn btn-blanco" type="button" data-accion="foto-repetir">${FC.ico('repetir')} Tomar otra</button><button class="btn btn-certus" type="button" data-accion="foto-guardar">${FC.ico('check')} Usar esta foto</button>`
            : puedeCamara ? `<button class="btn btn-certus" type="button" data-accion="foto-camara" id="foto-btn">${FC.ico('pantalla')} Activar cámara</button>` : ''}
        </div>
        <button class="enlace" type="button" data-accion="foto-omitir">Prefiero no tomarme una foto</button>
      </div></div>`);
  }
  async function encenderCamara() {
    if (!$('foto-acepto')?.checked) { abrirFoto('Marca la casilla de autorización para continuar, o elige no tomarte una foto.'); return; }
    try {
      camara = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }, audio: false });
      const v = $('foto-video'); if (!v) { apagarCamara(); return; }
      v.srcObject = camara; $('foto-vacia')?.remove();
      const b = $('foto-btn'); b.dataset.accion = 'foto-capturar'; b.innerHTML = `${FC.ico('check')} Tomar foto`;
    } catch (e) {
      apagarCamara();
      abrirFoto(e.name === 'NotAllowedError' ? 'No diste permiso para usar la cámara. Puedes permitirlo en el candado de la barra de direcciones, o continuar sin foto.' : 'No se encontró una cámara disponible. Puedes continuar sin foto.');
    }
  }
  function capturarFoto() {
    const v = $('foto-video'); if (!v?.videoWidth) return;
    const lado = Math.min(v.videoWidth, v.videoHeight), c = document.createElement('canvas');
    c.width = c.height = 320;
    const ctx2 = c.getContext('2d');
    ctx2.translate(320, 0); ctx2.scale(-1, 1); // como un espejo, igual que la vista previa
    ctx2.drawImage(v, (v.videoWidth - lado) / 2, (v.videoHeight - lado) / 2, lado, lado, 0, 0, 320, 320);
    fotoTomada = c.toDataURL('image/jpeg', 0.8);
    apagarCamara(); abrirFoto();
  }
  async function guardarFoto() {
    if (!$('foto-acepto')?.checked) { abrirFoto('Marca la casilla de autorización para guardar tu foto.'); return; }
    try {
      if (!P.demo) await FC.Datos.foto(P.usuario, P.clave, fotoTomada);
      prog().fotoPaso = 'tomada'; guardarP(); fotoTomada = null;
      abrirEtapaFinal();
    } catch (e) { abrirFoto(e.message); }
  }

  function abrirInvitacion(primeraVez = false) {
    if (!P) return;
    const r = invitacion();
    const nombre = esc((P.nombre || '').split(' ')[0] || P.usuario);
    const mostrarForm = !r?.respuesta || inv.editando;
    const yaConfirmado = r?.respuesta === 'si';
    const lleno = inv.cupos && inv.cupos.confirmados >= inv.cupos.limite && !yaConfirmado;
    modal(`<div class="invita">
      <div class="invita-cab${primeraVez ? '' : ' sin-anim'}">
        <div class="invita-brillos" aria-hidden="true">${'<i></i>'.repeat(14)}</div>
        <div class="invita-trofeo">${FC.ico('trofeo')}</div>
        <small>Etapa previa completada</small>
        <h2>¡Felicitaciones, ${nombre}!</h2>
        <p>Aprobaste los niveles 1 a 4. Ya estás listo para la etapa presencial del Financial Challenge.</p>
      </div>
      <div class="invita-cuerpo">
        <div class="invita-ticket">
          <div class="invita-fecha"><span>${EVENTO.dia}</span><b>25</b><span>Noviembre</span></div>
          <div class="invita-datos">
            <h3>Te invitamos a participar</h3>
            <p>${FC.ico('pizarra')} Clase guiada y competencia en vivo</p>
            <p>${FC.ico('edificio')} <span><b>${EVENTO.lugar}</b> de la ${EVENTO.sede}</span></p>
            <p>${FC.ico('regalo')} Premios para los ${EVENTO.premiados} primeros puestos: gift cards de S/ ${PREMIOS.join(', ').replace(/, (\d+)$/, ' y $1')}</p>
            <p>${FC.ico('usuarios')} Cupo limitado: ${EVENTO.cupos} participantes</p>
          </div>
        </div>
        ${htmlCupos()}
        ${!mostrarForm ? `<div class="invita-gracias ${r.respuesta}">${FC.ico(r.respuesta === 'si' ? 'check' : 'equis')}
            <div><b>${r.respuesta === 'si' ? '¡Tu inscripción está confirmada!' : 'Registramos que no podrás asistir.'}</b>
            <span>${r.respuesta === 'si' ? `${esc(r.nombre)} · ${esc(r.correo)}<br>Te esperamos el ${EVENTO.dia.toLowerCase()} ${EVENTO.fecha} en el ${EVENTO.lugar}.` : 'Si cambias de opinión, puedes actualizar tu respuesta mientras haya cupos.'}</span></div></div>
          <button class="btn btn-blanco btn-bloque" type="button" data-accion="invitacion-cambiar">Cambiar mi respuesta</button>`
        : `<form id="form-invitacion" class="invita-form" novalidate>
          <p class="invita-pregunta">¿Asistirás el ${EVENTO.dia.toLowerCase()} ${EVENTO.fecha}?</p>
          <div class="invita-opciones">
            <label class="${lleno ? 'deshabilitada' : ''}"><input type="radio" name="respuesta" value="si" ${lleno ? 'disabled' : ''} ${r?.respuesta === 'si' ? 'checked' : ''}><span>${FC.ico('check')} Sí, asistiré</span></label>
            <label><input type="radio" name="respuesta" value="no" ${r?.respuesta === 'no' ? 'checked' : ''}><span>${FC.ico('equis')} No podré asistir</span></label>
          </div>
          <div class="invita-campos">
            <div><label class="etiqueta" for="inv-nombre">Nombres y apellidos completos *</label>
              <input class="campo" id="inv-nombre" name="nombre" autocomplete="name" maxlength="120" value="${esc(r?.nombre || P.nombre || '')}"></div>
            <div><label class="etiqueta" for="inv-correo">Correo electrónico *</label>
              <input class="campo" id="inv-correo" name="correo" type="email" autocomplete="email" maxlength="120" placeholder="nombre@correo.com" value="${esc(r?.correo || '')}"></div>
            <div><label class="etiqueta" for="inv-celular">Celular (opcional)</label>
              <input class="campo" id="inv-celular" name="celular" inputmode="tel" maxlength="15" placeholder="9XX XXX XXX" value="${esc(r?.celular || '')}"></div>
          </div>
          ${inv.error ? `<p class="mensaje-error">${esc(inv.error)}</p>` : ''}
          <button class="btn btn-certus btn-bloque" type="submit">Enviar mi respuesta</button>
          ${P.demo ? '<p class="nota-acceso" style="text-align:center">Simulación: la respuesta no se guarda.</p>' : ''}
        </form>`}
      </div></div>`);
    const formulario = $('form-invitacion');
    if (formulario) actualizarCamposInvitacion(formulario);
    if (primeraVez) { FC.Sonido?.completado?.(); FC.Leccion.confeti(); }
    if (!inv.cupos || primeraVez) FC.Datos.cupos().then(c => { inv.cupos = c; const el = document.querySelector('.invita-cupos'); if (el) el.outerHTML = htmlCupos(); if (c.confirmados >= c.limite && formulario && !yaConfirmado) abrirInvitacion(); }).catch(() => { /* sin conexión: se valida al enviar */ });
  }

  // Nombre y correo solo son obligatorios si la persona asistirá
  function actualizarCamposInvitacion(f) {
    const si = f.respuesta.value === 'si';
    f.querySelector('.invita-campos').classList.toggle('apagados', !si);
  }

  async function responderInvitacion(f) {
    const d = { respuesta: f.respuesta.value, nombre: f.nombre.value.trim().replace(/\s+/g, ' '), correo: f.correo.value.trim(), celular: f.celular.value.trim() };
    inv.error = !d.respuesta ? 'Elige si asistirás o no.'
      : d.respuesta === 'si' && d.nombre.split(' ').length < 2 ? 'Escribe tus nombres y apellidos completos.'
      : d.respuesta === 'si' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.correo) ? 'Escribe un correo electrónico válido.' : null;
    if (inv.error) { abrirInvitacion(); return; }
    const boton = f.querySelector('button[type=submit]'); boton.disabled = true; boton.textContent = 'Enviando…';
    try {
      prog().invitacion = P.demo ? { ...d, fecha: new Date().toISOString() } : await FC.Datos.invitacion(P.usuario, P.clave, d);
      guardarSesion();
      inv.editando = false; inv.error = null;
      FC.Datos.cupos().then(c => { inv.cupos = c; const el = document.querySelector('.invita-cupos'); if (el) el.outerHTML = htmlCupos(); }).catch(() => {});
      if (d.respuesta === 'si') FC.Sonido?.completado?.();
    } catch (e) {
      inv.error = e.message;
      if (e.codigo === 'CUPO_LLENO') inv.cupos = { confirmados: EVENTO.cupos, limite: EVENTO.cupos };
    }
    abrirInvitacion();
    render();
  }

  const bannerInvitacion = () => (P && etapaPreviaCompleta()
    ? `<div class="invita-banner"><span class="invita-banner-ic">${FC.ico('trofeo')}</span>
        <div><b>${invitacion()?.respuesta === 'si' ? 'Inscripción confirmada' : '¡Completaste la etapa previa!'}</b>
        <span>${EVENTO.dia} ${EVENTO.fecha} · ${EVENTO.lugar} · ${EVENTO.sede}</span></div>
        <button class="btn btn-chico ${invitacion() ? 'btn-blanco' : 'btn-certus'}" data-accion="invitacion">${invitacion() ? 'Ver invitación' : 'Responder invitación'}</button></div>`
    : '');

  function abrirLeccion(id) {
    const info = FC.leccionPorId(id);
    const i = info.nivel.lecciones.findIndex(l => l.id === id);
    if (estadoLeccion(info.nivel, i) === 'bloqueado') return;
    if (!P.demo && prog().corazones <= 0) { modal('<h2 style="font-size:22px;font-weight:900">' + FC.ico('corazonRoto') + ' Sin corazones</h2><p style="margin:10px 0 16px;font-weight:600">Haz una sesión de repaso para recuperar 2 corazones.</p><button class="btn" data-accion="repaso">' + FC.ico('repetir') + ' Ir al repaso</button>'); return; }
    FC.Leccion.abrir(id, {
      ...opcionesLeccion(info.nivel.n),
      alTerminar: res => {
        const antes = etapaPreviaCompleta();
        if (res && !P.demo) {
          const previo = prog().lecciones[id];
          if (!previo || res.precision >= previo.precision || (res.aprobada && !previo.aprobada)) {
            prog().lecciones[id] = { precision: res.precision, aprobada: res.aprobada || Boolean(previo?.aprobada), fecha: new Date().toISOString() };
          }
          prog().xp += res.xp;
          guardarP();
        }
        render();
        if (!P.demo && !antes && etapaPreviaCompleta() && !invitacion()) setTimeout(() => abrirEtapaFinal(true), 350);
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

  async function abrirCaso(n) {
    if (!habilitado(n)) return;
    const nv = FC.NIVELES.find(x => x.n === n);
    const c = P.demo ? {} : casoLocal(n);
    const yaTermino = Boolean(resultadoCaso(n)) && !P.demo;
    if (!c.estado && !yaTermino && !await FC.confirmar({
      cabecera: `Nivel ${n} · ${nv.etapa}`, icono: FC.icono(nv.icono) || FC.ico('bandera'), titulo: nv.titulo, texto: 'Lee las reglas antes de empezar.',
      tono: n === 7 ? 'dorado' : 'certus',
      items: [
        [FC.ico('diana'), 'Un solo intento', 'Tu primer recorrido es el que cuenta para el ranking.'],
        [FC.ico('corazon'), `${FC.VIDAS_COMPETENCIA} vidas`, 'Cada decisión equivocada te quita una.'],
        [FC.ico('reloj'), 'El cronómetro no se detiene', 'Empieza ahora y sigue aunque salgas del caso.'],
        [FC.ico('comodin'), '1 comodín', 'Úsalo en la pregunta que más te cueste.']
      ],
      nota: 'Cada decisión es definitiva: piensa antes de responder.',
      aceptar: '¡Comenzar!', cancelar: 'Todavía no'
    })) return;
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
      FC.Caso.avisoEnvio(FC.ico('check') + ' Tu resultado se envió al facilitador.');
      sincronizar();
    } catch (e) {
      FC.Caso.avisoEnvio(`${FC.ico('alerta')} No se pudo enviar tu resultado: ${esc(e.message)} Se reintentará automáticamente.`);
    }
  }
  const reintentarEnvios = () => { for (const n of [6, 7]) if (P?.progreso?.casos?.[n]?.pendienteEnvio) enviarResultado(n); };

  // ---------- Podio ----------
  function podioHTML(lista, titulo = 'Podio') {
    if (!lista?.length) return `<h2 style="font-size:24px;font-weight:900;text-align:center">${FC.ico('trofeo')} ${esc(titulo)}</h2><p class="muted" style="text-align:center;margin-top:10px">Aún no hay resultados registrados.</p>`;
    const orden = [1, 0, 2].filter(i => lista[i]);
    return `<div class="podio-final">
      <h2>${FC.ico('trofeo')} ${esc(titulo)}</h2>
      <div class="podio-escalones">${orden.map(i => `<div class="escalon e${i + 1}">
        <div class="medalla">${FC.medalla(i)}</div>
        <b class="podio-nombre">${esc(lista[i].nombre)}</b>
        <span class="podio-puntos">${lista[i].puntaje} pts · ${Math.floor(lista[i].segundos / 60)}:${String(lista[i].segundos % 60).padStart(2, '0')}</span>
        <div class="bloque"><span>${i + 1}</span><small>Gift card S/ ${PREMIOS[i]}</small></div>
      </div>`).join('')}</div></div>`;
  }

  // ---------- Master ----------
  // Estado en vivo de un participante a partir de su última señal (segundos desde el servidor)
  const estadoVivo = hace => hace == null ? ['<span class="punto gris"></span>', 'Nunca conectado', 0] : hace < 60 ? ['<span class="punto verde"></span>', 'En línea', 2] : hace < 300 ? ['<span class="punto ambar"></span>', `Inactivo ${Math.floor(hace / 60)} min`, 1] : ['<span class="punto gris"></span>', 'Desconectado', 0];
  function actividad(p) {
    const casos = p.progreso?.casos || {};
    for (const n of [7, 6]) if (casos[n]?.estado && !p.resultados?.[n]) return `${FC.ico('diana')} Jugando nivel ${n} · decisión ${(casos[n].estado.elecciones || []).length + 1}`;
    for (const n of [7, 6]) if (p.resultados?.[n]) return `${FC.ico('check')} Terminó nivel ${n}`;
    const lec = Object.entries(p.progreso?.lecciones || {}).filter(([, l]) => l.aprobada);
    return lec.length ? `${FC.ico('libro')} Lecciones (${lec.length} aprobadas)` : '— Sin actividad';
  }
  function asistencia(p) {
    const r = p.progreso?.invitacion?.respuesta;
    if (r === 'si') { const i = p.progreso.invitacion; return `<span class="chip verde" title="${esc([i.nombre, i.correo, i.celular].filter(Boolean).join(' · '))}">Asistirá</span>`; }
    if (r === 'no') return '<span class="chip">No asistirá</span>';
    return p.progreso?.lecciones?.n4ex?.aprobada ? '<span class="chip dorado">Sin respuesta</span>' : '<span class="muted">—</span>';
  }
  // Fotos: se cargan una sola vez por participante y se guardan en memoria
  const fotos = {};
  function miniFoto(p) {
    if (!p.tiene_foto) return '<span class="muted" title="Sin foto">—</span>';
    const f = fotos[p.id];
    if (f === undefined) { fotos[p.id] = null; FC.Datos.admin.foto(claveMaster(), p.id).then(x => { fotos[p.id] = x || ''; if (ui.vista === 'master') render(); }).catch(() => { delete fotos[p.id]; }); }
    return f ? `<button class="foto-mini" type="button" data-accion="ver-foto" data-id="${p.id}" title="Ver foto"><img src="${f}" alt="Foto de ${esc(p.nombre)}"></button>` : '<span class="foto-mini cargando"></span>';
  }
  function seccionInscritos(lista) {
    const ins = lista.filter(p => p.progreso?.invitacion?.respuesta === 'si')
      .sort((a, b) => String(a.progreso.invitacion.fecha).localeCompare(String(b.progreso.invitacion.fecha)));
    const lleno = ins.length >= EVENTO.cupos;
    return `<div class="seccion"><h2>${FC.ico('edificio')} Inscritos · ${EVENTO.dia} ${EVENTO.fecha} · ${EVENTO.lugar}</h2>
      <div class="tarjeta">
        <div class="invita-cupos ${lleno ? 'lleno' : ''}" style="margin-bottom:12px"><div><b>${ins.length} de ${EVENTO.cupos} cupos ocupados</b><span>${lleno ? 'Cupo completo' : `Quedan ${EVENTO.cupos - ins.length}`}</span></div>
          <div class="barra"><div style="width:${Math.min(100, ins.length / EVENTO.cupos * 100)}%"></div></div></div>
        ${ins.length ? `<div class="table-wrap"><table><thead><tr><th>#</th><th>Foto</th><th>Nombres y apellidos</th><th>Correo</th><th>Celular</th><th>Usuario</th><th></th></tr></thead><tbody>
          ${ins.map((p, i) => { const v = p.progreso.invitacion; return `<tr><td>${i + 1}</td><td>${miniFoto(p)}</td><td><b>${esc(v.nombre)}</b></td><td>${esc(v.correo)}</td><td>${esc(v.celular || '—')}</td><td>@${esc(p.usuario)}</td><td><button class="btn-icono" title="Quitar inscripción" data-accion="quitar-inscrito" data-id="${p.id}">${FC.ico('papelera')}</button></td></tr>`; }).join('')}</tbody></table></div>
          <div class="codigos"><button class="btn btn-blanco btn-chico" data-accion="csv-inscritos">${FC.ico('descargar')} Exportar inscritos (CSV)</button></div>`
          : '<p class="muted">Aún no hay inscritos.</p>'}
      </div></div>`;
  }
  function seccionEncuesta(lista) {
    const rs = lista.filter(p => p.progreso?.encuesta).map(p => ({ p, e: p.progreso.encuesta }));
    const prom = k => rs.length ? (rs.reduce((a, x) => a + (Number(x.e[k]) || 0), 0) / rs.length).toFixed(1) : '—';
    const recom = rs.length ? Math.round(rs.filter(x => x.e.recomienda).length / rs.length * 100) + '%' : '—';
    const estrellas = n => `<span class="estrellas-mini">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'on' : ''}">★</i>`).join('')}</span>`;
    const nv = lista.filter(p => p.progreso?.nps).map(p => ({ p, n: p.progreso.nps }));
    const pct = f => nv.length ? Math.round(nv.filter(f).length / nv.length * 100) : 0;
    const promo = pct(x => x.n.valor >= 9), det = pct(x => x.n.valor <= 6), pas = nv.length ? 100 - promo - det : 0;
    const npsHtml = `<div class="tarjeta" style="margin-bottom:14px">
        <div class="nps-resumen">
          <div class="nps-score ${nv.length ? (promo - det >= 50 ? 'alto' : promo - det >= 0 ? 'medio' : 'bajo') : ''}"><small>NPS</small><b>${nv.length ? promo - det : '—'}</b><span>${nv.length} respuesta(s)</span></div>
          <div class="nps-barras">
            <div><span>Promotores (9–10)</span><div class="barra"><div class="r" style="width:${promo}%"></div></div><b>${promo}%</b></div>
            <div><span>Pasivos (7–8)</span><div class="barra"><div class="p" style="width:${pas}%"></div></div><b>${pas}%</b></div>
            <div><span>Detractores (0–6)</span><div class="barra"><div class="d" style="width:${det}%"></div></div><b>${det}%</b></div>
          </div>
        </div>
        <p class="muted" style="font-size:13px;margin-top:8px">NPS = % de promotores − % de detractores (de −100 a 100). Se pregunta al terminar la etapa previa.</p>
        ${nv.length ? `<div class="table-wrap" style="margin-top:10px"><table><thead><tr><th>Participante</th><th class="num">Nota</th><th>¿Por qué?</th></tr></thead><tbody>
          ${nv.map(({ p, n }) => `<tr><td><b>${esc(p.nombre)}</b></td><td class="num"><span class="nps-chip n${n.valor <= 6 ? 'd' : n.valor <= 8 ? 'p' : 'r'}">${n.valor}</span></td><td>${esc(n.motivo || '—')}</td></tr>`).join('')}</tbody></table></div>` : ''}
      </div>`;
    return `<div class="seccion"><h2>${FC.ico('tendencia')} NPS · ¿Lo recomendarían?</h2>${npsHtml}</div>
      <div class="seccion"><h2>${FC.ico('comodin')} Encuesta de satisfacción</h2>
      <div class="tarjeta">
        <div class="stats" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));display:grid;margin-bottom:12px">
          <div class="stat"><span class="stat-ic t-azul">${FC.ico('usuarios')}</span><div><small>Respuestas</small>${rs.length}</div></div>
          <div class="stat"><span class="stat-ic t-dorado">${FC.ico('insignia')}</span><div><small>Satisfacción</small>${prom('satisfaccion')} / 5</div></div>
          <div class="stat"><span class="stat-ic t-morado">${FC.ico('libro')}</span><div><small>Utilidad</small>${prom('utilidad')} / 5</div></div>
          <div class="stat"><span class="stat-ic t-verde">${FC.ico('check')}</span><div><small>Recomendaría</small>${recom}</div></div>
        </div>
        ${rs.length ? `<div class="table-wrap"><table><thead><tr><th>Participante</th><th>Satisfacción</th><th>Utilidad</th><th>Comentario</th></tr></thead><tbody>
          ${rs.map(({ p, e }) => `<tr><td><b>${esc(p.nombre)}</b></td><td>${estrellas(e.satisfaccion)}</td><td>${estrellas(e.utilidad)}</td><td>${esc(e.comentario || '—')}</td></tr>`).join('')}</tbody></table></div>
          <div class="codigos"><button class="btn btn-blanco btn-chico" data-accion="csv-encuesta">${FC.ico('descargar')} Exportar encuesta (CSV)</button></div>`
          : '<p class="muted">Aún no hay respuestas.</p>'}
      </div></div>`;
  }
  const IDS_LECCIONES = FC.NIVELES.filter(n => n.lecciones).flatMap(n => n.lecciones.map(l => l.id));
  const TOTAL_LECCIONES = FC.NIVELES.filter(n => n.lecciones).reduce((a, n) => a + n.lecciones.length, 0);
  function vMaster() {
    if (!esMaster()) {
      return `<h1 class="vista-titulo">${FC.ico('llave')} Acceso master</h1>
        <p class="vista-sub">Desde aquí el facilitador ve a los participantes, habilita los niveles de competencia, dirige la clase guiada y proyecta el ranking.</p>
        <form id="form-login" class="tarjeta" style="max-width:420px;display:grid;gap:12px" autocomplete="off">
          <div><label class="etiqueta" for="clave">Clave</label><input class="campo" id="clave" type="password" inputmode="numeric" required></div>
          ${ui.msg?.login ? `<p class="mensaje-error">${ui.msg.login === true ? 'Clave incorrecta.' : esc(ui.msg.login)}</p>` : ''}
          <button class="btn btn-certus" type="submit">Ingresar</button>
          ${P ? '' : '<button class="enlace" type="button" data-accion="volver-acceso">Volver al registro de participantes</button>'}
        </form>`;
    }
    if (P?.demo) return '<h1 class="vista-titulo">' + FC.ico('llave') + ' Panel master</h1><p class="vista-sub">Estás en la demostración. Sal de ella para volver al panel.</p>';
    const m = ui.master;
    if (!m.lista && !m.error) cargarMaster();
    const lista = [...(m.lista || [])].sort((a, b) => estadoVivo(b.hace)[2] - estadoVivo(a.hace)[2]);
    const enLinea = lista.filter(p => estadoVivo(p.hace)[2] === 2).length;
    const jugando = n => lista.filter(p => p.progreso?.casos?.[n]?.estado && !p.resultados?.[n]).length;
    const confirmados = lista.filter(p => p.progreso?.invitacion?.respuesta === 'si').length;
    const previa = lista.filter(p => p.progreso?.lecciones?.n4ex?.aprobada).length;
    const terminaron = n => lista.filter(p => p.resultados?.[n]).length;
    const nombreNivel = n => FC.NIVELES.find(x => x.n === n).etapa;
    const filas = lista.map(p => {
      const hechas = IDS_LECCIONES.filter(id => p.progreso?.lecciones?.[id]?.aprobada).length;
      const celdaNivel = n => p.resultados?.[n] ? `<span class="chip dorado">${p.resultados[n].puntaje} pts</span>` : p.habilitado.includes(n) ? '<span class="chip verde">Habilitado</span>' : '<span class="chip">—</span>';
      return `<tr>
        <td><input type="checkbox" class="sel" data-id="${p.id}" ${m.sel.has(p.id) ? 'checked' : ''}></td>
        <td><b>${esc(p.nombre)}</b><br><small class="muted">${esc(p.condicion)}</small></td>
        <td style="white-space:nowrap">${estadoVivo(p.hace)[0]} ${estadoVivo(p.hace)[1]}</td>
        <td><small class="actividad"><b>${actividad(p)}</b></small></td>
        <td>@${esc(p.usuario)}</td>
        <td><code>${m.ver[p.id] || m.ver.todas ? esc(p.clave) : '••••••'}</code> <button class="btn-icono" title="Ver contraseña" data-accion="ver-clave" data-id="${p.id}" style="width:30px;height:30px;font-size:16px">${FC.ico('ojo')}</button></td>
        <td class="num">${hechas}/${TOTAL_LECCIONES}</td>
        <td>${asistencia(p)}</td>
        <td>${celdaNivel(6)}</td><td>${celdaNivel(7)}</td>
        <td><button class="btn-icono" title="Eliminar participante" data-accion="borrar-participante" data-id="${p.id}">${FC.ico('papelera')}</button></td>
      </tr>`;
    }).join('');
    const ranking = m.ranking[m.nivel];
    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px">
        <h1 class="vista-titulo" style="margin:0">${FC.ico('llave')} Panel master</h1>
        <div class="codigos" style="margin:0"><span class="chip ${FC.Datos.modo === 'nube' ? 'verde' : 'dorado'}">${FC.Datos.modo === 'nube' ? FC.ico('nube') + ' Conectado a Supabase' : FC.ico('laptop') + ' Modo local'}</span>
        <button class="btn btn-blanco btn-chico" data-accion="salir-master">Salir del modo master</button></div>
      </div>
      ${m.error ? `<div class="banner-demo"><span class="emoji">${FC.ico('alerta')}</span><p>${esc(m.error)}</p><button class="btn btn-blanco btn-chico" data-accion="recargar-master">Reintentar</button></div>` : ''}

      <div class="seccion"><h2>${FC.ico('envivo')} Monitoreo en vivo <small class="muted" style="font-size:13px">· se actualiza cada ${MASTER_REFRESCO / 1000} s${m.actualizado ? ` · última: ${m.actualizado}` : ''}</small></h2>
        <div class="stats" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
          <div class="stat"><span class="stat-ic t-azul">${FC.ico('usuarios')}</span><div><small>Registrados</small>${lista.length}</div></div>
          <div class="stat"><span class="stat-ic t-verde">${FC.ico('wifi')}</span><div><small>En línea ahora</small>${enLinea}</div></div>
          <div class="stat"><span class="stat-ic t-morado">${FC.ico('diana')}</span><div><small>Jugando N6 / N7</small>${jugando(6)} / ${jugando(7)}</div></div>
          <div class="stat"><span class="stat-ic t-azul">${FC.ico('edificio')}</span><div><small>Confirmados 25/11</small>${confirmados} de ${previa}</div></div>
          <div class="stat"><span class="stat-ic t-dorado">${FC.ico('bandera')}</span><div><small>Terminaron N6 / N7</small>${terminaron(6)} / ${terminaron(7)}</div></div>
        </div></div>

      <div class="seccion"><h2>${FC.ico('pizarra')} Nivel 5 · Clase guiada</h2>
        <div class="tarjeta"><p class="muted" style="font-weight:600;margin-bottom:10px">Proyecta y resuelve cada subnivel con la clase. No hay vidas ni puntaje; el comodín se puede usar libremente para mostrar cómo funciona.</p>
          <div class="codigos">${FC.NIVELES.find(n => n.subniveles).subniveles.map(sb => `<button class="btn btn-azul btn-chico" data-accion="guiado-master" data-id="${sb.id}">${FC.icono(sb.icono)} ${esc(sb.titulo)}</button>`).join('')}
          <button class="btn btn-certus btn-chico" data-accion="demo">${FC.ico('play')} Entrar como usuario demo</button></div></div></div>

      <div class="seccion"><h2>${FC.ico('usuarios')} Participantes registrados (${lista.length})</h2>
        <div class="tarjeta">
          <div class="codigos" style="margin:0 0 12px">
            <button class="btn btn-blanco btn-chico" data-accion="sel-todos">${m.sel.size === lista.length && lista.length ? 'Quitar selección' : 'Seleccionar todos'}</button>
            <button class="btn btn-chico" data-accion="habilitar" data-n="6" data-v="1" ${m.sel.size ? '' : 'disabled'}>Habilitar ${nombreNivel(6)} (${m.sel.size})</button>
            <button class="btn btn-blanco btn-chico" data-accion="habilitar" data-n="6" data-v="0" ${m.sel.size ? '' : 'disabled'}>Quitar ${nombreNivel(6)}</button>
            <button class="btn btn-certus btn-chico" data-accion="habilitar" data-n="7" data-v="1" ${m.sel.size ? '' : 'disabled'}>Habilitar ${nombreNivel(7)} (${m.sel.size})</button>
            <button class="btn btn-blanco btn-chico" data-accion="habilitar" data-n="7" data-v="0" ${m.sel.size ? '' : 'disabled'}>Quitar ${nombreNivel(7)}</button>
            <button class="btn btn-blanco btn-chico" data-accion="ver-todas">${m.ver.todas ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}</button>
            <button class="btn btn-blanco btn-chico" data-accion="recargar-master">${FC.ico('actualizar')} Actualizar</button>
          </div>
          <p style="font-weight:700;margin-bottom:12px">Seleccionar a los mejores <input class="campo" type="number" min="1" max="50" value="${m.top}" id="top-n" style="width:70px;display:inline-block;padding:6px 8px"> de la competencia (nivel 6) <button class="btn btn-blanco btn-chico" data-accion="sel-top">Seleccionar</button></p>
          ${lista.length ? `<div class="table-wrap"><table><thead><tr><th></th><th>Participante</th><th>Estado</th><th>Actividad</th><th>Usuario</th><th>Contraseña</th><th class="num">Lecciones</th><th>25/11</th><th>${nombreNivel(6)}</th><th>${nombreNivel(7)}</th><th></th></tr></thead><tbody>${filas}</tbody></table></div>`
            : `<p class="muted">${m.lista ? 'Aún no hay participantes registrados.' : 'Cargando…'}</p>`}
        </div></div>

      ${seccionInscritos(lista)}
      ${seccionEncuesta(lista)}

      <div class="seccion"><h2>${FC.ico('trofeo')} Ranking en vivo</h2>
        <nav class="tabs">${[6, 7].map(k => `<button class="tab${k === m.nivel ? ' activa' : ''}" data-accion="tab-ranking" data-n="${k}">Nivel ${k} · ${nombreNivel(k)}</button>`).join('')}</nav>
        ${m.nivel === 7 && ranking?.length ? `<div class="tarjeta" style="margin-bottom:14px">${podioHTML(ranking.slice(0, 3), 'Podio de la final')}<div class="codigos" style="justify-content:center"><button class="btn btn-certus" data-accion="proyectar-podio">Proyectar podio en pantalla completa</button></div></div>` : ''}
        ${ranking?.length ? `<div class="table-wrap"><table><thead><tr><th>#</th><th>Participante</th><th class="num">Puntaje</th><th class="num">Tiempo</th><th class="num">Vidas</th><th>Comodín</th><th></th></tr></thead>
          <tbody>${ranking.map((f, i) => `<tr class="${m.nivel === 6 && i < m.top ? 'clasifica' : ''}"><td><b>${i + 1}</b></td><td><b>${esc(f.nombre)}</b><br><small class="muted">@${esc(f.usuario)}</small></td>
            <td class="num"><b>${f.puntaje}</b></td><td class="num">${Math.floor(f.segundos / 60)}:${String(f.segundos % 60).padStart(2, '0')}</td><td class="num">${FC.ico('corazon', 't-rojo')} ${f.vidas}</td><td>${f.comodin ? FC.ico('comodin') + ' usado' : '—'}</td>
            <td class="num" style="white-space:nowrap"><button class="btn-icono" title="Ver estados" data-accion="ver-resultado" data-i="${i}">${FC.ico('barras')}</button><button class="btn-icono" title="Borrar resultado (permite repetir)" data-accion="borrar-resultado" data-id="${f.id}">${FC.ico('papelera')}</button></td></tr>`).join('')}</tbody></table></div>
          <p class="muted" style="margin-top:8px;font-weight:600;font-size:13px">Orden: mayor puntaje; si hay empate, menor tiempo.${m.nivel === 6 ? ` En verde, los ${m.top} primeros.` : ''}</p>
          <div class="codigos"><button class="btn btn-blanco btn-chico" data-accion="csv">${FC.ico('descargar')} Exportar ranking (CSV)</button><button class="btn btn-blanco btn-chico" data-accion="recargar-ranking">${FC.ico('actualizar')} Actualizar ranking</button></div>`
          : `<p class="muted">${ranking ? 'Aún no hay resultados en este nivel.' : 'Cargando…'}</p>`}
      </div>

      <div class="seccion"><h2>${FC.ico('matraz')} Modo prueba</h2>
        <div class="tarjeta"><p class="muted" style="font-weight:600;margin-bottom:10px">Recorre cualquier lección o caso sin guardar resultados. El comodín se puede usar una sola vez por nivel.</p>
          <div class="codigos" style="margin:0 0 12px">
            <button class="btn btn-certus btn-chico" data-accion="simular-previa">${FC.ico('trofeo')} Simular etapa previa completada</button>
            <button class="btn btn-blanco btn-chico" data-accion="reiniciar-comodines">${FC.ico('comodin')} Reiniciar comodines de prueba</button>
          </div>
          <div class="codigos">${FC.NIVELES.filter(n => n.lecciones).map(nv => nv.lecciones.map(l => `<button class="btn btn-blanco btn-chico" data-accion="probar-leccion" data-id="${l.id}">N${nv.n} · ${esc(l.titulo)}</button>`).join('')).join('')}
          ${[6, 7].map(n => `<button class="btn btn-certus btn-chico" data-accion="probar-caso" data-n="${n}">N${n} · ${esc(FC.NIVELES.find(x => x.n === n).titulo)}</button>`).join('')}</div></div></div>`;
  }

  let cargandoMaster = false;
  async function cargarMaster() {
    const m = ui.master;
    if (cargandoMaster) return;
    cargandoMaster = true;
    try {
      const [lista, r6, r7] = await Promise.all([FC.Datos.admin.listar(claveMaster()), FC.Datos.admin.ranking(claveMaster(), 6), FC.Datos.admin.ranking(claveMaster(), 7)]);
      const firma = JSON.stringify([lista, r6, r7]);
      const cambio = firma !== m.firma || m.error;
      m.firma = firma; m.lista = lista; m.ranking = { 6: r6, 7: r7 }; m.error = null;
      m.actualizado = new Date().toLocaleTimeString('es-PE');
      if (!cambio && ui.vista === 'master') { const t = document.querySelector('.seccion h2 small'); if (t) t.textContent = `· se actualiza cada ${MASTER_REFRESCO / 1000} s · última: ${m.actualizado}`; return; }
      for (const id of [...m.sel]) if (!lista.some(p => p.id === id)) m.sel.delete(id);
    } catch (e) { m.error = e.message; m.lista = m.lista || []; } finally { cargandoMaster = false; }
    if (ui.vista === 'master' && document.activeElement?.id !== 'top-n') render();
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
        if (!await FC.confirmar({ icono: FC.ico(valor ? 'abierto' : 'candado'), titulo: `¿${valor ? 'Habilitar' : 'Quitar'} el nivel ${n}?`, texto: `Se aplicará a ${m.sel.size} participante(s) seleccionado(s).`, aceptar: valor ? 'Habilitar' : 'Quitar', tono: valor ? 'certus' : 'rojo' })) return;
        try { await FC.Datos.admin.habilitar(claveMaster(), [...m.sel], n, valor); await cargarMaster(); } catch (e) { alert(e.message); }
        break;
      }
      case 'borrar-participante': {
        const p = m.lista.find(x => x.id === el.dataset.id);
        if (!await FC.confirmar({ icono: FC.ico('papelera'), titulo: `¿Eliminar a ${p.nombre}?`, texto: `Se borrarán @${p.usuario} y todos sus resultados. No se puede deshacer.`, aceptar: 'Eliminar', tono: 'rojo' })) return;
        try { await FC.Datos.admin.borrarParticipante(claveMaster(), p.id); m.sel.delete(p.id); await cargarMaster(); } catch (e) { alert(e.message); }
        break;
      }
      case 'borrar-resultado': {
        if (!await FC.confirmar({ icono: FC.ico('papelera'), titulo: '¿Borrar este resultado?', texto: 'El participante podrá volver a jugar el nivel desde otra computadora.', aceptar: 'Borrar', tono: 'rojo' })) return;
        try { await FC.Datos.admin.borrarResultado(claveMaster(), el.dataset.id); await cargarMaster(); } catch (e) { alert(e.message); }
        break;
      }
      case 'tab-ranking': m.nivel = n; render(); cargarMaster(); break;
      case 'proyectar-podio': modal(podioHTML(m.ranking[7].slice(0, 3), 'Podio de la final'), true); FC.Sonido.completado(); FC.Leccion.confeti(); break;
      case 'ver-resultado': verResultado(m.ranking[m.nivel][Number(el.dataset.i)]); break;
      case 'csv': exportarCSV(m.nivel); break;
      case 'csv-inscritos': exportarInscritos(); break;
      case 'ver-foto': { const p = m.lista.find(x => x.id === el.dataset.id); modal(`<div class="foto-grande"><img src="${fotos[p.id]}" alt="Foto de ${esc(p.nombre)}"><h3>${esc(p.progreso?.invitacion?.nombre || p.nombre)}</h3><p class="muted">@${esc(p.usuario)}</p></div>`); break; }
      case 'quitar-inscrito': {
        const p = m.lista.find(x => x.id === el.dataset.id);
        const v = p?.progreso?.invitacion || {};
        if (!await FC.confirmar({ icono: FC.ico('papelera'), titulo: `¿Quitar a ${v.nombre || p.nombre} de los inscritos?`, texto: 'Se libera su cupo. Su cuenta y su progreso no se borran, y podrá volver a inscribirse si hay cupos.', aceptar: 'Quitar inscripción', tono: 'rojo' })) return;
        try { await FC.Datos.admin.quitarInscripcion(claveMaster(), p.id); await cargarMaster(); } catch (e) { alert(e.message); }
        break;
      }
      case 'csv-encuesta': exportarEncuesta(); break;
      case 'guiado-master': abrirGuiado(el.dataset.id, true); break;
      case 'demo': iniciarDemo(); break;
      case 'probar-leccion': {
        const nivelN = FC.leccionPorId(el.dataset.id).nivel.n;
        FC.Leccion.abrir(el.dataset.id, { prueba: true, comodin: { disponible: () => !comodinesPrueba[nivelN], usar: () => { comodinesPrueba[nivelN] = true; } }, alTerminar: render });
        break;
      }
      case 'reiniciar-comodines': comodinesPrueba = {}; render(); break;
      case 'simular-previa': iniciarDemo({ previaCompleta: true }); setTimeout(() => abrirEtapaFinal(true), 300); break;
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
      <p class="muted" style="margin:4px 0 14px">${f.puntaje} puntos · ${Math.floor(f.segundos / 60)}:${String(f.segundos % 60).padStart(2, '0')} · ${FC.ico('corazon', 't-rojo')} ${f.vidas}${f.comodin ? ' · ' + FC.ico('comodin') + ' comodín usado' : ''}</p>
      <div class="grid-2" style="margin-bottom:14px">
        <div class="tarjeta"><h3 style="margin-bottom:8px">Puntaje</h3><table><tbody>${p.detalle.map(d => `<tr><td>${esc(d.motivo)}</td><td class="num">${d.puntos > 0 ? '+' : ''}${d.puntos}</td></tr>`).join('')}</tbody></table></div>
        <div class="tarjeta"><h3 style="margin-bottom:8px">Decisiones</h3><ol style="margin:0;padding-left:20px;line-height:1.6;font-weight:600">${r.pasos.filter(x => x.nodo.tipo === 'decision').map(x => `<li>${esc(x.nodo.opciones[x.eleccion].texto)}</li>`).join('')}</ol></div>
      </div>
      ${FC.Caso.tablasEstados(r.actual)}`);
    FC.Caso.activarTabs($('modal-contenido'));
  }

  function descargarCSV(filas, nombre) {
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const url = URL.createObjectURL(new Blob(['\ufeff' + filas.map(f => f.map(q).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
    document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  function exportarInscritos() {
    const filas = [['N.º', 'Nombres y apellidos', 'Correo', 'Celular', 'Usuario', 'Condición', 'Fecha de inscripción']];
    (ui.master.lista || []).filter(p => p.progreso?.invitacion?.respuesta === 'si')
      .sort((a, b) => String(a.progreso.invitacion.fecha).localeCompare(String(b.progreso.invitacion.fecha)))
      .forEach((p, i) => { const v = p.progreso.invitacion; filas.push([i + 1, v.nombre, v.correo, v.celular, p.usuario, p.condicion, new Date(v.fecha).toLocaleString('es-PE')]); });
    descargarCSV(filas, 'financial-challenge-inscritos-25-noviembre.csv');
  }
  function exportarEncuesta() {
    const filas = [['Participante', 'Usuario', 'NPS (0-10)', 'Motivo NPS', 'Satisfacción (1-5)', 'Utilidad (1-5)', '¿Recomendaría?', 'Comentario']];
    (ui.master.lista || []).filter(p => p.progreso?.encuesta || p.progreso?.nps).forEach(p => { const e = p.progreso.encuesta || {}, n = p.progreso.nps || {}; filas.push([p.nombre, p.usuario, n.valor ?? '', n.motivo || '', e.satisfaccion ?? '', e.utilidad ?? '', e.recomienda == null ? '' : e.recomienda ? 'Sí' : 'No', e.comentario || '']); });
    descargarCSV(filas, 'financial-challenge-encuesta.csv');
  }
  function exportarCSV(n) {
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const filas = [['Puesto', 'Participante', 'Usuario', 'Condición', 'Puntaje', 'Tiempo (s)', 'Vidas', 'Comodín', n === 7 ? 'Premio' : '']];
    (ui.master.ranking[n] || []).forEach((f, i) => filas.push([i + 1, f.nombre, f.usuario, f.condicion, f.puntaje, f.segundos, f.vidas, f.comodin ? 'Sí' : 'No', n === 7 && PREMIOS[i] ? `S/ ${PREMIOS[i]}` : '']));
    const url = URL.createObjectURL(new Blob(['﻿' + filas.map(f => f.map(q).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `financial-challenge-nivel-${n}.csv` });
    document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  // ---------- Encuesta de satisfacción flotante ----------
  const enc = { abierta: false, d: { satisfaccion: 0, utilidad: 0, recomienda: null, comentario: '' }, enviada: false };
  function renderEncuesta() {
    const raiz = $('encuesta');
    if (!raiz) return;
    const visible = Boolean(P) && !esMaster() && !(prog().encuesta && !enc.enviada);
    raiz.hidden = !visible;
    if (!visible) return;
    const estrellas = k => `<div class="enc-estrellas" role="radiogroup">${[1, 2, 3, 4, 5].map(i => `<button type="button" class="${i <= enc.d[k] ? 'on' : ''}" data-enc="${k}" data-v="${i}" aria-label="${i} de 5">★</button>`).join('')}</div>`;
    raiz.className = `encuesta${enc.abierta ? ' abierta' : ''}`;
    raiz.innerHTML = !enc.abierta
      ? `<button class="enc-pestana" type="button" data-enc-abrir>${FC.ico('comodin')}<span>Encuesta</span></button>`
      : `<div class="enc-caja${enc.animar ? ' entra' : ''}" role="dialog" aria-label="Encuesta de satisfacción">
          <button class="btn-icono enc-cerrar" type="button" data-enc-cerrar aria-label="Cerrar">${FC.ico('cerrar')}</button>
          ${enc.enviada ? `<div class="enc-gracias">${FC.ico('check')}<b>¡Gracias por tu opinión!</b><span>Nos ayuda a mejorar el Financial Challenge.</span></div>`
          : `<h4>¿Qué te parece Financial Challenge?</h4>
          <label>Satisfacción general</label>${estrellas('satisfaccion')}
          <label>¿Te ayudó a entender los estados financieros?</label>${estrellas('utilidad')}
          <label>¿Lo recomendarías a un compañero?</label>
          <div class="enc-sino"><button type="button" class="${enc.d.recomienda === true ? 'on' : ''}" data-enc="recomienda" data-v="1">Sí</button><button type="button" class="${enc.d.recomienda === false ? 'on' : ''}" data-enc="recomienda" data-v="0">No</button></div>
          <textarea class="campo" id="enc-comentario" rows="2" maxlength="400" placeholder="Comentario (opcional)">${esc(enc.d.comentario)}</textarea>
          <button class="btn btn-certus btn-chico btn-bloque" type="button" data-enc-enviar ${enc.d.satisfaccion && enc.d.utilidad && enc.d.recomienda !== null ? '' : 'disabled'}>Enviar</button>`}
        </div>`;
  }
  document.addEventListener('click', e => {
    const raiz = $('encuesta');
    if (!raiz || !raiz.contains(e.target)) return;
    const b = e.target.closest('button');
    if (!b) return;
    const com = $('enc-comentario'); if (com) enc.d.comentario = com.value;
    enc.animar = b.hasAttribute('data-enc-abrir');
    if (b.hasAttribute('data-enc-abrir')) enc.abierta = true;
    else if (b.hasAttribute('data-enc-cerrar')) { enc.abierta = false; if (enc.enviada) enc.enviada = false; }
    else if (b.dataset.enc === 'recomienda') enc.d.recomienda = b.dataset.v === '1';
    else if (b.dataset.enc) enc.d[b.dataset.enc] = Number(b.dataset.v);
    else if (b.hasAttribute('data-enc-enviar')) {
      prog().encuesta = { ...enc.d, comentario: enc.d.comentario.trim().slice(0, 400), fecha: new Date().toISOString() };
      guardarP(); enc.enviada = true;
    }
    renderEncuesta();
  });

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
      case 'invitacion': inv.editando = false; inv.error = null; abrirEtapaFinal(); return;
      case 'foto-camara': encenderCamara(); return;
      case 'foto-capturar': capturarFoto(); return;
      case 'foto-repetir': fotoTomada = null; abrirFoto(); encenderCamara(); return;
      case 'foto-guardar': guardarFoto(); return;
      case 'foto-omitir': apagarCamara(); fotoTomada = null; prog().fotoPaso = 'omitida'; guardarP(); abrirEtapaFinal(); return;
      case 'invitacion-cambiar': inv.editando = true; abrirInvitacion(); return;
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
  function cerrarModal() { apagarCamara(); $('modal').hidden = true; }

  // ---------- Arranque ----------
  function init() {
    FC.Leccion.init();
    FC.Caso.init();
    document.querySelectorAll('#nav button[data-vista]').forEach(b => b.addEventListener('click', () => ir(b.dataset.vista)));
    $('nav-salir').addEventListener('click', cerrarSesion);
    $('modal').addEventListener('change', e => { if (e.target.name === 'nps') { nps.error = null; document.querySelector('#form-nps .mensaje-error')?.remove(); } });
    $('modal').addEventListener('change', e => { if (e.target.name === 'respuesta' && e.target.form?.id === 'form-invitacion') actualizarCamposInvitacion(e.target.form); });
    $('modal').addEventListener('submit', e => { if (e.target.id === 'form-invitacion') { e.preventDefault(); responderInvitacion(e.target); } if (e.target.id === 'form-nps') { e.preventDefault(); responderNps(e.target); } });
    $('modal').addEventListener('click', e => { if (e.target.closest('[data-cerrar]')) cerrarModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('modal').hidden) cerrarModal(); });
    try { P = JSON.parse(localStorage.getItem(SESION_KEY)); } catch { P = null; }
    if (P) { P.progreso = { ...progresoVacio(), ...P.progreso }; ui.acceso = 'entrar'; sincronizar(); }
    setInterval(() => { if (P && !P.demo) sincronizar(); }, 20000);
    // Monitoreo en vivo del master: refresco frecuente mientras el panel está visible
    setInterval(() => { if (ui.vista === 'master' && esMaster() && !P?.demo && !document.hidden && $('caso').hidden) cargarMaster(); }, MASTER_REFRESCO);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && P && !P.demo) sincronizar(); });
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
  return { modal, cerrarModal, podioHTML };
})();
