/* =========================================================
   CONFIGURACIÓN — conexión con Supabase (proyecto EduardoAEGES)
   Antes del evento, ejecuta una vez supabase/financial-challenge.sql
   en Supabase → SQL Editor → Run.
   La clave publishable es pública por diseño: la seguridad la dan las
   funciones del SQL. NUNCA pongas aquí la clave «service_role».
   Para probar sin internet en una sola computadora, abre la app con ?local=1
   ========================================================= */
window.FC = window.FC || {};

FC.CONFIG = {
  SUPABASE_URL: 'https://klmjmlhwuzhymrplemgw.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_DSS-WHn-WawxfYe0RWUHRg_odMjrb_b'
};
