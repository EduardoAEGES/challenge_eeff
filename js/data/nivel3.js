/* =========================================================
   NIVEL 3 — Flujos de efectivo (NIC 7) y cambios en el patrimonio
   ========================================================= */
window.FC = window.FC || {};
FC.CONTENIDO = FC.CONTENIDO || {};

FC.CONTENIDO.n3l1 = { ejercicios: [
  {
    type: 'teoria', titulo: 'El estado de flujos de efectivo',
    intro: 'La <b>NIC 7</b> clasifica las entradas y salidas de efectivo y equivalentes en tres actividades.',
    puntos: [
      { icono: '⚙️', titulo: 'Operación', texto: 'Las actividades principales: cobros a clientes, pagos a proveedores, sueldos e impuestos.' },
      { icono: '🏗️', titulo: 'Inversión', texto: 'Compra y venta de activos de largo plazo, como maquinaria, e inversiones.' },
      { icono: '🏦', titulo: 'Financiación', texto: 'Cambios en el capital y en los préstamos: aportes, préstamos recibidos y pagados, dividendos.' },
      { icono: '💵', titulo: 'Equivalentes de efectivo', texto: 'Inversiones de corto plazo, muy líquidas y con riesgo poco significativo de cambio de valor, normalmente con vencimiento de hasta tres meses.' }
    ]
  },
  {
    type: 'clasificar', prompt: '¿En qué actividad va cada movimiento de efectivo?',
    grupos: ['Operación', 'Inversión', 'Financiación'],
    items: [
      { text: 'Cobro a clientes', grupo: 0 }, { text: 'Compra de un camión', grupo: 1 }, { text: 'Préstamo bancario recibido', grupo: 2 },
      { text: 'Pago de sueldos', grupo: 0 }, { text: 'Aporte de los socios', grupo: 2 }
    ],
    pista: 'Inversión = activos de largo plazo. Financiación = dueños y prestamistas.',
    explain: 'El negocio diario es operación; los activos de largo plazo, inversión; dueños y bancos, financiación.'
  },
  {
    type: 'tf', statement: 'La depreciación es una salida de efectivo del periodo.',
    answer: false, pista: '¿Alguien recibe dinero cuando registras la depreciación?',
    explain: 'Es un gasto que no usa efectivo: el dinero salió cuando se compró el activo.'
  },
  {
    type: 'choice', prompt: 'Vender una máquina usada al contado es un flujo de…',
    options: [{ text: 'Inversión' }, { text: 'Operación' }, { text: 'Financiación' }],
    answer: 0, explain: 'Comprar o vender activos de largo plazo son actividades de inversión.'
  },
  {
    type: 'choice', prompt: 'Una empresa toma un leasing por una máquina, sin pagar nada al inicio. ¿Qué muestra el flujo de efectivo en ese momento?',
    options: [
      { text: 'Nada: es una transacción que no usa efectivo y se revela en las notas' },
      { text: 'Una salida de inversión por el valor de la máquina' },
      { text: 'Una entrada de financiación' }
    ],
    answer: 0, pista: 'Si no se mueve efectivo, no hay flujo.',
    explain: 'Las transacciones de inversión o financiación que no usan efectivo se excluyen del estado y se revelan.'
  },
  {
    type: 'fill', prompt: 'Completa la frase', sentence: 'Pagar la cuota de capital de un préstamo es un flujo de ___.',
    options: ['financiación', 'operación', 'inversión'], answer: 0,
    explain: 'Devolver el capital prestado es una actividad de financiación.'
  },
  {
    type: 'choice',
    escena: { personaje: '👩🏽‍💼', nombre: 'Laura', texto: 'Este año vendimos más que nunca, pero el flujo de operación salió negativo.' },
    prompt: '¿Cuál es la explicación más probable?',
    options: [
      { text: 'Vendieron mucho al crédito y aún no cobran' },
      { text: 'Compraron un local al contado' },
      { text: 'Pagaron dividendos' }
    ],
    answer: 0, explain: 'Comprar un local es inversión y los dividendos son financiación; las ventas no cobradas sí afectan la operación.'
  }
] };

