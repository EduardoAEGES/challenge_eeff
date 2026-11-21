/* =========================================================
   NIVEL 1 — Leer los estados financieros
   Enfocado en lo que se necesita para los casos de Starbucks y Zara.
   Tipos: teoria, choice, tf, fill, match, clasificar.
   Los «mini-casos» son choice con «escena»: una decisión y la pregunta
   «¿qué pasó con…?» (Aumentó / Disminuyó / No cambió), igual que en el reto.
   ========================================================= */
window.FC = window.FC || {};
FC.CONTENIDO = FC.CONTENIDO || {};

// Opciones del formato de análisis del reto
FC.ANALISIS = [{ text: 'Aumentó', icono: 'tendencia' }, { text: 'Disminuyó', icono: 'bajada' }, { text: 'No cambió', icono: 'igual' }];
const AUMENTO = 0, DISMINUYO = 1, NO_CAMBIO = 2;

FC.CONTENIDO.n1l1 = { ejercicios: [
  {
    type: 'teoria', titulo: 'Los cuatro estados financieros',
    intro: 'En el reto verás cómo cada decisión cambia los <b>estados financieros</b> de la empresa. Cada uno responde una pregunta distinta.',
    puntos: [
      { icono: 'banco', titulo: 'Estado de situación financiera', texto: 'Una <b>foto a una fecha</b>: lo que la empresa tiene (activos), lo que debe (pasivos) y lo que es de los dueños (patrimonio).' },
      { icono: 'recibo', titulo: 'Estado de resultados', texto: 'Ingresos y gastos de un <b>periodo</b>: ¿ganamos o perdimos?' },
      { icono: 'gota', titulo: 'Estado de flujos de efectivo', texto: 'De dónde vino y a dónde fue el <b>efectivo</b> durante el periodo.' },
      { icono: 'usuarios', titulo: 'Estado de cambios en el patrimonio', texto: 'Cómo cambió lo de los dueños: aportes, utilidad, <b>dividendos, reserva legal y capitalización</b>.' }
    ]
  },
  {
    type: 'choice', prompt: '¿Qué estado muestra la posición de la empresa en una fecha determinada?',
    options: [{ text: 'Estado de situación financiera', icono: 'banco' }, { text: 'Estado de resultados', icono: 'recibo' }, { text: 'Estado de flujos de efectivo', icono: 'gota' }],
    answer: 0, pista: 'Piensa en una “foto” de lo que se tiene y se debe en un día.',
    explain: 'El estado de situación financiera es una foto a una fecha; los demás cubren un periodo.'
  },
  {
    type: 'match', prompt: 'Une cada estado con lo que informa',
    pairs: [
      ['Situación financiera', 'Activos, pasivos y patrimonio'],
      ['Resultados', 'Ingresos, gastos y utilidad'],
      ['Flujos de efectivo', 'Entradas y salidas de efectivo'],
      ['Cambios en el patrimonio', 'Dividendos, reservas y capitalización']
    ],
    explain: 'En el reto podrás abrir los cuatro estados en cualquier momento con «Ver estados financieros».'
  },
  {
    type: 'choice', prompt: 'Al cierre del año los socios reparten dividendos. ¿Qué estado muestra ese reparto?',
    options: [{ text: 'Estado de cambios en el patrimonio' }, { text: 'Estado de resultados' }, { text: 'Solo las notas' }],
    answer: 0, pista: 'Los dividendos no son un gasto: son lo que se entrega a los dueños.',
    explain: 'Los dividendos, la reserva legal y la capitalización se ven en el estado de cambios en el patrimonio.'
  },
  {
    type: 'tf', statement: 'Una empresa puede tener utilidad en el estado de resultados y, aun así, quedarse sin efectivo.',
    answer: true, pista: '¿Qué pasa si vendes todo al crédito y aún no cobras?',
    explain: 'Sí. La venta se reconoce aunque el cobro llegue después. Por eso, en el reto, la utilidad y el efectivo pueden moverse en direcciones distintas.'
  },
  {
    type: 'choice',
    escena: { personaje: 'cafe', nombre: 'Rosa · gerente de una cafetería', texto: 'Vendimos S/ 10,000 de café a una empresa, al crédito a 60 días. Todavía no nos pagan.' },
    prompt: '¿Qué pasó con el efectivo de la cafetería hoy?',
    options: FC.ANALISIS, answer: NO_CAMBIO,
    pista: '¿Entró dinero a la caja?',
    explain: 'No entró efectivo: aumentaron las cuentas por cobrar. El efectivo recién aumentará cuando el cliente pague.'
  }
] };

