/* =========================================================
   NIVEL 1 — Fundamentos contables
   Tipos: teoria, choice, tf, fill, match, clasificar.
   «pista» aparece con el botón de ayuda.
   ========================================================= */
window.FC = window.FC || {};
FC.CONTENIDO = FC.CONTENIDO || {};

FC.CONTENIDO.n1l1 = { ejercicios: [
  {
    type: 'teoria', titulo: '¿Para qué sirven los estados financieros?',
    intro: 'Los <b>estados financieros</b> resumen la situación y el desempeño de una empresa para que inversionistas, bancos y otros acreedores tomen decisiones.',
    puntos: [
      { icono: '🏛️', titulo: 'Estado de situación financiera', texto: 'Lo que la empresa <b>tiene</b> (activos), lo que <b>debe</b> (pasivos) y lo que pertenece a los dueños (patrimonio) en una fecha.' },
      { icono: '🧾', titulo: 'Estado de resultados', texto: 'Los ingresos y gastos de un <b>periodo</b>, y el resultado: ganancia o pérdida.' },
      { icono: '💧', titulo: 'Estado de flujos de efectivo', texto: 'De dónde vino y a dónde fue el <b>efectivo</b> durante el periodo.' },
      { icono: '🏦', titulo: 'Estado de cambios en el patrimonio', texto: 'Cómo cambió el patrimonio: aportes, utilidades, dividendos y reservas.' },
      { icono: '📝', titulo: 'Notas', texto: 'Explican las cifras: políticas contables y detalles de cada partida.' }
    ]
  },
  {
    type: 'choice', prompt: '¿Qué estado muestra la posición de la empresa en una fecha determinada?',
    options: [{ text: 'Estado de situación financiera', icono: '🏛️' }, { text: 'Estado de resultados', icono: '🧾' }, { text: 'Estado de flujos de efectivo', icono: '💧' }],
    answer: 0, pista: 'Piensa en una “foto” de lo que se tiene y se debe en un día.',
    explain: 'El estado de situación financiera es una foto a una fecha; los demás estados cubren un periodo.'
  },
  {
    type: 'match', prompt: 'Une cada estado con lo que informa',
    pairs: [
      ['Situación financiera', 'Activos, pasivos y patrimonio'],
      ['Resultados', 'Ingresos, gastos y ganancia'],
      ['Flujos de efectivo', 'Entradas y salidas de efectivo'],
      ['Cambios en el patrimonio', 'Aportes, dividendos y reservas']
    ],
    explain: 'Cada estado responde una pregunta distinta sobre la empresa.'
  },
  {
    type: 'tf', statement: 'Una empresa puede tener ganancia en el estado de resultados y, aun así, quedarse sin efectivo.',
    answer: true, pista: '¿Qué pasa si vendes todo al crédito y aún no cobras?',
    explain: 'Sí. La ganancia se reconoce cuando se vende, aunque el cobro llegue después. Por eso se necesita el estado de flujos de efectivo.'
  },
  {
    type: 'choice', prompt: '¿Quiénes son los usuarios principales de los estados financieros de propósito general?',
    options: [{ text: 'Inversionistas, prestamistas y otros acreedores' }, { text: 'Solo el gerente general' }, { text: 'Solo la SUNAT' }],
    answer: 0, explain: 'Están dirigidos a quienes aportan recursos a la empresa o le prestan dinero.'
  },
  {
    type: 'fill', prompt: 'Completa la frase', sentence: 'El estado de resultados muestra el desempeño durante un ___.',
    options: ['periodo', 'día', 'inventario'], answer: 0,
    explain: 'Ingresos y gastos se acumulan durante un periodo, por ejemplo, un año.'
  },
  {
    type: 'choice',
    escena: { personaje: '👩🏽‍💼', nombre: 'Laura, dueña de una distribuidora', texto: 'El banco me pide saber cuánto efectivo generó mi negocio este año y en qué lo gasté.' },
    prompt: '¿Qué estado debe mostrarle Laura al banco?',
    options: [{ text: 'Estado de flujos de efectivo', icono: '💧' }, { text: 'Estado de cambios en el patrimonio', icono: '🏦' }, { text: 'Solo las notas', icono: '📝' }],
    answer: 0, explain: 'El estado de flujos de efectivo explica las entradas y salidas de efectivo del periodo.'
  }
] };

