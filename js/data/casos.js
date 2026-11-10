/* =========================================================
   CASOS RAMIFICADOS — niveles 5 (preliminar), 6 (semifinal) y 7 (final)
   Cada caso es un año de una sola empresa. Los nodos pueden ser:
     escena    → narración, se continúa
     decision  → opciones con efectos contables; cada una lleva a un nodo distinto
     analisis  → «¿qué pasó con X en tu proyección?»; la respuesta correcta se
                 calcula comparando la proyección antes y después de la última decisión
     pregunta  → pregunta conceptual con respuesta fija
     fin       → cierre del caso
   No hay vuelta atrás: el camino elegido define las preguntas siguientes.
   ========================================================= */
window.FC = window.FC || {};

// ---------- Ayudantes de asientos ----------
FC.efectos = (() => {
  function financiar(ctx, forma, monto, motivo) {
    if (forma === 'prestamo') {
      ctx.asiento(`Préstamo bancario de largo plazo para ${motivo}`, [
        { c: 'caja', d: monto, fl: 'financiamiento', con: 'Préstamos bancarios recibidos' }, { c: 'obligLP', h: monto }]);
    } else if (forma === 'aporte') {
      ctx.asiento(`Aporte de capital de los socios para ${motivo}`, [
        { c: 'caja', d: monto, fl: 'financiamiento', con: 'Aportes de capital' }, { c: 'capital', h: monto, ecp: 'aporte' }]);
    } else if (forma === 'pagare') {
      const interes = Math.round(monto * ctx.P.tasaCP);
      ctx.asiento(`Pagaré bancario a 1 año para ${motivo}`, [
        { c: 'caja', d: monto, fl: 'financiamiento', con: 'Préstamos de corto plazo recibidos' }, { c: 'obligCP', h: monto }]);
      ctx.asiento('Intereses devengados del pagaré (se pagan al vencimiento)', [{ c: 'financieros', d: interes }, { c: 'obligCP', h: interes }]);
      ctx.emp.intCP += interes;
    }
  }

  function adquirir(ctx, { nombre, cuenta = 'ime', costo, tasa = 0.10, forma = 'contado' }) {
    if (forma === 'leasing') {
      ctx.asiento(`Contrato de leasing financiero: ${nombre} (NIIF 16)`, [{ c: 'derechoUso', d: costo }, { c: 'arrendamiento', h: costo }]);
      ctx.agregarActivo({ nombre, cuenta: 'derechoUso', costo, tasa: 0.20 });
      return;
    }
    if (forma === 'prestamo' || forma === 'aporte') financiar(ctx, forma, costo, nombre.toLowerCase());
    ctx.asiento(`Adquisición de ${nombre.toLowerCase()}`, [
      { c: cuenta, d: costo },
      { c: 'caja', h: costo, fl: 'inversion', con: cuenta === 'intangibles' ? 'Compra de intangibles' : 'Compra de propiedades, planta y equipo' }]);
    ctx.agregarActivo({ nombre, cuenta, costo, tasa });
  }

  const gasto = (ctx, cuenta, monto, glosa, con = 'Pago de servicios') =>
    ctx.asiento(glosa, [{ c: cuenta, d: monto }, { c: 'caja', h: monto, fl: 'operacion', con }]);

  const dividendos = pct => ctx => {
    const monto = Math.max(0, Math.round(ctx.utilidadNeta * pct));
    ctx.asiento(`Pago de dividendos (${Math.round(pct * 100)}% de la utilidad)`, [
      { c: 'resultados', d: monto, ecp: 'dividendos' }, { c: 'caja', h: monto, fl: 'financiamiento', con: 'Dividendos pagados' }]);
  };
  const reservaLegal = ctx => {
    const monto = Math.max(0, Math.round(ctx.utilidadNeta * 0.10));
    ctx.asiento('Constitución de la reserva legal (10% de la utilidad)', [
      { c: 'resultados', d: monto, ecp: 'reserva' }, { c: 'reservas', h: monto, ecp: 'reserva' }]);
  };
  const capitalizar = ctx => {
    const monto = Math.max(0, ctx.utilidadNeta);
    ctx.asiento('Capitalización de la utilidad del ejercicio', [
      { c: 'resultados', d: monto, ecp: 'capitalizacion' }, { c: 'capital', h: monto, ecp: 'capitalizacion' }]);
  };
  const prepagar = monto => ctx => {
    const m = Math.min(monto, ctx.s.obligLP);
    ctx.asiento('Prepago extraordinario del préstamo bancario', [
      { c: 'obligLP', d: m }, { c: 'caja', h: m, fl: 'financiamiento', con: 'Amortización de préstamos bancarios' }]);
  };
  const liquidarInventario = (costo, precio) => ctx => {
    ctx.asiento('Liquidación de inventario con descuento (al contado)', [{ c: 'caja', d: precio, fl: 'operacion', con: 'Cobranza a clientes' }, { c: 'ventas', h: precio }]);
    ctx.asiento('Costo del inventario liquidado', [{ c: 'costoVentas', d: costo }, { c: 'mercaderias', h: costo }]);
  };

  return { financiar, adquirir, gasto, dividendos, reservaLegal, capitalizar, prepagar, liquidarInventario };
})();

