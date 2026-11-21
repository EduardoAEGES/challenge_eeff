/* =========================================================
   NIVEL 3 — Financiar e invertir
   Préstamo, aporte o leasing (NIIF 16), flujos de efectivo (NIC 7),
   categorías del estado de resultados (NIIF 18) y pagos anticipados.
   ========================================================= */
window.FC = window.FC || {};
FC.CONTENIDO = FC.CONTENIDO || {};

FC.CONTENIDO.n3l1 = { ejercicios: [
  {
    type: 'teoria', titulo: '¿Cómo financiar una inversión?',
    intro: 'En el reto tendrás que comprar equipos o enfrentar una crisis. Cada forma de conseguir el dinero deja una huella distinta en los estados.',
    puntos: [
      { icono: 'banco', titulo: 'Préstamo bancario', texto: 'Entra efectivo y nace un <b>pasivo</b>. Genera intereses (gasto de financiación). El endeudamiento sube.' },
      { icono: 'usuarios', titulo: 'Aporte de los socios', texto: 'Entra efectivo y sube el <b>patrimonio</b>. No hay intereses. El endeudamiento baja.' },
      { icono: 'recibo', titulo: 'Leasing financiero (NIIF 16)', texto: 'No sale efectivo hoy: se reconoce un <b>activo por derecho de uso</b> y un <b>pasivo por arrendamiento</b>.' },
      { icono: 'calculadora', titulo: 'Compra al contado', texto: 'Sale efectivo (actividad de inversión) y entra un activo no corriente que se <b>deprecia</b> cada año. La depreciación es gasto, pero no saca efectivo.' }
    ]
  },
  {
    type: 'choice', prompt: 'Con un leasing financiero, ¿qué reconoce la empresa según la NIIF 16?',
    options: [{ text: 'Un activo por derecho de uso y un pasivo por arrendamiento' }, { text: 'Solo un gasto de alquiler cada mes' }, { text: 'Nada, hasta terminar de pagar' }],
    answer: 0, pista: 'La empresa controla el bien y se compromete a pagar cuotas.',
    explain: 'El arrendatario reconoce el derecho de uso (activo) y la obligación de pagar las cuotas (pasivo).'
  },
  {
    type: 'choice',
    escena: { personaje: 'cafe', nombre: 'Rosa · gerente de una cafetería', texto: 'Compramos una cafetera industrial de S/ 60,000 con un préstamo bancario de largo plazo.' },
    prompt: '¿Qué pasó con el endeudamiento (pasivo ÷ activo)?',
    options: FC.ANALISIS, answer: AUMENTO,
    pista: 'Suben el activo y el pasivo en el mismo monto, pero el pasivo es la parte de arriba de la división.',
    explain: 'La deuda crece proporcionalmente más que el activo: el endeudamiento sube.'
  },
  {
    type: 'choice',
    escena: { personaje: 'usuarios', nombre: 'Socios de la empresa', texto: 'En lugar de pedir un préstamo, aportamos S/ 50,000 de capital.' },
    prompt: '¿Qué pasó con el endeudamiento (pasivo ÷ activo)?',
    options: FC.ANALISIS, answer: DISMINUYO,
    explain: 'El activo sube y el pasivo no cambia: cada sol de activo depende menos de la deuda.'
  },
  {
    type: 'match', prompt: 'Une cada forma de financiar con lo que aparece en el estado de situación financiera',
    pairs: [
      ['Préstamo bancario', 'Obligación financiera (pasivo)'],
      ['Aporte de socios', 'Capital social (patrimonio)'],
      ['Leasing financiero', 'Derecho de uso y pasivo por arrendamiento'],
      ['Compra al contado', 'Menos efectivo y más activo fijo']
    ],
    explain: 'Elegir cómo financiar cambia la liquidez, el endeudamiento y la utilidad (por los intereses).'
  },
  {
    type: 'tf', statement: 'La depreciación de una máquina reduce la utilidad, pero no saca efectivo de la caja.',
    answer: true, explain: 'El efectivo salió cuando se compró la máquina; la depreciación reparte ese costo en los años de uso.'
  }
] };