FC.CONTENIDO.n3l2 = { ejercicios: [
  {
    type: 'teoria', titulo: 'Intereses, dividendos y métodos',
    intro: 'Con la NIIF 18, la NIC 7 se modificó para que todas las empresas clasifiquen igual los intereses y dividendos.',
    puntos: [
      { icono: '💸', titulo: 'Intereses pagados', texto: 'En empresas no financieras: actividades de <b>financiación</b>.' },
      { icono: '🎁', titulo: 'Dividendos pagados', texto: 'Actividades de <b>financiación</b>: es el retorno a los dueños.' },
      { icono: '📥', titulo: 'Intereses y dividendos cobrados', texto: 'Actividades de <b>inversión</b>.' },
      { icono: '🧭', titulo: 'Método directo o indirecto', texto: 'El directo muestra cobros y pagos brutos. El indirecto parte del <b>resultado operativo</b> y lo ajusta por partidas que no son efectivo.' }
    ]
  },
  {
    type: 'clasificar', prompt: 'Clasifica según la NIC 7 modificada (empresa comercial)',
    grupos: ['Operación', 'Inversión', 'Financiación'],
    items: [
      { text: 'Intereses pagados al banco', grupo: 2 }, { text: 'Dividendos pagados a socios', grupo: 2 },
      { text: 'Intereses cobrados de un depósito', grupo: 1 }, { text: 'Pago a proveedores', grupo: 0 }
    ],
    explain: 'Intereses y dividendos pagados van en financiación; los cobrados, en inversión.'
  },
  {
    type: 'choice', prompt: 'En el método indirecto, ¿desde qué cifra se parte?',
    options: [{ text: 'Resultado operativo' }, { text: 'Ventas' }, { text: 'Efectivo al inicio' }],
    answer: 0, pista: 'Es un subtotal de la NIIF 18.',
    explain: 'Tras la modificación, el método indirecto parte del resultado operativo.'
  },
  {
    type: 'tf', statement: 'En el método indirecto, la depreciación se suma al resultado porque no usó efectivo.',
    answer: true, explain: 'Se resta como gasto en resultados, pero no salió dinero; por eso se “devuelve”.'
  },
  {
    type: 'choice', prompt: 'Las cuentas por cobrar subieron S/ 10,000 en el año. En el método indirecto, ese aumento…',
    options: [{ text: 'Se resta: ventas que aún no se cobran' }, { text: 'Se suma' }, { text: 'No se considera' }],
    answer: 0, pista: 'Si los clientes deben más, cobraste menos de lo que vendiste.',
    explain: 'Un aumento de cuentas por cobrar reduce el efectivo generado por la operación.'
  },
  {
    type: 'fill', prompt: 'Completa la frase', sentence: 'La NIC 7 alienta el método ___, porque muestra los cobros y pagos brutos.',
    options: ['directo', 'indirecto', 'promedio'], answer: 0,
    explain: 'El método directo da información útil para estimar flujos futuros.'
  }
] };

