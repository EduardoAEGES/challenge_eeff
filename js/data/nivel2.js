/* =========================================================
   NIVEL 2 — Capital de trabajo
   Compras y ventas al contado o al crédito, descuentos, factoring,
   inventario y periodo de cobro. (AUMENTO, DISMINUYO y NO_CAMBIO
   se definen en nivel1.js.)
   ========================================================= */
window.FC = window.FC || {};
FC.CONTENIDO = FC.CONTENIDO || {};

FC.CONTENIDO.n2l1 = { ejercicios: [
  {
    type: 'teoria', titulo: 'Compras y ventas: ¿contado o crédito?',
    intro: 'En los dos casos del reto decidirás cómo comprar a los proveedores y cómo vender a los clientes. La clave: <b>la utilidad se reconoce al vender, pero el efectivo se mueve al pagar o cobrar</b>.',
    puntos: [
      { icono: 'recibo', titulo: 'Vender al crédito', texto: 'Aumentan las <b>cuentas por cobrar</b>. El efectivo llega recién cuando el cliente paga.' },
      { icono: 'reloj', titulo: 'Comprar al crédito', texto: 'Aumentan las <b>cuentas por pagar</b>. El efectivo sale después: alivia la caja.' },
      { icono: 'tendencia', titulo: 'Contado con descuento', texto: 'El descuento baja el <b>costo de ventas</b> y sube la utilidad, pero pagas al instante: sale efectivo antes.' },
      { icono: 'alerta', titulo: 'Crédito con recargo', texto: 'Pagar más tarde alivia la caja, pero el recargo sube el costo y <b>baja la utilidad</b>.' }
    ]
  },
  {
    type: 'choice', prompt: 'Comprar al contado con 3 % de descuento, ¿qué efecto tiene en el estado de resultados?',
    options: [{ text: 'Baja el costo de ventas y sube la utilidad' }, { text: 'Suben los gastos financieros' }, { text: 'No tiene ningún efecto' }],
    answer: 0, pista: 'El descuento hace que la mercadería cueste menos.',
    explain: 'El descuento reduce el costo de lo vendido: la ganancia bruta y la utilidad suben.'
  },
  {
    type: 'tf', statement: 'Vender al crédito aumenta las cuentas por cobrar, aunque todavía no entre efectivo.',
    answer: true, explain: 'La venta se registra hoy; el efectivo entra cuando el cliente paga.'
  },
  {
    type: 'choice',
    escena: { personaje: 'cafe', nombre: 'Rosa · gerente de una cafetería', texto: 'Hoy compramos a crédito a 30 días. El proveedor nos ofrece pagar al contado con 3 % de descuento, y aceptamos.' },
    prompt: '¿Qué pasó con el efectivo proyectado al cierre del año?',
    options: FC.ANALISIS, answer: DISMINUYO,
    pista: 'Ahora pagas cada compra al instante, en vez de un mes después.',
    explain: 'Pagas antes: al cierre ya no queda un mes de compras pendiente de pago, así que hay menos efectivo, aunque la utilidad suba por el descuento.'
  },
  {
    type: 'choice',
    escena: { personaje: 'cafe', nombre: 'Rosa · gerente de una cafetería', texto: 'Cambiamos el crédito de 30 días por uno de 60 días, con un recargo de 2 % en cada compra.' },
    prompt: '¿Qué pasó con la utilidad neta?',
    options: FC.ANALISIS, answer: DISMINUYO,
    pista: 'El recargo hace que cada compra cueste más.',
    explain: 'El recargo sube el costo de ventas y baja la utilidad. A cambio, el efectivo al cierre aumenta porque pagas más tarde.'
  },
  {
    type: 'match', prompt: 'Une cada decisión con su efecto principal',
    pairs: [
      ['Comprar al contado con descuento', 'Más utilidad, menos efectivo'],
      ['Comprar a 60 días con recargo', 'Más efectivo, menos utilidad'],
      ['Vender al crédito', 'Suben las cuentas por cobrar'],
      ['Mantener el crédito de 30 días', 'Sin cambios']
    ],
    explain: 'Casi ninguna decisión mejora todo a la vez: el reto premia equilibrar utilidad, liquidez y endeudamiento.'
  }
] };

