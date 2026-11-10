/* =========================================================
   NIVEL 2 — Situación financiera y resultados (NIIF 18)
   ========================================================= */
window.FC = window.FC || {};
FC.CONTENIDO = FC.CONTENIDO || {};

FC.CONTENIDO.n2l1 = { ejercicios: [
  {
    type: 'teoria', titulo: 'Estado de situación financiera',
    intro: 'Presenta activos, pasivos y patrimonio separando lo <b>corriente</b> de lo <b>no corriente</b>.',
    puntos: [
      { icono: '⏱️', titulo: 'Activo corriente', texto: 'Se espera realizar o consumir en el ciclo normal o dentro de 12 meses: efectivo, cuentas por cobrar, inventarios.' },
      { icono: '🏗️', titulo: 'Activo no corriente', texto: 'Se usa por más de un año: inmuebles, maquinaria y equipo, intangibles, activos por derecho de uso.' },
      { icono: '📆', titulo: 'Pasivo corriente', texto: 'Se paga dentro de 12 meses: proveedores, tributos, la parte de los préstamos que vence el próximo año.' },
      { icono: '🏦', titulo: 'Pasivo no corriente', texto: 'Vence después de 12 meses: préstamos de largo plazo, pasivos por arrendamiento.' }
    ]
  },
  {
    type: 'clasificar', prompt: '¿Corriente o no corriente?',
    grupos: ['Activo corriente', 'Activo no corriente', 'Pasivo corriente', 'Pasivo no corriente'],
    items: [
      { text: 'Mercaderías', grupo: 0 }, { text: 'Maquinaria', grupo: 1 }, { text: 'Proveedores a 60 días', grupo: 2 },
      { text: 'Préstamo a 5 años (porción de años futuros)', grupo: 3 }, { text: 'Cuentas por cobrar a 30 días', grupo: 0 }
    ],
    pista: 'La pregunta clave: ¿se realiza o se paga dentro de 12 meses?',
    explain: 'El criterio es el plazo: dentro de 12 meses es corriente; después, no corriente.'
  },
  {
    type: 'tf', statement: 'La parte de un préstamo de largo plazo que vence el próximo año se presenta como pasivo corriente.',
    answer: true, explain: 'Esa porción se reclasifica como “parte corriente de deudas de largo plazo”.'
  },
  {
    type: 'choice', prompt: 'Un camión que la empresa usará 8 años, ¿dónde se presenta?',
    options: [{ text: 'Activo no corriente' }, { text: 'Activo corriente' }, { text: 'Gasto del periodo' }],
    answer: 0, explain: 'Es propiedad, planta y equipo: se presenta como no corriente y se deprecia cada año.'
  },
  {
    type: 'choice', prompt: '¿Qué partida reduce el valor de la maquinaria en el estado de situación financiera?',
    options: [{ text: 'Depreciación acumulada' }, { text: 'Capital social' }, { text: 'Cuentas por pagar' }],
    answer: 0, pista: 'Es una cuenta que “resta” al activo (cuenta 39 del PCGE).',
    explain: 'La depreciación acumulada (cuenta 39) se resta del costo del activo.'
  },
  {
    type: 'fill', prompt: 'Completa la frase', sentence: 'El capital, las reservas y los resultados acumulados forman el ___.',
    options: ['patrimonio', 'pasivo', 'activo corriente'], answer: 0,
    explain: 'Son los componentes del patrimonio.'
  },
  {
    type: 'choice',
    escena: { personaje: '🧑🏻‍💼', nombre: 'Daniel, contador', texto: 'Tenemos S/ 40,000 en mercaderías y S/ 25,000 en efectivo. Debemos S/ 30,000 a proveedores.' },
    prompt: '¿Cuánto es el capital de trabajo (activo corriente − pasivo corriente)?',
    options: [{ text: 'S/ 35,000' }, { text: 'S/ 65,000' }, { text: 'S/ 5,000' }],
    answer: 0, pista: 'Suma los activos corrientes y resta el pasivo corriente.',
    explain: '(S/ 40,000 + S/ 25,000) − S/ 30,000 = S/ 35,000.'
  }
] };

