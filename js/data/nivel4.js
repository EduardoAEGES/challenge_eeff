/* =========================================================
   NIVEL 4 — Indicadores y primeras decisiones (con ayuda)
   ========================================================= */
window.FC = window.FC || {};
FC.CONTENIDO = FC.CONTENIDO || {};

FC.CONTENIDO.n4l1 = { ejercicios: [
  {
    type: 'teoria', titulo: 'Indicadores de liquidez',
    intro: 'La liquidez mide la capacidad de pagar las deudas de corto plazo.',
    puntos: [
      { icono: '💧', titulo: 'Liquidez corriente', texto: 'Activo corriente ÷ Pasivo corriente. Entre <b>1.5 y 3</b> suele ser sano; menos de 1 es riesgoso; mucho más de 3 puede indicar recursos ociosos.' },
      { icono: '🧪', titulo: 'Prueba ácida', texto: '(Activo corriente − Inventarios − Pagados por anticipado) ÷ Pasivo corriente. Excluye lo que tarda en convertirse en efectivo.' },
      { icono: '🧱', titulo: 'Capital de trabajo', texto: 'Activo corriente − Pasivo corriente: el “colchón” en soles para operar.' }
    ]
  },
  {
    type: 'choice', prompt: 'Activo corriente S/ 120,000 y pasivo corriente S/ 60,000. ¿Liquidez corriente?',
    options: [{ text: '2.0' }, { text: '0.5' }, { text: 'S/ 60,000' }],
    answer: 0, pista: 'Divide, no restes.', explain: 'S/ 120,000 ÷ S/ 60,000 = 2.0.'
  },
  {
    type: 'choice', prompt: 'Activo corriente S/ 120,000, de los cuales S/ 50,000 son inventarios. Pasivo corriente S/ 60,000. ¿Prueba ácida?',
    options: [{ text: '1.17' }, { text: '2.0' }, { text: '0.83' }],
    answer: 0, pista: 'Resta los inventarios del activo corriente antes de dividir.',
    explain: '(S/ 120,000 − S/ 50,000) ÷ S/ 60,000 = 1.17.'
  },
  {
    type: 'tf', statement: 'Una liquidez corriente de 0.8 significa que el activo corriente no alcanza para cubrir el pasivo corriente.',
    answer: true, explain: 'Por cada sol de deuda de corto plazo hay solo S/ 0.80 de activo corriente.'
  },
  {
    type: 'choice', prompt: '¿Qué decisión MEJORA la liquidez corriente?',
    options: [
      { text: 'Refinanciar una deuda de corto plazo a largo plazo' },
      { text: 'Comprar maquinaria al contado' },
      { text: 'Pagar dividendos en efectivo' }
    ],
    answer: 0, pista: 'Piensa qué pasa con el pasivo corriente.',
    explain: 'La deuda pasa de corriente a no corriente: baja el pasivo corriente y sube la liquidez.'
  },
  {
    type: 'fill', prompt: 'Completa la frase', sentence: 'Una liquidez de 6.0 puede indicar ___ ociosos.',
    options: ['recursos', 'pasivos', 'gastos'], answer: 0,
    explain: 'Mucho efectivo sin uso también es mala gestión: no genera rentabilidad.'
  }
] };

