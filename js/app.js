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
  function iniciarDemo() {
    participanteReal = P;
    P = { usuario: 'demo', clave: '', nombre: 'Participante de demostración', condicion: 'Estudiante', habilitado: [6, 7], resultados: {}, progreso: progresoVacio(), demo: true };
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
    const hechas = Object.values(prog().lecciones).filter(l => l.aprobada).length;
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
        <p class="premios">${FC.medalla(0)} Gift card de S/ 150<br>${FC.medalla(1)} Gift card de S/ 100<br>${FC.medalla(2)} Gift card de S/ 50</p></div>`;
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
  const EVENTO = { dia: 'Miércoles', fecha: '25 de noviembre', lugar: 'Laboratorio 8', sede: 'Sede Arequipa' };
  const etapaPreviaCompleta = () => Boolean(P) && nivelAprobado(4);
  const invitacion = () => prog().invitacion || null;

  function abrirInvitacion() {
    if (!P) return;
    const inv = invitacion();
    const nombre = esc((P.nombre || '').split(' ')[0] || P.usuario);
    const respondido = inv?.respuesta;
    modal(`<div class="invita">
      <div class="invita-cab">
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
            <p>${FC.ico('edificio')} <b>${EVENTO.lugar}</b> · ${EVENTO.sede}</p>
            <p>${FC.ico('regalo')} Premios para los 3 primeros puestos</p>
          </div>
        </div>
        ${respondido ? `<div class="invita-gracias ${inv.respuesta}">${FC.ico(inv.respuesta === 'si' ? 'check' : 'equis')}
            <div><b>${inv.respuesta === 'si' ? '¡Tu asistencia está confirmada!' : 'Registramos que no podrás asistir.'}</b>
            <span>${inv.respuesta === 'si' ? `Te esperamos el ${EVENTO.dia.toLowerCase()} ${EVENTO.fecha} en el ${EVENTO.lugar}.` : 'Si cambias de opinión, puedes actualizar tu respuesta.'}</span></div></div>
          <button class="btn btn-blanco btn-bloque" type="button" data-accion="invitacion-cambiar">Cambiar mi respuesta</button>`
        : `<form id="form-invitacion" class="invita-form">
          <p class="invita-pregunta">¿Asistirás el ${EVENTO.dia.toLowerCase()} ${EVENTO.fecha}?</p>
          <div class="invita-opciones">
            <label><input type="radio" name="respuesta" value="si" required><span>${FC.ico('check')} Sí, asistiré</span></label>
            <label><input type="radio" name="respuesta" value="no"><span>${FC.ico('equis')} No podré asistir</span></label>
          </div>
          <div><label class="etiqueta" for="inv-celular">Celular (opcional, para recordatorios)</label>
            <input class="campo" id="inv-celular" name="celular" inputmode="tel" maxlength="15" placeholder="9XX XXX XXX" value="${esc(inv?.celular || '')}"></div>
          <button class="btn btn-certus btn-bloque" type="submit">Enviar mi respuesta</button>
        </form>`}
      </div></div>`);
    if (!respondido) { FC.Sonido?.completado?.(); FC.Leccion.confeti(); }
  }

  function responderInvitacion(f) {
    const respuesta = f.respuesta.value;
    if (!respuesta) return;
    prog().invitacion = { respuesta, celular: f.celular.value.trim().slice(0, 15), fecha: new Date().toISOString() };
    guardarP();
    abrirInvitacion();
    render();
  }

  const bannerInvitacion = () => (P && !P.demo && etapaPreviaCompleta()
    ? `<div class="invita-banner"><span class="invita-banner-ic">${FC.ico('trofeo')}</span>
        <div><b>${invitacion()?.respuesta === 'si' ? 'Asistencia confirmada' : '¡Completaste la etapa previa!'}</b>
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
        if (!P.demo && !antes && etapaPreviaCompleta() && !invitacion()) setTimeout(abrirInvitacion, 350);
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
    if (r === 'si') return `<span class="chip verde" title="${esc(p.progreso.invitacion.celular || '')}">Asistirá</span>`;
    if (r === 'no') return '<span class="chip">No asistirá</span>';
    return p.progreso?.lecciones?.n4ex?.aprobada ? '<span class="chip dorado">Sin respuesta</span>' : '<span class="muted">—</span>';
  }
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
      const hechas = Object.values(p.progreso?.lecciones || {}).filter(l => l.aprobada).length;
      const celdaNivel = n => p.resultados?.[n] ? `<span class="chip dorado">${p.resultados[n].puntaje} pts</span>` : p.habilitado.includes(n) ? '<span class="chip verde">Habilitado</span>' : '<span class="chip">—</span>';
      return `<tr>
        <td><input type="checkbox" class="sel" data-id="${p.id}" ${m.sel.has(p.id) ? 'checked' : ''}></td>
        <td><b>${esc(p.nombre)}</b><br><small class="muted">${esc(p.condicion)}</small></td>
        <td style="white-space:nowrap">${estadoVivo(p.hace)[0]} ${estadoVivo(p.hace)[1]}</td>
        <td><small class="actividad"><b>${actividad(p)}</b></small></td>
        <td>@${esc(p.usuario)}</td>
        <td><code>${m.ver[p.id] || m.ver.todas ? esc(p.clave) : '••••••'}</code> <button class="btn-icono" title="Ver contraseña" data-accion="ver-clave" data-id="${p.id}" style="width:30px;height:30px;font-size:16px">${FC.ico('ojo')}</button></td>
        <td class="num">${hechas}/16</td>
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
        <div class="tarjeta"><p class="muted" style="font-weight:600;margin-bottom:10px">Recorre cualquier lección o caso sin guardar resultados.</p>
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
      <p class="muted" style="margin:4px 0 14px">${f.puntaje} puntos · ${Math.floor(f.segundos / 60)}:${String(f.segundos % 60).padStart(2, '0')} · ${FC.ico('corazon', 't-rojo')} ${f.vidas}${f.comodin ? ' · ' + FC.ico('comodin') + ' comodín usado' : ''}</p>
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
      case 'invitacion': abrirInvitacion(); return;
      case 'invitacion-cambiar': delete prog().invitacion; guardarP(); abrirInvitacion(); render(); return;
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
    $('modal').addEventListener('submit', e => { if (e.target.id === 'form-invitacion') { e.preventDefault(); responderInvitacion(e.target); } });
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
