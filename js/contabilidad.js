// Motor contable de partida doble.
// Cada decisión y cada operación del año se registran como asientos (debe = haber).
// Los 4 estados financieros y los indicadores se calculan a partir de esos asientos,
// por eso siempre cuadran. Cada periodo representa un año. Montos en soles (S/), sin IGV.

const PARAMS = {
  ventasBase: 160000,    // ventas anuales de mercaderías con política de crédito a 30 días
  costoPct: 0.60,        // costo de ventas sobre el precio de venta
  personal: 30000,       // gastos de personal anuales
  servicios: 9000,       // servicios de terceros anuales
  tasaIR: 0.295,         // impuesto a la renta
  tasaLP: 0.12,          // préstamo bancario de largo plazo
  tasaLeasing: 0.10,     // arrendamiento financiero
  tasaCP: 0.15,          // pagaré de corto plazo
  tasaSobregiro: 0.20,   // sobregiro bancario
  amortizacion: 0.20,    // porción anual que se amortiza de préstamos y leasing
  estimacionPct: 0.03,   // estimación de cobranza dudosa sobre cuentas por cobrar al cierre
  factoringPct: 0.025,   // costo del factoring sobre las ventas al crédito
  diasInventario: 90     // stock objetivo: 90 días del costo de ventas anual
};

const CUENTAS = {
  caja:          { cod: '10', nombre: 'Efectivo y equivalentes de efectivo', grupo: 'AC', nat: 'D' },
  cxc:           { cod: '12', nombre: 'Cuentas por cobrar comerciales', grupo: 'AC', nat: 'D' },
  estimacion:    { cod: '19', nombre: '(−) Estimación de cobranza dudosa', grupo: 'AC', nat: 'H', contra: true },
  anticipados:   { cod: '18', nombre: 'Servicios pagados por anticipado', grupo: 'AC', nat: 'D' },
  mercaderias:   { cod: '20', nombre: 'Mercaderías', grupo: 'AC', nat: 'D' },
  derechoUso:    { cod: '32', nombre: 'Activos por derecho de uso (leasing)', grupo: 'ANC', nat: 'D' },
  ime:           { cod: '33', nombre: 'Inmuebles, maquinaria y equipo', grupo: 'ANC', nat: 'D' },
  intangibles:   { cod: '34', nombre: 'Intangibles', grupo: 'ANC', nat: 'D' },
  depAcum:       { cod: '39', nombre: '(−) Depreciación y amortización acumulada', grupo: 'ANC', nat: 'H', contra: true },
  tributos:      { cod: '40', nombre: 'Tributos por pagar (impuesto a la renta)', grupo: 'PC', nat: 'H' },
  cxp:           { cod: '42', nombre: 'Cuentas por pagar comerciales', grupo: 'PC', nat: 'H' },
  obligCP:       { cod: '45', nombre: 'Obligaciones financieras de corto plazo', grupo: 'PC', nat: 'H' },
  sobregiro:     { cod: '45', nombre: 'Sobregiro bancario', grupo: 'PC', nat: 'H' },
  parteCorriente:{ cod: '45', nombre: 'Parte corriente de deudas de largo plazo', grupo: 'PC', nat: 'H', presentacion: true },
  obligLP:       { cod: '45', nombre: 'Préstamos bancarios de largo plazo', grupo: 'PNC', nat: 'H' },
  arrendamiento: { cod: '45', nombre: 'Pasivo por arrendamiento financiero', grupo: 'PNC', nat: 'H' },
  capital:       { cod: '50', nombre: 'Capital', grupo: 'PAT', nat: 'H' },
  reservas:      { cod: '58', nombre: 'Reserva legal', grupo: 'PAT', nat: 'H' },
  resultados:    { cod: '59', nombre: 'Resultados acumulados', grupo: 'PAT', nat: 'H' },
  ventas:        { cod: '70', nombre: 'Ventas', grupo: 'ING', nat: 'H' },
  costoVentas:   { cod: '69', nombre: 'Costo de ventas', grupo: 'GAS', nat: 'D' },
  personal:      { cod: '62', nombre: 'Gastos de personal', grupo: 'GAS', nat: 'D' },
  servicios:     { cod: '63', nombre: 'Servicios prestados por terceros', grupo: 'GAS', nat: 'D' },
  otrosGastos:   { cod: '65', nombre: 'Otros gastos de gestión', grupo: 'GAS', nat: 'D' },
  depreciacion:  { cod: '68', nombre: 'Depreciación, amortización y estimaciones', grupo: 'GAS', nat: 'D' },
  financieros:   { cod: '67', nombre: 'Gastos financieros', grupo: 'GAS', nat: 'D' },
  impuesto:      { cod: '88', nombre: 'Impuesto a la renta', grupo: 'GAS', nat: 'D' }
};

