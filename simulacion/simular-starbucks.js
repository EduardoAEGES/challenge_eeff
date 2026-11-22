/* =========================================================
   SIMULACIÓN DEL NIVEL 6 (Starbucks) CON N PARTICIPANTES A LA VEZ
   Usa el motor real del juego (js/caso-motor.js y js/contabilidad.js)
   sin tocar Supabase: nada se guarda en la base de datos.

   Uso:   node simulacion/simular-starbucks.js [participantes=26] [semilla=2026]
   Salida: resumen en la terminal y simulacion/resultados/ranking-nivel6.csv
   ========================================================= */
const fs = require('fs');
const path = require('path');
const { M, caso, VIDAS, decisiones, caminos, mejor, PERFILES, generar, ordenarRanking } = require('./participantes');

const N = Number(process.argv[2]) || 26;
const SEMILLA = Number(process.argv[3]) || 2026;

const participantes = generar(N, SEMILLA);
const ranking = ordenarRanking(participantes);

// ---------- Comprobaciones de integridad ----------
const problemas = [];
for (const p of participantes) {
  const re = M.recorrer(caso, p.elecciones, VIDAS); // como si se reconstruyera desde lo guardado
  if (re.error || !re.terminado) problemas.push(`${p.usuario}: el recorrido guardado no se puede reconstruir (${re.error || 'incompleto'})`);
  else if (M.puntaje(re).total !== p.puntaje) problemas.push(`${p.usuario}: el puntaje reconstruido no coincide`);
  if (!Number.isInteger(p.puntaje) || !Number.isInteger(p.segundos)) problemas.push(`${p.usuario}: puntaje o tiempo no son enteros (la base de datos espera int)`);
}
if (new Set(participantes.map(p => p.usuario)).size !== N) problemas.push('Hay usuarios repetidos: la base rechazaría a alguno');
const empatesPuntaje = Object.values(ranking.reduce((a, p) => ((a[p.puntaje] = a[p.puntaje] || []).push(p), a), {})).filter(g => g.length > 1);
const empatesTotales = empatesPuntaje.filter(g => new Set(g.map(p => p.segundos)).size < g.length);
const corte = ranking[3], siguiente = ranking[4];

