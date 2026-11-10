/* =========================================================
   MOTOR DE CASOS RAMIFICADOS (niveles 5 a 7)
   Funciones puras: a partir de las elecciones del participante
   reconstruye el camino, las vidas, la proyección de los estados
   financieros y el puntaje.
   ========================================================= */
window.FC = window.FC || {};

FC.Motor = (() => {
  const OPC_ANALISIS = ['Aumentó', 'Disminuyó', 'No cambió'];
  const BONOS = {
    liqSana: 150,     // liquidez corriente entre 1.5 y 3
    liqExceso: 50,    // liquidez mayor a 3
    liqBaja: -150,    // liquidez menor a 1
    endBajo: 100,     // endeudamiento de 50 % o menos
    endAlto: -100,    // endeudamiento mayor a 70 %
    roeAlto: 100,     // ROE de 10 % o más
    roeNeg: -100,     // ROE negativo
    sobregiro: -150,  // terminar el año en sobregiro
    acierto: 50,      // respuesta correcta de análisis o concepto
    vida: 20          // por cada vida que queda al final
  };

  const ind = (sim, id) => sim.ind.find(i => i.id === id).valor;
  const METRICAS = {
    caja: { nombre: 'Efectivo al cierre', valor: s => s.fin.caja, tol: 0.5 },
    utilidad: { nombre: 'Utilidad neta', valor: s => s.er.utilidadNeta, tol: 0.5 },
    liquidez: { nombre: 'Liquidez corriente', valor: s => ind(s, 'liquidez'), tol: 0.005 },
    endeudamiento: { nombre: 'Endeudamiento', valor: s => ind(s, 'endeudamiento'), tol: 0.0005 },
    roe: { nombre: 'ROE', valor: s => ind(s, 'roe'), tol: 0.0005 }
  };
  const SIN_ELECCION = ['escena', 'explicacion'];

  const proyectar = (caso, efectos) => simularOps(caso.empresa, efectos, 1);

  // Respuesta correcta de un nodo de análisis: compara la proyección antes y después de la última decisión.
  function respuestaAnalisis(nodo, antes, despues) {
    const m = METRICAS[nodo.metrica];
    const a = m.valor(antes), d = m.valor(despues);
    if (!Number.isFinite(a) || !Number.isFinite(d)) return 2;
    if (Math.abs(d - a) <= m.tol) return 2;
    return d > a ? 0 : 1;
  }

  // Reconstruye el recorrido a partir de las elecciones (índices de opción en orden).
  // vidas: número de vidas del nivel, o null si no se juega con vidas (clase guiada).
  function recorrer(caso, elecciones, vidas = null) {
    const efectos = [];
    const pasos = [];
    let previa = proyectar(caso, []);
    let actual = previa;
    let id = caso.inicio;
    let k = 0, errores = 0;
    const quedan = () => (vidas == null ? null : Math.max(0, vidas - errores));
    const salida = extra => ({ pasos, efectos, actual, previa, errores, vidas: quedan(), ...extra });

    while (id && caso.nodos[id] && caso.nodos[id].tipo !== 'fin') {
      const nodo = caso.nodos[id];
      if (SIN_ELECCION.includes(nodo.tipo)) { pasos.push({ id, nodo }); id = nodo.sig; continue; }
      if (vidas != null && errores >= vidas) return salida({ pendiente: null, terminado: true, sinVidas: true });
      if (k >= elecciones.length) return salida({ pendiente: id, terminado: false });
      const e = elecciones[k++];
      if (nodo.tipo === 'decision') {
        const op = nodo.opciones[e];
        if (!op) return { error: 'Elección inválida' };
        efectos.push({ titulo: op.texto, ...op.efecto });
        previa = actual;
        actual = proyectar(caso, efectos);
        if (op.error) errores++;
        pasos.push({ id, nodo, eleccion: e, puntos: op.puntos || 0, error: Boolean(op.error), antes: previa, despues: actual });
        id = op.sig;
      } else if (nodo.tipo === 'analisis' || nodo.tipo === 'pregunta') {
        const correcta = nodo.tipo === 'analisis' ? respuestaAnalisis(nodo, previa, actual) : nodo.correcta;
        if (e >= (nodo.tipo === 'analisis' ? 3 : nodo.opciones.length)) return { error: 'Elección inválida' };
        const acierto = e === correcta;
        if (!acierto) errores++;
        pasos.push({ id, nodo, eleccion: e, correcta, acierto, error: !acierto });
        id = nodo.sig;
      }
    }
    if (k !== elecciones.length) return { error: 'Sobran elecciones' };
    const sinVidas = vidas != null && errores >= vidas;
    return salida({ pendiente: null, terminado: true, sinVidas });
  }

  function puntaje(r) {
    const sim = r.actual;
    const detalle = [];
    const base = Math.round(sim.er.utilidadNeta / 100);
    detalle.push({ motivo: `Utilidad neta del año (${Math.round(sim.er.utilidadNeta).toLocaleString('en-US')} ÷ 100)`, puntos: base });
    const liq = ind(sim, 'liquidez'), end = ind(sim, 'endeudamiento'), roe = ind(sim, 'roe');
    if (liq < 1) detalle.push({ motivo: 'Liquidez corriente menor a 1', puntos: BONOS.liqBaja });
    else if (liq >= 1.5 && liq <= 3) detalle.push({ motivo: 'Liquidez corriente sana (1.5 a 3)', puntos: BONOS.liqSana });
    else if (liq > 3) detalle.push({ motivo: 'Liquidez mayor a 3 (recursos ociosos)', puntos: BONOS.liqExceso });
    if (end <= 0.5) detalle.push({ motivo: 'Endeudamiento de 50 % o menos', puntos: BONOS.endBajo });
    else if (end > 0.7) detalle.push({ motivo: 'Endeudamiento mayor a 70 %', puntos: BONOS.endAlto });
    if (roe >= 0.10) detalle.push({ motivo: 'ROE de 10 % o más', puntos: BONOS.roeAlto });
    else if (roe < 0) detalle.push({ motivo: 'ROE negativo', puntos: BONOS.roeNeg });
    if (sim.sobregiro > 0) detalle.push({ motivo: 'El año terminó en sobregiro bancario', puntos: BONOS.sobregiro });
    const aciertos = r.pasos.filter(p => p.acierto).length;
    const preguntas = r.pasos.filter(p => p.nodo.tipo === 'analisis' || p.nodo.tipo === 'pregunta').length;
    if (aciertos) detalle.push({ motivo: `Respuestas correctas (${aciertos} de ${preguntas})`, puntos: aciertos * BONOS.acierto });
    for (const p of r.pasos) if (p.puntos) detalle.push({ motivo: p.puntos > 0 ? 'Decisión responsable: cumplimiento y gestión de riesgos' : 'Decisión de alto riesgo', puntos: p.puntos });
    if (r.vidas != null && r.vidas > 0) detalle.push({ motivo: `Vidas restantes (${r.vidas} × ${BONOS.vida})`, puntos: r.vidas * BONOS.vida });
    return { total: detalle.reduce((a, d) => a + d.puntos, 0), detalle, aciertos, preguntas };
  }

  // Opciones visibles de un nodo (las de análisis son fijas).
  const opcionesDe = nodo => (nodo.tipo === 'analisis' ? OPC_ANALISIS : nodo.tipo === 'pregunta' ? nodo.opciones : nodo.opciones.map(o => o.texto));

  return { recorrer, puntaje, proyectar, opcionesDe, respuestaAnalisis, METRICAS, OPC_ANALISIS, BONOS };
})();