FC.CONTENIDO.n1l2 = { ejercicios: [
  {
    type: 'teoria', titulo: 'La ecuación contable',
    intro: 'Todo lo que la empresa tiene fue financiado por terceros o por sus dueños: <b>Activo = Pasivo + Patrimonio</b>.',
    puntos: [
      { icono: '🧰', titulo: 'Activo', texto: 'Recursos controlados que se espera generen beneficios: efectivo, cuentas por cobrar, mercaderías, maquinaria.' },
      { icono: '📄', titulo: 'Pasivo', texto: 'Obligaciones con terceros: proveedores, préstamos bancarios, tributos por pagar.' },
      { icono: '👥', titulo: 'Patrimonio', texto: 'Lo que queda para los dueños: capital, reservas y resultados acumulados.' },
      { icono: '🔁', titulo: 'Siempre cuadra', texto: 'Cada operación mueve al menos dos partidas y la igualdad se mantiene.' }
    ]
  },
  {
    type: 'clasificar', prompt: 'Clasifica cada partida',
    grupos: ['Activo', 'Pasivo', 'Patrimonio'],
    items: [
      { text: 'Mercaderías', grupo: 0 }, { text: 'Préstamo bancario', grupo: 1 }, { text: 'Capital social', grupo: 2 },
      { text: 'Cuentas por cobrar', grupo: 0 }, { text: 'Cuentas por pagar a proveedores', grupo: 1 }, { text: 'Resultados acumulados', grupo: 2 }
    ],
    pista: 'Activo = lo que tienes; pasivo = lo que debes a terceros; patrimonio = lo de los dueños.',
    explain: 'Lo que se tiene es activo, lo que se debe a terceros es pasivo y lo aportado o ganado por los dueños es patrimonio.'
  },
  {
    type: 'choice', prompt: 'Una empresa tiene activos por S/ 200,000 y pasivos por S/ 120,000. ¿Cuál es su patrimonio?',
    options: [{ text: 'S/ 80,000' }, { text: 'S/ 320,000' }, { text: 'S/ 120,000' }],
    answer: 0, pista: 'Patrimonio = Activo − Pasivo.',
    explain: 'S/ 200,000 − S/ 120,000 = S/ 80,000.'
  },
  {
    type: 'tf', statement: 'Si la empresa compra una máquina al contado, el total del activo aumenta.',
    answer: false, pista: 'Un activo sube (máquina) y otro baja (efectivo).',
    explain: 'Falso: sube la maquinaria y baja el efectivo en el mismo monto. El total del activo no cambia.'
  },
  {
    type: 'choice', prompt: 'La empresa recibe un préstamo bancario de S/ 50,000 en efectivo. ¿Qué ocurre?',
    options: [
      { text: 'Aumentan el activo y el pasivo en S/ 50,000' },
      { text: 'Aumentan el activo y el patrimonio' },
      { text: 'Disminuye el pasivo' }
    ],
    answer: 0, explain: 'Entra efectivo (activo) y nace una deuda con el banco (pasivo).'
  },
  {
    type: 'fill', prompt: 'Completa la ecuación', sentence: 'Activo = Pasivo + ___',
    options: ['Patrimonio', 'Ingresos', 'Gastos'], answer: 0,
    explain: 'Los ingresos y gastos terminan afectando el patrimonio a través del resultado del ejercicio.'
  },
  {
    type: 'choice', prompt: 'Los socios aportan S/ 30,000 en efectivo. ¿Qué partidas aumentan?',
    options: [{ text: 'Efectivo y capital' }, { text: 'Efectivo y préstamos' }, { text: 'Capital y gastos' }],
    answer: 0, explain: 'Entra efectivo (activo) y aumenta el capital (patrimonio).'
  }
] };

FC.CONTENIDO.n1l3 = { ejercicios: [
  {
    type: 'teoria', titulo: 'Partida doble y el PCGE',
    intro: 'En la <b>partida doble</b> cada operación se registra con un cargo (debe) y un abono (haber) por el mismo importe.',
    puntos: [
      { icono: '⬅️', titulo: 'Debe', texto: 'Aumentan por el debe: <b>activos y gastos</b>.' },
      { icono: '➡️', titulo: 'Haber', texto: 'Aumentan por el haber: <b>pasivos, patrimonio e ingresos</b>.' },
      { icono: '🗂️', titulo: 'Plan Contable General Empresarial', texto: 'Ordena las cuentas en elementos: 1 a 3 activo, 4 pasivo, 5 patrimonio, 6 gastos por naturaleza, 7 ingresos, 8 saldos intermediarios y 9 contabilidad analítica.' },
      { icono: '🔢', titulo: 'Cuentas frecuentes', texto: '10 Efectivo, 12 Cuentas por cobrar, 20 Mercaderías, 33 Inmuebles, maquinaria y equipo, 42 Cuentas por pagar, 45 Obligaciones financieras, 50 Capital, 70 Ventas.' }
    ]
  },
  {
    type: 'match', prompt: 'Une cada cuenta del PCGE con su código',
    pairs: [['Efectivo y equivalentes', '10'], ['Mercaderías', '20'], ['Cuentas por pagar comerciales', '42'], ['Ventas', '70']],
    explain: 'Los dos primeros dígitos identifican la cuenta en el PCGE.'
  },
  {
    type: 'choice', prompt: '¿Por qué lado aumenta una cuenta de pasivo?',
    options: [{ text: 'Por el haber' }, { text: 'Por el debe' }, { text: 'No aumenta nunca' }],
    answer: 0, pista: 'Pasivo y patrimonio están al lado derecho de la ecuación.',
    explain: 'Pasivos, patrimonio e ingresos aumentan por el haber.'
  },
  {
    type: 'choice', prompt: 'Vendes mercaderías al contado por S/ 5,000. ¿Cuál es el asiento por la venta?',
    options: [
      { text: 'Debe: 10 Efectivo · Haber: 70 Ventas' },
      { text: 'Debe: 70 Ventas · Haber: 10 Efectivo' },
      { text: 'Debe: 42 Cuentas por pagar · Haber: 70 Ventas' }
    ],
    answer: 0, pista: 'Entra efectivo (activo sube por el debe) y se gana un ingreso (sube por el haber).',
    explain: 'Se carga 10 Efectivo (entra dinero) y se abona 70 Ventas (ingreso).'
  },
  {
    type: 'clasificar', prompt: '¿A qué elemento del PCGE pertenece cada cuenta?',
    grupos: ['Activo (1–3)', 'Pasivo (4)', 'Patrimonio (5)', 'Resultados (6–7)'],
    items: [
      { text: '33 Inmuebles, maquinaria y equipo', grupo: 0 }, { text: '40 Tributos por pagar', grupo: 1 },
      { text: '58 Reservas', grupo: 2 }, { text: '62 Gastos de personal', grupo: 3 }, { text: '12 Cuentas por cobrar', grupo: 0 }
    ],
    explain: 'El primer dígito indica el elemento: 1 a 3 activo, 4 pasivo, 5 patrimonio, 6 gastos y 7 ingresos.'
  },
  {
    type: 'tf', statement: 'En todo asiento, la suma del debe es igual a la suma del haber.',
    answer: true, explain: 'Es la regla de la partida doble: por eso el balance siempre cuadra.'
  },
  {
    type: 'fill', prompt: 'Completa el asiento', sentence: 'Pagas S/ 2,000 a un proveedor: Debe 42 Cuentas por pagar, Haber ___.',
    options: ['10 Efectivo', '70 Ventas', '50 Capital'], answer: 0,
    explain: 'Disminuye la deuda (debe de la 42) y sale efectivo (haber de la 10).'
  }
] };