FC.CONTENIDO.n2l2 = { ejercicios: [
  {
    type: 'teoria', titulo: 'El estado de resultados según la NIIF 18',
    intro: 'La <b>NIIF 18</b> reemplaza a la NIC 1 desde 2027 y ordena los ingresos y gastos en <b>categorías</b> con subtotales obligatorios.',
    puntos: [
      { icono: '⚙️', titulo: 'Categoría de operación', texto: 'Ingresos y gastos de las actividades principales: ventas, costo de ventas, sueldos, depreciación. Termina en el <b>resultado operativo</b>.' },
      { icono: '📦', titulo: 'Categoría de inversión', texto: 'Rendimientos de inversiones que generan ingresos por sí mismas, como intereses de depósitos o dividendos recibidos.' },
      { icono: '🏦', titulo: 'Categoría de financiación', texto: 'Gastos por intereses de préstamos y otros pasivos de financiación.' },
      { icono: '🧮', titulo: 'Subtotales obligatorios', texto: '<b>Resultado operativo</b>, <b>resultado antes de financiación e impuestos</b> y <b>resultado del periodo</b>.' }
    ]
  },
  {
    type: 'clasificar', prompt: 'Ubica cada partida en su categoría (empresa comercial)',
    grupos: ['Operación', 'Inversión', 'Financiación'],
    items: [
      { text: 'Ventas de mercaderías', grupo: 0 }, { text: 'Intereses de un préstamo bancario', grupo: 2 },
      { text: 'Depreciación de la maquinaria', grupo: 0 }, { text: 'Intereses ganados en un depósito a plazo', grupo: 1 },
      { text: 'Sueldos del personal', grupo: 0 }
    ],
    pista: 'Operación = el negocio principal; financiación = el costo de la deuda.',
    explain: 'Para una empresa comercial, el negocio es operación; los intereses de la deuda, financiación; y los rendimientos de inversiones, inversión.'
  },
  {
    type: 'choice', prompt: '¿Cuál es un subtotal obligatorio de la NIIF 18?',
    options: [{ text: 'Resultado operativo' }, { text: 'EBITDA' }, { text: 'Margen de contribución' }],
    answer: 0, explain: 'El EBITDA no es obligatorio; si la gerencia lo usa en sus comunicaciones, puede ser una medida de rendimiento de la gerencia.'
  },
  {
    type: 'tf', statement: 'Según la NIIF 18, el gasto por intereses de un préstamo de una empresa comercial va en la categoría de operación.',
    answer: false, explain: 'Va en la categoría de financiación, después del resultado antes de financiación e impuestos.'
  },
  {
    type: 'choice', prompt: 'Ventas S/ 300,000; costo de ventas S/ 180,000; gastos operativos S/ 70,000. ¿Cuál es el resultado operativo?',
    options: [{ text: 'S/ 50,000' }, { text: 'S/ 120,000' }, { text: 'S/ 230,000' }],
    answer: 0, pista: 'Primero la ganancia bruta (ventas − costo), luego resta los gastos operativos.',
    explain: 'S/ 300,000 − S/ 180,000 − S/ 70,000 = S/ 50,000.'
  },
  {
    type: 'fill', prompt: 'Completa la frase', sentence: 'La NIIF 18 se aplica a los periodos anuales que empiezan desde el 1 de enero de ___.',
    options: ['2027', '2020', '2030'], answer: 0,
    explain: 'Es obligatoria desde 2027 y reemplaza a la NIC 1.'
  },
  {
    type: 'match', prompt: 'Une cada subtotal con lo que mide',
    pairs: [
      ['Resultado operativo', 'Desempeño del negocio principal'],
      ['Antes de financiación e impuestos', 'Operación más inversión'],
      ['Resultado del periodo', 'Ganancia o pérdida final']
    ],
    explain: 'Los subtotales hacen comparables los resultados entre empresas.'
  }
] };