FC.CONTENIDO.n1l2 = { ejercicios: [
  {
    type: 'teoria', titulo: 'La ecuación contable',
    intro: 'Todo lo que la empresa tiene se financia con deudas o con dinero de los dueños. Por eso siempre se cumple: <b>Activo = Pasivo + Patrimonio</b>.',
    puntos: [
      { icono: 'banco', titulo: 'Activo', texto: 'Lo que la empresa controla: efectivo, cuentas por cobrar, inventario, maquinaria.' },
      { icono: 'recibo', titulo: 'Pasivo', texto: 'Lo que debe a terceros: proveedores, préstamos bancarios, arrendamientos.' },
      { icono: 'usuarios', titulo: 'Patrimonio', texto: 'Lo de los dueños: capital aportado, reservas y utilidades acumuladas.' },
      { icono: 'reloj', titulo: 'Corriente o no corriente', texto: 'Si se cobra, se usa o se paga dentro de <b>12 meses</b> es corriente; si dura más, es no corriente (por ejemplo, una máquina o un préstamo a 5 años).' }
    ]
  },
  {
    type: 'clasificar', prompt: 'Clasifica cada partida',
    grupos: ['Activo', 'Pasivo', 'Patrimonio'],
    items: [
      { text: 'Inventario de café', grupo: 0 }, { text: 'Préstamo bancario', grupo: 1 }, { text: 'Capital social', grupo: 2 },
      { text: 'Cuentas por cobrar', grupo: 0 }, { text: 'Cuentas por pagar a proveedores', grupo: 1 }, { text: 'Resultados acumulados', grupo: 2 }
    ],
    pista: 'Activo = lo que tienes; pasivo = lo que debes a terceros; patrimonio = lo de los dueños.',
    explain: 'Lo que se tiene es activo, lo que se debe a terceros es pasivo y lo aportado o ganado por los dueños es patrimonio.'
  },
  {
    type: 'choice', prompt: 'Una empresa tiene activos por S/ 200,000 y pasivos por S/ 120,000. ¿Cuál es su patrimonio?',
    options: [{ text: 'S/ 80,000' }, { text: 'S/ 320,000' }, { text: 'S/ 120,000' }],
    answer: 0, pista: 'Patrimonio = Activo − Pasivo.', explain: 'S/ 200,000 − S/ 120,000 = S/ 80,000.'
  },
  {
    type: 'choice', prompt: 'La tienda compra una vitrina que usará durante 5 años. ¿Dónde se presenta?',
    options: [{ text: 'En el activo no corriente' }, { text: 'En el activo corriente' }, { text: 'Como gasto del año' }],
    answer: 0, pista: '¿Se usará más o menos de 12 meses?',
    explain: 'Se usará varios años: es activo no corriente y se deprecia cada año.'
  },
  {
    type: 'choice',
    escena: { personaje: 'edificio', nombre: 'Luis · gerente de una tienda', texto: 'Compramos una máquina de S/ 40,000 y la pagamos al contado.' },
    prompt: '¿Qué pasó con el activo total?',
    options: FC.ANALISIS, answer: NO_CAMBIO,
    pista: 'Sale efectivo, pero ¿entra algo a cambio?',
    explain: 'Sale S/ 40,000 de efectivo y entra una máquina por S/ 40,000: el activo cambia de forma, pero el total es el mismo.'
  },
  {
    type: 'choice',
    escena: { personaje: 'edificio', nombre: 'Luis · gerente de una tienda', texto: 'El banco nos prestó S/ 50,000 a 3 años y el dinero ya está en la cuenta.' },
    prompt: '¿Qué pasó con el pasivo total?',
    options: FC.ANALISIS, answer: AUMENTO,
    explain: 'Entra efectivo (sube el activo) y nace una deuda con el banco (sube el pasivo).'
  }
] };

FC.CONTENIDO.n1ex = { ejercicios: [
  {
    type: 'choice', prompt: '¿Qué estado informa los ingresos, los gastos y la utilidad del año?',
    options: [{ text: 'Estado de resultados' }, { text: 'Estado de situación financiera' }, { text: 'Estado de cambios en el patrimonio' }],
    answer: 0, explain: 'El estado de resultados resume el desempeño de un periodo.'
  },
  {
    type: 'fill', prompt: 'Completa la ecuación', sentence: 'Activo = Pasivo + ___',
    options: ['Patrimonio', 'Ingresos', 'Efectivo'], answer: 0,
    explain: 'Todo activo se financia con deuda (pasivo) o con recursos de los dueños (patrimonio).'
  },
  {
    type: 'choice', prompt: 'Activo S/ 150,000 y patrimonio S/ 90,000. ¿Cuánto es el pasivo?',
    options: [{ text: 'S/ 60,000' }, { text: 'S/ 240,000' }, { text: 'S/ 90,000' }],
    answer: 0, explain: 'Pasivo = Activo − Patrimonio = S/ 150,000 − S/ 90,000 = S/ 60,000.'
  },
  {
    type: 'tf', statement: 'Un préstamo bancario a 5 años es un pasivo no corriente.',
    answer: true, explain: 'Se pagará en más de 12 meses: es no corriente (la parte que vence en el año es corriente).'
  },
  {
    type: 'choice',
    escena: { personaje: 'cafe', nombre: 'Rosa · gerente de una cafetería', texto: 'Un cliente corporativo nos pagó hoy una factura de S/ 8,000 que nos debía.' },
    prompt: '¿Qué pasó con el activo total?',
    options: FC.ANALISIS, answer: NO_CAMBIO,
    explain: 'Sube el efectivo y bajan las cuentas por cobrar en el mismo monto: el activo total no cambia.'
  },
  {
    type: 'choice',
    escena: { personaje: 'usuarios', nombre: 'Socios de la empresa', texto: 'Aportamos S/ 30,000 en efectivo para que la empresa crezca.' },
    prompt: '¿Qué pasó con el patrimonio?',
    options: FC.ANALISIS, answer: AUMENTO,
    explain: 'Entra efectivo (activo) y aumenta el capital social (patrimonio). No hay deuda nueva.'
  }
] };