// ---------- Informe ----------
const f = n => n.toLocaleString('en-US');
const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const prom = arr => arr.reduce((a, x) => a + x, 0) / arr.length;
const pct = (arr, q) => { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const etiqueta = p => `${p.nombre.split(' ')[0]} (${p.usuario})`;

console.log(`\nSIMULACIÓN · Nivel 6 · Starbucks · ${N} participantes en simultáneo · semilla ${SEMILLA}`);
console.log('='.repeat(78));
console.log(`\nCaminos posibles (respondiendo todo bien): ${caminos.length}`);
console.log(`  Puntaje máximo alcanzable: ${f(caminos[0].puntaje)}   ·   mínimo con todo correcto: ${f(caminos.at(-1).puntaje)}`);
console.log(`  Mejor camino: ${decisiones.map(id => `${id}→«${caso.nodos[id].opciones[mejor[id]].texto}»`).join('\n                ')}`);
console.log(`  Errores posibles como máximo: ${Object.values(caso.nodos).filter(n => n.tipo === 'analisis' || n.tipo === 'pregunta').length} preguntas + 1 decisión de alto riesgo, con ${VIDAS} vidas → nadie puede quedarse sin vidas en este nivel.`);

console.log(`\nRANKING DEL NIVEL 6 (tal como lo ordena el panel master)`);
console.log('-'.repeat(78));
console.log('  #  Participante                 Perfil     Puntaje  Tiempo  Vidas  Comodín  Aciertos');
ranking.forEach((p, i) => console.log(`${String(i + 1).padStart(3)}  ${etiqueta(p).padEnd(28)} ${p.perfil.padEnd(9)} ${String(p.puntaje).padStart(7)}  ${mmss(p.segundos).padStart(6)}  ${String(p.vidas).padStart(5)}  ${(p.comodin ? 'usado' : '—').padStart(7)}  ${p.aciertos}/${p.preguntas}${i === 3 ? '   ← corte: clasifican los 4 primeros' : ''}`));

const pts = participantes.map(p => p.puntaje), seg = participantes.map(p => p.segundos);
console.log('\nESTADÍSTICAS');
console.log('-'.repeat(78));
console.log(`  Puntaje: promedio ${f(Math.round(prom(pts)))} · mediana ${f(pct(pts, 0.5))} · mínimo ${f(Math.min(...pts))} · máximo ${f(Math.max(...pts))}`);
console.log(`  Tiempo:  promedio ${mmss(Math.round(prom(seg)))} · más rápido ${mmss(Math.min(...seg))} · más lento ${mmss(Math.max(...seg))}`);
console.log(`  El último resultado llega al servidor ${mmss(Math.max(...participantes.map(p => p.llegada)))} después de abrir el nivel (con hasta 45 s de diferencia al empezar).`);
console.log(`  Comodín usado: ${participantes.filter(p => p.comodin).length} de ${N} · Aceptaron la decisión de alto riesgo: ${participantes.filter(p => p.decisiones.includes('n11:1')).length} · Terminaron en sobregiro: ${participantes.filter(p => p.sobregiro).length}`);
for (const perfil of PERFILES) {
  const g = participantes.filter(p => p.perfil === perfil.nombre);
  if (g.length) console.log(`  ${perfil.nombre.padEnd(10)} (${String(g.length).padStart(2)}): puntaje promedio ${f(Math.round(prom(g.map(p => p.puntaje))))} · aciertos promedio ${prom(g.map(p => p.aciertos)).toFixed(1)}/8`);
}
console.log('\nDECISIONES TOMADAS');
console.log('-'.repeat(78));
console.log(decisiones.map(id => `  ${id}: ${caso.nodos[id].opciones.map((o, k) => `${participantes.filter(p => p.decisiones.includes(`${id}:${k}`)).length}× «${o.texto.slice(0, 32)}»`).join(' · ')}`).join('\n'));

console.log('\nCOMPROBACIONES');
console.log('-'.repeat(78));
console.log(`  Recorridos reconstruidos y puntajes recalculados: ${problemas.length ? 'CON PROBLEMAS' : `OK (${N} de ${N})`}`);
problemas.forEach(x => console.log('   · ' + x));
console.log(`  Empates de puntaje: ${empatesPuntaje.length} grupo(s)${empatesPuntaje.length ? ' → se desempatan por tiempo' : ''}${empatesTotales.length ? ` · ${empatesTotales.length} empate(s) también en tiempo (orden indefinido)` : ''}`);
console.log(`  Corte de clasificación: 4.º ${etiqueta(corte)} (${corte.puntaje} pts) vs 5.º ${etiqueta(siguiente)} (${siguiente.puntaje} pts)${corte.puntaje === siguiente.puntaje ? ' → se define por tiempo' : ''}`);

// CSV con las mismas columnas que exporta el panel master
const dir = path.join(__dirname, 'resultados');
fs.mkdirSync(dir, { recursive: true });
const filas = [['Puesto', 'Participante', 'Usuario', 'Perfil simulado', 'Puntaje', 'Tiempo (s)', 'Vidas', 'Comodín', 'Aciertos', 'Utilidad neta', 'Caja al cierre', 'Decisiones']];
ranking.forEach((p, i) => filas.push([i + 1, p.nombre, p.usuario, p.perfil, p.puntaje, p.segundos, p.vidas, p.comodin ? 'Sí' : 'No', `${p.aciertos}/${p.preguntas}`, p.utilidad, p.caja, p.decisiones]));
const csv = filas.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
fs.writeFileSync(path.join(dir, 'ranking-nivel6.csv'), '﻿' + csv);
fs.writeFileSync(path.join(dir, 'simulacion-nivel6.json'), JSON.stringify({ semilla: SEMILLA, participantes: N, maximo: caminos[0].puntaje, ranking: ranking.map(({ pasos, ...p }) => p) }, null, 2));
console.log(`\nArchivos: simulacion/resultados/ranking-nivel6.csv y simulacion-nivel6.json\n`);
