/* =========================================================
   PARTICIPANTES SIMULADOS DEL NIVEL 6 (Starbucks)
   Carga el motor real del juego y genera N participantes con perfiles
   distintos que juegan el caso completo. Lo usan:
     simular-starbucks.js  → simulación local (sin servidor)
     prueba-supabase.js    → prueba de carga contra Supabase
   ========================================================= */
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');

// ---------- Motor del juego, tal como lo carga el navegador ----------
function cargarMotor() {
  const ctx = { console };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ['js/config.js', 'js/contabilidad.js', 'js/data/niveles.js', 'js/data/casos.js', 'js/caso-motor.js'])
    vm.runInContext(fs.readFileSync(path.join(RAIZ, f), 'utf8'), ctx, { filename: f });
  return ctx.FC;
}
const FC = cargarMotor();
const caso = FC.CASOS.c6;
const VIDAS = FC.VIDAS_COMPETENCIA;
const M = FC.Motor;

// ---------- Todos los caminos de decisiones (respondiendo todo bien) ----------
const decisiones = Object.entries(caso.nodos).filter(([, n]) => n.tipo === 'decision').map(([id]) => id);
function jugarPerfecto(combo) {
  const el = [];
  for (;;) {
    const r = M.recorrer(caso, el, VIDAS);
    if (r.error) throw new Error(r.error);
    if (r.terminado) return r;
    const nodo = caso.nodos[r.pendiente];
    if (nodo.tipo === 'decision') el.push(combo[r.pendiente]);
    else if (nodo.tipo === 'analisis') el.push(M.respuestaAnalisis(nodo, r.previa, r.actual));
    else el.push(nodo.correcta);
  }
}
const caminos = [];
(function explorar(i, combo) {
  if (i === decisiones.length) { caminos.push({ combo: { ...combo }, puntaje: M.puntaje(jugarPerfecto(combo)).total }); return; }
  const id = decisiones[i];
  caso.nodos[id].opciones.forEach((_, k) => explorar(i + 1, { ...combo, [id]: k }));
})(0, {});
caminos.sort((a, b) => b.puntaje - a.puntaje);
const mejor = caminos[0].combo;

// ---------- Perfiles ----------
// acierto: probabilidad de responder bien una pregunta o un análisis
// estrategia: probabilidad de elegir la opción del mejor camino en cada decisión
// riesgo: probabilidad de aceptar la decisión de alto riesgo
// ritmo: multiplicador del tiempo de lectura y respuesta
const PERFILES = [
  { nombre: 'Destacado', peso: 4, acierto: [0.85, 0.97], estrategia: 0.85, riesgo: 0.02, ritmo: [0.7, 1.0], comodin: 0.9 },
  { nombre: 'Bueno', peso: 8, acierto: [0.65, 0.85], estrategia: 0.6, riesgo: 0.08, ritmo: [0.85, 1.2], comodin: 0.85 },
  { nombre: 'Regular', peso: 9, acierto: [0.45, 0.65], estrategia: 0.35, riesgo: 0.2, ritmo: [1.0, 1.5], comodin: 0.75 },
  { nombre: 'Inicial', peso: 5, acierto: [0.25, 0.45], estrategia: 0.15, riesgo: 0.4, ritmo: [1.1, 1.8], comodin: 0.6 }
];
const TIEMPO = { escena: [15, 40], decision: [45, 120], analisis: [30, 90], pregunta: [20, 60] }; // segundos base
const NOMBRES = ['Valeria', 'Diego', 'Camila', 'Mateo', 'Lucía', 'Sebastián', 'Fernanda', 'Joaquín', 'Daniela', 'Andrés', 'Mariana', 'Rodrigo', 'Sofía',
  'Gabriel', 'Alejandra', 'Nicolás', 'Paula', 'Martín', 'Ximena', 'Renato', 'Antonella', 'Bruno', 'Ariana', 'Gonzalo', 'Micaela', 'Leonardo'];

/**
 * Genera N participantes que juegan el caso.
 * Cada uno trae su línea de tiempo: `pasos` con el segundo (desde que abre el caso)
 * en que confirma cada elección; `retraso` es cuándo abre el caso tras habilitarse.
 */
