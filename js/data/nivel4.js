/* =========================================================
   NIVEL 4 — Indicadores y cierre del año
   Liquidez, endeudamiento y ROE (los indicadores que dan o quitan
   puntos en el reto) y qué hacer con la utilidad.
   ========================================================= */
window.FC = window.FC || {};
FC.CONTENIDO = FC.CONTENIDO || {};

FC.CONTENIDO.n4l1 = { ejercicios: [
  {
    type: 'teoria', titulo: 'Los indicadores que cuentan en el reto',
    intro: 'Al terminar el caso, tu puntaje parte de la utilidad neta y suma o resta puntos según estos tres indicadores.',
    puntos: [
      { icono: 'gota', titulo: 'Liquidez corriente', texto: 'Activo corriente ÷ Pasivo corriente. Entre <b>1.5 y 3</b> es sano (suma puntos); menos de 1 es riesgoso (resta); más de 3 indica recursos ociosos.' },
      { icono: 'balanza', titulo: 'Endeudamiento', texto: 'Pasivo total ÷ Activo total. Hasta <b>50 %</b> es prudente (suma); más de 70 % es alto (resta).' },
      { icono: 'tendencia', titulo: 'ROE', texto: 'Utilidad neta ÷ Patrimonio. Lo que ganan los dueños por cada sol. <b>10 % o más</b> suma puntos; negativo resta.' },
      { icono: 'alerta', titulo: 'Sobregiro', texto: 'Terminar el año con la caja en negativo resta puntos. Cuida el efectivo, no solo la utilidad.' }
    ]
  },
  {
    type: 'choice', prompt: 'Activo corriente S/ 120,000 y pasivo corriente S/ 60,000. ¿Liquidez corriente?',
    options: [{ text: '2.0' }, { text: '0.5' }, { text: 'S/ 60,000' }],
    answer: 0, pista: 'Divide, no restes.', explain: 'S/ 120,000 ÷ S/ 60,000 = 2.0: está en el rango sano.'
  },
  {
    type: 'choice', prompt: 'Pasivo total S/ 70,000 y activo total S/ 100,000. ¿Endeudamiento?',
    options: [{ text: '70 %' }, { text: '30 %' }, { text: '143 %' }],
    answer: 0, explain: 'S/ 70,000 ÷ S/ 100,000 = 70 %: en el límite de lo alto.'
  },
  {
    type: 'choice', prompt: 'Utilidad neta S/ 12,000 y patrimonio S/ 80,000. ¿ROE?',
    options: [{ text: '15 %' }, { text: '12 %' }, { text: '6.7 %' }],
    answer: 0, explain: 'S/ 12,000 ÷ S/ 80,000 = 15 %: supera el 10 %.'
  },
  {
    type: 'choice',
    escena: { personaje: 'moda', nombre: 'Andrea · jefa de finanzas de una tienda de ropa', texto: 'Refinanciamos un pagaré de corto plazo y lo convertimos en un préstamo a 3 años.' },
    prompt: '¿Qué pasó con la liquidez corriente?',
    options: FC.ANALISIS, answer: AUMENTO,
    pista: '¿Qué le pasa al pasivo corriente?',
    explain: 'La deuda pasa de corriente a no corriente: baja el pasivo corriente y sube la liquidez.'
  },
  {
    type: 'choice',
    escena: { personaje: 'moda', nombre: 'Andrea · jefa de finanzas de una tienda de ropa', texto: 'Usamos S/ 40,000 de la caja para prepagar parte del préstamo bancario.' },
    prompt: '¿Qué pasó con el endeudamiento?',
    options: FC.ANALISIS, answer: DISMINUYO,
    explain: 'Bajan el pasivo y el activo en el mismo monto; como el pasivo es menor que el activo, el endeudamiento baja.'
  }
] };