const ESF_ESTRUCTURA = [
  { titulo: 'Activo corriente', cuentas: ['caja', 'cxc', 'estimacion', 'anticipados', 'mercaderias'], total: 'AC', etiqueta: 'Total activo corriente' },
  { titulo: 'Activo no corriente', cuentas: ['ime', 'derechoUso', 'intangibles', 'depAcum'], total: 'ANC', etiqueta: 'Total activo no corriente' },
  { granTotal: 'A', etiqueta: 'TOTAL ACTIVO' },
  { titulo: 'Pasivo corriente', cuentas: ['sobregiro', 'obligCP', 'parteCorriente', 'tributos', 'cxp'], total: 'PC', etiqueta: 'Total pasivo corriente' },
  { titulo: 'Pasivo no corriente', cuentas: ['obligLP', 'arrendamiento'], total: 'PNC', etiqueta: 'Total pasivo no corriente' },
  { granTotal: 'P', etiqueta: 'TOTAL PASIVO' },
  { titulo: 'Patrimonio', cuentas: ['capital', 'reservas', 'resultados'], total: 'PAT', etiqueta: 'Total patrimonio' },
  { granTotal: 'PPAT', etiqueta: 'TOTAL PASIVO Y PATRIMONIO' }
];

const POL_VENTAS = {
  contado:   { nombre: 'Al contado', vol: 0.95, dias: 0 },
  credito30: { nombre: 'Crédito a 30 días', vol: 1.00, dias: 30 },
  credito60: { nombre: 'Crédito a 60 días', vol: 1.10, dias: 60 },
  factoring: { nombre: 'Crédito a 60 días con factoring', vol: 1.10, dias: 60, factoring: true }
};

const POL_COMPRAS = {
  contado:   { nombre: 'Al contado con 3% de descuento', desc: 0.03, dias: 0 },
  credito30: { nombre: 'Crédito a 30 días', desc: 0, dias: 30 },
  credito60: { nombre: 'Crédito a 60 días (recargo de 2%)', desc: -0.02, dias: 60 }
};

const SALDOS_VACIOS = Object.fromEntries(Object.keys(CUENTAS).filter(k => !CUENTAS[k].presentacion).map(k => [k, 0]));

const EMPRESA_INICIAL = {
  saldos: {
    ...SALDOS_VACIOS,
    caja: 20000, cxc: 13000, mercaderias: 24000,
    ime: 100000, depAcum: 20000,
    cxp: 8000, obligLP: 40000,
    capital: 60000, resultados: 29000
  },
  activos: [{ nombre: 'Maquinaria y equipo', cuenta: 'ime', costo: 100000, tasa: 0.10, acum: 20000 }],
  politicas: { ventas: 'credito30', compras: 'credito30' },
  recurrentes: [],
  programados: [],
  intCP: 0
};

const ECP_FILAS = [
  { id: 'aporte', nombre: 'Aportes de capital' },
  { id: 'capitalizacion', nombre: 'Capitalización de utilidades' },
  { id: 'reserva', nombre: 'Constitución de reserva legal' },
  { id: 'dividendos', nombre: 'Dividendos distribuidos' },
  { id: 'resultado', nombre: 'Resultado del ejercicio' }
];

const clonar = o => JSON.parse(JSON.stringify(o));
const sumar = (arr, k) => arr.reduce((a, x) => a + (x[k] || 0), 0);