FC.CONTENIDO.n4l2 = { ejercicios: [
  {
    type: 'teoria', titulo: 'Solvencia y rentabilidad',
    intro: 'La solvencia mide cuánto depende la empresa de la deuda; la rentabilidad, cuánto gana con sus recursos.',
    puntos: [
      { icono: '⚓', titulo: 'Endeudamiento', texto: 'Pasivo total ÷ Activo total. Hasta 50 % suele ser prudente; más de 70 % es alto.' },
      { icono: '🛡️', titulo: 'Cobertura de intereses', texto: 'Resultado operativo ÷ Gastos por intereses. Cuántas veces el negocio “paga” sus intereses.' },
      { icono: '📈', titulo: 'ROA y ROE', texto: 'ROA = Utilidad neta ÷ Activo total. ROE = Utilidad neta ÷ Patrimonio: lo que ganan los dueños por cada sol invertido.' },
      { icono: '🧾', titulo: 'Margen neto', texto: 'Utilidad neta ÷ Ventas: cuánto queda de cada sol vendido.' }
    ]
  },
  {
    type: 'choice', prompt: 'Pasivo S/ 140,000 y activo S/ 200,000. ¿Endeudamiento?',
    options: [{ text: '70 %' }, { text: '30 %' }, { text: '143 %' }],
    answer: 0, explain: 'S/ 140,000 ÷ S/ 200,000 = 70 %: un nivel alto.'
  },
  {
    type: 'choice', prompt: 'Utilidad neta S/ 18,000 y patrimonio S/ 120,000. ¿ROE?',
    options: [{ text: '15 %' }, { text: '6.7 %' }, { text: '1.5 %' }],
    answer: 0, pista: 'ROE = Utilidad neta ÷ Patrimonio.', explain: 'S/ 18,000 ÷ S/ 120,000 = 15 %.'
  },
  {
    type: 'tf', statement: 'Financiar una inversión con deuda en vez de aportes puede subir el ROE, pero también el riesgo.',
    answer: true, explain: 'Con menos patrimonio, la misma utilidad rinde más para los dueños, pero sube el endeudamiento y los intereses.'
  },
  {
    type: 'match', prompt: 'Une cada indicador con su fórmula',
    pairs: [
      ['Endeudamiento', 'Pasivo ÷ Activo'],
      ['ROE', 'Utilidad neta ÷ Patrimonio'],
      ['Margen neto', 'Utilidad neta ÷ Ventas'],
      ['Cobertura de intereses', 'Resultado operativo ÷ Intereses']
    ],
    explain: 'Cada indicador mira la empresa desde un ángulo distinto.'
  },
  {
    type: 'choice', prompt: 'Resultado operativo S/ 30,000 e intereses S/ 15,000. La cobertura es 2 veces. ¿Cómo se interpreta?',
    options: [{ text: 'Ajustada: un mal año podría impedir pagar los intereses' }, { text: 'Excelente: sobra mucho' }, { text: 'La empresa ya no puede pagar' }],
    answer: 0, explain: 'Por debajo de 3 veces conviene vigilar la deuda.'
  }
] };

FC.CONTENIDO.n4l3 = { ejercicios: [
  {
    type: 'teoria', titulo: 'Decisiones con ayuda',
    intro: 'Cada decisión empresarial se ve distinta en cada estado financiero. Antes de decidir, pregúntate: <b>¿qué pasa con la caja, la deuda y la utilidad?</b>',
    puntos: [
      { icono: '💵', titulo: 'Contado con descuento', texto: 'Baja el costo y sube la utilidad, pero sale efectivo hoy.' },
      { icono: '🕒', titulo: 'Crédito de proveedores', texto: 'Cuida la caja, pero sube el pasivo corriente y puede costar un recargo.' },
      { icono: '🏦', titulo: 'Préstamo', texto: 'Entra efectivo (financiación); luego hay intereses en resultados y más endeudamiento.' },
      { icono: '📄', titulo: 'Leasing (NIIF 16)', texto: 'Se reconoce un activo por derecho de uso y un pasivo por arrendamiento, sin salida inicial de efectivo.' }
    ]
  },
  {
    type: 'choice',
    escena: { personaje: '🧑🏻‍💼', nombre: 'Daniel, contador', texto: 'El proveedor nos da 3 % de descuento si pagamos al contado. Tenemos caja de sobra y liquidez de 4.0.' },
    prompt: '¿Qué te conviene?',
    options: [{ text: 'Pagar al contado y aprovechar el descuento' }, { text: 'Pedir crédito a 60 días con recargo' }, { text: 'No comprar' }],
    answer: 0, pista: 'Con caja de sobra, ¿para qué pagar un recargo?',
    explain: 'Con exceso de liquidez, el descuento mejora el margen sin poner en riesgo los pagos.'
  },
  {
    type: 'choice',
    escena: { personaje: '👩🏽‍💼', nombre: 'Laura', texto: 'Necesito una máquina de S/ 60,000, pero tengo solo S/ 20,000 en caja.' },
    prompt: '¿Qué alternativa evita quedarse sin efectivo?',
    options: [{ text: 'Préstamo bancario o leasing' }, { text: 'Pagarla al contado' }, { text: 'Repartir dividendos primero' }],
    answer: 0, pista: 'Pagar S/ 60,000 con S/ 20,000 deja la caja en negativo.',
    explain: 'Pagarla al contado provocaría un sobregiro; financiarla protege la liquidez.'
  },
  {
    type: 'tf', statement: 'Con un leasing financiero, la máquina aparece en el estado de situación financiera como activo por derecho de uso.',
    answer: true, explain: 'Según la NIIF 16, el arrendatario reconoce el derecho de uso y el pasivo por arrendamiento.'
  },
  {
    type: 'choice', prompt: 'Vendes a 60 días en lugar de al contado. ¿Qué ocurre con mayor probabilidad?',
    options: [
      { text: 'Suben las ventas y las cuentas por cobrar, pero la caja crece menos' },
      { text: 'Baja la utilidad y sube la caja' },
      { text: 'No cambia nada' }
    ],
    answer: 0, explain: 'El crédito atrae clientes, pero el dinero llega después y hay riesgo de incobrables.'
  },
  {
    type: 'clasificar', prompt: '¿Qué efecto principal tiene cada decisión?',
    grupos: ['Sube el endeudamiento', 'Baja la caja hoy', 'Sube el patrimonio'],
    items: [
      { text: 'Préstamo bancario', grupo: 0 }, { text: 'Comprar al contado', grupo: 1 }, { text: 'Aporte de socios', grupo: 2 }, { text: 'Pagar dividendos', grupo: 1 }
    ],
    pista: 'Piensa en la ecuación contable de cada operación.',
    explain: 'La deuda sube con el préstamo; la caja baja al pagar; el aporte aumenta el capital.'
  }
] };