FC.CONTENIDO.n2l2 = { ejercicios: [
  {
    type: 'teoria', titulo: 'Cobrar más rápido',
    intro: 'Cuando falta efectivo, hay formas de conseguirlo rápido. Todas tienen un costo.',
    puntos: [
      { icono: 'reloj', titulo: 'Periodo promedio de cobro', texto: 'Cuentas por cobrar ÷ Ventas × 360. Cuántos días tardas, en promedio, en cobrar a tus clientes.' },
      { icono: 'recibo', titulo: 'Factoring', texto: 'Cedes tus facturas a una entidad financiera y recibes el efectivo hoy, a cambio de una <b>comisión</b> (gasto). Las cuentas por cobrar casi desaparecen.' },
      { icono: 'capas', titulo: 'Liquidar inventario', texto: 'Vender mercadería con descuento trae efectivo ya, pero si la vendes por menos de lo que costó, <b>registras una pérdida</b>.' }
    ]
  },
  {
    type: 'choice', prompt: 'Cuentas por cobrar S/ 30,000 y ventas anuales S/ 360,000. ¿Cuál es el periodo promedio de cobro?',
    options: [{ text: '30 días' }, { text: '12 días' }, { text: '120 días' }],
    answer: 0, pista: 'S/ 30,000 ÷ S/ 360,000 × 360.',
    explain: '30,000 ÷ 360,000 × 360 = 30 días.'
  },
  {
    type: 'choice', prompt: '¿Qué indicador de gestión mejora más con el factoring?',
    options: [{ text: 'Periodo promedio de cobro' }, { text: 'Margen bruto' }, { text: 'Rotación de inventarios' }],
    answer: 0, explain: 'Las cuentas por cobrar casi desaparecen, así que el periodo de cobro se acerca a cero.'
  },
  {
    type: 'choice',
    escena: { personaje: 'moda', nombre: 'Andrea · jefa de finanzas de una tienda de ropa', texto: 'Cedimos todas nuestras facturas por factoring con una comisión de 2.5 %.' },
    prompt: '¿Qué pasó con la utilidad neta?',
    options: FC.ANALISIS, answer: DISMINUYO,
    pista: 'La comisión del factoring, ¿es ingreso o gasto?',
    explain: 'La comisión es un gasto: baja la utilidad. A cambio, entra efectivo de inmediato.'
  },
  {
    type: 'choice',
    escena: { personaje: 'moda', nombre: 'Andrea · jefa de finanzas de una tienda de ropa', texto: 'Liquidamos ropa que nos costó S/ 45,000 y la vendimos al contado por S/ 40,000.' },
    prompt: '¿Qué pasó con la utilidad neta?',
    options: FC.ANALISIS, answer: DISMINUYO,
    explain: 'Vendimos por debajo del costo: hay una pérdida de S/ 5,000 que baja la utilidad, aunque entren S/ 40,000 de efectivo.'
  },
  {
    type: 'tf', statement: 'Si das a tus clientes 60 días de crédito en lugar de 30, el periodo promedio de cobro aumenta.',
    answer: true, explain: 'Cobras más tarde: suben las cuentas por cobrar y el periodo de cobro.'
  }
] };

FC.CONTENIDO.n2ex = { ejercicios: [
  {
    type: 'choice', prompt: 'Vendes S/ 20,000 al crédito a 30 días. ¿Qué cuenta aumenta hoy?',
    options: [{ text: 'Cuentas por cobrar' }, { text: 'Efectivo' }, { text: 'Cuentas por pagar' }],
    answer: 0, explain: 'El cliente te debe: aumentan las cuentas por cobrar.'
  },
  {
    type: 'choice',
    escena: { personaje: 'cafe', nombre: 'Rosa · gerente de una cafetería', texto: 'Seguimos comprando con el mismo crédito a 30 días de siempre.' },
    prompt: '¿Qué pasó con el efectivo proyectado al cierre?',
    options: FC.ANALISIS, answer: NO_CAMBIO,
    explain: 'Si la política no cambia, la proyección tampoco.'
  },
  {
    type: 'choice',
    escena: { personaje: 'cafe', nombre: 'Rosa · gerente de una cafetería', texto: 'Pasamos de comprar a 30 días a comprar a 60 días, con recargo de 2 %.' },
    prompt: '¿Qué pasó con el efectivo proyectado al cierre?',
    options: FC.ANALISIS, answer: AUMENTO,
    explain: 'Al cierre quedan dos meses de compras por pagar en vez de uno: hay más efectivo en caja.'
  },
  {
    type: 'choice', prompt: 'Cuentas por cobrar S/ 45,000 y ventas anuales S/ 540,000. ¿Periodo promedio de cobro?',
    options: [{ text: '30 días' }, { text: '45 días' }, { text: '12 días' }],
    answer: 0, explain: '45,000 ÷ 540,000 × 360 = 30 días.'
  },
  {
    type: 'tf', statement: 'Liquidar inventario por debajo de su costo aumenta el efectivo, pero baja la utilidad.',
    answer: true, explain: 'Entra efectivo por la venta, pero la diferencia con el costo es una pérdida.'
  },
  {
    type: 'fill', prompt: 'Completa la frase', sentence: 'El factoring trae efectivo hoy a cambio de una ___.',
    options: ['comisión', 'reserva', 'depreciación'], answer: 0,
    explain: 'La comisión del factoring es un gasto financiero.'
  }
] };
