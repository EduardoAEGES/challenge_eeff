/* =========================================================
   PRUEBA DE CARGA DEL NIVEL 6 (Starbucks) CONTRA SUPABASE
   26 participantes de prueba (usuarios sim26_01 … sim26_26) hacen las
   mismas llamadas que la app: entrar, guardar avance tras cada paso,
   sincronizar cada 20 s y enviar el resultado al terminar.

   Pasos:
     1) node simulacion/prueba-supabase.js registrar
     2) habilitar el nivel 6 a los usuarios sim26_   (SQL que imprime el paso 1,
        o «habilitar» con la variable FC_MASTER)
     3) node simulacion/prueba-supabase.js jugar [acelerar=20]
     4) borrar los usuarios de prueba               (SQL que imprime «limpiar»,
        o «limpiar» con la variable FC_MASTER)

   «acelerar» comprime el tiempo: con 20, los ~26 minutos del nivel pasan
   en ~80 s, así que el servidor recibe 20 veces más llamadas por segundo
   que en el evento real (prueba más exigente que la realidad).
   Si Node no usa el proxy, ejecútalo con NODE_USE_ENV_PROXY=1.
   ========================================================= */
const { FC, generar, ordenarRanking } = require('./participantes');

const URL = FC.CONFIG.SUPABASE_URL;
const KEY = FC.CONFIG.SUPABASE_ANON_KEY;
const PREFIJO = 'sim26_';
const CLAVE = 'sim26-prueba';
const N = 26;
const SEMILLA = 2026;
const MASTER = process.env.FC_MASTER || '';

const [, , comando = 'ayuda', arg] = process.argv;
const participantes = generar(N, SEMILLA, PREFIJO);