FC.CONTENIDO.n4ex = { ejercicios: [
  {
    type: 'choice', prompt: 'Activo corriente S/ 45,000 y pasivo corriente S/ 50,000. ¿Cómo está la liquidez?',
    options: [{ text: 'En riesgo: 0.9' }, { text: 'Sana: 1.5' }, { text: 'Excesiva: 5.0' }],
    answer: 0, explain: '45,000 ÷ 50,000 = 0.9, menor a 1.'
  },
  {
    type: 'choice', prompt: 'Para mejorar esa liquidez, ¿qué harías?',
    options: [{ text: 'Refinanciar parte de la deuda a largo plazo' }, { text: 'Comprar un local al contado' }, { text: 'Pagar dividendos' }],
    answer: 0, explain: 'Pasar deuda al largo plazo reduce el pasivo corriente.'
  },
  {
    type: 'tf', statement: 'Un ROE alto siempre significa que la empresa está sana.',
    answer: false, explain: 'Puede venir de un endeudamiento muy alto: hay que mirarlo junto a la solvencia y la liquidez.'
  },
  {
    type: 'choice', prompt: 'Utilidad neta S/ 12,000 y ventas S/ 240,000. ¿Margen neto?',
    options: [{ text: '5 %' }, { text: '20 %' }, { text: '0.5 %' }],
    answer: 0, explain: 'S/ 12,000 ÷ S/ 240,000 = 5 %.'
  },
  {
    type: 'match', prompt: 'Une cada decisión con dónde se ve primero',
    pairs: [
      ['Préstamo recibido', 'Flujo de financiación'],
      ['Compra de maquinaria al contado', 'Flujo de inversión'],
      ['Descuento por pronto pago', 'Menor costo de ventas']
    ],
    explain: 'Cada decisión deja huella en un estado distinto.'
  },
  {
    type: 'choice', prompt: 'Endeudamiento 82 % y cobertura de intereses 1.2 veces. ¿Qué recomendarías?',
    options: [{ text: 'Aporte de socios o prepagar deuda' }, { text: 'Tomar otro préstamo' }, { text: 'Repartir todas las utilidades' }],
    answer: 0, explain: 'Con tanta deuda, fortalecer el patrimonio o reducir pasivos baja el riesgo.'
  },
  {
    type: 'tf', statement: 'Vender al crédito puede aumentar la utilidad y, al mismo tiempo, generar un sobregiro.',
    answer: true, explain: 'La utilidad se reconoce al vender; el efectivo llega al cobrar.'
  }
] };