// Para presentar el balance, la porción de la deuda de largo plazo que vence el próximo año
// (20%) se muestra como pasivo corriente.
function saldosPresentacion(s) {
  const cpLP = Math.round(s.obligLP * PARAMS.amortizacion);
  const cpArr = Math.round(s.arrendamiento * PARAMS.amortizacion);
  return { ...s, parteCorriente: cpLP + cpArr, obligLP: s.obligLP - cpLP, arrendamiento: s.arrendamiento - cpArr };
}

function totales(saldos) {
  const s = saldosPresentacion(saldos);
  const AC = s.caja + s.cxc - s.estimacion + s.anticipados + s.mercaderias;
  const ANC = s.ime + s.derechoUso + s.intangibles - s.depAcum;
  const PC = s.sobregiro + s.obligCP + s.parteCorriente + s.tributos + s.cxp;
  const PNC = s.obligLP + s.arrendamiento;
  const PAT = s.capital + s.reservas + s.resultados;
  return { AC, ANC, A: AC + ANC, PC, PNC, P: PC + PNC, PAT, PPAT: PC + PNC + PAT };
}

function crearLibro(saldos) {
  const s = { ...saldos };
  const asientos = [];
  function asiento(glosa, lineas, extra = {}) {
    const ls = lineas
      .map(l => ({ ...l, d: Math.round(l.d || 0), h: Math.round(l.h || 0) }))
      .filter(l => l.d || l.h);
    if (!ls.length) return;
    const td = sumar(ls, 'd'), th = sumar(ls, 'h');
    if (td !== th) throw new Error(`Asiento descuadrado "${glosa}": debe ${td} ≠ haber ${th}`);
    for (const l of ls) s[l.c] += CUENTAS[l.c].nat === 'D' ? l.d - l.h : l.h - l.d;
    asientos.push({ n: asientos.length + 1, glosa, lineas: ls, ...extra });
  }
  return { s, asientos, asiento };
}

function calcularER(asientos) {
  const m = {};
  for (const a of asientos) {
    if (a.esCierre) continue;
    for (const l of a.lineas) {
      const c = CUENTAS[l.c];
      if (c.grupo !== 'ING' && c.grupo !== 'GAS') continue;
      m[l.c] = (m[l.c] || 0) + (c.nat === 'D' ? l.d - l.h : l.h - l.d);
    }
  }
  const g = k => m[k] || 0;
  const ventas = g('ventas');
  const costoVentas = g('costoVentas');
  const utilidadBruta = ventas - costoVentas;
  const gastosOperativos = g('personal') + g('servicios') + g('otrosGastos') + g('depreciacion');
  const utilidadOperativa = utilidadBruta - gastosOperativos;
  const financieros = g('financieros');
  const uai = utilidadOperativa - financieros;
  const impuesto = g('impuesto');
  const compras = asientos.reduce((a, x) => a + sumar(x.lineas.filter(l => l.c === 'mercaderias'), 'd'), 0);
  return {
    ventas, costoVentas, utilidadBruta,
    personal: g('personal'), servicios: g('servicios'), otrosGastos: g('otrosGastos'), depreciacion: g('depreciacion'),
    gastosOperativos, utilidadOperativa, financieros, uai, impuesto,
    utilidadNeta: uai - impuesto, compras
  };
}

function calcularEFE(asientos, cajaInicial) {
  const cats = { operacion: {}, inversion: {}, financiamiento: {} };
  for (const a of asientos) {
    for (const l of a.lineas) {
      if (l.c !== 'caja') continue;
      const cat = cats[l.fl || 'operacion'];
      const con = l.con || a.glosa;
      cat[con] = (cat[con] || 0) + l.d - l.h;
    }
  }
  const res = {};
  let neto = 0;
  for (const k of Object.keys(cats)) {
    const items = Object.entries(cats[k]).map(([con, monto]) => ({ con, monto }));
    const total = sumar(items, 'monto');
    res[k] = { items, total };
    neto += total;
  }
  return { ...res, neto, inicial: cajaInicial, final: cajaInicial + neto };
}