function generar(N, semilla, prefijo = 'prueba') {
  let estado = semilla >>> 0;
  const azar = () => { estado = (estado + 0x6D2B79F5) >>> 0; let t = estado; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const entre = (a, b) => a + azar() * (b - a);
  const elegir = arr => arr[Math.floor(azar() * arr.length)];

  const total = PERFILES.reduce((a, p) => a + p.peso, 0);
  let perfiles = [];
  PERFILES.forEach(p => { for (let i = 0; i < Math.round((p.peso / total) * N); i++) perfiles.push(p); });
  while (perfiles.length < N) perfiles.push(PERFILES[2]);
  perfiles = perfiles.slice(0, N).sort(() => azar() - 0.5);

  function jugar(perfil) {
    const acierto = entre(...perfil.acierto);
    const ritmo = entre(...perfil.ritmo);
    const el = [], pasos = [], bitacora = [];
    let segundos = 0, comodinUsado = false, comodinEn = null;
    for (;;) {
      const r = M.recorrer(caso, el, VIDAS);
      if (r.error) throw new Error(r.error);
      if (r.terminado) { segundos += entre(...TIEMPO.escena) * ritmo; return { r, el, pasos, segundos: Math.round(segundos), comodinUsado, comodinEn, bitacora }; }
      const id = r.pendiente, nodo = caso.nodos[id];
      segundos += entre(...TIEMPO[nodo.tipo]) * ritmo;
      if (nodo.tipo === 'decision') {
        let k;
        const riesgosa = nodo.opciones.findIndex(o => o.error);
        if (riesgosa >= 0) k = azar() < perfil.riesgo ? riesgosa : nodo.opciones.findIndex(o => !o.error);
        else k = azar() < perfil.estrategia ? mejor[id] : Math.floor(azar() * nodo.opciones.length);
        el.push(k);
        bitacora.push(`${id}:${k}`);
      } else {
        const correcta = nodo.tipo === 'analisis' ? M.respuestaAnalisis(nodo, r.previa, r.actual) : nodo.correcta;
        const nOps = nodo.tipo === 'analisis' ? 3 : nodo.opciones.length;
        let k;
        if (azar() < acierto) k = correcta;
        else if (!comodinUsado && azar() < perfil.comodin) { k = correcta; comodinUsado = true; comodinEn = id; segundos += 10; }
        else { const malas = [...Array(nOps).keys()].filter(x => x !== correcta); k = elegir(malas); }
        el.push(k);
      }
      pasos.push({ nodo: id, eleccion: el.at(-1), seg: Math.round(segundos), comodin: comodinEn === id });
    }
  }

  return perfiles.map((perfil, i) => {
    const usuario = `${prefijo}${String(i + 1).padStart(2, '0')}`;
    const retraso = Math.round(entre(0, 45)); // segundos hasta que cada uno abre el caso (se sortea antes de jugar)
    const j = jugar(perfil);
    const p = M.puntaje(j.r);
    return {
      usuario, nombre: `${NOMBRES[i % NOMBRES.length]} Simulación ${String(i + 1).padStart(2, '0')}`, perfil: perfil.nombre,
      puntaje: p.total, segundos: j.segundos, vidas: j.r.vidas, comodin: j.comodinUsado, comodinEn: j.comodinEn,
      aciertos: p.aciertos, preguntas: p.preguntas, errores: j.r.errores, sinVidas: j.r.sinVidas,
      utilidad: Math.round(j.r.actual.er.utilidadNeta), caja: Math.round(j.r.actual.fin.caja), sobregiro: j.r.actual.sobregiro > 0,
      decisiones: j.bitacora.join(' '), elecciones: j.el, pasos: j.pasos, retraso, llegada: retraso + j.segundos
    };
  });
}

// Mismo orden que fc_admin_ranking: puntaje desc, segundos asc
const ordenarRanking = lista => [...lista].sort((a, b) => b.puntaje - a.puntaje || a.segundos - b.segundos);

module.exports = { FC, M, caso, VIDAS, decisiones, caminos, mejor, PERFILES, generar, ordenarRanking };