FC.CASOS = (() => {
  const E = FC.efectos;
  const empresa = (params, saldos, activos, politicas = { ventas: 'credito30', compras: 'credito30' }) => ({
    params,
    saldos: { ...SALDOS_VACIOS, ...saldos },
    activos,
    politicas,
    recurrentes: [],
    programados: [],
    intCP: 0
  });
  const AVISO = 'Caso ficticio con fines educativos. Las cifras y situaciones no corresponden a la empresa real.';

  // =====================================================================
  // NIVEL 5 · CLASE GUIADA (Nike) — subniveles que el docente resuelve en clase
  // =====================================================================
  const nike = () => empresa(
    { ventasBase: 320000, costoPct: 0.65, personal: 50000, servicios: 30000 },
    { caja: 30000, cxc: 25000, mercaderias: 52000, ime: 120000, depAcum: 30000, cxp: 17000, obligLP: 60000, capital: 90000, resultados: 30000 },
    [{ nombre: 'Local y equipos', cuenta: 'ime', costo: 120000, tasa: 0.10, acum: 30000 }]
  );
  const HANNAH = { personaje: '👩🏼‍💼', nombre: 'Hannah Clarke · gerente de la tienda' };
  const MARK = { personaje: '🧑🏻‍💼', nombre: 'Mark Evans · contador' };

  const g1 = {
    titulo: 'Nike · Cómo funciona un caso', aviso: AVISO, empresa: nike(), inicio: 'e1',
    nodos: {
      e1: { tipo: 'explicacion', titulo: '¿Cómo funciona un caso?', intro: 'En los niveles de competencia diriges las finanzas de una empresa durante un año. Así se juega:',
        puntos: [
          { icono: '🎬', titulo: 'Escenas', texto: 'Los personajes te cuentan lo que pasa en la empresa.' },
          { icono: '🧭', titulo: 'Decisiones', texto: 'Eliges una opción y es <b>definitiva</b>: no hay vuelta atrás y cada decisión abre preguntas distintas.' },
          { icono: '🔍', titulo: 'Análisis', texto: 'Después de decidir, respondes qué pasó con un indicador. La respuesta correcta suma puntos.' },
          { icono: '📈', titulo: 'Proyección', texto: 'A la derecha ves cómo quedarían los estados financieros al cierre del año.' }
        ], sig: 'n1' },
      n1: { tipo: 'decision', ...HANNAH, texto: 'Nuestro proveedor de zapatillas nos ofrece tres condiciones de pago para las compras del año.',
        pregunta: '¿Qué política de compras eliges?',
        opciones: [
          { texto: 'Contado con 3 % de descuento', efecto: { politicas: { compras: 'contado' } }, consecuencia: 'El costo de ventas baja, pero pagas cada compra al instante.', sig: 'n2' },
          { texto: 'Mantener el crédito a 30 días', efecto: { politicas: { compras: 'credito30' } }, consecuencia: 'Sin cambios: pagas un mes después.', sig: 'n2' },
          { texto: 'Crédito a 60 días con recargo de 2 %', efecto: { politicas: { compras: 'credito60' } }, consecuencia: 'Pagas más tarde, pero cada compra cuesta 2 % más.', sig: 'n2' }
        ] },
      n2: { tipo: 'analisis', metrica: 'caja', pregunta: 'Con tu política de compras, ¿qué pasó con el efectivo proyectado al cierre?', sig: 'e2' },
      e2: { tipo: 'explicacion', titulo: '¿Qué acaba de pasar?', intro: 'Fíjate en el panel de proyección:',
        puntos: [
          { icono: '🙈', titulo: 'Antes de responder', texto: 'Mientras analizas una decisión, la proyección muestra el escenario anterior. Así tienes que razonar y no solo mirar el número.' },
          { icono: '✅', titulo: 'Después de responder', texto: 'La proyección se actualiza y ves el efecto real de tu decisión.' },
          { icono: '📊', titulo: 'Ver estados financieros', texto: 'Con ese botón ves los 4 estados, los indicadores y el libro diario en cualquier momento.' }
        ], sig: 'fin' },
      fin: { tipo: 'fin' }
    }
  };

  const g2 = {
    titulo: 'Nike · Las decisiones cambian los estados', aviso: AVISO, empresa: nike(), inicio: 'n1',
    nodos: {
      n1: { tipo: 'decision', ...MARK, texto: 'Queremos una vitrina digital interactiva de S/ 40,000 que atraería S/ 30,000 más de ventas al año.',
        pregunta: '¿Cómo la adquirimos?',
        opciones: [
          { texto: 'Al contado', efecto: { asientos: ctx => E.adquirir(ctx, { nombre: 'Vitrina digital', costo: 40000 }), recurrente: { ventasMerc: 30000, nota: 'Más visitas a la tienda' } }, consecuencia: 'Sale efectivo en actividades de inversión.', sig: 'n2' },
          { texto: 'Leasing financiero', efecto: { asientos: ctx => E.adquirir(ctx, { nombre: 'Vitrina digital', costo: 40000, forma: 'leasing' }), recurrente: { ventasMerc: 30000, nota: 'Más visitas a la tienda' } }, consecuencia: 'No sale efectivo hoy: aparece un activo por derecho de uso y un pasivo.', sig: 'n2' }
        ] },
      n2: { tipo: 'pregunta', ...MARK, pregunta: 'En el estado de situación financiera, ¿dónde se ve la vitrina?',
        opciones: ['En el activo no corriente', 'En el activo corriente', 'En el estado de resultados'], correcta: 0,
        explicacion: 'Se usará varios años: es activo no corriente y se deprecia cada año.', sig: 'e1' },
      e1: { tipo: 'explicacion', titulo: 'Una decisión, cuatro estados', intro: 'Abre «Ver estados financieros» y compara las columnas de inicio y cierre:',
        puntos: [
          { icono: '🏛️', titulo: 'Situación financiera', texto: 'Cambian el activo no corriente y, según la forma de pago, la caja o el pasivo.' },
          { icono: '🧾', titulo: 'Resultados', texto: 'Aparecen la depreciación y, si hay leasing, los intereses.' },
          { icono: '💧', titulo: 'Flujos de efectivo', texto: 'Al contado hay salida de inversión; con leasing, pagos de financiación.' },
          { icono: '🏦', titulo: 'Cambios en el patrimonio', texto: 'La utilidad del año termina en resultados acumulados.' }
        ], sig: 'n3' },
      n3: { tipo: 'decision', ...HANNAH, texto: 'Fin del año. Los socios preguntan qué haremos con la utilidad.',
        pregunta: '¿Qué propones?',
        opciones: [
          { texto: 'Repartir 50 % en dividendos', efecto: { postCierre: E.dividendos(0.5) }, consecuencia: 'Los socios reciben efectivo.', sig: 'n4' },
          { texto: 'Constituir la reserva legal (10 %)', efecto: { postCierre: E.reservaLegal }, consecuencia: 'El patrimonio no cambia; cambia su composición.', sig: 'n4' }
        ] },
      n4: { tipo: 'analisis', metrica: 'caja', pregunta: '¿Qué pasó con el efectivo al cierre con tu decisión sobre la utilidad?', sig: 'fin' },
      fin: { tipo: 'fin' }
    }
  };

  const g3 = {
    titulo: 'Nike · El comodín', aviso: AVISO, empresa: nike(), inicio: 'e1',
    nodos: {
      e1: { tipo: 'explicacion', titulo: 'El comodín 🃏', intro: 'En cada nivel tienes <b>un solo comodín</b>. Úsalo en la pregunta que más te cueste.',
        puntos: [
          { icono: '❓', titulo: 'En una pregunta', texto: 'Marca la respuesta correcta. Tú solo confirmas.' },
          { icono: '🧭', titulo: 'En una decisión', texto: 'Te muestra cómo quedarían la caja, la utilidad y los indicadores con cada opción, para que elijas mejor.' },
          { icono: '1️⃣', titulo: 'Una vez por nivel', texto: 'Si lo gastas al inicio, ya no lo tendrás después. ¡Piensa bien cuándo usarlo!' }
        ], sig: 'n1' },
      n1: { tipo: 'pregunta', ...MARK, pregunta: 'Ejemplo: presiona el botón 🃏 Comodín. ¿Qué subtotal de la NIIF 18 aparece justo antes de los gastos de financiación?',
        opciones: ['Resultado operativo', 'Resultado antes de financiación e impuestos', 'Ganancia bruta'], correcta: 1,
        explicacion: 'Primero va el resultado operativo, luego la categoría de inversión y después el resultado antes de financiación e impuestos.', sig: 'n2' },
      n2: { tipo: 'decision', ...HANNAH, texto: 'Ejemplo: usa el comodín en esta decisión para ver la simulación de cada opción.',
        pregunta: 'Un cliente corporativo pide comprar a 60 días. ¿Qué haces?',
        opciones: [
          { texto: 'Aceptar el crédito a 60 días', efecto: { politicas: { ventas: 'credito60' } }, consecuencia: 'Vendes más; cobras después.', sig: 'fin' },
          { texto: 'Aceptar con factoring', efecto: { politicas: { ventas: 'factoring' } }, consecuencia: 'Vendes más y cobras pronto, con un costo financiero.', sig: 'fin' },
          { texto: 'Mantener el crédito a 30 días', efecto: {}, consecuencia: 'Sin cambios.', sig: 'fin' }
        ] },
      fin: { tipo: 'fin' }
    }
  };

  const g4 = {
    titulo: 'Nike · Vidas y puntaje', aviso: AVISO, empresa: nike(), inicio: 'e1',
    nodos: {
      e1: { tipo: 'explicacion', titulo: 'Las vidas ❤️', intro: 'En la competencia tienes <b>10 vidas</b>, que se renuevan en cada nivel.',
        puntos: [
          { icono: '❌', titulo: 'Pierdes una vida', texto: 'Cuando respondes mal un análisis o una pregunta, o tomas una decisión de alto riesgo.' },
          { icono: '💔', titulo: 'Si llegas a cero', texto: 'El caso termina ahí y se califica con lo que alcanzaste a decidir.' },
          { icono: '❤️', titulo: 'Vidas que te quedan', texto: 'Cada vida que conserves al final suma <b>20 puntos</b>.' }
        ], sig: 'e2' },
      e2: { tipo: 'explicacion', titulo: 'El puntaje 🏆', intro: 'Lo importante es el resultado; el tiempo solo desempata.',
        puntos: [
          { icono: '💰', titulo: 'Resultado financiero', texto: 'Utilidad neta del año ÷ 100.' },
          { icono: '🚦', titulo: 'Indicadores al cierre', texto: 'Liquidez entre 1.5 y 3: +150 · endeudamiento hasta 50 %: +100 · ROE de 10 % o más: +100. Hay descuentos si la liquidez baja de 1, la deuda pasa de 70 % o terminas en sobregiro.' },
          { icono: '🎯', titulo: 'Análisis', texto: '+50 por cada respuesta correcta.' },
          { icono: '⏱️', titulo: 'Empates', texto: 'Si dos personas tienen el mismo puntaje, gana quien terminó en menos tiempo.' }
        ], sig: 'n1' },
      n1: { tipo: 'pregunta', ...MARK, pregunta: 'Dos participantes terminan con 620 puntos. Uno tardó 14 minutos y el otro 11. ¿Quién queda primero?',
        opciones: ['El que tardó 11 minutos', 'El que tardó 14 minutos', 'Quedan empatados'], correcta: 0,
        explicacion: 'El puntaje decide el puesto; el tiempo solo rompe los empates.', sig: 'n2' },
      n2: { tipo: 'decision', ...HANNAH, texto: 'Un importador ofrece zapatillas sin factura a mitad de precio.',
        pregunta: '¿Qué haces? (En la competencia, una decisión de alto riesgo te quita una vida.)',
        opciones: [
          { texto: 'Rechazar: comprar solo con comprobante y a proveedores formales', puntos: 30, efecto: {}, consecuencia: 'Decisión responsable: cumples con las normas tributarias.', sig: 'fin' },
          { texto: 'Aceptar: es más barato', error: true, puntos: -50, efecto: { asientos: ctx => E.gasto(ctx, 'otrosGastos', 15000, 'Multa tributaria por compras sin comprobante', 'Pago por contingencias') },
            porque: 'Comprar sin comprobante es una infracción tributaria: no hay crédito ni sustento del gasto y genera multas.', consecuencia: 'La fiscalización detectó la compra: multa de S/ 15,000.', sig: 'fin' }
        ] },
      fin: { tipo: 'fin' }
    }
  };

  // =====================================================================
  // NIVEL 6 · COMPETENCIA (Starbucks)
  // =====================================================================
  const EMMA = { personaje: '👩🏻‍💼', nombre: 'Emma Collins · gerente de tienda' };
  const DANIEL = { personaje: '🧑🏻‍💼', nombre: 'Daniel Moore · contador' };
  const OLIVER = { personaje: '👨🏻‍💼', nombre: 'Oliver Grant · ejecutivo del banco' };
  const SOFIA = { personaje: '👩🏽‍🌾', nombre: 'Sofia Bianchi · proveedora de café' };

  const c6 = {
    titulo: 'Starbucks', aviso: AVISO,
    empresa: empresa(
      { ventasBase: 320000, costoPct: 0.65, personal: 50000, servicios: 30000 },
      { caja: 30000, cxc: 25000, mercaderias: 52000, ime: 120000, depAcum: 30000, cxp: 17000, obligLP: 60000, capital: 90000, resultados: 30000 },
      [{ nombre: 'Local y equipos', cuenta: 'ime', costo: 120000, tasa: 0.10, acum: 30000 }]
    ),
    inicio: 'n1',
    nodos: {
      n1: { tipo: 'escena', ...EMMA, titulo: 'Un año al frente de las finanzas',
        texto: 'Diriges las finanzas de una tienda Starbucks durante un año. Vendemos café, bebidas y alimentos, y también atendemos pedidos de empresas. Cada decisión es definitiva.', sig: 'n2' },
      n2: { tipo: 'decision', ...SOFIA, texto: 'Te propongo tres condiciones para las compras de café y alimentos del año, unos S/ 200,000.',
        pregunta: '¿Qué política de compras eliges?',
        opciones: [
          { texto: 'Contado con 3 % de descuento', efecto: { politicas: { compras: 'contado' } }, consecuencia: 'El costo baja, pero pagas al instante.', sig: 'n3' },
          { texto: 'Mantener el crédito a 30 días', efecto: { politicas: { compras: 'credito30' } }, consecuencia: 'Sin cambios.', sig: 'n3' },
          { texto: 'Crédito a 60 días con recargo de 2 %', efecto: { politicas: { compras: 'credito60' } }, consecuencia: 'Alivias la caja, pero cada compra cuesta más.', sig: 'n3' }
        ] },
      n3: { tipo: 'analisis', metrica: 'caja', pregunta: 'Con tu política de compras, ¿qué pasó con el efectivo proyectado al cierre?', sig: 'n4' },
      n4: { tipo: 'pregunta', ...DANIEL, pregunta: 'Comprar al contado con descuento, ¿qué efecto tiene en el estado de resultados?',
        opciones: ['Baja el costo de ventas y sube la utilidad', 'Suben los gastos financieros', 'No tiene ningún efecto'], correcta: 0,
        explicacion: 'El descuento reduce el costo de lo vendido: la ganancia bruta y la utilidad suben.', sig: 'n5' },
      n5: { tipo: 'decision', personaje: '🧔🏻', nombre: 'Ryan Hughes · comprador corporativo',
        texto: 'Queremos abastecer de café a nuestras oficinas. Si nos venden a 60 días, sus ventas subirían cerca de 10 %.',
        pregunta: '¿Qué le respondes?',
        opciones: [
          { texto: 'Aceptar el crédito a 60 días', efecto: { politicas: { ventas: 'credito60' } }, consecuencia: 'Más ventas y más cuentas por cobrar.', sig: 'n6' },
          { texto: 'Aceptar a 60 días y ceder las facturas por factoring (2.5 %)', efecto: { politicas: { ventas: 'factoring' } }, consecuencia: 'Más ventas y cobro casi inmediato, con un costo financiero.', sig: 'n6' },
          { texto: 'Mantener el crédito a 30 días', efecto: {}, consecuencia: 'El cliente busca otro proveedor.', sig: 'n6' }
        ] },
      n6: { tipo: 'analisis', metrica: 'liquidez', pregunta: 'Con tu respuesta al cliente, ¿qué pasó con la liquidez corriente proyectada?', sig: 'n7' },
      n7: { tipo: 'pregunta', ...DANIEL, pregunta: '¿Qué indicador mide cuántos días tardas, en promedio, en cobrar a tus clientes?',
        opciones: ['Periodo promedio de cobro', 'Prueba ácida', 'Margen neto'], correcta: 0,
        explicacion: 'Periodo promedio de cobro = cuentas por cobrar ÷ ventas × 360.', sig: 'n8' },
      n8: { tipo: 'decision', ...EMMA, texto: 'Una máquina de espresso de alta capacidad de S/ 60,000 reduciría en S/ 18,000 al año el mantenimiento y el desperdicio.',
        pregunta: '¿Cómo la adquieres?',
        opciones: [
          { texto: 'Al contado', efecto: { asientos: ctx => E.adquirir(ctx, { nombre: 'Máquina de espresso', costo: 60000 }), recurrente: { servicios: -18000, nota: 'Ahorro en mantenimiento y desperdicio' } }, consecuencia: 'Inversión fuerte de caja; el ahorro llega cada año.', sig: 'n9' },
          { texto: 'Leasing financiero', efecto: { asientos: ctx => E.adquirir(ctx, { nombre: 'Máquina de espresso', costo: 60000, forma: 'leasing' }), recurrente: { servicios: -18000, nota: 'Ahorro en mantenimiento y desperdicio' } }, consecuencia: 'Sin salida inicial; aparece un pasivo por arrendamiento.', sig: 'n9' },
          { texto: 'Préstamo bancario de largo plazo', efecto: { asientos: ctx => E.adquirir(ctx, { nombre: 'Máquina de espresso', costo: 60000, forma: 'prestamo' }), recurrente: { servicios: -18000, nota: 'Ahorro en mantenimiento y desperdicio' } }, consecuencia: 'Más deuda e intereses.', sig: 'n9' },
          { texto: 'No comprarla', efecto: {}, consecuencia: 'Sigues con los costos actuales.', sig: 'n9' }
        ] },
      n9: { tipo: 'analisis', metrica: 'endeudamiento', pregunta: 'Después de tu decisión sobre la máquina, ¿qué pasó con el endeudamiento proyectado?', sig: 'n10' },
      n10: { tipo: 'pregunta', ...OLIVER, pregunta: 'Con un leasing financiero, ¿qué reconoce la empresa según la NIIF 16?',
        opciones: ['Un activo por derecho de uso y un pasivo por arrendamiento', 'Solo un gasto de alquiler cada mes', 'Nada hasta terminar de pagar'], correcta: 0,
        explicacion: 'El arrendatario reconoce el derecho de uso (activo) y la obligación de pagar las cuotas (pasivo).', sig: 'n11' },
      n11: { tipo: 'decision', ...SOFIA, texto: 'Un distribuidor informal ofrece vasos y tapas sin certificación sanitaria, 40 % más baratos.',
        pregunta: '¿Qué haces?',
        opciones: [
          { texto: 'Rechazar y comprar solo insumos certificados', puntos: 30, efecto: {}, consecuencia: 'Proteges a los clientes y la marca.', sig: 'n12' },
          { texto: 'Aceptar para ahorrar costos', error: true, puntos: -50, efecto: { asientos: ctx => E.gasto(ctx, 'otrosGastos', 15000, 'Multa sanitaria e insumos decomisados', 'Pago por contingencias') },
            porque: 'Usar insumos sin certificación sanitaria pone en riesgo a los clientes y genera multas: el ahorro no compensa el riesgo.', consecuencia: 'Una inspección sanitaria detectó los insumos: multa de S/ 15,000.', sig: 'n12' }
        ] },
      n12: { tipo: 'pregunta', ...DANIEL, pregunta: 'Una multa de una empresa comercial, ¿en qué categoría del estado de resultados (NIIF 18) se presenta?',
        opciones: ['Operación', 'Inversión', 'Financiación'], correcta: 0,
        explicacion: 'No es un rendimiento de inversiones ni un costo de deuda: va en la categoría de operación.', sig: 'n13' },
      n13: { tipo: 'decision', ...EMMA, texto: 'Cerramos el año. Los socios esperan tu propuesta.',
        pregunta: '¿Qué hacemos con la utilidad?',
        opciones: [
          { texto: 'Repartir 50 % como dividendos', efecto: { postCierre: E.dividendos(0.5) }, consecuencia: 'Los socios reciben efectivo.', sig: 'n14' },
          { texto: 'Reserva legal del 10 % y reinvertir el resto', efecto: { postCierre: E.reservaLegal }, consecuencia: 'Fortaleces el patrimonio sin mover caja.', sig: 'n14' },
          { texto: 'Capitalizar toda la utilidad', efecto: { postCierre: E.capitalizar }, consecuencia: 'El capital crece.', sig: 'n14' }
        ] },
      n14: { tipo: 'pregunta', ...DANIEL, pregunta: '¿Qué estado financiero muestra el reparto de dividendos, la reserva legal o la capitalización?',
        opciones: ['Estado de cambios en el patrimonio', 'Estado de resultados', 'Estado de situación financiera únicamente'], correcta: 0,
        explicacion: 'El estado de cambios en el patrimonio explica cada movimiento del capital, las reservas y los resultados acumulados.', sig: 'fin' },
      fin: { tipo: 'fin' }
    }
  };

  // =====================================================================
  // NIVEL 7 · FINAL (Zara)
  // =====================================================================
  const CLAIRE = { personaje: '👩🏼‍💼', nombre: 'Claire Dubois · directora general' };
  const LUCAS = { personaje: '👨🏼‍🔧', nombre: 'Lucas Weber · jefe de logística' };
  const NINA = { personaje: '👩🏻‍💻', nombre: 'Nina Park · jefa de tecnología' };

  const c7 = {
    titulo: 'Zara', aviso: AVISO,
    empresa: empresa(
      { ventasBase: 600000, costoPct: 0.62, personal: 110000, servicios: 40000 },
      { caja: 25000, cxc: 50000, mercaderias: 93000, ime: 200000, intangibles: 40000, depAcum: 60000, cxp: 31000, obligCP: 30000, obligLP: 120000, capital: 120000, resultados: 47000 },
      [
        { nombre: 'Tiendas y equipos', cuenta: 'ime', costo: 200000, tasa: 0.10, acum: 60000 },
        { nombre: 'Plataforma de e-commerce', cuenta: 'intangibles', costo: 40000, tasa: 0.20, acum: 0 }
      ]
    ),
    inicio: 'n1',
    nodos: {
      n1: { tipo: 'escena', ...CLAIRE, titulo: 'La gran final: crisis de liquidez',
        texto: 'Diriges las finanzas de una tienda Zara con venta online. Hoy vence un pagaré de S/ 30,000 y la caja apenas llega a S/ 25,000. Necesito que tomes el control este año.', sig: 'n2' },
      n2: { tipo: 'decision', ...OLIVER, texto: 'Podemos apoyarlos, pero deben elegir cómo enfrentar la falta de liquidez.',
        pregunta: '¿Cómo enfrentas la crisis?',
        opciones: [
          { texto: 'Préstamo de largo plazo por S/ 50,000 al 12 %', efecto: { asientos: ctx => E.financiar(ctx, 'prestamo', 50000, 'capital de trabajo') }, consecuencia: 'Ganas tiempo, pero aumenta la deuda.', sig: 'n3' },
          { texto: 'Aporte de los socios por S/ 50,000', efecto: { asientos: ctx => E.financiar(ctx, 'aporte', 50000, 'capital de trabajo') }, consecuencia: 'Fortaleces el patrimonio sin intereses.', sig: 'n3' },
          { texto: 'Factoring de toda la cartera (2.5 %)', efecto: { politicas: { ventas: 'factoring' } }, consecuencia: 'Conviertes las ventas en efectivo casi de inmediato.', sig: 'n3c' },
          { texto: 'Liquidar inventario: S/ 45,000 de ropa por S/ 40,000', efecto: { asientos: E.liquidarInventario(45000, 40000) }, consecuencia: 'Efectivo rápido, con pérdida en la venta.', sig: 'n3d' }
        ] },
      n3: { tipo: 'analisis', metrica: 'liquidez', pregunta: 'Con tu decisión, ¿qué pasó con la liquidez corriente proyectada?', sig: 'n4' },
      n3c: { tipo: 'pregunta', ...OLIVER, pregunta: '¿Qué indicador de gestión mejora más con el factoring?',
        opciones: ['Periodo promedio de cobro', 'Margen neto', 'Endeudamiento'], correcta: 0,
        explicacion: 'Las cuentas por cobrar casi desaparecen, así que el periodo de cobro se acerca a cero.', sig: 'n4' },
      n3d: { tipo: 'analisis', metrica: 'utilidad', pregunta: 'Al liquidar inventario con descuento, ¿qué pasó con la utilidad neta proyectada?', sig: 'n4' },
      n4: { tipo: 'pregunta', ...CLAIRE, pregunta: 'Si los socios aportan capital en efectivo, ¿en qué actividad del flujo de efectivo se presenta?',
        opciones: ['Actividades de financiación', 'Actividades de operación', 'Actividades de inversión'], correcta: 0,
        explicacion: 'Los aportes de los dueños y los préstamos son actividades de financiación.', sig: 'n5' },
      n5: { tipo: 'decision', ...NINA, texto: 'Detectamos intentos de ataque a la tienda online. Un ransomware podría paralizar las ventas.',
        pregunta: '¿Cómo proteges el negocio?',
        opciones: [
          { texto: 'Ciberseguridad integral prepagada por 2 años: S/ 20,000', puntos: 30, efecto: { asientos: ctx => ctx.asiento('Contrato de ciberseguridad por 2 años (mitad gasto, mitad anticipado)', [{ c: 'servicios', d: 10000 }, { c: 'anticipados', d: 10000 }, { c: 'caja', h: 20000, fl: 'operacion', con: 'Pago de servicios' }]) }, consecuencia: 'Proteges la tienda online. La mitad es gasto del año y la otra mitad, un pago anticipado.', sig: 'n6' },
          { texto: 'Solo un antivirus básico: S/ 3,000', error: true, efecto: { asientos: ctx => { E.gasto(ctx, 'servicios', 3000, 'Licencia de antivirus'); E.gasto(ctx, 'otrosGastos', 25000, 'Ataque de ransomware: recuperación y ventas perdidas', 'Pago por contingencias'); } },
            porque: 'Un antivirus no protege una tienda online de un ransomware: la protección quedó corta para el riesgo.', consecuencia: 'El ataque llegó: pérdidas por S/ 25,000.', sig: 'n6' },
          { texto: 'No invertir por ahora', error: true, puntos: -30, efecto: { asientos: ctx => E.gasto(ctx, 'otrosGastos', 40000, 'Ataque de ransomware: recuperación, multas y ventas perdidas', 'Pago por contingencias') },
            porque: 'Ignorar un riesgo ya detectado es una decisión de alto riesgo: la pérdida fue mayor que el costo de protegerse.', consecuencia: 'El ataque llegó: pérdidas por S/ 40,000.', sig: 'n6' }
        ] },
      n6: { tipo: 'pregunta', ...NINA, pregunta: 'La parte del contrato que corresponde al próximo año, ¿cómo se registra hoy?',
        opciones: ['Como activo: servicios pagados por anticipado', 'Como gasto de este año', 'Como pasivo'], correcta: 0,
        explicacion: 'Lo pagado por un servicio que aún no se recibe es un activo; se convierte en gasto cuando se usa (devengo).', sig: 'n7' },
      n7: { tipo: 'decision', ...CLAIRE, texto: 'Un marketplace internacional nos invita a vender a empresas de la región.',
        pregunta: '¿Con qué política de ventas creces?',
        opciones: [
          { texto: 'Crédito a 60 días a clientes corporativos (+10 % ventas)', efecto: { politicas: { ventas: 'credito60' } }, consecuencia: 'Más ventas y más cuentas por cobrar.', sig: 'n8' },
          { texto: 'Mantener el crédito a 30 días', efecto: { politicas: { ventas: 'credito30' } }, consecuencia: 'Conservas la política actual.', sig: 'n8' },
          { texto: 'Vender solo al contado (−5 % ventas)', efecto: { politicas: { ventas: 'contado' } }, consecuencia: 'Cobras al instante, pero pierdes clientes.', sig: 'n8' }
        ] },
      n8: { tipo: 'analisis', metrica: 'roe', pregunta: 'Con tu política de ventas, ¿qué pasó con el ROE proyectado?', sig: 'n9' },
      n9: { tipo: 'decision', ...LUCAS, texto: 'Los proveedores de la nueva colección ofrecen tres condiciones de pago.',
        pregunta: '¿Cómo compras la mercadería?',
        opciones: [
          { texto: 'Contado con 3 % de descuento', efecto: { politicas: { compras: 'contado' } }, consecuencia: 'Mejor margen, más presión sobre la caja.', sig: 'n10' },
          { texto: 'Crédito a 30 días', efecto: { politicas: { compras: 'credito30' } }, consecuencia: 'Condición estándar.', sig: 'n10' },
          { texto: 'Crédito a 60 días con recargo de 2 %', efecto: { politicas: { compras: 'credito60' } }, consecuencia: 'Alivio de caja con mayor costo.', sig: 'n10' }
        ] },
      n10: { tipo: 'analisis', metrica: 'caja', pregunta: 'Con tu política de compras, ¿qué pasó con el efectivo proyectado al cierre?', sig: 'n11' },
      n11: { tipo: 'pregunta', personaje: '🧑🏼‍💼', nombre: 'Ethan Brooks · auditor externo',
        pregunta: 'Según la NIC 7 modificada por la NIIF 18, ¿dónde se presentan los intereses que la empresa paga al banco?',
        opciones: ['Actividades de financiación', 'Actividades de operación', 'Actividades de inversión'], correcta: 0,
        explicacion: 'Para empresas no financieras, los intereses pagados se clasifican en financiación.', sig: 'n12' },
      n12: { tipo: 'decision', ...CLAIRE, texto: 'Cerramos un año difícil. Los socios, el banco y los proveedores miran nuestros estados financieros.',
        pregunta: '¿Cuál es tu decisión final?',
        opciones: [
          { texto: 'Repartir 30 % de la utilidad en dividendos', efecto: { postCierre: E.dividendos(0.3) }, consecuencia: 'Premias a los socios a costa de la caja.', sig: 'n13' },
          { texto: 'Reserva legal del 10 %', efecto: { postCierre: E.reservaLegal }, consecuencia: 'Fortaleces el patrimonio sin mover caja.', sig: 'n13' },
          { texto: 'Prepagar S/ 40,000 del préstamo bancario', efecto: { asientos: E.prepagar(40000) }, consecuencia: 'Menos deuda e intereses; menos caja.', sig: 'n13' },
          { texto: 'Capitalizar toda la utilidad', efecto: { postCierre: E.capitalizar }, consecuencia: 'Más capital para crecer.', sig: 'n13' }
        ] },
      n13: { tipo: 'analisis', metrica: 'endeudamiento', pregunta: 'Con tu decisión final, ¿qué pasó con el endeudamiento al cierre?', sig: 'fin' },
      fin: { tipo: 'fin' }
    }
  };

  return { g1, g2, g3, g4, c6, c7 };
})();