FC.CONTENIDO.n1ex = { ejercicios: [
  {
    type: 'choice', prompt: '¿Cuál NO es un estado financiero?',
    options: [{ text: 'El presupuesto de ventas del próximo año' }, { text: 'Estado de flujos de efectivo' }, { text: 'Estado de cambios en el patrimonio' }],
    answer: 0, explain: 'El presupuesto es una herramienta de gestión, no un estado financiero.'
  },
  {
    type: 'choice', prompt: 'Activo: S/ 150,000. Patrimonio: S/ 90,000. ¿Cuánto es el pasivo?',
    options: [{ text: 'S/ 60,000' }, { text: 'S/ 240,000' }, { text: 'S/ 90,000' }],
    answer: 0, explain: 'Pasivo = Activo − Patrimonio = S/ 60,000.'
  },
  {
    type: 'tf', statement: 'Los gastos aumentan por el haber.',
    answer: false, explain: 'Los gastos aumentan por el debe; los ingresos, por el haber.'
  },
  {
    type: 'clasificar', prompt: 'Clasifica cada partida',
    grupos: ['Activo', 'Pasivo', 'Patrimonio'],
    items: [
      { text: 'Efectivo', grupo: 0 }, { text: 'Tributos por pagar', grupo: 1 }, { text: 'Reserva legal', grupo: 2 },
      { text: 'Maquinaria', grupo: 0 }, { text: 'Préstamo bancario', grupo: 1 }
    ],
    explain: 'Efectivo y maquinaria son activos; tributos y préstamos, pasivos; la reserva legal es patrimonio.'
  },
  {
    type: 'choice', prompt: 'Compras mercaderías al crédito por S/ 8,000. ¿Cuál es el asiento?',
    options: [
      { text: 'Debe: 20 Mercaderías · Haber: 42 Cuentas por pagar' },
      { text: 'Debe: 20 Mercaderías · Haber: 10 Efectivo' },
      { text: 'Debe: 42 Cuentas por pagar · Haber: 20 Mercaderías' }
    ],
    answer: 0, explain: 'Sube el inventario (debe) y nace una deuda con el proveedor (haber).'
  },
  {
    type: 'match', prompt: 'Une cada elemento del PCGE con su número',
    pairs: [['Pasivo', '4'], ['Patrimonio', '5'], ['Gastos por naturaleza', '6'], ['Ingresos', '7']],
    explain: 'Los elementos del 1 al 5 forman el balance; el 6 y el 7, los resultados.'
  },
  {
    type: 'tf', statement: 'Pagar una deuda con efectivo disminuye el activo y el pasivo en el mismo monto.',
    answer: true, explain: 'Sale efectivo y se cancela la deuda: la ecuación sigue cuadrando.'
  },
  {
    type: 'choice', prompt: '¿Qué estado explica por qué cambió el patrimonio en el año?',
    options: [{ text: 'Estado de cambios en el patrimonio' }, { text: 'Estado de flujos de efectivo' }, { text: 'Estado de situación financiera' }],
    answer: 0, explain: 'Muestra aportes, resultado del ejercicio, dividendos y reservas.'
  }
] };