FC.CONTENIDO.n3l2 = { ejercicios: [
  {
    type: 'teoria', titulo: 'Flujos de efectivo y la NIIF 18',
    intro: 'El reto te preguntará dónde se presenta cada movimiento. Recuerda las tres actividades del flujo de efectivo y las categorías del estado de resultados.',
    puntos: [
      { icono: 'ciclo', titulo: 'Operación', texto: 'Cobros a clientes, pagos a proveedores y al personal: el día a día del negocio.' },
      { icono: 'calculadora', titulo: 'Inversión', texto: 'Compra o venta de maquinaria, equipos e intangibles.' },
      { icono: 'banco', titulo: 'Financiación', texto: 'Préstamos, <b>aportes de socios</b>, dividendos pagados y, con la NIIF 18, los <b>intereses pagados</b> (empresas no financieras).' },
      { icono: 'recibo', titulo: 'Estado de resultados (NIIF 18)', texto: 'Categorías de <b>operación</b>, inversión y financiación. Subtotales: resultado operativo y resultado antes de financiación e impuestos.' },
      { icono: 'reloj', titulo: 'Pagos anticipados', texto: 'Lo pagado por un servicio que aún no recibes es un <b>activo</b>; se vuelve gasto cuando lo usas.' }
    ]
  },
  {
    type: 'clasificar', prompt: '¿En qué actividad del flujo de efectivo va cada movimiento?',
    grupos: ['Operación', 'Inversión', 'Financiación'],
    items: [
      { text: 'Cobro a clientes', grupo: 0 }, { text: 'Pago a proveedores', grupo: 0 },
      { text: 'Compra de una cafetera industrial', grupo: 1 },
      { text: 'Préstamo bancario recibido', grupo: 2 }, { text: 'Aporte de los socios', grupo: 2 }, { text: 'Dividendos pagados', grupo: 2 }
    ],
    pista: 'Operación = el día a día; inversión = activos de largo plazo; financiación = bancos y dueños.',
    explain: 'Los movimientos con bancos y dueños son de financiación; los activos de largo plazo, de inversión.'
  },
  {
    type: 'choice', prompt: 'Según la NIC 7 modificada por la NIIF 18, ¿dónde se presentan los intereses que una empresa comercial paga al banco?',
    options: [{ text: 'Actividades de financiación' }, { text: 'Actividades de operación' }, { text: 'Actividades de inversión' }],
    answer: 0, explain: 'Para empresas no financieras, los intereses pagados se clasifican en financiación.'
  },
  {
    type: 'choice', prompt: 'Una multa que paga una empresa comercial, ¿en qué categoría del estado de resultados (NIIF 18) se presenta?',
    options: [{ text: 'Operación' }, { text: 'Inversión' }, { text: 'Financiación' }],
    answer: 0, pista: '¿Es un rendimiento de inversiones o un costo de una deuda?',
    explain: 'No es un rendimiento de inversiones ni un costo de deuda: va en la categoría de operación.'
  },
  {
    type: 'choice', prompt: '¿Qué subtotal de la NIIF 18 aparece justo antes de los gastos de financiación?',
    options: [{ text: 'Resultado antes de financiación e impuestos' }, { text: 'Resultado operativo' }, { text: 'Ganancia bruta' }],
    answer: 0, explain: 'Primero va el resultado operativo, luego la categoría de inversión y después el resultado antes de financiación e impuestos.'
  },
  {
    type: 'choice', prompt: 'Pagas hoy un servicio de ciberseguridad por 2 años. La parte que corresponde al próximo año, ¿cómo se registra hoy?',
    options: [{ text: 'Como activo: servicios pagados por anticipado' }, { text: 'Como gasto de este año' }, { text: 'Como pasivo' }],
    answer: 0, pista: '¿Ya recibiste el servicio del próximo año?',
    explain: 'Lo pagado por un servicio que aún no se recibe es un activo; se convierte en gasto cuando se usa (devengo).'
  }
] };

FC.CONTENIDO.n3ex = { ejercicios: [
  {
    type: 'choice', prompt: 'Si los socios aportan capital en efectivo, ¿en qué actividad del flujo de efectivo se presenta?',
    options: [{ text: 'Actividades de financiación' }, { text: 'Actividades de operación' }, { text: 'Actividades de inversión' }],
    answer: 0, explain: 'Los aportes de los dueños y los préstamos son actividades de financiación.'
  },
  {
    type: 'choice', prompt: 'La compra al contado de una máquina, ¿en qué actividad del flujo de efectivo se presenta?',
    options: [{ text: 'Actividades de inversión' }, { text: 'Actividades de operación' }, { text: 'Actividades de financiación' }],
    answer: 0, explain: 'Comprar activos de largo plazo es una actividad de inversión.'
  },
  {
    type: 'choice',
    escena: { personaje: 'cafe', nombre: 'Rosa · gerente de una cafetería', texto: 'Tomamos la cafetera en leasing financiero: no pagamos nada hoy.' },
    prompt: '¿Qué pasó con el pasivo total?',
    options: FC.ANALISIS, answer: AUMENTO,
    explain: 'Se reconoce un pasivo por arrendamiento (y un activo por derecho de uso).'
  },
  {
    type: 'choice',
    escena: { personaje: 'cafe', nombre: 'Rosa · gerente de una cafetería', texto: 'Decidimos no comprar la cafetera nueva este año.' },
    prompt: '¿Qué pasó con el endeudamiento proyectado?',
    options: FC.ANALISIS, answer: NO_CAMBIO,
    explain: 'Sin compra ni financiamiento nuevo, el endeudamiento queda igual.'
  },
  {
    type: 'tf', statement: 'Un aporte de capital de los socios genera gastos por intereses.',
    answer: false, explain: 'El aporte es patrimonio: no genera intereses. Los socios esperan dividendos, que no son gasto.'
  },
  {
    type: 'fill', prompt: 'Completa la frase', sentence: 'Con un leasing financiero se reconoce un activo por derecho de ___.',
    options: ['uso', 'cobro', 'propiedad'], answer: 0,
    explain: 'NIIF 16: activo por derecho de uso y pasivo por arrendamiento.'
  }
] };