FC.CONTENIDO.n4l2 = { ejercicios: [
  {
    type: 'teoria', titulo: 'Cierre del año: ¿qué hacer con la utilidad?',
    intro: 'La última decisión de los casos es qué hacer con la utilidad. Todas se ven en el <b>estado de cambios en el patrimonio</b>.',
    puntos: [
      { icono: 'regalo', titulo: 'Repartir dividendos', texto: 'Sale efectivo hacia los socios y baja el patrimonio.' },
      { icono: 'banco', titulo: 'Reserva legal', texto: 'Se separa el 10 % de la utilidad (hasta llegar al 20 % del capital). No sale efectivo y el patrimonio total no cambia: cambia su composición.' },
      { icono: 'capas', titulo: 'Capitalizar', texto: 'La utilidad pasa a capital social. Tampoco sale efectivo ni cambia el patrimonio total.' },
      { icono: 'tendencia', titulo: 'Prepagar deuda', texto: 'Sale efectivo y baja el pasivo: el endeudamiento mejora.' }
    ]
  },
  {
    type: 'choice',
    escena: { personaje: 'usuarios', nombre: 'Socios de la empresa', texto: 'Queremos repartir el 50 % de la utilidad en dividendos.' },
    prompt: '¿Qué pasó con el efectivo al cierre?',
    options: FC.ANALISIS, answer: DISMINUYO,
    explain: 'Los dividendos se pagan en efectivo: la caja baja.'
  },
  {
    type: 'choice',
    escena: { personaje: 'usuarios', nombre: 'Socios de la empresa', texto: 'Mejor constituimos la reserva legal del 10 %.' },
    prompt: '¿Qué pasó con el efectivo al cierre?',
    options: FC.ANALISIS, answer: NO_CAMBIO,
    explain: 'La reserva es un movimiento dentro del patrimonio: no sale efectivo.'
  },
  {
    type: 'choice',
    escena: { personaje: 'usuarios', nombre: 'Socios de la empresa', texto: 'Al final repartimos dividendos en efectivo.' },
    prompt: '¿Qué pasó con el endeudamiento (pasivo ÷ activo)?',
    options: FC.ANALISIS, answer: AUMENTO,
    pista: 'El pasivo queda igual, pero ¿qué pasa con el activo?',
    explain: 'Sale efectivo, así que el activo baja mientras el pasivo sigue igual: el endeudamiento sube.'
  },
  {
    type: 'tf', statement: 'Capitalizar la utilidad aumenta el patrimonio total de la empresa.',
    answer: false, explain: 'La utilidad ya era patrimonio (resultados acumulados); solo pasa a capital social. El total no cambia.'
  }
] };

FC.CONTENIDO.n4ex = { ejercicios: [
  {
    type: 'choice', prompt: '¿Qué liquidez corriente suma puntos en el reto por ser sana?',
    options: [{ text: 'Entre 1.5 y 3' }, { text: 'Menor a 1' }, { text: 'Mayor a 6' }],
    answer: 0, explain: 'Menos de 1 es riesgoso y mucho más de 3 indica recursos ociosos.'
  },
  {
    type: 'choice', prompt: 'Activo corriente S/ 90,000 y pasivo corriente S/ 100,000. ¿Cómo está la liquidez?',
    options: [{ text: '0.9: riesgosa, no alcanza para la deuda de corto plazo' }, { text: '1.1: sana' }, { text: '9.0: con recursos ociosos' }],
    answer: 0, explain: 'S/ 90,000 ÷ S/ 100,000 = 0.9: por cada sol de deuda de corto plazo hay solo S/ 0.90.'
  },
  {
    type: 'choice',
    escena: { personaje: 'cafe', nombre: 'Rosa · gerente de una cafetería', texto: 'Compramos una máquina al contado con el efectivo de la caja.' },
    prompt: '¿Qué pasó con la liquidez corriente?',
    options: FC.ANALISIS, answer: DISMINUYO,
    explain: 'Sale efectivo (activo corriente) y entra una máquina (activo no corriente): baja la liquidez.'
  },
  {
    type: 'choice',
    escena: { personaje: 'usuarios', nombre: 'Socios de la empresa', texto: 'Aportamos S/ 50,000 en efectivo.' },
    prompt: '¿Qué pasó con la liquidez corriente?',
    options: FC.ANALISIS, answer: AUMENTO,
    explain: 'Sube el efectivo (activo corriente) y el pasivo corriente no cambia.'
  },
  {
    type: 'choice',
    escena: { personaje: 'usuarios', nombre: 'Socios de la empresa', texto: 'Decidimos capitalizar toda la utilidad del año.' },
    prompt: '¿Qué pasó con el endeudamiento?',
    options: FC.ANALISIS, answer: NO_CAMBIO,
    explain: 'No cambian ni el activo ni el pasivo: solo se reordena el patrimonio.'
  },
  {
    type: 'tf', statement: 'Un ROE negativo significa que la empresa tuvo pérdida en el año.',
    answer: true, explain: 'Si la utilidad neta es negativa, el ROE también lo es (y en el reto resta puntos).'
  },
  {
    type: 'choice', prompt: 'Con la misma utilidad, ¿qué decisión hace que el ROE sea más alto?',
    options: [{ text: 'Financiar con préstamo en lugar de aporte' }, { text: 'Financiar con aporte de socios' }, { text: 'Ninguna: el ROE no depende del patrimonio' }],
    answer: 0, pista: 'ROE = Utilidad ÷ Patrimonio.',
    explain: 'Con préstamo el patrimonio es menor, así que cada sol de utilidad pesa más. Pero ojo: los intereses bajan la utilidad y el endeudamiento sube.'
  }
] };
