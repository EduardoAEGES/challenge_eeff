/* =========================================================
   DIÁLOGO — confirmaciones con el estilo de la app
   FC.confirmar({ icono, titulo, texto, items, aceptar, cancelar, tono, cabecera })
   devuelve una promesa que se resuelve en true (aceptar) o false.
   ========================================================= */
window.FC = window.FC || {};

FC.confirmar = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let abierto = null;

  return function confirmar(o = {}) {
    if (abierto) abierto(false);
    const tono = o.tono || 'certus'; // certus | rojo | dorado
    const raiz = document.createElement('div');
    raiz.className = `dlg dlg-${tono}`;
    raiz.innerHTML = `
      <div class="dlg-fondo" data-r="0"></div>
      <div class="dlg-caja" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t">
        <div class="dlg-cab">
          ${o.cabecera ? `<span class="dlg-etiqueta">${esc(o.cabecera)}</span>` : ''}
          <div class="dlg-icono">${o.icono || FC.ico?.('pregunta') || '?'}</div>
          <h2 id="dlg-t">${esc(o.titulo || '¿Continuar?')}</h2>
          ${o.texto ? `<p>${esc(o.texto)}</p>` : ''}
        </div>
        ${o.items?.length ? `<ul class="dlg-items">${o.items.map(([ic, t, d]) => `
          <li><span class="dlg-item-ic">${ic}</span><div><b>${esc(t)}</b>${d ? `<small>${esc(d)}</small>` : ''}</div></li>`).join('')}</ul>` : ''}
        ${o.nota ? `<p class="dlg-nota">${esc(o.nota)}</p>` : ''}
        <div class="dlg-botones">
          <button type="button" class="btn btn-blanco" data-r="0">${esc(o.cancelar || 'Cancelar')}</button>
          <button type="button" class="btn ${tono === 'rojo' ? 'btn-rojo' : tono === 'dorado' ? 'btn-dorado' : 'btn-certus'}" data-r="1">${esc(o.aceptar || 'Aceptar')}</button>
        </div>
      </div>`;
    document.body.appendChild(raiz);
    const previo = document.activeElement;
    raiz.querySelector('[data-r="1"]').focus();

    return new Promise(resolver => {
      const fin = v => {
        if (!raiz.isConnected) return;
        abierto = null;
        document.removeEventListener('keydown', teclas, true);
        raiz.classList.add('dlg-saliendo');
        setTimeout(() => raiz.remove(), 160);
        previo?.focus?.();
        resolver(v);
      };
      const teclas = e => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fin(false); }
        else if (e.key === 'Tab') { // mantener el foco dentro del diálogo
          const bs = [...raiz.querySelectorAll('button')];
          const i = bs.indexOf(document.activeElement);
          e.preventDefault(); bs[(i + (e.shiftKey ? -1 : 1) + bs.length) % bs.length].focus();
        } else if (e.key === 'Enter' && document.activeElement?.closest('.dlg') !== raiz) { e.preventDefault(); }
        else e.stopPropagation();
      };
      document.addEventListener('keydown', teclas, true);
      raiz.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (b) fin(b.dataset.r === '1'); });
      abierto = fin;
    });
  };
})();
