/* =========================================================
   DATOS — cuentas, progreso, habilitación y resultados.
   Modo «nube»: funciones de Supabase (supabase/financial-challenge.sql).
   Modo «local» (?local=1): las mismas operaciones guardadas en este
   navegador, para probar o usar el reto en una sola computadora.
   ========================================================= */
window.FC = window.FC || {};

FC.Datos = (() => {
  const cfg = FC.CONFIG || {};
  const forzarLocal = new URLSearchParams(location.search).has('local');
  const modo = !forzarLocal && cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY ? 'nube' : 'local';

  const MENSAJES = {
    USUARIO_INVALIDO: 'El usuario debe tener al menos 3 caracteres: letras, números, punto, guion o guion bajo, sin espacios.',
    CLAVE_CORTA: 'La contraseña debe tener al menos 4 caracteres.',
    NOMBRE_CORTO: 'Escribe tu nombre completo.',
    USUARIO_EXISTE: 'Ese usuario ya existe. Elige otro.',
    CREDENCIALES: 'Usuario o contraseña incorrectos.',
    NO_HABILITADO: 'El facilitador aún no te habilitó este nivel.',
    MASTER: 'Clave master incorrecta.',
    SIN_ESQUEMA: 'La base de datos del reto aún no está configurada. El facilitador debe ejecutar supabase/financial-challenge.sql en Supabase.',
    RED: 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.'
  };
  const error = codigo => Object.assign(new Error(MENSAJES[codigo] || codigo), { codigo });

  // ---------- Nube ----------
  async function rpc(fn, args) {
    let r;
    try {
      r = await fetch(`${cfg.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: cfg.SUPABASE_ANON_KEY, Authorization: `Bearer ${cfg.SUPABASE_ANON_KEY}` },
        body: JSON.stringify(args)
      });
    } catch { throw error('RED'); }
    const texto = await r.text();
    if (!r.ok) {
      let msg = texto;
      try { const j = JSON.parse(texto); msg = j.message || texto; if (j.code === 'PGRST202' || j.code === '42P01') msg = 'SIN_ESQUEMA'; } catch { /* */ }
      if (r.status === 404) msg = 'SIN_ESQUEMA';
      throw error(msg);
    }
    return texto ? JSON.parse(texto) : null;
  }

  // ---------- Local (misma lógica que el SQL) ----------
  const L_KEY = 'fc-db-local';
  // Modo local: solo se guarda una huella PBKDF2 de la clave master (nunca la clave).
  const MASTER_PBKDF2 = '0a06409e27409cbbfac00952975fb801a2f2015c59f605b98bc284c8a99c5d66';
  const leer = () => { try { return JSON.parse(localStorage.getItem(L_KEY)) || { participantes: [], resultados: [] }; } catch { return { participantes: [], resultados: [] }; } };
  const escribir = db => { try { localStorage.setItem(L_KEY, JSON.stringify(db)); } catch { /* */ } };
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
  const json = (db, p) => ({
    id: p.id, usuario: p.usuario, nombre: p.nombre, condicion: p.condicion, progreso: p.progreso, habilitado: p.habilitado.slice(),
    resultados: Object.fromEntries(db.resultados.filter(r => r.participante_id === p.id).map(r => [String(r.nivel), { puntaje: r.puntaje, segundos: r.segundos, vidas: r.vidas }]))
  });
  const buscar = (db, usuario, clave) => {
    const p = db.participantes.find(x => x.usuario === String(usuario).trim().toLowerCase() && x.clave === clave);
    if (!p) throw error('CREDENCIALES');
    return p;
  };
  const ordenar = (a, b) => b.puntaje - a.puntaje || a.segundos - b.segundos;
  async function exigirMaster(m) {
    const enc = new TextEncoder();
    const llave = await crypto.subtle.importKey('raw', enc.encode(String(m || '')), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode('fc-local-master-v1'), iterations: 150000, hash: 'SHA-256' }, llave, 256);
    const hex = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
    if (hex !== MASTER_PBKDF2) throw error('MASTER');
  }

  const local = {
    async fc_registrar({ p_usuario, p_clave, p_nombre, p_condicion }) {
      const db = leer();
      const u = String(p_usuario).trim().toLowerCase();
      if (u.length < 3 || !/^[a-z0-9._-]+$/.test(u)) throw error('USUARIO_INVALIDO');
      if ((p_clave || '').length < 4) throw error('CLAVE_CORTA');
      if ((p_nombre || '').trim().length < 5) throw error('NOMBRE_CORTO');
      if (db.participantes.some(x => x.usuario === u)) throw error('USUARIO_EXISTE');
      const p = { id: uuid(), usuario: u, clave: p_clave, nombre: p_nombre.trim(), condicion: p_condicion || 'Estudiante', progreso: {}, habilitado: [], creado: new Date().toISOString() };
      db.participantes.push(p); escribir(db);
      return json(db, p);
    },
    async fc_entrar({ p_usuario, p_clave }) { const db = leer(); return json(db, buscar(db, p_usuario, p_clave)); },
    async fc_guardar({ p_usuario, p_clave, p_progreso }) { const db = leer(); buscar(db, p_usuario, p_clave).progreso = p_progreso; escribir(db); },
    async fc_enviar_resultado({ p_usuario, p_clave, p_nivel, ...r }) {
      const db = leer(); const p = buscar(db, p_usuario, p_clave);
      if (!p.habilitado.includes(p_nivel)) throw error('NO_HABILITADO');
      if (db.resultados.some(x => x.participante_id === p.id && x.nivel === p_nivel)) return;
      db.resultados.push({ id: uuid(), participante_id: p.id, nivel: p_nivel, elecciones: r.p_elecciones, segundos: r.p_segundos, vidas: r.p_vidas, comodin: r.p_comodin, puntaje: r.p_puntaje, detalle: r.p_detalle, creado: new Date().toISOString() });
      escribir(db);
    },
    async fc_podio({ p_nivel }) {
      const db = leer();
      return db.resultados.filter(r => r.nivel === p_nivel).sort(ordenar).slice(0, 3)
        .map(r => ({ nombre: db.participantes.find(p => p.id === r.participante_id)?.nombre || '—', puntaje: r.puntaje, segundos: r.segundos }));
    },
    async fc_admin_listar({ p_master }) { await exigirMaster(p_master); const db = leer(); return db.participantes.map(p => ({ ...json(db, p), clave: p.clave, creado: p.creado })); },
    async fc_admin_habilitar({ p_master, p_ids, p_nivel, p_valor }) {
      await exigirMaster(p_master); const db = leer();
      for (const p of db.participantes) if (p_ids.includes(p.id)) { p.habilitado = p.habilitado.filter(n => n !== p_nivel); if (p_valor) p.habilitado.push(p_nivel); }
      escribir(db);
    },
    async fc_admin_ranking({ p_master, p_nivel }) {
      await exigirMaster(p_master); const db = leer();
      return db.resultados.filter(r => r.nivel === p_nivel).sort(ordenar).map(r => {
        const p = db.participantes.find(x => x.id === r.participante_id) || {};
        return { id: r.id, participante_id: p.id, nombre: p.nombre, usuario: p.usuario, condicion: p.condicion, puntaje: r.puntaje, segundos: r.segundos, vidas: r.vidas, comodin: r.comodin, elecciones: r.elecciones, creado: r.creado };
      });
    },
    async fc_admin_borrar_resultado({ p_master, p_id }) { await exigirMaster(p_master); const db = leer(); db.resultados = db.resultados.filter(r => r.id !== p_id); escribir(db); },
    async fc_admin_borrar_participante({ p_master, p_id }) {
      await exigirMaster(p_master); const db = leer();
      db.participantes = db.participantes.filter(p => p.id !== p_id); db.resultados = db.resultados.filter(r => r.participante_id !== p_id); escribir(db);
    }
  };

  const llamar = (fn, args) => (modo === 'nube' ? rpc(fn, args) : local[fn](args));

  return {
    modo,
    registrar: (usuario, clave, nombre, condicion) => llamar('fc_registrar', { p_usuario: usuario, p_clave: clave, p_nombre: nombre, p_condicion: condicion }),
    entrar: (usuario, clave) => llamar('fc_entrar', { p_usuario: usuario, p_clave: clave }),
    guardar: (usuario, clave, progreso) => llamar('fc_guardar', { p_usuario: usuario, p_clave: clave, p_progreso: progreso }),
    enviarResultado: (usuario, clave, r) => llamar('fc_enviar_resultado', {
      p_usuario: usuario, p_clave: clave, p_nivel: r.nivel, p_elecciones: r.elecciones, p_segundos: r.segundos,
      p_vidas: r.vidas, p_comodin: r.comodin, p_puntaje: r.puntaje, p_detalle: r.detalle || {}
    }),
    podio: nivel => llamar('fc_podio', { p_nivel: nivel }),
    admin: {
      listar: master => llamar('fc_admin_listar', { p_master: master }),
      habilitar: (master, ids, nivel, valor) => llamar('fc_admin_habilitar', { p_master: master, p_ids: ids, p_nivel: nivel, p_valor: valor }),
      ranking: (master, nivel) => llamar('fc_admin_ranking', { p_master: master, p_nivel: nivel }),
      borrarResultado: (master, id) => llamar('fc_admin_borrar_resultado', { p_master: master, p_id: id }),
      borrarParticipante: (master, id) => llamar('fc_admin_borrar_participante', { p_master: master, p_id: id })
    }
  };
})();
