/* =========================================================
   SIMULACIÓN DEL NIVEL 6 (Starbucks) CON N PARTICIPANTES A LA VEZ
   Usa el motor real del juego (js/caso-motor.js y js/contabilidad.js)
   sin tocar Supabase: nada se guarda en la base de datos.

   Uso:   node simulacion/simular-starbucks.js [participantes=26] [semilla=2026]
   Salida: resumen en la terminal y simulacion/resultados/ranking-nivel6.csv
   ========================================================= */
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const N = Number(process.argv[2]) || 26;
const SEMILLA = Number(process.argv[3]) || 2026;

// ---------- Cargar el motor del juego tal como lo carga el navegador ----------
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['js/config.js', 'js/contabilidad.js', 'js/data/niveles.js', 'js/data/casos.js', 'js/caso-motor.js'])
  vm.runInContext(fs.readFileSync(path.join(RAIZ, f), 'utf8'), ctx, { filename: f });
const { FC } = ctx;
const caso = FC.CASOS.c6;
const VIDAS = FC.VIDAS_COMPETENCIA;
const M = FC.Motor;

// ---------- Azar reproducible ----------
let estado = SEMILLA >>> 0;
const azar = () => { estado = (estado + 0x6D2B79F5) >>> 0; let t = estado; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const entre = (a, b) => a + azar() * (b - a);
const elegir = arr => arr[Math.floor(azar() * arr.length)];

// ---------- 1. Todos los caminos de decisiones (respondiendo todo bien) ----------
const decisiones = Object.entries(caso.nodos).filter(([, n]) => n.tipo === 'decision').map(([id]) => id);
function jugarPerfecto(combo) {
  const el = [];
  for (;;) {
    const r = M.recorrer(caso, el, VIDAS);
    if (r.error) throw new Error(r.error);
    if (r.terminado) return { r, el };
    const nodo = caso.nodos[r.pendiente];
    if (nodo.tipo === 'decision') el.push(combo[nodo.id ?? r.pendiente] ?? combo[r.pendiente]);
    else if (nodo.tipo === 'analisis') el.push(M.respuestaAnalisis(nodo, r.previa, r.actual));
    else el.push(nodo.correcta);
  }
}
const caminos = [];
(function explorar(i, combo) {
  if (i === decisiones.length) {
    const { r } = jugarPerfecto(combo);
    caminos.push({ combo: { ...combo }, puntaje: M.puntaje(r).total, r });
    return;
  }
  const id = decisiones[i];
  caso.nodos[id].opciones.forEach((_, k) => explorar(i + 1, { ...combo, [id]: k }));
})(0, {});
caminos.sort((a, b) => b.puntaje - a.puntaje);
const mejor = caminos[0].combo;

// ---------- 2. Perfiles de participantes ----------
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

function repartirPerfiles(n) {
  const total = PERFILES.reduce((a, p) => a + p.peso, 0);
  const lista = [];
  PERFILES.forEach(p => { for (let i = 0; i < Math.round((p.peso / total) * n); i++) lista.push(p); });
  while (lista.length < n) lista.push(PERFILES[2]);
  return lista.slice(0, n).sort(() => azar() - 0.5);
}

// ---------- 3. Un participante juega el caso completo ----------
function jugar(idx, perfil) {
  const acierto = entre(...perfil.acierto);
  const ritmo = entre(...perfil.ritmo);
  const el = [];
  const bitacora = [];
  let segundos = 0, comodinUsado = false, comodinEn = null;
  for (;;) {
    const r = M.recorrer(caso, el, VIDAS);
    if (r.error) throw new Error(`Participante ${idx + 1}: ${r.error}`);
    // Escenas que se cruzan antes del nodo pendiente
    if (r.terminado) { segundos += entre(...TIEMPO.escena) * ritmo; return { r, el, segundos: Math.round(segundos), comodinUsado, comodinEn, acierto, bitacora }; }
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
  }
}

// ---------- 4. Los N participantes empiezan a la vez ----------
const perfiles = repartirPerfiles(N);
const inicio = new Date('2026-11-27T10:00:00');
const participantes = perfiles.map((perfil, i) => {
  const usuario = `prueba${String(i + 1).padStart(2, '0')}`;
  const retraso = Math.round(entre(0, 45)); // segundos hasta que cada uno abre el caso
  const j = jugar(i, perfil);
  const p = M.puntaje(j.r);
  return {
    usuario, nombre: `${NOMBRES[i % NOMBRES.length]} (${usuario})`, perfil: perfil.nombre,
    puntaje: p.total, segundos: j.segundos, vidas: j.r.vidas, comodin: j.comodinUsado, comodinEn: j.comodinEn,
    aciertos: p.aciertos, preguntas: p.preguntas, errores: j.r.errores, sinVidas: j.r.sinVidas,
    utilidad: Math.round(j.r.actual.er.utilidadNeta), caja: Math.round(j.r.actual.fin.caja), sobregiro: j.r.actual.sobregiro > 0,
    decisiones: j.bitacora.join(' '), elecciones: j.el, llegada: retraso + j.segundos
  };
});

// Mismo orden que fc_admin_ranking: puntaje desc, segundos asc
const ranking = [...participantes].sort((a, b) => b.puntaje - a.puntaje || a.segundos - b.segundos);

// ---------- 5. Comprobaciones de integridad ----------
const problemas = [];
for (const p of participantes) {
  const re = M.recorrer(caso, p.elecciones, VIDAS); // como si se reconstruyera desde lo guardado
  if (re.error || !re.terminado) problemas.push(`${p.usuario}: el recorrido guardado no se puede reconstruir (${re.error || 'incompleto'})`);
  else if (M.puntaje(re).total !== p.puntaje) problemas.push(`${p.usuario}: el puntaje reconstruido no coincide`);
  if (!Number.isInteger(p.puntaje) || !Number.isInteger(p.segundos)) problemas.push(`${p.usuario}: puntaje o tiempo no son enteros (la base de datos espera int)`);
}
const usuarios = new Set(participantes.map(p => p.usuario));
if (usuarios.size !== N) problemas.push('Hay usuarios repetidos: la base rechazaría a alguno');
const empatesPuntaje = Object.values(ranking.reduce((a, p) => ((a[p.puntaje] = a[p.puntaje] || []).push(p), a), {})).filter(g => g.length > 1);
const empatesTotales = empatesPuntaje.filter(g => new Set(g.map(p => p.segundos)).size < g.length);
const corte = ranking[3], siguiente = ranking[4];

// ---------- 6. Informe ----------
const f = n => n.toLocaleString('en-US');
const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const prom = arr => arr.reduce((a, x) => a + x, 0) / arr.length;
const pct = (arr, q) => { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };

console.log(`\nSIMULACIÓN · Nivel 6 · Starbucks · ${N} participantes en simultáneo · semilla ${SEMILLA}`);
console.log('='.repeat(78));
console.log(`\nCaminos posibles (respondiendo todo bien): ${caminos.length}`);
console.log(`  Puntaje máximo alcanzable: ${f(caminos[0].puntaje)}   ·   mínimo con todo correcto: ${f(caminos.at(-1).puntaje)}`);
console.log(`  Mejor camino: ${decisiones.map(id => `${id}→«${caso.nodos[id].opciones[mejor[id]].texto}»`).join('\n                ')}`);
console.log(`  Errores posibles como máximo: ${Object.values(caso.nodos).filter(n => n.tipo === 'analisis' || n.tipo === 'pregunta').length} preguntas + 1 decisión de alto riesgo, con ${VIDAS} vidas → nadie puede quedarse sin vidas en este nivel.`);

console.log(`\nRANKING DEL NIVEL 6 (tal como lo ordena el panel master)`);
console.log('-'.repeat(78));
console.log('  #  Participante                 Perfil     Puntaje  Tiempo  Vidas  Comodín  Aciertos');
ranking.forEach((p, i) => console.log(`${String(i + 1).padStart(3)}  ${p.nombre.padEnd(28)} ${p.perfil.padEnd(9)} ${String(p.puntaje).padStart(7)}  ${mmss(p.segundos).padStart(6)}  ${String(p.vidas).padStart(5)}  ${(p.comodin ? 'usado' : '—').padStart(7)}  ${p.aciertos}/${p.preguntas}${i === 3 ? '   ← corte: clasifican los 4 primeros' : ''}`));

const pts = participantes.map(p => p.puntaje), seg = participantes.map(p => p.segundos);
console.log('\nESTADÍSTICAS');
console.log('-'.repeat(78));
console.log(`  Puntaje: promedio ${f(Math.round(prom(pts)))} · mediana ${f(pct(pts, 0.5))} · mínimo ${f(Math.min(...pts))} · máximo ${f(Math.max(...pts))}`);
console.log(`  Tiempo:  promedio ${mmss(Math.round(prom(seg)))} · más rápido ${mmss(Math.min(...seg))} · más lento ${mmss(Math.max(...seg))}`);
const ult = Math.max(...participantes.map(p => p.llegada));
console.log(`  El último resultado llega al servidor ${mmss(ult)} después de abrir el nivel (con hasta 45 s de diferencia al empezar).`);
console.log(`  Comodín usado: ${participantes.filter(p => p.comodin).length} de ${N} · Aceptaron la decisión de alto riesgo: ${participantes.filter(p => p.decisiones.includes('n11:1')).length} · Terminaron en sobregiro: ${participantes.filter(p => p.sobregiro).length}`);
for (const perfil of PERFILES) {
  const g = participantes.filter(p => p.perfil === perfil.nombre);
  if (g.length) console.log(`  ${perfil.nombre.padEnd(10)} (${String(g.length).padStart(2)}): puntaje promedio ${f(Math.round(prom(g.map(p => p.puntaje))))} · aciertos promedio ${prom(g.map(p => p.aciertos)).toFixed(1)}/8`);
}
const elecciones = decisiones.map(id => `  ${id}: ${caso.nodos[id].opciones.map((o, k) => `${participantes.filter(p => p.decisiones.includes(`${id}:${k}`)).length}× «${o.texto.slice(0, 32)}»`).join(' · ')}`);
console.log('\nDECISIONES TOMADAS');
console.log('-'.repeat(78));
console.log(elecciones.join('\n'));

console.log('\nCOMPROBACIONES');
console.log('-'.repeat(78));
console.log(`  Recorridos reconstruidos y puntajes recalculados: ${problemas.length ? 'CON PROBLEMAS' : `OK (${N} de ${N})`}`);
problemas.forEach(x => console.log('   · ' + x));
console.log(`  Empates de puntaje: ${empatesPuntaje.length} grupo(s)${empatesPuntaje.length ? ' → se desempatan por tiempo' : ''}${empatesTotales.length ? ` · ${empatesTotales.length} empate(s) también en tiempo (orden indefinido)` : ''}`);
console.log(`  Corte de clasificación: 4.º ${corte.nombre} (${corte.puntaje} pts) vs 5.º ${siguiente.nombre} (${siguiente.puntaje} pts)${corte.puntaje === siguiente.puntaje ? ' → se define por tiempo' : ''}`);

// CSV con las mismas columnas que exporta el panel master
const dir = path.join(__dirname, 'resultados');
fs.mkdirSync(dir, { recursive: true });
const filas = [['Puesto', 'Participante', 'Usuario', 'Perfil simulado', 'Puntaje', 'Tiempo (s)', 'Vidas', 'Comodín', 'Aciertos', 'Utilidad neta', 'Caja al cierre', 'Decisiones']];
ranking.forEach((p, i) => filas.push([i + 1, p.nombre, p.usuario, p.perfil, p.puntaje, p.segundos, p.vidas, p.comodin ? 'Sí' : 'No', `${p.aciertos}/${p.preguntas}`, p.utilidad, p.caja, p.decisiones]));
const csv = filas.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
fs.writeFileSync(path.join(dir, 'ranking-nivel6.csv'), '﻿' + csv);
fs.writeFileSync(path.join(dir, 'simulacion-nivel6.json'), JSON.stringify({ semilla: SEMILLA, participantes: N, maximo: caminos[0].puntaje, ranking }, null, 2));
console.log(`\nArchivos: simulacion/resultados/ranking-nivel6.csv y simulacion-nivel6.json\n`);