// ---------- Llamadas (igual que js/datos.js) con medición de tiempos ----------
const medidas = {};
async function rpc(fn, args) {
  const t0 = performance.now();
  let estado = 0, error = null, datos = null;
  try {
    const r = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${KEY}` },
      body: JSON.stringify(args)
    });
    estado = r.status;
    const texto = await r.text();
    if (!r.ok) { try { error = JSON.parse(texto).message || texto; } catch { error = texto; } }
    else datos = texto ? JSON.parse(texto) : null;
  } catch (e) { error = `RED: ${e.cause?.code || e.message}`; }
  const ms = performance.now() - t0;
  (medidas[fn] ||= []).push({ ms, ok: !error, estado, error });
  if (error) throw Object.assign(new Error(error), { estado });
  return datos;
}
const entrar = p => rpc('fc_entrar', { p_usuario: p.usuario, p_clave: CLAVE });
const guardar = (p, progreso) => rpc('fc_guardar', { p_usuario: p.usuario, p_clave: CLAVE, p_progreso: progreso });
const enviar = (p, r) => rpc('fc_enviar_resultado', {
  p_usuario: p.usuario, p_clave: CLAVE, p_nivel: 6, p_elecciones: r.elecciones, p_segundos: r.segundos,
  p_vidas: r.vidas, p_comodin: r.comodin, p_puntaje: r.puntaje, p_detalle: { sinVidas: r.sinVidas, simulacion: true }
});

const espera = ms => new Promise(res => setTimeout(res, Math.max(0, ms)));
const pct = (arr, q) => { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function informeLatencias(titulo) {
  console.log(`\n${titulo}`);
  console.log('-'.repeat(78));
  console.log('  Función                     Llamadas  Errores   p50 ms   p95 ms   máx ms');
  let total = 0, errores = 0;
  for (const [fn, l] of Object.entries(medidas)) {
    const ms = l.map(x => x.ms), err = l.filter(x => !x.ok).length;
    total += l.length; errores += err;
    console.log(`  ${fn.padEnd(26)} ${String(l.length).padStart(8)} ${String(err).padStart(8)} ${pct(ms, 0.5).toFixed(0).padStart(8)} ${pct(ms, 0.95).toFixed(0).padStart(8)} ${Math.max(...ms).toFixed(0).padStart(8)}`);
  }
  console.log(`  Total: ${total} llamadas · ${errores} con error`);
  const tipos = {};
  for (const l of Object.values(medidas)) for (const x of l) if (!x.ok) tipos[`${x.estado} ${x.error}`] = (tipos[`${x.estado} ${x.error}`] || 0) + 1;
  for (const [t, c] of Object.entries(tipos)) console.log(`   · ${c}× ${t}`);
  return errores;
}

const SQL_HABILITAR = `update public.fc_participantes set habilitado = array_append(array_remove(habilitado, 6), 6) where usuario like '${PREFIJO.replace('_', '\\_')}%';`;
const SQL_LIMPIAR = `delete from public.fc_participantes where usuario like '${PREFIJO.replace('_', '\\_')}%';  -- borra también sus resultados (on delete cascade)`;

// ---------- 1) Registrar a los 26 a la vez ----------
async function registrar() {
  console.log(`\nRegistrando ${N} usuarios de prueba a la vez (${PREFIJO}01 … ${PREFIJO}${N})…`);
  const res = await Promise.allSettled(participantes.map(async p => {
    try { return { p, d: await rpc('fc_registrar', { p_usuario: p.usuario, p_clave: CLAVE, p_nombre: p.nombre, p_condicion: 'Prueba' }), nuevo: true }; }
    catch (e) { if (e.message === 'USUARIO_EXISTE') return { p, d: await entrar(p), nuevo: false }; throw e; }
  }));
  const ok = res.filter(r => r.status === 'fulfilled').map(r => r.value);
  console.log(`  Nuevos: ${ok.filter(x => x.nuevo).length} · Ya existían: ${ok.filter(x => !x.nuevo).length} · Fallaron: ${res.length - ok.length}`);
  res.filter(r => r.status === 'rejected').forEach(r => console.log('   · ' + r.reason.message));

  // Sin habilitar, el servidor debe rechazar el resultado (no se inserta nada).
  const sinHab = ok.find(x => !(x.d.habilitado || []).map(Number).includes(6));
  if (sinHab) {
    try { await enviar(sinHab.p, sinHab.p); console.log('  ✗ El servidor aceptó un resultado sin habilitación (revisar).'); }
    catch (e) { console.log(`  ✓ Antes de habilitar, el servidor rechaza el resultado: ${e.message}`); }
  }
  const habilitados = ok.filter(x => (x.d.habilitado || []).map(Number).includes(6)).length;
  console.log(`  Con el nivel 6 habilitado: ${habilitados} de ${N}`);
  informeLatencias('TIEMPOS DE RESPUESTA (registro simultáneo)');
  if (habilitados < N) console.log(`\nSiguiente paso: habilitar el nivel 6. En Supabase → SQL Editor, ejecuta:\n\n  ${SQL_HABILITAR}\n\n(o: FC_MASTER=… node simulacion/prueba-supabase.js habilitar)\n`);
}

// ---------- 2) Habilitar / 4) Limpiar con la clave master ----------
async function idsPrueba() {
  const lista = await rpc('fc_admin_listar', { p_master: MASTER });
  return lista.filter(p => p.usuario.startsWith(PREFIJO));
}
async function habilitar() {
  if (!MASTER) return console.log(`\nSin FC_MASTER. En Supabase → SQL Editor, ejecuta:\n\n  ${SQL_HABILITAR}\n`);
  const ids = (await idsPrueba()).map(p => p.id);
  await rpc('fc_admin_habilitar', { p_master: MASTER, p_ids: ids, p_nivel: 6, p_valor: true });
  console.log(`\nNivel 6 habilitado para ${ids.length} usuarios de prueba.`);
}
async function limpiar() {
  if (!MASTER) return console.log(`\nSin FC_MASTER. En Supabase → SQL Editor, ejecuta:\n\n  ${SQL_LIMPIAR}\n`);
  const lista = await idsPrueba();
  await Promise.all(lista.map(p => rpc('fc_admin_borrar_participante', { p_master: MASTER, p_id: p.id })));
  console.log(`\nBorrados ${lista.length} usuarios de prueba (y sus resultados).`);
}

// ---------- 3) Jugar el nivel 6 los 26 a la vez ----------
async function jugar() {
  const acel = Number(arg) || 20;
  console.log(`\nComprobando a los ${N} participantes…`);
  const previos = await Promise.all(participantes.map(entrar));
  const faltan = previos.filter(d => !(d.habilitado || []).map(Number).includes(6));
  const yaJugaron = previos.filter(d => d.resultados?.['6']);
  if (faltan.length) return console.log(`  ${faltan.length} usuarios aún no tienen el nivel 6 habilitado. Ejecuta:\n\n  ${SQL_HABILITAR}\n`);
  if (yaJugaron.length) return console.log(`  ${yaJugaron.length} usuarios ya tienen resultado en el nivel 6 (un solo intento). Limpia y vuelve a registrar:\n\n  ${SQL_LIMPIAR}\n`);
  for (const k of Object.keys(medidas)) delete medidas[k];

  const duracion = Math.max(...participantes.map(p => p.llegada));
  console.log(`  OK. Empieza la competencia: ${N} participantes · tiempo comprimido ×${acel} (${mmss(duracion)} del evento ≈ ${mmss(Math.ceil(duracion / acel))} reales)\n`);
  const t0 = Date.now();
  const enTiempo = segEvento => espera(t0 + (segEvento * 1000) / acel - Date.now());
  let terminados = 0;

  // Panel master abierto, refrescando cada 5 s (solo si hay clave master)
  let panelActivo = Boolean(MASTER);
  const panel = (async () => {
    while (panelActivo) {
      await Promise.allSettled([rpc('fc_admin_listar', { p_master: MASTER }), rpc('fc_admin_ranking', { p_master: MASTER, p_nivel: 6 }), rpc('fc_admin_ranking', { p_master: MASTER, p_nivel: 7 })]);
      await espera(5000);
    }
  })();

  const jugadores = participantes.map(async (p, i) => {
    const progreso = { ...previos[i].progreso, casos: { ...(previos[i].progreso?.casos || {}) } };
    const est = { elecciones: [], inicio: Date.now(), escenas: [], comodinUsado: false };
    progreso.casos[6] = { estado: est };
    const fallos = [];
    const intentar = async fn => { try { await fn(); } catch (e) { fallos.push(e.message); } };

    // Sincronización cada 20 s del evento, como la app
    let activo = true;
    const sincro = (async () => { for (let s = p.retraso + 20; activo; s += 20) { await enTiempo(s); if (activo) await intentar(() => entrar(p)); } })();

    await enTiempo(p.retraso);
    await intentar(() => guardar(p, progreso)); // abre el caso
    for (const paso of p.pasos) {
      await enTiempo(p.retraso + paso.seg);
      est.elecciones.push(paso.eleccion);
      if (paso.comodin) est.comodinUsado = true;
      await intentar(() => guardar(p, progreso));
    }
    await enTiempo(p.llegada);
    const resultado = { elecciones: p.elecciones, segundos: p.segundos, puntaje: p.puntaje, vidas: p.vidas, comodin: p.comodin, sinVidas: p.sinVidas };
    est.reportado = true;
    progreso.casos[6] = { estado: est, resultado: { ...resultado, fecha: new Date().toISOString() }, pendienteEnvio: true };
    await intentar(() => guardar(p, progreso));
    // La app reintenta el envío si falla: hasta 3 intentos
    let enviado = false;
    for (let k = 0; k < 3 && !enviado; k++) { try { await enviar(p, resultado); enviado = true; } catch (e) { fallos.push(e.message); await espera(1000); } }
    progreso.casos[6].pendienteEnvio = !enviado;
    await intentar(() => guardar(p, progreso));
    await intentar(() => entrar(p));
    activo = false;
    terminados++;
    process.stdout.write(`\r  Resultados enviados: ${terminados}/${N}   `);
    await sincro;
    return { p, enviado, fallos };
  });
  const fin = await Promise.all(jugadores);
  panelActivo = false;
  await panel;
  console.log(`\n  Competencia terminada en ${mmss(Math.round((Date.now() - t0) / 1000))} reales.`);
  const erroresCarga = informeLatencias('TIEMPOS DE RESPUESTA DURANTE LA COMPETENCIA');

  // ---------- Verificación ----------
  console.log('\nVERIFICACIÓN EN EL SERVIDOR');
  console.log('-'.repeat(78));
  const sinEnviar = fin.filter(x => !x.enviado);
  console.log(`  ${sinEnviar.length ? '✗' : '✓'} Resultados enviados: ${N - sinEnviar.length} de ${N}`);
  const despues = await Promise.all(participantes.map(entrar)); // 26 a la vez
  const distintos = participantes.filter((p, i) => {
    const r = despues[i].resultados?.['6'];
    return !r || r.puntaje !== p.puntaje || r.segundos !== p.segundos || r.vidas !== p.vidas;
  });
  console.log(`  ${distintos.length ? '✗' : '✓'} Puntaje, tiempo y vidas guardados igual que en la app: ${N - distintos.length} de ${N}`);
  distintos.forEach(p => console.log(`     · ${p.usuario}: esperado ${p.puntaje}/${p.segundos}s, guardado ${JSON.stringify(despues[participantes.indexOf(p)].resultados?.['6'])}`));
  const avanceOk = despues.filter(d => d.progreso?.casos?.['6']?.resultado && d.progreso.casos['6'].pendienteEnvio === false).length;
  console.log(`  ${avanceOk === N ? '✓' : '✗'} Avance guardado con el caso cerrado: ${avanceOk} de ${N}`);

  // Un solo intento: un segundo envío con otro puntaje debe ignorarse
  const p0 = participantes[0];
  let dupMsg;
  try { await enviar(p0, { ...p0, puntaje: 9999, segundos: 1 }); dupMsg = 'aceptado sin error'; } catch (e) { dupMsg = `rechazado (${e.message})`; }
  const tras = (await entrar(p0)).resultados?.['6'];
  console.log(`  ${tras?.puntaje === p0.puntaje ? '✓' : '✗'} Segundo intento de ${p0.usuario} (9999 pts): ${dupMsg}; el ranking conserva ${tras?.puntaje} pts`);

  // Podio público del nivel 6 vs el ranking esperado
  const esperado = ordenarRanking(participantes).slice(0, 3);
  const podio = await rpc('fc_podio', { p_nivel: 6 });
  const podioOk = podio.length === 3 && podio.every((x, i) => x.puntaje === esperado[i].puntaje && x.segundos === esperado[i].segundos);
  console.log(`  ${podioOk ? '✓' : '✗'} Podio del servidor = podio esperado: ${podio.map(x => `${x.nombre} ${x.puntaje} pts ${mmss(x.segundos)}`).join(' · ')}`);
  if (MASTER) {
    const rk = await rpc('fc_admin_ranking', { p_master: MASTER, p_nivel: 6 });
    const propios = rk.filter(x => x.usuario.startsWith(PREFIJO));
    const ordenOk = ordenarRanking(participantes).every((p, i) => propios[i]?.puntaje === p.puntaje && propios[i]?.segundos === p.segundos);
    console.log(`  ${ordenOk ? '✓' : '✗'} Ranking del panel master (${propios.length} filas) en el orden esperado`);
  }
  const fallosJug = fin.flatMap(x => x.fallos);
  console.log(`\n  ${erroresCarga || fallosJug.length ? `Hubo ${erroresCarga} llamadas con error.` : 'Sin errores en ninguna llamada.'}`);
  console.log(`\nPara borrar los datos de prueba: node simulacion/prueba-supabase.js limpiar\n`);
}

const comandos = { registrar, habilitar, jugar, limpiar };
if (!comandos[comando]) console.log('Uso: node simulacion/prueba-supabase.js registrar | habilitar | jugar [acelerar=20] | limpiar');
else comandos[comando]().catch(e => { console.error('\nError:', e.message); process.exit(1); });