FC.CONTENIDO.n2l3 = { ejercicios: [
  {
    type: 'teoria', titulo: 'Agregar, desagregar y medidas de la gerencia',
    intro: 'La NIIF 18 también exige información más útil sobre cómo se agrupan las cifras y qué indicadores propios usa la gerencia.',
    puntos: [
      { icono: '🧩', titulo: 'Agregar y desagregar', texto: 'Se agrupan partidas con características comunes y se separan las que son distintas, para no ocultar información importante.' },
      { icono: '🏷️', titulo: 'Gastos por naturaleza o por función', texto: 'Los gastos operativos pueden presentarse por naturaleza (sueldos, depreciación) o por función (costo de ventas, ventas, administración).' },
      { icono: '🔎', titulo: 'Si se usa la función', texto: 'En las notas se revela, por naturaleza, la depreciación, la amortización, los beneficios a empleados y las rebajas de inventarios.' },
      { icono: '📣', titulo: 'MPM', texto: 'Las <b>medidas de rendimiento definidas por la gerencia</b> (por ejemplo, un “resultado operativo ajustado”) se explican y concilian en una nota.' }
    ]
  },
  {
    type: 'choice', prompt: 'Presentar “gastos de ventas” y “gastos de administración” es clasificar los gastos por…',
    options: [{ text: 'Función' }, { text: 'Naturaleza' }, { text: 'Liquidez' }],
    answer: 0, explain: 'Agrupar por el área que genera el gasto es la clasificación por función.'
  },
  {
    type: 'tf', statement: 'Si la gerencia comunica un “EBITDA ajustado” en sus informes públicos, debe explicarlo y conciliarlo en las notas como medida de rendimiento de la gerencia.',
    answer: true, pista: 'MPM = medida de rendimiento definida por la gerencia.',
    explain: 'La NIIF 18 exige revelar esas medidas y conciliarlas con el subtotal NIIF más cercano.'
  },
  {
    type: 'choice', prompt: '¿Cuál es un ejemplo de gasto por naturaleza?',
    options: [{ text: 'Gastos de personal (cuenta 62)' }, { text: 'Gastos de administración' }, { text: 'Gastos de ventas' }],
    answer: 0, explain: 'Las cuentas 60 a 68 del PCGE clasifican los gastos por naturaleza.'
  },
  {
    type: 'fill', prompt: 'Completa la frase', sentence: 'Agrupar partidas muy distintas en un solo rubro puede ___ información importante.',
    options: ['ocultar', 'mejorar', 'duplicar'], answer: 0,
    explain: 'Por eso la NIIF 18 pide desagregar cuando las partidas son materiales y distintas.'
  },
  {
    type: 'match', prompt: 'Une cada concepto con su ejemplo',
    pairs: [['Naturaleza', 'Depreciación'], ['Función', 'Gastos de ventas'], ['MPM', 'EBITDA ajustado'], ['Subtotal obligatorio', 'Resultado operativo']],
    explain: 'Son las piezas nuevas que trae la NIIF 18.'
  }
] };

FC.CONTENIDO.n2ex = { ejercicios: [
  {
    type: 'clasificar', prompt: 'Clasifica en el estado de situación financiera',
    grupos: ['Activo corriente', 'Activo no corriente', 'Pasivo corriente', 'Patrimonio'],
    items: [
      { text: 'Efectivo', grupo: 0 }, { text: 'Activo por derecho de uso (leasing)', grupo: 1 },
      { text: 'Tributos por pagar', grupo: 2 }, { text: 'Reserva legal', grupo: 3 }, { text: 'Intangibles (software)', grupo: 1 }
    ],
    explain: 'El derecho de uso y el software son no corrientes; los tributos por pagar, corrientes.'
  },
  {
    type: 'choice', prompt: 'Ganancia bruta S/ 90,000; gastos operativos S/ 50,000; intereses S/ 8,000. ¿Cuál es el resultado antes de impuestos?',
    options: [{ text: 'S/ 32,000' }, { text: 'S/ 40,000' }, { text: 'S/ 48,000' }],
    answer: 0, explain: 'Resultado operativo S/ 40,000 − intereses S/ 8,000 = S/ 32,000.'
  },
  {
    type: 'tf', statement: 'La NIIF 18 reemplaza a la NIC 1.', answer: true,
    explain: 'La NIIF 18 sustituye a la NIC 1 desde 2027 y conserva muchos de sus requerimientos generales.'
  },
  {
    type: 'choice', prompt: 'En una empresa comercial, ¿en qué categoría va la depreciación de su local de ventas?',
    options: [{ text: 'Operación' }, { text: 'Inversión' }, { text: 'Financiación' }],
    answer: 0, explain: 'Es parte del negocio principal: categoría de operación.'
  },
  {
    type: 'choice', prompt: '¿Qué subtotal aparece justo antes de los gastos de financiación?',
    options: [{ text: 'Resultado antes de financiación e impuestos' }, { text: 'Ganancia bruta' }, { text: 'Resultado del periodo' }],
    answer: 0, explain: 'Primero va el resultado operativo, luego la categoría de inversión y el resultado antes de financiación e impuestos.'
  },
  {
    type: 'tf', statement: 'Una medida de rendimiento de la gerencia puede presentarse sin ninguna explicación en las notas.',
    answer: false, explain: 'Debe explicarse por qué es útil, cómo se calcula y conciliarse con un subtotal NIIF.'
  },
  {
    type: 'match', prompt: 'Une cada partida con su categoría (empresa comercial)',
    pairs: [['Costo de ventas', 'Operación'], ['Intereses del préstamo', 'Financiación'], ['Dividendos recibidos de una inversión', 'Inversión']],
    explain: 'Así se ordena el estado de resultados de la NIIF 18.'
  },
  {
    type: 'choice', prompt: 'Activo corriente S/ 90,000 y pasivo corriente S/ 60,000. ¿Capital de trabajo?',
    options: [{ text: 'S/ 30,000' }, { text: 'S/ 150,000' }, { text: '1.5' }],
    answer: 0, explain: 'Capital de trabajo = S/ 90,000 − S/ 60,000 = S/ 30,000 (1.5 es la liquidez corriente).'
  }
] };