function calcularECP(asientos, ini, fin) {
  const cols = ['capital', 'reservas', 'resultados'];
  const filas = {};
  for (const f of ECP_FILAS) filas[f.id] = { capital: 0, reservas: 0, resultados: 0 };
  for (const a of asientos) {
    for (const l of a.lineas) {
      if (!cols.includes(l.c)) continue;
      const tipo = l.ecp || a.ecp || 'aporte';
      filas[tipo][l.c] += l.h - l.d;
    }
  }
  return {
    inicial: { capital: ini.capital, reservas: ini.reservas, resultados: ini.resultados },
    filas,
    final: { capital: fin.capital, reservas: fin.reservas, resultados: fin.resultados }
  };
}

function semaforo(valor, bueno, regular, mayorEsMejor = true) {
  if (valor == null || !Number.isFinite(valor)) return valor === Infinity ? 'good' : 'na';
  if (mayorEsMejor) return valor >= bueno ? 'good' : valor >= regular ? 'warn' : 'bad';
  return valor <= bueno ? 'good' : valor <= regular ? 'warn' : 'bad';
}

function indicadores(s, er) {
  const t = totales(s);
  const div = (a, b) => (b ? a / b : (a > 0 ? Infinity : null));
  const liq = div(t.AC, t.PC);
  const acida = div(t.AC - s.mercaderias - s.anticipados, t.PC);
  const endeud = div(t.P, t.A);
  const lista = [
    { id: 'liquidez', grupo: 'Liquidez', nombre: 'Liquidez corriente', formula: 'Activo corriente ÷ Pasivo corriente', valor: liq, fmt: 'ratio', estado: liq != null && liq > 3 ? 'warn' : semaforo(liq, 1.5, 1), nota: liq > 3 ? 'Exceso de liquidez: recursos ociosos' : '' },
    { id: 'acida', grupo: 'Liquidez', nombre: 'Prueba ácida', formula: '(Activo corriente − Inventarios − Anticipados) ÷ Pasivo corriente', valor: acida, fmt: 'ratio', estado: semaforo(acida, 1, 0.7) },
    { id: 'ctrabajo', grupo: 'Liquidez', nombre: 'Capital de trabajo', formula: 'Activo corriente − Pasivo corriente', valor: t.AC - t.PC, fmt: 'soles', estado: t.AC - t.PC > 0 ? 'good' : 'bad' },
    { id: 'endeudamiento', grupo: 'Solvencia', nombre: 'Endeudamiento', formula: 'Pasivo total ÷ Activo total', valor: endeud, fmt: 'pct', estado: semaforo(endeud, 0.5, 0.7, false) },
    { id: 'apalancamiento', grupo: 'Solvencia', nombre: 'Deuda / Patrimonio', formula: 'Pasivo total ÷ Patrimonio', valor: div(t.P, t.PAT), fmt: 'ratio', estado: semaforo(div(t.P, t.PAT), 1, 2, false) }
  ];
  if (er) {
    const cobertura = er.financieros ? er.utilidadOperativa / er.financieros : null;
    lista.push(
      { id: 'cobertura', grupo: 'Solvencia', nombre: 'Cobertura de intereses', formula: 'Utilidad operativa ÷ Gastos financieros', valor: cobertura, fmt: 'veces', estado: cobertura == null ? 'good' : semaforo(cobertura, 3, 1.5) },
      { id: 'cobro', grupo: 'Gestión', nombre: 'Periodo promedio de cobro', formula: 'Cuentas por cobrar ÷ Ventas × 360', valor: er.ventas ? s.cxc / er.ventas * 360 : null, fmt: 'dias', estado: semaforo(er.ventas ? s.cxc / er.ventas * 360 : 0, 45, 90, false) },
      { id: 'pago', grupo: 'Gestión', nombre: 'Periodo promedio de pago', formula: 'Cuentas por pagar ÷ Compras × 360', valor: er.compras ? s.cxp / er.compras * 360 : null, fmt: 'dias', estado: 'na' },
      { id: 'margen', grupo: 'Rentabilidad', nombre: 'Margen neto', formula: 'Utilidad neta ÷ Ventas', valor: er.ventas ? er.utilidadNeta / er.ventas : null, fmt: 'pct', estado: semaforo(er.ventas ? er.utilidadNeta / er.ventas : null, 0.06, 0.02) },
      { id: 'roa', grupo: 'Rentabilidad', nombre: 'ROA', formula: 'Utilidad neta ÷ Activo total', valor: div(er.utilidadNeta, t.A), fmt: 'pct', estado: semaforo(div(er.utilidadNeta, t.A), 0.05, 0.02) },
      { id: 'roe', grupo: 'Rentabilidad', nombre: 'ROE', formula: 'Utilidad neta ÷ Patrimonio', valor: div(er.utilidadNeta, t.PAT), fmt: 'pct', estado: semaforo(div(er.utilidadNeta, t.PAT), 0.10, 0.05) }
    );
  }
  return lista;
}

