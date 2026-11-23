/* =========================================================
   RUTA DEL FINANCIAL CHALLENGE
   Niveles 1 a 4: lecciones cortas enfocadas en los casos (teoría + práctica + mini-casos).
   Niveles 5 a 7: casos de una sola empresa con decisiones ramificadas;
   solo se abren con el desbloqueo del master.
   ========================================================= */
window.FC = window.FC || {};
FC.CONTENIDO = FC.CONTENIDO || {};

FC.NIVELES = [
  {
    n: 1, tipo: 'lecciones', color: 'verde', icono: 'capas',
    titulo: 'Leer los estados financieros',
    descripcion: 'Los cuatro estados, la ecuación contable y por qué la utilidad no es lo mismo que el efectivo.',
    lecciones: [
      { id: 'n1l1', titulo: 'Los cuatro estados financieros', icono: 'libro' },
      { id: 'n1l2', titulo: 'La ecuación contable', icono: 'balanza' },
      { id: 'n1ex', titulo: 'Examen del nivel 1', icono: 'insignia', examen: true }
    ]
  },
  {
    n: 2, tipo: 'lecciones', color: 'azul', icono: 'ciclo',
    titulo: 'Capital de trabajo',
    descripcion: 'Compras y ventas al contado o al crédito, descuentos, factoring, inventario y periodo de cobro.',
    lecciones: [
      { id: 'n2l1', titulo: 'Compras y ventas: ¿contado o crédito?', icono: 'recibo' },
      { id: 'n2l2', titulo: 'Cobrar más rápido', icono: 'reloj' },
      { id: 'n2ex', titulo: 'Examen del nivel 2', icono: 'insignia', examen: true }
    ]
  },
  {
    n: 3, tipo: 'lecciones', color: 'morado', icono: 'banco',
    titulo: 'Financiar e invertir',
    descripcion: 'Préstamo, aporte o leasing (NIIF 16), flujos de efectivo (NIC 7) y categorías de la NIIF 18.',
    lecciones: [
      { id: 'n3l1', titulo: '¿Cómo financiar una inversión?', icono: 'calculadora' },
      { id: 'n3l2', titulo: 'Flujos de efectivo y la NIIF 18', icono: 'gota' },
      { id: 'n3ex', titulo: 'Examen del nivel 3', icono: 'insignia', examen: true }
    ]
  },
  {
    n: 4, tipo: 'lecciones', color: 'naranja', icono: 'medidor',
    titulo: 'Indicadores y cierre del año',
    descripcion: 'Liquidez, endeudamiento y ROE (los que dan puntos en el reto) y qué hacer con la utilidad.',
    lecciones: [
      { id: 'n4l1', titulo: 'Los indicadores que cuentan', icono: 'tendencia' },
      { id: 'n4l2', titulo: 'Cierre: ¿qué hacer con la utilidad?', icono: 'regalo' },
      { id: 'n4ex', titulo: 'Examen del nivel 4', icono: 'insignia', examen: true }
    ]
  },
  {
    n: 5, tipo: 'guiado', color: 'morado', icono: 'pizarra', etapa: 'Clase guiada',
    titulo: 'Clase guiada con el docente',
    descripcion: 'El docente resuelve en pantalla un caso de Nike y explica cómo funcionan las decisiones, el comodín, las vidas y el puntaje. Sin vidas ni puntaje.',
    subniveles: [
      { id: 'g1', caso: 'g1', titulo: '5.1 - Cómo funciona un caso', icono: 'play' },
      { id: 'g2', caso: 'g2', titulo: '5.2 - Las decisiones cambian los estados', icono: 'barras' },
      { id: 'g3', caso: 'g3', titulo: '5.3 - El comodín', icono: 'comodin' },
      { id: 'g4', caso: 'g4', titulo: '5.4 - Vidas y puntaje', icono: 'insignia' }
    ]
  },
  {
    n: 6, tipo: 'caso', color: 'certus', icono: 'cafe', caso: 'c6', etapa: 'Competencia',
    titulo: 'Starbucks',
    descripcion: 'Un año al frente de las finanzas de una tienda: compras de café, ventas a empresas, una máquina de espresso, un proveedor riesgoso y el cierre.'
  },
  {
    n: 7, tipo: 'caso', color: 'certus', icono: 'moda', caso: 'c7', etapa: 'Final',
    titulo: 'Zara',
    descripcion: 'La gran final: una tienda con venta online en plena crisis de liquidez. Refinanciar, protegerse, crecer y cerrar el año.'
  }
];

FC.VIDAS_COMPETENCIA = 10;

FC.leccionPorId = id => {
  for (const nv of FC.NIVELES) for (const l of nv.lecciones || []) if (l.id === id) return { leccion: l, nivel: nv };
  return null;
};
