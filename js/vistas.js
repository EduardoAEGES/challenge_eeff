// Componentes de presentación: estados financieros, libro diario e indicadores.
const V = (() => {
  const fmt = n => (n == null || !Number.isFinite(n)) ? '—' : (n < 0 ? '−' : '') + 'S/ ' + Math.abs(Math.round(n)).toLocaleString('en-US');
  const fmtVar = n => (!n ? '—' : (n > 0 ? '+' : '') + fmt(n));
  const cls = n => (n < 0 ? 'neg' : n > 0 ? 'pos' : '');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function fmtInd(i) {
    const v = i.valor;
    if (v === Infinity) return '∞';
    if (v == null || !Number.isFinite(v)) return '—';
    switch (i.fmt) {
      case 'ratio': return v.toFixed(2);
      case 'pct': return (v * 100).toFixed(1) + '%';
      case 'soles': return fmt(v);
      case 'dias': return Math.round(v) + ' días';
      case 'veces': return v.toFixed(1) + ' veces';
      default: return String(v);
    }
  }
  const dot = e => `<span class="dot ${e}" title="${{ good: 'Saludable', warn: 'Atención', bad: 'Riesgo', na: 'Referencial' }[e] || ''}"></span>`;

  const encabezado = (cols, impacto) => `<thead><tr><th>Concepto</th>${cols.map(c => `<th class="num">${esc(c.titulo)}</th>`).join('')}${impacto ? '<th class="num">Impacto</th>' : ''}</tr></thead>`;

  function fila(nombre, valores, { impacto, tipo = '', sangria = false } = {}) {
    const imp = impacto ? valores[valores.length - 1] - valores[valores.length - 2] : 0;
    const cambio = impacto && imp !== 0 ? ' changed' : '';
    return `<tr class="${tipo}${cambio}">
      <td${sangria ? ' class="indent"' : ''}>${nombre}</td>
      ${valores.map(v => `<td class="num ${v < 0 ? 'neg' : ''}">${fmt(v)}</td>`).join('')}
      ${impacto ? `<td class="num ${cls(imp)}">${fmtVar(imp)}</td>` : ''}
    </tr>`;
  }

  // cols: [{ titulo, s }]. Con impacto=true, la última columna se compara con la penúltima.
  function tablaESF(cols, impacto = false) {
    const pres = cols.map(c => saldosPresentacion(c.s));
    const tots = cols.map(c => totales(c.s));
    let html = '';
    for (const b of ESF_ESTRUCTURA) {
      if (b.granTotal) {
        html += fila(b.etiqueta, tots.map(t => t[b.granTotal]), { impacto, tipo: 'grand' });
        continue;
      }
      html += `<tr class="section"><td colspan="${cols.length + 1 + (impacto ? 1 : 0)}">${b.titulo}</td></tr>`;
      for (const k of b.cuentas) {
        const vals = pres.map(p => (CUENTAS[k].contra ? -p[k] : p[k]));
        if (vals.every(v => !v)) continue;
        html += fila(CUENTAS[k].nombre, vals, { impacto, sangria: true });
      }
      html += fila(b.etiqueta, tots.map(t => t[b.total]), { impacto, tipo: 'total' });
    }
    return `<div class="table-wrap"><table class="fs">${encabezado(cols, impacto)}<tbody>${html}</tbody></table></div>`;
  }

  // Estructura de la NIIF 18: categorías de operación, inversión y financiación, con sus subtotales.
  // La empresa simulada no tiene ingresos ni gastos de inversión, por eso ese subtotal repite el operativo.
  const FILAS_ER = [
    { seccion: 'Categoría de operación' },
    ['Ingresos de actividades ordinarias', 'ventas'],
    ['(−) Costo de ventas', 'costoVentas', true],
    ['Ganancia bruta', 'utilidadBruta', false, 'total'],
    ['(−) Gastos de personal', 'personal', true],
    ['(−) Servicios prestados por terceros', 'servicios', true],
    ['(−) Otros gastos de gestión', 'otrosGastos', true],
    ['(−) Depreciación, amortización y estimaciones', 'depreciacion', true],
    ['RESULTADO OPERATIVO', 'utilidadOperativa', false, 'total'],
    { seccion: 'Categoría de inversión' },
    ['RESULTADO ANTES DE FINANCIACIÓN E IMPUESTOS', 'utilidadOperativa', false, 'total'],
    { seccion: 'Categoría de financiación' },
    ['(−) Gastos por intereses y costos financieros', 'financieros', true],
    ['RESULTADO ANTES DE IMPUESTOS', 'uai', false, 'total'],
    { seccion: 'Impuesto a las ganancias' },
    ['(−) Impuesto a la renta (29.5%)', 'impuesto', true],
    ['RESULTADO DEL EJERCICIO', 'utilidadNeta', false, 'grand']
  ];

  function tablaER(cols, impacto = false) {
    const n = cols.length + 1 + (impacto ? 1 : 0);
    const body = FILAS_ER.map(f => {
      if (f.seccion) return `<tr class="section"><td colspan="${n}">${f.seccion}</td></tr>`;
      const [nombre, k, resta, tipo] = f;
      const vals = cols.map(c => (resta ? -c.er[k] : c.er[k]));
      if (resta && vals.every(v => !v)) return '';
      return fila(nombre, vals, { impacto, tipo: tipo || '', sangria: !tipo });
    }).join('');
    return `<div class="table-wrap"><table class="fs">${encabezado(cols, impacto)}<tbody>${body}</tbody></table></div>`;
  }

  const CATS_EFE = [
    ['operacion', 'Actividades de operación'],
    ['inversion', 'Actividades de inversión'],
    ['financiamiento', 'Actividades de financiamiento']
  ];

  function tablaEFE(cols, impacto = false) {
    let html = '';
    const n = cols.length + 1 + (impacto ? 1 : 0);
    for (const [k, titulo] of CATS_EFE) {
      html += `<tr class="section"><td colspan="${n}">${titulo}</td></tr>`;
      const conceptos = [...new Set(cols.flatMap(c => c.efe[k].items.map(i => i.con)))];
      if (!conceptos.length) html += `<tr><td class="indent muted" colspan="${n}">Sin movimientos</td></tr>`;
      for (const con of conceptos) {
        html += fila(esc(con), cols.map(c => (c.efe[k].items.find(i => i.con === con) || { monto: 0 }).monto), { impacto, sangria: true });
      }
      html += fila(`Flujo neto de ${titulo.toLowerCase()}`, cols.map(c => c.efe[k].total), { impacto, tipo: 'total' });
    }
    html += fila('Aumento (disminución) neto de efectivo', cols.map(c => c.efe.neto), { impacto, tipo: 'total' });
    html += fila('Efectivo al inicio del año', cols.map(c => c.efe.inicial), { impacto });
    html += fila('EFECTIVO AL FINAL DEL AÑO', cols.map(c => c.efe.final), { impacto, tipo: 'grand' });
    return `<div class="table-wrap"><table class="fs">${encabezado(cols, impacto)}<tbody>${html}</tbody></table></div>`;
  }

  function tablaECP(ecp) {
    const cols = ['capital', 'reservas', 'resultados'];
    const filaECP = (nombre, obj, tipo = '') => {
      const total = cols.reduce((a, k) => a + obj[k], 0);
      return `<tr class="${tipo}"><td>${nombre}</td>${cols.map(k => `<td class="num ${obj[k] < 0 ? 'neg' : ''}">${obj[k] ? fmt(obj[k]) : '—'}</td>`).join('')}<td class="num"><b>${fmt(total)}</b></td></tr>`;
    };
    const movs = ECP_FILAS.filter(f => cols.some(k => ecp.filas[f.id][k])).map(f => filaECP(f.nombre, ecp.filas[f.id], 'changed')).join('');
    return `<div class="table-wrap"><table class="fs">
      <thead><tr><th>Concepto</th><th class="num">Capital</th><th class="num">Reserva legal</th><th class="num">Resultados acumulados</th><th class="num">Total patrimonio</th></tr></thead>
      <tbody>
        ${filaECP('Saldo al inicio del año', ecp.inicial, 'total')}
        ${movs || '<tr><td colspan="5" class="muted">Sin movimientos</td></tr>'}
        ${filaECP('SALDO AL FINAL DEL AÑO', ecp.final, 'grand')}
      </tbody></table></div>`;
  }

  const SECCIONES = {
    apertura: 'Liquidación de saldos del año anterior',
    eventos: 'Consecuencias de decisiones anteriores',
    decision: 'Tu decisión',
    operacion: 'Operación del año (según políticas vigentes)',
    cierre: 'Impuesto a la renta y cierre',
    postcierre: 'Distribución de utilidades (tu decisión)'
  };

  function libroDiario(asientos) {
    let html = '';
    let actual = null;
    for (const a of asientos) {
      if (a.seccion !== actual) {
        actual = a.seccion;
        html += `<tr class="section ${actual === 'decision' || actual === 'postcierre' ? 'hl' : ''}"><td colspan="4">${SECCIONES[actual] || actual}</td></tr>`;
      }
      const hl = a.seccion === 'decision' || a.seccion === 'postcierre' ? ' hl-row' : '';
      html += `<tr class="glosa${hl}"><td>${a.n}</td><td colspan="3"><i>${esc(a.glosa)}</i></td></tr>`;
      for (const l of a.lineas) {
        const c = CUENTAS[l.c];
        html += `<tr class="${hl}"><td></td><td class="${l.h ? 'indent2' : 'indent'}">${c.cod} ${esc(c.nombre.replace('(−) ', ''))}</td>
          <td class="num">${l.d ? fmt(l.d) : ''}</td><td class="num">${l.h ? fmt(l.h) : ''}</td></tr>`;
      }
    }
    const td = asientos.reduce((s, a) => s + a.lineas.reduce((x, l) => x + l.d, 0), 0);
    const th = asientos.reduce((s, a) => s + a.lineas.reduce((x, l) => x + l.h, 0), 0);
    return `<div class="table-wrap"><table class="fs diario">
      <thead><tr><th>N°</th><th>Cuenta (PCGE)</th><th class="num">Debe</th><th class="num">Haber</th></tr></thead>
      <tbody>${html}
        <tr class="grand"><td></td><td>Sumas iguales</td><td class="num">${fmt(td)}</td><td class="num">${fmt(th)}</td></tr>
      </tbody></table></div>`;
  }

  // cols: [{ titulo, ind }]. El semáforo corresponde a la última columna.
  function tablaIndicadores(cols) {
    const base = cols[cols.length - 1].ind;
    let grupo = null;
    let html = '';
    for (const i of base) {
      if (i.grupo !== grupo) {
        grupo = i.grupo;
        html += `<tr class="section"><td colspan="${cols.length + 2}">${grupo}</td></tr>`;
      }
      html += `<tr>
        <td class="indent">${dot(i.estado)} <b>${i.nombre}</b><br><small class="muted">${i.formula}${i.nota ? ` · <span class="warn-text">${i.nota}</span>` : ''}</small></td>
        ${cols.map(c => {
          const x = c.ind.find(z => z.id === i.id);
          return `<td class="num">${x ? fmtInd(x) : '—'}</td>`;
        }).join('')}
      </tr>`;
    }
    return `<div class="table-wrap"><table class="fs"><thead><tr><th>Indicador</th>${cols.map(c => `<th class="num">${esc(c.titulo)}</th>`).join('')}</tr></thead><tbody>${html}</tbody></table></div>`;
  }

  function comparador(caso, sims, base) {
    const ind = (s, id) => s.ind.find(i => i.id === id);
    const filas = [{ titulo: 'Sin decisión (referencia)', s: base, letra: '—' }]
      .concat(sims.map((s, i) => ({ titulo: caso.opciones[i].titulo, s, letra: 'ABCD'[i] })));
    return `<div class="table-wrap"><table class="fs compare">
      <thead><tr><th>Opción</th><th class="num">Utilidad neta</th><th class="num">Efectivo final</th><th class="num">Flujo de operación</th><th class="num">Liquidez cte.</th><th class="num">Endeudamiento</th><th class="num">ROE</th></tr></thead>
      <tbody>${filas.map(f => `<tr${f.letra === '—' ? ' class="muted-row"' : ''}>
        <td><b>${f.letra}</b> · ${esc(f.titulo)}${f.s.sobregiro ? ' <span class="pill bad">sobregiro</span>' : ''}</td>
        <td class="num ${cls(f.s.er.utilidadNeta)}">${fmt(f.s.er.utilidadNeta)}</td>
        <td class="num">${fmt(f.s.fin.caja)}</td>
        <td class="num ${cls(f.s.efe.operacion.total)}">${fmt(f.s.efe.operacion.total)}</td>
        <td class="num">${dot(ind(f.s, 'liquidez').estado)} ${fmtInd(ind(f.s, 'liquidez'))}</td>
        <td class="num">${dot(ind(f.s, 'endeudamiento').estado)} ${fmtInd(ind(f.s, 'endeudamiento'))}</td>
        <td class="num">${dot(ind(f.s, 'roe').estado)} ${fmtInd(ind(f.s, 'roe'))}</td>
      </tr>`).join('')}</tbody></table></div>`;
  }

  return { fmt, fmtVar, fmtInd, cls, esc, dot, tablaESF, tablaER, tablaEFE, tablaECP, libroDiario, tablaIndicadores, comparador };
})();