// Simula un año completo de la empresa aplicando una opción del caso.
// opIdx = null simula el año "sin decisión", que sirve de referencia para medir el impacto.
function simular(empresa, caso, opIdx, periodo = 1) {
  return { ...simularOps(empresa, opIdx == null ? [] : [caso.opciones[opIdx]], periodo), opcion: opIdx };
}

// Simula un año completo aplicando varias decisiones (en el orden en que se tomaron).
// Cada empresa puede traer sus propios parámetros de operación en empresa.params.
function simularOps(empresa, ops, periodo = 1) {
  const P = { ...PARAMS, ...(empresa.params || {}) };
  const emp = clonar(empresa);
  const ini = { ...emp.saldos };
  const L = crearLibro(emp.saldos);
  const s = L.s;
  let seccion = 'apertura';
  const A = (glosa, lineas, extra = {}) => L.asiento(glosa, lineas, { seccion, ...extra });
  const ctx = {
    s, P, emp, periodo,
    asiento: A,
    agregarActivo: a => emp.activos.push({ acum: 0, ...a })
  };

  for (const op of ops) {
    if (op.politicas) Object.assign(emp.politicas, op.politicas);
    if (op.recurrente) emp.recurrentes.push({ ...op.recurrente, origen: op.titulo, periodo });
    if (op.programado) emp.programados.push({ ...op.programado, periodo: periodo + op.programado.en, origen: op.titulo });
  }

  // 1. Liquidación de saldos del año anterior
  if (s.cxc > 0) {
    const castigo = Math.min(s.estimacion, s.cxc);
    A(castigo ? 'Cobranza de cuentas por cobrar del año anterior y castigo de incobrables' : 'Cobranza de cuentas por cobrar del año anterior', [
      { c: 'caja', d: s.cxc - castigo, fl: 'operacion', con: 'Cobranza a clientes' },
      { c: 'estimacion', d: castigo },
      { c: 'cxc', h: s.cxc }
    ]);
  }
  if (s.cxp > 0) A('Pago a proveedores del año anterior', [
    { c: 'cxp', d: s.cxp }, { c: 'caja', h: s.cxp, fl: 'operacion', con: 'Pago a proveedores' }]);
  if (s.tributos > 0) A('Pago del impuesto a la renta del año anterior', [
    { c: 'tributos', d: s.tributos }, { c: 'caja', h: s.tributos, fl: 'operacion', con: 'Pago de impuesto a la renta' }]);
  if (s.obligCP > 0) {
    const interes = Math.min(emp.intCP, s.obligCP);
    A('Cancelación del pagaré bancario de corto plazo', [
      { c: 'obligCP', d: s.obligCP },
      { c: 'caja', h: s.obligCP - interes, fl: 'financiamiento', con: 'Pago de préstamos de corto plazo' },
      { c: 'caja', h: interes, fl: 'financiamiento', con: 'Intereses pagados' }]);
    emp.intCP = 0;
  }
  if (s.sobregiro > 0) {
    const interes = Math.round(s.sobregiro * P.tasaSobregiro);
    A('Cancelación del sobregiro bancario con intereses', [
      { c: 'sobregiro', d: s.sobregiro }, { c: 'financieros', d: interes },
      { c: 'caja', h: s.sobregiro, fl: 'financiamiento', con: 'Pago de sobregiro bancario' },
      { c: 'caja', h: interes, fl: 'financiamiento', con: 'Intereses pagados' }]);
  }

  // 2. Eventos que vienen de decisiones anteriores
  seccion = 'eventos';
  const eventos = emp.programados.filter(p => p.periodo === periodo);
  emp.programados = emp.programados.filter(p => p.periodo > periodo);
  for (const ev of eventos) {
    if (ev.tipo === 'devengo') A(ev.texto, [{ c: 'servicios', d: ev.monto }, { c: 'anticipados', h: ev.monto }]);
    else A(ev.texto, [{ c: 'otrosGastos', d: ev.monto }, { c: 'caja', h: ev.monto, fl: 'operacion', con: 'Pago por contingencias' }]);
  }

  // 3. Asientos propios de la decisión
  seccion = 'decision';
  for (const op of ops) if (op.asientos) op.asientos(ctx);

  // 4. Operación del año con las políticas vigentes
  seccion = 'operacion';
  const pv = POL_VENTAS[emp.politicas.ventas];
  const pc = POL_COMPRAS[emp.politicas.compras];
  const rec = emp.recurrentes;
  const ventasMerc = Math.round(P.ventasBase * pv.vol + sumar(rec, 'ventasMerc'));
  const ventas = ventasMerc + Math.round(sumar(rec, 'ventas'));

  if (pv.dias === 0) {
    A('Ventas del año al contado', [{ c: 'caja', d: ventas, fl: 'operacion', con: 'Cobranza a clientes' }, { c: 'ventas', h: ventas }]);
  } else {
    A(`Ventas del año al crédito a ${pv.dias} días`, [{ c: 'cxc', d: ventas }, { c: 'ventas', h: ventas }]);
    if (pv.factoring) {
      const costoF = Math.round(ventas * P.factoringPct);
      A('Cesión de facturas al banco (factoring, costo 2.5%)', [
        { c: 'caja', d: ventas - costoF, fl: 'operacion', con: 'Cobranza a clientes (factoring)' },
        { c: 'financieros', d: costoF }, { c: 'cxc', h: ventas }]);
    } else {
      const cobro = ventas - Math.round(ventas * pv.dias / 360);
      A('Cobranza de las ventas del año', [{ c: 'caja', d: cobro, fl: 'operacion', con: 'Cobranza a clientes' }, { c: 'cxc', h: cobro }]);
    }
  }

  const costo = Math.round(ventasMerc * P.costoPct * (1 - pc.desc));
  const stockObjetivo = Math.round(costo * P.diasInventario / 360);
  const compras = Math.max(0, costo + stockObjetivo - s.mercaderias);
  if (pc.dias === 0) {
    A('Compra de mercaderías al contado con 3% de descuento', [
      { c: 'mercaderias', d: compras }, { c: 'caja', h: compras, fl: 'operacion', con: 'Pago a proveedores' }]);
  } else {
    A(`Compra de mercaderías al crédito a ${pc.dias} días${pc.desc < 0 ? ' (recargo de 2%)' : ''}`, [{ c: 'mercaderias', d: compras }, { c: 'cxp', h: compras }]);
    const pago = compras - Math.round(compras * pc.dias / 360);
    A('Pago a proveedores de las compras del año', [{ c: 'cxp', d: pago }, { c: 'caja', h: pago, fl: 'operacion', con: 'Pago a proveedores' }]);
  }
  A('Costo de las mercaderías vendidas', [{ c: 'costoVentas', d: costo }, { c: 'mercaderias', h: costo }]);

  const personal = Math.max(0, P.personal + sumar(rec, 'personal'));
  const servicios = Math.max(0, P.servicios + sumar(rec, 'servicios'));
  A('Pago de remuneraciones del año', [{ c: 'personal', d: personal }, { c: 'caja', h: personal, fl: 'operacion', con: 'Pago de remuneraciones' }]);
  A('Pago de servicios de terceros', [{ c: 'servicios', d: servicios }, { c: 'caja', h: servicios, fl: 'operacion', con: 'Pago de servicios' }]);

  let dep = 0;
  for (const a of emp.activos) {
    const d = Math.min(Math.round(a.costo * a.tasa), a.costo - a.acum);
    if (d > 0) { a.acum += d; dep += d; }
  }
  A('Depreciación y amortización del año', [{ c: 'depreciacion', d: dep }, { c: 'depAcum', h: dep }]);

  if (s.cxc > 0) {
    const est = Math.round(s.cxc * P.estimacionPct);
    A('Estimación de cobranza dudosa (3% de las cuentas por cobrar)', [{ c: 'depreciacion', d: est }, { c: 'estimacion', h: est }]);
  }

  if (s.obligLP > 0) {
    const int = Math.round(s.obligLP * P.tasaLP), am = Math.round(s.obligLP * P.amortizacion);
    A('Pago de intereses y amortización anual del préstamo bancario', [
      { c: 'financieros', d: int }, { c: 'obligLP', d: am },
      { c: 'caja', h: int, fl: 'financiamiento', con: 'Intereses pagados' },
      { c: 'caja', h: am, fl: 'financiamiento', con: 'Amortización de préstamos bancarios' }]);
  }
  if (s.arrendamiento > 0) {
    const int = Math.round(s.arrendamiento * P.tasaLeasing), am = Math.round(s.arrendamiento * P.amortizacion);
    A('Pago de cuotas del leasing: intereses y capital', [
      { c: 'financieros', d: int }, { c: 'arrendamiento', d: am },
      { c: 'caja', h: int, fl: 'financiamiento', con: 'Intereses pagados' },
      { c: 'caja', h: am, fl: 'financiamiento', con: 'Pago de cuotas de arrendamiento (capital)' }]);
  }

  // 5. Impuesto a la renta y cierre
  seccion = 'cierre';
  const erPrev = calcularER(L.asientos);
  if (erPrev.uai > 0) {
    const ir = Math.round(erPrev.uai * P.tasaIR);
    A('Impuesto a la renta del año (29.5%)', [{ c: 'impuesto', d: ir }, { c: 'tributos', h: ir }]);
  }
  const er = calcularER(L.asientos);
  const lineasCierre = [];
  for (const [k, c] of Object.entries(CUENTAS)) {
    if (c.grupo !== 'ING' && c.grupo !== 'GAS' || !s[k]) continue;
    lineasCierre.push(c.nat === 'H' ? { c: k, d: s[k] } : { c: k, h: s[k] });
  }
  lineasCierre.push(er.utilidadNeta >= 0
    ? { c: 'resultados', h: er.utilidadNeta, ecp: 'resultado' }
    : { c: 'resultados', d: -er.utilidadNeta, ecp: 'resultado' });
  A('Asiento de cierre: traslado del resultado del ejercicio', lineasCierre, { esCierre: true });

  // 6. Decisiones posteriores al cierre (distribución de utilidades)
  seccion = 'postcierre';
  ctx.utilidadNeta = er.utilidadNeta;
  for (const op of ops) if (op.postCierre) op.postCierre(ctx);

  // 7. Si la caja queda negativa, el banco otorga un sobregiro automático
  let sobregiro = 0;
  if (s.caja < 0) {
    sobregiro = -s.caja;
    seccion = 'cierre';
    A('Sobregiro bancario para cubrir el déficit de caja', [
      { c: 'caja', d: sobregiro, fl: 'financiamiento', con: 'Sobregiro bancario recibido' }, { c: 'sobregiro', h: sobregiro }]);
  }

  const t = totales(s);
  if (Math.abs(t.A - t.PPAT) > 0.5) throw new Error(`El balance no cuadra: ${t.A} ≠ ${t.PPAT}`);

  emp.saldos = { ...s };
  return {
    periodo,
    ini, fin: { ...s },
    asientos: L.asientos,
    er,
    efe: calcularEFE(L.asientos, ini.caja),
    ecp: calcularECP(L.asientos, ini, s),
    indIni: indicadores(ini, null),
    ind: indicadores(s, er),
    eventos, sobregiro,
    politicas: { ...emp.politicas },
    empresa: emp
  };
}