FC.CONTENIDO.n3l3 = { ejercicios: [
  {
    type: 'teoria', titulo: 'Estado de cambios en el patrimonio',
    intro: 'Explica cómo pasó el patrimonio del saldo inicial al saldo final, columna por columna.',
    puntos: [
      { icono: '💼', titulo: 'Capital', texto: 'Sube con aportes de los socios o al capitalizar utilidades.' },
      { icono: '🛡️', titulo: 'Reserva legal', texto: 'La Ley General de Sociedades exige destinar al menos el <b>10 %</b> de la utilidad distribuible a la reserva, hasta que alcance el <b>20 % del capital</b>.' },
      { icono: '📈', titulo: 'Resultados acumulados', texto: 'Suben con la utilidad del año y bajan con dividendos, reservas o capitalización.' },
      { icono: '🎁', titulo: 'Dividendos', texto: 'No son gasto: reducen el patrimonio y no aparecen en el estado de resultados.' }
    ]
  },
  {
    type: 'tf', statement: 'Los dividendos pagados reducen la utilidad del ejercicio.',
    answer: false, pista: '¿Aparecen los dividendos en el estado de resultados?',
    explain: 'No son gasto: reducen los resultados acumulados en el estado de cambios en el patrimonio.'
  },
  {
    type: 'choice', prompt: 'Utilidad del año: S/ 40,000. ¿Cuánto es el mínimo para la reserva legal (si aún no llega al 20 % del capital)?',
    options: [{ text: 'S/ 4,000' }, { text: 'S/ 8,000' }, { text: 'S/ 400' }],
    answer: 0, explain: 'El 10 % de S/ 40,000 es S/ 4,000.'
  },
  {
    type: 'choice', prompt: 'Al capitalizar utilidades, ¿qué pasa con el patrimonio total?',
    options: [{ text: 'No cambia: solo pasa de resultados acumulados a capital' }, { text: 'Aumenta' }, { text: 'Disminuye' }],
    answer: 0, explain: 'Es un movimiento dentro del patrimonio.'
  },
  {
    type: 'match', prompt: 'Une cada movimiento con su efecto',
    pairs: [
      ['Aporte de socios', 'Sube el capital'],
      ['Utilidad del año', 'Suben los resultados acumulados'],
      ['Dividendos', 'Bajan los resultados acumulados'],
      ['Reserva legal', 'Pasa de resultados a reservas']
    ],
    explain: 'Así se arma cada fila del estado de cambios en el patrimonio.'
  },
  {
    type: 'choice', prompt: 'Pagar S/ 10,000 de dividendos en efectivo afecta…',
    options: [
      { text: 'El patrimonio y el flujo de efectivo (financiación)' },
      { text: 'El estado de resultados (gasto)' },
      { text: 'Solo el flujo de operación' }
    ],
    answer: 0, explain: 'Baja el patrimonio y es una salida de financiación.'
  }
] };

FC.CONTENIDO.n3ex = { ejercicios: [
  {
    type: 'clasificar', prompt: 'Clasifica cada flujo de efectivo',
    grupos: ['Operación', 'Inversión', 'Financiación'],
    items: [
      { text: 'Pago de impuesto a la renta', grupo: 0 }, { text: 'Compra de software', grupo: 1 },
      { text: 'Intereses pagados', grupo: 2 }, { text: 'Cobro a clientes', grupo: 0 }, { text: 'Amortización de un préstamo', grupo: 2 }
    ],
    explain: 'Los impuestos y los clientes son operación; el software, inversión; los intereses y el préstamo, financiación.'
  },
  {
    type: 'tf', statement: 'Un aporte de capital en efectivo es un flujo de financiación.', answer: true,
    explain: 'Los aportes de los dueños son financiación.'
  },
  {
    type: 'choice', prompt: 'Resultado operativo S/ 50,000, depreciación S/ 12,000 y aumento de inventarios S/ 7,000. ¿Flujo de operación (sin otros ajustes)?',
    options: [{ text: 'S/ 55,000' }, { text: 'S/ 69,000' }, { text: 'S/ 31,000' }],
    answer: 0, explain: 'S/ 50,000 + S/ 12,000 − S/ 7,000 = S/ 55,000.'
  },
  {
    type: 'choice', prompt: 'Los dividendos cobrados por una inversión en acciones se clasifican en…',
    options: [{ text: 'Inversión' }, { text: 'Operación' }, { text: 'Financiación' }],
    answer: 0, explain: 'Según la NIC 7 modificada, los intereses y dividendos cobrados son inversión.'
  },
  {
    type: 'tf', statement: 'La reserva legal se forma con al menos el 10 % de la utilidad distribuible, hasta llegar al 20 % del capital.',
    answer: true, explain: 'Es lo que establece la Ley General de Sociedades.'
  },
  {
    type: 'choice', prompt: '¿Qué transacción NO aparece en el estado de flujos de efectivo?',
    options: [{ text: 'Convertir una deuda en capital' }, { text: 'Pagar a proveedores' }, { text: 'Recibir un préstamo' }],
    answer: 0, explain: 'No mueve efectivo: se revela en las notas.'
  },
  {
    type: 'match', prompt: 'Une cada partida con el estado donde se ve',
    pairs: [['Dividendos declarados', 'Cambios en el patrimonio'], ['Intereses pagados', 'Flujos de efectivo'], ['Gasto por intereses', 'Resultados']],
    explain: 'Una misma operación puede verse en varios estados con distinto enfoque.'
  }
] };
